'use client'

import { useActionState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { importStudentsFromExcel } from '@/app/dashboard/eleves/actions'

const initialState: { error?: string; success?: boolean; created?: number; skipped?: number } = {}

export function ImportExcelButton() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(async (_prev: typeof initialState, formData: FormData) => {
    const result = await importStudentsFromExcel(formData)
    formRef.current?.reset()
    return result
  }, initialState)

  return (
    <div className="flex flex-col gap-1">
      <form
        ref={formRef}
        action={formAction}
        className="inline-flex items-center gap-2"
      >
        <label className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg cursor-pointer text-gray-700">
          <Upload className="w-4 h-4" />
          {pending ? 'Import en cours...' : 'Importer Excel'}
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={pending}
            onChange={(e) => {
              if (e.target.files?.length) e.target.form?.requestSubmit()
            }}
          />
        </label>
      </form>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-emerald-600">
          {state.created} élève(s) importé(s), {state.skipped} ignoré(s).
        </p>
      )}
      <p className="text-[11px] text-gray-400 max-w-[220px]">
        Colonnes attendues : Prenom, Nom, DateNaissance, Classe, ParentNom, ParentTelephone,
        ParentWhatsapp, ParentEmail
      </p>
    </div>
  )
}
