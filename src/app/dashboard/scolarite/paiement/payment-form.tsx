'use client'

import { useActionState, useMemo, useState } from 'react'
import { recordPayment } from '../actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.tuitionPage

interface StudentOption {
  id: string
  name: string
  registrationNumber: string
  className: string
}

export function PaymentForm({
  students,
  preselectedId,
}: {
  students: StudentOption[]
  preselectedId?: string
}) {
  const [state, formAction, pending] = useActionState(recordPayment, null)

  const preselected = students.find((s) => s.id === preselectedId) ?? null
  const [selected, setSelected] = useState<StudentOption | null>(preselected)
  const [query, setQuery] = useState(preselected ? preselected.name : '')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.registrationNumber.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [query, students])

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 max-w-lg">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.tableStudent}</label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t.searchPlaceholder}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          autoComplete="off"
        />
        <input type="hidden" name="studentId" value={selected?.id ?? ''} />
        {open && results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(s)
                    setQuery(s.name)
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50"
                >
                  <span className="font-medium text-gray-900">{s.name}</span>{' '}
                  <span className="text-gray-400">
                    · {s.registrationNumber} · {s.className}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!selected && query && (
          <p className="text-xs text-amber-600 mt-1">{t.selectFromList}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.installment}</label>
          <select
            name="installmentNumber"
            defaultValue="1"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="1">{t.installment1}</option>
            <option value="2">{t.installment2}</option>
            <option value="3">{t.installment3}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.amountFcfa}</label>
          <input
            type="number"
            name="amount"
            min={1}
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

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !selected}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.saving : t.saveAndGenerateReceipt}
      </button>
    </form>
  )
}
