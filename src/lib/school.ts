import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentSchool() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (!teacher) redirect('/auth/login')

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

  return { user, school, schoolYear }
}
