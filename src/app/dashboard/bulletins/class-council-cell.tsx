'use client'

import { useState, useTransition } from 'react'
import { saveClassCouncilDecision } from './actions'

const DECISION_OPTIONS = [
  { value: '', label: '—' },
  { value: 'passage', label: 'Passage' },
  { value: 'passage_conditionnel', label: 'Passage conditionnel' },
  { value: 'redoublement', label: 'Redoublement' },
]

export function ClassCouncilCell({
  studentId,
  isDirector,
  initialDecision,
  initialComment,
}: {
  studentId: string
  isDirector: boolean
  initialDecision: string | null
  initialComment: string | null
}) {
  const [decision, setDecision] = useState(initialDecision ?? '')
  const [comment, setComment] = useState(initialComment ?? '')
  const [savedComment, setSavedComment] = useState(initialComment ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save(nextDecision: string, nextComment: string) {
    setError(null)
    startTransition(async () => {
      const result = await saveClassCouncilDecision(studentId, nextDecision, nextComment)
      if (result?.error) setError(result.error)
    })
  }

  function handleDecisionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setDecision(value)
    save(value, comment)
  }

  function handleCommentBlur() {
    if (comment === savedComment) return
    setSavedComment(comment)
    save(decision, comment)
  }

  if (!isDirector) {
    const label = DECISION_OPTIONS.find((o) => o.value === decision)?.label ?? '—'
    return <span className="text-sm text-gray-600">{decision ? label : '—'}</span>
  }

  return (
    <div className="min-w-[170px] space-y-1">
      <select
        value={decision}
        onChange={handleDecisionChange}
        disabled={pending}
        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-60"
      >
        {DECISION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={handleCommentBlur}
        placeholder="Commentaire (optionnel)"
        disabled={pending}
        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-60"
      />
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  )
}
