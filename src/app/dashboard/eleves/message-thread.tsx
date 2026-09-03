'use client'

import { useActionState } from 'react'
import { postStaffMessage } from './message-actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.studentProfile

interface Message {
  id: string
  sender_role: 'staff' | 'parent'
  sender_name: string
  body: string
  created_at: string
}

const initialState: { error?: string; success?: boolean } = {}

export function MessageThread({ studentId, messages }: { studentId: string; messages: Message[] }) {
  const [state, formAction, pending] = useActionState(postStaffMessage, initialState)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{t.messagesTitle}</h2>

      {messages.length === 0 ? (
        <p className="text-sm text-gray-400">{t.noMessages}</p>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                m.sender_role === 'staff' ? 'bg-violet-50 ml-auto text-right' : 'bg-gray-50'
              }`}
            >
              <p className="text-gray-800 whitespace-pre-wrap">{m.body}</p>
              <p className="text-xs text-gray-400 mt-1">
                {m.sender_name} · {new Date(m.created_at).toLocaleString('fr-FR')}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex gap-2 pt-3 border-t border-gray-100">
        <input type="hidden" name="studentId" value={studentId} />
        <input
          type="text"
          name="body"
          placeholder={t.writeMessagePlaceholder}
          required
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? '...' : dict.common.send}
        </button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  )
}
