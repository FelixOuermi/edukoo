'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { updateSchoolInfo, createSchoolYear, upsertFeeStructure, setCurrentSchoolYear, uploadSchoolLogo } from './actions'

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

export function ActivateSchoolYearButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await setCurrentSchoolYear(id) })}
      className="text-xs font-medium text-[#7c3aed] hover:underline disabled:opacity-50"
    >
      {pending ? 'Activation...' : 'Activer'}
    </button>
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

const initialLogoState: { error?: string; success?: boolean; logoUrl?: string } = {}

export function LogoUploadForm({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl)
  const [state, formAction, pending] = useActionState(async (_prev: typeof initialLogoState, formData: FormData) => {
    const result = await uploadSchoolLogo(_prev, formData)
    if (result?.logoUrl) setPreview(result.logoUrl)
    formRef.current?.reset()
    return result
  }, initialLogoState)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Logo de l&apos;école</h2>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo de l'école" className="w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] text-gray-400 text-center px-1">Aucun logo</span>
          )}
        </div>
        <form ref={formRef} action={formAction} className="flex-1 space-y-2">
          <label className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer text-gray-700">
            {pending ? 'Envoi...' : 'Choisir une image'}
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              disabled={pending}
              onChange={(e) => e.target.files?.length && e.target.form?.requestSubmit()}
            />
          </label>
          <p className="text-[11px] text-gray-400">PNG, JPEG, WebP ou SVG — 2 Mo maximum. Utilisé sur les bulletins et reçus PDF.</p>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state?.success && <p className="text-xs text-emerald-600">Logo mis à jour.</p>}
        </form>
      </div>
    </div>
  )
}
