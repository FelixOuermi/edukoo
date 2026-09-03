import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type TeacherRole = 'director' | 'teacher'

export async function getCurrentSchool() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, school_id, role, name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!teacher) {
    // Pas un compte personnel : c'est peut-être un parent ou un élève qui
    // a atterri sur /dashboard (lien direct, favori...) — on le renvoie
    // vers son propre portail plutôt que de le faire passer pour déconnecté.
    const { data: parent } = await supabase.from('parents').select('id').eq('user_id', user.id).maybeSingle()
    if (parent) redirect('/espace-parent')
    const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle()
    if (student) redirect('/espace-eleve')
    redirect('/auth/login')
  }

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', teacher.school_id)
    .single()

  if (!school) redirect('/auth/login')

  const { data: schoolYear } = await supabase
    .from('school_years')
    .select('*')
    .eq('school_id', school.id)
    .eq('is_current', true)
    .maybeSingle()

  return {
    user,
    school,
    schoolYear,
    role: teacher.role as TeacherRole,
    teacherId: teacher.id as string,
    teacherName: teacher.name as string,
  }
}

export async function requireDirector() {
  const result = await getCurrentSchool()
  if (result.role !== 'director') redirect('/dashboard')
  return result
}
