import { buildLlmsTxt, llmsResponse } from '@/lib/llms'

// /llms.txt — resumen para buscadores con IA (se genera en el build)
export const dynamic = 'force-static'

export function GET() {
  return llmsResponse(buildLlmsTxt())
}
