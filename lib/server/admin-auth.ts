import { createHmac, timingSafeEqual } from 'node:crypto'

/* Sesión del panel /admin: cookie httpOnly con un HMAC derivado de
   ADMIN_PASSWORD. Cambiar la contraseña invalida todas las sesiones. */
export const ADMIN_COOKIE = 'rafa_admin'
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

export function adminToken(password = process.env.ADMIN_PASSWORD ?? ''): string {
  return createHmac('sha256', password).update('rafatrujillo-admin-v1').digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function isValidAdminCookie(value: string | undefined): boolean {
  if (!process.env.ADMIN_PASSWORD || !value) return false
  return safeEqual(value, adminToken())
}
