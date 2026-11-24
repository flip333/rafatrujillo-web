import Anthropic from '@anthropic-ai/sdk'
import type { Env } from './env'
import type { VoiceProfile } from './voice'
import type { Suggestion, SiteContext } from './content'

/* Redacción con Claude (solo si existe ANTHROPIC_API_KEY como secreto del Worker).
   - System prompt estable (voz + contexto) con cache_control: entre borradores
     se reutiliza y cuesta ~10 % del precio normal.
   - fallbacks "default": si el modelo declina por política, la API reintenta
     con otro modelo dentro de la misma llamada. */

export const aiEnabled = (env: Env) => Boolean(env.ANTHROPIC_API_KEY)

function systemPrompt(voice: VoiceProfile | null, ctx: SiteContext): string {
  const songs = ctx.songs.map(s => `- ${s.title}${s.year ? ` (${s.year})` : ''}${s.story ? `: ${s.story.slice(0, 600)}` : ''}`).join('\n')
  return `Eres el editor de contenidos de ${ctx.artist}, cantautor y productor colombiano (indie pop-rock, Manizales). Escribes borradores de newsletter y blog en español, en primera persona como ${ctx.artist}, para que él los revise y publique.

Reglas de voz:
${voice ? `- Tono: ${voice.tone} (cercanía ${voice.closeness}/5).
- Trato con quien lee: ${voice.address}. Idioma: ${voice.language}.
- Palabras y expresiones suyas (úsalas con naturalidad, sin forzar): ${voice.ownWords.join(', ') || '—'}.
- Nunca uses: ${voice.avoid.join(', ') || 'lenguaje de marketing genérico'}.
- Le gusta contar: ${voice.themes.join(', ') || '—'}. Referentes de cómo cuenta: ${voice.references || '—'}.
- Quiere que quien lee sienta: ${voice.feeling || '—'}.
- Así describe su música: “${voice.oneLiner}”.` : '- Aún no hay perfil de voz: escribe sobrio, cercano y concreto, sin lenguaje de marketing.'}
- Nada de clichés promocionales, mayúsculas sostenidas ni emojis de relleno. Frases concretas, escenas y datos reales.
- No inventes hechos: usa solo los datos de abajo. Si falta algo, deja [corchetes] para que Rafa lo complete.

Contexto:
- Sitio: ${ctx.site}. Álbum en curso: ${ctx.album}.
- Próximo lanzamiento: ${ctx.nextRelease ? `“${ctx.nextRelease.title}” el ${ctx.nextRelease.date}` : 'ninguno anunciado'}.
- Último lanzamiento: ${ctx.latestRelease ? `“${ctx.latestRelease.title}” (${ctx.latestRelease.date})` : '—'}.
- Canciones e historias (contadas por él):
${songs}

Formato de salida: Markdown. Newsletter → "Asunto:" y "Preheader:" en las dos primeras líneas, luego el cuerpo (máx. 300 palabras). Blog → título H1, un primer párrafo que responda directamente la pregunta principal (para buscadores con IA), subtítulos H2 (al menos dos en forma de pregunta) y al final una línea "Meta descripción:" de máx. 155 caracteres.`
}

export async function draftWithClaude(env: Env, s: Suggestion, voice: VoiceProfile | null, ctx: SiteContext, extra?: string) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const brief = `Redacta este ${s.format === 'blog' ? 'artículo de blog' : 'newsletter'}:
Título de trabajo: ${s.title}
Enfoque: ${s.angle}
Estructura sugerida:
${s.outline.map(o => `- ${o}`).join('\n')}
Consejo SEO/GEO: ${s.geo}
Fecha prevista: ${s.date}${extra ? `\nNotas de Rafa: ${extra.slice(0, 1500)}` : ''}`

  const res = await client.beta.messages.create({
    model: env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: [{ type: 'text', text: systemPrompt(voice, ctx), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: brief }],
  })

  if (res.stop_reason === 'refusal') throw new Error('refusal')
  const text = res.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('\n').trim()
  if (!text) throw new Error('empty')
  return { text, model: res.model, usage: res.usage }
}
