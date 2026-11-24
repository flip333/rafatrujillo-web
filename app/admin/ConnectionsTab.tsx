'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

/* Pestaña "Conexiones": asistentes paso a paso para que Rafa conecte, sin ayuda
   técnica, su cuenta publicitaria de Meta (solo lectura) y el pixel de Meta.
   - Cada paso: qué hacer en palabras simples + botón que abre la pantalla exacta.
   - Lo que se pega se comprueba en el momento, con errores en lenguaje claro.
   - Los tokens se guardan cifrados en el servidor y nunca se vuelven a mostrar.
   - El avance se recuerda en este navegador por si hay que salir y volver. */

// ── Tipos ──
type Field = { set: boolean; source: 'panel' | 'servidor' | null; value?: string; updatedAt?: string }
interface Status {
  canStoreSecrets: boolean
  fields: Record<'META_ACCESS_TOKEN' | 'META_AD_ACCOUNT_ID' | 'META_PIXEL_ID' | 'META_CAPI_TOKEN', Field>
  pixel: null | { id: string; name: string; lastFiredAt: string | null } | { error: { code: string } }
}
type MetaErr = { code: string; message?: string }
type Account = { id: string; name: string; currency: string; status: string; active: boolean }
type Pixel = { id: string; name: string; lastFiredAt: string | null }
type Flow = 'ads' | 'pixel' | 'capi' | null

// ── Estilos (mismo lenguaje del panel) ──
const CARD: React.CSSProperties = { background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' }
const NOTE: React.CSSProperties = { fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--rafa-muted)' }
const H2: React.CSSProperties = { fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rafa-accent)' }
const BODY: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--rafa-text)' }
const OK = '#7fbf8e', BAD = '#e06060'
const btn = (primary = false, disabled = false): React.CSSProperties => ({
  padding: '0.75rem 1.2rem', fontSize: '0.8rem', letterSpacing: '0.08em', cursor: disabled ? 'default' : 'pointer',
  border: '1px solid var(--rafa-accent)', opacity: disabled ? 0.5 : 1,
  background: primary ? 'var(--rafa-accent)' : 'transparent', color: primary ? '#0a0a0a' : 'var(--rafa-accent)',
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none',
})
const INPUT: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem', background: 'var(--rafa-surface-2)', border: '1px solid var(--rafa-border)',
  color: 'var(--rafa-text)', fontFamily: 'var(--font-type)', fontSize: '0.85rem', outline: 'none',
}

// ── API ──
async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin/services/${path}`, {
    method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) throw new Error('session')
  return data as T
}

const FRIENDLY: Record<string, string> = {
  invalid_token: 'Meta dice que esa llave no es válida. Revisa que la copiaste completa (es muy larga, sin espacios) o genera una nueva.',
  permission: 'La llave funciona, pero le falta permiso. Revisa que marcaste “ads_read” al generarla y que le diste la cuenta publicitaria al usuario del sistema.',
  not_found: 'No encontramos ese elemento en tu cuenta. Revisa que pertenezca a tu portafolio comercial.',
  rate_limit: 'Meta pidió esperar un momento. Intenta de nuevo en un minuto.',
  network: 'No hubo conexión con Meta. Revisa el internet e intenta de nuevo.',
  invalid_value: 'Eso no tiene el formato esperado. Revisa que copiaste el dato correcto.',
  config_key_missing: 'Falta un ajuste técnico en el servidor para guardar llaves de forma segura. Avísale a quien administra la web.',
  invalid_test_code: 'El código de prueba empieza por “TEST” seguido de números (por ejemplo TEST12345).',
  session: 'Tu sesión del panel se cerró. Recarga la página e ingresa de nuevo.',
}
const friendly = (e: MetaErr | string | undefined) => FRIENDLY[typeof e === 'string' ? e : e?.code ?? ''] ?? 'Algo salió mal. Intenta de nuevo; si se repite, toma una captura y envíala a quien administra la web.'

const ago = (iso: string | null | undefined) => {
  if (!iso) return 'nunca'
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (min < 2) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} días`
}

