'use client'

import { useActionState, useState, useTransition } from 'react'
import { createDisciplinaryRecord, deleteDisciplinaryRecord } from './discipline-actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.studentProfile

interface DisciplinaryRecord {
  id: string
  type: 'remark' | 'warning' | 'detention' | 'suspension'
  description: string
  incident_date: string
  recorded_by: string
}

const typeLabel: Record<DisciplinaryRecord['type'], string> = {
  remark: t.disciplineRemark,
  warning: t.disciplineWarning,
  detention: t.disciplineDetention,
  suspension: t.disciplineSuspension,
}

const typeColor: Record<DisciplinaryRecord['type'], string> = {
  remark: 'bg-gray-100 text-gray-600',
  warning: 'bg-amber-100 text-amber-700',
  detention: 'bg-orange-100 text-orange-700',
  suspension: 'bg-rose-100 text-rose-700',
}

const initialState: { error?: string; success?: boolean } = {}

export function DisciplineSection({ studentId, records }: { studentId: string; records: DisciplinaryRecord[] }) {
  const [state, formAction, pending] = useActionState(createDisciplinaryRecord, initialState)
  const [removing, startRemoving] = useTransition()
  const [removeError, setRemoveError] = useState<string | null>(null)

  function handleDelete(id: string) {
    setRemoveError(null)
    startRemoving(async () => {
      const result = await deleteDisciplinaryRecord(id, studentId)
      if (result?.error) setRemoveError(result.error)
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{t.disciplineTitle}</h2>

      {records.length === 0 ? (
        <p className="text-sm text-gray-400">{t.noDiscipline}</p>
      ) : (
        <ul className="text-sm divide-y divide-gray-100">
          {records.map((r) => (
            <li key={r.id} className="py-2 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[r.type]}`}>
                    {typeLabel[r.type]}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(r.incident_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-gray-700">{r.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.recordedBy} {r.recorded_by}</p>
              </div>
              <button
                type="button"
                disabled={removing}
                onClick={() => handleDelete(r.id)}
                className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50 shrink-0"
              >
                {dict.common.delete}
              </button>
            </li>
          ))}
        </ul>
      )}
      {removeError && <p className="text-sm text-red-600">{removeError}</p>}

      <form action={formAction} className="space-y-3 pt-3 border-t border-gray-100">
        <input type="hidden" name="studentId" value={studentId} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            name="type"
            defaultValue="remark"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="remark">{t.disciplineRemark}</option>
            <option value="warning">{t.disciplineWarning}</option>
            <option value="detention">{t.disciplineDetention}</option>
            <option value="suspension">{t.disciplineSuspension}</option>
          </select>
          <input
            type="date"
            name="incidentDate"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <textarea
          name="description"
          placeholder={t.descriptionPlaceholder}
          required
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600">{t.recorded}</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? dict.common.saving : dict.common.add}
        </button>
      </form>
    </div>
  )
}
