'use client'

import { useActionState } from 'react'
import { updateSchoolInfo, createSchoolYear, upsertFeeStructure } from './actions'

interface School {
  name: string
  address: string | null
  phone: string | null
  nif: string | null
  director_name: string | null
  orange_money: string | null
  moov_money: string | null
  whatsapp: string | null
}

export function SchoolInfoForm({ school }: { school: School }) {
  const [state, formAction, pending] = useActionState(updateSchoolInfo, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Informations de l&apos;école</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;école</label>
          <input
            type="text"
            name="name"
            defaultValue={school.name}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Directeur</label>
          <input
            type="text"
            name="directorName"
            defaultValue={school.director_name ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            name="address"
            defaultValue={school.address ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="text"
            name="phone"
            defaultValue={school.phone ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
          <input
            type="text"
            name="nif"
            defaultValue={school.nif ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp école</label>
          <input
            type="text"
            name="whatsapp"
            defaultValue={school.whatsapp ?? ''}
            placeholder="+225 ..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Orange Money</label>
          <input
            type="text"
            name="orangeMoney"
            defaultValue={school.orange_money ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Moov Money</label>
          <input
            type="text"
            name="moovMoney"
            defaultValue={school.moov_money ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Enregistré.</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  )
}

export function SchoolYearForm() {
  const [state, formAction, pending] = useActionState(createSchoolYear, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Nouvelle année scolaire</h2>
      <input
        type="text"
        name="name"
        required
        placeholder="Ex : 2026-2027"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          name="startDate"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="date"
          name="endDate"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? 'Création...' : 'Créer et activer'}
      </button>
    </form>
  )
}

export function FeeStructureForm({ classes }: { classes: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(upsertFeeStructure, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Grille tarifaire</h2>
      <select
        name="classId"
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      >
        <option value="">— Sélectionner une classe —</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="totalAmount"
        min={1}
        required
        placeholder="Montant annuel (FCFA)"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="number"
        name="installments"
        defaultValue={3}
        min={1}
        placeholder="Nombre de tranches"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">Grille enregistrée.</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? 'Enregistrement...' : 'Enregistrer la grille'}
      </button>
    </form>
  )
}