// ════════════════════════════════════════════════════════════════════════
export function ConnectionsTab() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loadError, setLoadError] = useState('')
  const [flow, setFlow] = useState<Flow>(null)

  const refresh = useCallback(async () => {
    try {
      const s = await api<Status & { error?: string }>('connections')
      if (s.error || !s.fields) throw new Error(s.error ?? 'x')
      setStatus(s); setLoadError('')
    } catch (e) {
      setLoadError(e instanceof Error && e.message === 'session' ? FRIENDLY.session : 'No se pudo cargar el estado de las conexiones. Recarga la página.')
    }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  if (loadError) return <p className="p-5" role="alert" style={{ ...CARD, color: BAD }}>{loadError}</p>
  if (!status) return <p className="p-5" style={{ ...CARD, ...NOTE }}>Cargando conexiones…</p>

  const f = status.fields
  const adsOk = f.META_ACCESS_TOKEN.set && f.META_AD_ACCOUNT_ID.set
  const pixelOk = f.META_PIXEL_ID.set
  const capiOk = f.META_CAPI_TOKEN.set
  const done = () => { setFlow(null); refresh(); window.scrollTo({ top: 0 }) }

  if (flow === 'ads') return <AdsWizard status={status} onDone={done} />
  if (flow === 'pixel') return <PixelWizard status={status} onDone={done} />
  if (flow === 'capi') return <CapiWizard status={status} onDone={done} />

  const pixelInfo = status.pixel && 'id' in status.pixel ? status.pixel : null

  return (
    <div className="flex flex-col gap-4">
      <div className="p-5" style={CARD}>
        <p style={BODY}>
          Aquí conectas tus cuentas de publicidad con la web. Cada conexión es una guía paso a paso: te dice qué hacer,
          te abre la pantalla correcta y comprueba que quedó bien.
        </p>
        <p className="mt-2" style={NOTE}>
          Nada de lo que hagas aquí gasta dinero ni cambia tus campañas: la cuenta publicitaria se conecta en <strong style={{ color: 'var(--rafa-text)' }}>solo lectura</strong>.
          Hazlo en el computador donde ya tienes abierta tu sesión de Facebook.
        </p>
      </div>

      <ConnCard
        n={1} title="Cuenta publicitaria de Meta" subtitle="Para ver aquí cómo van tus campañas de Facebook e Instagram."
        ok={adsOk} time="10–15 minutos"
        detail={adsOk ? `Cuenta conectada: ${f.META_AD_ACCOUNT_ID.value}` : undefined}
        action={adsOk ? 'Revisar o cambiar' : 'Empezar'} onClick={() => setFlow('ads')}
        extra={adsOk ? <Link href="/admin?tab=pauta" style={btn(true)}>Ver mis campañas →</Link> : undefined}
      />
      <ConnCard
        n={2} title="Pixel de Meta" subtitle="Para que Meta sepa quién se suscribe a tu lista gracias a un anuncio, y pueda buscar más personas así."
        ok={pixelOk} time="5 minutos"
        detail={pixelOk ? (pixelInfo ? `Pixel “${pixelInfo.name}” · última señal: ${ago(pixelInfo.lastFiredAt)}` : `Pixel ${f.META_PIXEL_ID.value} activo en la web`) : undefined}
        action={pixelOk ? 'Revisar o cambiar' : 'Empezar'} onClick={() => setFlow('pixel')}
      />
      <ConnCard
        n={3} title="Medición desde el servidor" subtitle="Recomendado. Cuenta las suscripciones aunque el navegador bloquee el pixel (iPhone, bloqueadores). Requiere el paso 2."
        ok={capiOk} time="5 minutos" disabled={!pixelOk}
        detail={capiOk ? 'API de Conversiones activa' : undefined}
        action={capiOk ? 'Revisar o probar' : 'Empezar'} onClick={() => setFlow('capi')}
      />
      <ConnCard
        n={4} title="Google Ads" subtitle="Lectura de campañas de Google. Requiere una aprobación de Google que tarda unos días; lo dejamos para una próxima sesión."
        ok={false} soon
      />
    </div>
  )
}

function ConnCard({ n, title, subtitle, ok, time, detail, action, onClick, extra, disabled, soon }: {
  n: number; title: string; subtitle: string; ok: boolean; time?: string; detail?: string; action?: string
  onClick?: () => void; extra?: React.ReactNode; disabled?: boolean; soon?: boolean
}) {
  return (
    <section className="p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ ...CARD, opacity: soon ? 0.6 : 1 }}>
      <span aria-hidden="true" style={{
        width: 40, height: 40, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: '50%',
        border: `1px solid ${ok ? OK : 'var(--rafa-border)'}`, color: ok ? OK : 'var(--rafa-muted)', fontFamily: 'var(--font-type)', fontWeight: 700,
      }}>{ok ? '✓' : n}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 style={{ ...H2, fontSize: '0.85rem' }}>{title}</h2>
          <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', border: `1px solid ${ok ? OK : 'var(--rafa-border)'}`, color: ok ? OK : 'var(--rafa-muted)' }}>
            {soon ? 'Próximamente' : ok ? '● Conectado' : '○ Pendiente'}
          </span>
        </div>
        <p className="mt-1" style={NOTE}>{subtitle}</p>
        {detail && <p className="mt-1" style={{ fontSize: '0.82rem', color: OK }}>{detail}</p>}
        {!ok && time && !soon && <p className="mt-1" style={{ ...NOTE, fontSize: '0.75rem' }}>Tiempo aproximado: {time}</p>}
      </div>
      {!soon && (
        <div className="flex flex-wrap gap-2">
          {extra}
          <button type="button" onClick={onClick} disabled={disabled} style={btn(!ok && !disabled, disabled)}>
            {disabled ? 'Primero el paso 2' : action}
          </button>
        </div>
      )}
    </section>
  )
}

// ── Marco del asistente ──
type Step = { title: string; body: React.ReactNode; link?: { href: string; label: string }; help?: React.ReactNode; custom?: boolean }

function useStep(key: string, max: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    try { const v = Number(localStorage.getItem(`rafa-conn-${key}`)); if (v > 0 && v < max) setI(v) } catch {}
  }, [key, max])
  const go = (n: number) => {
    const v = Math.max(0, Math.min(max - 1, n))
    setI(v)
    try { localStorage.setItem(`rafa-conn-${key}`, String(v)) } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const reset = () => { try { localStorage.removeItem(`rafa-conn-${key}`) } catch {} }
  return { i, go, reset }
}

