'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { logAction } from '@/lib/audit-log'
import { notifyPaymentReceived } from '@/lib/notifications'
import { getDictionary } from '@/lib/i18n'

export async function recordPayment(_prevState: unknown, formData: FormData) {
  const { school, user, schoolYear, teacherName: actorName } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().errors

  const studentId = formData.get('studentId') as string
  const amount = Number(formData.get('amount'))
  const installmentNumber = Number(formData.get('installmentNumber') || 1)
  const paymentMethod = formData.get('paymentMethod') as string
  const paidAt = formData.get('paidAt') as string

  if (!studentId) return { error: t.selectStudent }
  if (!amount || amount <= 0) return { error: t.invalidAmount }

  const { data: student } = await supabase
    .from('students')
    .select('class_id, first_name, last_name')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!student) return { error: t.studentNotFound }

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

  after(() =>
    notifyPaymentReceived(
      supabase,
      studentId,
      `${student.first_name} ${student.last_name}`,
      amount,
      payment.receipt_number ?? null
    )
  )

  revalidatePath('/dashboard/scolarite')
  revalidatePath(`/dashboard/eleves/${studentId}`)
  redirect(`/dashboard/scolarite/recu/${payment.id}`)
}
