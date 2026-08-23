'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export async function updateSchoolInfo(_prevState: unknown, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const { error } = await supabase
    .from('schools')
    .update({
      name: formData.get('name') as string,
      address: (formData.get('address') as string) || null,
      phone: (formData.get('phone') as string) || null,
      nif: (formData.get('nif') as string) || null,
      director_name: (formData.get('directorName') as string) || null,
      orange_money: (formData.get('orangeMoney') as string) || null,
      moov_money: (formData.get('moovMoney') as string) || null,
      whatsapp: (formData.get('whatsapp') as string) || null,
    })
    .eq('id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/parametres')
  return { success: true }
}

export async function createSchoolYear(_prevState: unknown, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string

  if (!name || !startDate || !endDate) return { error: 'Tous les champs sont requis.' }

  await supabase.from('school_years').update({ is_current: false }).eq('school_id', school.id)

  const { error } = await supabase.from('school_years').insert({
    school_id: school.id,
    name,
    start_date: startDate,
    end_date: endDate,
    is_current: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/parametres')
  return { success: true }
}

export async function setCurrentSchoolYear(id: string) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  await supabase.from('school_years').update({ is_current: false }).eq('school_id', school.id)
  const { error } = await supabase
    .from('school_years')
    .update({ is_current: true })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/parametres')
  return { success: true }
}

export async function upsertFeeStructure(_prevState: unknown, formData: FormData) {
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  if (!schoolYear) return { error: 'Créez une année scolaire active avant de définir les frais.' }

  const classId = formData.get('classId') as string
  const totalAmount = Number(formData.get('totalAmount'))
  const installments = Number(formData.get('installments') || 3)

  if (!classId || !totalAmount) return { error: 'Classe et montant sont requis.' }

  const { data: klass } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!klass) return { error: 'Classe introuvable.' }

  const { data: existing } = await supabase
    .from('fee_structures')
    .select('id')
    .eq('class_id', classId)
    .eq('school_year_id', schoolYear.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('fee_structures')
      .update({ total_amount: totalAmount, installments })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('fee_structures').insert({
      school_id: school.id,
      school_year_id: schoolYear.id,
      class_id: classId,
      name: 'Scolarité annuelle',
      total_amount: totalAmount,
      installments,
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/parametres')
  return { success: true }
}
