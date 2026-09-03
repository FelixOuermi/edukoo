'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentParent, requireOwnChild } from '@/lib/portal'
import { getDictionary } from '@/lib/i18n'

export async function submitAbsenceJustification(_prevState: unknown, formData: FormData) {
  const { parent } = await getCurrentParent()
  const t = getDictionary().errors

  const absenceId = formData.get('absenceId') as string
  const studentId = formData.get('studentId') as string
  const reason = (formData.get('reason') as string)?.trim()
  if (!absenceId || !studentId || !reason) return { error: t.reasonRequired }

  const owns = await requireOwnChild(parent.id, studentId)
  if (!owns) return { error: t.studentNotFound }

  const supabase = await createClient()

  const { error } = await supabase
    .from('absences')
    .update({ justification_reason: reason, justification_status: 'pending' })
    .eq('id', absenceId)
    .eq('student_id', studentId)

  if (error) return { error: error.message }

  revalidatePath(`/espace-parent/${studentId}`)
  return { success: true }
}
