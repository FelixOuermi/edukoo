'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export async function saveAbsences(_prevState: unknown, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const classId = formData.get('classId') as string
  const date = formData.get('date') as string
  const studentIds = formData.getAll('studentId') as string[]

  if (!classId || !date) return { error: 'Classe et date sont requises.' }

  const [{ data: klass }, { data: validStudents }] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('students').select('id').eq('class_id', classId).eq('school_id', school.id),
  ])

  if (!klass) return { error: 'Classe introuvable.' }
  const validStudentIds = new Set((validStudents ?? []).map((s) => s.id))

  await supabase
    .from('absences')
    .delete()
    .eq('school_id', school.id)
    .eq('class_id', classId)
    .eq('absence_date', date)

  const rows = studentIds
    .filter((id) => validStudentIds.has(id) && formData.get(`absent_${id}`) === 'on')
    .map((id) => ({
      school_id: school.id,
      student_id: id,
      class_id: classId,
      absence_date: date,
      is_justified: formData.get(`justified_${id}`) === 'on',
    }))

  if (rows.length > 0) {
    const { error } = await supabase.from('absences').insert(rows)
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/absences')
  revalidatePath('/dashboard')
  return { success: true, count: rows.length }
}
