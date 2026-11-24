'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { VOICE_INTRO, VOICE_QUESTIONS, type VoiceQuestion } from '@/lib/admin/voice-questions'
import { ChatCard, SkillsCard } from './AgentPanels'

/* Pestaña "Asistente SEO·GEO".
   1) Si Rafa no ha hecho el onboarding, lo guía pregunta por pregunta (autoguardado).
   2) Después: perfil de voz, ciclos de contenido sugeridos (newsletter / blog),
      insights manuales y referentes por link (analizados en el Worker). */

type Answers = Record<string, string | string[] | number | undefined>
interface Profile {
  tone: string; closeness: number; address: string; language: string; ownWords: string[]; avoid: string[]
  themes: string[]; references: string; feeling: string; cadence: { label: string; days: number | null }; opening: string; oneLiner: string
}
interface Voice { answers: Answers; completed: boolean; updatedAt: string | null; profile: Profile | null }
interface Suggestion {
  id: string; format: 'newsletter' | 'blog'; cycle: 'antes' | 'lanzamiento' | 'despues' | 'siempre' | 'insight'
  title: string; angle: string; outline: string[]; geo: string; basedOn: string[]; date: string
  status: 'pendiente' | 'hecho' | 'descartado'; voice: { use: string[]; avoid: string[]; address: string }
}
interface Draft { id: string; suggestion_id: string; format: string; title: string; body: string; model: string; created_at: string }
interface Analysis { url: string; domain: string; title: string; description: string; wordCount: number; readingMinutes: number; avgParagraphWords: number; questionHeadings: number; keywords: string[]; lessons: string[]; headings: { level: number; text: string }[]; ai?: { resumen: string; queHaceBien: string[]; ideasParaRafa: string[]; palabrasClave: string[]; formato: string } }
interface Insight { id: string; kind: 'insight' | 'reference'; text: string | null; url: string | null; analysis: Analysis | null; created_at: string }

const API = '/api/admin/services'
async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error((data as { error?: string }).error ?? `http_${res.status}`), { status: res.status, data })
  return data as T
}

const S = {
  card: { background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' } as React.CSSProperties,
  label: { fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-muted)' } as React.CSSProperties,
  h2: { fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-accent)' } as React.CSSProperties,
  note: { fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--rafa-muted)' } as React.CSSProperties,
  input: { width: '100%', padding: '0.75rem 0.9rem', background: 'var(--rafa-surface-2)', border: '1px solid var(--rafa-border)', color: 'var(--rafa-text)', fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-inter)' } as React.CSSProperties,
  chip: { display: 'inline-block', padding: '0.2rem 0.55rem', border: '1px solid var(--rafa-border)', fontSize: '0.75rem', color: 'var(--rafa-text)', marginRight: 6, marginBottom: 6 } as React.CSSProperties,
  btn: { padding: '0.6rem 1rem', border: '1px solid var(--rafa-border)', background: 'transparent', color: 'var(--rafa-text)', fontSize: '0.78rem', cursor: 'pointer' } as React.CSSProperties,
  btnAccent: { padding: '0.65rem 1.2rem', border: '1px solid var(--rafa-accent)', background: 'var(--rafa-accent)', color: '#0a0a0a', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.06em' } as React.CSSProperties,
}

const CYCLE_LABEL: Record<Suggestion['cycle'], string> = {
  antes: 'Antes del lanzamiento', lanzamiento: 'Día de lanzamiento', despues: 'Después del lanzamiento', siempre: 'Siempre vigente', insight: 'De tus ideas y referentes',
}
const fmt = (iso: string) => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))

export function AssistantTab() {
  const [voice, setVoice] = useState<Voice | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try { setVoice(await api<Voice>('voice')) } catch (e) { setError(errText(e)) }
  }, [])
  useEffect(() => { load() }, [load])

  if (error) return <ErrorBox text={error} onRetry={load} />
  if (!voice) return <p style={S.note}>Cargando el asistente…</p>
  if (!voice.completed || editing) {
    return <Onboarding initial={voice.answers} onDone={v => { setVoice(v); setEditing(false) }} onCancel={voice.completed ? () => setEditing(false) : undefined} />
  }
  return <Dashboard voice={voice} onEditVoice={() => setEditing(true)} />
}

/* ───────────────────────── Onboarding ───────────────────────── */

