import 'server-only'
import type { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// Limites quotidiennes de génération IA par plan payant (schools.plan) —
// protège contre un usage répété (clics en boucle sur "Générer une
// synthèse"/"Expliquer avec l'IA") plutôt que de laisser un usage illimité
// par école. Revoir ces chiffres avec les tarifs réels si le coût mesuré
// par appel change significativement.
const DAILY_LIMITS: Record<string, number> = {
  trial: 3,
  starter: 5,
  school: 15,
  premium: 30,
}

export async function consumeAiQuota(
  supabase: SupabaseClient,
  schoolId: string,
  plan: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const limit = DAILY_LIMITS[plan] ?? DAILY_LIMITS.trial

  const { data: allowed, error } = await supabase.rpc('consume_ai_quota', {
    target_school_id: schoolId,
    daily_limit: limit,
  })

  if (error) {
    // Panne du compteur lui-même : on laisse passer plutôt que de bloquer
    // une fonctionnalité payante à cause d'un problème de comptage.
    return { ok: true }
  }

  if (!allowed) {
    return { ok: false, error: getDictionary().ai.quotaExceededTemplate.replace('{limit}', String(limit)) }
  }

  return { ok: true }
}
