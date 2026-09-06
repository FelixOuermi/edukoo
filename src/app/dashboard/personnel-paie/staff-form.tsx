'use client'

import { useActionState, useState, useTransition } from 'react'
import { createStaffMember, deactivateStaffMember } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.payrollPage

interface TeacherOption {
  id: string
  name: string
}

export function NewStaffMemberForm({ teachers }: { teachers: TeacherOption[] }) {
  const [state, formAction, pending] = useActionState(createStaffMember, null)
  const [name, setName] = useState('')

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-xl">
      <h2 className="font-semibold text-gray-900">{t.addStaffMember}</h2>

      {teachers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.linkToTeacher}</label>
          <select
            name="teacherId"
            defaultValue=""
            onChange={(e) => {
              const selected = teachers.find((tc) => tc.id === e.target.value)
              if (selected) setName(selected.name)
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="">{t.linkToTeacherNone}</option>
            {teachers.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>

      <div>
        <input
          type="text"
          name="roleTitle"
          placeholder={t.roleTitlePlaceholder}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="phone"
          placeholder={t.phoneOptional}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="number"
          name="monthlySalary"
          min={1}
          placeholder={t.monthlySalaryFcfa}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t.staffSaved}</p>}
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

export function DeactivateStaffButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDeactivate() {
    setError(null)
    startTransition(async () => {
      const result = await deactivateStaffMember(id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={handleDeactivate}
        className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
      >
        {t.deactivate}
      </button>
    </span>
  )
}