function Onboarding({ initial, onDone, onCancel }: { initial: Answers; onDone: (v: Voice) => void; onCancel?: () => void }) {
  const firstUnanswered = VOICE_QUESTIONS.findIndex(q => isEmpty(initial[q.id]))
  const [step, setStep] = useState(Object.keys(initial).length ? Math.max(0, firstUnanswered) : -1)
  const [answers, setAnswers] = useState<Answers>(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const q = VOICE_QUESTIONS[step]
  const total = VOICE_QUESTIONS.length

  const save = async (next: Answers, completed: boolean) => {
    setSaving(true); setErr(null)
    try { return await api<Voice>('voice', { method: 'PUT', body: { answers: next, completed } }) }
    catch (e) { setErr(errText(e)); return null }
    finally { setSaving(false) }
  }

  const go = async (dir: 1 | -1) => {
    if (dir === 1) {
      const last = step === total - 1
      const v = await save(answers, last)
      if (!v) return
      if (last) { onDone(v); return }
    }
    setStep(s => Math.min(total - 1, Math.max(0, s + dir)))
  }

  if (step === -1) {
    return (
      <div className="p-6 sm:p-10" style={{ ...S.card, maxWidth: 760 }}>
        <p style={S.h2}>Asistente SEO · GEO</p>
        <h2 className="mt-3" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 1, color: 'var(--rafa-text)' }}>Hola, Rafa.</h2>
        <p className="mt-4" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '1.15rem', color: 'var(--rafa-text)' }}>{VOICE_INTRO.title}</p>
        <p className="mt-3" style={{ ...S.note, fontSize: '0.95rem' }}>{VOICE_INTRO.text}</p>
        <p className="mt-3" style={S.note}>Ya leí las historias de tus canciones: por eso algunas preguntas traen ejemplos tuyos.</p>
        <button type="button" className="mt-6" style={S.btnAccent} onClick={() => setStep(0)}>Empezar ({total} preguntas · ~8 min)</button>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-10" style={{ ...S.card, maxWidth: 760 }}>
      <div className="flex items-center justify-between gap-4">
        <p style={S.label}>Pregunta {step + 1} de {total}</p>
        {onCancel && <button type="button" onClick={onCancel} style={{ ...S.btn, padding: '0.3rem 0.7rem' }}>Volver al panel</button>}
      </div>
      <div className="mt-2" style={{ height: 3, background: 'var(--rafa-surface-2)' }} aria-hidden="true">
        <div style={{ width: `${((step + 1) / total) * 100}%`, height: '100%', background: 'var(--rafa-accent)', transition: 'width 300ms ease' }} />
      </div>

      <h2 className="mt-6" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', lineHeight: 1.35, color: 'var(--rafa-text)' }} id="q-title">{q.title}</h2>
      {q.hint && <p className="mt-3" style={{ ...S.note, fontStyle: 'italic' }}>{q.hint}</p>}

      <div className="mt-5"><Field q={q} value={answers[q.id]} onChange={v => setAnswers(a => ({ ...a, [q.id]: v }))} /></div>
      <p className="mt-3" style={{ ...S.note, fontSize: '0.75rem' }}>Para qué: {q.why}</p>
      {err && <p role="alert" className="mt-3" style={{ color: '#e06060', fontSize: '0.85rem' }}>{err}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" style={S.btn} onClick={() => go(-1)} disabled={step === 0 || saving}>← Anterior</button>
        <button type="button" style={S.btnAccent} onClick={() => go(1)} disabled={saving}>
          {saving ? 'Guardando…' : step === total - 1 ? 'Terminar y ver mis sugerencias' : isEmpty(answers[q.id]) ? 'Saltar →' : 'Siguiente →'}
        </button>
        <span style={{ ...S.note, fontSize: '0.75rem' }}>Se guarda solo: puedes cerrar y seguir después.</span>
      </div>
    </div>
  )
}

