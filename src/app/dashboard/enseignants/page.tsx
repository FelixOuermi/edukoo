import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { InviteTeacherForm, TeacherRow } from './teacher-list'
import { TeacherAssignmentForm } from './assignment-form'

export default async function EnseignantsPage({
  searchParams,
}: {
  searchParams: Promise<{ affEnseignant?: string; affClasse?: string }>
}) {
  const { affEnseignant, affClasse } = await searchParams
  const { school, role } = await getCurrentSchool()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.teachersPage
  const isDirector = role === 'director'

  const [{ data: teachers }, { data: classes }, { data: subjects }] = await Promise.all([
    supabase.from('teachers').select('id, name, phone, email, role, is_active, user_id').eq('school_id', school.id).order('name'),
    isDirector ? supabase.from('classes').select('id, name').eq('school_id', school.id).order('name') : Promise.resolve({ data: [] }),
    isDirector ? supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name') : Promise.resolve({ data: [] }),
  ])

  const activeTeachers = (teachers ?? []).filter((t) => t.role === 'teacher')
  const selectedTeacherId = affEnseignant || activeTeachers[0]?.id
  const selectedClassId = affClasse || classes?.[0]?.id

  let assignedSubjectIds: string[] = []
  if (isDirector && selectedTeacherId && selectedClassId) {
    const { data: assigned } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('school_id', school.id)
      .eq('teacher_id', selectedTeacherId)
      .eq('class_id', selectedClassId)
    assignedSubjectIds = (assigned ?? []).map((a) => a.subject_id)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t.tableName}</th>
              <th className="px-4 py-3 font-medium">{t.tablePhone}</th>
              <th className="px-4 py-3 font-medium">{t.tableEmail}</th>
              <th className="px-4 py-3 font-medium">{t.tableRole}</th>
              <th className="px-4 py-3 font-medium">{t.tableStatus}</th>
              {isDirector && <th className="px-4 py-3 font-medium text-right">{t.tableActions}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(teachers ?? []).map((teacher) => (
              <TeacherRow key={teacher.id} teacher={teacher} canManage={isDirector} />
            ))}
            {(teachers ?? []).length === 0 && (
              <tr>
                <td colSpan={isDirector ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                  {t.noneRegistered}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isDirector && <InviteTeacherForm />}

      {isDirector && activeTeachers.length > 0 && (classes ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{t.assignClassesSubjects}</h2>
          <p className="text-xs text-gray-400">
            {t.assignHint}
          </p>
          <form method="get" className="flex flex-wrap gap-2">
            <select
              name="affEnseignant"
              defaultValue={selectedTeacherId ?? ''}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              {activeTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            <select
              name="affClasse"
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
              {dict.common.show}
            </button>
          </form>

          {selectedTeacherId && selectedClassId && (
            <TeacherAssignmentForm
              key={`${selectedTeacherId}:${selectedClassId}`}
              teacherId={selectedTeacherId}
              classId={selectedClassId}
              subjects={subjects ?? []}
              assignedSubjectIds={assignedSubjectIds}
            />
          )}
        </div>
      )}
    </div>
  )
}
