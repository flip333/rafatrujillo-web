import { NextResponse, type NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

/* Protege el panel /admin con autenticación básica (usuario "admin" +
   ADMIN_PASSWORD). Sin ADMIN_PASSWORD configurada, el panel queda cerrado. */
export function proxy(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD
  const unauthorized = () =>
    new NextResponse('Autenticación requerida', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="rafatrujillo admin", charset="UTF-8"', 'Cache-Control': 'no-store' },
    })

  if (!password) return new NextResponse('Panel no configurado', { status: 503 })

  const header = req.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return unauthorized()

  let user = ''
  let pass = ''
  try {
    const decoded = atob(header.slice(6))
    const i = decoded.indexOf(':')
    user = decoded.slice(0, i)
    pass = decoded.slice(i + 1)
  } catch {
    return unauthorized()
  }

  const a = Buffer.from(pass)
  const b = Buffer.from(password)
  const ok = user === 'admin' && a.length === b.length && timingSafeEqual(a, b)
  if (!ok) return unauthorized()

  const res = NextResponse.next()
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
