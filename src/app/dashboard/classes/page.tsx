import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { NewClassForm, NewSubjectForm } from './class-forms'

export default async function ClassesPage() {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const [{ data: classes }, { data: subjects }, { data: students }] = await Promise.all([
    supabase.from('classes').select('id, name, level, max_students').eq('school_id', school.id).order('name'),
    supabase.from('subjects').select('id, name, coefficient').eq('school_id', school.id).order('name'),
    supabase.from('students').select('id, class_id').eq('school_id', school.id).eq('status', 'active'),
  ])

  const countByClass = new Map<string, number>()
  for (const s of students ?? []) {
    if (s.class_id) countByClass.set(s.class_id, (countByClass.get(s.class_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Classes & Matières</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  )
}
