'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export async function saveGrades(_prevState: unknown, formData: FormData) {
  const { school, schoolYear } = await getCurrentSchool()
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
