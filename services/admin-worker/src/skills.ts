import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { type Env, json, now } from './env'
import type { EnabledSkill } from './agent'

/* Biblioteca de skills del asistente.
   - Skills de Anthropic (pdf, docx, xlsx, pptx…): se listan desde la API y se activan.
   - Skills de GitHub (por ejemplo github.com/anthropics/skills): primero se descargan
     para REVISIÓN (se muestra el SKILL.md y la lista de archivos) y solo se suben a
     Anthropic cuando alguien del equipo las aprueba. Solo texto, con límites de tamaño.
   Una skill trae instrucciones que el asistente seguirá: por eso nunca se instala sin revisar. */

const GH_HOST = 'github.com'
const MAX_FILES = 25
const MAX_FILE_BYTES = 200_000
const MAX_TOTAL_BYTES = 1_000_000
const TEXT_EXT = /\.(md|txt|py|js|mjs|ts|json|ya?ml|csv|html|css|sh|xml|toml|ini)$/i

interface Row { skill_id: string; type: 'anthropic' | 'custom'; name: string; description: string | null; origin: string | null; enabled: number; created_at: string }
interface GhFile { path: string; content: string }

const client = (env: Env) => new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

export async function enabledSkills(env: Env): Promise<EnabledSkill[]> {
  const { results } = await env.DB.prepare('SELECT skill_id, type, name FROM skills WHERE enabled = 1 ORDER BY created_at LIMIT 8').all<{ skill_id: string; type: 'anthropic' | 'custom'; name: string }>()
  return results
}

async function listRows(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM skills ORDER BY type, name').all<Row>()
  return results
}

function parseGithub(raw: string) {
  let u: URL
  try { u = new URL(raw.trim()) } catch { return null }
  if (u.protocol !== 'https:' || u.hostname !== GH_HOST) return null
  const p = u.pathname.split('/').filter(Boolean)
  if (p.length < 2) return null
  const [owner, repo] = p
  if (!/^[\w.-]{1,100}$/.test(owner) || !/^[\w.-]{1,100}$/.test(repo)) return null
  let ref = '', path = ''
  if (p[2] === 'tree' || p[2] === 'blob') { ref = p[3] ?? ''; path = p.slice(4).join('/') }
  if (/SKILL\.md$/i.test(path)) path = path.replace(/\/?SKILL\.md$/i, '')
  if (path.split('/').some(s => s === '..')) return null
  return { owner, repo, ref, path }
}

async function gh(env: Env, url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'rafa-admin-services',
      Accept: 'application/vnd.github+json',
      ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(10000),
  })
  if (res.status === 403 || res.status === 429) throw new Error('github_rate_limit')
  if (res.status === 404) throw new Error('github_not_found')
  if (!res.ok) throw new Error(`github_${res.status}`)
  return res
}

/* Descarga la carpeta de la skill (hasta 2 niveles) con límites estrictos. */
async function fetchSkillFolder(env: Env, src: NonNullable<ReturnType<typeof parseGithub>>): Promise<GhFile[]> {
  const files: GhFile[] = []
  let total = 0
  const walk = async (dir: string, depth: number) => {
    const qs = src.ref ? `?ref=${encodeURIComponent(src.ref)}` : ''
    const list = (await (await gh(env, `https://api.github.com/repos/${src.owner}/${src.repo}/contents/${dir}${qs}`)).json()) as { type: string; path: string; size: number; download_url: string | null }[]
    if (!Array.isArray(list)) throw new Error('not_a_folder')
    for (const e of list) {
      if (files.length >= MAX_FILES) return
      const rel = src.path ? e.path.slice(src.path.length + 1) : e.path
      if (e.type === 'dir' && depth < 2) { await walk(e.path, depth + 1); continue }
      if (e.type !== 'file' || !e.download_url || !TEXT_EXT.test(e.path) || e.size > MAX_FILE_BYTES) continue
      if (total + e.size > MAX_TOTAL_BYTES) continue
      const dl = new URL(e.download_url)
      if (dl.hostname !== 'raw.githubusercontent.com') continue
      const content = await (await gh(env, dl.toString())).text()
      total += content.length
      files.push({ path: rel, content })
    }
  }
  await walk(src.path, 0)
  if (!files.some(f => f.path === 'SKILL.md')) throw new Error('no_skill_md')
  return files
}

function frontmatter(md: string) {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---/)
  const get = (k: string) => m?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? ''
  return { name: get('name'), description: get('description') }
}

