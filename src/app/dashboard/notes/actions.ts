'use server'

import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { notifyGradesRecorded } from '@/lib/notifications'
import { logAction } from '@/lib/audit-log'
import { getDictionary } from '@/lib/i18n'

// Barème fixe (0-20) : max_score existe en base pour une éventuelle
// flexibilité future, mais rien dans l'appli ne permet aujourd'hui de le
// changer — donc validé contre cette constante partout où une note est
// saisie ou importée.
const MAX_SCORE = 20

async function assertTeacherAssigned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: string,
  teacherId: string,
  classId: string,
  subjectId: string
) {
  if (role !== 'teacher') return true
  const { data } = await supabase
    .from('teacher_subjects')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .maybeSingle()
  return !!data
}

export async function saveGrades(_prevState: unknown, formData: FormData) {
  const { school, schoolYear, role, teacherId, teacherName: actorName } = await getCurrentSchool()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.errors

  if (!schoolYear) return { error: t.noActiveSchoolYearSettings }

  const classId = formData.get('classId') as string
  const subjectId = formData.get('subjectId') as string
  const trimester = Number(formData.get('trimester'))
  const studentIds = formData.getAll('studentId') as string[]
  const gradeTypeIds = formData.getAll('gradeTypeId') as string[]

  if (!classId || !subjectId || !trimester) {
    return { error: t.classSubjectTrimesterRequired }
  }

  if (!(await assertTeacherAssigned(supabase, role, teacherId, classId, subjectId))) {
    return { error: t.notAssignedToClassSubject }
  }

  const [{ data: klass }, { data: subject }, { data: validStudents }, { data: validGradeTypes }] =
    await Promise.all([
      supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
      supabase.from('subjects').select('id, name').eq('id', subjectId).eq('school_id', school.id).maybeSingle(),
      supabase.from('students').select('id, first_name, last_name').eq('class_id', classId).eq('school_id', school.id),
      supabase.from('grade_types').select('id, name').eq('school_id', school.id).in('id', gradeTypeIds),
    ])

  if (!klass || !subject) return { error: t.classOrSubjectNotFound }

  const validStudentIds = new Set((validStudents ?? []).map((s) => s.id))
  const validGradeTypeIds = new Set((validGradeTypes ?? []).map((g) => g.id))
  const studentNameById = new Map((validStudents ?? []).map((s) => [s.id, `${s.first_name} ${s.last_name}`]))
  const gradeTypeNameById = new Map((validGradeTypes ?? []).map((g) => [g.id, g.name]))

  const rows: {
    school_id: string
    student_id: string
    class_id: string
    subject_id: string
    school_year_id: string
    grade_type_id: string
    trimester: number
    score: number
    max_score: number
  }[] = []

  const invalidEntries: string[] = []

  for (const studentId of studentIds) {
    if (!validStudentIds.has(studentId)) continue
    for (const gradeTypeId of gradeTypeIds) {
      if (!validGradeTypeIds.has(gradeTypeId)) continue
      const raw = formData.get(`score_${studentId}_${gradeTypeId}`) as string | null
      if (raw === null || raw === '') continue
      const score = Number(raw)
      if (Number.isNaN(score)) continue
      if (score < 0 || score > MAX_SCORE) {
        invalidEntries.push(`${studentNameById.get(studentId) ?? '—'} (${gradeTypeNameById.get(gradeTypeId) ?? '—'}) : ${raw}`)
        continue
      }
      rows.push({
        school_id: school.id,
        student_id: studentId,
        class_id: classId,
        subject_id: subjectId,
        school_year_id: schoolYear.id,
        grade_type_id: gradeTypeId,
        trimester,
        score,
        max_score: MAX_SCORE,
      })
    }
  }

  // Tout ou rien : si au moins une note est hors barème, on ne sauvegarde
  // rien plutôt que d'enregistrer partiellement — le formulaire garde la
  // saisie de l'enseignant, qui corrige et resoumet.
  if (invalidEntries.length > 0) {
    return {
      error: t.invalidScoreRangeTemplate.replace('{max}', String(MAX_SCORE)).replace('{list}', invalidEntries.slice(0, 5).join(', ')),
    }
  }

  if (rows.length === 0) return { error: t.noGradesToSave }

  // Rejeu d'une saisie mise en attente hors-ligne (src/lib/offline-queue.ts) :
  // __offlineSnapshot contient les valeurs vues à l'écran au moment de la
  // saisie. Si la valeur serveur actuelle diffère de ce snapshot, quelqu'un
  // d'autre a modifié cette note entre-temps — on écrase quand même
  // (dernier arrivé gagne) mais on trace le conflit dans le journal d'audit
  // plutôt que de fusionner ou de bloquer silencieusement.
  const offlineSnapshotRaw = formData.get('__offlineSnapshot') as string | null
  if (offlineSnapshotRaw) {
    try {
      const snapshot = JSON.parse(offlineSnapshotRaw) as Record<string, string>
      const studentIdsInRows = Array.from(new Set(rows.map((r) => r.student_id)))
      const { data: currentGrades } = await supabase
        .from('grades')
        .select('student_id, grade_type_id, score')
        .eq('subject_id', subjectId)
        .eq('school_year_id', schoolYear.id)
        .eq('trimester', trimester)
        .in('student_id', studentIdsInRows)

      const currentByKey = new Map((currentGrades ?? []).map((g) => [`${g.student_id}:${g.grade_type_id}`, g.score]))
      for (const row of rows) {
        const key = `${row.student_id}:${row.grade_type_id}`
        if (!(key in snapshot)) continue
        const current = currentByKey.get(key)
        const currentStr = current === null || current === undefined ? '' : String(current)
        if (currentStr !== snapshot[key]) {
          await logAction(
            supabase,
            school.id,
            actorName,
            'Conflit de synchronisation hors-ligne',
            `Note de ${studentNameById.get(row.student_id) ?? 'élève'} en ${subject.name} (${gradeTypeNameById.get(row.grade_type_id) ?? '—'}, trimestre ${trimester}) : valeur serveur "${currentStr || '—'}" remplacée par "${row.score}" saisie hors-ligne.`
          )
        }
      }
    } catch {
      // Snapshot corrompu/illisible : on ignore la détection de conflit
      // plutôt que de bloquer l'enregistrement.
    }
  }

  const { error } = await supabase
    .from('grades')
    .upsert(rows, { onConflict: 'student_id,subject_id,school_year_id,trimester,grade_type_id' })

  if (error) return { error: error.message }

  const entriesByStudent = new Map<string, { gradeTypeName: string; score: number; maxScore: number }[]>()
  for (const row of rows) {
    const list = entriesByStudent.get(row.student_id) ?? []
    list.push({
      gradeTypeName: gradeTypeNameById.get(row.grade_type_id) ?? '—',
      score: row.score,
      maxScore: row.max_score,
    })
    entriesByStudent.set(row.student_id, list)
  }
  after(async () => {
    await Promise.all(
      Array.from(entriesByStudent.entries()).map(([studentId, entries]) =>
        notifyGradesRecorded(supabase, studentId, studentNameById.get(studentId) ?? dict.dashboardHome.student, subject.name, entries)
      )
    )
  })

  revalidatePath('/dashboard/notes')
  revalidatePath('/dashboard/bulletins')
  return { success: true, count: rows.length }
}

