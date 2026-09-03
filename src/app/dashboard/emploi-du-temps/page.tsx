import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { DAY_LABELS, SCHOOL_DAYS } from '@/lib/timetable'
import { getDictionary } from '@/lib/i18n'
import { NewSlotForm, DeleteSlotButton } from './timetable-form'

interface Slot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  room: string | null
  subjects: { name: string } | null
  teachers: { name: string } | null
  classes: { name: string } | null
}

export default async function EmploiDuTempsPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>
}) {
  const { classe } = await searchParams
  const { school, role, schoolYear, teacherId } = await getCurrentSchool()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.timetablePage
  const isDirector = role === 'director'

  const [{ data: classes }, { data: subjects }, { data: teachers }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
    supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name'),
    isDirector
      ? supabase.from('teachers').select('id, name').eq('school_id', school.id).eq('is_active', true).order('name')
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const selectedClassId = classe || classes?.[0]?.id

  let slots: Slot[] = []
  if (schoolYear) {
    let query = supabase
      .from('timetable_slots')
      .select('id, day_of_week, start_time, end_time, room, subjects(name), teachers(name), classes(name)')
      .eq('school_id', school.id)
      .eq('school_year_id', schoolYear.id)
      .order('day_of_week')
      .order('start_time')

    query = isDirector ? query.eq('class_id', selectedClassId ?? '') : query.eq('teacher_id', teacherId)

    const { data } = await query
    slots = (data ?? []) as unknown as Slot[]
  }

  const slotsByDay = new Map<number, Slot[]>()
  for (const slot of slots) {
    const list = slotsByDay.get(slot.day_of_week) ?? []
    list.push(slot)
    slotsByDay.set(slot.day_of_week, list)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      {!schoolYear ? (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          {t.noSchoolYear}
        </p>
      ) : (
        <>
          {isDirector ? (
            <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
              <select
                name="classe"
                defaultValue={selectedClassId ?? ''}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              >
                {(classes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                {dict.common.show}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">{t.personalScheduleNote}</p>
          )}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.tableDay}</th>
                  <th className="px-4 py-3 font-medium">{t.tableSchedule}</th>
                  {!isDirector && <th className="px-4 py-3 font-medium">{t.tableClass}</th>}
                  <th className="px-4 py-3 font-medium">{t.tableSubject}</th>
                  {isDirector && <th className="px-4 py-3 font-medium">{t.tableTeacher}</th>}
                  <th className="px-4 py-3 font-medium">{t.tableRoom}</th>
                  {isDirector && <th className="px-4 py-3 font-medium text-right">{t.tableActions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SCHOOL_DAYS.flatMap((day) => {
                  const daySlots = slotsByDay.get(day) ?? []
                  return daySlots.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-4 py-3 text-gray-900 font-medium">{DAY_LABELS[day]}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                      </td>
                      {!isDirector && <td className="px-4 py-3 text-gray-600">{slot.classes?.name ?? '—'}</td>}
                      <td className="px-4 py-3 text-gray-600">{slot.subjects?.name ?? '—'}</td>
                      {isDirector && <td className="px-4 py-3 text-gray-600">{slot.teachers?.name ?? '—'}</td>}
                      <td className="px-4 py-3 text-gray-600">{slot.room ?? '—'}</td>
                      {isDirector && (
                        <td className="px-4 py-3 text-right">
                          <DeleteSlotButton id={slot.id} />
                        </td>
                      )}
                    </tr>
                  ))
                })}
                {slots.length === 0 && (
                  <tr>
                    <td colSpan={isDirector ? 6 : 4} className="px-4 py-8 text-center text-gray-400">
                      {t.noSlots}
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </div>

          {isDirector && (classes ?? []).length > 0 && (subjects ?? []).length > 0 && (
            <NewSlotForm
              classes={classes ?? []}
              subjects={subjects ?? []}
              teachers={teachers ?? []}
              defaultClassId={selectedClassId}
            />
          )}
        </>
      )}
    </div>
  )
}
