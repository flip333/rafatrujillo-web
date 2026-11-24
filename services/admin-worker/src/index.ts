import { type Env, json, now } from './env'
import { buildProfile, type Answers, type VoiceProfile } from './voice'
import { analyzeReference, validateUrl, type ReferenceAnalysis } from './reference'
import { buildPlan, type SiteContext, type Suggestion } from './content'
import { adsConfig, googleSummary, metaSummary, type PlatformSummary } from './ads'
import { aiEnabled, draftWithClaude } from './ai'
import type { AiReading } from './agent'
import { boardRoute, type Item } from './board'
import { brandSystem, downloadFile, readReferenceWithAI, runAgent, type ChatTurn } from './agent'
import { enabledSkills, skillsRoute } from './skills'
import { saveSettings, settingsStatus, withSettings } from './settings'
import { metaAccounts, metaCapiTest, metaPixels, metaPixelStatus, sendConversion, type ConversionInput } from './meta'

/* rafa-admin-services — microservicios del panel /admin.
   Seguridad:
   - Toda petición debe traer "Authorization: Bearer <SERVICE_TOKEN>" (comparación
     en tiempo constante). Solo el servidor de la web la conoce.
   - Sin CORS: un navegador no puede llamar a este Worker desde otra página.
   - Cuerpos JSON limitados y validados; links externos pasan por el filtro SSRF. */

const MAX_BODY = 64 * 1024
const ADS_TTL_MS = 6 * 60 * 60 * 1000

async function authorized(req: Request, env: Env): Promise<boolean> {
  const got = req.headers.get('authorization') ?? ''
  const want = `Bearer ${env.SERVICE_TOKEN ?? ''}`
  if (!env.SERVICE_TOKEN || env.SERVICE_TOKEN.length < 32) return false
  const a = new TextEncoder().encode(got), b = new TextEncoder().encode(want)
  if (a.byteLength !== b.byteLength) return false
  return crypto.subtle.timingSafeEqual(a, b)
}

async function body<T>(req: Request): Promise<T | null> {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return null
  const text = await req.text()
  if (text.length > MAX_BODY) return null
  try { const v = JSON.parse(text); return v && typeof v === 'object' ? (v as T) : null } catch { return null }
}

interface StoredTurn { role: 'user' | 'assistant'; content: string; at?: string; sources?: unknown; files?: unknown; model?: string }

// ── Datos ──
async function getVoice(env: Env): Promise<{ answers: Answers; completed: boolean; updatedAt: string | null; profile: VoiceProfile | null }> {
  const row = await env.DB.prepare('SELECT answers, completed, updated_at FROM voice WHERE id = 1').first<{ answers: string; completed: number; updated_at: string }>()
  if (!row) return { answers: {}, completed: false, updatedAt: null, profile: null }
  const answers = JSON.parse(row.answers) as Answers
  return { answers, completed: !!row.completed, updatedAt: row.updated_at, profile: Object.keys(answers).length ? buildProfile(answers) : null }
}

async function listInsights(env: Env) {
  const { results } = await env.DB.prepare('SELECT id, kind, text, url, analysis, created_at FROM insights ORDER BY created_at DESC LIMIT 50').all<{ id: string; kind: 'insight' | 'reference'; text: string | null; url: string | null; analysis: string | null; created_at: string }>()
  return results.map(r => ({ ...r, analysis: r.analysis ? (JSON.parse(r.analysis) as ReferenceAnalysis) : null }))
}

async function states(env: Env) {
  const { results } = await env.DB.prepare('SELECT id, status FROM content_state').all<{ id: string; status: string }>()
  return new Map(results.map(r => [r.id, r.status]))
}

function cleanContext(raw: unknown): SiteContext | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as SiteContext
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.today ?? '') || !Array.isArray(c.songs)) return null
  return {
    today: c.today,
    site: String(c.site ?? '').slice(0, 100),
    artist: String(c.artist ?? 'rafatrujillo').slice(0, 60),
    album: String(c.album ?? '').slice(0, 100),
    nextRelease: c.nextRelease && /^\d{4}-\d{2}-\d{2}$/.test(c.nextRelease.date) ? { title: String(c.nextRelease.title).slice(0, 120), date: c.nextRelease.date } : null,
    latestRelease: c.latestRelease ? { title: String(c.latestRelease.title).slice(0, 120), date: String(c.latestRelease.date).slice(0, 10), credit: c.latestRelease.credit?.slice(0, 120) } : null,
    songs: c.songs.slice(0, 40).map(s => ({ title: String(s.title).slice(0, 120), year: Number(s.year) || undefined, story: s.story ? String(s.story).slice(0, 2500) : undefined })),
  }
}

