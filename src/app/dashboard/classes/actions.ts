'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool, requireDirector } from '@/lib/school'

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

export async function createGradeType(_prevState: unknown, formData: FormData) {
  const { school } = await requireDirector()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const weight = Number(formData.get('weight') || 1)

  if (!name) return { error: 'Le nom du type de note est requis.' }
  if (!weight || weight <= 0) return { error: 'Le poids doit être supérieur à 0.' }

  const { error } = await supabase.from('grade_types').insert({
    school_id: school.id,
    name,
    weight,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/notes')
  return { success: true }
}

export async function deleteGradeType(id: string) {
  const { school } = await requireDirector()
  const supabase = await createClient()

  const { count } = await supabase.from('grade_types').select('id', { count: 'exact', head: true }).eq('school_id', school.id)
  if ((count ?? 0) <= 1) {
    return { error: 'Impossible de supprimer le dernier type de note : il en faut au moins un.' }
  }

  const { count: usageCount } = await supabase
    .from('grades')
    .select('id', { count: 'exact', head: true })
    .eq('grade_type_id', id)
  if ((usageCount ?? 0) > 0) {
    return { error: `Impossible de supprimer : ${usageCount} note(s) utilisent déjà ce type.` }
  }

  const { error } = await supabase.from('grade_types').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/notes')
  return { success: true }
}
