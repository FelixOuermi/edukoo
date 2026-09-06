'use client'

import { useActionState } from 'react'
import { updateStudent } from '../../actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary().students

interface StudentData {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  class_id: string | null
  status: string
  parent_name: string | null
  parent_phone: string | null
  parent_whatsapp: string | null
  parent_email: string | null
}

export function EditStudentForm({ student, classes }: { student: StudentData; classes: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(updateStudent, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <input type="hidden" name="studentId" value={student.id} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.firstName}</label>
          <input
            type="text"
            name="firstName"
            defaultValue={student.first_name}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.lastName}</label>
          <input
            type="text"
            name="lastName"
            defaultValue={student.last_name}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.birthDate}</label>
          <input
            type="date"
            name="birthDate"
            defaultValue={student.birth_date ?? ''}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.classLabel}</label>
          <select
            name="classId"
            defaultValue={student.class_id ?? ''}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.statusFieldLabel}</label>
          <select
            name="status"
            defaultValue={student.status}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="active">{t.statusActive}</option>
            <option value="suspended">{t.statusSuspended}</option>
            <option value="left">{t.statusLeft}</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{t.parentSectionTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.parentName}</label>
            <input
              type="text"
              name="parentName"
              defaultValue={student.parent_name ?? ''}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
            <input
              type="tel"
              name="parentPhone"
              defaultValue={student.parent_phone ?? ''}
              placeholder="+225 ..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.whatsapp}</label>
            <input
              type="tel"
              name="parentWhatsapp"
              defaultValue={student.parent_whatsapp ?? ''}
              placeholder="+225 ..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
            <input
              type="email"
              name="parentEmail"
              defaultValue={student.parent_email ?? ''}
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
        {pending ? t.saving : t.editSubmit}
      </button>
    </form>
  )
}
