'use client'

import { useActionState, useState, useTransition } from 'react'
import { inviteParent, unlinkParent } from './parent-actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.studentProfile

interface ParentLink {
  id: string
  relationship: string | null
  parents: { name: string; email: string | null } | null
}

const initialState: { error?: string; success?: boolean; email?: string } = {}

export function ParentSection({ studentId, links }: { studentId: string; links: ParentLink[] }) {
  const [state, formAction, pending] = useActionState(inviteParent, initialState)
  const [removing, startRemoving] = useTransition()
  const [removeError, setRemoveError] = useState<string | null>(null)

  function handleUnlink(linkId: string) {
    setRemoveError(null)
    startRemoving(async () => {
      const result = await unlinkParent(linkId, studentId)
      if (result?.error) setRemoveError(result.error)
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{t.parentAccounts}</h2>

      {links.length === 0 ? (
        <p className="text-sm text-gray-400">{t.noParentLinked}</p>
      ) : (
        <ul className="text-sm divide-y divide-gray-100">
          {links.map((link) => (
            <li key={link.id} className="py-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-gray-800 font-medium">{link.parents?.name ?? '—'}</p>
                <p className="text-gray-500 text-xs">
                  {link.parents?.email ?? '—'}
                  {link.relationship ? ` · ${link.relationship}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={removing}
                onClick={() => handleUnlink(link.id)}
                className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
              >
                {t.unlink}
              </button>
            </li>
          ))}
        </ul>
      )}
      {removeError && <p className="text-sm text-red-600">{removeError}</p>}

      <form action={formAction} className="space-y-3 pt-3 border-t border-gray-100">
        <input type="hidden" name="studentId" value={studentId} />
        <p className="text-sm font-medium text-gray-700">{t.inviteParent}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            name="name"
            placeholder={t.name}
            required
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
          <input
            type="email"
            name="email"
            placeholder={dict.students.email}
            required
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
          <select
            name="relationship"
            defaultValue={t.relationshipFather}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value={t.relationshipFather}>{t.relationshipFather}</option>
            <option value={t.relationshipMother}>{t.relationshipMother}</option>
            <option value="Tuteur">{t.relationshipGuardian}</option>
            <option value={t.relationshipOther}>{t.relationshipOther}</option>
          </select>
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600">{t.invitationSentTo} {state.email}.</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? dict.common.sending : t.sendInvitation}
        </button>
      </form>
    </div>
  )
}
