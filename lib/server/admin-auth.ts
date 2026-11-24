import { createHmac, timingSafeEqual } from 'node:crypto'

/* Sesión del panel /admin: cookie httpOnly "<expira>.<firma>".
   La firma es un HMAC con ADMIN_PASSWORD de la fecha de expiración, así que:
   - "recordar este dispositivo": dura 1 año y se renueva sola (proxy.ts)
     cada día que se usa el panel; si no se usa en un año, caduca;
   - cambiar la contraseña invalida todas las sesiones abiertas;
   - "Salir" la borra en ese navegador. */
export const ADMIN_COOKIE = 'rafa_admin'
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 365 // 1 año
const RENEW_AFTER = 60 * 60 * 24               // se renueva como máximo 1 vez al día

export const adminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: ADMIN_MAX_AGE,
})

/* ¿Toca renovar? (la cookie es válida y se emitió hace más de un día) */
export function shouldRenewAdmin(value: string | undefined): boolean {
  const exp = Number(value?.split('.')[0])
  return Number.isInteger(exp) && exp - Date.now() / 1000 < ADMIN_MAX_AGE - RENEW_AFTER
}

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
