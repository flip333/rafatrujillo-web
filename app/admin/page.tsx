import type { Metadata } from 'next'
import { connection } from 'next/server'
import { db } from '@/lib/server/supabase'
import { isDbConfigured } from '@/lib/server/env'

export const metadata: Metadata = {
  title: 'Métricas — rafatrujillo',
  robots: { index: false, follow: false },
}

type Ev = { name: string; props: Record<string, string | number>; session_id: string | null; created_at: string; device: string | null; country: string | null }

const DAYS = 30

/* Panel privado (protegido por proxy.ts). Lee con service_role en el servidor. */
export default async function AdminPage() {
  await connection()
  if (!isDbConfigured()) return <Shell><p>Supabase no está configurado.</p></Shell>

  const supabase = db()
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString()

  const [evRes, subRes, msgRes] = await Promise.all([
    supabase.from('events').select('name, props, session_id, created_at, device, country').gte('created_at', since).order('created_at', { ascending: false }).limit(20000),
    supabase.from('subscribers').select('status, created_at, confirmed_at, source'),
    supabase.from('contact_messages').select('name, email, subject, message, created_at, emailed_at').order('created_at', { ascending: false }).limit(10),
  ])
  const events = (evRes.data ?? []) as Ev[]
  const subs = subRes.data ?? []
  const msgs = msgRes.data ?? []

  const count = (name: string) => events.filter(e => e.name === name).length
  const sessions = new Set(events.filter(e => e.name === 'page_view').map(e => e.session_id)).size
  const topBy = (name: string, key: string, n = 8) => {
    const m = new Map<string, number>()
    events.filter(e => e.name === name).forEach(e => {
      const k = String(e.props?.[key] ?? '—')
      m.set(k, (m.get(k) ?? 0) + 1)
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
  }
  const tally = (key: 'device' | 'country') => {
    const m = new Map<string, number>()
    events.filter(e => e.name === 'page_view').forEach(e => m.set(e[key] ?? '—', (m.get(e[key] ?? '—') ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }

  // Visitas por día (últimos 14 días)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10)
    return { d, v: events.filter(e => e.name === 'page_view' && e.created_at.startsWith(d)).length }
  })
  const maxDay = Math.max(1, ...days.map(x => x.v))

  const subStats = {
    confirmed: subs.filter(s => s.status === 'confirmed').length,
    pending: subs.filter(s => s.status === 'pending').length,
    unsubscribed: subs.filter(s => s.status === 'unsubscribed').length,
  }

  const funnel = [
    ['Pop-up / formulario visto', count('subscribe_view')],
    ['Envíos del formulario', count('subscribe_submit')],
    ['Registros (pendientes de confirmar)', count('subscribe_success')],
    ['Confirmados', count('subscribe_confirmed')],
  ] as const

  return (
    <Shell>
      <p style={{ color: 'var(--rafa-muted)', fontSize: '0.85rem' }}>Últimos {DAYS} días · datos propios (Supabase). Tráfico detallado y Core Web Vitals: panel de Vercel.</p>

      <Grid>
        <Kpi label="Sesiones" value={sessions} />
        <Kpi label="Páginas vistas" value={count('page_view')} />
        <Kpi label="Suscriptores confirmados" value={subStats.confirmed} />
        <Kpi label="Pendientes / bajas" value={`${subStats.pending} / ${subStats.unsubscribed}`} />
        <Kpi label="Reproducciones (player)" value={count('player_play') + count('player_autostart')} />
        <Kpi label="Videos reproducidos" value={count('video_play')} />
        <Kpi label="Letras abiertas" value={count('lyrics_open')} />
        <Kpi label="Mensajes de contacto" value={count('contact_submit')} />
      </Grid>

      <Card title="Visitas por día (14 días)">
        <div className="flex items-end gap-1.5" style={{ height: 140 }}>
          {days.map(x => (
            <div key={x.d} className="flex-1 flex flex-col items-center gap-1" title={`${x.d}: ${x.v}`}>
              <div style={{ width: '100%', height: `${(x.v / maxDay) * 110}px`, minHeight: 2, background: 'var(--rafa-accent)', opacity: 0.85 }} />
              <span style={{ fontSize: '0.6rem', color: 'var(--rafa-muted)' }}>{x.d.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Embudo de suscripción">
          <Table rows={funnel.map(([k, v]) => [k, v])} />
        </Card>
        <Card title="Clics a plataformas">
          <Table rows={topBy('outbound_click', 'platform')} />
        </Card>
        <Card title="Canciones más reproducidas (player)">
          <Table rows={topBy('player_play', 'song')} />
        </Card>
        <Card title="Letras más leídas">
          <Table rows={topBy('lyrics_open', 'song')} />
        </Card>
        <Card title="Videos más vistos">
          <Table rows={topBy('video_play', 'title')} />
        </Card>
        <Card title="Profundidad de scroll">
          <Table rows={topBy('scroll_depth', 'depth').sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => [`${k} %`, v])} />
        </Card>
        <Card title="Dispositivos">
          <Table rows={tally('device')} />
        </Card>
        <Card title="Países">
          <Table rows={tally('country')} />
        </Card>
      </div>

      <Card title="Últimos mensajes de contacto">
        {msgs.length === 0 ? <p style={{ color: 'var(--rafa-muted)' }}>Sin mensajes.</p> : (
          <ul className="flex flex-col gap-4">
            {msgs.map(m => (
              <li key={m.created_at} style={{ borderBottom: '1px solid var(--rafa-border)', paddingBottom: '0.75rem' }}>
                <p style={{ color: 'var(--rafa-text)', fontWeight: 500 }}>
                  {m.name} · <a href={`mailto:${m.email}`} style={{ color: 'var(--rafa-accent)' }}>{m.email}</a>
                  <span style={{ color: 'var(--rafa-muted)', fontWeight: 400 }}> · {m.subject} · {new Date(m.created_at).toLocaleString('es-CO')}{m.emailed_at ? ' · reenviado ✓' : ''}</span>
                </p>
                <p style={{ color: 'var(--rafa-muted)', whiteSpace: 'pre-line', fontSize: '0.9rem', marginTop: '0.25rem' }}>{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-6" style={{ paddingTop: '6.5rem', paddingBottom: '5rem', fontFamily: 'var(--font-inter)' }}>
      <div className="flex flex-col gap-5" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '3rem', color: 'var(--rafa-text)', lineHeight: 1 }}>Métricas</h1>
        {children}
      </div>
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4" style={{ background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' }}>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-muted)' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-type)', fontSize: '1.8rem', color: 'var(--rafa-text)', marginTop: '0.25rem' }}>{value}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5" style={{ background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' }}>
      <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--rafa-accent)', marginBottom: '0.9rem' }}>{title}</h2>
      {children}
    </div>
  )
}

function Table({ rows }: { rows: ReadonlyArray<readonly [string, number | string]> }) {
  if (rows.length === 0) return <p style={{ color: 'var(--rafa-muted)', fontSize: '0.85rem' }}>Sin datos aún.</p>
  return (
    <table className="w-full" style={{ fontSize: '0.88rem' }}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '1px solid var(--rafa-border)' }}>
            <td className="py-1.5" style={{ color: 'var(--rafa-text)' }}>{k}</td>
            <td className="py-1.5 text-right" style={{ color: 'var(--rafa-muted)', fontVariantNumeric: 'tabular-nums' }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
