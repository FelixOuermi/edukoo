import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { NewClassForm, NewSubjectForm, NewGradeTypeForm, DeleteGradeTypeButton, ClassCoefficientsForm } from './class-forms'

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ coefClasse?: string }>
}) {
  const { coefClasse } = await searchParams
  const { school, role } = await getCurrentSchool()
  const supabase = await createClient()
  const isDirector = role === 'director'

  const [{ data: classes }, { data: subjects }, { data: students }, { data: gradeTypes }] = await Promise.all([
    supabase.from('classes').select('id, name, level, max_students').eq('school_id', school.id).order('name'),
    supabase.from('subjects').select('id, name, coefficient').eq('school_id', school.id).order('name'),
    supabase.from('students').select('id, class_id').eq('school_id', school.id).eq('status', 'active'),
    supabase.from('grade_types').select('id, name, weight').eq('school_id', school.id).order('created_at'),
  ])

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
      <h1 className="text-2xl font-bold text-gray-900">Classes & Matières</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Classe</th>
                  <th className="px-4 py-3 font-medium">Niveau</th>
                  <th className="px-4 py-3 font-medium text-right">Effectif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(classes ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.level ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {countByClass.get(c.id) ?? 0} / {c.max_students}
                    </td>
                  </tr>
                ))}
                {(classes ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      Aucune classe créée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <NewClassForm />
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Matière</th>
                  <th className="px-4 py-3 font-medium text-right">Coefficient</th>
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
                      Aucune matière créée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <NewSubjectForm />
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Type de note</th>
                  <th className="px-4 py-3 font-medium text-right">Poids</th>
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
                      Aucun type de note créé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isDirector && <NewGradeTypeForm />}
        </div>
      </div>

      {isDirector && (classes ?? []).length > 0 && (subjects ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">Coefficients par classe</h2>
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
                Afficher
              </button>
            </form>
          </div>
          <p className="text-xs text-gray-400">
            Laisse le coefficient global (colonne « Matières » ci-dessus) si cette classe n&apos;a pas besoin d&apos;une valeur différente.
          </p>
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
