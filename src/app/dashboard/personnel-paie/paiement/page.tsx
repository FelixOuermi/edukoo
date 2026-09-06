import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { PayrollPaymentForm } from '../payment-form'

export default async function PayrollPaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ membre?: string }>
}) {
  const { membre } = await searchParams
  const { school } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().payrollPage

  if (!membre) notFound()

  const { data: staffMember } = await supabase
    .from('staff_members')
    .select('id, name, monthly_salary')
    .eq('id', membre)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!staffMember) notFound()

  return (
    <div className="space-y-6">
      <Link href="/dashboard/personnel-paie" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> {t.backToPayroll}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{t.recordPayment}</h1>

      <PayrollPaymentForm
        staffMemberId={staffMember.id}
        staffMemberName={staffMember.name}
        monthlySalary={staffMember.monthly_salary ? Number(staffMember.monthly_salary) : null}
      />
    </div>
  )
}