function Field({ q, value, onChange }: { q: VoiceQuestion; value: Answers[string]; onChange: (v: Answers[string]) => void }) {
  if (q.kind === 'long' || q.kind === 'text' || q.kind === 'tags') {
    const Tag = q.kind === 'long' ? 'textarea' : 'input'
    return (
      <Tag
        aria-labelledby="q-title"
        value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        placeholder={q.placeholder}
        rows={q.kind === 'long' ? 6 : undefined}
        maxLength={3000}
        style={{ ...S.input, resize: 'vertical' }}
        autoFocus
      />
    )
  }
  if (q.kind === 'scale') {
    const v = Number(value) || 0
    return (
      <div role="radiogroup" aria-labelledby="q-title">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" role="radio" aria-checked={v === n} onClick={() => onChange(n)}
              style={{ ...S.btn, flex: 1, padding: '0.9rem 0', fontSize: '1.1rem', background: v === n ? 'var(--rafa-accent)' : 'transparent', color: v === n ? '#0a0a0a' : 'var(--rafa-text)' }}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2" style={S.note}><span>{q.scale?.min}</span><span>{q.scale?.max}</span></div>
      </div>
    )
  }
  const multi = q.kind === 'multi'
  const sel = multi ? (Array.isArray(value) ? value : []) : [String(value ?? '')]
  return (
    <div className="flex flex-col gap-2" role={multi ? 'group' : 'radiogroup'} aria-labelledby="q-title">
      {q.options!.map(o => {
        const on = sel.includes(o.value)
        return (
          <button key={o.value} type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={on}
            onClick={() => onChange(multi ? (on ? sel.filter(x => x !== o.value) : [...sel, o.value]) : o.value)}
            style={{ ...S.btn, textAlign: 'left', fontSize: '0.92rem', padding: '0.8rem 1rem', borderColor: on ? 'var(--rafa-accent)' : 'var(--rafa-border)', color: on ? 'var(--rafa-accent)' : 'var(--rafa-text)' }}>
            {on ? '● ' : '○ '}{o.label}
          </button>
        )
      })}
      {multi && <p style={{ ...S.note, fontSize: '0.75rem' }}>Puedes elegir varias.</p>}
    </div>
  )
}

/* ───────────────────────── Panel del asistente ───────────────────────── */

function Dashboard({ voice, onEditVoice }: { voice: Voice; onEditVoice: () => void }) {
  const [plan, setPlan] = useState<{ ai: boolean; suggestions: Suggestion[]; drafts: Draft[] } | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todo' | 'newsletter' | 'blog'>('todo')
  const [showDone, setShowDone] = useState(false)
  const [skillsOn, setSkillsOn] = useState(0)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [p, i] = await Promise.all([api<typeof plan>('content/plan', { method: 'POST', body: {} }), api<{ items: Insight[] }>('insights')])
      setPlan(p); setInsights(i.items)
    } catch (e) { setError(errText(e)) }
  }, [])
  useEffect(() => { load() }, [load])

  const setStatus = async (s: Suggestion, status: Suggestion['status']) => {
    setPlan(p => p && { ...p, suggestions: p.suggestions.map(x => x.id === s.id ? { ...x, status } : x) })
    try { await api('content/status', { method: 'POST', body: { id: s.id, status } }) } catch { load() }
  }

  const visible = useMemo(() => (plan?.suggestions ?? [])
    .filter(s => filter === 'todo' || s.format === filter)
    .filter(s => showDone || s.status === 'pendiente'), [plan, filter, showDone])
  const groups = useMemo(() => {
    const order: Suggestion['cycle'][] = ['insight', 'antes', 'lanzamiento', 'despues', 'siempre']
    return order.map(c => [c, visible.filter(s => s.cycle === c)] as const).filter(([, l]) => l.length)
  }, [visible])

  const pending = plan?.suggestions.filter(s => s.status === 'pendiente').length ?? 0
  const done = plan?.suggestions.filter(s => s.status === 'hecho').length ?? 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Chat con herramientas (internet, links, skills) */}
      <div className="lg:col-span-12">
        <ChatCard ai={!!plan?.ai} skillsOn={skillsOn} />
      </div>

      {/* Columna izquierda: voz + alimentar al asistente + skills */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <VoiceCard profile={voice.profile} onEdit={onEditVoice} />
        <FeedCard items={insights} onChange={items => { setInsights(items); load() }} />
        <SkillsCard ai={!!plan?.ai} onCount={setSkillsOn} />
      </div>

      {/* Columna derecha: ciclos de contenido */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="p-5" style={S.card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p style={S.h2}>Ciclos de contenido</p>
              <p style={{ ...S.note, marginTop: 2 }}>{pending} por hacer · {done} hechos · newsletter y blog alrededor de tus lanzamientos e historias.</p>
            </div>
            <AiPill on={!!plan?.ai} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(['todo', 'newsletter', 'blog'] as const).map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
                style={{ ...S.btn, padding: '0.4rem 0.8rem', background: filter === f ? 'var(--rafa-accent)' : 'transparent', color: filter === f ? '#0a0a0a' : 'var(--rafa-muted)' }}>
                {f === 'todo' ? 'Todo' : f === 'newsletter' ? 'Newsletter' : 'Blog'}
              </button>
            ))}
            <label className="flex items-center gap-2 ml-auto" style={{ ...S.note, cursor: 'pointer' }}>
              <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} style={{ accentColor: 'var(--rafa-accent)' }} />
              Mostrar hechos y descartados
            </label>
          </div>
        </div>

        {error && <ErrorBox text={error} onRetry={load} />}
        {!plan && !error && <p style={S.note}>Armando tus ciclos de contenido…</p>}
        {plan && groups.length === 0 && <p className="p-5" style={{ ...S.card, ...S.note }}>No hay sugerencias pendientes con este filtro.</p>}

        {groups.map(([cycle, list]) => (
          <section key={cycle} className="flex flex-col gap-3">
            <h3 style={{ ...S.label, marginTop: 6 }}>{CYCLE_LABEL[cycle]}</h3>
            {list.map(s => <SuggestionCard key={s.id} s={s} ai={!!plan?.ai} onStatus={setStatus} onDraft={d => setPlan(p => p && { ...p, drafts: [d, ...p.drafts] })} drafts={plan!.drafts.filter(d => d.suggestion_id === s.id)} />)}
          </section>
        ))}
      </div>
    </div>
  )
}

