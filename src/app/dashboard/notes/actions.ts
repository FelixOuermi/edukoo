'use server'

import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

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
  const { school, schoolYear, role, teacherId } = await getCurrentSchool()
  const supabase = await createClient()

  if (!schoolYear) return { error: 'Aucune année scolaire active. Configurez-la dans Paramètres.' }

  const classId = formData.get('classId') as string
  const subjectId = formData.get('subjectId') as string
  const trimester = Number(formData.get('trimester'))
  const studentIds = formData.getAll('studentId') as string[]
  const gradeTypeIds = formData.getAll('gradeTypeId') as string[]

  if (!classId || !subjectId || !trimester) {
    return { error: 'Classe, matière et trimestre sont requis.' }
  }

  if (!(await assertTeacherAssigned(supabase, role, teacherId, classId, subjectId))) {
    return { error: "Vous n'êtes pas affecté à cette classe/matière." }
  }

  const [{ data: klass }, { data: subject }, { data: validStudents }, { data: validGradeTypes }] =
    await Promise.all([
      supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
      supabase.from('subjects').select('id').eq('id', subjectId).eq('school_id', school.id).maybeSingle(),
      supabase.from('students').select('id').eq('class_id', classId).eq('school_id', school.id),
      supabase.from('grade_types').select('id').eq('school_id', school.id).in('id', gradeTypeIds),
    ])

  if (!klass || !subject) return { error: 'Classe ou matière introuvable.' }

  const validStudentIds = new Set((validStudents ?? []).map((s) => s.id))
  const validGradeTypeIds = new Set((validGradeTypes ?? []).map((g) => g.id))

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

  for (const studentId of studentIds) {
    if (!validStudentIds.has(studentId)) continue
    for (const gradeTypeId of gradeTypeIds) {
      if (!validGradeTypeIds.has(gradeTypeId)) continue
      const raw = formData.get(`score_${studentId}_${gradeTypeId}`) as string | null
      if (raw === null || raw === '') continue
      const score = Number(raw)
      if (Number.isNaN(score)) continue
      rows.push({
        school_id: school.id,
        student_id: studentId,
        class_id: classId,
        subject_id: subjectId,
        school_year_id: schoolYear.id,
        grade_type_id: gradeTypeId,
        trimester,
        score,
        max_score: 20,
      })
    }
  }

  if (rows.length === 0) return { error: 'Aucune note à enregistrer.' }

  const { error } = await supabase
    .from('grades')
    .upsert(rows, { onConflict: 'student_id,subject_id,school_year_id,trimester,grade_type_id' })

  if (error) return { error: error.message }

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

  if (!schoolYear) return { error: 'Aucune année scolaire active. Configurez-la dans Paramètres.' }

  const classId = formData.get('classId') as string
  const subjectId = formData.get('subjectId') as string
  const trimester = Number(formData.get('trimester'))
  const file = formData.get('file') as File | null

  if (!classId || !subjectId || !trimester) return { error: 'Classe, matière et trimestre sont requis.' }
  if (!file) return { error: 'Aucun fichier fourni.' }

  if (!(await assertTeacherAssigned(supabase, role, teacherId, classId, subjectId))) {
    return { error: "Vous n'êtes pas affecté à cette classe/matière." }
  }

  const [{ data: klass }, { data: subject }, { data: students }, { data: gradeTypes }] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('subjects').select('id').eq('id', subjectId).eq('school_id', school.id).maybeSingle(),
    supabase.from('students').select('id, first_name, last_name, registration_number').eq('class_id', classId).eq('school_id', school.id).eq('status', 'active'),
    supabase.from('grade_types').select('id, name').eq('school_id', school.id),
  ])

  if (!klass || !subject) return { error: 'Classe ou matière introuvable.' }
  if (!gradeTypes || gradeTypes.length === 0) return { error: 'Aucun type de note configuré.' }

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
      if (Number.isNaN(score)) {
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
        max_score: 20,
      })
    }
  }

  if (rows.length === 0) {
    return { error: `Aucune note valide trouvée. Colonnes attendues : Matricule (ou Nom+Prenom), puis une colonne par type de note (${gradeTypes.map((g) => g.name).join(', ')}).` }
  }

  const { error } = await supabase
    .from('grades')
    .upsert(rows, { onConflict: 'student_id,subject_id,school_year_id,trimester,grade_type_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/notes')
  revalidatePath('/dashboard/bulletins')
  return { success: true, count: rows.length, unmatchedStudents, invalidScores }
}
