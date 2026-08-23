import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { computeClassBulletins } from '@/lib/bulletin'
import { AppreciationCell } from './appreciation-cell'
import { Download } from 'lucide-react'

export default async function BulletinsPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; trimestre?: string }>
}) {
  const { classe, trimestre } = await searchParams
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  const [{ data: classes }, { data: periods }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
    schoolYear
      ? supabase.from('periods').select('number, name').eq('school_id', school.id).eq('school_year_id', schoolYear.id).order('number')
      : Promise.resolve({ data: [] as { number: number; name: string }[] }),
  ])

  const classId = classe || classes?.[0]?.id
  const trimester = Number(trimestre || 1)
  const periodOptions =
    (periods ?? []).length > 0
      ? (periods ?? []).map((p) => ({ value: p.number, label: p.name }))
      : [1, 2, 3].map((n) => ({ value: n, label: `Trimestre ${n}` }))

  const result =
    classId && schoolYear
      ? await computeClassBulletins({
          schoolId: school.id,
          classId,
          schoolYearId: schoolYear.id,
          trimester,
        })
      : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bulletins</h1>

      <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <select
          name="classe"
          defaultValue={classId ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          {(classes ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="trimestre"
          defaultValue={String(trimester)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          {periodOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
          Afficher
        </button>

        {classId && (
          <a
            href={`/dashboard/bulletins/classe/${classId}/pdf?trimestre=${trimester}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Générer tous les bulletins (PDF)
          </a>
        )}
      </form>

      {!schoolYear ? (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Aucune année scolaire active. Configurez-la dans Paramètres.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium text-right">Moyenne</th>
                <th className="px-4 py-3 font-medium text-right">Rang</th>
                <th className="px-4 py-3 font-medium">Mention</th>
                <th className="px-4 py-3 font-medium text-right">
                  Absences ({result?.bulletins[0]?.absencesScope === 'period' ? 'période' : 'année'})
                </th>
                <th className="px-4 py-3 font-medium">Appréciation</th>
                <th className="px-4 py-3 font-medium text-right">Bulletin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(result?.bulletins ?? []).map((b) => (
                <tr key={b.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{b.studentName}</td>
                  <td className="px-4 py-3 text-right text-gray-800">
                    {b.average !== null ? b.average.toFixed(2) : '—'}/20
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{b.rank ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.mention}</td>
                  <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                    {b.absencesJustified + b.absencesUnjustified === 0
                      ? '—'
                      : `${b.absencesJustified + b.absencesUnjustified} (${b.absencesUnjustified} non just.)`}
                  </td>
                  <td className="px-4 py-3">
                    <AppreciationCell studentId={b.studentId} trimester={trimester} initialValue={b.appreciation} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/dashboard/bulletins/eleve/${b.studentId}/pdf?trimestre=${trimester}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#7c3aed] hover:underline text-sm font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                  </td>
                </tr>
              ))}
              {(result?.bulletins ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    Aucun élève dans cette classe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
