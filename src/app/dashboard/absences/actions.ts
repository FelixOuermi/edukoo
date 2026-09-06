'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { logAction } from '@/lib/audit-log'
import { notifyAbsenceRecorded, notifyAbsenceThreshold } from '@/lib/notifications'
import { getDictionary } from '@/lib/i18n'

export async function saveAbsences(_prevState: unknown, formData: FormData) {
  const { school, role, teacherId, teacherName: actorName } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().errors

  const classId = formData.get('classId') as string
  const date = formData.get('date') as string
  const studentIds = formData.getAll('studentId') as string[]

  if (!classId || !date) return { error: t.classAndDateRequired }

  if (role !== 'director') {
    const { data: assigned } = await supabase
      .from('teacher_subjects')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .maybeSingle()
    if (!assigned) return { error: t.notAssignedToClass }
  }

  const [{ data: klass }, { data: validStudents }] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('students').select('id, first_name, last_name').eq('class_id', classId).eq('school_id', school.id),
  ])

  if (!klass) return { error: t.classNotFound }
  const validStudentIds = new Set((validStudents ?? []).map((s) => s.id))
  const studentNameById = new Map((validStudents ?? []).map((s) => [s.id, `${s.first_name} ${s.last_name}`]))

  // Rejeu d'une saisie mise en attente hors-ligne (src/lib/offline-queue.ts) :
  // __offlineSnapshot contient, par élève, l'état "absent:justifié" vu à
  // l'écran au moment de la saisie ("true:false"). S'il diffère de l'état
  // serveur actuel pour cette classe/date, quelqu'un d'autre a modifié
  // l'appel entre-temps — on écrase quand même (dernier arrivé gagne) mais
  // on trace le conflit dans le journal d'audit avant l'écrasement.
  const offlineSnapshotRaw = formData.get('__offlineSnapshot') as string | null
  if (offlineSnapshotRaw) {
    try {
      const snapshot = JSON.parse(offlineSnapshotRaw) as Record<string, string>
      const { data: currentAbsences } = await supabase
        .from('absences')
        .select('student_id, is_justified')
        .eq('school_id', school.id)
        .in('student_id', Array.from(validStudentIds))
        .eq('absence_date', date)
      const currentByStudent = new Map((currentAbsences ?? []).map((a) => [a.student_id, a.is_justified]))

      for (const studentId of studentIds) {
        if (!(studentId in snapshot)) continue
        const currentJustified = currentByStudent.get(studentId)
        const currentStr = `${currentByStudent.has(studentId)}:${currentJustified ?? false}`
        if (currentStr !== snapshot[studentId]) {
          const newAbsent = formData.get(`absent_${studentId}`) === 'on'
          const newJustified = formData.get(`justified_${studentId}`) === 'on'
          await logAction(
            supabase,
            school.id,
            actorName,
            'Conflit de synchronisation hors-ligne',
            `Absence du ${date} pour ${studentNameById.get(studentId) ?? 'élève'} : état serveur "${currentStr}" remplacé par "${newAbsent}:${newJustified}" saisi hors-ligne.`
          )
        }
      }
    } catch {
      // Snapshot corrompu/illisible : on ignore la détection de conflit
      // plutôt que de bloquer l'enregistrement.
    }
  }

  // Filtré par la liste d'élèves de la classe actuelle (student_id) plutôt
  // que par absences.class_id : cette colonne n'est jamais mise à jour si
  // un élève change de classe (dashboard/eleves/actions.ts updateStudent),
  // donc s'y fier laisserait une ancienne ligne orpheline au lieu de la
  // remplacer — même correction que src/lib/bulletin.ts.
  if (validStudentIds.size > 0) {
    await supabase
      .from('absences')
      .delete()
      .eq('school_id', school.id)
      .in('student_id', Array.from(validStudentIds))
      .eq('absence_date', date)
  }

  const absentStudentIds = studentIds.filter((id) => validStudentIds.has(id) && formData.get(`absent_${id}`) === 'on')

  // On sait déjà, avant l'insertion, quels élèves ont un parent avec un
  // email : ça permet de renseigner parent_notified correctement (colonne
  // déjà présente dans le schéma mais jusqu'ici jamais utilisée) plutôt
  // que de la laisser à sa valeur par défaut.
  const { data: notifiableLinks } =
    absentStudentIds.length > 0
      ? await supabase.from('parent_students').select('student_id, parents(email)').in('student_id', absentStudentIds)
      : { data: [] as { student_id: string; parents: { email: string | null } | null }[] }

  const notifiableStudentIds = new Set(
    (notifiableLinks ?? [])
      .filter((link) => !!(link.parents as unknown as { email: string | null } | null)?.email)
      .map((link) => link.student_id)
  )

  const rows = absentStudentIds.map((id) => ({
    school_id: school.id,
    student_id: id,
    class_id: classId,
    absence_date: date,
    is_justified: formData.get(`justified_${id}`) === 'on',
    parent_notified: notifiableStudentIds.has(id),
  }))

  if (rows.length > 0) {
    // Compté APRÈS le delete ci-dessus mais AVANT l'insertion : donne le
    // nombre d'absences déjà enregistrées ce mois-ci pour cet élève, hors
    // cette date (qui vient d'être supprimée puis va être réinsérée).
    // Arithmétique sur les chaînes plutôt que sur des Date : setMonth()
    // sur une date parsée depuis une chaîne ISO date-only opère en heure
    // locale du serveur alors que le parsing est en UTC, ce qui peut
    // décaler le mois d'un jour selon le fuseau horaire.
    const [year, month] = date.slice(0, 7).split('-').map(Number)
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const monthEnd =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
    const { data: monthAbsences } = await supabase
      .from('absences')
      .select('student_id')
      .eq('school_id', school.id)
      .in('student_id', absentStudentIds)
      .gte('absence_date', monthStart)
      .lt('absence_date', monthEnd)

    const countBeforeByStudent = new Map<string, number>()
    for (const a of monthAbsences ?? []) {
      countBeforeByStudent.set(a.student_id, (countBeforeByStudent.get(a.student_id) ?? 0) + 1)
    }

    const threshold = school.absence_alert_threshold
    const crossedThreshold = absentStudentIds.filter((id) => {
      const before = countBeforeByStudent.get(id) ?? 0
      return before < threshold && before + 1 >= threshold
    })

    const { error } = await supabase.from('absences').insert(rows)
    if (error) return { error: error.message }

    for (const studentId of crossedThreshold) {
      await logAction(
        supabase,
        school.id,
        actorName,
        'Alerte absentéisme',
        `${studentNameById.get(studentId) ?? 'Élève'} a atteint ${threshold} absence(s) ce mois-ci`
      )
    }

    after(async () => {
      await Promise.all([
        ...rows
          .filter((r) => r.parent_notified)
          .map((r) =>
            notifyAbsenceRecorded(supabase, r.student_id, studentNameById.get(r.student_id) ?? 'Élève', r.absence_date, r.is_justified)
          ),
        ...crossedThreshold.map((studentId) =>
          notifyAbsenceThreshold(
            supabase,
            studentId,
            studentNameById.get(studentId) ?? 'Élève',
            (countBeforeByStudent.get(studentId) ?? 0) + 1,
            threshold
          )
        ),
      ])
    })
  }

  revalidatePath('/dashboard/absences')
  revalidatePath('/dashboard')
  return { success: true, count: rows.length }
}
