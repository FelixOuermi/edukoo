'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // Edukoo a trois familles de comptes (personnel, parent, élève) qui
  // partagent le même formulaire de connexion mais pas le même espace :
  // on route vers le bon portail selon la table où l'utilisateur existe.
  const userId = data.user.id

  const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', userId).maybeSingle()
  if (teacher) redirect('/dashboard')

  const { data: parent } = await supabase.from('parents').select('id').eq('user_id', userId).maybeSingle()
  if (parent) redirect('/espace-parent')

  const { data: student } = await supabase.from('students').select('id').eq('user_id', userId).maybeSingle()
  if (student) redirect('/espace-eleve')

  return { error: getDictionary().auth.errors.noSchoolAccount }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
