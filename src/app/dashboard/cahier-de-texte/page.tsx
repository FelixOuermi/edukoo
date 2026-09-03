import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { NewLessonLogForm, DeleteLessonLogButton } from './lesson-form'

export default async function CahierDeTextePage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; matiere?: string }>
}) {
  const { classe, matiere } = await searchParams
  const { school, role, teacherId } = await getCurrentSchool()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.lessonLogPage
  const isDirector = role === 'director'

  const [{ data: allClasses }, { data: allSubjects }, { data: assignments }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
    supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name'),
    isDirector
      ? Promise.resolve({ data: [] as { class_id: string; subject_id: string }[] })
      : supabase.from('teacher_subjects').select('class_id, subject_id').eq('teacher_id', teacherId),
  ])

  const assignedClassIds = new Set((assignments ?? []).map((a) => a.class_id))
  const assignedSubjectIdsByClass = new Map<string, Set<string>>()
  for (const a of assignments ?? []) {
    const set = assignedSubjectIdsByClass.get(a.class_id) ?? new Set<string>()
    set.add(a.subject_id)
    assignedSubjectIdsByClass.set(a.class_id, set)
  }

  const classes = isDirector ? (allClasses ?? []) : (allClasses ?? []).filter((c) => assignedClassIds.has(c.id))
  const classId = classe || classes[0]?.id
  const subjects = isDirector
    ? (allSubjects ?? [])
    : (allSubjects ?? []).filter((s) => classId && assignedSubjectIdsByClass.get(classId)?.has(s.id))
  const subjectId = matiere || subjects[0]?.id

  const hasNoAssignment = !isDirector && assignedClassIds.size === 0

  const { data: logsRaw } =
    classId && subjectId
      ? await supabase
          .from('lesson_logs')
          .select('id, lesson_date, lesson_content, homework, homework_due_date, teachers(name)')
          .eq('class_id', classId)
          .eq('subject_id', subjectId)
          .order('lesson_date', { ascending: false })
      : { data: null }

  const logs = (logsRaw ?? []) as unknown as {
    id: string
    lesson_date: string
    lesson_content: string
    homework: string | null
    homework_due_date: string | null
    teachers: { name: string } | null
  }[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      {hasNoAssignment ? (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          {t.noAssignment}
        </p>
      ) : (
        <>
          <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <select
              name="classe"
              defaultValue={classId ?? ''}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              name="matiere"
              defaultValue={subjectId ?? ''}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
              {dict.common.show}
            </button>
          </form>

          {classId && subjectId ? (
            <>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t.tableDate}</th>
                      <th className="px-4 py-3 font-medium">{t.tableLesson}</th>
                      <th className="px-4 py-3 font-medium">{t.tableHomework}</th>
                      <th className="px-4 py-3 font-medium">{t.tableTeacher}</th>
                      <th className="px-4 py-3 font-medium text-right">{t.tableActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(logs ?? []).map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(l.lesson_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{l.lesson_content}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {l.homework ? (
                            <>
                              {l.homework}
                              {l.homework_due_date && (
                                <span className="text-gray-400">
                                  {' '}
                                  ({t.forDateTemplate.replace('{date}', new Date(l.homework_due_date).toLocaleDateString('fr-FR'))})
                                </span>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{l.teachers?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <DeleteLessonLogButton id={l.id} />
                        </td>
                      </tr>
                    ))}
                    {(logs ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          {t.noEntries}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <NewLessonLogForm
                key={`${classId}:${subjectId}`}
                classes={classes}
                subjects={subjects}
                defaultClassId={classId}
                defaultSubjectId={subjectId}
              />
            </>
          ) : (
            <p className="text-sm text-gray-400">{t.createClassAndSubjectFirst}</p>
          )}
        </>
      )}
    </div>
  )
}
