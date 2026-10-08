import type { MetadataRoute } from 'next'

const SITE_URL = process.env.SITE_URL ?? 'https://rafatrujillo.xyz'
const PRIVATE = ['/api/', '/suscripcion', '/admin']

/* GEO: se permite explícitamente a los rastreadores de buscadores con IA
   (para que puedan citar y recomendar a rafatrujillo con datos correctos). */
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',          // OpenAI / ChatGPT search
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',     // Anthropic / Claude
  'PerplexityBot', 'Perplexity-User',                  // Perplexity
  'Google-Extended',                                   // Gemini / AI Overviews
  'Applebot', 'Applebot-Extended',                     // Siri / Apple Intelligence
  'Bingbot',                                           // Bing → Copilot y ChatGPT search
  'meta-externalagent', 'CCBot', 'cohere-ai', 'DuckAssistBot', 'MistralAI-User',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
