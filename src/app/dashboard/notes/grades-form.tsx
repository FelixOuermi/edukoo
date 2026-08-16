'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveGrades } from './actions'

interface StudentGrade {
  id: string
  name: string
  score: number | null
}

export function GradesForm({
  classId,
  subjectId,
  trimester,
  students,
}: {
  classId: string
  subjectId: string
  trimester: number
  students: StudentGrade[]
}) {
  const [state, formAction, pending] = useActionState(saveGrades, null)
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(students.map((s) => [s.id, s.score !== null ? String(s.score) : '']))
  )

  const average = useMemo(() => {
    const values = Object.values(scores)
      .filter((v) => v !== '')
      .map((v) => Number(v))
      .filter((v) => !Number.isNaN(v))
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }, [scores])

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="trimester" value={trimester} />

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm text-gray-600">
          Moyenne classe : <span className="font-semibold text-gray-900">{average !== null ? average.toFixed(2) : '—'}/20</span>
        </span>
      </div>

      <table className="w-full text-sm">
        <thead className="text-gray-500 text-left border-b border-gray-100">
          <tr>
            <th className="px-4 py-2 font-medium">Élève</th>
            <th className="px-4 py-2 font-medium w-32">Note / 20</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2 text-gray-800">
                {s.name}
                <input type="hidden" name="studentId" value={s.id} />
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  step="0.25"
                  min={0}
                  max={20}
                  name={`score_${s.id}`}
                  value={scores[s.id] ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                />
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                Aucun élève dans cette classe.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || students.length === 0}
          className="bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? 'Sauvegarde...' : 'Sauvegarder les notes'}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.success && <span className="text-sm text-emerald-600">{state.count} note(s) enregistrée(s).</span>}
      </div>
    </form>
  )
}
