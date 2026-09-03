'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { logAction } from '@/lib/audit-log'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const SERVICE_LABEL: Record<string, string> = { canteen: dict.servicesPage.canteen, transport: dict.servicesPage.transport }

export async function createSubscription(_prevState: unknown, formData: FormData) {
  const { school, schoolYear, teacherName: actorName } = await requireDirector()
  const t = dict.errors

  if (!schoolYear) return { error: t.noActiveSchoolYear }

  const studentId = formData.get('studentId') as string
  const serviceType = formData.get('serviceType') as string
  const monthlyFee = Number(formData.get('monthlyFee'))

  if (!studentId) return { error: t.selectStudent }
  if (!['canteen', 'transport'].includes(serviceType)) return { error: t.invalidService }
  if (!monthlyFee || monthlyFee <= 0) return { error: t.invalidMonthlyFee }

  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()
  if (!student) return { error: t.studentNotFound }

  const { error } = await supabase.from('service_subscriptions').upsert(
    {
      school_id: school.id,
      student_id: studentId,
      school_year_id: schoolYear.id,
      service_type: serviceType,
      monthly_fee: monthlyFee,
      is_active: true,
    },
    { onConflict: 'student_id,school_year_id,service_type' }
  )

  if (error) return { error: error.message }

  await logAction(
    supabase,
    school.id,
    actorName,
    'Abonnement service',
    `${SERVICE_LABEL[serviceType]} pour ${student.first_name} ${student.last_name}`
  )

  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function cancelSubscription(id: string) {
  const { school } = await requireDirector()
  const supabase = await createClient()

  const { error } = await supabase
    .from('service_subscriptions')
    .update({ is_active: false })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function recordServicePayment(_prevState: unknown, formData: FormData) {
  const { school, user, teacherName: actorName } = await requireDirector()
  const supabase = await createClient()
  const t = dict.errors

  const subscriptionId = formData.get('subscriptionId') as string
  const amount = Number(formData.get('amount'))
  const periodMonth = formData.get('periodMonth') as string
  const paymentMethod = formData.get('paymentMethod') as string
  const paidAt = formData.get('paidAt') as string

  if (!subscriptionId) return { error: t.subscriptionNotFound }
  if (!amount || amount <= 0) return { error: t.invalidAmount }
  if (!periodMonth) return { error: t.periodRequired }

  const { data: subscription } = await supabase
    .from('service_subscriptions')
    .select('id, service_type, students(first_name, last_name)')
    .eq('id', subscriptionId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!subscription) return { error: t.subscriptionNotFound }

  const { data: payment, error } = await supabase
    .from('service_payments')
    .insert({
      school_id: school.id,
      subscription_id: subscriptionId,
      amount,
      period_month: `${periodMonth}-01`,
      payment_method: paymentMethod,
      paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const student = subscription.students as unknown as { first_name: string; last_name: string } | null
  await logAction(
    supabase,
    school.id,
    actorName,
    'Paiement service',
    `${SERVICE_LABEL[subscription.service_type]} — ${amount.toLocaleString('fr-FR')} FCFA pour ${student?.first_name ?? ''} ${student?.last_name ?? ''}`
  )

  revalidatePath('/dashboard/services')
  redirect(`/dashboard/services/recu/${payment.id}`)
}