function Wizard({ title, steps, i, go, onExit, canNext = true, nextLabel }: {
  title: string; steps: Step[]; i: number; go: (n: number) => void; onExit: () => void; canNext?: boolean; nextLabel?: string
}) {
  const s = steps[i]
  const last = i === steps.length - 1
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onExit} style={{ ...NOTE, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Volver a Conexiones</button>
        <p style={NOTE}>{title}</p>
      </div>

      {/* Progreso */}
      <ol className="flex gap-1.5" aria-label={`Paso ${i + 1} de ${steps.length}`}>
        {steps.map((st, k) => (
          <li key={st.title} className="flex-1" title={st.title}>
            <button type="button" onClick={() => k < i && go(k)} aria-label={`Paso ${k + 1}: ${st.title}`} disabled={k >= i}
              style={{ display: 'block', width: '100%', height: 5, border: 'none', padding: 0, cursor: k < i ? 'pointer' : 'default', background: k <= i ? 'var(--rafa-accent)' : 'var(--rafa-border)', opacity: k < i ? 0.55 : 1 }} />
          </li>
        ))}
      </ol>

      <section className="p-5 sm:p-7" style={CARD}>
        <p style={{ ...NOTE, fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Paso {i + 1} de {steps.length}</p>
        <h2 className="mt-1" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(1.7rem, 5vw, 2.3rem)', lineHeight: 1.05, color: 'var(--rafa-text)' }}>{s.title}</h2>
        <div className="mt-4 flex flex-col gap-3" style={BODY}>{s.body}</div>
        {s.link && (
          <a href={s.link.href} target="_blank" rel="noopener noreferrer" className="mt-5" style={btn(true)}>{s.link.label} ↗</a>
        )}
        {s.help && (
          <details className="mt-5" style={NOTE}>
            <summary style={{ cursor: 'pointer', color: 'var(--rafa-text)' }}>¿La pantalla se ve distinta o te perdiste?</summary>
            <div className="mt-2 flex flex-col gap-2">{s.help}</div>
          </details>
        )}
      </section>

      {!s.custom && (
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} style={{ ...btn(false, i === 0) }}>← Atrás</button>
          {!last && <button type="button" onClick={() => go(i + 1)} disabled={!canNext} style={btn(true, !canNext)}>{nextLabel ?? 'Listo, siguiente paso →'}</button>}
        </div>
      )}
    </div>
  )
}

const Ol = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="flex flex-col gap-2" style={{ paddingLeft: '1.2rem', listStyle: 'decimal' }}>
    {items.map((it, k) => <li key={k}>{it}</li>)}
  </ol>
)
const B = ({ children }: { children: React.ReactNode }) => <strong style={{ color: 'var(--rafa-accent)', fontWeight: 600 }}>{children}</strong>
const Tip = ({ children }: { children: React.ReactNode }) => (
  <p className="p-3" style={{ ...NOTE, borderLeft: '2px solid var(--rafa-accent)', background: 'var(--rafa-surface-2)' }}>{children}</p>
)
const Msg = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <p role={ok ? 'status' : 'alert'} className="p-3" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: ok ? OK : BAD, border: `1px solid ${ok ? OK : BAD}` }}>{children}</p>
)

