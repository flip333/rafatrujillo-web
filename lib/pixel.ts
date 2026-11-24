'use client'

/* Pixel de Meta con consentimiento previo (Ley 1581 de 2012).
   - No se carga nada de Meta hasta que la persona acepta en el aviso de cookies.
   - La decisión vive en la cookie `rafa_consent` (granted | denied) para que el
     servidor también la respete al enviar conversiones por la API de Conversiones.
   - Cada conversión lleva un event_id compartido entre navegador y servidor:
     Meta la cuenta una sola vez (deduplicación). */

export const CONSENT_COOKIE = 'rafa_consent'
export const CONSENT_EVENT = 'rafa:consent-open'
export type Consent = 'granted' | 'denied' | null

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown }
declare global { interface Window { fbq?: Fbq; _fbq?: Fbq } }

export function getConsent(): Consent {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)rafa_consent=(granted|denied)/)
  return (m?.[1] as Consent) ?? null
}

export function setConsent(v: 'granted' | 'denied') {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${v}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`
  if (v === 'denied') {
    // Retira las cookies de Meta que ya existieran en este dominio
    for (const c of ['_fbp', '_fbc']) document.cookie = `${c}=; Max-Age=0; Path=/; Domain=${location.hostname.replace(/^www\./, '.')}`
    for (const c of ['_fbp', '_fbc']) document.cookie = `${c}=; Max-Age=0; Path=/`
  }
}

/* Reabre el aviso (enlace "Cookies" del pie de página). */
export const openConsent = () => window.dispatchEvent(new Event(CONSENT_EVENT))

let pixelId: string | null = null

export function loadPixel(id: string) {
  if (typeof window === 'undefined' || pixelId) return
  pixelId = id
  // Snippet oficial de Meta, sin <noscript> (no hay consentimiento sin JS)
  const f = window
  if (!f.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args)
      else n.queue.push(args)
    } as Fbq
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    f.fbq = n
    f._fbq = n
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
  }
  f.fbq!('init', id)
  f.fbq!('track', 'PageView')
}

export const pixelReady = () => Boolean(pixelId && window.fbq)

export function pixelPageView() {
  if (pixelReady()) window.fbq!('track', 'PageView')
}

/* Id único por conversión, compartido con el servidor para deduplicar. */
export const newEventId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

export function pixelTrack(event: 'Lead' | 'CompleteRegistration', eventId: string) {
  if (!pixelReady() || getConsent() !== 'granted') return
  window.fbq!('track', event, { content_name: 'newsletter' }, { eventID: eventId })
}
