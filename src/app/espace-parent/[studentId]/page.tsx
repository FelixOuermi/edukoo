import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentParent, requireOwnChild } from '@/lib/portal'
import { DAY_LABELS, SCHOOL_DAYS } from '@/lib/timetable'
import { getDictionary } from '@/lib/i18n'
import { MessageThread } from '../message-thread'
import { AbsenceRow } from '../absence-row'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function EnfantPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { parent, schoolYear } = await getCurrentParent()
  const dict = getDictionary()
  const t = dict.portal
  const paymentMethodLabel: Record<string, string> = dict.paymentMethods

  const owns = await requireOwnChild(parent.id, studentId)
  if (!owns) notFound()

  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('id', studentId)
    .single()

  if (!student) notFound()

  const [{ data: payments }, { data: feeStructures }, { data: grades }, { data: absences }, { data: periods }, { data: timetable }, { data: messages }] =
    await Promise.all([
      supabase.from('fee_payments').select('*').eq('student_id', studentId).order('paid_at', { ascending: false }),
      schoolYear
        ? supabase
            .from('fee_structures')
            .select('*')
            .eq('class_id', student.class_id)
            .eq('school_year_id', schoolYear.id)
        : Promise.resolve({ data: [] as { total_amount: number }[] }),
      supabase
        .from('grades')
        .select('*, subjects(name, coefficient), grade_types(name)')
        .eq('student_id', studentId)
        .order('trimester'),
      supabase.from('absences').select('*').eq('student_id', studentId).order('absence_date', { ascending: false }),
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
      supabase
        .from('messages')
        .select('id, sender_role, sender_name, body, created_at')
        .eq('student_id', studentId)
        .order('created_at'),
    ])

  const { data: disciplinaryRecords } = await supabase
    .from('disciplinary_records')
    .select('id, type, description, incident_date')
    .eq('student_id', studentId)
    .order('incident_date', { ascending: false })

  const { data: subscriptionsRaw } = await supabase
    .from('service_subscriptions')
    .select('id, service_type, monthly_fee, is_active, service_payments(amount)')
    .eq('student_id', studentId)
    .eq('is_active', true)

  const subscriptions = (subscriptionsRaw ?? []) as unknown as {
    id: string
    service_type: 'canteen' | 'transport'
    monthly_fee: number
    is_active: boolean
    service_payments: { amount: number }[]
  }[]

  const serviceLabel: Record<string, string> = { canteen: dict.servicesPage.canteen, transport: dict.servicesPage.transport }

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

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const totalDue = (feeStructures ?? []).reduce((sum, f) => sum + Number(f.total_amount), 0)
  const balance = totalDue - totalPaid

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
      <Link href="/espace-parent" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> {t.backToMyChildren}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {student.first_name} {student.last_name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {student.registration_number} · {(student.classes as { name: string } | null)?.name ?? dict.studentProfile.noClass}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 lg:col-span-1">
          <h2 className="font-semibold text-gray-900">{t.tuitionTitle}</h2>
          {!schoolYear ? (
            <p className="text-sm text-gray-400">{t.noActiveSchoolYearShort}</p>
          ) : (
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">{t.amountDue}</dt>
                <dd className="text-gray-800">{formatFCFA(totalDue)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">{t.paid}</dt>
                <dd className="text-emerald-600 font-medium">{formatFCFA(totalPaid)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <dt className="text-gray-700 font-medium">{t.balance}</dt>
                <dd className={`font-semibold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatFCFA(Math.max(balance, 0))}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">{dict.studentProfile.paymentHistory}</h2>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">{dict.studentProfile.noPayments}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-left border-b border-gray-100">
                <tr>
                  <th className="py-2 font-medium">{dict.studentProfile.tableReceipt}</th>
                  <th className="py-2 font-medium">{dict.studentProfile.tableInstallment}</th>
                  <th className="py-2 font-medium">{dict.studentProfile.tableMode}</th>
                  <th className="py-2 font-medium">{dict.studentProfile.tableDate}</th>
                  <th className="py-2 font-medium text-right">{dict.studentProfile.tableAmount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(payments ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-gray-600">{p.receipt_number}</td>
                    <td className="py-2 text-gray-600">{p.installment_number}</td>
                    <td className="py-2 text-gray-600">{paymentMethodLabel[p.payment_method] ?? p.payment_method}</td>
                    <td className="py-2 text-gray-600">{new Date(p.paid_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{formatFCFA(Number(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{t.bulletinsTitle}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {periodOptions.map((p) => (
            <a
              key={p.number}
              href={`/espace-parent/${studentId}/bulletin?trimestre=${p.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
            >
              <Download className="w-4 h-4" /> {p.name}
            </a>
          ))}
          <a
            href={`/espace-parent/${studentId}/certificat`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
          >
            <Download className="w-4 h-4" /> {dict.studentProfile.certificateOfEnrollment}
          </a>
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t.optionalServicesTitle}</h2>
          <ul className="text-sm divide-y divide-gray-100">
            {subscriptions.map((s) => {
              const paid = s.service_payments.reduce((sum, p) => sum + Number(p.amount), 0)
              return (
                <li key={s.id} className="py-2 flex items-center justify-between">
                  <span className="text-gray-800 font-medium">{serviceLabel[s.service_type]}</span>
                  <span className="text-gray-600">
                    {t.perMonthPaidTotalTemplate
                      .replace('{fee}', formatFCFA(Number(s.monthly_fee)))
                      .replace('{paid}', formatFCFA(paid))}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">{dict.timetablePage.title}</h2>
        {timetableSlots.length === 0 ? (
          <p className="text-sm text-gray-400">{t.noSlotsForClass}</p>
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
                <AbsenceRow
                  key={a.id}
                  absenceId={a.id}
                  studentId={studentId}
                  date={a.absence_date}
                  isJustified={a.is_justified}
                  justificationStatus={a.justification_status}
                  justificationReason={a.justification_reason}
                />
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

      <MessageThread
        studentId={studentId}
        messages={
          (messages ?? []) as unknown as {
            id: string
            sender_role: 'staff' | 'parent'
            sender_name: string
            body: string
            created_at: string
          }[]
        }
      />
    </div>
  )
}
