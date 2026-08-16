'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const schoolName = formData.get('schoolName') as string
  const directorName = formData.get('directorName') as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (data.user) {
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: schoolName,
        director_name: directorName,
        email: email,
        plan: 'starter',
      })
      .select()
      .single()

    if (schoolError) return { error: schoolError.message }

    await supabase.from('teachers').insert({
      school_id: school.id,
      user_id: data.user.id,
      name: directorName,
      email: email,
    })
  }
  redirect('/dashboard')
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
