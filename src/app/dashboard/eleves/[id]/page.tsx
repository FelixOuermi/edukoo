import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { ParentSection } from '../parent-section'
import { MessageThread } from '../message-thread'
import { AbsenceRow } from '../absence-row'
import { DisciplineSection } from '../discipline-section'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function FicheElevePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { school, role } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary()
  const paymentMethodLabel: Record<string, string> = t.paymentMethods
  const isDirector = role === 'director'

  const { data: student } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!student) notFound()

  const [{ data: payments }, { data: grades }, { data: absences }, { data: parentLinks }] = await Promise.all([
    supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', id)
      .order('paid_at', { ascending: false }),
    supabase
      .from('grades')
      .select('*, subjects(name, coefficient), grade_types(name)')
      .eq('student_id', id)
      .order('trimester'),
    supabase
      .from('absences')
      .select('*')
      .eq('student_id', id)
      .order('absence_date', { ascending: false }),
    supabase
      .from('parent_students')
      .select('id, relationship, parents(name, email)')
      .eq('student_id', id),
  ])

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_role, sender_name, body, created_at')
    .eq('student_id', id)
    .order('created_at')

  const { data: disciplinaryRecords } = await supabase
    .from('disciplinary_records')
    .select('id, type, description, incident_date, recorded_by')
    .eq('student_id', id)
    .order('incident_date', { ascending: false })

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  const gradesByTrimester = new Map<number, typeof grades>()
  for (const g of grades ?? []) {
    const list = gradesByTrimester.get(g.trimester) ?? []
    list.push(g)
    gradesByTrimester.set(g.trimester, list)
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/eleves" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> {t.students.backToStudents}
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {student.registration_number} · {(student.classes as { name: string } | null)?.name ?? t.studentProfile.noClass}
          </p>
        </div>
        {isDirector && (
          <Link
            href={`/dashboard/scolarite/paiement?eleve=${student.id}`}
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-fit"
          >
            <Plus className="w-4 h-4" /> {t.studentProfile.recordPayment}
          </Link>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isDirector ? 'lg:grid-cols-3' : ''}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">{t.studentProfile.infoTitle}</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">{t.students.birthDate}</dt>
              <dd className="text-gray-800">{student.birth_date ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t.studentProfile.status}</dt>
              <dd className="text-gray-800 capitalize">{student.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t.studentProfile.parent}</dt>
              <dd className="text-gray-800">{student.parent_name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t.students.phone}</dt>
              <dd className="text-gray-800">{student.parent_phone ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t.students.whatsapp}</dt>
              <dd className="text-gray-800">{student.parent_whatsapp ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t.students.email}</dt>
              <dd className="text-gray-800">{student.parent_email ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {isDirector && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t.studentProfile.paymentHistory}</h2>
            <span className="text-sm text-gray-500">{t.studentProfile.totalPaid} : <span className="font-semibold text-emerald-600">{formatFCFA(totalPaid)}</span></span>
          </div>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">{t.studentProfile.noPayments}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-left border-b border-gray-100">
                <tr>
                  <th className="py-2 font-medium">{t.studentProfile.tableReceipt}</th>
                  <th className="py-2 font-medium">{t.studentProfile.tableInstallment}</th>
                  <th className="py-2 font-medium">{t.studentProfile.tableMode}</th>
                  <th className="py-2 font-medium">{t.studentProfile.tableDate}</th>
                  <th className="py-2 font-medium text-right">{t.studentProfile.tableAmount}</th>
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
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{t.studentProfile.documentsTitle}</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/dashboard/eleves/${student.id}/certificat/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
          >
            {t.studentProfile.certificateOfEnrollment}
          </a>
          <a
            href={`/dashboard/eleves/${student.id}/attestation/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
          >
            {t.studentProfile.certificateOfCompletion}
          </a>
        </div>

        <form
          method="get"
          action={`/dashboard/eleves/${student.id}/convocation/pdf`}
          target="_blank"
          className="space-y-3 pt-3 border-t border-gray-100"
        >
          <p className="text-sm font-medium text-gray-700">{t.studentProfile.generateConvocation}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              name="subject"
              defaultValue={t.studentProfile.subjectParentMeeting}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              <option value={t.studentProfile.subjectParentMeeting}>{t.studentProfile.subjectParentMeeting}</option>
              <option value={t.studentProfile.subjectDisciplinaryCouncil}>{t.studentProfile.subjectDisciplinaryCouncil}</option>
              <option value={t.studentProfile.subjectIndividualMeeting}>{t.studentProfile.subjectIndividualMeeting}</option>
              <option value={t.studentProfile.subjectOther}>{t.studentProfile.subjectOther}</option>
            </select>
            <input
              type="text"
              name="place"
              placeholder={t.studentProfile.placeOptional}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
            <input
              type="date"
              name="meetingDate"
              required
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
            <input
              type="time"
              name="meetingTime"
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <textarea
            name="message"
            placeholder={t.studentProfile.messageOptional}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
          <button
            type="submit"
            className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {t.studentProfile.generateConvocationPdf}
          </button>
        </form>
      </div>

      <ParentSection
        studentId={student.id}
        links={(parentLinks ?? []) as unknown as {
          id: string
          relationship: string | null
          parents: { name: string; email: string | null } | null
        }[]}
      />

      <DisciplineSection
        studentId={student.id}
        records={
          (disciplinaryRecords ?? []) as unknown as {
            id: string
            type: 'remark' | 'warning' | 'detention' | 'suspension'
            description: string
            incident_date: string
            recorded_by: string
          }[]
        }
      />

      <MessageThread
        studentId={student.id}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t.studentProfile.gradesByTrimester}</h2>
          {[1, 2, 3].map((tri) => {
            const list = gradesByTrimester.get(tri) ?? []
            return (
              <div key={tri} className="mb-4 last:mb-0">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t.studentProfile.trimester} {tri}</h3>
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400">{t.studentProfile.noGrades}</p>
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
          <h2 className="font-semibold text-gray-900 mb-4">{t.studentProfile.absencesTitle}</h2>
          {(absences ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">{t.studentProfile.noAbsences}</p>
          ) : (
            <ul className="text-sm divide-y divide-gray-100">
              {(absences ?? []).map((a) => (
                <AbsenceRow
                  key={a.id}
                  id={a.id}
                  studentId={student.id}
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
    </div>
  )
}
