import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

type Statut = 'paye' | 'partiel' | 'impaye'

export default async function ScolaritePage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; statut?: string }>
}) {
  const { classe, statut } = await searchParams
  const { school, schoolYear } = await requireDirector()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.tuitionPage

  const [{ data: classes }, { data: students }, { data: feeStructures }, { data: payments }] =
    await Promise.all([
      supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
      supabase
        .from('students')
        .select('id, first_name, last_name, class_id, classes(name)')
        .eq('school_id', school.id)
        .eq('status', 'active'),
      schoolYear
        ? supabase
            .from('fee_structures')
            .select('class_id, total_amount')
            .eq('school_id', school.id)
            .eq('school_year_id', schoolYear.id)
        : Promise.resolve({ data: [] as { class_id: string; total_amount: number }[] }),
      supabase.from('fee_payments').select('student_id, amount').eq('school_id', school.id),
    ])

  const feeByClass = new Map<string, number>()
  for (const fs of feeStructures ?? []) {
    feeByClass.set(fs.class_id, (feeByClass.get(fs.class_id) ?? 0) + Number(fs.total_amount))
  }
  const paidByStudent = new Map<string, number>()
  for (const p of payments ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount))
  }

  let rows = (students ?? []).map((s) => {
    const expected = s.class_id ? feeByClass.get(s.class_id) ?? 0 : 0
    const paid = paidByStudent.get(s.id) ?? 0
    const due = Math.max(expected - paid, 0)
    let rowStatus: Statut = 'impaye'
    if (expected === 0) rowStatus = 'paye'
    else if (paid >= expected) rowStatus = 'paye'
    else if (paid > 0) rowStatus = 'partiel'
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      className: (s.classes as unknown as { name: string } | null)?.name ?? '—',
      classId: s.class_id,
      expected,
      paid,
      due,
      status: rowStatus,
    }
  })

  if (classe) rows = rows.filter((r) => r.classId === classe)
  if (statut) rows = rows.filter((r) => r.status === statut)

  const totalExpected = rows.reduce((sum, r) => sum + r.expected, 0)
  const totalCollected = rows.reduce((sum, r) => sum + Math.min(r.paid, r.expected || r.paid), 0)

  const statusLabel: Record<Statut, string> = { paye: t.statusPaid, partiel: t.statusPartial, impaye: t.statusUnpaid }
  const statusColor: Record<Statut, string> = {
    paye: 'bg-emerald-100 text-emerald-700',
    partiel: 'bg-amber-100 text-amber-700',
    impaye: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <Link
          href="/dashboard/scolarite/paiement"
          className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> {t.recordPayment}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">{t.totalExpected}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatFCFA(totalExpected)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">{t.totalCollected}</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatFCFA(totalCollected)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">{t.unpaidBalance}</p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {formatFCFA(Math.max(totalExpected - totalCollected, 0))}
          </p>
        </div>
      </div>

      <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <select
          name="classe"
          defaultValue={classe ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="">{t.allClasses}</option>
          {(classes ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="statut"
          defaultValue={statut ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="">{t.allStatuses}</option>
          <option value="paye">{t.statusPaid}</option>
          <option value="partiel">{t.statusPartial}</option>
          <option value="impaye">{t.statusUnpaid}</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
          {dict.common.filter}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t.tableStudent}</th>
              <th className="px-4 py-3 font-medium">{t.tableClass}</th>
              <th className="px-4 py-3 font-medium text-right">{t.tableExpected}</th>
              <th className="px-4 py-3 font-medium text-right">{t.tablePaid}</th>
              <th className="px-4 py-3 font-medium text-right">{t.tableBalance}</th>
              <th className="px-4 py-3 font-medium">{t.tableStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/eleves/${r.id}`} className="text-gray-900 font-medium hover:text-[#7c3aed]">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.className}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatFCFA(r.expected)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatFCFA(r.paid)}</td>
                <td className={`px-4 py-3 text-right font-medium ${r.due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatFCFA(r.due)}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status]}`}>
                    {statusLabel[r.status]}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {t.noneFound}
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
