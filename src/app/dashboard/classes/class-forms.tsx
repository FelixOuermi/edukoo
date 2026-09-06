'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  createClass,
  createSubject,
  createGradeType,
  deleteGradeType,
  saveClassCoefficients,
  createEducationCycle,
  createEducationLevel,
  deleteEducationLevel,
  assignClassLevel,
} from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.classesPage

interface CycleOption {
  id: string
  name: string
  levels: { id: string; name: string }[]
}

export function NewClassForm({ cycles }: { cycles: CycleOption[] }) {
  const [state, formAction, pending] = useActionState(createClass, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.addClass}</h2>
      <input
        type="text"
        name="name"
        required
        placeholder={t.namePlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <select
        name="educationLevelId"
        defaultValue=""
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      >
        <option value="">{t.levelSelectPlaceholder}</option>
        {cycles.map((cycle) => (
          <optgroup key={cycle.id} label={cycle.name}>
            {cycle.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <input
        type="number"
        name="maxStudents"
        defaultValue={50}
        min={1}
        placeholder={t.maxStudentsPlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.adding : dict.common.add}
      </button>
    </form>
  )
}

export function NewEducationCycleForm() {
  const [state, formAction, pending] = useActionState(createEducationCycle, null)

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-start">
      <input
        type="text"
        name="name"
        required
        placeholder={t.cycleNamePlaceholder}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? t.adding : t.addCycle}
      </button>
      {state?.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
    </form>
  )
}

export function NewEducationLevelForm({ cycles }: { cycles: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createEducationLevel, null)

  if (cycles.length === 0) return null

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-start">
      <select
        name="cycleId"
        required
        defaultValue=""
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      >
        <option value="" disabled>
          {t.selectCyclePlaceholder}
        </option>
        {cycles.map((cycle) => (
          <option key={cycle.id} value={cycle.id}>
            {cycle.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="name"
        required
        placeholder={t.levelNamePlaceholder}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? t.adding : t.addLevel}
      </button>
      {state?.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
    </form>
  )
}

export function DeleteEducationLevelButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            const result = await deleteEducationLevel(id)
            if (result?.error) setError(result.error)
          })
        }
        className="text-xs text-gray-400 hover:text-rose-600 disabled:opacity-50"
        aria-label={dict.common.delete}
      >
        ×
      </button>
      {error && <p className="text-[11px] text-rose-600 ml-1">{error}</p>}
    </span>
  )
}

export function AssignClassLevelSelect({
  classId,
  currentLevelId,
  cycles,
}: {
  classId: string
  currentLevelId: string | null
  cycles: CycleOption[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [value, setValue] = useState(currentLevelId ?? '')

  return (
    <div>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value
          setValue(next)
          setError(null)
          startTransition(async () => {
            const result = await assignClassLevel(classId, next || null)
            if (result?.error) setError(result.error)
          })
        }}
        className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-60"
      >
        <option value="">{t.levelSelectNone}</option>
        {cycles.map((cycle) => (
          <optgroup key={cycle.id} label={cycle.name}>
            {cycle.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  )
}

export function NewSubjectForm() {
  const [state, formAction, pending] = useActionState(createSubject, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.addSubject}</h2>
      <input
        type="text"
        name="name"
        required
        placeholder={t.subjectNamePlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="number"
        name="coefficient"
        defaultValue={1}
        min={1}
        placeholder={t.coefficientPlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.adding : dict.common.add}
      </button>
    </form>
  )
}

export function NewGradeTypeForm() {
  const [state, formAction, pending] = useActionState(createGradeType, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.addGradeType}</h2>
      <input
        type="text"
        name="name"
        required
        placeholder={t.gradeTypeNamePlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="number"
        name="weight"
        defaultValue={1}
        min={0.5}
        step={0.5}
        placeholder={t.weightPlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.adding : dict.common.add}
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
        {dict.common.delete}
      </button>
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  )
}

interface CoefficientSubject {
  id: string
  name: string
  defaultCoefficient: number
  overrideCoefficient: number | null
}

export function ClassCoefficientsForm({ classId, subjects }: { classId: string; subjects: CoefficientSubject[] }) {
  const [state, formAction, pending] = useActionState(saveClassCoefficients, null)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="classId" value={classId} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-left border-b border-gray-100">
            <tr>
              <th className="py-2 font-medium">{t.tableSubject}</th>
              <th className="py-2 font-medium w-32">{t.tableCoefficient}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map((s) => (
              <tr key={s.id}>
                <td className="py-2 text-gray-800">
                  {s.name}
                  <input type="hidden" name="subjectId" value={s.id} />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    name={`coefficient_${s.id}`}
                    defaultValue={s.overrideCoefficient ?? s.defaultCoefficient}
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">{t.coefficientsSaved}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? dict.common.saving : t.saveCoefficients}
      </button>
    </form>
  )
}
