'use client'

import { useActionState } from 'react'
import { recordPayrollPayment } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.payrollPage

export function PayrollPaymentForm({
  staffMemberId,
  staffMemberName,
  monthlySalary,
}: {
  staffMemberId: string
  staffMemberName: string
  monthlySalary: number | null
}) {
  const [state, formAction, pending] = useActionState(recordPayrollPayment, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 max-w-lg">
      <input type="hidden" name="staffMemberId" value={staffMemberId} />
      <div>
        <p className="text-sm text-gray-500">{t.staffMember}</p>
        <p className="font-medium text-gray-900">{staffMemberName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.periodMonth}</label>
          <input
            type="month"
            name="periodMonth"
            defaultValue={new Date().toISOString().slice(0, 7)}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.amountFcfa}</label>
          <input
            type="number"
            name="amount"
            min={1}
            defaultValue={monthlySalary ?? undefined}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentMethod}</label>
          <select
            name="paymentMethod"
            defaultValue="cash"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="cash">{dict.paymentMethods.cash}</option>
            <option value="orange_money">{dict.paymentMethods.orange_money}</option>
            <option value="moov_money">{dict.paymentMethods.moov_money}</option>
            <option value="transfer">{dict.paymentMethods.transfer}</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">{t.paymentMethodHint}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
          <input
            type="date"
            name="paidAt"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.noteOptional}</label>
        <input
          type="text"
          name="note"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.saving : t.saveAndGenerateReceipt}
      </button>
    </form>
  )
}
