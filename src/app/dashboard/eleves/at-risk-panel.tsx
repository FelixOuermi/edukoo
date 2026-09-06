'use client'

import { useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { explainAtRisk } from './at-risk-actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()

export function AtRiskPanel({
  studentId,
  classId,
  trimester,
  factorLabels,
  title,
}: {
  studentId: string
  classId: string
  trimester: number
  factorLabels: string[]
  title: string
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ explanation?: string; error?: string } | null>(null)

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <p className="text-sm font-medium text-rose-800">{title}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setResult(await explainAtRisk(studentId, classId, trimester))
            })
          }
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-900 disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5" /> {pending ? dict.statisticsPage.generatingSummary : dict.statisticsPage.explainWithAi}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {factorLabels.map((label) => (
          <span key={label} className="inline-block px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-xs">
            {label}
          </span>
        ))}
      </div>
      {result?.error && <p className="text-xs text-rose-600 mt-2">{result.error}</p>}
      {result?.explanation && <p className="text-sm text-rose-900 mt-2">{result.explanation}</p>}
    </div>
  )
}