// ════════════════════════ 1. Cuenta publicitaria ════════════════════════
function AdsWizard({ status, onDone }: { status: Status; onDone: () => void }) {
  const STEPS = 7
  const { i, go, reset } = useStep('ads', STEPS)
  const [token, setToken] = useState('')
  const [checking, setChecking] = useState(false)
  const [err, setErr] = useState('')
  const [found, setFound] = useState<{ user: string; accounts: Account[]; permissions: string[]; usingSaved: boolean } | null>(null)
  const [chosen, setChosen] = useState<string>(status.fields.META_AD_ACCOUNT_ID.value ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const check = async (useSaved = false) => {
    setChecking(true); setErr(''); setFound(null)
    try {
      const r = await api<{ ok: boolean; user?: string; accounts?: Account[]; permissions?: string[]; error?: MetaErr }>('connections/meta/accounts', 'POST', useSaved ? {} : { token: token.trim() })
      if (!r.ok) { setErr(friendly(r.error)); return }
      setFound({ user: r.user ?? '', accounts: r.accounts ?? [], permissions: r.permissions ?? [], usingSaved: useSaved })
      if ((r.accounts ?? []).length === 1) setChosen(r.accounts![0].id)
    } catch (e) { setErr(friendly(e instanceof Error ? e.message : '')) } finally { setChecking(false) }
  }

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const values: Record<string, string> = { META_AD_ACCOUNT_ID: chosen }
      if (!found?.usingSaved) values.META_ACCESS_TOKEN = token.trim()
      const r = await api<{ ok?: boolean; error?: string }>('connections', 'PUT', { values })
      if (!r.ok) { setErr(friendly(r.error)); return }
      setSaved(true); reset()
    } catch (e) { setErr(friendly(e instanceof Error ? e.message : '')) } finally { setSaving(false) }
  }

  const steps: Step[] = [
    {
      title: 'Antes de empezar',
      body: <>
        <p>Vamos a crear una <B>llave de solo lectura</B> para que este panel pueda ver los resultados de tus anuncios. Con esa llave nadie puede crear, pausar ni pagar anuncios.</p>
        <p>Necesitas:</p>
        <Ol items={[
          <>Estar con la sesión de Facebook que maneja los anuncios de rafatrujillo.</>,
          <>Ser <B>administrador</B> del portafolio comercial (Meta Business) donde está la cuenta publicitaria.</>,
          <>Tener este panel abierto en una pestaña y Meta en otra. Los botones dorados abren Meta en una pestaña nueva; cuando termines allá, vuelve a esta pestaña.</>,
        ]} />
        {status.fields.META_ACCESS_TOKEN.set && <Tip>Ya hay una llave guardada. Si solo quieres cambiar de cuenta publicitaria, ve directo al último paso.</Tip>}
      </>,
      link: { href: 'https://business.facebook.com/settings/info', label: 'Comprobar mi portafolio comercial' },
      help: <p>Si al abrir el enlace ves “No tienes acceso” o no aparece “Configuración del negocio”, pídele a quien creó el portafolio que te haga administrador (Configuración → Usuarios → Personas).</p>,
    },
    {
      title: 'Crea una “app” (es solo un contenedor de la llave)',
      body: <>
        <p>Meta exige que toda llave pertenezca a una “app”. No es una app de verdad ni se publica: es solo el lugar donde vive la llave.</p>
        <Ol items={[
          <>Abre el enlace de abajo. Si te pide registrarte como desarrollador, acepta (es gratis; puede pedirte verificar tu teléfono).</>,
          <>Toca <B>Crear app</B>.</>,
          <>Nombre de la app: <B>rafatrujillo web</B>. Correo: el tuyo.</>,
          <>Si te pregunta el caso de uso, elige <B>Crear y administrar anuncios con la API de marketing</B>. Si no aparece, elige <B>Otro</B> y luego tipo <B>Empresa</B>.</>,
          <>Cuando pregunte por el portafolio comercial, elige el de rafatrujillo.</>,
          <>Toca <B>Crear app</B>. Listo: no hay que configurar nada más dentro de la app.</>,
        ]} />
      </>,
      link: { href: 'https://developers.facebook.com/apps/creation/', label: 'Abrir “Crear app” en Meta' },
      help: <>
        <p>Si ya existe una app de rafatrujillo (por ejemplo, de otra persona que hizo pauta), puedes usar esa y saltar este paso.</p>
        <p>Si Meta te pide más datos (política de privacidad, ícono), no son necesarios para esta llave: puedes dejarlos vacíos.</p>
      </>,
    },
    {
      title: 'Crea un “usuario del sistema”',
      body: <>
        <p>Es un usuario robot del portafolio que solo sirve para que el panel lea datos. Así la conexión no depende de tu clave personal de Facebook.</p>
        <Ol items={[
          <>Abre el enlace de abajo (Configuración del negocio → Usuarios → <B>Usuarios del sistema</B>).</>,
          <>Toca <B>Agregar</B>.</>,
          <>Nombre: <B>panel-rafatrujillo</B>. Rol: <B>Empleado</B> (no hace falta administrador).</>,
          <>Toca <B>Crear usuario del sistema</B>.</>,
        ]} />
      </>,
      link: { href: 'https://business.facebook.com/settings/system-users', label: 'Abrir “Usuarios del sistema”' },
      help: <p>Si no ves “Usuarios del sistema”, busca en el menú izquierdo de Configuración del negocio la sección <B>Usuarios</B>. Solo los administradores del portafolio pueden ver esta opción.</p>,
    },
    {
      title: 'Dale acceso de solo lectura',
      body: <>
        <p>Con el usuario <B>panel-rafatrujillo</B> seleccionado:</p>
        <Ol items={[
          <>Toca <B>Asignar activos</B>.</>,
          <>Elige <B>Cuentas publicitarias</B> → marca la cuenta de rafatrujillo → activa <B>solo</B> el permiso <B>Ver rendimiento</B> → <B>Guardar cambios</B>.</>,
          <>Vuelve a <B>Asignar activos</B> → elige <B>Apps</B> → marca <B>rafatrujillo web</B> → activa <B>Desarrollar app</B> (o “Control total”) → <B>Guardar cambios</B>.</>,
        ]} />
        <Tip>“Ver rendimiento” es lo que hace que la llave sea de solo lectura: con ese permiso no se puede editar ni gastar.</Tip>
      </>,
      link: { href: 'https://business.facebook.com/settings/system-users', label: 'Abrir “Usuarios del sistema”' },
      help: <p>Si no aparece tu cuenta publicitaria en la lista, es porque está en otro portafolio o es una cuenta personal. En ese caso escribe a quien administra la web antes de seguir.</p>,
    },
    {
      title: 'Genera la llave',
      body: <>
        <Ol items={[
          <>Con <B>panel-rafatrujillo</B> seleccionado, toca <B>Generar token</B> (o “Generar nuevo token”).</>,
          <>App: <B>rafatrujillo web</B>.</>,
          <>Caducidad: <B>Nunca</B>.</>,
          <>Permisos: marca <B>ads_read</B>. Si aparece <B>read_insights</B>, márcalo también. No marques nada más.</>,
          <>Toca <B>Generar token</B> y luego <B>Copiar</B>.</>,
        ]} />
        <Tip>Meta muestra la llave una sola vez. Cópiala y pégala en el siguiente paso de inmediato. Es un texto larguísimo que empieza por “EAA…”.</Tip>
      </>,
      link: { href: 'https://business.facebook.com/settings/system-users', label: 'Abrir “Usuarios del sistema”' },
      help: <p>Si cerraste la ventana sin copiar la llave, no pasa nada: genera otra con el mismo procedimiento.</p>,
    },
    {
      title: 'Pega la llave y elige la cuenta',
      custom: true,
      body: saved ? null : <>
        <label htmlFor="meta-token" style={NOTE}>Pega aquí la llave que copiaste en Meta:</label>
        <textarea id="meta-token" value={token} onChange={e => { setToken(e.target.value); setFound(null); setErr('') }}
          rows={3} placeholder="EAA…" autoComplete="off" spellCheck={false} style={{ ...INPUT, resize: 'vertical' }} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => check(false)} disabled={checking || token.trim().length < 20} style={btn(true, checking || token.trim().length < 20)}>
            {checking ? 'Comprobando con Meta…' : 'Comprobar la llave'}
          </button>
          {status.fields.META_ACCESS_TOKEN.set && !token && (
            <button type="button" onClick={() => check(true)} disabled={checking} style={btn(false, checking)}>Usar la llave ya guardada</button>
          )}
        </div>
        {err && <Msg ok={false}>{err}</Msg>}
        {found && (
          found.accounts.length === 0 ? (
            <Msg ok={false}>La llave funciona, pero no ve ninguna cuenta publicitaria. Vuelve al paso 4 y asigna la cuenta al usuario del sistema con “Ver rendimiento”.</Msg>
          ) : (
            <>
              <Msg ok>¡La llave funciona! {found.user && <>Es del usuario “{found.user}”. </>}Ahora elige la cuenta publicitaria de rafatrujillo:</Msg>
              {found.permissions.length > 0 && !found.permissions.includes('ads_read') && (
                <Tip>Ojo: no vemos el permiso “ads_read” en esta llave. Si al terminar no aparecen datos, genera la llave de nuevo marcando ads_read.</Tip>
              )}
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">Cuenta publicitaria</legend>
                {found.accounts.map(a => (
                  <label key={a.id} className="flex items-center gap-3 p-3" style={{ border: `1px solid ${chosen === a.id ? 'var(--rafa-accent)' : 'var(--rafa-border)'}`, cursor: 'pointer' }}>
                    <input type="radio" name="acc" value={a.id} checked={chosen === a.id} onChange={() => setChosen(a.id)} />
                    <span className="flex-1">
                      <span style={{ color: 'var(--rafa-text)' }}>{a.name}</span>
                      <span style={{ ...NOTE, display: 'block' }}>ID {a.id} · {a.currency} · <span style={{ color: a.active ? OK : BAD }}>{a.status}</span></span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <button type="button" onClick={save} disabled={!chosen || saving} style={btn(true, !chosen || saving)}>{saving ? 'Guardando…' : 'Guardar y conectar'}</button>
            </>
          )
        )}
        <p style={NOTE}>La llave se guarda cifrada en el servidor y no se vuelve a mostrar en pantalla.</p>
        <div><button type="button" onClick={() => go(i - 1)} style={btn(false)}>← Atrás</button></div>
      </>,
    },
    {
      title: '¡Listo! Tu cuenta quedó conectada',
      custom: true,
      body: <>
        <p>Desde ahora la pestaña <B>Pauta</B> muestra tus campañas de Meta: inversión, a cuántas personas llegaste, clics, visitas a la web, suscripciones y una lectura en palabras simples de qué está funcionando.</p>
        <p style={NOTE}>Los datos se actualizan solos cada 6 horas; también puedes tocar “Actualizar ahora”.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin?tab=pauta&refresh=1" style={btn(true)}>Ver mis campañas →</Link>
          <button type="button" onClick={onDone} style={btn(false)}>Volver a Conexiones</button>
        </div>
      </>,
    },
  ]

  // Al guardar, salta al paso final
  useEffect(() => { if (saved) go(STEPS - 1) }, [saved]) // eslint-disable-line react-hooks/exhaustive-deps

  return <Wizard title="Cuenta publicitaria de Meta · solo lectura" steps={steps} i={i === STEPS - 1 && !saved && !status.fields.META_AD_ACCOUNT_ID.set ? STEPS - 2 : i} go={go} onExit={onDone} />
}

// ════════════════════════ 2. Pixel ════════════════════════
function PixelWizard({ status, onDone }: { status: Status; onDone: () => void }) {
  const STEPS = 4
  const { i, go, reset } = useStep('pixel', STEPS)
  const adsOk = status.fields.META_ACCESS_TOKEN.set && status.fields.META_AD_ACCOUNT_ID.set
  const [pixels, setPixels] = useState<Pixel[] | null>(null)
  const [listErr, setListErr] = useState('')
  const [manual, setManual] = useState('')
  const [chosen, setChosen] = useState(status.fields.META_PIXEL_ID.value ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const loadPixels = useCallback(async () => {
    setListErr('')
    try {
      const r = await api<{ ok: boolean; pixels?: Pixel[]; error?: MetaErr }>('connections/meta/pixels', 'POST', {})
      if (r.ok) { setPixels(r.pixels ?? []); if ((r.pixels ?? []).length === 1 && !chosen) setChosen(r.pixels![0].id) }
      else setListErr(friendly(r.error))
    } catch (e) { setListErr(friendly(e instanceof Error ? e.message : '')) }
  }, [chosen])
  useEffect(() => { if (adsOk && i === 1 && pixels === null) loadPixels() }, [adsOk, i, pixels, loadPixels])

  const save = async () => {
    const id = (manual.trim() || chosen).replace(/\D/g, '')
    setSaving(true); setErr('')
    try {
      const r = await api<{ ok?: boolean; error?: string }>('connections', 'PUT', { values: { META_PIXEL_ID: id } })
      if (!r.ok) { setErr(friendly(r.error)); return }
      go(2)
    } catch (e) { setErr(friendly(e instanceof Error ? e.message : '')) } finally { setSaving(false) }
  }

  const steps: Step[] = [
    {
      title: 'Qué hace el pixel',
      body: <>
        <p>El pixel es un “contador” de Meta en tu web. Cuando alguien llega desde un anuncio y <B>se suscribe a tu lista</B>, Meta se entera y aprende a mostrar el anuncio a más personas parecidas.</p>
        <p>La web ya tiene todo listo para el pixel: <B>no hay que instalar código</B>. Solo hay que decirle cuál es tu pixel.</p>
        <p>La web le avisa a Meta dos momentos:</p>
        <Ol items={[
          <><B>Cliente potencial</B> (Lead): alguien llenó el formulario de suscripción.</>,
          <><B>Registro completado</B> (CompleteRegistration): esa persona confirmó desde su correo. Es un suscriptor real.</>,
        ]} />
        <Tip>Por ley, el pixel solo se activa para quien acepta el aviso de cookies que ahora aparece en la web. Es normal que Meta cuente menos personas que la web.</Tip>
      </>,
    },
    {
      title: adsOk ? 'Elige tu pixel' : 'Busca o crea tu pixel',
      custom: true,
      body: <>
        {adsOk && (
          <>
            <p>Estos son los pixeles de tu cuenta publicitaria. Elige el de rafatrujillo:</p>
            {pixels === null && !listErr && <p style={NOTE}>Buscando pixeles en tu cuenta…</p>}
            {listErr && <Msg ok={false}>{listErr}</Msg>}
            {pixels && pixels.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">Pixel</legend>
                {pixels.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-3" style={{ border: `1px solid ${chosen === p.id && !manual ? 'var(--rafa-accent)' : 'var(--rafa-border)'}`, cursor: 'pointer' }}>
                    <input type="radio" name="px" checked={chosen === p.id && !manual} onChange={() => { setChosen(p.id); setManual('') }} />
                    <span className="flex-1">
                      <span style={{ color: 'var(--rafa-text)' }}>{p.name}</span>
                      <span style={{ ...NOTE, display: 'block' }}>ID {p.id} · última señal: {ago(p.lastFiredAt)}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {pixels && pixels.length === 0 && <Tip>Tu cuenta todavía no tiene pixel. Créalo con las instrucciones de abajo; después vuelve y toca “Buscar de nuevo”.</Tip>}
            {pixels !== null && <div><button type="button" onClick={() => { setPixels(null); loadPixels() }} style={btn(false)}>Buscar de nuevo</button></div>}
          </>
        )}

        <details open={!adsOk || (pixels !== null && pixels.length === 0)} className="p-4" style={{ border: '1px solid var(--rafa-border)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rafa-text)' }}>{adsOk ? '¿No está? Crear un pixel nuevo o pegar el ID a mano' : 'Cómo encontrar o crear el pixel'}</summary>
          <div className="mt-3 flex flex-col gap-3">
            <Ol items={[
              <>Abre el <B>Administrador de eventos</B> con el botón de abajo.</>,
              <>Si en la lista de la izquierda ya hay un pixel (“conjunto de datos”) de rafatrujillo, ábrelo y salta al punto 5.</>,
              <>Si no, toca <B>Conectar datos</B> (o el botón <B>+</B>) → <B>Web</B> → nombre <B>rafatrujillo.xyz</B> → <B>Crear</B>.</>,
              <>Si Meta pregunta cómo instalarlo, cierra esa ventana: <B>la web ya tiene el código</B>.</>,
              <>Copia el <B>ID</B> del pixel (un número de unos 15 dígitos que aparece debajo del nombre o en <B>Configuración</B>) y pégalo aquí:</>,
            ]} />
            <a href="https://business.facebook.com/events_manager2/" target="_blank" rel="noopener noreferrer" style={btn(false)}>Abrir el Administrador de eventos ↗</a>
            <label htmlFor="pixel-id" style={NOTE}>ID del pixel</label>
            <input id="pixel-id" inputMode="numeric" value={manual} onChange={e => { setManual(e.target.value); setErr('') }} placeholder="Ej: 123456789012345" style={INPUT} />
          </div>
        </details>

        {err && <Msg ok={false}>{err}</Msg>}
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => go(0)} style={btn(false)}>← Atrás</button>
          <button type="button" onClick={save} disabled={saving || !(manual.replace(/\D/g, '').length >= 8 || chosen)} style={btn(true, saving || !(manual.replace(/\D/g, '').length >= 8 || chosen))}>
            {saving ? 'Guardando…' : 'Activar este pixel en la web'}
          </button>
        </div>
      </>,
    },
    {
      title: 'Comprueba que la web le habla a Meta',
      body: <>
        <p>El pixel ya quedó activo en la web (puede tardar hasta 5 minutos en encenderse). Vamos a verlo funcionar:</p>
        <Ol items={[
          <>En el Administrador de eventos, abre tu pixel y entra a la pestaña <B>Probar eventos</B>.</>,
          <>Donde dice “Probar eventos del navegador”, escribe <B>https://rafatrujillo.xyz</B> y toca <B>Abrir sitio web</B>.</>,
          <>En la web que se abre, toca <B>Aceptar</B> en el aviso de cookies (abajo a la izquierda).</>,
          <>Vuelve al Administrador de eventos: en menos de un minuto debe aparecer <B>PageView</B> (vista de página). ✓</>,
          <>Opcional: suscríbete con un correo tuyo y verás <B>Lead</B>; al confirmar desde el correo verás <B>CompleteRegistration</B>.</>,
        ]} />
        <Tip>Si no aparece nada después de 5 minutos, recarga la web y vuelve a tocar Aceptar. Si ya habías rechazado las cookies, usa el enlace “Cookies” al final de la página para cambiar tu decisión.</Tip>
      </>,
      link: { href: 'https://business.facebook.com/events_manager2/', label: 'Abrir el Administrador de eventos' },
    },
    {
      title: 'Cómo usarlo en tu campaña de suscripciones',
      custom: true,
      body: <>
        <p>Cuando crees la campaña en el Administrador de anuncios:</p>
        <Ol items={[
          <>Objetivo: <B>Clientes potenciales</B>.</>,
          <>Ubicación de la conversión: <B>Sitio web</B>.</>,
          <>Pixel / conjunto de datos: <B>el que acabas de activar</B>.</>,
          <>Evento de conversión: <B>Registro completado</B>. Son suscriptores que confirmaron su correo: los de mejor calidad.</>,
          <>URL del anuncio: <B>https://rafatrujillo.xyz</B>. Ahí aparece el formulario de suscripción.</>,
        ]} />
        <Tip>Al principio, si la campaña consigue menos de unas 50 suscripciones por semana, Meta aprende más rápido con el evento <B>Cliente potencial</B>. Puedes empezar con ese y pasar a Registro completado cuando haya más volumen.</Tip>
        <p>Siguiente paso recomendado: activar la <B>medición desde el servidor</B> (5 minutos), para que Meta cuente también las suscripciones desde iPhone o navegadores con bloqueadores.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { reset(); onDone() }} style={btn(true)}>Terminar</button>
          <button type="button" onClick={() => go(2)} style={btn(false)}>← Atrás</button>
        </div>
      </>,
    },
  ]
  return <Wizard title="Pixel de Meta" steps={steps} i={i} go={go} onExit={onDone} />
}

// ════════════════════════ 3. API de Conversiones ════════════════════════
function CapiWizard({ status, onDone }: { status: Status; onDone: () => void }) {
  const STEPS = 3
  const { i, go, reset } = useStep('capi', STEPS)
  const [tok, setTok] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const has = status.fields.META_CAPI_TOKEN.set

  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await api<{ ok?: boolean; error?: string }>('connections', 'PUT', { values: { META_CAPI_TOKEN: tok.trim() } })
      if (!r.ok) { setMsg({ ok: false, text: friendly(r.error) }); return }
      setTok(''); go(2)
    } catch (e) { setMsg({ ok: false, text: friendly(e instanceof Error ? e.message : '') }) } finally { setBusy(false) }
  }
  const test = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await api<{ ok: boolean; received?: number; error?: MetaErr }>('connections/meta/capi-test', 'POST', { testCode: code.trim() })
      setMsg(r.ok
        ? { ok: true, text: `Meta recibió el evento de prueba (${r.received ?? 1}). Míralo en “Probar eventos”: debe aparecer “Lead” marcado como “Servidor”. Este evento de prueba no cuenta en tus campañas.` }
        : { ok: false, text: friendly(r.error) })
    } catch (e) { setMsg({ ok: false, text: friendly(e instanceof Error ? e.message : '') }) } finally { setBusy(false) }
  }

  const steps: Step[] = [
    {
      title: 'Genera la llave de la API de Conversiones',
      body: <>
        <p>Con esto, además del navegador, <B>el servidor de la web</B> le avisa a Meta cada suscripción. Así se cuentan también las de iPhone y navegadores con bloqueadores. Igual que el pixel, solo se envía si la persona aceptó las cookies.</p>
        <Ol items={[
          <>Abre el Administrador de eventos y entra a tu pixel.</>,
          <>Ve a la pestaña <B>Configuración</B>.</>,
          <>Busca la sección <B>API de Conversiones</B> → <B>Configurar manualmente</B> o <B>Generar token de acceso</B>.</>,
          <>Toca <B>Generar token</B> y <B>cópialo</B> (empieza por “EAA…”, es larguísimo).</>,
        ]} />
        {has && <Tip>Ya hay una llave guardada. Si solo quieres probar que funciona, salta al último paso.</Tip>}
      </>,
      link: { href: 'https://business.facebook.com/events_manager2/', label: 'Abrir el Administrador de eventos' },
      help: <p>Si Meta te ofrece configurar la API con un socio (Shopify, WordPress, etc.) o con la “Puerta de enlace”, ignóralo: elige la opción manual o “Generar token”.</p>,
    },
    {
      title: 'Pega la llave',
      custom: true,
      body: <>
        <label htmlFor="capi-token" style={NOTE}>Llave de la API de Conversiones</label>
        <textarea id="capi-token" rows={3} value={tok} onChange={e => { setTok(e.target.value); setMsg(null) }} placeholder="EAA…" autoComplete="off" spellCheck={false} style={{ ...INPUT, resize: 'vertical' }} />
        {msg && <Msg ok={msg.ok}>{msg.text}</Msg>}
        <p style={NOTE}>Se guarda cifrada en el servidor y no se vuelve a mostrar.</p>
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => go(0)} style={btn(false)}>← Atrás</button>
          <div className="flex gap-2">
            {has && <button type="button" onClick={() => go(2)} style={btn(false)}>Usar la ya guardada</button>}
            <button type="button" onClick={save} disabled={busy || tok.trim().length < 20} style={btn(true, busy || tok.trim().length < 20)}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </>,
    },
    {
      title: 'Prueba que funciona',
      custom: true,
      body: <>
        <Ol items={[
          <>En el Administrador de eventos, abre tu pixel → pestaña <B>Probar eventos</B>.</>,
          <>Busca el <B>código de prueba</B> (algo como <B>TEST12345</B>) y cópialo.</>,
          <>Pégalo aquí y toca <B>Enviar evento de prueba</B>.</>,
        ]} />
        <label htmlFor="test-code" style={NOTE}>Código de prueba</label>
        <input id="test-code" value={code} onChange={e => { setCode(e.target.value); setMsg(null) }} placeholder="TEST12345" autoComplete="off" style={INPUT} />
        {msg && <Msg ok={msg.ok}>{msg.text}</Msg>}
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => go(1)} style={btn(false)}>← Atrás</button>
          <div className="flex gap-2">
            <button type="button" onClick={test} disabled={busy || code.trim().length < 6} style={btn(!msg?.ok, busy || code.trim().length < 6)}>{busy ? 'Enviando…' : 'Enviar evento de prueba'}</button>
            {msg?.ok && <button type="button" onClick={() => { reset(); onDone() }} style={btn(true)}>Terminar</button>}
          </div>
        </div>
        <a href="https://business.facebook.com/events_manager2/" target="_blank" rel="noopener noreferrer" style={{ ...NOTE, textDecoration: 'underline' }}>Abrir el Administrador de eventos ↗</a>
      </>,
    },
  ]
  return <Wizard title="Medición desde el servidor (API de Conversiones)" steps={steps} i={i} go={go} onExit={onDone} />
}
