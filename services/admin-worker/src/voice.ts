import { topWords } from './env'

/* Perfil de voz derivado de las respuestas del onboarding.
   Los ids de pregunta coinciden con lib/admin/voice-questions.ts de la web. */
export type Answers = Record<string, string | string[] | number | undefined>

export interface VoiceProfile {
  tone: string            // descripción en una línea
  closeness: number       // 1–5
  address: string         // tú / usted / ustedes / mezcla
  language: string
  ownWords: string[]      // palabras y expresiones propias
  avoid: string[]
  themes: string[]        // de qué le gusta hablar
  references: string
  feeling: string         // lo que quiere que sienta quien lee
  cadence: { label: string; days: number | null }
  opening: string         // primera frase de su anécdota (gancho de ejemplo)
  oneLiner: string
}

const asText = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v)).trim()
const asList = (v: unknown): string[] =>
  (Array.isArray(v) ? v : String(v ?? '').split(/[,;\n]/)).map(s => String(s).trim()).filter(Boolean)

const CLOSENESS: Record<number, string> = {
  1: 'Sobrio: la música habla, tú acompañas',
  2: 'Cercano pero reservado',
  3: 'Conversacional, como hablarle a un conocido',
  4: 'Íntimo: cuentas lo que viviste',
  5: 'Como una carta a un amigo',
}

const CADENCE: Record<string, { label: string; days: number | null }> = {
  semanal: { label: 'Cada semana', days: 7 },
  quincenal: { label: 'Cada 15 días', days: 14 },
  mensual: { label: 'Una vez al mes', days: 30 },
  lanzamientos: { label: 'Solo cuando hay lanzamiento', days: null },
}

export function buildProfile(a: Answers): VoiceProfile {
  const closeness = Math.min(5, Math.max(1, Number(a.cercania) || 3))
  const free = ['una_frase', 'primer_mensaje', 'anecdota', 'sentir', 'fuera_musica'].map(k => asText(a[k])).join(' ')
  const declared = asList(a.expresiones)
  // Solo palabras que Rafa repite (≥2 veces) en sus respuestas libres: son marcas de estilo, no ruido
  const extracted = topWords(free, 8, 2).filter(w => !declared.some(d => d.toLowerCase().includes(w)))
  const anecdote = asText(a.anecdota)
  const firstSentence = anecdote.split(/(?<=[.!?…])\s/)[0] ?? ''

  return {
    tone: CLOSENESS[closeness],
    closeness,
    address: asText(a.trato) || 'tú',
    language: asText(a.idioma) || 'Español',
    ownWords: [...declared, ...extracted].slice(0, 12),
    avoid: asList(a.evitar).slice(0, 12),
    themes: asList(a.que_contar),
    references: asText(a.referentes),
    feeling: asText(a.sentir),
    cadence: CADENCE[asText(a.frecuencia)] ?? CADENCE.quincenal,
    opening: firstSentence.slice(0, 220),
    oneLiner: asText(a.una_frase).slice(0, 220),
  }
}
