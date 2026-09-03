'use client'

import { useActionState, useState, useTransition } from 'react'
import { createAnnouncement, deleteAnnouncement } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.announcementsPage

const initialState: { error?: string; success?: boolean } = {}

export function NewAnnouncementForm() {
  const [state, formAction, pending] = useActionState(createAnnouncement, initialState)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.publishAnnouncement}</h2>
      <input
        type="text"
        name="title"
        placeholder={t.titlePlaceholder}
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <textarea
        name="body"
        placeholder={t.messagePlaceholder}
        required
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t.published}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.publishing : t.publish}
      </button>
    </form>
  )
}

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAnnouncement(id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
      >
        {dict.common.delete}
      </button>
    </span>
  )
}
