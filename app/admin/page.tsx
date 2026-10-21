import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { isDbConfigured } from '@/lib/server/env'
import { getMetrics, type Range, type Metrics } from '@/lib/server/metrics'
import { LogoutButton } from './LogoutButton'

export const metadata: Metadata = {
  title: 'Métricas — rafatrujillo',
  robots: { index: false, follow: false },
}

const RANGES: { v: Range; label: string }[] = [
  { v: 7, label: '7 días' },
  { v: 30, label: '30 días' },
  { v: 90, label: '90 días' },
  { v: 0, label: 'Todo' },
]

const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', ...opts }).format(new Date(iso))
const n = (v: number) => new Intl.NumberFormat('es-CO').format(v)

/* Panel de métricas para Rafa (protegido por proxy.ts → /admin/login). */
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  await connection()
  const { d } = await searchParams
  const range = ([7, 30, 90, 0].includes(Number(d)) ? Number(d) : 30) as Range

  if (!isDbConfigured()) return <Shell range={range}><p>La base de datos no está configurada.</p></Shell>
  const m = await getMetrics(range)
  const delta = m.kpis.visitorsPrev == null ? null
    : m.kpis.visitorsPrev === 0 ? null
    : Math.round(((m.kpis.visitors - m.kpis.visitorsPrev) / m.kpis.visitorsPrev) * 100)

  return (
    <Shell range={range} generatedAt={m.generatedAt} fromIso={m.fromIso}>
      {/* ── Números clave ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Visitantes" value={n(m.kpis.visitors)} hint={delta == null ? 'sesiones únicas' : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} % vs. periodo anterior`} tone={delta == null ? undefined : delta >= 0 ? 'up' : 'down'} />
        <Kpi label="Suscriptores" value={n(m.kpis.confirmedTotal)} hint={`+${n(m.kpis.newConfirmed)} nuevos en el periodo`} tone={m.kpis.newConfirmed > 0 ? 'up' : undefined} />
        <Kpi label="Conversión a lista" value={`${m.kpis.conversion.toFixed(1)} %`} hint="visitantes que se suscribieron" />
        <Kpi label="Reproducciones" value={n(m.kpis.plays)} hint="canciones + videos en la web" />
      </div>

      {/* ── Evolución diaria ── */}
      <Card title="Visitantes por día" subtitle="Sesiones únicas en rafatrujillo.xyz">
        <DailyBars data={m.daily.map(x => ({ day: x.day, value: x.visits }))} unit="visitantes" />
      </Card>
      <Card title="Nuevos suscriptores por día" subtitle="Confirmados por correo">
        <DailyBars data={m.daily.map(x => ({ day: x.day, value: x.subs }))} unit="suscriptores" compact />
      </Card>

      {/* ── Lista de correo ── */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card title="Lista de correo" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Mini label="Confirmados" value={m.subscribers.confirmedTotal} accent />
            <Mini label="Sin confirmar" value={m.subscribers.pending} />
            <Mini label="Bajas" value={m.subscribers.unsubscribed} />
          </div>
          <h3 style={H3}>Embudo del periodo</h3>
          <BarList rows={m.funnel.map(f => [f.label, f.value])} />
          <p className="mt-4" style={NOTE}>
            Pop-up mostrado {n(m.popup.shown)} veces · cerrado sin suscribirse {n(m.popup.dismissed)}.
            “Sin confirmar” = se registraron pero no abrieron el correo de confirmación (se borran a los 14 días).
          </p>
          <a href="/api/admin/export" className="btn-apple mt-5" style={{ display: 'inline-flex' }}>↓ Descargar suscriptores (CSV)</a>
        </Card>

        <Card title="Últimos suscriptores" className="lg:col-span-3">
          {m.subscribers.latest.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: '0.85rem', minWidth: 460 }}>
                <thead>
                  <tr style={{ color: 'var(--rafa-muted)', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    <th className="py-2 font-normal">Fecha</th><th className="py-2 font-normal">Nombre</th><th className="py-2 font-normal">Correo</th><th className="py-2 font-normal">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {m.subscribers.latest.map(s => (
                    <tr key={s.email} style={{ borderTop: '1px solid var(--rafa-border)' }}>
                      <td className="py-2 pr-3" style={{ color: 'var(--rafa-muted)', whiteSpace: 'nowrap' }}>{fmtDate(s.created_at)}</td>
                      <td className="py-2 pr-3" style={{ color: 'var(--rafa-text)' }}>{s.name ?? '—'}</td>
                      <td className="py-2 pr-3" style={{ color: 'var(--rafa-text)', wordBreak: 'break-all' }}>{s.email}</td>
                      <td className="py-2"><Status s={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* ── Audiencia ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="De dónde llegan"><BarList rows={m.sources} total={m.kpis.pageViews} /></Card>
        <Card title="Países"><BarList rows={m.countries} total={m.kpis.pageViews} /></Card>
        <Card title="Dispositivo"><BarList rows={m.devices} total={m.kpis.pageViews} /></Card>
        <Card title="Idioma de la página"><BarList rows={m.language} total={m.kpis.pageViews} /></Card>
      </section>

      {/* ── Música ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Canciones reproducidas en la web" subtitle="Reproductor del sitio"><BarList rows={m.songsPlayed} /></Card>
        <Card title="Clics hacia plataformas" subtitle="Salidas a Spotify, Apple Music, YouTube…"><BarList rows={m.platforms} /></Card>
        <Card title="Videos reproducidos"><BarList rows={m.videos} /></Card>
        <Card title="Letras más leídas"><BarList rows={m.lyrics} /></Card>
      </section>

      {/* ── Interés en la página ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="¿Hasta dónde llegan?" subtitle="% de visitantes que vio cada sección">
          <BarList rows={m.sectionReach.map(s => [s.label, s.value])} total={m.kpis.visitors} showPct />
        </Card>
        <Card title="Profundidad de lectura" subtitle="% de visitantes que bajó hasta…">
          <BarList rows={m.depth.map(s => [s.label, s.value])} total={m.kpis.visitors} showPct keepOrder />
        </Card>
      </section>

      {/* ── Booking ── */}
      <Card title="Mensajes de booking y servicios" subtitle={`También llegan a ${'trujillorafa.rafa@gmail.com'}`}>
        {m.messages.length === 0 ? <Empty text="Aún no hay mensajes." /> : (
          <ul className="flex flex-col">
            {m.messages.map(msg => (
              <li key={msg.created_at} className="py-3" style={{ borderTop: '1px solid var(--rafa-border)' }}>
                <p style={{ color: 'var(--rafa-text)', fontWeight: 500 }}>
                  {msg.name} · <a href={`mailto:${msg.email}`} style={{ color: 'var(--rafa-accent)' }}>{msg.email}</a>
                </p>
                <p style={{ ...NOTE, marginTop: 2 }}>{SUBJECTS[msg.subject] ?? msg.subject} · {fmtDate(msg.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                <p style={{ color: 'var(--rafa-muted)', whiteSpace: 'pre-line', fontSize: '0.9rem', marginTop: 6 }}>{msg.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p style={NOTE}>
        Datos propios del sitio (sin cookies). Una “visita” es una sesión de navegador; se excluyen pruebas internas.
        Las escuchas dentro de Spotify, Apple Music y YouTube se ven en Spotify for Artists, Apple Music for Artists y YouTube Studio.
      </p>
    </Shell>
  )
}

/* ─────────────────────────── piezas ─────────────────────────── */

const SUBJECTS: Record<string, string> = {
  booking: 'Booking / concierto', services: 'Música para cine / publicidad', collab: 'Colaboración', press: 'Prensa', other: 'Otro',
}
const H3: React.CSSProperties = { fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-muted)', marginBottom: '0.6rem' }
const NOTE: React.CSSProperties = { fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--rafa-muted)' }

function Shell({ children, range, generatedAt, fromIso }: { children: React.ReactNode; range: Range; generatedAt?: string; fromIso?: string }) {
  return (
    <section className="px-4 sm:px-6" style={{ paddingTop: '2rem', paddingBottom: '4rem', fontFamily: 'var(--font-inter)' }}>
      <div className="flex flex-col gap-4" style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header className="flex flex-wrap items-end justify-between gap-4 mb-2">
          <div>
            <Link href="/" style={{ fontFamily: 'var(--font-type)', fontWeight: 700, color: 'var(--rafa-muted)', fontSize: '0.95rem' }}>rafatrujillo</Link>
            <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.4rem, 7vw, 3.4rem)', lineHeight: 1, color: 'var(--rafa-text)' }}>Métricas</h1>
            {generatedAt && fromIso && (
              <p style={NOTE}>Desde el {fmtDate(fromIso, { day: 'numeric', month: 'long' })} · actualizado {fmtDate(generatedAt, { hour: '2-digit', minute: '2-digit' })}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <nav aria-label="Periodo" className="flex" style={{ border: '1px solid var(--rafa-border)' }}>
              {RANGES.map(r => (
                <Link
                  key={r.v}
                  href={`/admin?d=${r.v}`}
                  aria-current={r.v === range ? 'page' : undefined}
                  className="px-3 py-2"
                  style={{
                    fontSize: '0.78rem',
                    color: r.v === range ? '#0a0a0a' : 'var(--rafa-muted)',
                    background: r.v === range ? 'var(--rafa-accent)' : 'transparent',
                  }}
                >
                  {r.label}
                </Link>
              ))}
            </nav>
            <LogoutButton />
          </div>
        </header>
        {children}
      </div>
    </section>
  )
}

function Card({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 ${className}`} style={{ background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' }}>
      <h2 style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-accent)' }}>{title}</h2>
      {subtitle && <p style={{ ...NOTE, marginTop: 2 }}>{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'up' | 'down' }) {
  return (
    <div className="p-4" style={{ background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' }}>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rafa-muted)' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: 'clamp(1.7rem, 5vw, 2.3rem)', color: 'var(--rafa-text)', lineHeight: 1.2, marginTop: 4 }}>{value}</p>
      {hint && <p style={{ fontSize: '0.75rem', marginTop: 2, color: tone === 'up' ? '#7fbf8e' : tone === 'down' ? '#d98b7a' : 'var(--rafa-muted)' }}>{hint}</p>}
    </div>
  )
}

function Mini({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: '1.7rem', color: accent ? 'var(--rafa-accent)' : 'var(--rafa-text)' }}>{n(value)}</p>
      <p style={{ fontSize: '0.72rem', color: 'var(--rafa-muted)' }}>{label}</p>
    </div>
  )
}

function Status({ s }: { s: string }) {
  const map: Record<string, [string, string]> = {
    confirmed: ['✓ Confirmado', '#7fbf8e'], pending: ['… Sin confirmar', 'var(--rafa-muted)'], unsubscribed: ['✕ Baja', '#d98b7a'],
  }
  const [label, color] = map[s] ?? [s, 'var(--rafa-muted)']
  return <span style={{ color, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{label}</span>
}

function Empty({ text = 'Sin datos todavía en este periodo.' }: { text?: string }) {
  return <p style={NOTE}>{text}</p>
}

/* Barras verticales por día: una serie, un eje; tooltip al pasar/tocar. */
function DailyBars({ data, unit, compact = false }: { data: { day: string; value: number }[]; unit: string; compact?: boolean }) {
  const max = Math.max(1, ...data.map(d => d.value))
  const total = data.reduce((a, d) => a + d.value, 0)
  const h = compact ? 90 : 160
  const step = Math.ceil(data.length / 8) // etiquetas de fecha espaciadas
  return (
    <figure>
      <div className="flex items-end gap-[2px]" style={{ height: h }} role="img" aria-label={`${total} ${unit} en el periodo; máximo diario ${max}`}>
        {data.map(d => (
          <div key={d.day} className="day-bar flex-1 h-full flex items-end" tabIndex={0} data-tip={`${fmtDate(d.day + 'T17:00:00Z')}: ${d.value} ${unit}`}>
            <div style={{ width: '100%', height: `${Math.max(d.value ? 3 : 1, (d.value / max) * 100)}%`, background: d.value ? 'var(--rafa-accent)' : 'var(--rafa-border)', borderRadius: '3px 3px 0 0' }} />
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] mt-1.5" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center" style={{ fontSize: '0.62rem', color: 'var(--rafa-muted)', whiteSpace: 'nowrap', visibility: i % step === 0 ? 'visible' : 'hidden' }}>
            {fmtDate(d.day + 'T17:00:00Z', { day: 'numeric', month: 'numeric' })}
          </span>
        ))}
      </div>
      <figcaption className="flex justify-between mt-2" style={NOTE}>
        <span>Total: <strong style={{ color: 'var(--rafa-text)' }}>{n(total)}</strong> {unit}</span>
        <span>Máximo en un día: {n(max === 1 && total === 0 ? 0 : max)}</span>
      </figcaption>
      <details className="mt-2" style={NOTE}>
        <summary style={{ cursor: 'pointer' }}>Ver como tabla</summary>
        <table className="mt-2 w-full" style={{ fontSize: '0.8rem' }}>
          <tbody>
            {[...data].reverse().map(d => (
              <tr key={d.day} style={{ borderTop: '1px solid var(--rafa-border)' }}>
                <td className="py-1">{fmtDate(d.day + 'T17:00:00Z', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td className="py-1 text-right" style={{ color: 'var(--rafa-text)' }}>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

/* Lista de barras horizontales (ranking). */
function BarList({ rows, total, showPct = false, keepOrder = false }: {
  rows: ReadonlyArray<readonly [string, number]>
  total?: number
  showPct?: boolean
  keepOrder?: boolean
}) {
  if (!rows.length || rows.every(r => r[1] === 0)) return <Empty />
  const list = keepOrder ? rows : [...rows].sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...list.map(r => r[1]))
  const sum = total ?? list.reduce((a, r) => a + r[1], 0)
  return (
    <ul className="flex flex-col gap-2.5">
      {list.map(([label, value]) => {
        const pct = sum ? Math.round((value / sum) * 100) : 0
        return (
          <li key={label}>
            <div className="flex justify-between gap-3" style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--rafa-text)' }} className="truncate">{label}</span>
              <span style={{ color: 'var(--rafa-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {showPct ? `${pct} %` : n(value)}{!showPct && total ? <span style={{ opacity: 0.7 }}> · {pct} %</span> : null}
              </span>
            </div>
            <div className="mt-1" style={{ height: 6, background: 'var(--rafa-surface-2)', borderRadius: 3 }}>
              <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: 'var(--rafa-accent)', borderRadius: 3, opacity: 0.9 }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export type { Metrics }
