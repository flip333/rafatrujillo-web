import type { Env } from './env'

/* Conexión con Meta desde el panel: comprobar el token, listar cuentas
   publicitarias y pixeles para que Rafa elija con un clic (sin copiar IDs),
   enviar eventos de prueba y reenviar conversiones por la API de Conversiones. */

export interface MetaError { code: 'invalid_token' | 'permission' | 'not_found' | 'rate_limit' | 'network' | 'unknown'; message: string }

const graph = (env: Env) => `https://graph.facebook.com/${env.META_API_VERSION}`

function classify(e: { code?: number; error_subcode?: number; message?: string } | undefined, status: number): MetaError {
  const message = String(e?.message ?? `HTTP ${status}`).slice(0, 300)
  const c = e?.code
  if (c === 190 || c === 102 || status === 401) return { code: 'invalid_token', message }
  if (c === 10 || c === 200 || c === 294 || (c && c >= 200 && c < 300) || status === 403) return { code: 'permission', message }
  if (c === 100 || c === 803 || status === 404) return { code: 'not_found', message }
  if (c === 4 || c === 17 || c === 32 || c === 613 || c === 80004) return { code: 'rate_limit', message }
  return { code: 'unknown', message }
}

async function call<T>(env: Env, path: string, tok: string, init: { method?: string; body?: unknown } = {}): Promise<{ ok: true; data: T } | { ok: false; error: MetaError }> {
  try {
    const res = await fetch(`${graph(env)}/${path}`, {
      method: init.method ?? 'GET',
      headers: { Authorization: `Bearer ${tok}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    })
    const data = (await res.json().catch(() => ({}))) as T & { error?: { code?: number; message?: string } }
    if (!res.ok || data.error) return { ok: false, error: classify(data.error, res.status) }
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: { code: 'network', message: e instanceof Error ? e.message : 'network' } }
  }
}

const ACCOUNT_STATUS: Record<number, string> = {
  1: 'Activa', 2: 'Deshabilitada', 3: 'Con pagos pendientes', 7: 'En revisión de riesgo', 8: 'Pendiente de liquidación',
  9: 'En periodo de gracia', 100: 'Pendiente de cierre', 101: 'Cerrada',
}

/* Paso "pega el token": quién es y qué cuentas publicitarias puede leer. */
export async function metaAccounts(env: Env, tok: string) {
  const me = await call<{ id: string; name?: string }>(env, 'me?fields=id,name', tok)
  if (!me.ok) return { ok: false as const, error: me.error }
  const acc = await call<{ data: { account_id: string; name: string; currency: string; account_status: number }[] }>(
    env, 'me/adaccounts?fields=account_id,name,currency,account_status&limit=50', tok)
  if (!acc.ok) return { ok: false as const, error: acc.error }
  // ¿El token tiene ads_read? (los tokens de usuario del sistema lo informan en /me/permissions)
  const perms = await call<{ data: { permission: string; status: string }[] }>(env, 'me/permissions', tok)
  const granted = perms.ok ? perms.data.data.filter(p => p.status === 'granted').map(p => p.permission) : []
  return {
    ok: true as const,
    user: me.data.name ?? me.data.id,
    permissions: granted,
    accounts: acc.data.data.map(a => ({ id: a.account_id, name: a.name, currency: a.currency, status: ACCOUNT_STATUS[a.account_status] ?? String(a.account_status), active: a.account_status === 1 })),
  }
}

/* Pixeles (conjuntos de datos) de la cuenta publicitaria, con su última actividad. */
export async function metaPixels(env: Env, tok: string, accountId: string) {
  const r = await call<{ data: { id: string; name: string; last_fired_time?: string; is_unavailable?: boolean }[] }>(
    env, `act_${accountId}/adspixels?fields=id,name,last_fired_time,is_unavailable&limit=50`, tok)
  if (!r.ok) return { ok: false as const, error: r.error }
  return { ok: true as const, pixels: r.data.data.map(p => ({ id: p.id, name: p.name, lastFiredAt: p.last_fired_time ?? null })) }
}

/* Estado del pixel: última vez que recibió eventos (requiere el token de lectura). */
export async function metaPixelStatus(env: Env, tok: string, pixelId: string) {
  const r = await call<{ id: string; name: string; last_fired_time?: string }>(env, `${pixelId}?fields=id,name,last_fired_time`, tok)
  if (!r.ok) return { ok: false as const, error: r.error }
  return { ok: true as const, pixel: { id: r.data.id, name: r.data.name, lastFiredAt: r.data.last_fired_time ?? null } }
}

// ── API de Conversiones ──

export interface ConversionInput {
  event_name: 'Lead' | 'CompleteRegistration' | 'PageView'
  event_id: string
  event_source_url: string
  email?: string
  client_ip?: string
  user_agent?: string
  fbp?: string
  fbc?: string
  test_event_code?: string
}

async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s.trim().toLowerCase()))
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function sendConversion(env: Env, ev: ConversionInput) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return { ok: false as const, error: { code: 'not_found' as const, message: 'pixel_or_token_missing' } }
  const user_data: Record<string, unknown> = {}
  if (ev.email) user_data.em = [await sha256(ev.email)]
  if (ev.client_ip) user_data.client_ip_address = ev.client_ip
  if (ev.user_agent) user_data.client_user_agent = ev.user_agent
  if (ev.fbp) user_data.fbp = ev.fbp
  if (ev.fbc) user_data.fbc = ev.fbc
  const body: Record<string, unknown> = {
    data: [{
      event_name: ev.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: ev.event_id,
      event_source_url: ev.event_source_url,
      action_source: 'website',
      user_data,
      custom_data: { content_name: 'newsletter' },
    }],
  }
  if (ev.test_event_code) body.test_event_code = ev.test_event_code
  const r = await call<{ events_received?: number; fbtrace_id?: string }>(env, `${env.META_PIXEL_ID}/events`, env.META_CAPI_TOKEN, { method: 'POST', body })
  if (!r.ok) return { ok: false as const, error: r.error }
  return { ok: true as const, received: r.data.events_received ?? 0 }
}

/* Comprueba el token de la API de Conversiones con un evento de prueba
   (solo aparece en Administrador de eventos → Probar eventos; no cuenta en campañas). */
export async function metaCapiTest(env: Env, testCode: string) {
  return sendConversion(env, {
    event_name: 'Lead',
    event_id: `test-${crypto.randomUUID()}`,
    event_source_url: 'https://rafatrujillo.xyz/',
    email: 'prueba@rafatrujillo.xyz',
    user_agent: 'rafatrujillo-admin-test',
    test_event_code: testCode,
  })
}
