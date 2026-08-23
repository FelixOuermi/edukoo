'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireDirector } from '@/lib/school'

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_LOGO_SIZE = 2 * 1024 * 1024

export async function uploadSchoolLogo(_prevState: unknown, formData: FormData) {
  const { school } = await requireDirector()
  const supabase = await createClient()
  const file = formData.get('file') as File | null

  if (!file || file.size === 0) return { error: 'Aucun fichier fourni.' }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { error: 'Format non supporté. Utilise PNG, JPEG, WebP ou SVG.' }
  }
  if (file.size > MAX_LOGO_SIZE) {
    return { error: 'Le fichier dépasse 2 Mo.' }
  }

  const admin = createAdminClient()
  const extension = file.name.split('.').pop() || 'png'
  const path = `${school.id}/logo-${Date.now()}.${extension}`

  const { error: uploadError } = await admin.storage.from('school-logos').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = admin.storage.from('school-logos').getPublicUrl(path)

  const previousLogoUrl = school.logo_url as string | null
  const { error: updateError } = await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id)

  if (updateError) return { error: updateError.message }

  if (previousLogoUrl?.includes('/school-logos/')) {
    const previousPath = previousLogoUrl.split('/school-logos/')[1]
    if (previousPath) await admin.storage.from('school-logos').remove([previousPath])
  }

  revalidatePath('/dashboard/parametres')
  return { success: true, logoUrl: publicUrl }
}

export async function updateSchoolInfo(_prevState: unknown, formData: FormData) {
  const { school } = await requireDirector()
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
  const { school } = await requireDirector()
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
  const { school } = await requireDirector()
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
  const { school, schoolYear } = await requireDirector()
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
