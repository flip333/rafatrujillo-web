import { shortHash } from './env'
import type { VoiceProfile } from './voice'
import type { ReferenceAnalysis } from './reference'

/* Ciclos de contenido (newsletter + blog) sin IA: plantillas que combinan
   el calendario de lanzamientos, las historias de las canciones, la voz de
   Rafa y sus insights/referentes. Con IA, cada sugerencia se puede redactar. */

export interface SiteContext {
  today: string                                  // YYYY-MM-DD (Bogotá)
  site: string
  artist: string
  album: string                                  // álbum en curso (Mosquito Beach)
  nextRelease: { title: string; date: string } | null
  latestRelease: { title: string; date: string; credit?: string } | null
  songs: { title: string; year?: number; story?: string }[]
}

export type Format = 'newsletter' | 'blog'
export type Cycle = 'antes' | 'lanzamiento' | 'despues' | 'siempre' | 'insight'

export interface Suggestion {
  id: string
  format: Format
  cycle: Cycle
  title: string
  angle: string
  outline: string[]
  geo: string            // consejo SEO/GEO (blog) o de entregabilidad (newsletter)
  basedOn: string[]
  date: string           // fecha sugerida de publicación
  status: 'pendiente' | 'hecho' | 'descartado'
  voice: { use: string[]; avoid: string[]; address: string }
}

interface Insight { id: string; kind: 'insight' | 'reference'; text: string | null; url: string | null; analysis: ReferenceAnalysis | null; created_at: string }

const addDays = (iso: string, d: number) => {
  const t = new Date(`${iso}T12:00:00Z`)
  t.setUTCDate(t.getUTCDate() + d)
  return t.toISOString().slice(0, 10)
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000)
const max = (a: string, b: string) => (a > b ? a : b)
const firstSentence = (s?: string) => (s ?? '').split(/(?<=[.!?])\s/)[0]?.slice(0, 200) ?? ''

