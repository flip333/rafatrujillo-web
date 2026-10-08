import { buildLlmsTxt, llmsResponse } from '@/lib/llms'

// /llms-full.txt — versión completa con las letras de las canciones
export const dynamic = 'force-static'

export function GET() {
  return llmsResponse(buildLlmsTxt(true))
}
