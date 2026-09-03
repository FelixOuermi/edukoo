'use client'

import { useActionState } from 'react'
import { saveTeacherAssignments } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.teachersPage

interface Subject {
  id: string
  name: string
}

export function TeacherAssignmentForm({
  teacherId,
  classId,
  subjects,
  assignedSubjectIds,
}: {
  teacherId: string
  classId: string
  subjects: Subject[]
  assignedSubjectIds: string[]
}) {
  const [state, formAction, pending] = useActionState(saveTeacherAssignments, null)
  const assignedSet = new Set(assignedSubjectIds)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="classId" value={classId} />
      {subjects.length === 0 ? (
        <p className="text-sm text-gray-400">{t.noSubjectsCreated}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {subjects.map((s) => (
            <label key={s.id} className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <input type="checkbox" name="subjectId" value={s.id} defaultChecked={assignedSet.has(s.id)} className="accent-[#7c3aed]" />
              {s.name}
            </label>
          ))}
        </div>
      )}
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">{t.assignmentSaved}</p>}
      <button
        type="submit"
        disabled={pending || subjects.length === 0}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.saving : t.saveAssignment}
      </button>
    </form>
  )
}
