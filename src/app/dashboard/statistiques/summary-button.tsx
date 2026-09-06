'use client'

import { useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { generateSummary } from './actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary().statisticsPage

export function SummaryButton({ trimester }: { trimester: number }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ summary?: string; error?: string } | null>(null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold text-gray-900">{t.summaryTitle}</h2>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setResult(await generateSummary(trimester))
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#7c3aed] text-[#7c3aed] text-sm font-medium hover:bg-violet-50 transition-colors disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" /> {pending ? t.generatingSummary : t.generateSummaryButton}
        </button>
      </div>
      {result?.error && <p className="text-sm text-red-600 mt-3">{result.error}</p>}
      {result?.summary && <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">{result.summary}</p>}
    </div>
  )
}
