import { db } from '@/lib/server/supabase'
import { env, isDbConfigured } from '@/lib/server/env'
import { json } from '@/lib/server/security'

/* GET /api/cron/maintenance — Vercel Cron (ver vercel.json), 1 vez al día.
   1. Borra suscripciones 'pending' sin confirmar tras 14 días (GDPR / limpieza).
   2. Borra eventos de más de 13 meses.
   3. Mantiene activo el proyecto Supabase gratuito (se pausa tras 7 días
      sin actividad).
   Vercel envía "Authorization: Bearer $CRON_SECRET" automáticamente. */
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get('authorization') !== `Bearer ${env.cronSecret}`) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }
  if (!isDbConfigured()) return json({ ok: false, error: 'not_configured' }, 503)

  const supabase = db()
  const day = 24 * 60 * 60 * 1000

  const { count: pendingDeleted } = await supabase
    .from('subscribers')
    .delete({ count: 'exact' })
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 14 * day).toISOString())

  const { count: eventsDeleted } = await supabase
    .from('events')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 395 * day).toISOString())

  const { count: confirmed } = await supabase
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed')

  return json({ ok: true, pendingDeleted, eventsDeleted, confirmed })
}
