import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE, ADMIN_MAX_AGE, ADMIN_MAX_FAILS, ADMIN_FAIL_WINDOW_MS, adminToken, safeEqual,
} from '@/lib/server/admin-auth'
import { clientIp, hashIp, isSameOrigin } from '@/lib/server/security'
import { db } from '@/lib/server/supabase'
import { isDbConfigured } from '@/lib/server/env'

const FAIL_EVENT = 'admin_login_fail'

/* POST /api/admin/login — valida la contraseña del panel y abre sesión (30 días).
   Fuerza bruta: retraso fijo + bloqueo de 15 min tras 8 fallos desde la misma IP
   (contados en Supabase, así funciona aunque cada petición caiga en otra instancia). */
export async function POST(req: Request) {
  const back = (q: string) => NextResponse.redirect(new URL(`/admin/login${q}`, req.url), 303)
  if (!isSameOrigin(req)) return back('?error=1')

  const ipHash = hashIp(clientIp(req))
  const supabase = isDbConfigured() ? db() : null

  if (supabase) {
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('name', FAIL_EVENT)
      .eq('props->>ip', ipHash)
      .gte('created_at', new Date(Date.now() - ADMIN_FAIL_WINDOW_MS).toISOString())
    if ((count ?? 0) >= ADMIN_MAX_FAILS) return back('?error=locked')
  }

  const form = await req.formData().catch(() => null)
  const password = String(form?.get('password') ?? '').slice(0, 200)
  const expected = process.env.ADMIN_PASSWORD ?? ''

  if (!expected || !safeEqual(password, expected)) {
    await supabase?.from('events').insert({ name: FAIL_EVENT, props: { ip: ipHash }, path: '/admin/login' })
    await new Promise(r => setTimeout(r, 800)) // frena intentos por fuerza bruta
    return back('?error=1')
  }

  const res = NextResponse.redirect(new URL('/admin', req.url), 303)
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_MAX_AGE,
  })
  return res
}

/* DELETE /api/admin/login — cerrar sesión */
export async function DELETE(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' })
  return res
}
