import 'server-only'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Best-effort, comme logAction() : une panne d'envoi (clé absente, domaine
 * non vérifié, quota Resend...) ne doit jamais faire échouer l'action
 * métier qui a déclenché la notification.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend || !to) return
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Edukoo <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
  } catch {
    // best-effort
  }
}
