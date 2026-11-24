import { connection } from 'next/server'
import { hasAdminSession } from '@/lib/server/admin-auth'
import { isSameOrigin, readJson } from '@/lib/server/security'
import { servicesFetch, siteContext } from '@/lib/server/admin-services'

/* Puente navegador → Worker de Cloudflare para el panel /admin.
   - Exige sesión de admin (además del proxy.ts) y mismo origen en escrituras.
   - Solo reenvía rutas permitidas; la clave del Worker nunca sale del servidor.
   - Para el plan, los borradores y el chat añade el contexto del artista desde el servidor.
   - Los archivos que crea el asistente se reenvían tal cual (descarga). */

// El chat con búsqueda web y skills puede tardar 1–3 minutos
export const maxDuration = 300

const ALLOWED = [
  /^health$/,
  /^voice$/,
  /^insights$/,
  /^insights\/[0-9a-f-]{36}$/,
  /^content\/(plan|status|draft)$/,
  /^ads\/summary$/,
  /^board(\/version)?$/,
  /^board\/(items|meetings)$/,
  /^board\/(items|meetings)\/[0-9a-f-]{36}$/,
  /^assistant\/chat$/,
  /^assistant\/threads$/,
  /^assistant\/threads\/[0-9a-f-]{36}$/,
  /^assistant\/files\/file_[\w-]{4,120}$/,
  /^skills(\/(toggle|preview|install))?$/,
  /^skills\/skill_[\w-]{4,120}$/,
]

const TIMEOUTS: [RegExp, number][] = [
  [/^assistant\/chat$/, 290_000],
  [/^content\/draft$/, 120_000],
  [/^(insights|skills\/(preview|install))$/, 90_000],
  [/^assistant\/files\//, 60_000],
]

type Ctx = { params: Promise<{ path: string[] }> }

async function forward(req: Request, ctx: Ctx, method: string) {
  await connection()
  if (!(await hasAdminSession())) return Response.json({ error: 'unauthorized' }, { status: 401 })
  if (method !== 'GET' && !isSameOrigin(req)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const { path } = await ctx.params
  const p = path.join('/')
  if (!ALLOWED.some(r => r.test(p))) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: Record<string, unknown> | undefined
  if (method === 'POST' || method === 'PUT') {
    body = (await readJson(req, 64 * 1024)) ?? undefined
    if (!body) return Response.json({ error: 'invalid_body' }, { status: 400 })
    if (p.startsWith('content/') || p === 'assistant/chat') body.context = siteContext()
  }

  const qs = new URL(req.url).search
  try {
    const res = await servicesFetch(`${p}${qs}`, { method, body, timeoutMs: TIMEOUTS.find(([r]) => r.test(p))?.[1] ?? 25_000 })
    if (p.startsWith('assistant/files/') && res.ok) {
      return new Response(res.body, {
        status: 200,
        headers: {
          'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
          'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch {
    return Response.json({ error: 'services_unreachable' }, { status: 502 })
  }
}

export const GET    = (req: Request, ctx: Ctx) => forward(req, ctx, 'GET')
export const POST   = (req: Request, ctx: Ctx) => forward(req, ctx, 'POST')
export const PUT    = (req: Request, ctx: Ctx) => forward(req, ctx, 'PUT')
export const DELETE = (req: Request, ctx: Ctx) => forward(req, ctx, 'DELETE')
