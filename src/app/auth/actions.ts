'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const schoolName = formData.get('schoolName') as string
  const directorName = formData.get('directorName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { school_name: schoolName, director_name: directorName },
    },
  })
  if (error) return { error: error.message }

  // The `handle_new_school_signup` DB trigger provisions the school and
  // teacher rows from the metadata above, even before email confirmation.
  if (!data.session) {
    return {
      success: true,
      pendingConfirmation: true,
    }
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
