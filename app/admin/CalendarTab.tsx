'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFocusTrap } from '@/lib/useFocusTrap'

/* Pestaña "Calendario": espacio de trabajo compartido del equipo.
   - Cronograma (mes) y Pipeline (etapas) de actividades: pauta, contenido, lanzamiento…
   - Panel paralelo: tareas pendientes, resúmenes de reuniones (sus próximos pasos
     se vuelven tareas) y registro de cambios.
   Colaborativo: los datos viven en D1 (Worker de Cloudflare); cada pantalla
   consulta la versión del tablero cada pocos segundos y se actualiza sola. */

type Kind = 'actividad' | 'tarea'
type ItemType = 'pauta' | 'contenido' | 'lanzamiento' | 'redes' | 'prensa' | 'show' | 'produccion' | 'otro'
type Stage = 'idea' | 'planeado' | 'en_curso' | 'revision' | 'listo'
interface Item {
  id: string; kind: Kind; title: string; type: ItemType; stage: Stage
  start_date: string | null; end_date: string | null; owner: string | null; notes: string | null; link: string | null
  priority: number; meeting_id: string | null; source: string | null
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string
}
interface Meeting {
  id: string; date: string; title: string; attendees: string | null; summary: string | null; decisions: string | null
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string
}
interface LogRow { at: string; who: string; action: string; title: string }
interface Board { version: number; items: Item[]; meetings: Meeting[]; log: LogRow[] }

export const TYPE_META: Record<ItemType, { label: string; color: string }> = {
  pauta:       { label: 'Pauta',        color: '#f2a65a' },
  contenido:   { label: 'Contenido',    color: '#7fb8e6' },
  lanzamiento: { label: 'Lanzamiento',  color: '#e5737a' },
  redes:       { label: 'Redes',        color: '#b493e0' },
  prensa:      { label: 'Prensa / PR',  color: '#7fbf8e' },
  show:        { label: 'Show / fecha', color: '#e6d36b' },
  produccion:  { label: 'Producción',   color: '#5fc9c0' },
  otro:        { label: 'Otro',         color: '#9a9a9a' },
}
const TYPES = Object.keys(TYPE_META) as ItemType[]
const STAGE_META: Record<Stage, string> = { idea: 'Idea', planeado: 'Planeado', en_curso: 'En curso', revision: 'Revisión', listo: 'Listo' }
const STAGES = Object.keys(STAGE_META) as Stage[]
const PRIORITY: Record<number, string> = { 1: 'Alta', 2: 'Media', 3: 'Baja' }

const API = '/api/admin/services'
async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `http_${res.status}`)
  return data as T
}

