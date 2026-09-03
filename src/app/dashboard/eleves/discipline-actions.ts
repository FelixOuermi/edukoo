'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

export async function createDisciplinaryRecord(_prevState: unknown, formData: FormData) {
  const { school, teacherName: actorName } = await getCurrentSchool()
  const t = getDictionary().errors

  const studentId = formData.get('studentId') as string
  const type = formData.get('type') as string
  const description = (formData.get('description') as string)?.trim()
  const incidentDate = (formData.get('incidentDate') as string) || new Date().toISOString().slice(0, 10)

  if (!studentId || !description) return { error: t.descriptionRequired }
  if (!['remark', 'warning', 'detention', 'suspension'].includes(type)) return { error: t.invalidType }

  const supabase = await createClient()
  const { error } = await supabase.from('disciplinary_records').insert({
    school_id: school.id,
    student_id: studentId,
    type,
    description,
    incident_date: incidentDate,
    recorded_by: actorName,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/eleves/${studentId}`)
  return { success: true }
}

export async function deleteDisciplinaryRecord(id: string, studentId: string) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()
  const { error } = await supabase.from('disciplinary_records').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/eleves/${studentId}`)
  return { success: true }
}
