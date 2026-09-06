import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import {
  NewClassForm,
  NewSubjectForm,
  NewGradeTypeForm,
  DeleteGradeTypeButton,
  ClassCoefficientsForm,
  NewEducationCycleForm,
  NewEducationLevelForm,
  DeleteEducationLevelButton,
  AssignClassLevelSelect,
} from './class-forms'

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ coefClasse?: string }>
}) {
  const { coefClasse } = await searchParams
  const { school, role } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().classesPage
  const isDirector = role === 'director'

  const [{ data: classes }, { data: subjects }, { data: students }, { data: gradeTypes }, { data: cyclesData }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, level, max_students, education_level_id, education_levels(name, cycle_id)')
      .eq('school_id', school.id)
      .order('name'),
    supabase.from('subjects').select('id, name, coefficient').eq('school_id', school.id).order('name'),
    supabase.from('students').select('id, class_id').eq('school_id', school.id).eq('status', 'active'),
    supabase.from('grade_types').select('id, name, weight').eq('school_id', school.id).order('created_at'),
    supabase
      .from('education_cycles')
      .select('id, name, education_levels(id, name)')
      .eq('school_id', school.id)
      .order('display_order'),
  ])

  const cycles = (cyclesData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    levels: ((c.education_levels ?? []) as { id: string; name: string }[]).slice(),
  }))
  const cycleNameByLevelId = new Map<string, string>()
  for (const cycle of cycles) {
    for (const level of cycle.levels) cycleNameByLevelId.set(level.id, cycle.name)
  }

  const countByClass = new Map<string, number>()
  for (const s of students ?? []) {
    if (s.class_id) countByClass.set(s.class_id, (countByClass.get(s.class_id) ?? 0) + 1)
  }

  const selectedClassId = coefClasse || classes?.[0]?.id
  let coefficientOverrides: Record<string, number> = {}
  if (isDirector && selectedClassId) {
    const { data: overrides } = await supabase
      .from('class_subjects')
      .select('subject_id, coefficient')
      .eq('school_id', school.id)
      .eq('class_id', selectedClassId)
    coefficientOverrides = Object.fromEntries((overrides ?? []).map((o) => [o.subject_id, o.coefficient]))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.tableClass}</th>
                  <th className="px-4 py-3 font-medium">{t.tableCycle}</th>
                  <th className="px-4 py-3 font-medium">{t.tableLevel}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.tableHeadcount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(classes ?? []).map((c) => {
                  const level = c.education_levels as unknown as { name: string; cycle_id: string } | null
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3 text-gray-900 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{level ? cycleNameByLevelId.get(c.education_level_id ?? '') ?? '—' : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {isDirector ? (
                          <AssignClassLevelSelect classId={c.id} currentLevelId={c.education_level_id} cycles={cycles} />
                        ) : (
                          (level?.name ?? c.level ?? t.noLevel)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {countByClass.get(c.id) ?? 0} / {c.max_students}
                      </td>
                    </tr>
                  )
                })}
                {(classes ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      {t.noClasses}
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </div>
          <NewClassForm cycles={cycles} />
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.tableSubject}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.tableCoefficient}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(subjects ?? []).map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{s.coefficient}</td>
                  </tr>
                ))}
                {(subjects ?? []).length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                      {t.noSubjects}
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </div>
          <NewSubjectForm />
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.tableGradeType}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.tableWeight}</th>
                  {isDirector && <th className="px-4 py-3 font-medium text-right"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(gradeTypes ?? []).map((gt) => (
                  <tr key={gt.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium">{gt.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">×{gt.weight}</td>
                    {isDirector && (
                      <td className="px-4 py-3">
                        <DeleteGradeTypeButton id={gt.id} />
                      </td>
                    )}
                  </tr>
                ))}
                {(gradeTypes ?? []).length === 0 && (
                  <tr>
                    <td colSpan={isDirector ? 3 : 2} className="px-4 py-8 text-center text-gray-400">
                      {t.noGradeTypes}
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </div>
          {isDirector && <NewGradeTypeForm />}
        </div>
      </div>

      {isDirector && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">{t.cyclesAndLevels}</h2>
            <p className="text-xs text-gray-400 mt-1">{t.cyclesAndLevelsHint}</p>
          </div>
          <div className="space-y-3">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="flex flex-wrap items-start gap-2 text-sm">
                <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-medium whitespace-nowrap">{cycle.name}</span>
                <div className="flex flex-wrap gap-1.5">
                  {cycle.levels.map((level) => (
                    <span key={level.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 text-gray-600">
                      {level.name}
                      <DeleteEducationLevelButton id={level.id} />
                    </span>
                  ))}
                  {cycle.levels.length === 0 && <span className="text-gray-400 text-xs py-1">—</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <NewEducationCycleForm />
            <NewEducationLevelForm cycles={cycles.map((c) => ({ id: c.id, name: c.name }))} />
          </div>
        </div>
      )}

      {isDirector && (classes ?? []).length > 0 && (subjects ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">{t.coefficientsByClass}</h2>
            <form method="get" className="flex items-center gap-2">
              <select
                name="coefClasse"
                defaultValue={selectedClassId ?? ''}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              >
                {(classes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                {getDictionary().common.show}
              </button>
            </form>
          </div>
          <p className="text-xs text-gray-400">{t.coefficientsHint}</p>
          {selectedClassId && (
            <ClassCoefficientsForm
              key={selectedClassId}
              classId={selectedClassId}
              subjects={(subjects ?? []).map((s) => ({
                id: s.id,
                name: s.name,
                defaultCoefficient: s.coefficient,
                overrideCoefficient: coefficientOverrides[s.id] ?? null,
              }))}
            />
          )}
        </div>
      )}
    </div>
  )
}
