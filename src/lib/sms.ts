import 'server-only'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER

/**
 * Best-effort, comme sendEmail() : une panne d'envoi (identifiants absents,
 * quota, numéro invalide...) ne doit jamais faire échouer l'action métier
 * qui a déclenché la notification. Silencieux tant que les variables
 * d'environnement Twilio ne sont pas configurées — aucun SMS n'est envoyé
 * et aucun coût n'est engagé par défaut.
 *
 * Utilise Twilio par défaut car c'est le fournisseur le mieux documenté et
 * le plus universellement testable. Pour un fournisseur plus adapté au
 * marché local (ex. Africa's Talking), seule cette fonction a besoin
 * d'être réécrite — le reste de l'app appelle sendSms() sans connaître le
 * fournisseur.
 */
export async function sendSms({ to, body }: { to: string; body: string }) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !to) return

  const normalized = to.replace(/[\s.-]/g, '')
  // Numéro non international (sans indicatif pays) : on ne devine pas le
  // préfixe, on n'envoie simplement rien plutôt que d'envoyer au mauvais pays.
  if (!normalized.startsWith('+')) return

  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: normalized, From: TWILIO_FROM_NUMBER, Body: body }),
    })
  } catch {
    // best-effort
  }
}
