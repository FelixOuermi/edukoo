import Link from 'next/link'
import { Users, TrendingUp, Wallet, CalendarX, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function DashboardPage() {
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: students },
    { data: feeStructures },
    { data: payments },
    { data: absencesToday },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id, first_name, last_name, status, class_id, classes(name)')
      .eq('school_id', school.id),
    schoolYear
      ? supabase
          .from('fee_structures')
          .select('class_id, total_amount')
          .eq('school_id', school.id)
          .eq('school_year_id', schoolYear.id)
      : Promise.resolve({ data: [] as { class_id: string; total_amount: number }[] }),
    supabase
      .from('fee_payments')
      .select('student_id, amount')
      .eq('school_id', school.id),
    supabase
      .from('absences')
      .select('id, student_id, students(first_name, last_name)')
      .eq('school_id', school.id)
      .eq('absence_date', today),
  ])

  const activeStudents = (students ?? []).filter((s) => s.status === 'active')

  const feeByClass = new Map<string, number>()
  for (const fs of feeStructures ?? []) {
    feeByClass.set(fs.class_id, (feeByClass.get(fs.class_id) ?? 0) + Number(fs.total_amount))
  }

  const paidByStudent = new Map<string, number>()
  for (const p of payments ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount))
  }

  let totalExpected = 0
  let totalCollected = 0
  const balances: { id: string; name: string; className: string; due: number }[] = []

  for (const s of activeStudents) {
    const expected = s.class_id ? feeByClass.get(s.class_id) ?? 0 : 0
    const paid = paidByStudent.get(s.id) ?? 0
    totalExpected += expected
    totalCollected += Math.min(paid, expected) || paid
    const due = expected - paid
    if (due > 0) {
      balances.push({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        className: (s.classes as unknown as { name: string } | null)?.name ?? '—',
        due,
      })
    }
  }

  const recoveryRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0
  const totalUnpaid = Math.max(totalExpected - totalCollected, 0)
  const topUnpaid = balances.sort((a, b) => b.due - a.due).slice(0, 5)

  const kpis = [
    {
      label: 'Élèves actifs',
      value: activeStudents.length.toLocaleString('fr-FR'),
      icon: Users,
      color: 'bg-violet-100 text-[#7c3aed]',
    },
    {
      label: 'Taux de recouvrement',
      value: `${recoveryRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Montant impayés',
      value: formatFCFA(totalUnpaid),
      icon: Wallet,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: "Absences aujourd'hui",
      value: String(absencesToday?.length ?? 0),
      icon: CalendarX,
      color: 'bg-rose-100 text-rose-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">{school.name}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/eleves/nouveau"
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Inscrire un élève
          </Link>
          <Link
            href="/dashboard/scolarite/paiement"
            className="inline-flex items-center gap-2 bg-white border border-violet-200 text-[#7c3aed] hover:bg-violet-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Enregistrer un paiement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top 5 impayés</h2>
          {topUnpaid.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun impayé — bravo !</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {topUnpaid.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between">
                  <Link href={`/dashboard/eleves/${s.id}`} className="text-sm text-gray-800 hover:text-[#7c3aed]">
                    {s.name}
                    <span className="text-gray-400"> · {s.className}</span>
                  </Link>
                  <span className="text-sm font-semibold text-amber-600">{formatFCFA(s.due)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Absents aujourd&apos;hui</h2>
          {(absencesToday?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">Aucune absence enregistrée aujourd&apos;hui.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {absencesToday!.map((a) => {
                const student = a.students as unknown as { first_name: string; last_name: string } | null
                return (
                  <li key={a.id} className="py-3 text-sm text-gray-800">
                    {student ? `${student.first_name} ${student.last_name}` : 'Élève'}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
