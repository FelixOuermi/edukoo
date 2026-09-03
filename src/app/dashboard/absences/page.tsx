import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { AbsencesForm } from './absences-form'

export default async function AbsencesPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; date?: string }>
}) {
  const { classe, date } = await searchParams
  const { school, role, teacherId } = await getCurrentSchool()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.absencesPage
  const isDirector = role === 'director'

  const [{ data: allClasses }, { data: assignments }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
    isDirector
      ? Promise.resolve({ data: [] as { class_id: string }[] })
      : supabase.from('teacher_subjects').select('class_id').eq('teacher_id', teacherId),
  ])

  const assignedClassIds = new Set((assignments ?? []).map((a) => a.class_id))
  const classes = isDirector ? (allClasses ?? []) : (allClasses ?? []).filter((c) => assignedClassIds.has(c.id))

  const classId = classe || classes[0]?.id
  const selectedDate = date || new Date().toISOString().slice(0, 10)

  let students: {
    id: string
    name: string
    parentName: string | null
    parentWhatsapp: string | null
    wasAbsent: boolean
    wasJustified: boolean
    totalAbsences: number
  }[] = []

  if (classId) {
    const [{ data: classStudents }, { data: dayAbsences }, { data: allAbsences }] = await Promise.all([
      supabase
        .from('students')
        .select('id, first_name, last_name, parent_name, parent_whatsapp')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('last_name'),
      supabase
        .from('absences')
        .select('student_id, is_justified')
        .eq('class_id', classId)
        .eq('absence_date', selectedDate),
      supabase.from('absences').select('student_id').eq('class_id', classId).eq('school_id', school.id),
    ])

    const dayMap = new Map((dayAbsences ?? []).map((a) => [a.student_id, a.is_justified]))
    const countMap = new Map<string, number>()
    for (const a of allAbsences ?? []) {
      countMap.set(a.student_id, (countMap.get(a.student_id) ?? 0) + 1)
    }

    students = (classStudents ?? []).map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      parentName: s.parent_name,
      parentWhatsapp: s.parent_whatsapp,
      wasAbsent: dayMap.has(s.id),
      wasJustified: dayMap.get(s.id) ?? false,
      totalAbsences: countMap.get(s.id) ?? 0,
    }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

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
        <input
          type="date"
          name="date"
          defaultValue={selectedDate}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
          {dict.common.show}
        </button>
      </form>

      {classId ? (
        <AbsencesForm
          key={students.map((s) => `${s.id}:${s.wasAbsent}:${s.wasJustified}`).join(',')}
          classId={classId}
          date={selectedDate}
          schoolName={school.name}
          students={students}
        />
      ) : !isDirector ? (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          {t.noAssignment}
        </p>
      ) : (
        <p className="text-sm text-gray-400">{t.createClassFirst}</p>
      )}
    </div>
  )
}
