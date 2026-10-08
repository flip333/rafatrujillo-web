import {
  ARTIST, LATEST_RELEASE, MOSQUITO_BEACH, ALBUM_DEBUT, EP_01, EQUO, SINGLES, YOUTUBE_VIDEOS, LYRICS,
  normalizeTitle, isInstrumental,
} from './artist-data'
import { FAQ } from './faq'
import { DICT } from './i18n'

const SITE = 'https://rafatrujillo.xyz'
const strip = (s: string) => s.replace(/\*\*?([^*]+)\*\*?/g, '$1')

/* Contenido de /llms.txt (estándar llmstxt.org): resumen en Markdown para que
   los modelos de IA entiendan al artista sin depender del diseño ni del JS.
   Se genera desde los mismos datos del sitio → se actualiza con cada lanzamiento. */
export function buildLlmsTxt(full = false): string {
  const es = DICT.es
  const lines: string[] = []
  const push = (...l: string[]) => lines.push(...l)

  push(
    `# rafatrujillo`,
    '',
    `> ${strip(es.about.lead)} Nuevo sencillo: "${LATEST_RELEASE.title}" (${LATEST_RELEASE.credit}, ${LATEST_RELEASE.releaseDate}), primer adelanto de ${MOSQUITO_BEACH.title}, su segundo álbum.`,
    '',
    `- Nombre artístico: rafatrujillo (siempre en minúsculas y unido). Nombre: ${ARTIST.fullName}.`,
    `- Origen: ${ARTIST.city}, ${ARTIST.country}. Género: ${ARTIST.genre}. Formación en cine.`,
    `- Roles: artista, compositor, productor, multiinstrumentista; compone música para cine, publicidad y proyectos.`,
    `- Sitio oficial: ${SITE} (español) · ${SITE}/en (English)`,
    `- Booking, colaboraciones y servicios: ${ARTIST.bookingEmail}`,
    '',
    `## Biografía`,
    '',
    ...[...es.about.body, ...es.about.timeline].map(p => strip(p)).flatMap(p => [p, '']),
    `## Último lanzamiento`,
    '',
    `- [${LATEST_RELEASE.title} — ${LATEST_RELEASE.credit} (Spotify)](${LATEST_RELEASE.spotifyUrl}): publicado el ${LATEST_RELEASE.releaseDate}. Primer sencillo de ${MOSQUITO_BEACH.title}.`,
    `- [${LATEST_RELEASE.title} (Apple Music)](${LATEST_RELEASE.appleMusicUrl})`,
    `- [${LATEST_RELEASE.title} — video oficial (YouTube)](https://www.youtube.com/watch?v=${LATEST_RELEASE.youtubeId})`,
    '',
    `## ${MOSQUITO_BEACH.title} (segundo álbum, ${MOSQUITO_BEACH.year})`,
    '',
    ...es.latest.mb.map(p => strip(p.replaceAll('{mb}', MOSQUITO_BEACH.title).replaceAll('{title}', LATEST_RELEASE.title))).flatMap(p => [p, '']),
    `## Discografía`,
    '',
    `### ${ALBUM_DEBUT.title} (primer álbum, ${ALBUM_DEBUT.year})`,
    '',
    ...ALBUM_DEBUT.tracks.map(t => `${t.n}. ${t.title}`),
    '',
    `### ${EP_01.title} (EP, ${EP_01.year})`,
    '',
    ...EP_01.tracks.map((t, i) => `${i + 1}. ${t.title}`),
    '',
    `### Sencillos`,
    '',
    `- ${LATEST_RELEASE.title} — ${LATEST_RELEASE.credit} (2026)`,
    ...SINGLES.map(s => `- ${s.title} (${s.year})`),
    '',
    `## Equo`,
    '',
    ...es.equo.body.map(p => strip(p)).flatMap(p => [p, '']),
    `Sencillos de Equo: ${EQUO.singles.map(s => `${s.title} (${s.year})`).join(', ')}.`,
    '',
    `## Videos oficiales (YouTube)`,
    '',
    ...YOUTUBE_VIDEOS.map(v => `- [${v.title} (${v.year})](https://www.youtube.com/watch?v=${v.id})`),
    '',
    `## Servicios: música para cine, publicidad y proyectos`,
    '',
    strip(es.press.servicesLead),
    '',
    ...es.press.services.map(([t, d]) => `- ${t}: ${d}`),
    '',
    `## Enlaces oficiales`,
    '',
    `- [Spotify](${ARTIST.urls.spotify})`,
    `- [Apple Music](${ARTIST.urls.appleMusic})`,
    `- [YouTube](${ARTIST.urls.youtube})`,
    `- [Instagram @rafatrujillomusic](${ARTIST.urls.instagram})`,
    '',
    `## Preguntas frecuentes`,
    '',
    ...FAQ.es.flatMap(f => [`### ${f.q}`, '', f.a, '']),
  )

  if (full) {
    push(`## Letras`, '', `Todas las letras son de rafatrujillo (música y letras por rafatrujillo).`, '')
    const seen = new Set<string>()
    const titles = [LATEST_RELEASE.title, ...ALBUM_DEBUT.tracks.map(t => t.title), ...EP_01.tracks.map(t => t.title)]
    for (const title of titles) {
      const key = normalizeTitle(title)
      if (seen.has(key) || isInstrumental(title) || !LYRICS[key]) continue
      seen.add(key)
      push(`### ${title}`, '', LYRICS[key], '')
    }
  } else {
    push(`## Opcional`, '', `- [Versión completa con letras](${SITE}/llms-full.txt)`, `- [English version of the site](${SITE}/en)`, '')
  }

  return lines.join('\n')
}

export const llmsResponse = (body: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Robots-Tag': 'noindex',
    },
  })
