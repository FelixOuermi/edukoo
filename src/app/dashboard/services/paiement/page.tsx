import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { ServicePaymentForm } from '../payment-form'

export default async function ServicePaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ abonnement?: string }>
}) {
  const { abonnement } = await searchParams
  const { school } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().servicesPage

  if (!abonnement) notFound()

  const { data: subscription } = await supabase
    .from('service_subscriptions')
    .select('id, monthly_fee, service_type, students(first_name, last_name)')
    .eq('id', abonnement)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!subscription) notFound()

  const student = subscription.students as unknown as { first_name: string; last_name: string } | null

  return (
    <div className="space-y-6">
      <Link href="/dashboard/services" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> {t.backToServices}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{t.recordPayment}</h1>

      <ServicePaymentForm
        subscriptionId={subscription.id}
        studentName={student ? `${student.first_name} ${student.last_name}` : '—'}
        monthlyFee={Number(subscription.monthly_fee)}
      />
    </div>
  )
}
