import type { Env } from './env'
import { now } from './env'

/* Ajustes de conexiones que Rafa configura desde el panel (/admin → Conexiones),
   sin terminal ni wrangler.
   - Los valores secretos (tokens) se guardan cifrados con AES-GCM; la llave
     (CONFIG_KEY) es un secreto del Worker y nunca sale de Cloudflare.
   - Los secretos se pueden escribir y borrar, pero nunca se devuelven al panel.
   - Un secreto definido con `wrangler secret put` tiene prioridad sobre el panel. */

export interface FieldDef {
  secret: boolean
  validate: (v: string) => string | null // devuelve el valor normalizado o null si es inválido
}

const digits = (min: number, max: number) => (v: string) => {
  const s = v.replace(/^act_/, '').replace(/[\s-]/g, '')
  return new RegExp(`^\\d{${min},${max}}$`).test(s) ? s : null
}
const token = (v: string) => {
  const s = v.trim()
  return /^[A-Za-z0-9_\-.|]{20,1024}$/.test(s) ? s : null
}

export const FIELDS = {
  META_ACCESS_TOKEN: { secret: true, validate: token },
  META_AD_ACCOUNT_ID: { secret: false, validate: digits(5, 25) },
  META_PIXEL_ID: { secret: false, validate: digits(8, 25) },
  META_CAPI_TOKEN: { secret: true, validate: token },
} satisfies Record<string, FieldDef>

export type FieldKey = keyof typeof FIELDS
export const isFieldKey = (k: string): k is FieldKey => k in FIELDS

// ── Cifrado ──
let keyCache: { raw: string; key: CryptoKey } | null = null
async function aesKey(env: Env): Promise<CryptoKey> {
  if (!env.CONFIG_KEY || env.CONFIG_KEY.length < 32) throw new Error('config_key_missing')
  if (keyCache?.raw === env.CONFIG_KEY) return keyCache.key
  const material = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.CONFIG_KEY))
  const key = await crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt'])
  keyCache = { raw: env.CONFIG_KEY, key }
  return key
}
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u))
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))

async function encrypt(env: Env, plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), new TextEncoder().encode(plain))
  return `v1.${b64(iv)}.${b64(new Uint8Array(ct))}`
}
async function decrypt(env: Env, stored: string): Promise<string> {
  const [, iv, ct] = stored.split('.')
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await aesKey(env), unb64(ct))
  return new TextDecoder().decode(pt)
}

// ── Lectura / escritura ──
interface Row { key: string; value: string; secret: number; updated_at: string }

async function rows(env: Env): Promise<Row[]> {
  const { results } = await env.DB.prepare('SELECT key, value, secret, updated_at FROM settings').all<Row>()
  return results
}

/* Valores efectivos de las conexiones (secretos de wrangler > panel). */
export async function settingsValues(env: Env): Promise<Partial<Record<FieldKey, string>>> {
  const out: Partial<Record<FieldKey, string>> = {}
  for (const r of await rows(env)) {
    if (!isFieldKey(r.key)) continue
    try { out[r.key] = r.secret ? await decrypt(env, r.value) : r.value } catch { /* llave cambió: se ignora */ }
  }
  for (const k of Object.keys(FIELDS) as FieldKey[]) {
    const fromEnv = (env as unknown as Record<string, string | undefined>)[k]
    if (fromEnv) out[k] = fromEnv
  }
  return out
}

/* Env con las conexiones del panel aplicadas (lo usan ads.ts y tracking.ts). */
export async function withSettings(env: Env): Promise<Env> {
  return { ...env, ...(await settingsValues(env)) }
}

/* Estado para el panel: qué está configurado, sin revelar secretos. */
export async function settingsStatus(env: Env) {
  const stored = new Map((await rows(env)).map(r => [r.key, r]))
  const status: Record<string, { set: boolean; source: 'panel' | 'servidor' | null; value?: string; updatedAt?: string }> = {}
  for (const [k, def] of Object.entries(FIELDS) as [FieldKey, FieldDef][]) {
    const fromEnv = (env as unknown as Record<string, string | undefined>)[k]
    const r = stored.get(k)
    status[k] = {
      set: Boolean(fromEnv || r),
      source: fromEnv ? 'servidor' : r ? 'panel' : null,
      ...(!def.secret && (fromEnv || r) ? { value: fromEnv || r!.value } : {}),
      ...(r ? { updatedAt: r.updated_at } : {}),
    }
  }
  return { canStoreSecrets: Boolean(env.CONFIG_KEY && env.CONFIG_KEY.length >= 32), fields: status }
}

/* Guarda o borra (valor vacío) un conjunto de campos. Valida todo antes de escribir. */
export async function saveSettings(env: Env, input: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  const writes: { key: FieldKey; value: string | null }[] = []
  for (const [k, raw] of Object.entries(input)) {
    if (!isFieldKey(k)) return { ok: false, error: 'unknown_field', field: k }
    if (raw === null || raw === '') { writes.push({ key: k, value: null }); continue }
    if (typeof raw !== 'string') return { ok: false, error: 'invalid_value', field: k }
    const v = FIELDS[k].validate(raw.trim())
    if (!v) return { ok: false, error: 'invalid_value', field: k }
    writes.push({ key: k, value: v })
  }
  if (!writes.length) return { ok: false, error: 'empty' }
  if (writes.some(w => w.value && FIELDS[w.key].secret) && !(env.CONFIG_KEY && env.CONFIG_KEY.length >= 32)) return { ok: false, error: 'config_key_missing' }

  const stmts = []
  for (const w of writes) {
    if (w.value === null) { stmts.push(env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(w.key)); continue }
    const secret = FIELDS[w.key].secret
    const value = secret ? await encrypt(env, w.value) : w.value
    stmts.push(env.DB.prepare('INSERT INTO settings (key, value, secret, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, secret = excluded.secret, updated_at = excluded.updated_at')
      .bind(w.key, value, secret ? 1 : 0, now()))
  }
  await env.DB.batch(stmts)
  // La pauta cacheada pudo venir de otra cuenta: se descarta
  await env.DB.prepare('DELETE FROM ads_cache').run()
  return { ok: true }
}
