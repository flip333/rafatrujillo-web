import { db } from '@/lib/server/supabase'
import { isDbConfigured } from '@/lib/server/env'
import { cleanText, isSameOrigin } from '@/lib/server/security'
import { TRACKED_EVENTS } from '@/lib/analytics-events'

const ALLOWED = new Set<string>(TRACKED_EVENTS)

/* POST /api/track — eventos propios (se envían con navigator.sendBeacon).
   Lista blanca de nombres, props acotadas y sin datos personales.
   Responde 204 siempre para no romper nunca la página. */
export async function POST(req: Request) {
  const noContent = new Response(null, { status: 204 })
  if (!isSameOrigin(req) || !isDbConfigured()) return noContent

  let body: Record<string, unknown>
  try {
    body = JSON.parse(await req.text())
  } catch {
    return noContent
  }

  const name = typeof body.name === 'string' ? body.name : ''
  if (!ALLOWED.has(name)) return noContent

  // Props: solo strings/números cortos, máximo 8 claves
  const props: Record<string, string | number> = {}
  if (body.props && typeof body.props === 'object') {
    for (const [k, v] of Object.entries(body.props as Record<string, unknown>).slice(0, 8)) {
      if (!/^[a-z_]{1,24}$/.test(k)) continue
      if (typeof v === 'number' && Number.isFinite(v)) props[k] = v
      else if (typeof v === 'string') props[k] = v.slice(0, 120)
    }
  }

  const ua = req.headers.get('user-agent') ?? ''
  const device = /tablet|ipad/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : ua ? 'desktop' : 'unknown'

  const sessionId = cleanText(body.sid, 64)
  await db().from('events').insert({
    name,
    props,
    path: cleanText(body.path, 200),
    referrer: cleanText(body.ref, 300),
    session_id: sessionId && /^[a-z0-9-]+$/i.test(sessionId) ? sessionId : null,
    country: req.headers.get('x-vercel-ip-country')?.slice(0, 2) ?? null,
    device,
  })

  return noContent
}
