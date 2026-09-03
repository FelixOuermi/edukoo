'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentSchool } from '@/lib/school'
import { logAction } from '@/lib/audit-log'
import { getDictionary } from '@/lib/i18n'

export async function inviteParent(_prevState: unknown, formData: FormData) {
  const { school, teacherName: actorName } = await getCurrentSchool()
  const t = getDictionary().errors

  const studentId = formData.get('studentId') as string
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const relationship = (formData.get('relationship') as string) || null

  if (!studentId || !name || !email) return { error: t.studentEmailRequired }

  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()
  if (!student) return { error: t.studentNotFound }

  // Un même parent peut avoir plusieurs enfants dans l'école : on
  // réutilise le compte existant plutôt que d'inviter deux fois la même
  // adresse (Supabase refuserait de toute façon la seconde invitation).
  const { data: existingParent } = await supabase
    .from('parents')
    .select('id')
    .eq('school_id', school.id)
    .eq('email', email)
    .maybeSingle()

  let parentId: string

  if (existingParent) {
    parentId = existingParent.id
  } else {
    const admin = createAdminClient()
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email)
    if (inviteError) return { error: inviteError.message }

    const { data: createdParent, error: insertError } = await supabase
      .from('parents')
      .insert({ school_id: school.id, user_id: invited.user.id, name, email })
      .select('id')
      .single()

    if (insertError || !createdParent) {
      // L'invitation Auth a réussi mais l'insertion a échoué : on retire
      // le compte auth pour ne pas laisser un utilisateur invité orphelin.
      await admin.auth.admin.deleteUser(invited.user.id)
      return { error: insertError?.message ?? t.parentAccountCreationFailed }
    }
    parentId = createdParent.id
  }

  const { data: existingLink } = await supabase
    .from('parent_students')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existingLink) return { error: t.parentAlreadyLinked }

  const { error: linkError } = await supabase.from('parent_students').insert({
    school_id: school.id,
    parent_id: parentId,
    student_id: studentId,
    relationship,
  })

  if (linkError) return { error: linkError.message }

  await logAction(supabase, school.id, actorName, 'Invitation parent', `${name} (${email})`)

  revalidatePath(`/dashboard/eleves/${studentId}`)
  return { success: true, email }
}

export async function unlinkParent(parentStudentId: string, studentId: string) {
  const { school, teacherName: actorName } = await getCurrentSchool()
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('parent_students')
    .select('id, parents(name, email)')
    .eq('id', parentStudentId)
    .eq('school_id', school.id)
    .maybeSingle()

  const { error } = await supabase
    .from('parent_students')
    .delete()
    .eq('id', parentStudentId)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  if (link) {
    const parent = link.parents as unknown as { name: string; email: string } | null
    await logAction(supabase, school.id, actorName, 'Retrait lien parent', parent?.name ?? parentStudentId)
  }

  revalidatePath(`/dashboard/eleves/${studentId}`)
  return { success: true }
}
