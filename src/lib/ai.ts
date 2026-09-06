import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { getDictionary } from '@/lib/i18n'

// Génération à la demande (clic d'un bouton), jamais en tâche de fond : un
// directeur qui ne clique jamais sur "Générer une synthèse" ne coûte rien.
// Le modèle est volontairement figé ici (pas de choix par école) — c'est un
// détail d'implémentation, pas un réglage produit.
const MODEL = 'claude-opus-5'

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

// Erreurs traduites en message directeur, jamais affichées telles quelles
// (clé API absente/invalide, crédit épuisé, quota...). La chaîne la plus
// spécifique d'abord, comme recommandé pour ce SDK.
async function callClaude(system: string, userMessage: string): Promise<{ text: string } | { error: string }> {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 500,
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: userMessage }],
    })
    const t = getDictionary().ai
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    if (!textBlock?.text) return { error: t.emptyResponse }
    return { text: textBlock.text.trim() }
  } catch (err) {
    const t = getDictionary().ai
    if (err instanceof Anthropic.AuthenticationError) {
      return { error: t.invalidApiKey }
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { error: t.rateLimited }
    }
    if (err instanceof Anthropic.APIError) {
      return { error: t.apiErrorTemplate.replace('{status}', String(err.status ?? '—')) }
    }
    return { error: t.unavailable }
  }
}

export async function generateStatisticsSummary(input: {
  schoolAverage: number | null
  schoolSuccessRate: number | null
  classStats: { className: string; average: number | null; successRate: number | null }[]
  subjectStats: { subjectName: string; average: number }[]
}) {
  const system =
    "Tu es un assistant pour le directeur d'un établissement scolaire secondaire au Burkina Faso. " +
    "On te donne des statistiques déjà calculées pour un trimestre. Rédige une synthèse en français, " +
    '3 à 5 phrases, ton factuel et direct, sans jargon ni markdown. Mets en avant ce qui sort du lot ' +
    '(meilleure/moins bonne classe ou matière, écarts notables) plutôt que de réciter tous les chiffres. ' +
    "N'invente aucun chiffre : utilise uniquement les données fournies."

  const userMessage = JSON.stringify(input)
  return callClaude(system, userMessage)
}

export async function generateAtRiskExplanation(input: {
  studentName: string
  average: number | null
  previousAverage: number | null
  unjustifiedAbsences: number
  disciplineCount: number
  factors: string[]
}) {
  const system =
    "Tu es un assistant pour le directeur d'un établissement scolaire secondaire au Burkina Faso. " +
    "Un élève a été signalé par un système de détection basé sur des règles simples (pas de l'IA). " +
    'On te donne son nom et les données factuelles qui ont déclenché le signalement. Rédige UNE seule ' +
    "phrase en français, factuelle et neutre, qui explique pourquoi cet élève est signalé et suggère " +
    "brièvement une action (ex. contacter la famille, un entretien). Pas de markdown. N'invente aucun chiffre."

  const userMessage = JSON.stringify(input)
  return callClaude(system, userMessage)
}
