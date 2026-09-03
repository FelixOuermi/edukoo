'use client'

import { useActionState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { importGradesFromExcel } from './actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary().notesPage

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
          {pending ? t.importInProgress : t.importExcel}
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
          {t.gradesImportedTemplate.replace('{count}', String(state.count))}
          {state.unmatchedStudents ? t.unmatchedStudentsTemplate.replace('{count}', String(state.unmatchedStudents)) : ''}
          {state.invalidScores ? t.invalidScoresTemplate.replace('{count}', String(state.invalidScores)) : ''}.
        </p>
      )}
      <p className="text-[11px] text-gray-400 max-w-[240px]">
        {t.expectedColumns} {gradeTypeNames.join(', ') || '—'}
      </p>
    </div>
  )
}
