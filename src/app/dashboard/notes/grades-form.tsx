'use client'

import { useMemo, useState, useTransition } from 'react'
import { saveGrades } from './actions'
import { getDictionary } from '@/lib/i18n'
import { enqueueWrite, formDataToFields } from '@/lib/offline-queue'
import { SubjectAppreciationCell } from './subject-appreciation-cell'

const dict = getDictionary()
const t = dict.notesPage

interface GradeType {
  id: string
  name: string
  weight: number
}

interface StudentRow {
  id: string
  name: string
  scores: Record<string, number | null>
  appreciation: string | null
}

export function GradesForm({
  classId,
  subjectId,
  trimester,
  gradeTypes,
  students,
}: {
  classId: string
  subjectId: string
  trimester: number
  gradeTypes: GradeType[]
  students: StudentRow[]
}) {
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<{ error?: string; success?: boolean; count?: number; queued?: boolean } | null>(null)
  const [scores, setScores] = useState<Record<string, Record<string, string>>>(
    Object.fromEntries(
      students.map((s) => [
        s.id,
        Object.fromEntries(
          gradeTypes.map((gt) => [gt.id, s.scores[gt.id] !== null ? String(s.scores[gt.id]) : ''])
        ),
      ])
    )
  )

  // Valeurs vues à l'écran au chargement de la page — snapshot envoyé avec
  // une saisie mise en attente hors-ligne pour permettre au serveur de
  // détecter un conflit à la synchronisation (src/lib/offline-queue.ts).
  const initialSnapshot = useMemo(() => {
    const map: Record<string, string> = {}
    for (const s of students) {
      for (const gt of gradeTypes) {
        const v = s.scores[gt.id]
        map[`${s.id}:${gt.id}`] = v !== null && v !== undefined ? String(v) : ''
      }
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await saveGrades(null, fd)
        setState(result)
      } catch {
        // Échec réseau (hors-ligne, ou navigator.onLine a menti) : on met
        // la saisie en attente plutôt que de la perdre.
        enqueueWrite({ kind: 'grades', fields: formDataToFields(fd), snapshot: initialSnapshot })
        setState({ queued: true })
      }
    })
  }

  function setScore(studentId: string, gradeTypeId: string, value: string) {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [gradeTypeId]: value },
    }))
  }

  function studentAverage(studentId: string): number | null {
    let totalWeight = 0
    let totalWeighted = 0
    for (const gt of gradeTypes) {
      const raw = scores[studentId]?.[gt.id]
      if (raw === undefined || raw === '') continue
      const value = Number(raw)
      if (Number.isNaN(value)) continue
      totalWeight += gt.weight
      totalWeighted += value * gt.weight
    }
    return totalWeight > 0 ? totalWeighted / totalWeight : null
  }

  const classAverage = useMemo(() => {
    const values = students.map((s) => studentAverage(s.id)).filter((v): v is number => v !== null)
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, students])

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="trimester" value={trimester} />

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm text-gray-600">
          {t.classAverage} : <span className="font-semibold text-gray-900">{classAverage !== null ? classAverage.toFixed(2) : '—'}/20</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-left border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 font-medium">{t.student}</th>
              {gradeTypes.map((gt) => (
                <th key={gt.id} className="px-4 py-2 font-medium w-28">
                  {gt.name}
                  <span className="text-gray-400 font-normal"> (×{gt.weight})</span>
                  <input type="hidden" name="gradeTypeId" value={gt.id} />
                </th>
              ))}
              <th className="px-4 py-2 font-medium w-24 text-right">{t.average}</th>
              <th className="px-4 py-2 font-medium">{t.subjectAppreciation}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">
                  {s.name}
                  <input type="hidden" name="studentId" value={s.id} />
                </td>
                {gradeTypes.map((gt) => (
                  <td key={gt.id} className="px-4 py-2">
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={20}
                      name={`score_${s.id}_${gt.id}`}
                      value={scores[s.id]?.[gt.id] ?? ''}
                      onChange={(e) => setScore(s.id, gt.id, e.target.value)}
                      className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-right text-gray-600 font-medium">
                  {studentAverage(s.id) !== null ? studentAverage(s.id)!.toFixed(2) : '—'}
                </td>
                <td className="px-4 py-2">
                  <SubjectAppreciationCell
                    classId={classId}
                    subjectId={subjectId}
                    studentId={s.id}
                    trimester={trimester}
                    initialValue={s.appreciation}
                  />
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={gradeTypes.length + 3} className="px-4 py-8 text-center text-gray-400">
                  {t.noStudentsInClass}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || students.length === 0}
          className="bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? t.saving : t.saveGrades}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.success && (
          <span className="text-sm text-emerald-600">{t.gradesSavedTemplate.replace('{count}', String(state.count))}</span>
        )}
        {state?.queued && <span className="text-sm text-amber-600">{dict.offline.queuedNotice}</span>}
      </div>
    </form>
  )
}