export function buildPlan(ctx: SiteContext, voice: VoiceProfile | null, insights: Insight[], states: Map<string, string>): Suggestion[] {
  const out: Suggestion[] = []
  const v = {
    use: voice?.ownWords.slice(0, 4) ?? [],
    avoid: voice?.avoid.slice(0, 4) ?? [],
    address: voice?.address ?? 'tú',
  }
  const opener = voice?.opening ? `Abre con algo como: “${voice.opening}”` : 'Abre con una escena concreta (un lugar, un momento), no con “Hola a todos”.'
  const close = voice?.feeling ? `Cierra buscando que quien lee sienta: ${voice.feeling}.` : 'Cierra con una pregunta para que te respondan el correo.'
  const cadence = voice?.cadence.days ?? 14

  const push = (s: Omit<Suggestion, 'id' | 'status' | 'voice'>) => {
    const id = `${s.format}-${s.cycle}-${shortHash(s.title)}`
    const status = (states.get(id) as Suggestion['status']) ?? 'pendiente'
    out.push({ ...s, id, status, voice: v })
  }

  // ── Ciclo del próximo lanzamiento ──
  const nr = ctx.nextRelease
  if (nr && daysBetween(ctx.today, nr.date) >= -21) {
    const d = daysBetween(ctx.today, nr.date)
    const song = ctx.songs.find(s => s.title.toLowerCase() === nr.title.toLowerCase())
    if (d > 0) {
      push({
        format: 'newsletter', cycle: 'antes', date: max(ctx.today, addDays(nr.date, -3)),
        title: d <= 7 ? `Faltan ${d} días: lo que aún no te he contado de “${nr.title}”` : `Algo nuevo viene en camino: “${nr.title}”`,
        angle: 'Teaser íntimo: de dónde salió la canción, sin revelarla toda. Que quien lee sienta que se entera primero.',
        outline: [opener, '¿Qué estabas viviendo cuando la escribiste?', 'Un detalle de estudio: quién tocó qué, dónde se grabó', `Fecha y hora: ${nr.date}`, 'Pide que respondan el correo con una palabra que les despierte el título'],
        geo: 'Asunto corto (menos de 45 caracteres), sin MAYÚSCULAS ni signos de promo: llega a la bandeja principal.',
        basedOn: ['Próximo lanzamiento', ...(song?.story ? ['Historia de la canción'] : [])],
      })
      push({
        format: 'blog', cycle: 'antes', date: max(ctx.today, addDays(nr.date, -5)),
        title: `${ctx.album}: qué es el segundo álbum de ${ctx.artist}`,
        angle: 'Pieza de referencia que responde directamente qué es el álbum, de qué habla y qué canciones lo forman.',
        outline: [`Primer párrafo: “${ctx.album} es…” en dos frases`, 'De dónde viene el nombre', 'Temas: adultez, memoria, amistades, home studios', 'Canciones publicadas hasta ahora y la que viene', 'Créditos y fechas'],
        geo: `Responde “¿Qué es ${ctx.album}?” en el primer párrafo: los buscadores con IA citan respuestas directas y con datos (fechas, nombres).`,
        basedOn: ['Álbum en curso', 'Calendario'],
      })
    }
    push({
      format: 'newsletter', cycle: 'lanzamiento', date: nr.date,
      title: `Ya salió “${nr.title}”`,
      angle: 'Correo corto el mismo día: la canción, dónde escucharla y una sola frase tuya sobre qué significa.',
      outline: ['Una frase sobre la canción (no más)', 'Botones: Spotify · Apple Music · YouTube', 'Una petición concreta: guárdala en tu playlist', close],
      geo: 'Envíalo por la mañana del día de salida; un solo llamado a la acción principal.',
      basedOn: ['Próximo lanzamiento'],
    })
    push({
      format: 'blog', cycle: 'lanzamiento', date: nr.date,
      title: `“${nr.title}”: letra, historia y créditos`,
      angle: 'La página que alguien encuentra cuando busca la canción: letra completa, contexto y quién la hizo.',
      outline: ['Una línea: qué es y cuándo salió', 'La historia (en tu voz)', 'Letra completa', 'Créditos: producción, mezcla, músicos', 'Dónde escucharla'],
      geo: 'Incluye créditos y fecha exacta: son los datos que Google y ChatGPT usan para responder “¿quién produjo…?” o “¿cuándo salió…?”.',
      basedOn: ['Próximo lanzamiento', 'Letra', 'Créditos'],
    })
    push({
      format: 'newsletter', cycle: 'despues', date: addDays(nr.date, 5),
      title: `La historia detrás de “${nr.title}”`,
      angle: 'Cuando la gente ya la escuchó: cuenta la parte que no cabe en Instagram.',
      outline: [opener, 'El momento en que la canción cambió (un error, una toma, una idea)', 'Qué te dijeron quienes ya la escucharon', close],
      geo: 'Reenvía a quienes no abrieron el correo de lanzamiento con otro asunto.',
      basedOn: ['Próximo lanzamiento', 'Respuestas de la lista'],
    })
    push({
      format: 'blog', cycle: 'despues', date: addDays(nr.date, 12),
      title: `Cómo se grabó “${nr.title}”`,
      angle: 'Diario de producción: instrumentos, decisiones, referencias sonoras. Muy buscado por otros músicos.',
      outline: ['Dónde y con quién', 'Instrumentos y por qué', 'Una decisión de producción que lo definió', 'Fotos o video del proceso'],
      geo: 'Subtítulos en forma de pregunta (“¿Con qué se grabó la batería?”) para aparecer en respuestas de IA.',
      basedOn: ['Próximo lanzamiento'],
    })
  }

  // ── Serie siempre vigente: una canción, una historia ──
  const withStory = ctx.songs.filter(s => s.story)
  let date = nr ? addDays(nr.date, 19) : ctx.today
  if (date < ctx.today) date = ctx.today
  for (const s of withStory.slice(0, 6)) {
    push({
      format: 'blog', cycle: 'siempre', date,
      title: `La historia de “${s.title}”`,
      angle: `Entrada de blog basada en la historia que ya contaste: ${firstSentence(s.story)}`,
      outline: [`Primer párrafo: “${s.title}” es una canción de ${ctx.artist}${s.year ? ` (${s.year})` : ''} que habla de…`, 'La historia en tu voz (ya la tienes escrita)', 'Créditos y dónde escucharla', 'Letra o fragmento'],
      geo: `Título y primer párrafo deben responder “¿De qué trata ${s.title}?”: es la pregunta que la gente le hace a Google y a ChatGPT.`,
      basedOn: [`Historia de ${s.title}`],
    })
    push({
      format: 'newsletter', cycle: 'siempre', date: addDays(date, 2),
      title: `Una canción, una historia: “${s.title}”`,
      angle: 'Correo de serie: una anécdota corta de la canción y un enlace a la entrada completa del blog.',
      outline: [opener, `El detalle más humano de la historia de “${s.title}”`, 'Enlace a la historia completa en la web', close],
      geo: 'Mantén la misma estructura en cada envío de la serie: la gente reconoce el formato.',
      basedOn: [`Historia de ${s.title}`],
    })
    date = addDays(date, cadence)
  }

  // ── A partir de insights y referentes ──
  for (const i of insights.slice(0, 6)) {
    if (i.kind === 'insight' && i.text) {
      push({
        format: 'newsletter', cycle: 'insight', date: ctx.today,
        title: `Idea tuya: ${i.text.slice(0, 70)}${i.text.length > 70 ? '…' : ''}`,
        angle: 'Convierte esta idea en un correo corto: una observación personal, una conexión con tu música y una pregunta.',
        outline: [opener, `Desarrolla: “${i.text.slice(0, 160)}”`, '¿Qué canción tuya conecta con esto?', close],
        geo: 'Si funciona en la lista, conviértelo después en entrada de blog.',
        basedOn: ['Insight manual'],
      })
    } else if (i.kind === 'reference' && i.analysis) {
      const a = i.analysis
      push({
        format: a.wordCount > 900 ? 'blog' : 'newsletter', cycle: 'insight', date: ctx.today,
        title: `Inspirado en ${a.domain}: ${a.title.slice(0, 60)}`,
        angle: `Toma la estructura de este referente, no el contenido. ${a.lessons[0] ?? ''}`,
        outline: [`Extensión parecida: ~${Math.max(300, Math.round(a.wordCount / 100) * 100)} palabras`, ...a.lessons.slice(1, 3), 'Llévalo a tu historia: ¿qué canción o momento tuyo encaja?'],
        geo: a.questionHeadings ? 'Copia la idea de subtítulos-pregunta.' : 'Agrega subtítulos-pregunta que el referente no tiene: ventaja para GEO.',
        basedOn: [`Referente: ${a.domain}`],
      })
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}
