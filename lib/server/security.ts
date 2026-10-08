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

/* Solo aceptamos POST desde nuestro propio origen (anti-CSRF básico). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // algunos clientes (curl, one-click unsubscribe) no lo envían
  try {
    return new URL(origin).host === new URL(req.url).host
  } catch {
    return false
  }
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
