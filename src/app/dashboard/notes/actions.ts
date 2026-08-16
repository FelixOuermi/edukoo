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

  if (!classId || !subjectId || !trimester) {
    return { error: 'Classe, matière et trimestre sont requis.' }
  }

  const rows = studentIds
    .map((studentId) => {
      const raw = formData.get(`score_${studentId}`) as string
      if (raw === null || raw === '') return null
      const score = Number(raw)
      if (Number.isNaN(score)) return null
      return {
        school_id: school.id,
        student_id: studentId,
        class_id: classId,
        subject_id: subjectId,
        school_year_id: schoolYear.id,
        trimester,
        score,
        max_score: 20,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) return { error: 'Aucune note à enregistrer.' }

  const { error } = await supabase
    .from('grades')
    .upsert(rows, { onConflict: 'student_id,subject_id,school_year_id,trimester' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/notes')
  revalidatePath('/dashboard/bulletins')
  return { success: true, count: rows.length }
}
