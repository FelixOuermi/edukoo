'use client'

import { useMemo, useState, useTransition } from 'react'
import { MessageCircle } from 'lucide-react'
import { saveAbsences } from './actions'
import { getDictionary } from '@/lib/i18n'
import { enqueueWrite, formDataToFields } from '@/lib/offline-queue'

const dict = getDictionary()
const t = dict.absencesPage

interface StudentRow {
  id: string
  name: string
  parentName: string | null
  parentWhatsapp: string | null
  wasAbsent: boolean
  wasJustified: boolean
  totalAbsences: number
}

export function AbsencesForm({
  classId,
  date,
  schoolName,
  students,
}: {
  classId: string
  date: string
  schoolName: string
  students: StudentRow[]
}) {
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<{ error?: string; success?: boolean; count?: number; queued?: boolean } | null>(null)
  const [absent, setAbsent] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s.id, s.wasAbsent]))
  )
  const [justified, setJustified] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s.id, s.wasJustified]))
  )

  // État vu à l'écran au chargement de la page — snapshot envoyé avec une
  // saisie mise en attente hors-ligne pour permettre au serveur de
  // détecter un conflit à la synchronisation (src/lib/offline-queue.ts).
  const initialSnapshot = useMemo(() => {
    const map: Record<string, string> = {}
    for (const s of students) map[s.id] = `${s.wasAbsent}:${s.wasJustified}`
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await saveAbsences(null, fd)
        setState(result)
      } catch {
        // Échec réseau (hors-ligne, ou navigator.onLine a menti) : on met
        // la saisie en attente plutôt que de la perdre.
        enqueueWrite({ kind: 'absences', fields: formDataToFields(fd), snapshot: initialSnapshot })
        setState({ queued: true })
      }
    })
  }

  const absentStudents = students.filter((s) => absent[s.id])
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="date" value={date} />

        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-medium">{t.tableStudent}</th>
              <th className="px-4 py-3 font-medium text-center">{t.tableAbsent}</th>
              <th className="px-4 py-3 font-medium text-center">{t.tableJustified}</th>
              <th className="px-4 py-3 font-medium text-right">{t.tableYearAbsences}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-gray-800">
                  {s.name}
                  <input type="hidden" name="studentId" value={s.id} />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    name={`absent_${s.id}`}
                    checked={absent[s.id] ?? false}
                    onChange={(e) => setAbsent((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                    className="w-4 h-4 accent-[#7c3aed]"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    name={`justified_${s.id}`}
                    disabled={!absent[s.id]}
                    checked={justified[s.id] ?? false}
                    onChange={(e) => setJustified((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                    className="w-4 h-4 accent-[#7c3aed] disabled:opacity-30"
                  />
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{s.totalAbsences}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  {t.noStudentsInClass}
                </td>
              </tr>
            )}
          </tbody>
        </table></div>

        <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-4">
          <button
            type="submit"
            disabled={pending || students.length === 0}
            className="bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {pending ? t.saving : t.saveAbsences}
          </button>
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
          {state?.success && (
            <span className="text-sm text-emerald-600">{t.absencesSavedTemplate.replace('{count}', String(state.count))}</span>
          )}
          {state?.queued && <span className="text-sm text-amber-600">{dict.offline.queuedNotice}</span>}
        </div>
      </form>

      {absentStudents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3">{t.notifyParentsWhatsapp}</h2>
          <ul className="space-y-2">
            {absentStudents.map((s) => {
              const message = t.whatsappMessageTemplate
                .replace('{name}', s.name)
                .replace('{date}', formattedDate)
                .replace('{school}', schoolName)
              const phone = (s.parentWhatsapp ?? '').replace(/[^\d+]/g, '')
              const waLink = phone
                ? `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`
                : null
              return (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {s.name} <span className="text-gray-400">({s.parentName ?? dict.studentProfile.parent})</span>
                  </span>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-medium"
                    >
                      <MessageCircle className="w-4 h-4" /> {t.notify}
                    </a>
                  ) : (
                    <span className="text-gray-300 text-xs">{t.noWhatsapp}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
