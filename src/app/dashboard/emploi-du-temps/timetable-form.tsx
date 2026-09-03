'use client'

import { useActionState, useState, useTransition } from 'react'
import { createTimetableSlot, deleteTimetableSlot } from './actions'
import { DAY_LABELS, SCHOOL_DAYS } from '@/lib/timetable'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.timetablePage

const initialState: { error?: string; success?: boolean } = {}

export function NewSlotForm({
  classes,
  subjects,
  teachers,
  defaultClassId,
}: {
  classes: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  teachers: { id: string; name: string }[]
  defaultClassId?: string
}) {
  const [state, formAction, pending] = useActionState(createTimetableSlot, initialState)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{t.addSlot}</h2>
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
          defaultValue=""
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
        <select
          name="teacherId"
          defaultValue=""
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="">{t.teacherOptional}</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
        <select
          name="dayOfWeek"
          required
          defaultValue=""
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="" disabled>
            {t.dayPlaceholder}
          </option>
          {SCHOOL_DAYS.map((d) => (
            <option key={d} value={d}>
              {DAY_LABELS[d]}
            </option>
          ))}
        </select>
        <input
          type="time"
          name="startTime"
          required
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="time"
          name="endTime"
          required
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="text"
          name="room"
          placeholder={t.roomOptional}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] sm:col-span-2"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t.slotAdded}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.adding : dict.common.add}
      </button>
    </form>
  )
}

export function DeleteSlotButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteTimetableSlot(id)
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
        {t.remove}
      </button>
    </span>
  )
}