async function adsSummary(rawEnv: Env, days: 7 | 30, force = false) {
  const env = await withSettings(rawEnv)
  const key = `summary-${days}`
  if (!force) {
    const row = await env.DB.prepare('SELECT payload, fetched_at FROM ads_cache WHERE key = ?').bind(key).first<{ payload: string; fetched_at: string }>()
    if (row && Date.now() - Date.parse(row.fetched_at) < ADS_TTL_MS) return JSON.parse(row.payload) as { google: PlatformSummary; meta: PlatformSummary }
  }
  const [google, meta] = await Promise.all([googleSummary(env, days), metaSummary(env, days)])
  const payload = { google, meta }
  await env.DB.prepare('INSERT INTO ads_cache (key, payload, fetched_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at')
    .bind(key, JSON.stringify(payload), now()).run()
  return payload
}

// ── Router ──
async function handle(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const m = req.method

  if (path === '/health' && m === 'GET') {
    const cfg = adsConfig(await withSettings(env))
    return json({ ok: true, ai: aiEnabled(env), model: env.ANTHROPIC_MODEL, ads: { google: !cfg.google.length, meta: !cfg.meta.length }, time: now() })
  }

  // Voz / onboarding
  if (path === '/voice' && m === 'GET') return json(await getVoice(env))
  if (path === '/voice' && m === 'PUT') {
    const b = await body<{ answers?: Answers; completed?: boolean }>(req)
    if (!b?.answers || typeof b.answers !== 'object') return json({ error: 'invalid_body' }, 400)
    const answers: Answers = {}
    for (const [k, v] of Object.entries(b.answers).slice(0, 40)) {
      if (!/^[a-z_]{2,30}$/.test(k)) continue
      if (typeof v === 'number' && Number.isFinite(v)) answers[k] = v
      else if (typeof v === 'string') answers[k] = v.slice(0, 3000)
      else if (Array.isArray(v)) answers[k] = v.slice(0, 20).map(x => String(x).slice(0, 120))
    }
    await env.DB.prepare('INSERT INTO voice (id, answers, completed, updated_at) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET answers = excluded.answers, completed = excluded.completed, updated_at = excluded.updated_at')
      .bind(JSON.stringify(answers), b.completed ? 1 : 0, now()).run()
    return json(await getVoice(env))
  }

  // Insights y referentes
  if (path === '/insights' && m === 'GET') return json({ items: await listInsights(env) })
  if (path === '/insights' && m === 'POST') {
    const b = await body<{ kind?: string; text?: string; url?: string }>(req)
    const id = crypto.randomUUID()
    if (b?.kind === 'insight') {
      const text = String(b.text ?? '').trim().slice(0, 2000)
      if (text.length < 3) return json({ error: 'empty' }, 400)
      await env.DB.prepare('INSERT INTO insights (id, kind, text, created_at) VALUES (?, ?, ?, ?)').bind(id, 'insight', text, now()).run()
    } else if (b?.kind === 'reference') {
      const u = validateUrl(String(b.url ?? ''))
      if (!u) return json({ error: 'invalid_url' }, 400)
      const note = String(b.text ?? '').trim().slice(0, 1000) || null
      let analysis: ReferenceAnalysis | null = null
      let fetchError = ''
      try { analysis = await analyzeReference(u.toString()) } catch (e) { fetchError = e instanceof Error ? e.message : 'error' }
      // Con IA: Claude lee el link (web_fetch) y lo traduce en ideas. También rescata
      // páginas que bloquean la lectura directa del Worker.
      let ai: AiReading | null = null
      if (aiEnabled(env)) {
        try { ai = await readReferenceWithAI(env, u.toString(), note, analysis, (await getVoice(env)).profile) } catch (e) { console.error('ai reference', e) }
      }
      if (!analysis && !ai) return json({ error: 'fetch_failed', detail: fetchError }, 422)
      if (!analysis) {
        analysis = { url: u.toString(), domain: u.hostname.replace(/^www\./, ''), title: u.hostname, description: '', siteName: '', type: '', headings: [], wordCount: 0, readingMinutes: 0, avgParagraphWords: 0, paragraphs: 0, lists: 0, images: 0, questionHeadings: 0, schemaTypes: [], keywords: ai?.palabrasClave ?? [], excerpt: '', lessons: [] }
      }
      if (ai) Object.assign(analysis, { ai })
      await env.DB.prepare('INSERT INTO insights (id, kind, text, url, analysis, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, 'reference', note, analysis.url, JSON.stringify(analysis), now()).run()
    } else return json({ error: 'invalid_kind' }, 400)
    return json({ items: await listInsights(env) })
  }
  const del = path.match(/^\/insights\/([0-9a-f-]{36})$/)
  if (del && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM insights WHERE id = ?').bind(del[1]).run()
    return json({ items: await listInsights(env) })
  }

  // Plan de contenidos
  if (path === '/content/plan' && m === 'POST') {
    const b = await body<{ context?: unknown }>(req)
    const ctx = cleanContext(b?.context)
    if (!ctx) return json({ error: 'invalid_context' }, 400)
    const [voice, insights, st] = await Promise.all([getVoice(env), listInsights(env), states(env)])
    const { results: drafts } = await env.DB.prepare('SELECT id, suggestion_id, format, title, body, model, created_at FROM drafts ORDER BY created_at DESC LIMIT 20').all()
    return json({ ai: aiEnabled(env), suggestions: buildPlan(ctx, voice.profile, insights, st), drafts })
  }
  if (path === '/content/status' && m === 'POST') {
    const b = await body<{ id?: string; status?: string }>(req)
    if (!b?.id || !/^[a-z0-9-]{3,80}$/.test(b.id) || !['pendiente', 'hecho', 'descartado'].includes(String(b.status))) return json({ error: 'invalid_body' }, 400)
    await env.DB.prepare('INSERT INTO content_state (id, status, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at')
      .bind(b.id, b.status, now()).run()
    return json({ ok: true })
  }
  if (path === '/content/draft' && m === 'POST') {
    if (!aiEnabled(env)) return json({ error: 'ai_not_configured' }, 503)
    const b = await body<{ suggestion?: Suggestion; context?: unknown; notes?: string }>(req)
    const ctx = cleanContext(b?.context)
    const s = b?.suggestion
    if (!ctx || !s?.title || !Array.isArray(s.outline)) return json({ error: 'invalid_body' }, 400)
    const voice = await getVoice(env)
    try {
      const out = await draftWithClaude(env, s, voice.profile, ctx, b?.notes)
      const id = crypto.randomUUID()
      await env.DB.prepare('INSERT INTO drafts (id, suggestion_id, format, title, body, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, String(s.id).slice(0, 80), s.format, String(s.title).slice(0, 200), out.text, out.model, now()).run()
      return json({ id, body: out.text, model: out.model })
    } catch (e) {
      console.error('draft error', e)
      return json({ error: e instanceof Error && e.message === 'refusal' ? 'refusal' : 'ai_error' }, 502)
    }
  }

  // Skills del asistente
  if (path.startsWith('/skills')) {
    const b = m === 'POST' ? await body<Record<string, unknown>>(req) : null
    const res = await skillsRoute(path, m, b, env)
    if (res) return res
  }

  // Chat del asistente (búsqueda web, lectura de links, skills)
  if (path === '/assistant/chat' && m === 'POST') {
    if (!aiEnabled(env)) return json({ error: 'ai_not_configured' }, 503)
    const b = await body<{ threadId?: string; message?: string; useSkills?: boolean; context?: unknown }>(req)
    const ctx = cleanContext(b?.context)
    const message = String(b?.message ?? '').trim().slice(0, 8000)
    if (!ctx || message.length < 2) return json({ error: 'invalid_body' }, 400)
    let threadId = b?.threadId && /^[0-9a-f-]{36}$/.test(b.threadId) ? b.threadId : null
    let stored: StoredTurn[] = []
    if (threadId) {
      const row = await env.DB.prepare('SELECT messages FROM assistant_threads WHERE id = ?').bind(threadId).first<{ messages: string }>()
      if (row) stored = JSON.parse(row.messages) as StoredTurn[]
      else threadId = null
    }
    const history: ChatTurn[] = [...stored.slice(-16).map(t => ({ role: t.role, content: t.content })), { role: 'user', content: message }]
    const [voice, items, skills] = await Promise.all([
      getVoice(env),
      env.DB.prepare("SELECT title, type, stage, start_date, end_date, owner FROM board_items WHERE stage != 'listo' AND COALESCE(end_date, start_date) >= ? ORDER BY COALESCE(start_date, end_date) LIMIT 25").bind(ctx.today).all<Pick<Item, 'title' | 'type' | 'stage' | 'start_date' | 'end_date' | 'owner'>>(),
      b?.useSkills ? enabledSkills(env) : Promise.resolve([]),
    ])
    const board = items.results.map(i => `- ${i.start_date ?? i.end_date}: ${i.title} (${i.type}, ${i.stage}${i.owner ? `, ${i.owner}` : ''})`).join('\n')
    try {
      const out = await runAgent(env, brandSystem(voice.profile, ctx, board), history, skills)
      for (const f of out.files) await env.DB.prepare('INSERT OR IGNORE INTO assistant_files (id, filename, created_at) VALUES (?, ?, ?)').bind(f.id, f.filename, now()).run()
      const reply: StoredTurn = { role: 'assistant', content: out.text, at: now(), sources: out.sources, files: out.files, model: out.model }
      const full = [...stored, { role: 'user', content: message, at: now() } as StoredTurn, reply].slice(-60)
      const id = threadId ?? crypto.randomUUID()
      await env.DB.prepare('INSERT INTO assistant_threads (id, title, messages, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET messages = excluded.messages, updated_at = excluded.updated_at')
        .bind(id, (stored[0]?.content ?? message).slice(0, 80), JSON.stringify(full), now()).run()
      return json({ threadId: id, reply, usage: out.usage })
    } catch (e) {
      console.error('agent error', e)
      const msg = e instanceof Error ? e.message : ''
      return json({ error: msg === 'refusal' ? 'refusal' : 'ai_error', detail: msg.slice(0, 300) }, 502)
    }
  }
  if (path === '/assistant/threads' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, title, updated_at FROM assistant_threads ORDER BY updated_at DESC LIMIT 30').all()
    return json({ threads: results })
  }
  const th = path.match(/^\/assistant\/threads\/([0-9a-f-]{36})$/)
  if (th && m === 'GET') {
    const row = await env.DB.prepare('SELECT id, title, messages, updated_at FROM assistant_threads WHERE id = ?').bind(th[1]).first<{ id: string; title: string; messages: string; updated_at: string }>()
    return row ? json({ ...row, messages: JSON.parse(row.messages) }) : json({ error: 'not_found' }, 404)
  }
  if (th && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM assistant_threads WHERE id = ?').bind(th[1]).run()
    return json({ ok: true })
  }
  const fl = path.match(/^\/assistant\/files\/(file_[\w-]{4,120})$/)
  if (fl && m === 'GET') {
    // Solo archivos que creó el propio asistente
    const known = await env.DB.prepare('SELECT id FROM assistant_files WHERE id = ?').bind(fl[1]).first()
    if (!known || !aiEnabled(env)) return json({ error: 'not_found' }, 404)
    try { return await downloadFile(env, fl[1]) } catch { return json({ error: 'file_unavailable' }, 502) }
  }

  // Calendario colaborativo
  if (path === '/board' || path.startsWith('/board/')) {
    const b = m === 'POST' || m === 'PUT' ? await body<Record<string, unknown>>(req) : { who: url.searchParams.get('who') }
    const res = await boardRoute(path, m, b, env)
    if (res) return res
  }

  // Conexiones (pestaña /admin → Conexiones)
  if (path === '/connections' && m === 'GET') {
    const status = await settingsStatus(env)
    const e = await withSettings(env)
    let pixel: unknown = null
    if (e.META_PIXEL_ID && e.META_ACCESS_TOKEN) {
      const r = await metaPixelStatus(e, e.META_ACCESS_TOKEN, e.META_PIXEL_ID)
      pixel = r.ok ? r.pixel : { error: r.error }
    }
    return json({ ...status, pixel })
  }
  if (path === '/connections' && m === 'PUT') {
    const b = await body<{ values?: Record<string, unknown> }>(req)
    if (!b?.values || typeof b.values !== 'object') return json({ error: 'invalid_body' }, 400)
    const r = await saveSettings(env, b.values)
    return r.ok ? json({ ...(await settingsStatus(env)), ok: true }) : json(r, 400)
  }
  if (path === '/connections/meta/accounts' && m === 'POST') {
    const b = await body<{ token?: string }>(req)
    const e = await withSettings(env)
    const tok = typeof b?.token === 'string' && b.token.trim() ? b.token.trim() : e.META_ACCESS_TOKEN
    if (!tok) return json({ ok: false, error: { code: 'invalid_token', message: 'missing' } }, 400)
    return json(await metaAccounts(e, tok))
  }
  if (path === '/connections/meta/pixels' && m === 'POST') {
    const e = await withSettings(env)
    if (!e.META_ACCESS_TOKEN || !e.META_AD_ACCOUNT_ID) return json({ ok: false, error: { code: 'not_found', message: 'ads_not_connected' } })
    return json(await metaPixels(e, e.META_ACCESS_TOKEN, e.META_AD_ACCOUNT_ID))
  }
  if (path === '/connections/meta/capi-test' && m === 'POST') {
    const b = await body<{ testCode?: string }>(req)
    const code = String(b?.testCode ?? '').trim()
    if (!/^TEST[A-Z0-9]{2,20}$/i.test(code)) return json({ ok: false, error: { code: 'invalid_test_code', message: 'invalid' } }, 400)
    return json(await metaCapiTest(await withSettings(env), code.toUpperCase()))
  }

  // Medición pública: lo consulta el servidor de la web (nunca el navegador directo)
  if (path === '/tracking/public' && m === 'GET') {
    const e = await withSettings(env)
    return json({ metaPixelId: e.META_PIXEL_ID ?? null, capi: Boolean(e.META_PIXEL_ID && e.META_CAPI_TOKEN) })
  }
  if (path === '/tracking/capi' && m === 'POST') {
    const b = await body<Partial<ConversionInput>>(req)
    if (!b || !['Lead', 'CompleteRegistration'].includes(String(b.event_name)) || !/^[\w-]{8,64}$/.test(String(b.event_id ?? ''))) return json({ error: 'invalid_body' }, 400)
    const str = (v: unknown, max: number) => (typeof v === 'string' && v ? v.slice(0, max) : undefined)
    const url = str(b.event_source_url, 500) ?? ''
    if (!/^https?:\/\//.test(url)) return json({ error: 'invalid_body' }, 400)
    const email = str(b.email, 254)
    const r = await sendConversion(await withSettings(env), {
      event_name: b.event_name as ConversionInput['event_name'],
      event_id: String(b.event_id),
      event_source_url: url,
      email: email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : undefined,
      client_ip: str(b.client_ip, 64),
      user_agent: str(b.user_agent, 400),
      fbp: str(b.fbp, 200),
      fbc: str(b.fbc, 500),
    })
    if (!r.ok) console.error('capi', r.error)
    return json(r)
  }

  // Pauta
  if (path === '/ads/summary' && m === 'GET') {
    const days = url.searchParams.get('days') === '7' ? 7 : 30
    return json(await adsSummary(env, days, url.searchParams.get('refresh') === '1'))
  }

  return json({ error: 'not_found' }, 404)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (!(await authorized(req, env))) return json({ error: 'unauthorized' }, 401)
    try {
      return await handle(req, env)
    } catch (e) {
      console.error('unhandled', e)
      return json({ error: 'internal' }, 500)
    }
  },

  // Cada 6 h: refresca la caché de pauta para que el panel cargue al instante
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    const cfg = adsConfig(await withSettings(env))
    if (cfg.google.length && cfg.meta.length) return
    ctx.waitUntil(Promise.all([adsSummary(env, 30, true), adsSummary(env, 7, true)]))
  },
} satisfies ExportedHandler<Env>
