'use client'

import { useActionState, useState } from 'react'
import { submitAbsenceJustification } from './absence-actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.portal
const s = dict.studentProfile

interface Props {
  absenceId: string
  studentId: string
  date: string
  isJustified: boolean
  justificationStatus: 'none' | 'pending' | 'approved' | 'rejected'
  justificationReason: string | null
}

const initialState: { error?: string; success?: boolean } = {}
const statusLabel: Record<string, string> = {
  pending: t.justificationPendingParent,
  approved: s.justificationApproved,
  rejected: s.justificationRejected,
}

export function AbsenceRow({
  absenceId,
  studentId,
  date,
  isJustified,
  justificationStatus,
  justificationReason,
}: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(submitAbsenceJustification, initialState)

  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-700">{new Date(date).toLocaleDateString('fr-FR')}</span>
        <div className="flex items-center gap-2">
          <span className={isJustified ? 'text-emerald-600 text-xs' : 'text-rose-600 text-xs'}>
            {isJustified ? s.justified : s.notJustified}
          </span>
          {!isJustified && justificationStatus === 'none' && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-[#7c3aed] hover:underline"
            >
              {t.justify}
            </button>
          )}
          {justificationStatus !== 'none' && (
            <span className="text-xs text-gray-400">{statusLabel[justificationStatus]}</span>
          )}
        </div>
      </div>
      {justificationReason && justificationStatus !== 'none' && (
        <p className="text-xs text-gray-400 mt-1">{s.reasonLabel} : {justificationReason}</p>
      )}
      {open && justificationStatus === 'none' && (
        <form action={formAction} className="mt-2 flex gap-2">
          <input type="hidden" name="absenceId" value={absenceId} />
          <input type="hidden" name="studentId" value={studentId} />
          <input
            type="text"
            name="reason"
            placeholder={t.absenceReasonPlaceholder}
            required
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-medium bg-[#7c3aed] text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
          >
            {pending ? '...' : dict.common.send}
          </button>
        </form>
      )}
      {state?.error && <p className="text-xs text-red-600 mt-1">{state.error}</p>}
    </li>
  )
}
