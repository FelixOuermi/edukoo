import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function RecuPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { school } = await requireDirector()
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('fee_payments')
    .select('*, students(first_name, last_name)')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!payment) notFound()

  const student = payment.students as unknown as { first_name: string; last_name: string } | null

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-10">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-9 h-9 text-emerald-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paiement enregistré</h1>
        <p className="text-gray-500 mt-2">
          {student ? `${student.first_name} ${student.last_name}` : 'Élève'} — reçu{' '}
          <span className="font-medium text-gray-700">{payment.receipt_number}</span>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm text-gray-500">Montant</p>
        <p className="text-3xl font-bold text-[#7c3aed] mt-1">{formatFCFA(Number(payment.amount))}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={`/dashboard/scolarite/recu/${payment.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" /> Télécharger le reçu PDF
        </a>
        <Link
          href="/dashboard/scolarite/paiement"
          className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Nouveau paiement
        </Link>
      </div>
    </div>
  )
}
