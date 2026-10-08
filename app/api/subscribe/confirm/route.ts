import { after } from 'next/server'
import { db } from '@/lib/server/supabase'
import { isDbConfigured } from '@/lib/server/env'
import { sendReleaseInvite, syncContact } from '@/lib/server/email'
import { isUuid, isSameOrigin, json } from '@/lib/server/security'

/* POST /api/subscribe/confirm — confirma el doble opt-in.
   Es POST (no GET) para que los escáneres de enlaces de los clientes de
   correo no confirmen suscripciones automáticamente. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ ok: false, error: 'forbidden' }, 403)
  if (!isDbConfigured())  return json({ ok: false, error: 'not_configured' }, 503)

  const { token } = (await req.json().catch(() => ({}))) as { token?: unknown }
  if (!isUuid(token)) return json({ ok: false, error: 'invalid_token' }, 400)

  const supabase = db()
  const { data: sub } = await supabase
    .from('subscribers')
    .select('id, email, name, status, unsubscribe_token, welcome_sent_at')
    .eq('confirm_token', token)
    .maybeSingle()

  if (!sub) return json({ ok: false, error: 'invalid_token' }, 404)
  if (sub.status === 'confirmed') return json({ ok: true, status: 'confirmed' })
  if (sub.status !== 'pending')   return json({ ok: false, error: 'invalid_token' }, 404)

  const { error } = await supabase
    .from('subscribers')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', sub.id)
  if (error) return json({ ok: false, error: 'db_error' }, 500)

  // Automatización post-confirmación: se ejecuta después de responder
  after(async () => {
    try {
      // Correo "escucha el último lanzamiento", programado 30 segundos después
      if (!sub.welcome_sent_at) {
        const res = await sendReleaseInvite(sub.email, sub.name, sub.unsubscribe_token)
        if (!('error' in res && res.error)) {
          await supabase.from('subscribers')
            .update({ welcome_sent_at: new Date().toISOString() })
            .eq('id', sub.id)
        }
      }
      await syncContact(sub.email, sub.name, false)
      await supabase.from('events').insert({ name: 'subscribe_confirmed', path: '/suscripcion' })
    } catch (e) {
      console.error('[confirm] automation error', e)
    }
  })

  return json({ ok: true, status: 'confirmed' })
}
