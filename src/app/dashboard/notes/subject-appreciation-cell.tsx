'use client'

import { useState, useTransition } from 'react'
import { saveSubjectAppreciation } from './actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary().notesPage

export function SubjectAppreciationCell({
  classId,
  subjectId,
  studentId,
  trimester,
  initialValue,
}: {
  classId: string
  subjectId: string
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
      const result = await saveSubjectAppreciation(classId, subjectId, studentId, trimester, value)
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
        placeholder={t.subjectAppreciationPlaceholder}
        disabled={pending}
        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-60"
      />
      {pending && <p className="text-[11px] text-gray-400 mt-0.5">{t.saving}</p>}
      {error && <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>}
    </div>
  )
}
