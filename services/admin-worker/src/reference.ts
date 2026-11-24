import { topWords } from './env'

/* Análisis de un referente (link) sin IA: estructura, extensión, temas y
   señales de SEO/GEO, para que Rafa vea qué hace bien esa pieza.

   Seguridad (SSRF): solo http/https públicos, sin IPs privadas ni nombres
   internos, redirecciones revisadas una a una, tiempo y tamaño acotados. */

const MAX_BYTES = 1_500_000
const TIMEOUT_MS = 9000
const MAX_REDIRECTS = 3

export interface ReferenceAnalysis {
  url: string
  domain: string
  title: string
  description: string
  siteName: string
  type: string
  headings: { level: number; text: string }[]
  wordCount: number
  readingMinutes: number
  avgParagraphWords: number
  paragraphs: number
  lists: number
  images: number
  questionHeadings: number
  schemaTypes: string[]
  keywords: string[]
  excerpt: string
  lessons: string[]
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }
const decode = (s: string) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
const clean = (s: string) => decode(s).replace(/\s+/g, ' ').trim()

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (!h.includes('.') || h === 'localhost' || /\.(local|localhost|internal|lan|home|corp|test|invalid)$/.test(h)) return true
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const [a, b] = h.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  if (h.includes(':')) return true // IPv6 literal: no se permiten
  return false
}

export function validateUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (u.username || u.password) return null
    if (u.port && u.port !== '80' && u.port !== '443') return null
    if (isPrivateHost(u.hostname)) return null
    return u
  } catch {
    return null
  }
}

async function safeFetch(start: URL): Promise<{ url: URL; html: string }> {
  let url = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; rafa-admin-reference-reader/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es,en;q=0.8',
      },
    })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      const next = loc ? validateUrl(new URL(loc, url).toString()) : null
      if (!next) throw new Error('redirect_blocked')
      url = next
      continue
    }
    if (!res.ok) throw new Error(`http_${res.status}`)
    const type = res.headers.get('content-type') ?? ''
    if (!/text\/html|application\/xhtml/.test(type)) throw new Error('not_html')
    const declared = Number(res.headers.get('content-length') ?? 0)
    if (declared > MAX_BYTES) throw new Error('too_large')

    // Lectura acotada
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) { await reader.cancel(); break }
      chunks.push(value)
    }
    const buf = new Uint8Array(size > MAX_BYTES ? MAX_BYTES : size)
    let off = 0
    for (const c of chunks) { buf.set(c.subarray(0, Math.min(c.byteLength, buf.length - off)), off); off += c.byteLength; if (off >= buf.length) break }
    return { url, html: new TextDecoder().decode(buf) }
  }
  throw new Error('too_many_redirects')
}

export async function analyzeReference(rawUrl: string): Promise<ReferenceAnalysis> {
  const start = validateUrl(rawUrl)
  if (!start) throw new Error('invalid_url')
  const { url, html } = await safeFetch(start)

  const meta: Record<string, string> = {}
  let title = ''
  const headings: { level: number; text: string }[] = []
  const paragraphs: string[] = []
  const schemaTypes = new Set<string>()
  let lists = 0, images = 0
  let cur = '', curHeading = '', curLd = ''

  const rewriter = new HTMLRewriter()
    .on('title', { text(t) { title += t.text } })
    .on('meta', {
      element(el) {
        const key = (el.getAttribute('property') || el.getAttribute('name') || '').toLowerCase()
        const content = el.getAttribute('content')
        if (key && content && !meta[key]) meta[key] = content
      },
    })
    .on('h1, h2, h3', {
      element(el) {
        curHeading = ''
        const level = Number(el.tagName.slice(1))
        el.onEndTag(() => { const t = clean(curHeading); if (t) headings.push({ level, text: t.slice(0, 160) }) })
      },
      text(t) { curHeading += t.text },
    })
    .on('p', {
      element(el) {
        cur = ''
        el.onEndTag(() => { const t = clean(cur); if (t.split(' ').length >= 6) paragraphs.push(t) })
      },
      text(t) { cur += t.text },
    })
    .on('ul, ol', { element() { lists++ } })
    .on('img', { element() { images++ } })
    .on('script[type="application/ld+json"]', {
      element(el) { curLd = ''; el.onEndTag(() => { for (const m of curLd.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) schemaTypes.add(m[1]) }) },
      text(t) { curLd += t.text },
    })

  await rewriter.transform(new Response(html)).text()

  const body = paragraphs.join(' ')
  const words = body ? body.split(/\s+/).length : 0
  const questionHeadings = headings.filter(h => /\?|^(c[oó]mo|qu[eé]|por qu[eé]|cu[aá]ndo|d[oó]nde|qui[eé]n|how|what|why|when|where|who)\b/i.test(h.text)).length
  const avg = paragraphs.length ? Math.round(words / paragraphs.length) : 0

  const lessons: string[] = []
  if (questionHeadings >= 2) lessons.push(`Usa ${questionHeadings} subtítulos en forma de pregunta: así los buscadores con IA encuentran respuestas directas para citar.`)
  if (avg && avg <= 60) lessons.push(`Párrafos cortos (≈${avg} palabras): se lee fácil en celular.`)
  if (avg > 90) lessons.push(`Párrafos largos (≈${avg} palabras): tono de ensayo; para newsletter conviene partirlos.`)
  if (lists >= 2) lessons.push('Combina texto con listas: facilita escanear y que una IA extraiga puntos clave.')
  if (schemaTypes.size) lessons.push(`Tiene datos estructurados (${[...schemaTypes].slice(0, 4).join(', ')}): ayuda a que Google entienda de qué trata.`)
  if (words > 1500) lessons.push(`Pieza larga (${words} palabras): formato de referencia o guía, buen candidato para blog.`)
  else if (words > 0 && words < 500) lessons.push(`Pieza breve (${words} palabras): ritmo de newsletter o nota rápida.`)
  if ((meta['description'] || meta['og:description'] || '').length > 50) lessons.push('La descripción resume la pieza en una frase: úsalo como modelo para tus resúmenes.')
  if (!lessons.length) lessons.push('Fíjate en cómo abre: el primer párrafo define si alguien sigue leyendo.')

  return {
    url: url.toString(),
    domain: url.hostname.replace(/^www\./, ''),
    title: clean(meta['og:title'] || title).slice(0, 200),
    description: clean(meta['description'] || meta['og:description'] || '').slice(0, 300),
    siteName: clean(meta['og:site_name'] || '').slice(0, 80),
    type: (meta['og:type'] || '').slice(0, 40),
    headings: headings.slice(0, 20),
    wordCount: words,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    avgParagraphWords: avg,
    paragraphs: paragraphs.length,
    lists,
    images,
    questionHeadings,
    schemaTypes: [...schemaTypes].slice(0, 10),
    keywords: topWords(`${title} ${headings.map(h => h.text).join(' ')} ${body}`, 10),
    excerpt: (paragraphs[0] ?? '').slice(0, 400),
    lessons,
  }
}
