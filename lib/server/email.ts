import 'server-only'
import { Resend } from 'resend'
import { env, isEmailConfigured } from './env'
import { LATEST_RELEASE, MOSQUITO_BEACH, ARTIST } from '@/lib/artist-data'

let resend: Resend | null = null
const client = () => (resend ??= new Resend(env.resendApiKey))

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const confirmUrl     = (token: string) => `${env.siteUrl}/suscripcion?accion=confirmar&token=${token}`
const unsubscribeUrl = (token: string) => `${env.siteUrl}/suscripcion?accion=baja&token=${token}`
const oneClickUrl    = (token: string) => `${env.siteUrl}/api/unsubscribe?token=${token}`

/* Plantilla base — HTML simple con estilos inline (compatible con clientes de correo). */
function layout(body: string, unsubToken?: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#0a0a0a;color:#f0ece4;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="font-family:'Courier New',monospace;font-weight:bold;font-size:20px;padding-bottom:28px">rafatrujillo</td></tr>
<tr><td style="font-size:15px;line-height:1.7;color:#cfcac2">${body}</td></tr>
<tr><td style="padding-top:36px;border-top:1px solid #222;font-size:11px;color:#777;line-height:1.6">
Recibes este correo porque te registraste en la lista de rafatrujillo.<br>
${unsubToken ? `<a href="${unsubscribeUrl(unsubToken)}" style="color:#c8b08a">Darte de baja</a>` : ''}
</td></tr></table></td></tr></table></body></html>`
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin:20px 0;padding:12px 24px;border:1px solid #c8b08a;color:#c8b08a;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">${label}</a>`

function unsubscribeHeaders(token: string) {
  return {
    'List-Unsubscribe': `<${oneClickUrl(token)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

/* 1) Doble opt-in: confirma que el correo es real y que la persona lo pidió. */
export async function sendConfirmation(to: string, name: string | null, confirmToken: string) {
  if (!isEmailConfigured()) return { skipped: true as const }
  const hi = name ? `Hola ${esc(name)},` : 'Hola,'
  return client().emails.send({
    from: env.emailFrom,
    to,
    replyTo: env.emailReplyTo || undefined,
    subject: 'Confirma tu suscripción — rafatrujillo',
    html: layout(`${hi}<br><br>Gracias por querer estar cerca de la música de rafatrujillo.
Confirma tu correo para empezar a recibir nuevas canciones, fechas y detrás de cámaras.
<br>${button(confirmUrl(confirmToken), 'Confirmar suscripción')}<br>
Si no fuiste tú, ignora este mensaje: no te escribiremos de nuevo.`),
    text: `${hi}\n\nConfirma tu suscripción a la lista de rafatrujillo:\n${confirmUrl(confirmToken)}\n\nSi no fuiste tú, ignora este mensaje.`,
    tags: [{ name: 'type', value: 'confirmation' }],
  })
}

/* 2) Automatización de bienvenida: se envía al confirmar. */
export async function sendWelcome(to: string, name: string | null, unsubToken: string) {
  if (!isEmailConfigured()) return { skipped: true as const }
  const hi = name ? `Hola ${esc(name)},` : 'Hola,'
  return client().emails.send({
    from: env.emailFrom,
    to,
    replyTo: env.emailReplyTo || undefined,
    subject: `Bienvenido — escucha “${LATEST_RELEASE.title}”`,
    headers: unsubscribeHeaders(unsubToken),
    html: layout(`${hi}<br><br>Ya estás en la lista. Gracias por estar aquí.<br><br>
<em>${esc(MOSQUITO_BEACH.title)}</em>, el segundo álbum de rafatrujillo, ya empezó:
su primer sencillo es <strong style="color:#f0ece4">“${esc(LATEST_RELEASE.title)}”</strong> — ${esc(LATEST_RELEASE.credit)}.
<br>${button(LATEST_RELEASE.spotifyUrl, 'Escuchar en Spotify')}<br>
También puedes ver el <a href="https://www.youtube.com/watch?v=${LATEST_RELEASE.youtubeId}" style="color:#c8b08a">video oficial</a>
y seguir el proceso en <a href="${ARTIST.urls.instagram}" style="color:#c8b08a">Instagram</a>.`, unsubToken),
    text: `${hi}\n\nYa estás en la lista. Escucha “${LATEST_RELEASE.title}” — ${LATEST_RELEASE.credit}: ${LATEST_RELEASE.spotifyUrl}\n\nDarte de baja: ${unsubscribeUrl(unsubToken)}`,
    tags: [{ name: 'type', value: 'welcome' }],
  })
}

/* 3) Sincroniza el contacto con Resend (para enviar Broadcasts desde su panel). */
export async function syncContact(email: string, name: string | null, unsubscribed: boolean) {
  if (!isEmailConfigured() || !env.resendSegmentId) return
  const c = client().contacts
  if (unsubscribed) {
    await c.update({ email, unsubscribed: true })
    return
  }
  await c.create({
    email,
    firstName: name ?? undefined,
    unsubscribed: false,
    segments: [{ id: env.resendSegmentId }],
  })
}
