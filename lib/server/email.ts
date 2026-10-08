import 'server-only'
import { Resend } from 'resend'
import { env, isEmailConfigured } from './env'
import { LATEST_RELEASE, MOSQUITO_BEACH } from '@/lib/artist-data'

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

/* 1) Bienvenida + doble opt-in: es el primer correo que recibe la persona.
      Da la bienvenida y pide confirmar (confirma que el correo es real). */
export async function sendConfirmation(to: string, name: string | null, confirmToken: string) {
  if (!isEmailConfigured()) return { skipped: true as const }
  const hi = name ? `Hola ${esc(name)},` : 'Hola,'
  return client().emails.send({
    from: env.emailFrom,
    to,
    replyTo: env.emailReplyTo || undefined,
    subject: 'Bienvenido a la lista de rafatrujillo — confirma tu correo',
    html: layout(`${hi}<br><br>
<span style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#f0ece4">Bienvenido a la lista de rafatrujillo.</span><br><br>
Gracias por querer estar cerca de esta música. Aquí vas a encontrar las canciones antes que nadie,
lo que pasa detrás de cámaras y las historias detrás de cada lanzamiento de <em>${esc(MOSQUITO_BEACH.title)}</em>.
<br><br>Solo falta un paso: confirma tu correo para empezar.
<br>${button(confirmUrl(confirmToken), 'Confirmar y entrar')}<br>
Para que mis correos no terminen en spam, agrega <span style="color:#f0ece4">hola@rafatrujillo.xyz</span> a tus contactos.<br><br>
Si no fuiste tú, ignora este mensaje: no te escribiremos de nuevo.`),
    text: `${hi}\n\nBienvenido a la lista de rafatrujillo. Gracias por querer estar cerca de esta música.\n\nSolo falta un paso: confirma tu correo para empezar:\n${confirmUrl(confirmToken)}\n\nPara que estos correos no terminen en spam, agrega hola@rafatrujillo.xyz a tus contactos.\n\nSi no fuiste tú, ignora este mensaje.`,
    tags: [{ name: 'type', value: 'confirmation' }],
  })
}

/* 2) Automatización post-confirmación: se programa en Resend para 30 segundos
      después de confirmar. Invita a escuchar el último lanzamiento.
      Entregabilidad: más texto que imagen, pocos enlaces, sin colores de "promo",
      reply-to real y List-Unsubscribe one-click. */
export async function sendReleaseInvite(to: string, name: string | null, unsubToken: string, delayMs = 30_000) {
  if (!isEmailConfigured()) return { skipped: true as const }
  const hi = name ? `${esc(name)}, ya` : 'Ya'
  const ytUrl = `https://www.youtube.com/watch?v=${LATEST_RELEASE.youtubeId}`
  const platform = (href: string, label: string) =>
    `<a href="${href}" style="display:block;margin:0 0 10px;padding:12px 16px;border:1px solid #2a2a2a;color:#f0ece4;text-decoration:none;font-size:14px">${label}</a>`

  return client().emails.send({
    from: env.emailFrom,
    to,
    replyTo: env.emailReplyTo || undefined,
    subject: `Escucha “${LATEST_RELEASE.title}” — ${LATEST_RELEASE.credit}`,
    scheduledAt: new Date(Date.now() + delayMs).toISOString(),
    headers: unsubscribeHeaders(unsubToken),
    html: layout(`${hi} eres parte de la lista. Gracias por confirmar.<br><br>
Para empezar, te comparto el último lanzamiento:
<strong style="color:#f0ece4">“${esc(LATEST_RELEASE.title)}”</strong> — ${esc(LATEST_RELEASE.credit)},
el primer sencillo de <em>${esc(MOSQUITO_BEACH.title)}</em>, el segundo álbum de rafatrujillo.
<br><br>
<img src="${env.siteUrl}${LATEST_RELEASE.cover}" alt="Portada de ${esc(LATEST_RELEASE.title)}" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:0;margin:0 0 22px">
${platform(LATEST_RELEASE.spotifyUrl, 'Escuchar en Spotify')}
${platform(LATEST_RELEASE.appleMusicUrl, 'Escuchar en Apple Music')}
${platform(ytUrl, 'Ver el video oficial en YouTube')}
<br>
<span style="color:#f0ece4">Una promesa:</span> no vamos a llenar tu correo de spam.
Solo te escribiremos cuando valga la pena.<br><br>
Y por ser parte de la lista vas a participar en dinámicas, giveaways y contenido exclusivo
que no vas a encontrar en ningún otro lugar.<br><br>
Si quieres contarme qué te pareció la canción, responde a este correo: lo leo yo.<br><br>
Nos escuchamos pronto,<br>
<span style="font-family:'Courier New',monospace;font-weight:bold;color:#f0ece4">rafatrujillo</span>`, unsubToken),
    text: `${hi} eres parte de la lista. Gracias por confirmar.\n\nEscucha “${LATEST_RELEASE.title}” — ${LATEST_RELEASE.credit}, primer sencillo de ${MOSQUITO_BEACH.title}:\nSpotify: ${LATEST_RELEASE.spotifyUrl}\nApple Music: ${LATEST_RELEASE.appleMusicUrl}\nYouTube: ${ytUrl}\n\nUna promesa: no vamos a llenar tu correo de spam. Por ser parte de la lista vas a participar en dinámicas, giveaways y contenido exclusivo.\n\nSi quieres contarme qué te pareció, responde a este correo.\n\nrafatrujillo\n\nDarte de baja: ${unsubscribeUrl(unsubToken)}`,
    tags: [{ name: 'type', value: 'release_invite' }],
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
