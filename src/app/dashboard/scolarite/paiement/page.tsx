import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { PaymentForm } from './payment-form'

export default async function PaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ eleve?: string }>
}) {
  const { eleve } = await searchParams
  const { school } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().tuitionPage

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, registration_number, classes(name)')
    .eq('school_id', school.id)
    .eq('status', 'active')
    .order('last_name')

  const options = (students ?? []).map((s) => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    registrationNumber: s.registration_number ?? '',
    className: (s.classes as unknown as { name: string } | null)?.name ?? '—',
  }))

  return (
    <div className="space-y-6">
      <Link href="/dashboard/scolarite" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> {t.backToTuition}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{t.recordPayment}</h1>

      <PaymentForm students={options} preselectedId={eleve} />
    </div>
  )
}
