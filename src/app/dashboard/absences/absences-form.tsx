'use client'

import { useActionState, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { saveAbsences } from './actions'

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
  const [state, formAction, pending] = useActionState(saveAbsences, null)
  const [absent, setAbsent] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s.id, s.wasAbsent]))
  )
  const [justified, setJustified] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s.id, s.wasJustified]))
  )

  const absentStudents = students.filter((s) => absent[s.id])
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <form action={formAction} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="date" value={date} />

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-medium">Élève</th>
              <th className="px-4 py-3 font-medium text-center">Absent</th>
              <th className="px-4 py-3 font-medium text-center">Justifiée</th>
              <th className="px-4 py-3 font-medium text-right">Absences (année)</th>
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
            {pending ? 'Enregistrement...' : 'Enregistrer les absences'}
          </button>
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
          {state?.success && <span className="text-sm text-emerald-600">{state.count} absence(s) enregistrée(s).</span>}
        </div>
      </form>

      {absentStudents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Notifier les parents par WhatsApp</h2>
          <ul className="space-y-2">
            {absentStudents.map((s) => {
              const message = `Votre enfant ${s.name} a été absent(e) le ${formattedDate} à ${schoolName}. Merci de nous contacter.`
              const phone = (s.parentWhatsapp ?? '').replace(/[^\d+]/g, '')
              const waLink = phone
                ? `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`
                : null
              return (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {s.name} <span className="text-gray-400">({s.parentName ?? 'Parent'})</span>
                  </span>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-medium"
                    >
                      <MessageCircle className="w-4 h-4" /> Notifier
                    </a>
                  ) : (
                    <span className="text-gray-300 text-xs">Pas de WhatsApp</span>
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