function VoiceCard({ profile, onEdit }: { profile: Profile | null; onEdit: () => void }) {
  return (
    <div className="p-5" style={S.card}>
      <div className="flex items-center justify-between gap-3">
        <p style={S.h2}>Tu voz</p>
        <button type="button" onClick={onEdit} style={{ ...S.btn, padding: '0.3rem 0.7rem' }}>Editar respuestas</button>
      </div>
      {!profile ? <p className="mt-3" style={S.note}>Aún sin respuestas.</p> : (
        <div className="mt-4 flex flex-col gap-4">
          {profile.oneLiner && <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', color: 'var(--rafa-text)', lineHeight: 1.5 }}>“{profile.oneLiner}”</p>}
          <Row label="Tono">{profile.tone} · trato de {profile.address} · {profile.language}</Row>
          {!!profile.ownWords.length && <Row label="Palabras tuyas">{profile.ownWords.map(w => <span key={w} style={S.chip}>{w}</span>)}</Row>}
          {!!profile.avoid.length && <Row label="Nunca">{profile.avoid.map(w => <span key={w} style={{ ...S.chip, textDecoration: 'line-through', color: 'var(--rafa-muted)' }}>{w}</span>)}</Row>}
          {!!profile.themes.length && <Row label="Te gusta contar">{profile.themes.join(' · ')}</Row>}
          {profile.feeling && <Row label="Al terminar de leer">{profile.feeling}</Row>}
          <Row label="Ritmo">{profile.cadence.label}</Row>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p style={S.label}>{label}</p><div className="mt-1" style={{ fontSize: '0.88rem', color: 'var(--rafa-text)', lineHeight: 1.5 }}>{children}</div></div>
}

function FeedCard({ items, onChange }: { items: Insight[]; onChange: (i: Insight[]) => void }) {
  const [mode, setMode] = useState<'insight' | 'reference'>('insight')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr(null)
    try {
      const r = await api<{ items: Insight[] }>('insights', { method: 'POST', body: mode === 'insight' ? { kind: 'insight', text } : { kind: 'reference', url, text } })
      onChange(r.items); setText(''); setUrl('')
    } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const remove = async (id: string) => {
    try { onChange((await api<{ items: Insight[] }>(`insights/${id}`, { method: 'DELETE' })).items) } catch (e) { setErr(errText(e)) }
  }

  return (
    <div className="p-5" style={S.card}>
      <p style={S.h2}>Alimenta al asistente</p>
      <p style={{ ...S.note, marginTop: 2 }}>Una idea que se te ocurrió o un link que te gustó: lo convierto en sugerencias.</p>
      <div className="mt-4 flex" role="tablist" aria-label="Tipo de aporte" style={{ border: '1px solid var(--rafa-border)' }}>
        {(['insight', 'reference'] as const).map(m => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            style={{ flex: 1, padding: '0.55rem', fontSize: '0.78rem', border: 'none', cursor: 'pointer', background: mode === m ? 'var(--rafa-accent)' : 'transparent', color: mode === m ? '#0a0a0a' : 'var(--rafa-muted)' }}>
            {m === 'insight' ? 'Insight' : 'Referente (link)'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
        {mode === 'reference' && (
          <input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… (newsletter, blog, artículo)" style={S.input} aria-label="Link del referente" />
        )}
        <textarea value={text} onChange={e => setText(e.target.value)} required={mode === 'insight'} rows={3} maxLength={2000}
          placeholder={mode === 'insight' ? 'Ej: la gente me escribe por “Cenizas” después de los shows…' : '¿Qué te gustó de esta pieza? (opcional)'}
          style={{ ...S.input, resize: 'vertical' }} aria-label={mode === 'insight' ? 'Insight' : 'Nota sobre el referente'} />
        {err && <p role="alert" style={{ color: '#e06060', fontSize: '0.8rem' }}>{err}</p>}
        <button type="submit" disabled={busy} style={S.btnAccent}>{busy ? (mode === 'reference' ? 'Analizando el link…' : 'Guardando…') : mode === 'reference' ? 'Analizar referente' : 'Guardar insight'}</button>
      </form>

      {!!items.length && (
        <ul className="mt-5 flex flex-col">
          {items.map(i => (
            <li key={i.id} className="py-3" style={{ borderTop: '1px solid var(--rafa-border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div style={{ minWidth: 0 }}>
                  <p style={S.label}>{i.kind === 'insight' ? 'Insight' : `Referente · ${i.analysis?.domain ?? ''}`}</p>
                  {i.kind === 'reference' && i.analysis ? (
                    <>
                      <a href={i.analysis.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rafa-text)', fontSize: '0.88rem', fontWeight: 500, wordBreak: 'break-word' }}>{i.analysis.title || i.analysis.url}</a>
                      {i.analysis.wordCount > 0 && <p style={{ ...S.note, fontSize: '0.75rem' }}>{i.analysis.wordCount} palabras · {i.analysis.readingMinutes} min · {i.analysis.questionHeadings} subtítulos-pregunta</p>}
                      {i.analysis.ai && (
                        <div className="mt-2" style={{ borderLeft: '2px solid var(--rafa-accent)', paddingLeft: '0.7rem' }}>
                          <p style={{ ...S.label, color: 'var(--rafa-accent)' }}>Lectura con IA{i.analysis.ai.formato ? ` · ${i.analysis.ai.formato}` : ''}</p>
                          <p className="mt-1" style={{ fontSize: '0.82rem', color: 'var(--rafa-text)', lineHeight: 1.55 }}>{i.analysis.ai.resumen}</p>
                          {!!i.analysis.ai.ideasParaRafa.length && <>
                            <p className="mt-2" style={S.label}>Ideas para ti</p>
                            <ul className="mt-1 flex flex-col gap-1" style={{ paddingLeft: '1rem', listStyle: 'disc', fontSize: '0.8rem', color: 'var(--rafa-text)' }}>{i.analysis.ai.ideasParaRafa.map(x => <li key={x}>{x}</li>)}</ul>
                          </>}
                        </div>
                      )}
                      <details className="mt-1" style={S.note}>
                        <summary style={{ cursor: 'pointer', color: 'var(--rafa-accent)' }}>Qué aprender de esta pieza</summary>
                        <ul className="mt-2 flex flex-col gap-1" style={{ paddingLeft: '1rem', listStyle: 'disc' }}>{[...(i.analysis.ai?.queHaceBien ?? []), ...i.analysis.lessons].map(l => <li key={l}>{l}</li>)}</ul>
                        {!!i.analysis.keywords.length && <p className="mt-2">Temas: {i.analysis.keywords.join(', ')}</p>}
                      </details>
                      {i.text && <p className="mt-1" style={{ fontSize: '0.82rem', color: 'var(--rafa-text)' }}>“{i.text}”</p>}
                    </>
                  ) : <p style={{ fontSize: '0.88rem', color: 'var(--rafa-text)', whiteSpace: 'pre-line' }}>{i.text}</p>}
                </div>
                <button type="button" onClick={() => remove(i.id)} aria-label="Eliminar" style={{ ...S.btn, padding: '0.25rem 0.55rem', color: 'var(--rafa-muted)' }}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SuggestionCard({ s, ai, drafts, onStatus, onDraft }: { s: Suggestion; ai: boolean; drafts: Draft[]; onStatus: (s: Suggestion, st: Suggestion['status']) => void; onDraft: (d: Draft) => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [scheduled, setScheduled] = useState<'idle' | 'saving' | 'done'>('idle')
  const dim = s.status !== 'pendiente'

  // Lleva la sugerencia al calendario compartido como actividad de contenido
  const schedule = async () => {
    setScheduled('saving'); setErr(null)
    let who = 'Equipo'
    try { who = localStorage.getItem('rafa-admin-who') || 'Equipo' } catch {}
    try {
      await api('board/items', { method: 'POST', body: {
        who, kind: 'actividad', type: 'contenido', stage: 'planeado', start_date: s.date, owner: who, source: `sug:${s.id}`.slice(0, 80),
        title: `${s.format === 'blog' ? 'Blog' : 'Newsletter'}: ${s.title}`,
        notes: [`Enfoque: ${s.angle}`, "", ...s.outline.map(o => `- ${o}`), "", `${s.format === 'blog' ? 'SEO/GEO' : 'Envío'}: ${s.geo}`].join('\n'),
      } })
      setScheduled('done')
    } catch (e) { setErr(errText(e)); setScheduled('idle') }
  }

  const copy = async () => {
    const text = `${s.format === 'blog' ? 'BLOG' : 'NEWSLETTER'} — ${s.title}\n\nEnfoque: ${s.angle}\n\n${s.outline.map(o => `- ${o}`).join('\n')}\n\n${s.format === 'blog' ? 'SEO/GEO' : 'Envío'}: ${s.geo}`
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }
  const draft = async () => {
    setDrafting(true); setErr(null)
    try {
      const r = await api<{ id: string; body: string; model: string }>('content/draft', { method: 'POST', body: { suggestion: s } })
      onDraft({ id: r.id, suggestion_id: s.id, format: s.format, title: s.title, body: r.body, model: r.model, created_at: new Date().toISOString() })
      setOpen(true)
    } catch (e) { setErr(errText(e)) } finally { setDrafting(false) }
  }

  return (
    <article className="p-5" style={{ ...S.card, opacity: dim ? 0.55 : 1 }}>
      <div className="flex flex-wrap items-center gap-2" style={S.label}>
        <span style={{ color: s.format === 'blog' ? '#8fb7d9' : 'var(--rafa-accent)' }}>{s.format === 'blog' ? 'Blog' : 'Newsletter'}</span>
        <span>· {fmt(s.date)}</span>
        {s.status !== 'pendiente' && <span>· {s.status}</span>}
      </div>
      <h4 className="mt-2" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--rafa-text)', lineHeight: 1.35 }}>{s.title}</h4>
      <p className="mt-2" style={{ fontSize: '0.9rem', color: 'var(--rafa-muted)', lineHeight: 1.6 }}>{s.angle}</p>

      <button type="button" onClick={() => setOpen(o => !o)} className="mt-3" aria-expanded={open} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--rafa-accent)', fontSize: '0.8rem', cursor: 'pointer' }}>
        {open ? '− Ocultar estructura' : '+ Ver estructura y consejos'}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <ol className="flex flex-col gap-1" style={{ paddingLeft: '1.1rem', listStyle: 'decimal', fontSize: '0.88rem', color: 'var(--rafa-text)', lineHeight: 1.55 }}>
            {s.outline.map(o => <li key={o}>{o}</li>)}
          </ol>
          <p style={{ ...S.note, borderLeft: '2px solid var(--rafa-accent)', paddingLeft: '0.75rem' }}><strong style={{ color: 'var(--rafa-text)' }}>{s.format === 'blog' ? 'SEO/GEO: ' : 'Envío: '}</strong>{s.geo}</p>
          {(s.voice.use.length > 0 || s.voice.avoid.length > 0) && (
            <p style={S.note}>
              {s.voice.use.length > 0 && <>Usa: {s.voice.use.map(w => <span key={w} style={S.chip}>{w}</span>)}</>}
              {s.voice.avoid.length > 0 && <> Evita: {s.voice.avoid.map(w => <span key={w} style={{ ...S.chip, textDecoration: 'line-through' }}>{w}</span>)}</>}
            </p>
          )}
          <p style={{ ...S.note, fontSize: '0.75rem' }}>Basado en: {s.basedOn.join(' · ')}</p>
          {drafts.map(d => (
            <details key={d.id} open style={{ border: '1px solid var(--rafa-border)', padding: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', ...S.label }}>Borrador IA · {new Date(d.created_at).toLocaleString('es-CO')} · {d.model}</summary>
              <pre className="mt-3" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-inter)', fontSize: '0.88rem', color: 'var(--rafa-text)', lineHeight: 1.6 }}>{d.body}</pre>
              <button type="button" className="mt-2" style={S.btn} onClick={() => navigator.clipboard.writeText(d.body)}>Copiar borrador</button>
            </details>
          ))}
        </div>
      )}

      {err && <p role="alert" className="mt-3" style={{ color: '#e06060', fontSize: '0.8rem' }}>{err}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" style={S.btn} onClick={copy}>{copied ? '✓ Copiado' : 'Copiar esquema'}</button>
        {scheduled === 'done'
          ? <a href="/admin?tab=calendario" style={{ ...S.btn, color: 'var(--rafa-accent)', textDecoration: 'none' }}>✓ En el calendario →</a>
          : <button type="button" style={S.btn} onClick={schedule} disabled={scheduled === 'saving'}>{scheduled === 'saving' ? 'Agendando…' : '📅 Agendar'}</button>}
        <button type="button" style={S.btn} onClick={draft} disabled={!ai || drafting} title={ai ? 'Redacta un borrador con tu voz' : 'Se activa al configurar ANTHROPIC_API_KEY en el Worker'}>
          {drafting ? 'Redactando…' : ai ? '✦ Redactar con IA' : '✦ Redactar con IA (inactivo)'}
        </button>
        {s.status === 'pendiente' ? (
          <>
            <button type="button" style={S.btn} onClick={() => onStatus(s, 'hecho')}>✓ Marcar hecho</button>
            <button type="button" style={{ ...S.btn, color: 'var(--rafa-muted)' }} onClick={() => onStatus(s, 'descartado')}>Descartar</button>
          </>
        ) : (
          <button type="button" style={S.btn} onClick={() => onStatus(s, 'pendiente')}>↺ Volver a pendiente</button>
        )}
      </div>
    </article>
  )
}

function AiPill({ on }: { on: boolean }) {
  return (
    <span style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', border: `1px solid ${on ? '#7fbf8e' : 'var(--rafa-border)'}`, color: on ? '#7fbf8e' : 'var(--rafa-muted)' }}
      title={on ? 'Redacción con Claude activa' : 'Sugerencias base activas. La redacción con IA se activa con ANTHROPIC_API_KEY en el Worker.'}>
      {on ? '● IA activa' : '○ IA inactiva · sugerencias base'}
    </span>
  )
}

function ErrorBox({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="p-5" style={S.card} role="alert">
      <p style={{ color: '#e06060', fontSize: '0.9rem' }}>{text}</p>
      <button type="button" className="mt-3" style={S.btn} onClick={onRetry}>Reintentar</button>
    </div>
  )
}

const isEmpty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)

function errText(e: unknown): string {
  const code = e instanceof Error ? e.message : ''
  const map: Record<string, string> = {
    services_not_configured: 'Faltan ADMIN_SERVICES_URL / ADMIN_SERVICES_TOKEN en las variables de entorno.',
    services_unreachable: 'No se pudo conectar con los microservicios en Cloudflare. Intenta en un momento.',
    unauthorized: 'Tu sesión expiró. Recarga la página para ingresar de nuevo.',
    invalid_url: 'Ese link no es válido o apunta a una dirección privada.',
    fetch_failed: 'No pude leer esa página (puede bloquear lectores automáticos). Prueba con otro link.',
    services_timeout: 'La respuesta tardó demasiado. Inténtalo de nuevo.',
    ai_not_configured: 'La IA aún no está activa: falta ANTHROPIC_API_KEY en el Worker.',
    refusal: 'El modelo no quiso redactar esta pieza. Ajusta el enfoque e inténtalo de nuevo.',
    ai_error: 'La IA no respondió. Inténtalo de nuevo en un momento.',
    empty: 'Escribe algo antes de guardar.',
  }
  return map[code] ?? 'Algo salió mal. Inténtalo de nuevo.'
}
