import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

const paymentMethodLabel: Record<string, string> = {
  cash: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  transfer: 'Virement',
}

export default async function FicheElevePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { school, role } = await getCurrentSchool()
  const supabase = await createClient()
  const isDirector = role === 'director'

  const { data: student } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!student) notFound()

  const [{ data: payments }, { data: grades }, { data: absences }] = await Promise.all([
    supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', id)
      .order('paid_at', { ascending: false }),
    supabase
      .from('grades')
      .select('*, subjects(name, coefficient)')
      .eq('student_id', id)
      .order('trimester'),
    supabase
      .from('absences')
      .select('*')
      .eq('student_id', id)
      .order('absence_date', { ascending: false }),
  ])

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  const gradesByTrimester = new Map<number, typeof grades>()
  for (const g of grades ?? []) {
    const list = gradesByTrimester.get(g.trimester) ?? []
    list.push(g)
    gradesByTrimester.set(g.trimester, list)
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/eleves" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> Retour aux élèves
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {student.registration_number} · {(student.classes as { name: string } | null)?.name ?? 'Sans classe'}
          </p>
        </div>
        {isDirector && (
          <Link
            href={`/dashboard/scolarite/paiement?eleve=${student.id}`}
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-fit"
          >
            <Plus className="w-4 h-4" /> Enregistrer paiement
          </Link>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isDirector ? 'lg:grid-cols-3' : ''}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Informations</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Date de naissance</dt>
              <dd className="text-gray-800">{student.birth_date ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Statut</dt>
              <dd className="text-gray-800 capitalize">{student.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Parent</dt>
              <dd className="text-gray-800">{student.parent_name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Téléphone</dt>
              <dd className="text-gray-800">{student.parent_phone ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">WhatsApp</dt>
              <dd className="text-gray-800">{student.parent_whatsapp ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-800">{student.parent_email ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {isDirector && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Historique des paiements</h2>
            <span className="text-sm text-gray-500">Total payé : <span className="font-semibold text-emerald-600">{formatFCFA(totalPaid)}</span></span>
          </div>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">Aucun paiement enregistré.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-left border-b border-gray-100">
                <tr>
                  <th className="py-2 font-medium">Reçu</th>
                  <th className="py-2 font-medium">Tranche</th>
                  <th className="py-2 font-medium">Mode</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(payments ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-gray-600">{p.receipt_number}</td>
                    <td className="py-2 text-gray-600">{p.installment_number}</td>
                    <td className="py-2 text-gray-600">{paymentMethodLabel[p.payment_method] ?? p.payment_method}</td>
                    <td className="py-2 text-gray-600">{new Date(p.paid_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{formatFCFA(Number(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Notes par trimestre</h2>
          {[1, 2, 3].map((tri) => {
            const list = gradesByTrimester.get(tri) ?? []
            return (
              <div key={tri} className="mb-4 last:mb-0">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Trimestre {tri}</h3>
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucune note.</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {list.map((g) => (
                      <li key={g.id} className="flex justify-between text-gray-700">
                        <span>{(g.subjects as { name: string } | null)?.name}</span>
                        <span className="font-medium">{g.score}/{g.max_score}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Absences</h2>
          {(absences ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">Aucune absence enregistrée.</p>
          ) : (
            <ul className="text-sm divide-y divide-gray-100">
              {(absences ?? []).map((a) => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <span className="text-gray-700">{new Date(a.absence_date).toLocaleDateString('fr-FR')}</span>
                  <span className={a.is_justified ? 'text-emerald-600 text-xs' : 'text-rose-600 text-xs'}>
                    {a.is_justified ? 'Justifiée' : 'Non justifiée'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
