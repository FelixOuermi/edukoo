'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

export async function postStaffMessage(_prevState: unknown, formData: FormData) {
  const { school, teacherId, teacherName: actorName } = await getCurrentSchool()

  const studentId = formData.get('studentId') as string
  const body = (formData.get('body') as string)?.trim()
  if (!studentId || !body) return { error: getDictionary().errors.emptyMessage }

  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()
  if (!student) return { error: getDictionary().errors.studentNotFound }

  const { error } = await supabase.from('messages').insert({
    school_id: school.id,
    student_id: studentId,
    sender_role: 'staff',
    sender_name: actorName,
    sender_teacher_id: teacherId,
    body,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/eleves/${studentId}`)
  return { success: true }
}
