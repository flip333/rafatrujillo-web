'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

/* Chat del asistente (búsqueda web, lectura de links, skills) y biblioteca de skills.
   Todo pasa por /api/admin/services → Worker de Cloudflare → API de Anthropic. */

interface Source { url: string; title: string }
interface OutFile { id: string; filename: string; mime: string; size: number }
interface Turn { role: 'user' | 'assistant'; content: string; at?: string; sources?: Source[]; files?: OutFile[]; model?: string }
interface Thread { id: string; title: string; updated_at: string }
interface SkillRow { skill_id: string; type: 'anthropic' | 'custom'; name: string; description: string | null; origin: string | null; enabled: number }
interface Preview { name: string; description: string; skillMd: string; files: { path: string; bytes: number }[] }

const API = '/api/admin/services'
async function api<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: init?.signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `http_${res.status}`)
  return data as T
}

const S = {
  card: { background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' } as React.CSSProperties,
  h2: { fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-accent)' } as React.CSSProperties,
  label: { fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rafa-muted)' } as React.CSSProperties,
  note: { fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--rafa-muted)' } as React.CSSProperties,
  input: { width: '100%', padding: '0.7rem 0.85rem', background: 'var(--rafa-surface-2)', border: '1px solid var(--rafa-border)', color: 'var(--rafa-text)', fontSize: '0.92rem', outline: 'none', fontFamily: 'var(--font-inter)' } as React.CSSProperties,
  btn: { padding: '0.5rem 0.9rem', border: '1px solid var(--rafa-border)', background: 'transparent', color: 'var(--rafa-text)', fontSize: '0.78rem', cursor: 'pointer' } as React.CSSProperties,
  btnAccent: { padding: '0.6rem 1.1rem', border: '1px solid var(--rafa-accent)', background: 'var(--rafa-accent)', color: '#0a0a0a', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
}

const ERR: Record<string, string> = {
  ai_not_configured: 'La IA no está activa (falta ANTHROPIC_API_KEY en el Worker).',
  ai_error: 'La IA no respondió. Inténtalo de nuevo en un momento.',
  refusal: 'El modelo prefirió no responder eso. Reformula la pregunta.',
  services_unreachable: 'No hay conexión con los microservicios. Intenta de nuevo.',
  unauthorized: 'Tu sesión expiró. Recarga la página.',
  invalid_github_url: 'Pega un link de una carpeta de GitHub, por ejemplo github.com/anthropics/skills/tree/main/skills/pdf',
  github_not_found: 'No encontré esa carpeta en GitHub (¿es pública y la ruta es correcta?).',
  github_rate_limit: 'GitHub limitó las descargas por ahora. Intenta en unos minutos.',
  no_skill_md: 'Esa carpeta no tiene un SKILL.md en la raíz: no es una skill.',
  not_a_folder: 'Ese link apunta a un archivo; pega el link de la carpeta de la skill.',
  install_failed: 'Anthropic no aceptó la skill. Revisa que el SKILL.md tenga name y description.',
}
const errText = (e: unknown) => ERR[e instanceof Error ? e.message : ''] ?? 'Algo salió mal. Inténtalo de nuevo.'

/* ─────────────────────────── Markdown mínimo y seguro ─────────────────────────── */

function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|(https?:\/\/[^\s)<>\]]+)/g
  let last = 0, m: RegExpExecArray | null, k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const id = `${key}-${k++}`
    if (m[1]) out.push(<strong key={id} style={{ color: 'var(--rafa-text)' }}>{m[1]}</strong>)
    else if (m[2]) out.push(<a key={id} href={m[3]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rafa-accent)' }}>{m[2]}</a>)
    else if (m[4]) out.push(<code key={id} style={{ background: 'var(--rafa-surface-2)', padding: '0 4px' }}>{m[4]}</code>)
    else if (m[5]) out.push(<a key={id} href={m[5]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rafa-accent)', wordBreak: 'break-all' }}>{m[5]}</a>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  const lines = text.split('\n')
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = (k: number) => {
    if (!list) return
    const L = list.ordered ? 'ol' : 'ul'
    blocks.push(<L key={`l${k}`} style={{ paddingLeft: '1.2rem', listStyle: list.ordered ? 'decimal' : 'disc', margin: '0.3rem 0' }}>{list.items.map((t, i) => <li key={i} style={{ margin: '0.15rem 0' }}>{inline(t, `l${k}-${i}`)}</li>)}</L>)
    list = null
  }
  lines.forEach((ln, k) => {
    const li = ln.match(/^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/)
    if (li) {
      const ordered = !!li[1]
      if (!list || list.ordered !== ordered) { flush(k); list = { ordered, items: [] } }
      list.items.push(li[2]); return
    }
    flush(k)
    const h = ln.match(/^(#{1,4})\s+(.*)$/)
    if (h) blocks.push(<p key={k} style={{ fontWeight: 600, color: 'var(--rafa-text)', marginTop: '0.6rem', fontSize: h[1].length <= 2 ? '1rem' : '0.92rem' }}>{inline(h[2], `h${k}`)}</p>)
    else if (ln.trim() === '---') blocks.push(<hr key={k} style={{ border: 'none', borderTop: '1px solid var(--rafa-border)', margin: '0.6rem 0' }} />)
    else if (ln.trim()) blocks.push(<p key={k} style={{ margin: '0.3rem 0' }}>{inline(ln, `p${k}`)}</p>)
  })
  flush(lines.length)
  return <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--rafa-text)' }}>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>
}

/* ─────────────────────────── Chat ─────────────────────────── */

const PROMPTS = [
  'Busca 5 playlists independientes o curadores que reciban indie pop en español y cómo enviarles música.',
  'Analiza este link y dime qué puedo aprender para mi newsletter: ',
  '¿Qué están haciendo artistas indie colombianos en TikTok e Instagram para sus lanzamientos este mes?',
  'Arma un plan de pauta de 300 USD para las 2 semanas del lanzamiento, repartido entre Meta y Google.',
]

export function ChatCard({ ai, skillsOn }: { ai: boolean; skillsOn: number }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [useSkills, setUseSkills] = useState(false)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const loadThreads = useCallback(async () => { try { setThreads((await api<{ threads: Thread[] }>('assistant/threads')).threads) } catch {} }, [])
  useEffect(() => { if (ai) loadThreads() }, [ai, loadThreads])
  useEffect(() => { if (!busy) return; const t0 = Date.now(); const id = window.setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000); return () => window.clearInterval(id) }, [busy])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [turns, busy])

  const open = async (id: string) => {
    setErr(null)
    if (!id) { setThreadId(null); setTurns([]); return }
    try { const t = await api<{ messages: Turn[] }>(`assistant/threads/${id}`); setThreadId(id); setTurns(t.messages) } catch (e) { setErr(errText(e)) }
  }
  const remove = async () => {
    if (!threadId) return
    try { await api(`assistant/threads/${threadId}`, { method: 'DELETE' }); setThreadId(null); setTurns([]); loadThreads() } catch (e) { setErr(errText(e)) }
  }

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const msg = text.trim()
    if (msg.length < 2 || busy) return
    setErr(null); setBusy(true); setElapsed(0)
    setTurns(t => [...t, { role: 'user', content: msg }]); setText('')
    try {
      const r = await api<{ threadId: string; reply: Turn }>('assistant/chat', { method: 'POST', body: { threadId, message: msg, useSkills: useSkills && skillsOn > 0 } })
      setThreadId(r.threadId); setTurns(t => [...t, r.reply]); loadThreads()
    } catch (e2) {
      setErr(errText(e2)); setTurns(t => t.slice(0, -1)); setText(msg)
    } finally { setBusy(false) }
  }

  return (
    <section className="p-5" style={S.card} aria-labelledby="chat-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="chat-title" style={S.h2}>Pregúntale al asistente</h2>
          <p style={{ ...S.note, marginTop: 2 }}>Busca en internet, lee los links que le pegues y conoce tu voz, tus canciones y el calendario del equipo.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select aria-label="Conversaciones" value={threadId ?? ''} onChange={e => open(e.target.value)} style={{ ...S.input, width: 'auto', maxWidth: 220, padding: '0.45rem 0.6rem', fontSize: '0.78rem' }} disabled={busy}>
            <option value="">+ Nueva conversación</option>
            {threads.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          {threadId && <button style={{ ...S.btn, color: 'var(--rafa-muted)' }} onClick={remove} disabled={busy} aria-label="Borrar conversación">✕</button>}
        </div>
      </div>

      {!ai ? <p className="mt-4" style={S.note}>Se activa al configurar la llave de Anthropic en el Worker (<code>npm run ai:key</code>).</p> : (
        <>
          <div className="mt-4 flex flex-col gap-3" style={{ maxHeight: 520, overflowY: 'auto' }} aria-live="polite">
            {turns.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map(p => (
                  <button key={p} type="button" onClick={() => { setText(p); taRef.current?.focus() }} style={{ ...S.btn, textAlign: 'left', color: 'var(--rafa-muted)', maxWidth: '100%' }}>{p}</button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className="p-3" style={{ background: t.role === 'user' ? 'var(--rafa-surface-2)' : 'transparent', border: t.role === 'user' ? 'none' : '1px solid var(--rafa-border)', marginLeft: t.role === 'user' ? 'auto' : 0, maxWidth: t.role === 'user' ? '85%' : '100%' }}>
                {t.role === 'user'
                  ? <p style={{ fontSize: '0.9rem', color: 'var(--rafa-text)', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{t.content}</p>
                  : <>
                      <Markdown text={t.content} />
                      {!!t.files?.length && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {t.files.map(f => <a key={f.id} href={`${API}/assistant/files/${f.id}`} style={{ ...S.btn, color: 'var(--rafa-accent)', textDecoration: 'none' }}>↓ {f.filename} <span style={{ opacity: 0.6 }}>({Math.max(1, Math.round(f.size / 1024))} KB)</span></a>)}
                        </div>
                      )}
                      {!!t.sources?.length && (
                        <details className="mt-3" style={S.note}>
                          <summary style={{ cursor: 'pointer' }}>Fuentes ({t.sources.length})</summary>
                          <ul className="mt-1 flex flex-col gap-1">
                            {t.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rafa-accent)', wordBreak: 'break-word' }}>{s.title}</a></li>)}
                          </ul>
                        </details>
                      )}
                      {t.content && <button type="button" className="mt-2" style={{ ...S.btn, padding: '0.3rem 0.6rem', fontSize: '0.72rem', color: 'var(--rafa-muted)' }} onClick={() => navigator.clipboard?.writeText(t.content)}>Copiar</button>}
                    </>}
              </div>
            ))}
            {busy && <p style={S.note}><span className="live-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: 'var(--rafa-accent)', marginRight: 8 }} />Investigando… {elapsed}s {elapsed > 20 && '· buscar y leer fuentes puede tardar 1–2 minutos'}</p>}
            <div ref={endRef} />
          </div>

          {err && <p role="alert" className="mt-3" style={{ color: '#e06060', fontSize: '0.82rem' }}>{err}</p>}
          <form onSubmit={send} className="mt-4 flex flex-col gap-2">
            <textarea ref={taRef} rows={3} value={text} onChange={e => setText(e.target.value)} maxLength={8000} aria-label="Mensaje para el asistente"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Pregunta, pide una investigación o pega un link…" style={{ ...S.input, resize: 'vertical' }} disabled={busy} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2" style={{ ...S.note, cursor: skillsOn ? 'pointer' : 'default', opacity: skillsOn ? 1 : 0.6 }} title={skillsOn ? 'Permite crear archivos (Word, PDF, Excel, PowerPoint…) con las skills activas' : 'Activa al menos una skill en la biblioteca'}>
                <input type="checkbox" checked={useSkills && skillsOn > 0} disabled={!skillsOn || busy} onChange={e => setUseSkills(e.target.checked)} style={{ accentColor: 'var(--rafa-accent)', width: 16, height: 16 }} />
                Usar skills ({skillsOn} activas) · crea archivos
              </label>
              <button type="submit" style={S.btnAccent} disabled={busy || text.trim().length < 2}>{busy ? 'Trabajando…' : 'Enviar'}</button>
            </div>
            <p style={{ ...S.note, fontSize: '0.72rem' }}>Enter envía · Shift+Enter salto de línea · cada respuesta consume créditos de Anthropic (más si busca en internet o crea archivos).</p>
          </form>
        </>
      )}
    </section>
  )
}

/* ─────────────────────────── Skills ─────────────────────────── */

const SKILL_INFO: Record<string, string> = {
  pdf: 'PDF: one-sheets, kits de prensa, leer PDFs',
  docx: 'Word: comunicados, contratos, checklists',
  xlsx: 'Excel: presupuestos, reportes de pauta',
  pptx: 'PowerPoint: presentaciones para marcas o sellos',
}

export function SkillsCard({ ai, onCount }: { ai: boolean; onCount: (n: number) => void }) {
  const [installed, setInstalled] = useState<SkillRow[]>([])
  const [catalog, setCatalog] = useState<{ skill_id: string; name: string }[]>([])
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const apply = useCallback((rows: SkillRow[]) => { setInstalled(rows); onCount(rows.filter(r => r.enabled).length) }, [onCount])
  useEffect(() => {
    if (!ai) return
    api<{ installed: SkillRow[]; catalog: { skill_id: string; name: string }[] }>('skills').then(r => { apply(r.installed); setCatalog(r.catalog) }).catch(e => setErr(errText(e)))
  }, [ai, apply])

  const toggle = async (skill_id: string, type: 'anthropic' | 'custom', name: string, enabled: boolean) => {
    setBusy(skill_id); setErr(null)
    try { apply((await api<{ installed: SkillRow[] }>('skills/toggle', { method: 'POST', body: { skill_id, type, name, enabled } })).installed) } catch (e) { setErr(errText(e)) } finally { setBusy(null) }
  }
  const review = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy('preview'); setErr(null); setPreview(null)
    try { setPreview(await api<Preview>('skills/preview', { method: 'POST', body: { url } })) } catch (e2) { setErr(errText(e2)) } finally { setBusy(null) }
  }
  const install = async () => {
    setBusy('install'); setErr(null)
    try { apply((await api<{ installed: SkillRow[] }>('skills/install', { method: 'POST', body: { url } })).installed); setPreview(null); setUrl('') } catch (e) { setErr(errText(e)) } finally { setBusy(null) }
  }
  const remove = async (id: string) => {
    setBusy(id); setErr(null)
    try { apply((await api<{ installed: SkillRow[] }>(`skills/${id}`, { method: 'DELETE' })).installed) } catch (e) { setErr(errText(e)) } finally { setBusy(null) }
  }

  const isOn = (id: string) => installed.some(r => r.skill_id === id && r.enabled)
  const custom = installed.filter(r => r.type === 'custom')

  return (
    <section className="p-5" style={S.card}>
      <h2 style={S.h2}>Skills del asistente</h2>
      <p style={{ ...S.note, marginTop: 2 }}>Capacidades extra que el asistente usa cuando marcas “Usar skills” en el chat.</p>
      {!ai ? <p className="mt-3" style={S.note}>Disponible cuando la IA esté activa.</p> : (
        <>
          <p className="mt-4" style={S.label}>De Anthropic</p>
          <ul className="mt-2 flex flex-col gap-2">
            {catalog.map(c => (
              <li key={c.skill_id}>
                <label className="flex items-start gap-2.5" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--rafa-text)' }}>
                  <input type="checkbox" checked={isOn(c.skill_id)} disabled={busy === c.skill_id} onChange={e => toggle(c.skill_id, 'anthropic', c.name, e.target.checked)} style={{ accentColor: 'var(--rafa-accent)', width: 16, height: 16, marginTop: 3 }} />
                  <span>{SKILL_INFO[c.skill_id] ?? c.name}</span>
                </label>
              </li>
            ))}
          </ul>

          <p className="mt-5" style={S.label}>Instaladas desde GitHub</p>
          {custom.length === 0 ? <p className="mt-1" style={{ ...S.note, fontSize: '0.75rem' }}>Ninguna todavía.</p> : (
            <ul className="mt-2 flex flex-col gap-2">
              {custom.map(c => (
                <li key={c.skill_id} className="flex items-start gap-2.5">
                  <input type="checkbox" aria-label={`Activar ${c.name}`} checked={!!c.enabled} disabled={busy === c.skill_id} onChange={e => toggle(c.skill_id, 'custom', c.name, e.target.checked)} style={{ accentColor: 'var(--rafa-accent)', width: 16, height: 16, marginTop: 3 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '0.85rem', color: 'var(--rafa-text)' }}>{c.name}</p>
                    {c.description && <p style={{ ...S.note, fontSize: '0.72rem' }}>{c.description.slice(0, 140)}</p>}
                    {c.origin && <a href={c.origin} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--rafa-accent)', wordBreak: 'break-all' }}>{c.origin.replace('https://github.com/', '')}</a>}
                  </div>
                  <button style={{ ...S.btn, padding: '0.2rem 0.5rem', color: 'var(--rafa-muted)' }} onClick={() => remove(c.skill_id)} disabled={busy === c.skill_id} aria-label={`Quitar ${c.name}`}>✕</button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={review} className="mt-4 flex flex-col gap-2">
            <input type="url" value={url} onChange={e => { setUrl(e.target.value); setPreview(null) }} placeholder="https://github.com/anthropics/skills/tree/main/skills/…" aria-label="Link de la skill en GitHub" style={S.input} />
            <button type="submit" style={{ ...S.btn, alignSelf: 'flex-start' }} disabled={!url || busy === 'preview'}>{busy === 'preview' ? 'Descargando para revisar…' : 'Revisar skill'}</button>
            <p style={{ ...S.note, fontSize: '0.72rem' }}>Catálogo oficial: <a href="https://github.com/anthropics/skills" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rafa-accent)' }}>github.com/anthropics/skills</a></p>
          </form>

          {preview && (
            <div className="mt-3 p-3" style={{ border: '1px solid var(--rafa-accent)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--rafa-text)', fontWeight: 600 }}>{preview.name || 'Skill sin nombre'}</p>
              <p style={{ ...S.note, fontSize: '0.78rem' }}>{preview.description || 'Sin descripción'}</p>
              <p className="mt-2" style={{ ...S.note, fontSize: '0.72rem' }}>{preview.files.length} archivos: {preview.files.map(f => f.path).join(', ').slice(0, 300)}</p>
              <details className="mt-2" style={S.note}>
                <summary style={{ cursor: 'pointer', color: 'var(--rafa-accent)' }}>Leer SKILL.md</summary>
                <pre className="mt-2" style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', maxHeight: 260, overflowY: 'auto', background: 'var(--rafa-surface-2)', padding: '0.6rem', color: 'var(--rafa-text)' }}>{preview.skillMd}</pre>
              </details>
              <p className="mt-2" style={{ fontSize: '0.75rem', color: '#e6b86b', lineHeight: 1.5 }}>Una skill trae instrucciones y código que el asistente seguirá. Instala solo skills de fuentes en las que confíes y después de leerlas.</p>
              <div className="mt-2 flex gap-2">
                <button style={S.btnAccent} onClick={install} disabled={busy === 'install'}>{busy === 'install' ? 'Instalando…' : 'Aprobar e instalar'}</button>
                <button style={S.btn} onClick={() => setPreview(null)}>Cancelar</button>
              </div>
            </div>
          )}
          {err && <p role="alert" className="mt-3" style={{ color: '#e06060', fontSize: '0.8rem' }}>{err}</p>}
        </>
      )}
    </section>
  )
}
