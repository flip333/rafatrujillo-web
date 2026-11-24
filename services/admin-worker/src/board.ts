import { type Env, json, now } from './env'

/* Calendario colaborativo del equipo: actividades (cronograma + pipeline),
   tareas pendientes y resúmenes de reuniones. Todo en D1.
   Sincronía: cada escritura sube board_meta.version; el panel consulta
   /board/version cada pocos segundos y recarga solo si cambió. */

export const TYPES = ['pauta', 'contenido', 'lanzamiento', 'redes', 'prensa', 'show', 'produccion', 'otro'] as const
export const STAGES = ['idea', 'planeado', 'en_curso', 'revision', 'listo'] as const
const KINDS = ['actividad', 'tarea'] as const

export interface Item {
  id: string; kind: (typeof KINDS)[number]; title: string; type: (typeof TYPES)[number]; stage: (typeof STAGES)[number]
  start_date: string | null; end_date: string | null; owner: string | null; notes: string | null; link: string | null
  priority: number; meeting_id: string | null; source: string | null
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string
}
export interface Meeting {
  id: string; date: string; title: string; attendees: string | null; summary: string | null; decisions: string | null
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '') || null
const date = (v: unknown) => (typeof v === 'string' && DATE.test(v) ? v : null)
const oneOf = <T extends readonly string[]>(list: T, v: unknown, fallback: T[number]): T[number] =>
  (list as readonly string[]).includes(String(v)) ? (v as T[number]) : fallback
const who = (v: unknown) => str(v, 40) ?? 'Equipo'
function safeLink(v: unknown): string | null {
  const s = str(v, 500)
  if (!s) return null
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null } catch { return null }
}

async function bump(env: Env, by: string, action: string, title: string) {
  await env.DB.batch([
    env.DB.prepare('INSERT INTO board_meta (id, version) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET version = version + 1'),
    env.DB.prepare('INSERT INTO board_log (at, who, action, title) VALUES (?, ?, ?, ?)').bind(now(), by, action, title.slice(0, 160)),
    env.DB.prepare('DELETE FROM board_log WHERE id NOT IN (SELECT id FROM board_log ORDER BY id DESC LIMIT 200)'),
  ])
}

async function version(env: Env): Promise<number> {
  const r = await env.DB.prepare('SELECT version FROM board_meta WHERE id = 1').first<{ version: number }>()
  return r?.version ?? 0
}

async function snapshot(env: Env) {
  const [items, meetings, log, v] = await Promise.all([
    env.DB.prepare('SELECT * FROM board_items ORDER BY COALESCE(start_date, end_date, created_at) ASC LIMIT 1000').all<Item>(),
    env.DB.prepare('SELECT * FROM meetings ORDER BY date DESC, created_at DESC LIMIT 200').all<Meeting>(),
    env.DB.prepare('SELECT at, who, action, title FROM board_log ORDER BY id DESC LIMIT 30').all(),
    version(env),
  ])
  return { version: v, items: items.results, meetings: meetings.results, log: log.results }
}

function itemFields(b: Record<string, unknown>, partial: boolean) {
  const f: Partial<Item> = {}
  const has = (k: string) => !partial || k in b
  if (has('title')) f.title = str(b.title, 200) ?? ''
  if (has('kind')) f.kind = oneOf(KINDS, b.kind, 'actividad')
  if (has('type')) f.type = oneOf(TYPES, b.type, 'otro')
  if (has('stage')) f.stage = oneOf(STAGES, b.stage, 'planeado')
  if (has('start_date')) f.start_date = date(b.start_date)
  if (has('end_date')) f.end_date = date(b.end_date)
  if (has('owner')) f.owner = str(b.owner, 60)
  if (has('notes')) f.notes = str(b.notes, 4000)
  if (has('link')) f.link = safeLink(b.link)
  if (has('priority')) f.priority = Math.min(3, Math.max(1, Number(b.priority) || 2))
  if (has('source')) f.source = str(b.source, 80)
  if (f.start_date && f.end_date && f.end_date < f.start_date) f.end_date = f.start_date
  return f
}

