import 'server-only'
import { db } from './supabase'

/* Métricas del sitio a partir de Supabase (eventos propios + suscriptores).
   Se excluyen: pruebas internas anteriores al lanzamiento y correos de prueba. */

export const LAUNCH = '2026-10-08T06:00:00Z'     // apertura pública (antes: pruebas)
const isTestEmail = (e: string, source?: string | null) => /@resend\.dev$/i.test(e) || source === 'test'

type Ev = {
  name: string
  props: Record<string, string | number> | null
  path: string | null
  referrer: string | null
  session_id: string | null
  country: string | null
  device: string | null
  created_at: string
}
type Sub = {
  email: string; name: string | null; status: string; source: string | null
  created_at: string; confirmed_at: string | null; unsubscribed_at: string | null
}

export type Range = 7 | 30 | 90 | 0   // 0 = desde el lanzamiento

const dayKey = (iso: string) => {
  // Día en hora de Colombia (UTC-5) para que coincida con la percepción de Rafa
  const d = new Date(new Date(iso).getTime() - 5 * 3600_000)
  return d.toISOString().slice(0, 10)
}

const SOURCES: [RegExp, string][] = [
  [/instagram\.com/, 'Instagram'],
  [/facebook\.com|fb\.me|l\.facebook/, 'Facebook'],
  [/t\.co|twitter\.com|x\.com/, 'X / Twitter'],
  [/tiktok\.com/, 'TikTok'],
  [/youtube\.com|youtu\.be/, 'YouTube'],
  [/spotify\.com/, 'Spotify'],
  [/whatsapp|wa\.me/, 'WhatsApp'],
  [/linktr\.ee|linkin\.bio|beacons\.ai/, 'Link en bio'],
  [/google\./, 'Google'],
  [/bing\.com/, 'Bing'],
  [/chatgpt\.com|openai\.com/, 'ChatGPT'],
  [/perplexity\.ai/, 'Perplexity'],
  [/rafatrujillo\.xyz/, 'Interno'],
]
function sourceOf(ref: string | null): string {
  if (!ref) return 'Directo / apps'
  const hit = SOURCES.find(([re]) => re.test(ref))
  if (hit) return hit[1]
  try { return new URL(ref).hostname.replace(/^www\./, '') } catch { return 'Otro' }
}

const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(['es'], { type: 'region' })
    return (code: string) => { try { return dn.of(code) ?? code } catch { return code } }
  } catch { return (code: string) => code }
})()

function topCounts(values: string[], n = 8): [string, number][] {
  const m = new Map<string, number>()
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}

/* PostgREST devuelve como máximo 1000 filas por petición (max_rows): se pagina
   para que los totales no se congelen cuando el sitio pase de ese volumen. */
const PAGE = 1000
const MAX_ROWS = 200_000
type Paged<T> = { range: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: unknown }> }
async function fetchAll<T>(build: () => Paged<T>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1)
    if (error) throw error
    out.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return out
}

