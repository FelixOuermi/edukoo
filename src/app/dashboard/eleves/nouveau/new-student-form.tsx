'use client'

import { useActionState } from 'react'
import { createStudent } from '../actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary().students

export function NewStudentForm({ classes }: { classes: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createStudent, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.firstName}</label>
          <input
            type="text"
            name="firstName"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.lastName}</label>
          <input
            type="text"
            name="lastName"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.birthDate}</label>
          <input
            type="date"
            name="birthDate"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.classLabel}</label>
          <select
            name="classId"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="">{t.selectPlaceholder}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-400">{t.registrationNumberNote}</p>

      <div className="border-t border-gray-100 pt-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{t.parentSectionTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.parentName}</label>
            <input
              type="text"
              name="parentName"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
            <input
              type="tel"
              name="parentPhone"
              placeholder="+225 ..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.whatsapp}</label>
            <input
              type="tel"
              name="parentWhatsapp"
              placeholder="+225 ..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
            <input
              type="email"
              name="parentEmail"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.enrolling : t.enrollSubmit}
      </button>
    </form>
  )
}
