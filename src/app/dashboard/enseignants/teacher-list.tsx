'use client'

import { useActionState, useState, useTransition } from 'react'
import { inviteTeacher, setTeacherActive, setTeacherRole } from './actions'

interface Teacher {
  id: string
  name: string
  phone: string | null
  email: string | null
  role: 'director' | 'teacher'
  is_active: boolean
  user_id: string | null
}

const roleLabel: Record<Teacher['role'], string> = {
  director: 'Directeur',
  teacher: 'Enseignant',
}

export function TeacherRow({ teacher, canManage }: { teacher: Teacher; canManage: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleActive() {
    setError(null)
    startTransition(async () => {
      const result = await setTeacherActive(teacher.id, !teacher.is_active)
      if (result?.error) setError(result.error)
    })
  }

  function toggleRole() {
    setError(null)
    const nextRole = teacher.role === 'director' ? 'teacher' : 'director'
    startTransition(async () => {
      const result = await setTeacherRole(teacher.id, nextRole)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <tr>
      <td className="px-4 py-3 text-gray-900 font-medium">{teacher.name}</td>
      <td className="px-4 py-3 text-gray-600">{teacher.phone ?? '—'}</td>
      <td className="px-4 py-3 text-gray-600">{teacher.email ?? '—'}</td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            teacher.role === 'director' ? 'bg-violet-100 text-[#7c3aed]' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {roleLabel[teacher.role]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            teacher.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {teacher.is_active ? 'Actif' : 'Inactif'}
        </span>
      </td>
      {canManage && (
        <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            type="button"
            disabled={pending}
            onClick={toggleRole}
            className="text-xs font-medium text-[#7c3aed] hover:underline disabled:opacity-50"
          >
            {teacher.role === 'director' ? 'Passer enseignant' : 'Passer directeur'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={toggleActive}
            className="text-xs font-medium text-gray-500 hover:underline disabled:opacity-50"
          >
            {teacher.is_active ? 'Désactiver' : 'Réactiver'}
          </button>
        </td>
      )}
    </tr>
  )
}

const initialState: { error?: string; success?: boolean; email?: string } = {}

export function InviteTeacherForm() {
  const [state, formAction, pending] = useActionState(inviteTeacher, initialState)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-lg">
      <h2 className="font-semibold text-gray-900">Inviter un membre du personnel</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
          <select
            name="role"
            defaultValue="teacher"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="teacher">Enseignant</option>
            <option value="director">Directeur</option>
          </select>
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-600">Invitation envoyée à {state.email}.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? 'Envoi...' : 'Envoyer l’invitation'}
      </button>
    </form>
  )
}
