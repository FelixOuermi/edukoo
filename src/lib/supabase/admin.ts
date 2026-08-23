import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé service_role : contourne la RLS et donne
 * accès à l'API d'administration Auth (invitation d'utilisateurs).
 * `server-only` fait échouer le build si ce module est importé depuis du
 * code client — cette clé ne doit jamais atteindre le navigateur.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
