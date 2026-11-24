import Link from 'next/link'
import { isServicesConfigured, servicesFetch } from '@/lib/server/admin-services'

/* Pestaña "Pauta (SEM)": Google Ads y Meta Ads vía sus APIs oficiales,
   leídas por el Worker de Cloudflare (caché de 6 h, refresco automático). */

interface Totals { spend: number; impressions: number; clicks: number; conversions: number; ctr: number; cpc: number; cpa: number | null }
interface Campaign { name: string; status: string; spend: number; impressions: number; clicks: number; conversions: number; ctr: number }
interface MetaCampaign extends Campaign {
  id: string; objectiveLabel: string; reach: number; frequency: number; cpm: number; linkClicks: number; linkCtr: number
  landingViews: number; leads: number; registrations: number; videoViews: number; thruplays: number; engagement: number
  results: number; resultLabel: string; costPerResult: number | null; tips: string[]
}
interface MetaDay { day: string; spend: number; reach: number; linkClicks: number; registrations: number; leads: number }
interface Platform {
  platform: 'google' | 'meta'; configured: boolean; missing: string[]; error?: string
  account?: { name: string; currency: string }; days: number; totals?: Totals; campaigns?: Campaign[]; fetchedAt: string
  metaCampaigns?: MetaCampaign[]; daily?: MetaDay[]
}

const NOTE: React.CSSProperties = { fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--rafa-muted)' }
const CARD: React.CSSProperties = { background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' }
const H2: React.CSSProperties = { fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-accent)' }
const n = (v: number, d = 0) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v)
const money = (v: number, cur?: string) => cur ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) : n(v, 2)

const SETUP: Record<'google' | 'meta', { title: string; steps: string[]; vars: Record<string, string> }> = {
  google: {
    title: 'Google Ads (búsqueda / SEM)',
    steps: [
      'En tu cuenta de administrador (MCC) de Google Ads: Herramientas → Centro de API → solicita un developer token (Google lo aprueba; puede tardar unos días).',
      'En Google Cloud Console: crea un proyecto, activa la “Google Ads API” y crea un cliente OAuth (tipo “Aplicación web”).',
      'Genera un refresh token con ese cliente OAuth, autorizando con la cuenta que administra la pauta (alcance https://www.googleapis.com/auth/adwords).',
      'Copia el Customer ID de la cuenta de anuncios (10 dígitos, arriba a la derecha en Google Ads).',
    ],
    vars: {
      GOOGLE_ADS_DEVELOPER_TOKEN: 'Developer token (Centro de API)',
      GOOGLE_ADS_CLIENT_ID: 'Client ID del cliente OAuth',
      GOOGLE_ADS_CLIENT_SECRET: 'Client secret del cliente OAuth',
      GOOGLE_ADS_REFRESH_TOKEN: 'Refresh token',
      GOOGLE_ADS_CUSTOMER_ID: 'ID de la cuenta de anuncios',
    },
  },
  meta: {
    title: 'Meta Ads (Facebook / Instagram)',
    steps: [
      'En business.facebook.com → Configuración del negocio → Usuarios del sistema: crea un usuario del sistema (Admin).',
      'Asígnale la cuenta publicitaria con permiso de lectura y genera un token con el permiso ads_read.',
      'Copia el ID de la cuenta publicitaria (Administrador de anuncios → número junto al nombre de la cuenta).',
    ],
    vars: {
      META_ACCESS_TOKEN: 'Token del usuario del sistema (ads_read)',
      META_AD_ACCOUNT_ID: 'ID de la cuenta publicitaria (sin “act_”)',
    },
  },
}

