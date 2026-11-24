import 'server-only'
import { clientIp } from './security'
import { isServicesConfigured, servicesFetch } from './admin-services'

/* Conversiones por la API de Conversiones de Meta (servidor → Worker → Meta).
   Solo se envían si la persona aceptó las cookies de medición en este navegador
   (cookie rafa_consent=granted). El correo se envía al Worker, que lo cifra con
   SHA-256 antes de mandarlo a Meta; nunca viaja en claro a Meta. */

const cookie = (req: Request, name: string) =>
  req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1]

export const hasMeasurementConsent = (req: Request) => cookie(req, 'rafa_consent') === 'granted'

export function validEventId(v: unknown): string | undefined {
  return typeof v === 'string' && /^[\w-]{8,64}$/.test(v) ? v : undefined
}

export async function sendServerConversion(req: Request, ev: { name: 'Lead' | 'CompleteRegistration'; eventId?: string; email?: string; path: string }) {
  if (!ev.eventId || !hasMeasurementConsent(req) || !isServicesConfigured()) return
  const site = process.env.SITE_URL || new URL(req.url).origin
  try {
    await servicesFetch('tracking/capi', {
      method: 'POST',
      timeoutMs: 8_000,
      body: {
        event_name: ev.name,
        event_id: ev.eventId,
        event_source_url: new URL(ev.path, site).toString(),
        email: ev.email,
        client_ip: clientIp(req),
        user_agent: req.headers.get('user-agent') ?? undefined,
        fbp: cookie(req, '_fbp'),
        fbc: cookie(req, '_fbc'),
      },
    })
  } catch (e) {
    console.error('[capi]', e instanceof Error ? e.message : e)
  }
}
