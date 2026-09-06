import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { NewStaffMemberForm, DeactivateStaffButton } from './staff-form'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function PersonnelPaiePage() {
  const { school } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().payrollPage

  const [{ data: staffMembers }, { data: teachers }] = await Promise.all([
    supabase
      .from('staff_members')
      .select('id, name, role_title, monthly_salary, teacher_id')
      .eq('school_id', school.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('teachers').select('id, name').eq('school_id', school.id).eq('is_active', true).order('name'),
  ])

  const staffIds = (staffMembers ?? []).map((s) => s.id)
  const { data: payments } =
    staffIds.length > 0
      ? await supabase.from('payroll_payments').select('staff_member_id, amount').in('staff_member_id', staffIds)
      : { data: [] as { staff_member_id: string; amount: number }[] }

  const paidByStaff = new Map<string, number>()
  for (const p of payments ?? []) {
    paidByStaff.set(p.staff_member_id, (paidByStaff.get(p.staff_member_id) ?? 0) + Number(p.amount))
  }

  const linkedTeacherIds = new Set((staffMembers ?? []).map((s) => s.teacher_id).filter(Boolean) as string[])
  const availableTeachers = (teachers ?? []).filter((tc) => !linkedTeacherIds.has(tc.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t.tableName}</th>
              <th className="px-4 py-3 font-medium">{t.tableRole}</th>
              <th className="px-4 py-3 font-medium text-right">{t.tableMonthlySalary}</th>
              <th className="px-4 py-3 font-medium text-right">{t.tableTotalPaid}</th>
              <th className="px-4 py-3 font-medium text-right">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(staffMembers ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.role_title ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {s.monthly_salary ? formatFCFA(Number(s.monthly_salary)) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                  {formatFCFA(paidByStaff.get(s.id) ?? 0)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                  <Link
                    href={`/dashboard/personnel-paie/paiement?membre=${s.id}`}
                    className="text-xs font-medium text-[#7c3aed] hover:underline"
                  >
                    {t.recordPayment}
                  </Link>
                  <DeactivateStaffButton id={s.id} />
                </td>
              </tr>
            ))}
            {(staffMembers ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {t.noStaff}
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>

      <NewStaffMemberForm teachers={availableTeachers ?? []} />
    </div>
  )
}
