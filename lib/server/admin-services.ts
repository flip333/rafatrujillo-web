import 'server-only'
import { ARTIST, LATEST_RELEASE, BORRACHO_Y_LOCO, MOSQUITO_BEACH, NEXT_RELEASE, STORIES, ALBUM_DEBUT, EP_01, SINGLES, normalizeTitle } from '@/lib/artist-data'

/* Cliente del Worker de Cloudflare "rafa-admin-services".
   La clave (ADMIN_SERVICES_TOKEN) vive solo en el servidor: el navegador
   habla con /api/admin/services/*, que exige sesión de admin y reenvía. */

const URL_ = process.env.ADMIN_SERVICES_URL ?? ''
const TOKEN = process.env.ADMIN_SERVICES_TOKEN ?? ''

export const isServicesConfigured = () => Boolean(URL_ && TOKEN.length >= 32)

export async function servicesFetch(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}) {
  if (!isServicesConfigured()) return new Response(JSON.stringify({ error: 'services_not_configured' }), { status: 503 })
  const url = new URL(path.replace(/^\/+/, ''), URL_.endsWith('/') ? URL_ : `${URL_}/`)
  return fetch(url, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${TOKEN}`, ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(init.timeoutMs ?? 20_000),
  })
}

/* Contexto del artista que el asistente usa para sus ciclos de contenido. */
export function siteContext() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  const years = new Map<string, number>()
  SINGLES.forEach(s => years.set(normalizeTitle(s.title), s.year))
  ALBUM_DEBUT.tracks.forEach(t => { if (!years.has(normalizeTitle(t.title))) years.set(normalizeTitle(t.title), ALBUM_DEBUT.year) })
  EP_01.tracks.forEach(t => { if (!years.has(normalizeTitle(t.title))) years.set(normalizeTitle(t.title), EP_01.year) })
  years.set(normalizeTitle(LATEST_RELEASE.title), MOSQUITO_BEACH.year)
  years.set(normalizeTitle(BORRACHO_Y_LOCO.title), MOSQUITO_BEACH.year)

  const seen = new Set<string>()
  const songs = Object.entries(STORIES)
    .filter(([, story]) => { if (seen.has(story)) return false; seen.add(story); return true })
    .map(([key, story]) => ({ title: displayTitle(key), year: years.get(key), story }))

  return {
    today,
    site: 'https://rafatrujillo.xyz',
    artist: ARTIST.name,
    album: MOSQUITO_BEACH.title,
    nextRelease: NEXT_RELEASE ? { title: NEXT_RELEASE.title, date: NEXT_RELEASE.releaseDate } : null,
    latestRelease: { title: LATEST_RELEASE.title, date: LATEST_RELEASE.releaseDate, credit: LATEST_RELEASE.credit },
    songs,
  }
}

// Recupera el título con mayúsculas tal como aparece en la discografía
function displayTitle(key: string): string {
  const all = [LATEST_RELEASE.title, BORRACHO_Y_LOCO.title, ...SINGLES.map(s => s.title), ...ALBUM_DEBUT.tracks.map(t => t.title), ...EP_01.tracks.map(t => t.title)]
  const hit = all.find(t => normalizeTitle(t) === key)
  return hit ? hit.replace(/\s*\((?:versión|version)[^)]*\)/i, '') : key
}
