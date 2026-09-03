'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentSchool, type TeacherRole } from '@/lib/school'
import { logAction } from '@/lib/audit-log'
import { getDictionary } from '@/lib/i18n'

export async function inviteTeacher(_prevState: unknown, formData: FormData) {
  const { school, role: actorRole, teacherName: actorName } = await getCurrentSchool()
  const t = getDictionary().errors
  if (actorRole !== 'director') {
    return { error: t.directorOnlyInviteStaff }
  }

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const invitedRole = (formData.get('role') as string) || 'teacher'

  if (!name || !email) return { error: t.nameAndEmailRequired }
  if (invitedRole !== 'director' && invitedRole !== 'teacher') {
    return { error: t.invalidRole }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('teachers')
    .select('id')
    .eq('school_id', school.id)
    .eq('email', email)
    .maybeSingle()

  if (existing) return { error: t.alreadyInTeam }

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

  await logAction(supabase, school.id, actorName, 'Invitation', `${name} (${email}) invité comme ${invitedRole === 'director' ? 'directeur' : 'enseignant'}`)

  revalidatePath('/dashboard/enseignants')
  return { success: true, email }
}

export async function setTeacherActive(id: string, isActive: boolean) {
  const { school, role: actorRole, teacherName: actorName } = await getCurrentSchool()
  if (actorRole !== 'director') {
    return { error: getDictionary().errors.directorOnlyChangeStatus }
  }

  const supabase = await createClient()
  const { data: target } = await supabase.from('teachers').select('name').eq('id', id).eq('school_id', school.id).maybeSingle()
  const { error } = await supabase
    .from('teachers')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  await logAction(supabase, school.id, actorName, isActive ? 'Réactivation' : 'Désactivation', target?.name ?? id)

  revalidatePath('/dashboard/enseignants')
  return { success: true }
}

export async function setTeacherRole(id: string, newRole: TeacherRole) {
  const { school, role: actorRole, user, teacherName: actorName } = await getCurrentSchool()
  const t = getDictionary().errors
  if (actorRole !== 'director') {
    return { error: t.directorOnlyChangeRoles }
  }

  const supabase = await createClient()
  const { data: target } = await supabase
    .from('teachers')
    .select('user_id, name')
    .eq('id', id)
    .eq('school_id', school.id)
    .maybeSingle()

  if (target?.user_id === user.id && newRole !== 'director') {
    return { error: t.cannotRemoveOwnDirectorRole }
  }

  const { error } = await supabase
    .from('teachers')
    .update({ role: newRole })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  await logAction(supabase, school.id, actorName, 'Changement de rôle', `${target?.name ?? id} → ${newRole === 'director' ? 'directeur' : 'enseignant'}`)

  revalidatePath('/dashboard/enseignants')
  return { success: true }
}

export async function saveTeacherAssignments(_prevState: unknown, formData: FormData) {
  const { school, role: actorRole } = await getCurrentSchool()
  const t = getDictionary().errors
  if (actorRole !== 'director') {
    return { error: t.directorOnlyAssignStaff }
  }

  const supabase = await createClient()
  const teacherId = formData.get('teacherId') as string
  const classId = formData.get('classId') as string
  const subjectIds = formData.getAll('subjectId') as string[]

  if (!teacherId || !classId) return { error: t.teacherAndClassRequired }

  const [{ data: teacher }, { data: klass }, { data: validSubjects }] = await Promise.all([
    supabase.from('teachers').select('id').eq('id', teacherId).eq('school_id', school.id).maybeSingle(),
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('subjects').select('id').eq('school_id', school.id).in('id', subjectIds),
  ])

  if (!teacher || !klass) return { error: t.teacherOrClassNotFound }
  const validSubjectIds = new Set((validSubjects ?? []).map((s) => s.id))
  const selectedSubjectIds = subjectIds.filter((id) => validSubjectIds.has(id))

  // Remplace l'affectation de cet enseignant pour CETTE classe : les
  // matières décochées sont retirées, les nouvelles cochées sont ajoutées.
  // Les affectations sur d'autres classes ne sont pas touchées.
  const { error: deleteError } = await supabase
    .from('teacher_subjects')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .eq('school_id', school.id)

  if (deleteError) return { error: deleteError.message }

  if (selectedSubjectIds.length > 0) {
    const { error: insertError } = await supabase.from('teacher_subjects').insert(
      selectedSubjectIds.map((subjectId) => ({
        school_id: school.id,
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
      }))
    )
    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/dashboard/enseignants')
  revalidatePath('/dashboard/notes')
  revalidatePath('/dashboard/absences')
  return { success: true }
}