interface ExcelGradeRow {
  Matricule?: string | number
  Nom?: string
  Prenom?: string
  [column: string]: string | number | undefined
}

export async function importGradesFromExcel(formData: FormData) {
  const { school, schoolYear, role, teacherId } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().errors

  if (!schoolYear) return { error: t.noActiveSchoolYearSettings }

  const classId = formData.get('classId') as string
  const subjectId = formData.get('subjectId') as string
  const trimester = Number(formData.get('trimester'))
  const file = formData.get('file') as File | null

  if (!classId || !subjectId || !trimester) return { error: t.classSubjectTrimesterRequired }
  if (!file) return { error: t.noFileProvided }

  if (!(await assertTeacherAssigned(supabase, role, teacherId, classId, subjectId))) {
    return { error: t.notAssignedToClassSubject }
  }

  const [{ data: klass }, { data: subject }, { data: students }, { data: gradeTypes }] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('subjects').select('id').eq('id', subjectId).eq('school_id', school.id).maybeSingle(),
    supabase.from('students').select('id, first_name, last_name, registration_number').eq('class_id', classId).eq('school_id', school.id).eq('status', 'active'),
    supabase.from('grade_types').select('id, name').eq('school_id', school.id),
  ])

  if (!klass || !subject) return { error: t.classOrSubjectNotFound }
  if (!gradeTypes || gradeTypes.length === 0) return { error: t.noGradeTypesConfiguredShort }

  const studentByRegistration = new Map((students ?? []).filter((s) => s.registration_number).map((s) => [s.registration_number!.trim().toLowerCase(), s.id]))
  const studentByFullName = new Map((students ?? []).map((s) => [`${s.first_name} ${s.last_name}`.trim().toLowerCase(), s.id]))
  const gradeTypeByName = new Map(gradeTypes.map((gt) => [gt.name.trim().toLowerCase(), gt.id]))

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const excelRows = XLSX.utils.sheet_to_json<ExcelGradeRow>(sheet)

  const rows: {
    school_id: string
    student_id: string
    class_id: string
    subject_id: string
    school_year_id: string
    grade_type_id: string
    trimester: number
    score: number
    max_score: number
  }[] = []
  let unmatchedStudents = 0
  let invalidScores = 0

  for (const row of excelRows) {
    let studentId: string | undefined
    if (row.Matricule) studentId = studentByRegistration.get(String(row.Matricule).trim().toLowerCase())
    if (!studentId && row.Prenom && row.Nom) {
      studentId = studentByFullName.get(`${row.Prenom} ${row.Nom}`.trim().toLowerCase())
    }
    if (!studentId) {
      unmatchedStudents++
      continue
    }

    for (const [column, value] of Object.entries(row)) {
      if (column === 'Matricule' || column === 'Nom' || column === 'Prenom') continue
      const gradeTypeId = gradeTypeByName.get(column.trim().toLowerCase())
      if (!gradeTypeId || value === undefined || value === '') continue
      const score = Number(value)
      if (Number.isNaN(score) || score < 0 || score > MAX_SCORE) {
        invalidScores++
        continue
      }
      rows.push({
        school_id: school.id,
        student_id: studentId,
        class_id: classId,
        subject_id: subjectId,
        school_year_id: schoolYear.id,
        grade_type_id: gradeTypeId,
        trimester,
        score,
        max_score: MAX_SCORE,
      })
    }
  }

  if (rows.length === 0) {
    return { error: t.noValidGradesFoundTemplate.replace('{names}', gradeTypes.map((g) => g.name).join(', ')) }
  }

  const { error } = await supabase
    .from('grades')
    .upsert(rows, { onConflict: 'student_id,subject_id,school_year_id,trimester,grade_type_id' })

  if (error) return { error: error.message }

  // Pas de notification email ici (contrairement à saveGrades) : un import
  // Excel porte souvent sur un lot de notes déjà communiquées autrement
  // (ou une reprise de données historiques), pas un événement "nouvelle
  // note" à signaler en temps réel à chaque parent.

  revalidatePath('/dashboard/notes')
  revalidatePath('/dashboard/bulletins')
  return { success: true, count: rows.length, unmatchedStudents, invalidScores }
}