export async function getMetrics(range: Range) {
  const supabase = db()
  const now = Date.now()
  const fromIso = range === 0 ? LAUNCH : new Date(Math.max(now - range * 86_400_000, Date.parse(LAUNCH))).toISOString()
  const prevFromIso = range === 0 ? LAUNCH : new Date(Date.parse(fromIso) - range * 86_400_000).toISOString()

  const liveFromIso = new Date(now - 5 * 60_000).toISOString()
  const [events, prevEvents, subsRaw, msgRes] = await Promise.all([
    fetchAll<Ev>(() => supabase.from('events').select('name, props, path, referrer, session_id, country, device, created_at')
      .gte('created_at', fromIso).order('created_at', { ascending: true }).order('id', { ascending: true }) as unknown as Paged<Ev>),
    range === 0
      ? Promise.resolve([] as Ev[])
      : fetchAll<Ev>(() => supabase.from('events').select('name, session_id, created_at').gte('created_at', prevFromIso).lt('created_at', fromIso)
          .gte('created_at', LAUNCH).eq('name', 'page_view').order('created_at', { ascending: true }).order('id', { ascending: true }) as unknown as Paged<Ev>),
    fetchAll<Sub>(() => supabase.from('subscribers').select('email, name, status, source, created_at, confirmed_at, unsubscribed_at')
      .order('created_at', { ascending: false }).order('email', { ascending: true }) as unknown as Paged<Sub>),
    supabase.from('contact_messages').select('name, email, subject, message, created_at, emailed_at')
      .order('created_at', { ascending: false }).limit(10),
  ])

  const subsAll = subsRaw.filter(s => !isTestEmail(s.email, s.source))
  // "Ahora en la web": sesiones con actividad en los últimos 5 minutos
  const liveNow = new Set(events.filter(e => e.created_at >= liveFromIso && e.session_id).map(e => e.session_id)).size
  const by = (name: string) => events.filter(e => e.name === name)

  // ── Audiencia ──
  const pageViews = by('page_view')
  const sessions = new Set(pageViews.map(e => e.session_id).filter(Boolean))
  const prevSessions = new Set(prevEvents.map(e => e.session_id).filter(Boolean)).size

  // ── Suscriptores ──
  const inRange = (iso: string | null) => !!iso && iso >= fromIso
  const confirmedTotal = subsAll.filter(s => s.status === 'confirmed').length
  const newConfirmed = subsAll.filter(s => inRange(s.confirmed_at)).length
  const pending = subsAll.filter(s => s.status === 'pending').length
  const unsubscribed = subsAll.filter(s => s.status === 'unsubscribed').length
  const newUnsubs = subsAll.filter(s => inRange(s.unsubscribed_at)).length

  // ── Serie diaria (visitas y nuevas suscripciones) ──
  const days: string[] = []
  const start = new Date(dayKey(fromIso) + 'T12:00:00Z')
  const end = new Date(dayKey(new Date(now).toISOString()) + 'T12:00:00Z')
  for (let d = start; d <= end; d = new Date(d.getTime() + 86_400_000)) days.push(d.toISOString().slice(0, 10))
  // Cada sesión cuenta en el día de su primera visita (así la suma diaria = total de visitantes)
  const sessByDay = new Map<string, Set<string>>()
  const counted = new Set<string>()
  for (const e of pageViews) {
    const sid = e.session_id ?? e.created_at
    if (counted.has(sid)) continue
    counted.add(sid)
    const k = dayKey(e.created_at)
    if (!sessByDay.has(k)) sessByDay.set(k, new Set())
    sessByDay.get(k)!.add(sid)
  }
  const subsByDay = new Map<string, number>()
  for (const s of subsAll) if (inRange(s.confirmed_at)) {
    const k = dayKey(s.confirmed_at!)
    subsByDay.set(k, (subsByDay.get(k) ?? 0) + 1)
  }
  const daily = days.map(d => ({ day: d, visits: sessByDay.get(d)?.size ?? 0, subs: subsByDay.get(d) ?? 0 }))

  // ── Embudo de suscripción ──
  const funnel = [
    { label: 'Vieron el formulario o pop-up', value: by('subscribe_view').length + by('section_view').filter(e => e.props?.section === 'contacto').length },
    { label: 'Enviaron su correo', value: by('subscribe_submit').length },
    { label: 'Registro correcto', value: by('subscribe_success').length },
    { label: 'Confirmaron por correo', value: newConfirmed },
  ]

  // ── Alcance por sección (% de sesiones que la vieron) ──
  const sectionLabels: Record<string, string> = {
    lanzamiento: 'Nuevo lanzamiento', discografia: 'Discografía', videos: 'Videoclips', sobre: 'El artista',
    equo: 'Equo', fechas: 'Fechas', prensa: 'Booking', preguntas: 'Preguntas', contacto: 'Lista de correo',
  }
  const sectionReach = Object.entries(sectionLabels).map(([id, label]) => {
    const s = new Set(by('section_view').filter(e => e.props?.section === id).map(e => e.session_id))
    return { label, value: s.size, pct: sessions.size ? Math.round((s.size / sessions.size) * 100) : 0 }
  })
  const depth = [25, 50, 75, 100].map(d => {
    const s = new Set(by('scroll_depth').filter(e => Number(e.props?.depth) === d).map(e => e.session_id))
    return { label: `${d} %`, value: s.size, pct: sessions.size ? Math.round((s.size / sessions.size) * 100) : 0 }
  })

  const prop = (name: string, key: string) => by(name).map(e => String(e.props?.[key] ?? '—'))
  const platformNames: Record<string, string> = { spotify: 'Spotify', apple: 'Apple Music', youtube: 'YouTube', instagram: 'Instagram', other: 'Otros' }

  return {
    range,
    fromIso,
    generatedAt: new Date().toISOString(),
    liveNow,
    lastEventAt: events.at(-1)?.created_at ?? null,
    kpis: {
      visitors: sessions.size,
      visitorsPrev: range === 0 ? null : prevSessions,
      pageViews: pageViews.length,
      confirmedTotal,
      newConfirmed,
      conversion: sessions.size ? (newConfirmed / sessions.size) * 100 : 0,
      plays: by('player_play').length + by('player_autostart').length + by('video_play').length,
      contacts: by('contact_submit').length,
    },
    subscribers: { confirmedTotal, pending, unsubscribed, newUnsubs, latest: subsAll.slice(0, 15) },
    daily,
    funnel,
    sources: topCounts(pageViews.map(e => sourceOf(e.referrer)).filter(s => s !== 'Interno')),
    countries: topCounts(pageViews.map(e => (e.country ? regionName(e.country) : 'Desconocido'))),
    devices: topCounts(pageViews.map(e => ({ mobile: 'Celular', tablet: 'Tablet', desktop: 'Computador' }[e.device ?? ''] ?? 'Desconocido'))),
    language: topCounts(pageViews.map(e => (e.path?.startsWith('/en') ? 'Inglés (/en)' : 'Español'))),
    sectionReach,
    depth,
    songsPlayed: topCounts([...prop('player_play', 'song'), ...prop('player_autostart', 'song')]),
    lyrics: topCounts(prop('lyrics_open', 'song')),
    videos: topCounts(prop('video_play', 'title')),
    platforms: topCounts(prop('outbound_click', 'platform').map(p => platformNames[p] ?? p)),
    popup: { shown: by('subscribe_view').length, dismissed: by('popup_dismiss').length },
    messages: msgRes.data ?? [],
  }
}

export type Metrics = Awaited<ReturnType<typeof getMetrics>>
