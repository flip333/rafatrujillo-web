import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, adminCookieOptions, adminToken, isValidAdminCookie, shouldRenewAdmin } from '@/lib/server/admin-auth'

/* Protege el panel (/admin) y sus APIs (/api/admin/*).
   - Sin sesión válida → pantalla de ingreso (/admin/login).
   - Con sesión: la renueva (1 año) una vez al día, para que el equipo
     donde está abierto el dashboard no tenga que volver a ingresar. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isLogin = pathname === '/admin/login' || pathname === '/api/admin/login'

  if (!process.env.ADMIN_PASSWORD) {
    return new NextResponse('Panel no configurado', { status: 503 })
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value
  const authed = isValidAdminCookie(cookie)

  if (!authed && !isLogin) {
    if (pathname.startsWith('/api/')) return new NextResponse('No autorizado', { status: 401 })
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Ya hay sesión: la pantalla de ingreso lleva directo al panel
  if (authed && pathname === '/admin/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const res = NextResponse.next()
  if (authed && shouldRenewAdmin(cookie)) res.cookies.set(ADMIN_COOKIE, adminToken(), adminCookieOptions())
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