async function insertItem(env: Env, f: Partial<Item>, by: string, meetingId: string | null = null): Promise<string> {
  const id = crypto.randomUUID(), t = now()
  await env.DB.prepare(`INSERT INTO board_items (id, kind, title, type, stage, start_date, end_date, owner, notes, link, priority, meeting_id, source, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, f.kind ?? 'actividad', f.title, f.type ?? 'otro', f.stage ?? 'planeado', f.start_date ?? null, f.end_date ?? null,
      f.owner ?? null, f.notes ?? null, f.link ?? null, f.priority ?? 2, meetingId, f.source ?? null, by, by, t, t).run()
  return id
}

type Body = Record<string, unknown> | null

export async function boardRoute(path: string, method: string, b: Body, env: Env): Promise<Response | null> {
  if (path === '/board' && method === 'GET') return json(await snapshot(env))
  if (path === '/board/version' && method === 'GET') return json({ version: await version(env) })

  // ── Actividades y tareas ──
  if (path === '/board/items' && method === 'POST') {
    if (!b) return json({ error: 'invalid_body' }, 400)
    const by = who(b.who)
    const list = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]).slice(0, 40) : [b]
    let n = 0
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue
      const f = itemFields(raw, false)
      if (!f.title) continue
      await insertItem(env, f, by); n++
    }
    if (!n) return json({ error: 'empty_title' }, 400)
    await bump(env, by, n > 1 ? `agregó ${n} actividades` : 'agregó', n > 1 ? String(b.label ?? 'plantilla') : String((list[0] as Record<string, unknown>).title))
    return json(await snapshot(env))
  }
  const im = path.match(/^\/board\/items\/([0-9a-f-]{36})$/)
  if (im && method === 'PUT') {
    if (!b) return json({ error: 'invalid_body' }, 400)
    const prev = await env.DB.prepare('SELECT title, stage FROM board_items WHERE id = ?').bind(im[1]).first<{ title: string; stage: string }>()
    if (!prev) return json({ error: 'not_found' }, 404)
    const f = itemFields(b, true)
    if ('title' in f && !f.title) return json({ error: 'empty_title' }, 400)
    const by = who(b.who)
    const keys = Object.keys(f) as (keyof Item)[]
    if (keys.length) {
      await env.DB.prepare(`UPDATE board_items SET ${keys.map(k => `${k} = ?`).join(', ')}, updated_by = ?, updated_at = ? WHERE id = ?`)
        .bind(...keys.map(k => f[k] ?? null), by, now(), im[1]).run()
      const action = f.stage && f.stage !== prev.stage ? (f.stage === 'listo' ? 'completó' : `movió a ${f.stage.replace('_', ' ')}`) : 'editó'
      await bump(env, by, action, f.title ?? prev.title)
    }
    return json(await snapshot(env))
  }
  if (im && method === 'DELETE') {
    const prev = await env.DB.prepare('SELECT title FROM board_items WHERE id = ?').bind(im[1]).first<{ title: string }>()
    if (prev) {
      await env.DB.prepare('DELETE FROM board_items WHERE id = ?').bind(im[1]).run()
      await bump(env, who(b?.who), 'eliminó', prev.title)
    }
    return json(await snapshot(env))
  }

  // ── Reuniones (con próximos pasos → tareas) ──
  if (path === '/board/meetings' && method === 'POST') {
    if (!b) return json({ error: 'invalid_body' }, 400)
    const title = str(b.title, 200), d = date(b.date)
    if (!title || !d) return json({ error: 'invalid_meeting' }, 400)
    const by = who(b.who), id = crypto.randomUUID(), t = now()
    await env.DB.prepare('INSERT INTO meetings (id, date, title, attendees, summary, decisions, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, d, title, str(b.attendees, 300), str(b.summary, 8000), str(b.decisions, 4000), by, by, t, t).run()
    const actions = Array.isArray(b.actions) ? (b.actions as Record<string, unknown>[]).slice(0, 30) : []
    for (const a of actions) {
      const f = itemFields({ ...a, kind: 'tarea', stage: 'planeado', type: a?.type ?? 'otro' }, false)
      if (f.title) await insertItem(env, f, by, id)
    }
    await bump(env, by, actions.length ? `registró reunión (+${actions.length} tareas)` : 'registró reunión', title)
    return json(await snapshot(env))
  }
  const mm = path.match(/^\/board\/meetings\/([0-9a-f-]{36})$/)
  if (mm && method === 'PUT') {
    if (!b) return json({ error: 'invalid_body' }, 400)
    const prev = await env.DB.prepare('SELECT title FROM meetings WHERE id = ?').bind(mm[1]).first<{ title: string }>()
    if (!prev) return json({ error: 'not_found' }, 404)
    const title = str(b.title, 200) ?? prev.title, d = date(b.date)
    const by = who(b.who)
    await env.DB.prepare('UPDATE meetings SET title = ?, date = COALESCE(?, date), attendees = ?, summary = ?, decisions = ?, updated_by = ?, updated_at = ? WHERE id = ?')
      .bind(title, d, str(b.attendees, 300), str(b.summary, 8000), str(b.decisions, 4000), by, now(), mm[1]).run()
    await bump(env, by, 'editó reunión', title)
    return json(await snapshot(env))
  }
  if (mm && method === 'DELETE') {
    const prev = await env.DB.prepare('SELECT title FROM meetings WHERE id = ?').bind(mm[1]).first<{ title: string }>()
    if (prev) {
      // Las tareas que salieron de la reunión se conservan (solo pierden el vínculo)
      await env.DB.batch([
        env.DB.prepare('UPDATE board_items SET meeting_id = NULL WHERE meeting_id = ?').bind(mm[1]),
        env.DB.prepare('DELETE FROM meetings WHERE id = ?').bind(mm[1]),
      ])
      await bump(env, who(b?.who), 'eliminó reunión', prev.title)
    }
    return json(await snapshot(env))
  }

  return null
}
