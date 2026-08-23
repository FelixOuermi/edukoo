import type { createClient } from '@/lib/supabase/server'

/**
 * Best-effort logging : une panne du journal ne doit jamais faire échouer
 * l'action métier elle-même, d'où l'absence de gestion d'erreur explicite.
 */
export async function logAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  actorName: string,
  action: string,
  details?: string
) {
  await supabase.from('audit_log').insert({
    school_id: schoolId,
    actor_name: actorName,
    action,
    details: details ?? null,
  })
}