// ── Fechas (strings YYYY-MM-DD en hora de Colombia) ──
const todayIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const fmt = (iso: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', ...o }).format(new Date(`${iso}T12:00:00Z`))
const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000)
  if (s < 60) return 'hace un momento'
  if (s < 3600) return `hace ${Math.round(s / 60)} min`
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`
  return fmt(iso.slice(0, 10))
}
const startOf = (i: Item) => i.start_date ?? i.end_date
const endOf = (i: Item) => i.end_date ?? i.start_date
const covers = (i: Item, day: string) => { const s = startOf(i), e = endOf(i); return !!s && !!e && s <= day && day <= e }
const dateRange = (i: Item) => {
  const s = startOf(i), e = endOf(i)
  if (!s) return 'Sin fecha'
  return s === e ? fmt(s) : `${fmt(s)} → ${fmt(e!)}`
}

const S = {
  card: { background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' } as React.CSSProperties,
  h2: { fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-accent)' } as React.CSSProperties,
  label: { fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rafa-muted)', display: 'block', marginBottom: 4 } as React.CSSProperties,
  note: { fontSize: '0.78rem', lineHeight: 1.55, color: 'var(--rafa-muted)' } as React.CSSProperties,
  input: { width: '100%', padding: '0.6rem 0.75rem', background: 'var(--rafa-surface-2)', border: '1px solid var(--rafa-border)', color: 'var(--rafa-text)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-inter)', colorScheme: 'dark' } as React.CSSProperties,
  btn: { padding: '0.5rem 0.85rem', border: '1px solid var(--rafa-border)', background: 'transparent', color: 'var(--rafa-text)', fontSize: '0.78rem', cursor: 'pointer' } as React.CSSProperties,
  btnAccent: { padding: '0.55rem 1rem', border: '1px solid var(--rafa-accent)', background: 'var(--rafa-accent)', color: '#0a0a0a', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
}

const WHO_KEY = 'rafa-admin-who'
const POLL_MS = 8000

export function CalendarTab({ nextRelease }: { nextRelease: { title: string; releaseDate: string } | null }) {
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<number | null>(null)
  const [who, setWho] = useState<string>('')
  const [view, setView] = useState<'cronograma' | 'pipeline'>('cronograma')
  const [typeFilter, setTypeFilter] = useState<ItemType | 'todos'>('todos')
  const [ownerFilter, setOwnerFilter] = useState<string>('todos')
  const [editing, setEditing] = useState<Partial<Item> | null>(null)
  const [meetingForm, setMeetingForm] = useState<Partial<Meeting> | null>(null)
  const [busy, setBusy] = useState(false)
  const versionRef = useRef(0)

  useEffect(() => { try { setWho(localStorage.getItem(WHO_KEY) ?? '') } catch {} }, [])
  const saveWho = (name: string) => { setWho(name); try { localStorage.setItem(WHO_KEY, name) } catch {} }

  const apply = useCallback((b: Board) => { versionRef.current = b.version; setBoard(b); setSyncedAt(Date.now()); setError(null) }, [])
  const load = useCallback(async () => { try { apply(await api<Board>('board')) } catch (e) { setError(e instanceof Error ? e.message : 'error') } }, [apply])

  // Carga inicial + sondeo de versión (solo con la pestaña visible)
  useEffect(() => {
    load()
    const poll = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const { version } = await api<{ version: number }>('board/version')
        if (version !== versionRef.current) await load()
        else setSyncedAt(Date.now())
      } catch { /* reintenta en el próximo ciclo */ }
    }
    const id = window.setInterval(poll, POLL_MS)
    document.addEventListener('visibilitychange', poll)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', poll) }
  }, [load])

  const mutate = useCallback(async (path: string, method: string, body?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const qs = method === 'DELETE' ? `?who=${encodeURIComponent(who || 'Equipo')}` : ''
      apply(await api<Board>(path + qs, { method, body: body ? { ...body, who: who || 'Equipo' } : undefined }))
      return true
    } catch (e) { setError(e instanceof Error ? e.message : 'error'); return false } finally { setBusy(false) }
  }, [apply, who])

  const items = board?.items ?? []
  const owners = useMemo(() => [...new Set(items.map(i => i.owner).filter(Boolean) as string[])].sort(), [items])
  const visible = items.filter(i => (typeFilter === 'todos' || i.type === typeFilter) && (ownerFilter === 'todos' || i.owner === ownerFilter))
  const activities = visible.filter(i => i.kind === 'actividad')
  const hasLaunchPlan = items.some(i => i.source?.startsWith('plan-lanzamiento'))

  if (!who) return <WhoPrompt onPick={saveWho} />
  if (!board) return error ? <ErrorBox text={error} onRetry={load} /> : <p style={S.note}>Cargando el calendario…</p>

  return (
    <div className="flex flex-col gap-4">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex" role="tablist" aria-label="Vista" style={{ border: '1px solid var(--rafa-border)' }}>
            {(['cronograma', 'pipeline'] as const).map(v => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className="px-3 py-2"
                style={{ fontSize: '0.78rem', border: 'none', cursor: 'pointer', background: view === v ? 'var(--rafa-accent)' : 'transparent', color: view === v ? '#0a0a0a' : 'var(--rafa-muted)' }}>
                {v === 'cronograma' ? 'Cronograma' : 'Pipeline'}
              </button>
            ))}
          </div>
          <select aria-label="Filtrar por tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value as ItemType | 'todos')} style={{ ...S.input, width: 'auto', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}>
            <option value="todos">Todos los tipos</option>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
          </select>
          <select aria-label="Filtrar por responsable" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} style={{ ...S.input, width: 'auto', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}>
            <option value="todos">Todo el equipo</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SyncBadge syncedAt={syncedAt} error={!!error} who={who} onChangeWho={() => saveWho('')} />
          <button style={S.btnAccent} onClick={() => setEditing({ kind: 'actividad', type: 'contenido', stage: 'planeado', start_date: todayIso(), owner: who, priority: 2 })}>+ Actividad</button>
        </div>
      </div>

      {error && <p role="alert" style={{ ...S.note, color: '#d98b7a' }}>No se pudo guardar o sincronizar ({error}). Revisa la conexión; se reintenta solo.</p>}

      {nextRelease && !hasLaunchPlan && nextRelease.releaseDate >= addDays(todayIso(), -3) && (
        <div className="p-4 flex flex-wrap items-center justify-between gap-3" style={{ ...S.card, borderColor: 'var(--rafa-accent)' }}>
          <p style={{ color: 'var(--rafa-text)', fontSize: '0.9rem' }}>
            <strong>{nextRelease.title}</strong> sale el {fmt(nextRelease.releaseDate, { day: 'numeric', month: 'long' })}. ¿Cargo un plan base de lanzamiento (pauta, contenido, redes y PR) para ajustarlo en equipo?
          </p>
          <button style={S.btnAccent} disabled={busy} onClick={() => mutate('board/items', 'POST', { label: `plan de ${nextRelease.title}`, items: launchPlan(nextRelease, who) })}>Cargar plan de lanzamiento</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className={`${view === 'pipeline' ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-4 min-w-0`}>
          {view === 'cronograma'
            ? <Timeline items={visible} onOpen={setEditing} onNew={d => setEditing({ kind: 'actividad', type: 'contenido', stage: 'planeado', start_date: d, owner: who, priority: 2 })} />
            : <Pipeline items={activities} onOpen={setEditing} onMove={(i, stage) => mutate(`board/items/${i.id}`, 'PUT', { stage })} />}
        </div>
        <aside className={`${view === 'pipeline' ? 'lg:col-span-3 grid grid-cols-1 lg:grid-cols-3' : 'flex flex-col'} gap-4 min-w-0 items-start`}>
          <TasksPanel items={visible.filter(i => i.kind === 'tarea')} meetings={board.meetings} who={who} busy={busy} owners={owners}
            onAdd={t => mutate('board/items', 'POST', { ...t, kind: 'tarea', stage: 'planeado' })}
            onToggle={i => mutate(`board/items/${i.id}`, 'PUT', { stage: i.stage === 'listo' ? 'planeado' : 'listo' })}
            onOpen={setEditing} />
          <MeetingsPanel meetings={board.meetings} items={items} onNew={() => setMeetingForm({ date: todayIso(), attendees: who })} onEdit={setMeetingForm} />
          <LogPanel log={board.log} />
        </aside>
      </div>

      {editing && (
        <ItemEditor item={editing} busy={busy} owners={owners} meetings={board.meetings} onClose={() => setEditing(null)}
          onSave={async f => { if (await mutate(f.id ? `board/items/${f.id}` : 'board/items', f.id ? 'PUT' : 'POST', f as Record<string, unknown>)) setEditing(null) }}
          onDelete={async id => { if (await mutate(`board/items/${id}`, 'DELETE')) setEditing(null) }} />
      )}
      {meetingForm && (
        <MeetingEditor meeting={meetingForm} busy={busy} owners={owners} onClose={() => setMeetingForm(null)}
          onSave={async f => { if (await mutate(f.id ? `board/meetings/${f.id}` : 'board/meetings', f.id ? 'PUT' : 'POST', f)) setMeetingForm(null) }}
          onDelete={async id => { if (await mutate(`board/meetings/${id}`, 'DELETE')) setMeetingForm(null) }} />
      )}
    </div>
  )
}

/* Plan base de lanzamiento, relativo a la fecha de salida (todo editable). */
function launchPlan(r: { title: string; releaseDate: string }, who: string) {
  const R = r.releaseDate, t = r.title
  const src = `plan-lanzamiento:${R}`
  const it = (title: string, type: ItemType, from: number, to: number | null, notes: string, kind: Kind = 'actividad') =>
    ({ title, type, kind, stage: 'planeado', start_date: addDays(R, from), end_date: to == null ? null : addDays(R, to), notes, owner: who, source: src })
  return [
    it(`Teaser de “${t}” en redes (3 días)`, 'redes', -3, -1, 'Fragmentos de 10–15 s, historia de la canción, cuenta regresiva en stories.'),
    it('Newsletter: cuenta regresiva', 'contenido', -2, null, 'Usar el asistente SEO·GEO → ciclo “Antes del lanzamiento”.'),
    it('Pauta Meta: alcance y reproducciones', 'pauta', -1, 14, 'Objetivo: reproducciones del Reel + tráfico a Spotify. Revisar costos en la pestaña Pauta.'),
    it(`Lanzamiento · ${t}`, 'lanzamiento', 0, null, 'Día de salida.'),
    it('Actualizar web (último lanzamiento) y enviar broadcast a la lista', 'lanzamiento', 0, null, 'Pedírselo a Claude: pasar NEXT_RELEASE a LATEST_RELEASE y enviar el correo por Resend.', 'tarea'),
    it('Newsletter de lanzamiento', 'contenido', 0, null, 'Ciclo “Día de lanzamiento” del asistente.'),
    it('Google Ads: búsqueda de marca + YouTube', 'pauta', 0, 14, 'Palabras: “rafatrujillo”, nombre de la canción. Video in-stream con el clip/visualizer.'),
    it('Pitch a playlists independientes, blogs y medios', 'prensa', 1, 5, 'Usar el kit de prensa de la web.'),
    it('Blog: la historia detrás de la canción', 'contenido', 3, null, 'Optimizado para buscadores con IA (preguntas y respuestas).'),
    it('Revisión semana 1: web, Spotify for Artists y pauta', 'otro', 7, null, 'Reunión corta; registrar el resumen en “Reuniones”.', 'tarea'),
    it('Newsletter: detrás de cámaras y agradecimiento', 'contenido', 14, null, 'Ciclo “Después del lanzamiento”.'),
    it('Cierre de pauta y reporte', 'pauta', 14, null, 'Comparar costo por reproducción/suscriptor entre Meta y Google.', 'tarea'),
  ]
}

/* ─────────────────────────── vistas ─────────────────────────── */

function Timeline({ items, onOpen, onNew }: { items: Item[]; onOpen: (i: Item) => void; onNew: (day: string) => void }) {
  const today = todayIso()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState<string | null>(null)
  const first = `${month}-01`
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7 // lunes primero
  const gridStart = addDays(first, -offset)
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const shift = (n: number) => { const d = new Date(`${first}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); setMonth(d.toISOString().slice(0, 7)) }
  const dated = items.filter(i => startOf(i))
  const upcoming = dated.filter(i => endOf(i)! >= today && startOf(i)! <= addDays(today, 30) && i.stage !== 'listo')
    .sort((a, b) => startOf(a)!.localeCompare(startOf(b)!))
  const undated = items.filter(i => !startOf(i) && i.stage !== 'listo')

  return (
    <>
      <section className="p-4 sm:p-5" style={S.card}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 style={S.h2}>{fmt(first, { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-1">
            <button style={S.btn} onClick={() => shift(-1)} aria-label="Mes anterior">←</button>
            <button style={S.btn} onClick={() => setMonth(today.slice(0, 7))}>Hoy</button>
            <button style={S.btn} onClick={() => shift(1)} aria-label="Mes siguiente">→</button>
          </div>
        </div>
        <div className="cal-grid" role="grid" aria-label="Calendario mensual">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="cal-head" role="columnheader">{d}</div>)}
          {days.map(day => {
            const list = dated.filter(i => covers(i, day))
            const out = day.slice(0, 7) !== month
            return (
              <div key={day} role="gridcell" className={`cal-day${out ? ' is-out' : ''}${day === today ? ' is-today' : ''}`}
                aria-selected={selected === day} onClick={() => setSelected(day)}>
                <button className="cal-num" onClick={e => { e.stopPropagation(); setSelected(day) }} aria-label={`Ver el ${fmt(day, { day: 'numeric', month: 'long' })}${list.length ? ` (${list.length})` : ''}`}>{Number(day.slice(8))}</button>
                <div className="cal-chips">
                  {list.slice(0, 3).map(i => (
                    <button key={i.id} className={`cal-chip${i.stage === 'listo' ? ' is-done' : ''}`} onClick={e => { e.stopPropagation(); onOpen(i) }} title={`${TYPE_META[i.type].label} · ${i.title}`}
                      style={{ ['--c' as string]: TYPE_META[i.type].color }}>
                      {i.kind === 'tarea' ? '☐ ' : ''}{i.title}
                    </button>
                  ))}
                  {list.length > 3 && <span className="cal-more">+{list.length - 3}</span>}
                </div>
              </div>
            )
          })}
        </div>
        <Legend />
      </section>

      {selected && (() => {
        const list = dated.filter(i => covers(i, selected))
        return (
          <section className="p-4 sm:p-5" style={{ ...S.card, borderColor: 'var(--rafa-accent)' }} aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <h2 style={S.h2}>{fmt(selected, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <div className="flex gap-1">
                <button style={S.btnAccent} onClick={() => onNew(selected)}>+ Agregar</button>
                <button style={S.btn} onClick={() => setSelected(null)} aria-label="Cerrar día">✕</button>
              </div>
            </div>
            {list.length === 0 ? <p className="mt-3" style={S.note}>Nada agendado este día.</p> : <ul className="mt-3 flex flex-col">{list.map(i => <Row key={i.id} item={i} onOpen={onOpen} />)}</ul>}
          </section>
        )
      })()}

      <section className="p-4 sm:p-5" style={S.card}>
        <h2 style={S.h2}>Próximos 30 días</h2>
        {upcoming.length === 0 ? <p className="mt-3" style={S.note}>Nada agendado. Toca un día del calendario o “+ Actividad”.</p> : (
          <ul className="mt-3 flex flex-col">
            {upcoming.map(i => <Row key={i.id} item={i} onOpen={onOpen} />)}
          </ul>
        )}
        {undated.length > 0 && <>
          <h3 className="mt-5" style={S.label}>Sin fecha</h3>
          <ul className="flex flex-col">{undated.map(i => <Row key={i.id} item={i} onOpen={onOpen} />)}</ul>
        </>}
      </section>
    </>
  )
}

function Row({ item: i, onOpen }: { item: Item; onOpen: (i: Item) => void }) {
  return (
    <li style={{ borderTop: '1px solid var(--rafa-border)' }}>
      <button onClick={() => onOpen(i)} className="w-full text-left py-2.5 flex items-start gap-3" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: TYPE_META[i.type].color, marginTop: 7, flexShrink: 0 }} />
        <span className="flex-1 min-w-0">
          <span className="block" style={{ color: 'var(--rafa-text)', fontSize: '0.9rem' }}>{i.kind === 'tarea' ? '☐ ' : ''}{i.title}</span>
          <span className="block" style={S.note}>{dateRange(i)} · {TYPE_META[i.type].label} · {STAGE_META[i.stage]}{i.owner ? ` · ${i.owner}` : ''}</span>
        </span>
      </button>
    </li>
  )
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3" aria-label="Tipos de actividad">
      {TYPES.map(t => (
        <li key={t} className="flex items-center gap-1.5" style={{ fontSize: '0.72rem', color: 'var(--rafa-muted)' }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_META[t].color }} />{TYPE_META[t].label}
        </li>
      ))}
    </ul>
  )
}

