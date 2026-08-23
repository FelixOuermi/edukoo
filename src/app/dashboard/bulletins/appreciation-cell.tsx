'use client'

import { useState, useTransition } from 'react'
import { saveAppreciation } from './actions'

export function AppreciationCell({
  studentId,
  trimester,
  initialValue,
}: {
  studentId: string
  trimester: number
  initialValue: string | null
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [savedValue, setSavedValue] = useState(initialValue ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleBlur() {
    if (value === savedValue) return
    setError(null)
    startTransition(async () => {
      const result = await saveAppreciation(studentId, trimester, value)
      if (result?.error) setError(result.error)
      else setSavedValue(value)
    })
  }

  return (
    <div className="min-w-[180px]">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Appréciation..."
        disabled={pending}
        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-60"
      />
      {pending && <p className="text-[11px] text-gray-400 mt-0.5">Enregistrement...</p>}
      {error && <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>}
    </div>
  )
}
