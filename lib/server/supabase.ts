import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, isDbConfigured } from './env'

let client: SupabaseClient | null = null

/* Cliente con service_role: salta RLS. Solo se usa en route handlers. */
export function db(): SupabaseClient {
  if (!isDbConfigured()) throw new Error('Supabase no está configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  client ??= createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
