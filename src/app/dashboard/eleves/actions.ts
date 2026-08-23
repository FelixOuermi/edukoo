'use server'

import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

async function generateRegistrationNumber(schoolId: string) {
  const supabase = await createClient()
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
  const seq = (count ?? 0) + 1
  return `MAT-${year}-${String(seq).padStart(4, '0')}`
}

export async function createStudent(_prevState: unknown, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const registrationNumber = await generateRegistrationNumber(school.id)

  const { error } = await supabase.from('students').insert({
    school_id: school.id,
    class_id: (formData.get('classId') as string) || null,
    first_name: formData.get('firstName') as string,
    last_name: formData.get('lastName') as string,
    birth_date: (formData.get('birthDate') as string) || null,
    parent_name: (formData.get('parentName') as string) || null,
    parent_phone: (formData.get('parentPhone') as string) || null,
    parent_whatsapp: (formData.get('parentWhatsapp') as string) || null,
    parent_email: (formData.get('parentEmail') as string) || null,
    registration_number: registrationNumber,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/eleves')
  redirect('/dashboard/eleves')
}

export async function updateStudent(id: string, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const { error } = await supabase
    .from('students')
    .update({
      class_id: (formData.get('classId') as string) || null,
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      birth_date: (formData.get('birthDate') as string) || null,
      parent_name: (formData.get('parentName') as string) || null,
      parent_phone: (formData.get('parentPhone') as string) || null,
      parent_whatsapp: (formData.get('parentWhatsapp') as string) || null,
      parent_email: (formData.get('parentEmail') as string) || null,
      status: (formData.get('status') as string) || 'active',
    })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/eleves')
  revalidatePath(`/dashboard/eleves/${id}`)
  return { success: true }
}

export async function deleteStudent(id: string) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()
  const { error } = await supabase.from('students').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/eleves')
  redirect('/dashboard/eleves')
}

interface ExcelRow {
  Prenom?: string
  Nom?: string
  DateNaissance?: string
  Classe?: string
  ParentNom?: string
  ParentTelephone?: string
  ParentWhatsapp?: string
  ParentEmail?: string
}

export async function importStudentsFromExcel(formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Aucun fichier fourni.' }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet)

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', school.id)
  const classByName = new Map((classes ?? []).map((c) => [c.name.trim().toLowerCase(), c.id]))

  let created = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.Prenom || !row.Nom) {
      skipped++
      continue
    }
    const registrationNumber = await generateRegistrationNumber(school.id)
    const classId = row.Classe ? classByName.get(row.Classe.trim().toLowerCase()) ?? null : null

    const { error } = await supabase.from('students').insert({
      school_id: school.id,
      class_id: classId,
      first_name: row.Prenom,
      last_name: row.Nom,
      birth_date: row.DateNaissance || null,
      parent_name: row.ParentNom || null,
      parent_phone: row.ParentTelephone ? String(row.ParentTelephone) : null,
      parent_whatsapp: row.ParentWhatsapp ? String(row.ParentWhatsapp) : null,
      parent_email: row.ParentEmail || null,
      registration_number: registrationNumber,
    })

    if (error) skipped++
    else created++
  }

  revalidatePath('/dashboard/eleves')
  return { success: true, created, skipped }
}
