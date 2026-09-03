import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStudent } from '@/lib/portal'
import { DAY_LABELS, SCHOOL_DAYS } from '@/lib/timetable'
import { getDictionary } from '@/lib/i18n'

export default async function EspaceElevePage() {
  const { student, schoolYear } = await getCurrentStudent()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.portal

  const [{ data: grades }, { data: absences }, { data: periods }, { data: timetable }] = await Promise.all([
    supabase
      .from('grades')
      .select('*, subjects(name, coefficient), grade_types(name)')
      .eq('student_id', student.id)
      .order('trimester'),
    supabase.from('absences').select('*').eq('student_id', student.id).order('absence_date', { ascending: false }),
    schoolYear
      ? supabase.from('periods').select('number, name').eq('school_year_id', schoolYear.id).order('number')
      : Promise.resolve({ data: [] as { number: number; name: string }[] }),
    schoolYear && student.class_id
      ? supabase
          .from('timetable_slots')
          .select('id, day_of_week, start_time, end_time, room, subjects(name), teachers(name)')
          .eq('class_id', student.class_id)
          .eq('school_year_id', schoolYear.id)
          .order('day_of_week')
          .order('start_time')
      : Promise.resolve({ data: null }),
  ])

  interface TimetableSlot {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    room: string | null
    subjects: { name: string } | null
    teachers: { name: string } | null
  }
  const timetableSlots = (timetable ?? []) as unknown as TimetableSlot[]

  const timetableByDay = new Map<number, TimetableSlot[]>()
  for (const slot of timetableSlots) {
    const list = timetableByDay.get(slot.day_of_week) ?? []
    list.push(slot)
    timetableByDay.set(slot.day_of_week, list)
  }

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, author_name, created_at')
    .eq('school_id', student.school_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: disciplinaryRecords } = await supabase
    .from('disciplinary_records')
    .select('id, type, description, incident_date')
    .eq('student_id', student.id)
    .order('incident_date', { ascending: false })

  const { data: lessonLogsRaw } = student.class_id
    ? await supabase
        .from('lesson_logs')
        .select('id, lesson_date, lesson_content, homework, homework_due_date, subjects(name)')
        .eq('class_id', student.class_id)
        .order('lesson_date', { ascending: false })
        .limit(10)
    : { data: null }

  const lessonLogs = (lessonLogsRaw ?? []) as unknown as {
    id: string
    lesson_date: string
    lesson_content: string
    homework: string | null
    homework_due_date: string | null
    subjects: { name: string } | null
  }[]

  const disciplineTypeLabel: Record<string, string> = {
    remark: dict.studentProfile.disciplineRemark,
    warning: dict.studentProfile.disciplineWarning,
    detention: dict.studentProfile.disciplineDetention,
    suspension: dict.studentProfile.disciplineSuspension,
  }

  const gradesByTrimester = new Map<number, typeof grades>()
  for (const g of grades ?? []) {
    const list = gradesByTrimester.get(g.trimester) ?? []
    list.push(g)
    gradesByTrimester.set(g.trimester, list)
  }

  const periodOptions =
    (periods ?? []).length > 0 ? periods! : [1, 2, 3].map((n) => ({ number: n, name: `Trimestre ${n}` }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {student.first_name} {student.last_name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {student.registration_number} · {(student.classes as { name: string } | null)?.name ?? dict.studentProfile.noClass}
        </p>
      </div>

      {(announcements ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">{t.schoolNews}</h2>
          {(announcements ?? []).map((a) => (
            <div key={a.id} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium text-gray-800">{a.title}</p>
              <p className="text-xs text-gray-400 mb-1">
                {a.author_name} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">{t.bulletinsTitle}</h2>
        <div className="flex flex-wrap gap-3">
          {periodOptions.map((p) => (
            <a
              key={p.number}
              href={`/espace-eleve/bulletin?trimestre=${p.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
            >
              <Download className="w-4 h-4" /> {p.name}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">{dict.timetablePage.title}</h2>
        {timetableSlots.length === 0 ? (
          <p className="text-sm text-gray-400">{t.noSlotsForYourClass}</p>
        ) : (
          <div className="space-y-4">
            {SCHOOL_DAYS.filter((d) => timetableByDay.has(d)).map((d) => (
              <div key={d}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{DAY_LABELS[d]}</h3>
                <ul className="text-sm divide-y divide-gray-100">
                  {(timetableByDay.get(d) ?? []).map((slot) => (
                    <li key={slot.id} className="py-2 flex items-center justify-between gap-3">
                      <span className="text-gray-700">
                        {slot.subjects?.name ?? '—'}
                        {slot.teachers?.name ? ` · ${slot.teachers.name}` : ''}
                      </span>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        {slot.room ? ` · ${slot.room}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{dict.studentProfile.gradesByTrimester}</h2>
          {periodOptions.map((p) => {
            const list = gradesByTrimester.get(p.number) ?? []
            return (
              <div key={p.number} className="mb-4 last:mb-0">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{p.name}</h3>
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400">{dict.studentProfile.noGrades}</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {list.map((g) => (
                      <li key={g.id} className="flex justify-between text-gray-700">
                        <span>
                          {(g.subjects as { name: string } | null)?.name}
                          <span className="text-gray-400">
                            {' '}
                            ({(g.grade_types as { name: string } | null)?.name ?? '—'})
                          </span>
                        </span>
                        <span className="font-medium">{g.score}/{g.max_score}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{dict.studentProfile.absencesTitle}</h2>
          {(absences ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">{dict.studentProfile.noAbsences}</p>
          ) : (
            <ul className="text-sm divide-y divide-gray-100">
              {(absences ?? []).map((a) => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <span className="text-gray-700">{new Date(a.absence_date).toLocaleDateString('fr-FR')}</span>
                  <span className={a.is_justified ? 'text-emerald-600 text-xs' : 'text-rose-600 text-xs'}>
                    {a.is_justified ? dict.studentProfile.justified : dict.studentProfile.notJustified}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(lessonLogs ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{dict.lessonLogPage.title}</h2>
          <ul className="text-sm divide-y divide-gray-100">
            {(lessonLogs ?? []).map((l) => (
              <li key={l.id} className="py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{new Date(l.lesson_date).toLocaleDateString('fr-FR')}</span>
                  <span className="text-xs font-medium text-[#7c3aed]">{l.subjects?.name ?? '—'}</span>
                </div>
                <p className="text-gray-700">{l.lesson_content}</p>
                {l.homework && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t.homeworkPrefix} {l.homework}
                    {l.homework_due_date && ` (${dict.lessonLogPage.forDateTemplate.replace('{date}', new Date(l.homework_due_date).toLocaleDateString('fr-FR'))})`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(disciplinaryRecords ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{dict.studentProfile.disciplineTitle}</h2>
          <ul className="text-sm divide-y divide-gray-100">
            {(disciplinaryRecords ?? []).map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {disciplineTypeLabel[r.type] ?? r.type}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(r.incident_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-gray-700">{r.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