export async function PautaTab({ days, refresh }: { days: 7 | 30; refresh: boolean }) {
  if (!isServicesConfigured()) return <p className="p-5" style={{ ...CARD, ...NOTE }}>Faltan ADMIN_SERVICES_URL y ADMIN_SERVICES_TOKEN en las variables de entorno.</p>

  let data: { google: Platform; meta: Platform } | null = null
  let error = ''
  try {
    const res = await servicesFetch(`ads/summary?days=${days}${refresh ? '&refresh=1' : ''}`, { timeoutMs: 25_000 })
    if (res.ok) data = await res.json()
    else error = `Los microservicios respondieron ${res.status}.`
  } catch {
    error = 'No se pudo conectar con los microservicios en Cloudflare.'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4" style={CARD}>
        <p style={NOTE}>Datos oficiales de Google Ads API y Meta Marketing API · se actualizan solos cada 6 horas.</p>
        <div className="flex items-center gap-2">
          {([7, 30] as const).map(d => (
            <Link key={d} href={`/admin?tab=pauta&dias=${d}`} aria-current={d === days ? 'page' : undefined} className="px-3 py-2"
              style={{ fontSize: '0.78rem', border: '1px solid var(--rafa-border)', color: d === days ? '#0a0a0a' : 'var(--rafa-muted)', background: d === days ? 'var(--rafa-accent)' : 'transparent' }}>
              {d} días
            </Link>
          ))}
          <Link href={`/admin?tab=pauta&dias=${days}&refresh=1`} className="px-3 py-2" style={{ fontSize: '0.78rem', border: '1px solid var(--rafa-border)', color: 'var(--rafa-text)' }}>↻ Actualizar ahora</Link>
        </div>
      </div>

      {error && <p className="p-5" role="alert" style={{ ...CARD, color: '#e06060', fontSize: '0.9rem' }}>{error}</p>}

      {data && (
        <>
          <Combined google={data.google} meta={data.meta} />
          {data.meta.metaCampaigns ? (
            <>
              <MetaSection p={data.meta} />
              <PlatformCard p={data.google} />
            </>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <PlatformCard p={data.google} />
              <PlatformCard p={data.meta} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Combined({ google, meta }: { google: Platform; meta: Platform }) {
  const live = [google, meta].filter(p => p.totals)
  if (live.length < 2) return null
  const cur = live[0].account?.currency
  if (live.some(p => p.account?.currency !== cur)) return null // monedas distintas: no se suman
  const t = live.reduce((a, p) => ({ spend: a.spend + p.totals!.spend, clicks: a.clicks + p.totals!.clicks, conv: a.conv + p.totals!.conversions, imp: a.imp + p.totals!.impressions }), { spend: 0, clicks: 0, conv: 0, imp: 0 })
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Kpi label="Inversión total" value={money(t.spend, cur)} />
      <Kpi label="Impresiones" value={n(t.imp)} />
      <Kpi label="Clics" value={n(t.clicks)} />
      <Kpi label="Conversiones" value={n(t.conv, 1)} hint={t.conv ? `${money(t.spend / t.conv, cur)} por conversión` : undefined} />
    </div>
  )
}

function PlatformCard({ p }: { p: Platform }) {
  const setup = SETUP[p.platform]
  return (
    <section className="p-5" style={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 style={H2}>{setup.title}</h2>
        <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', border: `1px solid ${p.totals ? '#7fbf8e' : 'var(--rafa-border)'}`, color: p.totals ? '#7fbf8e' : 'var(--rafa-muted)' }}>
          {p.totals ? '● Conectado' : p.configured ? '● Error de conexión' : '○ Sin conectar'}
        </span>
      </div>

      {!p.configured && p.platform === 'meta' && (
        <div className="mt-4">
          <p style={NOTE}>Conecta tu cuenta publicitaria de Meta en modo solo lectura con la guía paso a paso (10–15 minutos).</p>
          <Link href="/admin?tab=conexiones" className="mt-3 px-4 py-2" style={{ display: 'inline-block', fontSize: '0.8rem', background: 'var(--rafa-accent)', color: '#0a0a0a' }}>Conectar Meta →</Link>
        </div>
      )}

      {!p.configured && p.platform === 'google' && (
        <div className="mt-4">
          <p style={NOTE}>Para ver esta pauta aquí, configura estas credenciales como secretos del Worker de Cloudflare (nunca en el código):</p>
          <ol className="mt-3 flex flex-col gap-2" style={{ paddingLeft: '1.1rem', listStyle: 'decimal', fontSize: '0.85rem', color: 'var(--rafa-text)', lineHeight: 1.55 }}>
            {setup.steps.map(s => <li key={s}>{s}</li>)}
          </ol>
          <ul className="mt-4 flex flex-col gap-1">
            {Object.entries(setup.vars).map(([k, label]) => (
              <li key={k} style={{ fontSize: '0.8rem', color: p.missing.includes(k) ? 'var(--rafa-text)' : '#7fbf8e' }}>
                {p.missing.includes(k) ? '○' : '✓'} <code style={{ fontFamily: 'var(--font-type)' }}>{k}</code> <span style={{ color: 'var(--rafa-muted)' }}>— {label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3" style={NOTE}>Comando: <code style={{ fontFamily: 'var(--font-type)', color: 'var(--rafa-text)' }}>wrangler secret put NOMBRE</code> dentro de services/admin-worker.</p>
        </div>
      )}

      {p.error && <p className="mt-4" role="alert" style={{ color: '#e06060', fontSize: '0.85rem' }}>{p.error}</p>}

      {p.totals && (
        <div className="mt-4">
          <p style={NOTE}>{p.account?.name} · últimos {p.days} días · actualizado {new Date(p.fetchedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            <Mini label="Inversión" value={money(p.totals.spend, p.account?.currency)} />
            <Mini label="Clics" value={n(p.totals.clicks)} />
            <Mini label="CTR" value={`${n(p.totals.ctr, 2)} %`} />
            <Mini label="Impresiones" value={n(p.totals.impressions)} />
            <Mini label="CPC" value={money(p.totals.cpc, p.account?.currency)} />
            <Mini label="Conversiones" value={n(p.totals.conversions, 1)} />
          </div>
          {!!p.campaigns?.length && (
            <div className="overflow-x-auto mt-5">
              <table className="w-full" style={{ fontSize: '0.82rem', minWidth: 480 }}>
                <thead>
                  <tr style={{ color: 'var(--rafa-muted)', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    <th className="py-2 font-normal">Campaña</th><th className="py-2 font-normal text-right">Inversión</th><th className="py-2 font-normal text-right">Clics</th><th className="py-2 font-normal text-right">CTR</th><th className="py-2 font-normal text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {p.campaigns.map(c => (
                    <tr key={c.name} style={{ borderTop: '1px solid var(--rafa-border)' }}>
                      <td className="py-2 pr-3" style={{ color: 'var(--rafa-text)' }}>{c.name}{c.status && c.status !== 'ENABLED' && c.status !== 'ACTIVE' ? <span style={{ color: 'var(--rafa-muted)' }}> · {c.status.toLowerCase()}</span> : null}</td>
                      <td className="py-2 text-right" style={{ color: 'var(--rafa-text)' }}>{money(c.spend, p.account?.currency)}</td>
                      <td className="py-2 text-right">{n(c.clicks)}</td>
                      <td className="py-2 text-right">{n(c.ctr, 2)} %</td>
                      <td className="py-2 text-right">{n(c.conversions, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {p.campaigns?.length === 0 && <p className="mt-4" style={NOTE}>Sin campañas con actividad en este periodo.</p>}
        </div>
      )}
    </section>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-4" style={CARD}>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rafa-muted)' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--rafa-text)', lineHeight: 1.2, marginTop: 4 }}>{value}</p>
      {hint && <p style={{ fontSize: '0.75rem', marginTop: 2, color: 'var(--rafa-muted)' }}>{hint}</p>}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--rafa-text)' }}>{value}</p>
      <p style={{ fontSize: '0.72rem', color: 'var(--rafa-muted)' }}>{label}</p>
    </div>
  )
}

/* ───────────── Meta: detalle por campaña ───────────── */

function MetaSection({ p }: { p: Platform }) {
  const cur = p.account?.currency
  const cs = p.metaCampaigns ?? []
  const sum = (k: keyof MetaCampaign) => cs.reduce((a, c) => a + (Number(c[k]) || 0), 0)
  const spend = sum('spend'), regs = sum('registrations'), leads = sum('leads')
  const subs = regs || leads
  const active = cs.filter(c => c.status === 'Activa').length
  return (
    <section className="p-5 flex flex-col gap-5" style={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 style={H2}>Meta Ads · Facebook e Instagram</h2>
        <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', border: `1px solid ${p.error ? '#e06060' : '#7fbf8e'}`, color: p.error ? '#e06060' : '#7fbf8e' }}>{p.error ? '● Error de conexión' : '● Conectado · solo lectura'}</span>
      </div>
      {p.error && <p role="alert" style={{ color: '#e06060', fontSize: '0.85rem' }}>{p.error} · <Link href="/admin?tab=conexiones" style={{ textDecoration: 'underline' }}>Revisar la conexión</Link></p>}
      {!p.error && (
        <>
          <p style={NOTE}>{p.account?.name} · últimos {p.days} días · {cs.length} {cs.length === 1 ? 'campaña' : 'campañas'} con actividad{active ? ` (${active} activas ahora)` : ''} · actualizado {new Date(p.fetchedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <Kpi label="Inversión" value={money(spend, cur)} />
            <Kpi label="Alcance" value={n(sum('reach'))} hint="personas (suma por campaña)" />
            <Kpi label="Clics al enlace" value={n(sum('linkClicks'))} />
            <Kpi label="Visitas a la web" value={n(sum('landingViews'))} hint="cargaron la página" />
            <Kpi label={regs ? 'Suscriptores' : 'Suscripciones'} value={n(subs)} hint={regs ? 'confirmados (pixel)' : leads ? 'formularios (pixel)' : 'aún sin datos del pixel'} />
            <Kpi label="Costo por suscriptor" value={subs ? money(spend / subs, cur) : '—'} />
          </div>
          {!!p.daily?.length && <SpendBars days={p.daily} cur={cur} />}
          {cs.length === 0 ? <p style={NOTE}>Sin campañas con actividad en este periodo.</p> : (
            <div className="flex flex-col gap-3">
              {cs.map(c => <MetaCampaignCard key={c.id} c={c} cur={cur} />)}
            </div>
          )}
          <details style={NOTE}>
            <summary style={{ cursor: 'pointer', color: 'var(--rafa-text)' }}>¿Qué significa cada medición?</summary>
            <ul className="mt-2 flex flex-col gap-1.5" style={{ paddingLeft: '1rem', listStyle: 'disc' }}>
              <li><b>Alcance:</b> personas distintas que vieron el anuncio. <b>Impresiones:</b> veces que se mostró (una persona puede verlo varias veces).</li>
              <li><b>Frecuencia:</b> veces promedio que cada persona lo vio. Por encima de 3–4 la gente se cansa.</li>
              <li><b>CTR del enlace:</b> de cada 100 personas que lo ven, cuántas tocan el enlace. En música, más de 1 % es bueno.</li>
              <li><b>Visitas a la web:</b> clics que realmente cargaron la página. Si son muchos menos que los clics, hay clics accidentales o la web tarda en abrir.</li>
              <li><b>CPM:</b> lo que cuesta mostrar el anuncio 1.000 veces.</li>
              <li><b>Suscripciones (formulario):</b> llenaron el formulario. <b>Suscriptores confirmados:</b> además confirmaron desde su correo. Meta solo cuenta a quien aceptó las cookies.</li>
              <li><b>ThruPlay:</b> vieron el video completo o al menos 15 segundos.</li>
            </ul>
          </details>
        </>
      )}
    </section>
  )
}

function SpendBars({ days, cur }: { days: MetaDay[]; cur?: string }) {
  const max = Math.max(1, ...days.map(d => d.spend))
  const subs = days.reduce((a, d) => a + (d.registrations || d.leads), 0)
  return (
    <figure>
      <p style={{ ...NOTE, marginBottom: 6 }}>Inversión por día{subs ? ' · los puntos verdes marcan días con suscripciones' : ''}</p>
      <div className="flex items-end gap-[2px]" style={{ height: 90 }} role="img" aria-label={`Inversión diaria, máximo ${money(max, cur)}`}>
        {days.map(d => {
          const s = d.registrations || d.leads
          return (
            <div key={d.day} className="day-bar flex-1 h-full flex flex-col justify-end items-center" tabIndex={0}
              data-tip={`${new Date(d.day + 'T17:00:00Z').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}: ${money(d.spend, cur)} · ${n(d.linkClicks)} clics${s ? ` · ${n(s)} suscripciones` : ''}`}>
              {s > 0 && <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: '#7fbf8e', marginBottom: 3 }} />}
              <div style={{ width: '100%', height: `${Math.max(d.spend ? 3 : 1, (d.spend / max) * 100)}%`, background: d.spend ? 'var(--rafa-accent)' : 'var(--rafa-border)', borderRadius: '3px 3px 0 0' }} />
            </div>
          )
        })}
      </div>
    </figure>
  )
}

function MetaCampaignCard({ c, cur }: { c: MetaCampaign; cur?: string }) {
  const tone = c.status === 'Activa' ? '#7fbf8e' : c.status === 'Con problemas' || c.status === 'Rechazada' ? '#e06060' : 'var(--rafa-muted)'
  return (
    <article className="p-4" style={{ border: '1px solid var(--rafa-border)', background: 'var(--rafa-surface-2)' }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 style={{ color: 'var(--rafa-text)', fontSize: '0.98rem', fontWeight: 500 }}>{c.name}</h3>
          <p style={NOTE}>{c.objectiveLabel} · <span style={{ color: tone }}>{c.status}</span></p>
        </div>
        <div className="text-right">
          <p style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--rafa-text)' }}>{n(c.results)}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--rafa-muted)' }}>{c.resultLabel}{c.costPerResult != null ? ` · ${money(c.costPerResult, cur)} c/u` : ''}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
        <Mini label="Inversión" value={money(c.spend, cur)} />
        <Mini label="Alcance" value={n(c.reach)} />
        <Mini label="Frecuencia" value={n(c.frequency, 1)} />
        <Mini label="Clics al enlace" value={n(c.linkClicks)} />
        <Mini label="CTR enlace" value={`${n(c.linkCtr, 2)} %`} />
        <Mini label="Visitas web" value={n(c.landingViews)} />
      </div>
      <details className="mt-3" style={NOTE}>
        <summary style={{ cursor: 'pointer' }}>Todas las mediciones</summary>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-3">
          <Mini label="Impresiones" value={n(c.impressions)} />
          <Mini label="CPM" value={money(c.cpm, cur)} />
          <Mini label="Clics (todos)" value={n(c.clicks)} />
          <Mini label="Suscripciones (form.)" value={n(c.leads)} />
          <Mini label="Suscriptores confirmados" value={n(c.registrations)} />
          <Mini label="Interacciones" value={n(c.engagement)} />
          <Mini label="Reproducciones 3 s" value={n(c.videoViews)} />
          <Mini label="ThruPlay" value={n(c.thruplays)} />
        </div>
      </details>
      {c.tips.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {c.tips.map(t => <li key={t} className="p-2.5" style={{ fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--rafa-text)', borderLeft: '2px solid var(--rafa-accent)', background: 'var(--rafa-surface)' }}>💡 {t}</li>)}
        </ul>
      )}
    </article>
  )
}
