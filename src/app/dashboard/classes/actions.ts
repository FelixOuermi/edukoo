'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export async function createClass(_prevState: unknown, formData: FormData) {
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const level = formData.get('level') as string
  const maxStudents = Number(formData.get('maxStudents') || 50)

  if (!name) return { error: 'Le nom de la classe est requis.' }

  const { error } = await supabase.from('classes').insert({
    school_id: school.id,
    school_year_id: schoolYear?.id ?? null,
    name,
    level: level || null,
    max_students: maxStudents,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function createSubject(_prevState: unknown, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const coefficient = Number(formData.get('coefficient') || 1)

  if (!name) return { error: 'Le nom de la matière est requis.' }

  const { error } = await supabase.from('subjects').insert({
    school_id: school.id,
    name,
    coefficient,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  return { success: true }
}