function Pipeline({ items, onOpen, onMove }: { items: Item[]; onOpen: (i: Item) => void; onMove: (i: Item, s: Stage) => void }) {
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  return (
    <section className="p-4 sm:p-5" style={S.card}>
      <h2 style={S.h2}>Pipeline de actividades</h2>
      <p style={{ ...S.note, marginTop: 2 }}>Arrastra las tarjetas entre etapas (en el celular usa las flechas).</p>
      <div className="pipe mt-4">
        {STAGES.map((st, si) => {
          const col = items.filter(i => i.stage === st).sort((a, b) => (startOf(a) ?? '9').localeCompare(startOf(b) ?? '9'))
          return (
            <div key={st} className={`pipe-col${over === st ? ' is-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setOver(st) }} onDragLeave={() => setOver(null)}
              onDrop={e => { e.preventDefault(); setOver(null); const i = items.find(x => x.id === drag); if (i && i.stage !== st) onMove(i, st); setDrag(null) }}>
              <h3 style={{ ...S.label, display: 'flex', justifyContent: 'space-between' }}><span>{STAGE_META[st]}</span><span>{col.length}</span></h3>
              <div className="flex flex-col gap-2">
                {col.map(i => (
                  <article key={i.id} draggable onDragStart={() => setDrag(i.id)} onDragEnd={() => setDrag(null)} className="pipe-card"
                    style={{ borderLeftColor: TYPE_META[i.type].color, opacity: drag === i.id ? 0.5 : 1 }}>
                    <button onClick={() => onOpen(i)} className="text-left w-full" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rafa-text)', fontSize: '0.85rem', padding: 0 }}>
                      {i.priority === 1 && <span style={{ color: '#e5737a' }}>● </span>}{i.title}
                    </button>
                    <p style={{ ...S.note, fontSize: '0.72rem', marginTop: 4 }}>{TYPE_META[i.type].label} · {dateRange(i)}{i.owner ? ` · ${i.owner}` : ''}</p>
                    <div className="flex justify-between mt-1.5">
                      <button className="pipe-arrow" disabled={si === 0} onClick={() => onMove(i, STAGES[si - 1])} aria-label={`Mover “${i.title}” a ${si > 0 ? STAGE_META[STAGES[si - 1]] : ''}`}>‹</button>
                      <button className="pipe-arrow" disabled={si === STAGES.length - 1} onClick={() => onMove(i, STAGES[si + 1])} aria-label={`Mover “${i.title}” a ${si < STAGES.length - 1 ? STAGE_META[STAGES[si + 1]] : ''}`}>›</button>
                    </div>
                  </article>
                ))}
                {col.length === 0 && <p style={{ ...S.note, fontSize: '0.72rem', opacity: 0.7 }}>—</p>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ─────────────────────────── panel lateral ─────────────────────────── */

function TasksPanel({ items, meetings, who, busy, owners, onAdd, onToggle, onOpen }: {
  items: Item[]; meetings: Meeting[]; who: string; busy: boolean; owners: string[]
  onAdd: (t: { title: string; owner: string; end_date: string | null; type: ItemType }) => Promise<boolean>
  onToggle: (i: Item) => void; onOpen: (i: Item) => void
}) {
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState(who)
  const [due, setDue] = useState('')
  const [showDone, setShowDone] = useState(false)
  const today = todayIso()
  const open = items.filter(i => i.stage !== 'listo').sort((a, b) => (endOf(a) ?? '9').localeCompare(endOf(b) ?? '9') || a.priority - b.priority)
  const done = items.filter(i => i.stage === 'listo').sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  const meetingTitle = (id: string | null) => meetings.find(m => m.id === id)?.title

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (await onAdd({ title, owner: owner || who, end_date: due || null, type: 'otro' })) { setTitle(''); setDue('') }
  }

  const TaskLine = ({ i }: { i: Item }) => {
    const d = endOf(i), late = !!d && d < today && i.stage !== 'listo'
    return (
      <li className="flex items-start gap-2.5 py-2" style={{ borderTop: '1px solid var(--rafa-border)' }}>
        <input type="checkbox" checked={i.stage === 'listo'} onChange={() => onToggle(i)} aria-label={`Marcar “${i.title}” como ${i.stage === 'listo' ? 'pendiente' : 'hecha'}`}
          style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--rafa-accent)', flexShrink: 0 }} />
        <button onClick={() => onOpen(i)} className="text-left flex-1 min-w-0" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="block" style={{ color: 'var(--rafa-text)', fontSize: '0.86rem', textDecoration: i.stage === 'listo' ? 'line-through' : 'none', opacity: i.stage === 'listo' ? 0.6 : 1 }}>{i.title}</span>
          <span className="block" style={{ ...S.note, fontSize: '0.72rem', color: late ? '#d98b7a' : 'var(--rafa-muted)' }}>
            {d ? (late ? `Venció el ${fmt(d)}` : d === today ? 'Vence hoy' : `Para el ${fmt(d)}`) : 'Sin fecha'}{i.owner ? ` · ${i.owner}` : ''}{i.meeting_id && meetingTitle(i.meeting_id) ? ` · de “${meetingTitle(i.meeting_id)}”` : ''}
          </span>
        </button>
      </li>
    )
  }

  return (
    <section className="p-4 sm:p-5" style={S.card}>
      <h2 style={S.h2}>Pendientes <span style={{ color: 'var(--rafa-muted)' }}>· {open.length}</span></h2>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nueva tarea…" aria-label="Nueva tarea" style={S.input} maxLength={200} />
        <div className="flex gap-2">
          <input value={owner} onChange={e => setOwner(e.target.value)} list="owners-list" placeholder="Responsable" aria-label="Responsable" style={{ ...S.input, flex: 1 }} maxLength={60} />
          <input type="date" value={due} onChange={e => setDue(e.target.value)} aria-label="Fecha límite" style={{ ...S.input, width: 150 }} />
        </div>
        <datalist id="owners-list">{owners.map(o => <option key={o} value={o} />)}</datalist>
        <button type="submit" disabled={busy || !title.trim()} style={{ ...S.btn, alignSelf: 'flex-start' }}>Agregar tarea</button>
      </form>
      <ul className="mt-3 flex flex-col">{open.map(i => <TaskLine key={i.id} i={i} />)}</ul>
      {open.length === 0 && <p className="mt-2" style={S.note}>Todo al día.</p>}
      {done.length > 0 && (
        <>
          <button onClick={() => setShowDone(s => !s)} className="mt-3" aria-expanded={showDone} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--rafa-accent)', fontSize: '0.78rem', cursor: 'pointer' }}>
            {showDone ? 'Ocultar' : 'Ver'} completadas ({done.length})
          </button>
          {showDone && <ul className="mt-2 flex flex-col">{done.slice(0, 30).map(i => <TaskLine key={i.id} i={i} />)}</ul>}
        </>
      )}
    </section>
  )
}

function MeetingsPanel({ meetings, items, onNew, onEdit }: { meetings: Meeting[]; items: Item[]; onNew: () => void; onEdit: (m: Meeting) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <section className="p-4 sm:p-5" style={S.card}>
      <div className="flex items-center justify-between gap-2">
        <h2 style={S.h2}>Reuniones</h2>
        <button style={S.btn} onClick={onNew}>+ Resumen</button>
      </div>
      {meetings.length === 0 ? <p className="mt-3" style={S.note}>Registra aquí lo que se habló, las decisiones y los próximos pasos: cada paso se vuelve una tarea con responsable.</p> : (
        <ul className="mt-3 flex flex-col">
          {meetings.slice(0, 20).map(m => {
            const tasks = items.filter(i => i.meeting_id === m.id)
            const doneN = tasks.filter(t => t.stage === 'listo').length
            const isOpen = open === m.id
            return (
              <li key={m.id} style={{ borderTop: '1px solid var(--rafa-border)' }} className="py-2.5">
                <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="w-full text-left" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span className="block" style={{ color: 'var(--rafa-text)', fontSize: '0.88rem' }}>{m.title}</span>
                  <span className="block" style={{ ...S.note, fontSize: '0.72rem' }}>{fmt(m.date, { day: 'numeric', month: 'short', year: 'numeric' })}{m.attendees ? ` · ${m.attendees}` : ''}{tasks.length ? ` · ${doneN}/${tasks.length} tareas` : ''}</span>
                </button>
                {isOpen && (
                  <div className="mt-2 flex flex-col gap-2" style={{ fontSize: '0.84rem' }}>
                    {m.summary && <div><span style={S.label}>Resumen</span><p style={{ color: 'var(--rafa-text)', whiteSpace: 'pre-line', lineHeight: 1.55 }}>{m.summary}</p></div>}
                    {m.decisions && <div><span style={S.label}>Decisiones</span><p style={{ color: 'var(--rafa-text)', whiteSpace: 'pre-line', lineHeight: 1.55 }}>{m.decisions}</p></div>}
                    {tasks.length > 0 && <div><span style={S.label}>Próximos pasos</span>
                      <ul>{tasks.map(t => <li key={t.id} style={{ color: 'var(--rafa-muted)' }}>{t.stage === 'listo' ? '☑' : '☐'} {t.title}{t.owner ? ` — ${t.owner}` : ''}</li>)}</ul></div>}
                    <p style={{ ...S.note, fontSize: '0.72rem' }}>Registró {m.created_by ?? '—'}{m.updated_by && m.updated_at !== m.created_at ? ` · editó ${m.updated_by} ${ago(m.updated_at)}` : ''}</p>
                    <button style={{ ...S.btn, alignSelf: 'flex-start' }} onClick={() => onEdit(m)}>Editar</button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function LogPanel({ log }: { log: LogRow[] }) {
  if (!log.length) return null
  return (
    <section className="p-4 sm:p-5" style={S.card}>
      <h2 style={S.h2}>Actividad reciente</h2>
      <ul className="mt-3 flex flex-col gap-1.5">
        {log.slice(0, 12).map((l, k) => (
          <li key={k} style={{ ...S.note, fontSize: '0.75rem' }}>
            <strong style={{ color: 'var(--rafa-text)', fontWeight: 500 }}>{l.who}</strong> {l.action} “{l.title}” · {ago(l.at)}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─────────────────────────── editores ─────────────────────────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('input, textarea, select')?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="w-full sm:max-w-[560px] p-5 sm:p-6 overflow-y-auto" style={{ ...S.card, maxHeight: '92vh' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ ...S.h2, fontSize: '0.85rem' }}>{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" style={{ ...S.btn, padding: '0.3rem 0.6rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span style={S.label}>{label}</span>{children}</label>
}

function ItemEditor({ item, busy, owners, meetings, onClose, onSave, onDelete }: {
  item: Partial<Item>; busy: boolean; owners: string[]; meetings: Meeting[]
  onClose: () => void; onSave: (f: Partial<Item>) => void; onDelete: (id: string) => void
}) {
  const [f, setF] = useState<Partial<Item>>(item)
  const [confirmDel, setConfirmDel] = useState(false)
  const set = <K extends keyof Item>(k: K, v: Item[K] | null) => setF(x => ({ ...x, [k]: v }))
  const meeting = meetings.find(m => m.id === f.meeting_id)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const { id, title, kind, type, stage, start_date, end_date, owner, notes, link, priority, source } = f
    onSave({ id, title, kind, type, stage, start_date: start_date || null, end_date: end_date || null, owner, notes, link, priority, source })
  }
  return (
    <Modal title={f.id ? 'Editar' : f.kind === 'tarea' ? 'Nueva tarea' : 'Nueva actividad'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Título" className="col-span-2"><input required maxLength={200} value={f.title ?? ''} onChange={e => set('title', e.target.value)} style={S.input} /></Field>
        <Field label="Es una…">
          <select value={f.kind ?? 'actividad'} onChange={e => set('kind', e.target.value as Kind)} style={S.input}>
            <option value="actividad">Actividad (cronograma y pipeline)</option><option value="tarea">Tarea (pendientes)</option>
          </select>
        </Field>
        <Field label="Tipo">
          <select value={f.type ?? 'otro'} onChange={e => set('type', e.target.value as ItemType)} style={S.input}>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
          </select>
        </Field>
        <Field label={f.kind === 'tarea' ? 'Desde (opcional)' : 'Inicio'}><input type="date" value={f.start_date ?? ''} onChange={e => set('start_date', e.target.value)} style={S.input} /></Field>
        <Field label={f.kind === 'tarea' ? 'Fecha límite' : 'Fin (opcional)'}><input type="date" value={f.end_date ?? ''} min={f.start_date ?? undefined} onChange={e => set('end_date', e.target.value)} style={S.input} /></Field>
        <Field label="Etapa">
          <select value={f.stage ?? 'planeado'} onChange={e => set('stage', e.target.value as Stage)} style={S.input}>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s]}</option>)}
          </select>
        </Field>
        <Field label="Prioridad">
          <select value={f.priority ?? 2} onChange={e => set('priority', Number(e.target.value))} style={S.input}>
            {[1, 2, 3].map(p => <option key={p} value={p}>{PRIORITY[p]}</option>)}
          </select>
        </Field>
        <Field label="Responsable" className="col-span-2">
          <input list="owners-edit" maxLength={60} value={f.owner ?? ''} onChange={e => set('owner', e.target.value)} style={S.input} />
          <datalist id="owners-edit">{owners.map(o => <option key={o} value={o} />)}</datalist>
        </Field>
        <Field label="Link (brief, pieza, campaña…)" className="col-span-2"><input type="url" maxLength={500} placeholder="https://" value={f.link ?? ''} onChange={e => set('link', e.target.value)} style={S.input} /></Field>
        <Field label="Notas" className="col-span-2"><textarea rows={4} maxLength={4000} value={f.notes ?? ''} onChange={e => set('notes', e.target.value)} style={{ ...S.input, resize: 'vertical' }} /></Field>
        {f.id && (
          <p className="col-span-2" style={{ ...S.note, fontSize: '0.72rem' }}>
            Creado por {f.created_by ?? '—'}{f.updated_by && f.updated_at ? ` · último cambio: ${f.updated_by}, ${ago(f.updated_at)}` : ''}
            {meeting ? ` · salió de la reunión “${meeting.title}”` : ''}
            {f.link && <> · <a href={f.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rafa-accent)' }}>abrir link ↗</a></>}
          </p>
        )}
        <div className="col-span-2 flex flex-wrap justify-between gap-2 mt-1">
          {f.id ? (
            confirmDel
              ? <span className="flex gap-2 items-center" style={S.note}>¿Eliminar? <button type="button" style={{ ...S.btn, borderColor: '#d98b7a', color: '#d98b7a' }} onClick={() => onDelete(f.id!)} disabled={busy}>Sí, eliminar</button><button type="button" style={S.btn} onClick={() => setConfirmDel(false)}>No</button></span>
              : <button type="button" style={{ ...S.btn, color: '#d98b7a' }} onClick={() => setConfirmDel(true)}>Eliminar</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" style={S.btn} onClick={onClose}>Cancelar</button>
            <button type="submit" style={S.btnAccent} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function MeetingEditor({ meeting, busy, owners, onClose, onSave, onDelete }: {
  meeting: Partial<Meeting>; busy: boolean; owners: string[]
  onClose: () => void; onSave: (f: Record<string, unknown>) => void; onDelete: (id: string) => void
}) {
  const [f, setF] = useState<Partial<Meeting>>(meeting)
  const [actions, setActions] = useState<{ title: string; owner: string; end_date: string; type: ItemType }[]>([{ title: '', owner: '', end_date: '', type: 'otro' }])
  const [confirmDel, setConfirmDel] = useState(false)
  const set = (k: keyof Meeting, v: string) => setF(x => ({ ...x, [k]: v }))
  const setAction = (k: number, patch: Partial<(typeof actions)[number]>) => setActions(a => a.map((x, i) => (i === k ? { ...x, ...patch } : x)))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...f, actions: f.id ? undefined : actions.filter(a => a.title.trim()).map(a => ({ ...a, end_date: a.end_date || null })) })
  }
  return (
    <Modal title={f.id ? 'Editar reunión' : 'Resumen de reunión'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Tema" className="col-span-2"><input required maxLength={200} value={f.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Ej.: Planeación lanzamiento Parié" style={S.input} /></Field>
        <Field label="Fecha"><input required type="date" value={f.date ?? ''} onChange={e => set('date', e.target.value)} style={S.input} /></Field>
        <Field label="Asistentes"><input maxLength={300} value={f.attendees ?? ''} onChange={e => set('attendees', e.target.value)} placeholder="Rafa, …" style={S.input} /></Field>
        <Field label="Resumen" className="col-span-2"><textarea rows={5} maxLength={8000} value={f.summary ?? ''} onChange={e => set('summary', e.target.value)} placeholder="Qué se habló, en pocas líneas…" style={{ ...S.input, resize: 'vertical' }} /></Field>
        <Field label="Decisiones" className="col-span-2"><textarea rows={3} maxLength={4000} value={f.decisions ?? ''} onChange={e => set('decisions', e.target.value)} placeholder="Una por línea" style={{ ...S.input, resize: 'vertical' }} /></Field>
        {!f.id && (
          <div className="col-span-2">
            <span style={S.label}>Próximos pasos → se crean como tareas</span>
            <div className="flex flex-col gap-2">
              {actions.map((a, k) => (
                <div key={k} className="grid gap-2" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) 140px' }}>
                  <input value={a.title} onChange={e => setAction(k, { title: e.target.value })} placeholder="Qué hay que hacer" aria-label={`Paso ${k + 1}`} maxLength={200} style={S.input} />
                  <input value={a.owner} onChange={e => setAction(k, { owner: e.target.value })} list="owners-meet" placeholder="Quién" aria-label={`Responsable del paso ${k + 1}`} maxLength={60} style={S.input} />
                  <input type="date" value={a.end_date} onChange={e => setAction(k, { end_date: e.target.value })} aria-label={`Fecha del paso ${k + 1}`} style={S.input} />
                </div>
              ))}
              <datalist id="owners-meet">{owners.map(o => <option key={o} value={o} />)}</datalist>
              <button type="button" style={{ ...S.btn, alignSelf: 'flex-start' }} onClick={() => setActions(a => [...a, { title: '', owner: '', end_date: '', type: 'otro' }])} disabled={actions.length >= 30}>+ Otro paso</button>
            </div>
          </div>
        )}
        <div className="col-span-2 flex flex-wrap justify-between gap-2 mt-1">
          {f.id ? (
            confirmDel
              ? <span className="flex gap-2 items-center" style={S.note}>¿Eliminar? <button type="button" style={{ ...S.btn, borderColor: '#d98b7a', color: '#d98b7a' }} onClick={() => onDelete(f.id!)} disabled={busy}>Sí</button><button type="button" style={S.btn} onClick={() => setConfirmDel(false)}>No</button></span>
              : <button type="button" style={{ ...S.btn, color: '#d98b7a' }} onClick={() => setConfirmDel(true)}>Eliminar</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" style={S.btn} onClick={onClose}>Cancelar</button>
            <button type="submit" style={S.btnAccent} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

/* ─────────────────────────── utilidades UI ─────────────────────────── */

function WhoPrompt({ onPick }: { onPick: (n: string) => void }) {
  const [name, setName] = useState('')
  return (
    <section className="p-6 max-w-[520px]" style={S.card}>
      <h2 style={S.h2}>¿Quién está usando el panel?</h2>
      <p className="mt-2" style={S.note}>El calendario es compartido: tu nombre aparece en lo que crees o cambies. Se recuerda en este navegador.</p>
      <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); if (name.trim()) onPick(name.trim().slice(0, 40)) }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" aria-label="Tu nombre" maxLength={40} style={S.input} autoFocus />
        <button type="submit" style={S.btnAccent} disabled={!name.trim()}>Entrar</button>
      </form>
      <div className="mt-3 flex gap-2">
        <button style={S.btn} onClick={() => onPick('Rafa')}>Soy Rafa</button>
      </div>
    </section>
  )
}

function SyncBadge({ syncedAt, error, who, onChangeWho }: { syncedAt: number | null; error: boolean; who: string; onChangeWho: () => void }) {
  const [, tick] = useState(0)
  useEffect(() => { const id = window.setInterval(() => tick(x => x + 1), 5000); return () => window.clearInterval(id) }, [])
  const secs = syncedAt ? Math.round((Date.now() - syncedAt) / 1000) : null
  return (
    <span className="flex items-center gap-2" style={{ ...S.note, fontSize: '0.75rem' }}>
      <span aria-hidden="true" className={error ? undefined : 'live-dot'} style={{ width: 8, height: 8, borderRadius: 99, background: error ? '#d98b7a' : '#7fbf8e' }} />
      {error ? 'Sin conexión' : secs == null ? 'Conectando…' : secs < 15 ? 'Sincronizado' : `Sincronizado hace ${secs} s`}
      <span>·</span>
      <button onClick={onChangeWho} title="Cambiar de persona" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--rafa-accent)', cursor: 'pointer', fontSize: '0.75rem' }}>{who}</button>
    </span>
  )
}

function ErrorBox({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="p-5" style={S.card}>
      <p style={{ color: 'var(--rafa-text)' }}>No se pudo cargar el calendario.</p>
      <p className="mt-1" style={S.note}>{text === 'services_unreachable' ? 'Los microservicios no responden. Intenta de nuevo en un momento.' : `Detalle: ${text}`}</p>
      <button className="mt-3" style={S.btn} onClick={onRetry}>Reintentar</button>
    </div>
  )
}
