'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentParent, requireOwnChild } from '@/lib/portal'
import { getDictionary } from '@/lib/i18n'

export async function postParentMessage(_prevState: unknown, formData: FormData) {
  const { parent } = await getCurrentParent()
  const t = getDictionary().errors

  const studentId = formData.get('studentId') as string
  const body = (formData.get('body') as string)?.trim()
  if (!studentId || !body) return { error: t.emptyMessage }

  const owns = await requireOwnChild(parent.id, studentId)
  if (!owns) return { error: t.studentNotFound }

  const supabase = await createClient()

  const { error } = await supabase.from('messages').insert({
    school_id: parent.school_id,
    student_id: studentId,
    sender_role: 'parent',
    sender_name: parent.name,
    sender_parent_id: parent.id,
    body,
  })

  if (error) return { error: error.message }

  revalidatePath(`/espace-parent/${studentId}`)
  return { success: true }
}
