import { isServicesConfigured, servicesFetch } from '@/lib/server/admin-services'

/* GET /api/tracking/config — ¿hay pixel de Meta configurado en /admin → Conexiones?
   Solo devuelve el ID público del pixel (es visible en el código de cualquier web).
   La CDN lo guarda 5 minutos: un cambio en el panel tarda como mucho eso en verse. */
export async function GET() {
  let metaPixelId: string | null = null
  if (isServicesConfigured()) {
    try {
      const res = await servicesFetch('tracking/public', { timeoutMs: 5_000 })
      if (res.ok) {
        const d = (await res.json()) as { metaPixelId?: string | null }
        metaPixelId = d.metaPixelId && /^\d{8,25}$/.test(d.metaPixelId) ? d.metaPixelId : null
      }
    } catch {}
  }
  return Response.json({ metaPixelId }, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' },
  })
}
