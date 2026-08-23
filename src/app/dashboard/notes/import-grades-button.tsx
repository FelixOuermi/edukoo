'use client'

import { useActionState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { importGradesFromExcel } from './actions'

const initialState: {
  error?: string
  success?: boolean
  count?: number
  unmatchedStudents?: number
  invalidScores?: number
} = {}

export function ImportGradesButton({
  classId,
  subjectId,
  trimester,
  gradeTypeNames,
}: {
  classId: string
  subjectId: string
  trimester: number
  gradeTypeNames: string[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(async (_prev: typeof initialState, formData: FormData) => {
    const result = await importGradesFromExcel(formData)
    formRef.current?.reset()
    return result
  }, initialState)

  return (
    <div className="flex flex-col gap-1">
      <form ref={formRef} action={formAction} className="inline-flex items-center gap-2">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="subjectId" value={subjectId} />
        <input type="hidden" name="trimester" value={trimester} />
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
      {state?.error && <p className="text-xs text-red-600 max-w-xs">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-emerald-600">
          {state.count} note(s) importée(s)
          {state.unmatchedStudents ? `, ${state.unmatchedStudents} élève(s) non reconnu(s)` : ''}
          {state.invalidScores ? `, ${state.invalidScores} valeur(s) invalide(s) ignorée(s)` : ''}.
        </p>
      )}
      <p className="text-[11px] text-gray-400 max-w-[240px]">
        Colonnes attendues : Matricule (ou Nom + Prenom), puis une colonne par type de note : {gradeTypeNames.join(', ') || '—'}
      </p>
    </div>
  )
}
