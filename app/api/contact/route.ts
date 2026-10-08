import { after } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/lib/server/supabase'
import { env, isDbConfigured, isEmailConfigured } from '@/lib/server/env'
import { isValidEmail, cleanText, clientIp, hashIp, isSameOrigin, json } from '@/lib/server/security'

const SUBJECTS = new Set(['booking', 'services', 'press', 'collab', 'other'])
const SUBJECT_LABEL: Record<string, string> = {
  booking: 'Booking / concierto', services: 'Música para cine / publicidad / proyecto',
  press: 'Prensa / entrevista', collab: 'Colaboración', other: 'Otro',
}
const MAX_PER_IP_PER_HOUR = 3

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/* POST /api/contact — formulario de booking y prensa.
   1) Valida y aplica rate limit. 2) Guarda en Supabase (nunca se pierde).
   3) Reenvía por correo a CONTACT_EMAIL con "Responder" apuntando a quien escribió. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ ok: false, error: 'forbidden' }, 403)
  if (!isDbConfigured())  return json({ ok: false, error: 'not_configured' }, 503)

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return json({ ok: false, error: 'invalid_body' }, 400)
  if (typeof body.website === 'string' && body.website) return json({ ok: true }) // honeypot

  const name    = cleanText(body.name, 80)
  const email   = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const subject = typeof body.subject === 'string' && SUBJECTS.has(body.subject) ? body.subject : 'other'
  const message = typeof body.message === 'string' ? body.message.replace(/\u0000/g, '').trim().slice(0, 3000) : ''
  const locale  = req.headers.get('referer')?.includes('/en') ? 'en' : 'es'

  if (!name || !isValidEmail(email) || message.length < 10) {
    return json({ ok: false, error: 'invalid_input' }, 400)
  }

  const supabase = db()
  const ipHash = hashIp(clientIp(req))
  const { count } = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) return json({ ok: false, error: 'rate_limited' }, 429)

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({ name, email, subject, message, locale, ip_hash: ipHash })
    .select('id')
    .single()
  if (error || !data) return json({ ok: false, error: 'db_error' }, 500)

  // Reenvío por correo después de responder (no hace esperar al visitante)
  if (isEmailConfigured() && env.contactEmail) {
    after(async () => {
      const { error: mailErr } = await new Resend(env.resendApiKey).emails.send({
        from: env.emailFrom,
        to: env.contactEmail,
        replyTo: email,
        subject: `[Web · ${SUBJECT_LABEL[subject]}] ${name}`,
        text: `${SUBJECT_LABEL[subject]}\nDe: ${name} <${email}>\n\n${message}`,
        html: `<p><strong>${esc(SUBJECT_LABEL[subject])}</strong></p><p>De: ${esc(name)} &lt;${esc(email)}&gt;</p><p style="white-space:pre-line">${esc(message)}</p>`,
        tags: [{ name: 'type', value: 'contact' }],
      })
      if (!mailErr) {
        await supabase.from('contact_messages').update({ emailed_at: new Date().toISOString() }).eq('id', data.id)
      } else {
        console.error('[contact] resend error', mailErr)
      }
    })
  }

  return json({ ok: true })
}
