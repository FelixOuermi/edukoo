import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { ImportExcelButton } from '@/components/import-excel-button'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; q?: string; statut?: string }>
}) {
  const { classe, q, statut } = await searchParams
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary()

  const [{ data: classes }, { data: feeStructures }, { data: payments }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
    schoolYear
      ? supabase
          .from('fee_structures')
          .select('class_id, total_amount')
          .eq('school_id', school.id)
          .eq('school_year_id', schoolYear.id)
      : Promise.resolve({ data: [] as { class_id: string; total_amount: number }[] }),
    supabase.from('fee_payments').select('student_id, amount').eq('school_id', school.id),
  ])

  let query = supabase
    .from('students')
    .select('id, first_name, last_name, status, registration_number, class_id, classes(name)')
    .eq('school_id', school.id)
    .order('last_name')

  if (classe) query = query.eq('class_id', classe)
  if (statut) query = query.eq('status', statut)
  if (q) {
    const safeQ = q.replace(/[%,()]/g, '')
    query = query.or(`first_name.ilike.%${safeQ}%,last_name.ilike.%${safeQ}%`)
  }

  const { data: students } = await query

  const feeByClass = new Map<string, number>()
  for (const fs of feeStructures ?? []) {
    feeByClass.set(fs.class_id, (feeByClass.get(fs.class_id) ?? 0) + Number(fs.total_amount))
  }
  const paidByStudent = new Map<string, number>()
  for (const p of payments ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount))
  }

  const statusLabel: Record<string, string> = {
    active: t.students.statusActive,
    suspended: t.students.statusSuspended,
    left: t.students.statusLeft,
  }
  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-amber-100 text-amber-700',
    left: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.students.title}</h1>
        <div className="flex flex-wrap gap-3 items-start">
          <ImportExcelButton />
          <Link
            href="/dashboard/eleves/nouveau"
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> {t.students.enroll}
          </Link>
        </div>
      </div>

      <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={t.students.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <select
          name="classe"
          defaultValue={classe ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="">{t.students.allClasses}</option>
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
          <option value="">{t.students.allStatuses}</option>
          <option value="active">{t.students.statusActive}</option>
          <option value="suspended">{t.students.statusSuspended}</option>
          <option value="left">{t.students.statusLeft}</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          {t.common.filter}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t.students.tableRegistration}</th>
              <th className="px-4 py-3 font-medium">{t.students.tableName}</th>
              <th className="px-4 py-3 font-medium">{t.students.tableClass}</th>
              <th className="px-4 py-3 font-medium">{t.students.tableStatus}</th>
              <th className="px-4 py-3 font-medium text-right">{t.students.tableBalance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(students ?? []).map((s) => {
              const expected = s.class_id ? feeByClass.get(s.class_id) ?? 0 : 0
              const paid = paidByStudent.get(s.id) ?? 0
              const due = Math.max(expected - paid, 0)
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{s.registration_number}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/eleves/${s.id}`} className="text-gray-900 font-medium hover:text-[#7c3aed]">
                      {s.first_name} {s.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(s.classes as unknown as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status]}`}>
                      {statusLabel[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatFCFA(due)}
                  </td>
                </tr>
              )
            })}
            {(students ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  {t.students.noneFound}
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
