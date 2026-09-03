'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import { createSubscription, cancelSubscription } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.servicesPage

interface StudentOption {
  id: string
  name: string
  registrationNumber: string
  className: string
}

const initialState: { error?: string; success?: boolean } = {}

export function NewSubscriptionForm({ students, serviceType }: { students: StudentOption[]; serviceType: 'canteen' | 'transport' }) {
  const [state, formAction, pending] = useActionState(createSubscription, initialState)
  const [selected, setSelected] = useState<StudentOption | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.registrationNumber.toLowerCase().includes(q)).slice(0, 8)
  }, [query, students])

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{t.addSubscription}</h2>
      <input type="hidden" name="serviceType" value={serviceType} />

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.student}</label>
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
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.monthlyFeeFcfa}</label>
        <input
          type="number"
          name="monthlyFee"
          min={1}
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t.subscriptionSaved}</p>}
      <button
        type="submit"
        disabled={pending || !selected}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.saving : dict.common.add}
      </button>
    </form>
  )
}

export function CancelSubscriptionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelSubscription(id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={handleCancel}
        className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
      >
        {t.cancel}
      </button>
    </span>
  )
}
