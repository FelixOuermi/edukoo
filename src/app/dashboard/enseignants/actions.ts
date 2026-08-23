'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentSchool, type TeacherRole } from '@/lib/school'

export async function inviteTeacher(_prevState: unknown, formData: FormData) {
  const { school, role: actorRole } = await getCurrentSchool()
  if (actorRole !== 'director') {
    return { error: 'Seul le directeur peut inviter un membre du personnel.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const invitedRole = (formData.get('role') as string) || 'teacher'

  if (!name || !email) return { error: 'Nom et email sont requis.' }
  if (invitedRole !== 'director' && invitedRole !== 'teacher') {
    return { error: 'Rôle invalide.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('teachers')
    .select('id')
    .eq('school_id', school.id)
    .eq('email', email)
    .maybeSingle()

  if (existing) return { error: 'Cette personne fait déjà partie de votre équipe.' }

  const admin = createAdminClient()
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email)

  if (inviteError) return { error: inviteError.message }

  const { error: insertError } = await supabase.from('teachers').insert({
    school_id: school.id,
    user_id: invited.user.id,
    name,
    email,
    role: invitedRole as TeacherRole,
  })

  if (insertError) {
    // L'invitation Auth a réussi mais l'insertion a échoué : on retire le
    // compte auth pour ne pas laisser un utilisateur invité sans école.
    await admin.auth.admin.deleteUser(invited.user.id)
    return { error: insertError.message }
  }

  revalidatePath('/dashboard/enseignants')
  return { success: true, email }
}

export async function setTeacherActive(id: string, isActive: boolean) {
  const { school, role: actorRole } = await getCurrentSchool()
  if (actorRole !== 'director') {
    return { error: 'Seul le directeur peut modifier le statut du personnel.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('teachers')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/enseignants')
  return { success: true }
}

export async function setTeacherRole(id: string, newRole: TeacherRole) {
  const { school, role: actorRole, user } = await getCurrentSchool()
  if (actorRole !== 'director') {
    return { error: 'Seul le directeur peut modifier les rôles.' }
  }

  const supabase = await createClient()
  const { data: target } = await supabase
    .from('teachers')
    .select('user_id')
    .eq('id', id)
    .eq('school_id', school.id)
    .maybeSingle()

  if (target?.user_id === user.id && newRole !== 'director') {
    return { error: 'Vous ne pouvez pas retirer votre propre rôle de directeur.' }
  }

  const { error } = await supabase
    .from('teachers')
    .update({ role: newRole })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/enseignants')
  return { success: true }
}
