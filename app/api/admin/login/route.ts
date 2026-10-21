import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, ADMIN_MAX_AGE, adminToken, safeEqual } from '@/lib/server/admin-auth'
import { isSameOrigin } from '@/lib/server/security'

/* POST /api/admin/login — valida la contraseña del panel y abre sesión (30 días). */
export async function POST(req: Request) {
  const back = (q: string) => NextResponse.redirect(new URL(`/admin/login${q}`, req.url), 303)
  if (!isSameOrigin(req)) return back('?error=1')

  const form = await req.formData().catch(() => null)
  const password = String(form?.get('password') ?? '')
  const expected = process.env.ADMIN_PASSWORD ?? ''

  if (!expected || !safeEqual(password, expected)) {
    await new Promise(r => setTimeout(r, 800)) // frena intentos por fuerza bruta
    return back('?error=1')
  }

  const res = NextResponse.redirect(new URL('/admin', req.url), 303)
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_MAX_AGE,
  })
  return res
}

/* DELETE /api/admin/login — cerrar sesión */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
