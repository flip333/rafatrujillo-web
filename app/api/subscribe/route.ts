import { db } from '@/lib/server/supabase'
import { isDbConfigured } from '@/lib/server/env'
import { sendConfirmation } from '@/lib/server/email'
import {
  isValidEmail, cleanText, clientIp, hashIp, isSameOrigin, json,
} from '@/lib/server/security'

const MAX_PER_IP_PER_HOUR = 5
const RESEND_COOLDOWN_MS  = 2 * 60 * 1000

/* POST /api/subscribe — alta en la lista con doble opt-in.
   La respuesta es siempre genérica: no revela si un correo ya existía. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ ok: false, error: 'forbidden' }, 403)
  if (!isDbConfigured())  return json({ ok: false, error: 'not_configured' }, 503)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  // Honeypot: campo oculto que solo rellenan los bots
  if (typeof body.website === 'string' && body.website.length > 0) {
    return json({ ok: true, status: 'pending' })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!isValidEmail(email))  return json({ ok: false, error: 'invalid_email' }, 400)
  if (body.consent !== true) return json({ ok: false, error: 'consent_required' }, 400)

  const name   = cleanText(body.name, 80)
  const source = cleanText(body.source, 40) ?? 'web'
  const ipHash = hashIp(clientIp(req))
  const ua     = cleanText(req.headers.get('user-agent'), 300)

  const supabase = db()

  // Rate limit por IP (hash) — protege la cuota gratuita de Resend
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('updated_at', since)
  if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
    return json({ ok: false, error: 'rate_limited' }, 429)
  }

  const { data: existing, error: selErr } = await supabase
    .from('subscribers')
    .select('id, status, confirmation_sent_at')
    .eq('email', email)
    .maybeSingle()
  if (selErr) return json({ ok: false, error: 'db_error' }, 500)

  // Ya confirmado → no hacemos nada (respuesta idéntica)
  if (existing?.status === 'confirmed') return json({ ok: true, status: 'pending' })

  let confirmToken: string
  if (existing) {
    const lastSent = existing.confirmation_sent_at ? Date.parse(existing.confirmation_sent_at) : 0
    if (existing.status === 'pending' && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      return json({ ok: true, status: 'pending' })
    }
    // pending (reenvío) o unsubscribed (re-alta): nuevo token de confirmación
    const { data, error } = await supabase
      .from('subscribers')
      .update({
        status: 'pending',
        ...(name ? { name } : {}),
        confirm_token: crypto.randomUUID(),
        consent_at: new Date().toISOString(),
        unsubscribed_at: null,
        ip_hash: ipHash,
      })
      .eq('id', existing.id)
      .select('confirm_token')
      .single()
    if (error || !data) return json({ ok: false, error: 'db_error' }, 500)
    confirmToken = data.confirm_token
  } else {
    const { data, error } = await supabase
      .from('subscribers')
      .insert({ email, name, source, ip_hash: ipHash, user_agent: ua })
      .select('confirm_token')
      .single()
    if (error || !data) return json({ ok: false, error: 'db_error' }, 500)
    confirmToken = data.confirm_token
  }

  const sent = await sendConfirmation(email, name, confirmToken)
  if ('error' in sent && sent.error) {
    console.error('[subscribe] resend error', sent.error)
    return json({ ok: false, error: 'email_error' }, 502)
  }
  await supabase
    .from('subscribers')
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq('email', email)

  return json({ ok: true, status: 'pending' })
}
