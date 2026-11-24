import 'server-only'
import { createHash } from 'node:crypto'
import { env } from './env'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isValidEmail = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v)

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && UUID_RE.test(v)

/* Texto libre: recorta, quita caracteres de control y limita longitud. */
export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max)
  return s || null
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/* Nunca guardamos la IP en claro: hash con sal (permite rate-limit). */
export const hashIp = (ip: string) =>
  createHash('sha256').update(`${env.ipHashSalt}:${ip}`).digest('hex')

/* Solo aceptamos POST desde nuestro propio origen (anti-CSRF).
   1) Sec-Fetch-Site (lo envían todos los navegadores modernos): rechaza
      peticiones que otro sitio dispara desde el navegador de la persona.
   2) Origin: debe coincidir con el host. Si no viene (curl, servidores),
      se acepta: no hay navegador de una víctima que proteger. */
export function isSameOrigin(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = req.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(req.url).host
  } catch {
    return false
  }
}

/* Lee el cuerpo JSON con un tope de tamaño (evita cuerpos gigantes que
   consuman memoria/CPU de la función). Devuelve null si es inválido o grande. */
export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 8 * 1024): Promise<T | null> {
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > maxBytes) return null
  try {
    const text = await req.text()
    if (new TextEncoder().encode(text).length > maxBytes) return null
    const data = JSON.parse(text)
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as T) : null
  } catch {
    return null
  }
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
