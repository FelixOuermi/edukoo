import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { computeSchoolStatistics } from '@/lib/statistics'
import { getDictionary } from '@/lib/i18n'
import { MissingPrerequisiteNotice } from '@/components/missing-prerequisite-notice'

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ trimestre?: string }>
}) {
  const { trimestre } = await searchParams
  const { school, schoolYear } = await requireDirector()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.statisticsPage

  const { data: periods } = schoolYear
    ? await supabase.from('periods').select('number, name').eq('school_id', school.id).eq('school_year_id', schoolYear.id).order('number')
    : { data: [] as { number: number; name: string }[] }

  const trimester = Number(trimestre || 1)
  const periodOptions =
    (periods ?? []).length > 0 ? (periods ?? []).map((p) => ({ value: p.number, label: p.name })) : [1, 2, 3].map((n) => ({ value: n, label: `Trimestre ${n}` }))

  const { classStats, subjectStats, schoolAverage, schoolSuccessRate } = schoolYear
    ? await computeSchoolStatistics({ schoolId: school.id, schoolYearId: schoolYear.id, trimester })
    : { classStats: [], subjectStats: [], schoolAverage: null, schoolSuccessRate: null }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      {!schoolYear ? (
        <MissingPrerequisiteNotice
          message={t.noSchoolYear}
          actionLabel={dict.common.goToSettings}
          href="/dashboard/parametres#annees-scolaires"
          showAction={true}
        />
      ) : (
        <>
          <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
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
              {dict.common.show}
            </button>
            <a
              href={`/dashboard/statistiques/export?trimestre=${trimester}`}
              className="ml-auto inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> {t.exportExcel}
            </a>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">{schoolAverage !== null ? schoolAverage.toFixed(2) : '—'}/20</p>
              <p className="text-sm text-gray-500 mt-1">{t.schoolAverage}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-emerald-600">{schoolSuccessRate !== null ? `${schoolSuccessRate.toFixed(0)}%` : '—'}</p>
              <p className="text-sm text-gray-500 mt-1">{t.successRate}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">{t.classComparison}</h2>
            {classStats.length === 0 ? (
              <p className="text-sm text-gray-400">{t.noClassesWithGrades}</p>
            ) : (
              <ul className="space-y-3">
                {classStats.map((c) => (
                  <li key={c.classId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-800 font-medium">{c.className}</span>
                      <span className="text-gray-600">
                        {c.average !== null ? `${c.average.toFixed(2)}/20` : '—'}
                        {c.successRate !== null && (
                          <span className="text-gray-400"> · {t.successRateSuffixTemplate.replace('{rate}', c.successRate.toFixed(0))}</span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7c3aed]"
                        style={{ width: `${c.average !== null ? Math.min((c.average / 20) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">{t.subjectAverages}</h2>
            {subjectStats.length === 0 ? (
              <p className="text-sm text-gray-400">{t.noGradesThisPeriod}</p>
            ) : (
              <ul className="space-y-3">
                {subjectStats.map((s) => (
                  <li key={s.subjectName}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-800 font-medium">{s.subjectName}</span>
                      <span className="text-gray-600">{s.average.toFixed(2)}/20</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7c3aed]"
                        style={{ width: `${Math.min((s.average / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