export async function skillsRoute(path: string, method: string, b: Record<string, unknown> | null, env: Env): Promise<Response | null> {
  if (!path.startsWith('/skills')) return null
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'ai_not_configured' }, 503)

  // Lista: activas/instaladas + catálogo de Anthropic
  if (path === '/skills' && method === 'GET') {
    let catalog: { skill_id: string; name: string }[] = []
    try {
      for await (const s of client(env).skills.list({ source: 'anthropic' })) catalog.push({ skill_id: s.id, name: s.display_name })
    } catch (e) { console.error('skills.list', e) }
    if (!catalog.length) catalog = ['pdf', 'docx', 'xlsx', 'pptx'].map(id => ({ skill_id: id, name: id }))
    return json({ installed: await listRows(env), catalog })
  }

  // Activar / desactivar
  if (path === '/skills/toggle' && method === 'POST') {
    const id = String(b?.skill_id ?? ''), type = b?.type === 'custom' ? 'custom' : 'anthropic', enabled = b?.enabled ? 1 : 0
    if (!/^[\w-]{1,120}$/.test(id)) return json({ error: 'invalid_skill' }, 400)
    if (type === 'anthropic') {
      await env.DB.prepare(`INSERT INTO skills (skill_id, type, name, description, origin, enabled, created_at) VALUES (?, 'anthropic', ?, ?, 'anthropic', ?, ?)
        ON CONFLICT(skill_id) DO UPDATE SET enabled = excluded.enabled`).bind(id, String(b?.name ?? id).slice(0, 120), null, enabled, now()).run()
    } else {
      await env.DB.prepare('UPDATE skills SET enabled = ? WHERE skill_id = ? AND type = ?').bind(enabled, id, 'custom').run()
    }
    return json({ installed: await listRows(env) })
  }

  // Revisar una skill de GitHub antes de instalarla
  if (path === '/skills/preview' && method === 'POST') {
    const src = parseGithub(String(b?.url ?? ''))
    if (!src) return json({ error: 'invalid_github_url' }, 400)
    try {
      const files = await fetchSkillFolder(env, src)
      const skillMd = files.find(f => f.path === 'SKILL.md')!.content
      return json({ ...frontmatter(skillMd), skillMd: skillMd.slice(0, 20000), files: files.map(f => ({ path: f.path, bytes: f.content.length })) })
    } catch (e) { return json({ error: e instanceof Error ? e.message : 'github_error' }, 422) }
  }

  // Instalar (después de revisar): se sube a la cuenta de Anthropic como skill propia
  if (path === '/skills/install' && method === 'POST') {
    const src = parseGithub(String(b?.url ?? ''))
    if (!src) return json({ error: 'invalid_github_url' }, 400)
    try {
      const files = await fetchSkillFolder(env, src)
      const fm = frontmatter(files.find(f => f.path === 'SKILL.md')!.content)
      const dir = (fm.name || src.path.split('/').pop() || src.repo).toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 60) || 'skill'
      const uploads = await Promise.all(files.map(f => toFile(new TextEncoder().encode(f.content), `${dir}/${f.path}`, { type: 'text/plain' })))
      const skill = await client(env).skills.create({ files: uploads, display_name: (fm.name || dir).slice(0, 120) })
      const origin = `https://github.com/${src.owner}/${src.repo}${src.ref ? `/tree/${src.ref}` : ''}${src.path ? `/${src.path}` : ''}`
      await env.DB.prepare(`INSERT INTO skills (skill_id, type, name, description, origin, enabled, created_at) VALUES (?, 'custom', ?, ?, ?, 1, ?)
        ON CONFLICT(skill_id) DO UPDATE SET enabled = 1`).bind(skill.id, skill.display_name, fm.description.slice(0, 500) || null, origin, now()).run()
      return json({ installed: await listRows(env) })
    } catch (e) {
      console.error('skills.install', e)
      const msg = e instanceof Error ? e.message : 'install_failed'
      return json({ error: msg.startsWith('github') || msg === 'no_skill_md' || msg === 'not_a_folder' ? msg : 'install_failed', detail: msg.slice(0, 300) }, 422)
    }
  }

  // Quitar una skill propia (también de la cuenta de Anthropic, si se puede)
  const del = path.match(/^\/skills\/(skill_[\w-]{4,120})$/)
  if (del && method === 'DELETE') {
    try { await client(env).skills.delete(del[1]) } catch (e) { console.error('skills.delete', e) }
    await env.DB.prepare('DELETE FROM skills WHERE skill_id = ? AND type = ?').bind(del[1], 'custom').run()
    return json({ installed: await listRows(env) })
  }
  return null
}
