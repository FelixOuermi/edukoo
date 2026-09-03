'use client'

import { useActionState, useState, useTransition } from 'react'
import { createLessonLog, deleteLessonLog } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.lessonLogPage

const initialState: { error?: string; success?: boolean } = {}

export function NewLessonLogForm({
  classes,
  subjects,
  defaultClassId,
  defaultSubjectId,
}: {
  classes: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  defaultClassId?: string
  defaultSubjectId?: string
}) {
  const [state, formAction, pending] = useActionState(createLessonLog, initialState)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.addEntry}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          name="classId"
          required
          defaultValue={defaultClassId ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="" disabled>
            {t.classPlaceholder}
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="subjectId"
          required
          defaultValue={defaultSubjectId ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="" disabled>
            {t.subjectPlaceholder}
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="lessonDate"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>
      <textarea
        name="lessonContent"
        placeholder={t.lessonPlaceholder}
        required
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <textarea
          name="homework"
          placeholder={t.homeworkPlaceholder}
          rows={2}
          className="sm:col-span-2 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.forDateLabel}</label>
          <input
            type="date"
            name="homeworkDueDate"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t.entryAdded}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.saving : dict.common.add}
      </button>
    </form>
  )
}

export function DeleteLessonLogButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteLessonLog(id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
      >
        {dict.common.delete}
      </button>
    </span>
  )
}
