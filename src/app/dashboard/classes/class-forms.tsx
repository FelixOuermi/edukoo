'use client'

import { useActionState, useState, useTransition } from 'react'
import { createClass, createSubject, createGradeType, deleteGradeType } from './actions'

export function NewClassForm() {
  const [state, formAction, pending] = useActionState(createClass, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Ajouter une classe</h2>
      <input
        type="text"
        name="name"
        required
        placeholder="Nom (ex : 6ème A)"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="text"
        name="level"
        placeholder="Niveau (ex : Collège)"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="number"
        name="maxStudents"
        defaultValue={50}
        min={1}
        placeholder="Effectif maximum"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? 'Ajout...' : 'Ajouter'}
      </button>
    </form>
  )
}

export function NewSubjectForm() {
  const [state, formAction, pending] = useActionState(createSubject, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Ajouter une matière</h2>
      <input
        type="text"
        name="name"
        required
        placeholder="Nom (ex : Mathématiques)"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="number"
        name="coefficient"
        defaultValue={1}
        min={1}
        placeholder="Coefficient"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? 'Ajout...' : 'Ajouter'}
      </button>
    </form>
  )
}

export function NewGradeTypeForm() {
  const [state, formAction, pending] = useActionState(createGradeType, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Ajouter un type de note</h2>
      <input
        type="text"
        name="name"
        required
        placeholder="Nom (ex : Composition)"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="number"
        name="weight"
        defaultValue={1}
        min={0.5}
        step={0.5}
        placeholder="Poids"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? 'Ajout...' : 'Ajouter'}
      </button>
    </form>
  )
}

export function DeleteGradeTypeButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            const result = await deleteGradeType(id)
            if (result?.error) setError(result.error)
          })
        }
        className="text-xs text-gray-400 hover:text-rose-600 disabled:opacity-50"
      >
        Supprimer
      </button>
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  )
}
