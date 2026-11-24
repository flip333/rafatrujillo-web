import { createHmac, timingSafeEqual } from 'node:crypto'

/* Sesión del panel /admin: cookie httpOnly "<expira>.<firma>".
   La firma es un HMAC con ADMIN_PASSWORD de la fecha de expiración, así que:
   - la sesión caduca sola (30 días) aunque alguien copie la cookie;
   - cambiar la contraseña invalida todas las sesiones abiertas. */
export const ADMIN_COOKIE = 'rafa_admin'
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

// Bloqueo por fuerza bruta: tras N fallos desde la misma IP en la ventana
export const ADMIN_MAX_FAILS = 8
export const ADMIN_FAIL_WINDOW_MS = 15 * 60 * 1000

const sign = (exp: number, password: string) =>
  createHmac('sha256', password).update(`rafatrujillo-admin-v2.${exp}`).digest('hex')

export function adminToken(password = process.env.ADMIN_PASSWORD ?? ''): string {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE
  return `${exp}.${sign(exp, password)}`
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/* Comprobación dentro de la propia página/ruta (además de proxy.ts):
   si el proxy fallara o se saltara, los datos siguen protegidos. */
export async function hasAdminSession(): Promise<boolean> {
  const { cookies } = await import('next/headers')
  return isValidAdminCookie((await cookies()).get(ADMIN_COOKIE)?.value)
}

export function isValidAdminCookie(value: string | undefined): boolean {
  const password = process.env.ADMIN_PASSWORD
  if (!password || !value) return false
  const [expStr, sig] = value.split('.')
  const exp = Number(expStr)
  if (!Number.isInteger(exp) || !sig || exp < Date.now() / 1000) return false
  return safeEqual(sig, sign(exp, password))
}
