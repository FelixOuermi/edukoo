'use client'

import { useState, useTransition } from 'react'
import { reviewAbsenceJustification } from './absence-review-actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary().studentProfile

interface Props {
  id: string
  studentId: string
  date: string
  isJustified: boolean
  justificationStatus: 'none' | 'pending' | 'approved' | 'rejected'
  justificationReason: string | null
}

const statusLabel: Record<string, string> = {
  pending: t.justificationPending,
  approved: t.justificationApproved,
  rejected: t.justificationRejected,
}

export function AbsenceRow({
  id,
  studentId,
  date,
  isJustified,
  justificationStatus,
  justificationReason,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function review(decision: 'approved' | 'rejected') {
    setError(null)
    startTransition(async () => {
      const result = await reviewAbsenceJustification(id, studentId, decision)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-700">{new Date(date).toLocaleDateString('fr-FR')}</span>
        <div className="flex items-center gap-2">
          <span className={isJustified ? 'text-emerald-600 text-xs' : 'text-rose-600 text-xs'}>
            {isJustified ? t.justified : t.notJustified}
          </span>
          {justificationStatus === 'pending' ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => review('approved')}
                className="text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
              >
                {t.validate}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => review('rejected')}
                className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
              >
                {t.reject}
              </button>
            </>
          ) : justificationStatus !== 'none' ? (
            <span className="text-xs text-gray-400">{statusLabel[justificationStatus]}</span>
          ) : null}
        </div>
      </div>
      {justificationReason && <p className="text-xs text-gray-400 mt-1">{t.reasonLabel} : {justificationReason}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </li>
  )
}
