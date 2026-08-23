'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { logAction } from '@/lib/audit-log'

export async function recordPayment(_prevState: unknown, formData: FormData) {
  const { school, user, schoolYear, teacherName: actorName } = await requireDirector()
  const supabase = await createClient()

  const studentId = formData.get('studentId') as string
  const amount = Number(formData.get('amount'))
  const installmentNumber = Number(formData.get('installmentNumber') || 1)
  const paymentMethod = formData.get('paymentMethod') as string
  const paidAt = formData.get('paidAt') as string

  if (!studentId) return { error: 'Veuillez sélectionner un élève.' }
  if (!amount || amount <= 0) return { error: 'Montant invalide.' }

  const { data: student } = await supabase
    .from('students')
    .select('class_id, first_name, last_name')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!student) return { error: 'Élève introuvable.' }

  let feeStructureId: string | null = null
  if (student?.class_id && schoolYear) {
    const { data: feeStructure } = await supabase
      .from('fee_structures')
      .select('id')
      .eq('class_id', student.class_id)
      .eq('school_year_id', schoolYear.id)
      .maybeSingle()
    feeStructureId = feeStructure?.id ?? null
  }

  const { data: payment, error } = await supabase
    .from('fee_payments')
    .insert({
      school_id: school.id,
      student_id: studentId,
      fee_structure_id: feeStructureId,
      amount,
      installment_number: installmentNumber,
      payment_method: paymentMethod,
      paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await logAction(
    supabase,
    school.id,
    actorName,
    'Paiement enregistré',
    `${amount.toLocaleString('fr-FR')} FCFA pour ${student.first_name} ${student.last_name} (${paymentMethod})`
  )

  revalidatePath('/dashboard/scolarite')
  revalidatePath(`/dashboard/eleves/${studentId}`)
  redirect(`/dashboard/scolarite/recu/${payment.id}`)
}
