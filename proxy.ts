import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, isValidAdminCookie } from '@/lib/server/admin-auth'

/* Protege el panel de métricas (/admin) y su exportación (/api/admin/*).
   Sin sesión válida → pantalla de ingreso (/admin/login). */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isLogin = pathname === '/admin/login' || pathname === '/api/admin/login'

  if (!process.env.ADMIN_PASSWORD) {
    return new NextResponse('Panel no configurado', { status: 503 })
  }

  const authed = isValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)

  if (!authed && !isLogin) {
    if (pathname.startsWith('/api/')) return new NextResponse('No autorizado', { status: 401 })
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const res = NextResponse.next()
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
