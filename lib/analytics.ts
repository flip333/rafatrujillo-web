'use client'
import { track as vercelTrack } from '@vercel/analytics'
import type { TrackedEvent } from './analytics-events'

type Props = Record<string, string | number>

const SID_KEY = 'rafa-sid'

/* Id de sesión anónimo (solo sessionStorage, sin cookies → sin banner). */
function sessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY)
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem(SID_KEY, sid)
    }
    return sid
  } catch {
    return 'na'
  }
}

/* Envía un evento a:
   1) Vercel Web Analytics (los eventos personalizados requieren plan Pro;
      en Hobby se ignoran sin error).
   2) Nuestra tabla `events` en Supabase vía /api/track (gratis). */
export function track(name: TrackedEvent, props: Props = {}) {
  if (typeof window === 'undefined') return
  try {
    vercelTrack(name, props)
  } catch {}

  const payload = JSON.stringify({
    name,
    props,
    path: location.pathname + location.hash,
    ref: document.referrer || undefined,
    sid: sessionId(),
  })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
    } else {
      fetch('/api/track', { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } })
    }
  } catch {}
}
