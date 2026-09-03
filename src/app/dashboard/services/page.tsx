import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { NewSubscriptionForm, CancelSubscriptionButton } from './subscription-form'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>
}) {
  const { service } = await searchParams
  const serviceType = service === 'transport' ? 'transport' : 'canteen'
  const { school, schoolYear } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().servicesPage
  const SERVICE_LABEL: Record<string, string> = { canteen: t.canteen, transport: t.transport }

  const [{ data: subscriptions }, { data: students }] = await Promise.all([
    schoolYear
      ? supabase
          .from('service_subscriptions')
          .select('id, monthly_fee, is_active, students(id, first_name, last_name, classes(name))')
          .eq('school_id', school.id)
          .eq('school_year_id', schoolYear.id)
          .eq('service_type', serviceType)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),
    supabase
      .from('students')
      .select('id, first_name, last_name, registration_number, classes(name)')
      .eq('school_id', school.id)
      .eq('status', 'active')
      .order('last_name'),
  ])

  const subscriptionIds = (subscriptions ?? []).map((s) => s.id)
  const { data: payments } =
    subscriptionIds.length > 0
      ? await supabase.from('service_payments').select('subscription_id, amount').in('subscription_id', subscriptionIds)
      : { data: [] as { subscription_id: string; amount: number }[] }

  const paidBySubscription = new Map<string, number>()
  for (const p of payments ?? []) {
    paidBySubscription.set(p.subscription_id, (paidBySubscription.get(p.subscription_id) ?? 0) + Number(p.amount))
  }

  const studentOptions = (students ?? []).map((s) => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    registrationNumber: s.registration_number ?? '',
    className: (s.classes as unknown as { name: string } | null)?.name ?? '—',
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      <div className="flex gap-2">
        {(['canteen', 'transport'] as const).map((t) => (
          <Link
            key={t}
            href={`/dashboard/services?service=${t}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              serviceType === t ? 'bg-[#7c3aed] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {SERVICE_LABEL[t]}
          </Link>
        ))}
      </div>

      {!schoolYear ? (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          {t.noSchoolYear}
        </p>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.tableStudent}</th>
                  <th className="px-4 py-3 font-medium">{t.tableClass}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.tableMonthlyFee}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.tableTotalPaid}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(subscriptions ?? []).map((s) => {
                  const student = s.students as unknown as {
                    id: string
                    first_name: string
                    last_name: string
                    classes: { name: string } | null
                  } | null
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {student ? `${student.first_name} ${student.last_name}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{student?.classes?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatFCFA(Number(s.monthly_fee))}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {formatFCFA(paidBySubscription.get(s.id) ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                        <Link
                          href={`/dashboard/services/paiement?abonnement=${s.id}`}
                          className="text-xs font-medium text-[#7c3aed] hover:underline"
                        >
                          {t.recordPayment}
                        </Link>
                        <CancelSubscriptionButton id={s.id} />
                      </td>
                    </tr>
                  )
                })}
                {(subscriptions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      {t.noActiveSubscriptionsTemplate.replace('{service}', SERVICE_LABEL[serviceType].toLowerCase())}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <NewSubscriptionForm key={serviceType} students={studentOptions} serviceType={serviceType} />
        </>
      )}
    </div>
  )
}
