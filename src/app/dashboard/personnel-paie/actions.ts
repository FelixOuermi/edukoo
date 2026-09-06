'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { logAction } from '@/lib/audit-log'
import { getDictionary } from '@/lib/i18n'

export async function createStaffMember(_prevState: unknown, formData: FormData) {
  const { school, teacherName: actorName } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().errors

  const name = (formData.get('name') as string)?.trim()
  const roleTitle = (formData.get('roleTitle') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const teacherId = (formData.get('teacherId') as string) || null
  const monthlySalaryRaw = formData.get('monthlySalary') as string

  if (!name) return { error: t.staffNameRequired }

  let monthlySalary: number | null = null
  if (monthlySalaryRaw) {
    monthlySalary = Number(monthlySalaryRaw)
    if (!monthlySalary || monthlySalary <= 0) return { error: t.invalidMonthlySalary }
  }

  if (teacherId) {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', teacherId)
      .eq('school_id', school.id)
      .maybeSingle()
    if (!teacher) return { error: t.teacherNotFound }
  }

  const { error } = await supabase.from('staff_members').insert({
    school_id: school.id,
    teacher_id: teacherId,
    name,
    role_title: roleTitle || null,
    phone: phone || null,
    monthly_salary: monthlySalary,
  })

  if (error) return { error: error.message }

  await logAction(supabase, school.id, actorName, 'Ajout personnel', name)

  revalidatePath('/dashboard/personnel-paie')
  return { success: true }
}

export async function deactivateStaffMember(id: string) {
  const { school } = await requireDirector()
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff_members')
    .update({ is_active: false })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/personnel-paie')
  return { success: true }
}

export async function recordPayrollPayment(_prevState: unknown, formData: FormData) {
  const { school, user, teacherName: actorName } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().errors

  const staffMemberId = formData.get('staffMemberId') as string
  const amount = Number(formData.get('amount'))
  const periodMonth = formData.get('periodMonth') as string
  const paymentMethod = formData.get('paymentMethod') as string
  const paidAt = formData.get('paidAt') as string
  const note = (formData.get('note') as string)?.trim()

  if (!staffMemberId) return { error: t.staffMemberNotFound }
  if (!amount || amount <= 0) return { error: t.invalidAmount }
  if (!periodMonth) return { error: t.periodRequired }

  const { data: staffMember } = await supabase
    .from('staff_members')
    .select('id, name')
    .eq('id', staffMemberId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!staffMember) return { error: t.staffMemberNotFound }

  const { data: payment, error } = await supabase
    .from('payroll_payments')
    .insert({
      school_id: school.id,
      staff_member_id: staffMemberId,
      amount,
      period_month: `${periodMonth}-01`,
      payment_method: paymentMethod,
      note: note || null,
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
    'Paiement personnel',
    `${amount.toLocaleString('fr-FR')} FCFA pour ${staffMember.name}`
  )

  revalidatePath('/dashboard/personnel-paie')
  redirect(`/dashboard/personnel-paie/recu/${payment.id}`)
}
