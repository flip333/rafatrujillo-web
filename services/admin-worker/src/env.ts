export interface Env {
  DB: D1Database

  // Clave compartida con el servidor de la web (secreto). Sin ella el Worker rechaza todo.
  SERVICE_TOKEN: string

  // IA (opcional: sin key el asistente funciona con sugerencias base)
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_MODEL: string

  // Google Ads API (opcionales; la pestaña muestra qué falta)
  GOOGLE_ADS_DEVELOPER_TOKEN?: string
  GOOGLE_ADS_CLIENT_ID?: string
  GOOGLE_ADS_CLIENT_SECRET?: string
  GOOGLE_ADS_REFRESH_TOKEN?: string
  GOOGLE_ADS_CUSTOMER_ID?: string
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string
  GOOGLE_ADS_API_VERSION: string

  // Meta Marketing API (opcionales)
  META_ACCESS_TOKEN?: string
  META_AD_ACCOUNT_ID?: string
  META_API_VERSION: string

  // GitHub (opcional): sube el límite de descargas de skills desde repos públicos
  GITHUB_TOKEN?: string
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })

export const now = () => new Date().toISOString()

export const STOPWORDS = new Set(`a al algo algunas algunos ante antes como con contra cual cuando de del desde donde dos el ella ellas ellos en entre era eran es esa esas ese eso esos esta estaba estas este esto estos fue fueron ha han hasta hay la las le les lo los mas me mi mis mucho muy más nada ni no nos o otra otro para pero poco por porque que qué se sea ser si sido sin sobre son su sus también te tiene tienen todo todos tu tus un una unas uno unos y ya yo él sí mí tú cada vez muy había hace hacer tengo estoy eres soy fui sus ese esa aquí allí así luego entonces bien solo sólo the and for that with this you are was have not but from they his her she him its our your their what which who will would there been were into than then them also just about more some when out can all one has had how any each other only over such very`.split(/\s+/))

export function topWords(text: string, n = 10, minCount = 1): string[] {
  const counts = new Map<string, number>()
  for (const raw of text.toLowerCase().normalize('NFC').match(/[a-záéíóúñü]{4,}/g) ?? []) {
    if (STOPWORDS.has(raw)) continue
    counts.set(raw, (counts.get(raw) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, c]) => c >= minCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([w]) => w)
}

/* Hash corto y estable (ids de sugerencias que no cambian entre visitas). */
export function shortHash(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36)
}
