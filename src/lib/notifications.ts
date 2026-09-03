import 'server-only'
import type { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function parentEmailsForStudent(supabase: SupabaseClient, studentId: string): Promise<string[]> {
  const { data } = await supabase.from('parent_students').select('parents(email)').eq('student_id', studentId)
  return (data ?? [])
    .map((r) => (r.parents as unknown as { email: string | null } | null)?.email)
    .filter((e): e is string => !!e)
}

export async function notifyGradesRecorded(
  supabase: SupabaseClient,
  studentId: string,
  studentName: string,
  subjectName: string,
  entries: { gradeTypeName: string; score: number; maxScore: number }[]
) {
  if (entries.length === 0) return
  const emails = await parentEmailsForStudent(supabase, studentId)
  if (emails.length === 0) return
  const list = entries.map((e) => `${e.gradeTypeName} : ${e.score}/${e.maxScore}`).join(', ')
  await Promise.all(
    emails.map((to) =>
      sendEmail({
        to,
        subject: `Nouvelle(s) note(s) — ${studentName}`,
        html: `<p>Nouvelle(s) note(s) enregistrée(s) pour <strong>${studentName}</strong> en <strong>${subjectName}</strong> : ${list}.</p>`,
      })
    )
  )
}

export async function notifyAbsenceRecorded(
  supabase: SupabaseClient,
  studentId: string,
  studentName: string,
  date: string,
  justified: boolean
) {
  const emails = await parentEmailsForStudent(supabase, studentId)
  if (emails.length === 0) return
  await Promise.all(
    emails.map((to) =>
      sendEmail({
        to,
        subject: `Absence enregistrée — ${studentName}`,
        html: `<p>Une absence ${justified ? 'justifiée' : 'non justifiée'} a été enregistrée pour <strong>${studentName}</strong> le ${date}.</p>`,
      })
    )
  )
}

export async function notifyAbsenceThreshold(
  supabase: SupabaseClient,
  studentId: string,
  studentName: string,
  count: number,
  threshold: number
) {
  const emails = await parentEmailsForStudent(supabase, studentId)
  if (emails.length === 0) return
  await Promise.all(
    emails.map((to) =>
      sendEmail({
        to,
        subject: `Seuil d’absences atteint — ${studentName}`,
        html: `<p><strong>${studentName}</strong> a atteint <strong>${count}</strong> absence(s) ce mois-ci (seuil fixé par l’école : ${threshold}). N’hésitez pas à contacter l’établissement.</p>`,
      })
    )
  )
}

export async function notifyPaymentReceived(
  supabase: SupabaseClient,
  studentId: string,
  studentName: string,
  amount: number,
  receiptNumber: string | null
) {
  const emails = await parentEmailsForStudent(supabase, studentId)
  if (emails.length === 0) return
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
  await Promise.all(
    emails.map((to) =>
      sendEmail({
        to,
        subject: `Paiement reçu — ${studentName}`,
        html: `<p>Nous avons bien reçu un paiement de <strong>${formatted}</strong> pour <strong>${studentName}</strong>${receiptNumber ? ` (reçu ${receiptNumber})` : ''}.</p>`,
      })
    )
  )
}
