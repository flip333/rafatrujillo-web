import { after } from 'next/server'
import { db } from '@/lib/server/supabase'
import { isDbConfigured } from '@/lib/server/env'
import { syncContact } from '@/lib/server/email'
import { isUuid, json } from '@/lib/server/security'

/* POST /api/unsubscribe
   - Desde la página /suscripcion: JSON { token }
   - One-click (RFC 8058, Gmail/Yahoo): ?token=… con cuerpo
     "List-Unsubscribe=One-Click". Por eso no exige mismo origen. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return json({ ok: false, error: 'not_configured' }, 503)

  const url = new URL(req.url)
  let token: unknown = url.searchParams.get('token')
  if (!token) {
    const body = (await req.json().catch(() => ({}))) as { token?: unknown }
    token = body.token
  }
  if (!isUuid(token)) return json({ ok: false, error: 'invalid_token' }, 400)

  const supabase = db()
  const { data: sub } = await supabase
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .neq('status', 'unsubscribed')
    .select('email, name')
    .maybeSingle()

  if (sub) {
    after(async () => {
      try {
        await syncContact(sub.email, sub.name, true)
        await supabase.from('events').insert({ name: 'unsubscribe', path: '/suscripcion' })
      } catch (e) {
        console.error('[unsubscribe] sync error', e)
      }
    })
  }
  // Respuesta idéntica exista o no el token (no filtra información)
  return json({ ok: true, status: 'unsubscribed' })
}
