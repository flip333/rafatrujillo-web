import type { Env } from './env'

/* Pauta vía APIs oficiales: Google Ads API (GAQL) y Meta Marketing API.
   Sin credenciales devuelve { configured: false, missing: [...] } para que
   el panel muestre exactamente qué falta. */

export interface CampaignRow {
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
}

export interface PlatformSummary {
  platform: 'google' | 'meta'
  configured: boolean
  missing: string[]
  error?: string
  account?: { name: string; currency: string }
  days: 7 | 30
  totals?: { spend: number; impressions: number; clicks: number; conversions: number; ctr: number; cpc: number; cpa: number | null }
  campaigns?: CampaignRow[]
  fetchedAt: string
}

const GOOGLE_KEYS = ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_REFRESH_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID'] as const
const META_KEYS = ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'] as const

export const adsConfig = (env: Env) => ({
  google: GOOGLE_KEYS.filter(k => !env[k]),
  meta: META_KEYS.filter(k => !env[k]),
})

function totalsOf(rows: CampaignRow[]) {
  const t = rows.reduce((a, r) => ({ spend: a.spend + r.spend, impressions: a.impressions + r.impressions, clicks: a.clicks + r.clicks, conversions: a.conversions + r.conversions }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 })
  return {
    ...t,
    spend: Math.round(t.spend * 100) / 100,
    ctr: t.impressions ? Math.round((t.clicks / t.impressions) * 10000) / 100 : 0,
    cpc: t.clicks ? Math.round((t.spend / t.clicks) * 100) / 100 : 0,
    cpa: t.conversions ? Math.round((t.spend / t.conversions) * 100) / 100 : null,
  }
}

// ── Google Ads ──
async function googleToken(env: Env): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })
  const data = (await res.json()) as { access_token?: string; error?: string }
  if (!data.access_token) throw new Error(`oauth: ${data.error ?? res.status}`)
  return data.access_token
}

async function googleSearch(env: Env, token: string, query: string) {
  const cid = env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, '')
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers['login-customer-id'] = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '')
  const res = await fetch(`https://googleads.googleapis.com/${env.GOOGLE_ADS_API_VERSION}/customers/${cid}/googleAds:search`, {
    method: 'POST', headers, body: JSON.stringify({ query }),
  })
  const data = (await res.json()) as { results?: Record<string, any>[]; error?: { message?: string } }
  if (!res.ok) throw new Error(`google_ads: ${data.error?.message ?? res.status}`)
  return data.results ?? []
}

export async function googleSummary(env: Env, days: 7 | 30): Promise<PlatformSummary> {
  const missing = adsConfig(env).google
  const base = { platform: 'google' as const, days, fetchedAt: new Date().toISOString() }
  if (missing.length) return { ...base, configured: false, missing }
  try {
    const token = await googleToken(env)
    const [acc] = await googleSearch(env, token, 'SELECT customer.descriptive_name, customer.currency_code FROM customer LIMIT 1')
    const rows = await googleSearch(env, token, `
      SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
      FROM campaign
      WHERE segments.date DURING ${days === 7 ? 'LAST_7_DAYS' : 'LAST_30_DAYS'} AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC LIMIT 50`)
    const campaigns: CampaignRow[] = rows.map(r => {
      const impressions = Number(r.metrics?.impressions ?? 0), clicks = Number(r.metrics?.clicks ?? 0)
      return {
        name: String(r.campaign?.name ?? '—'),
        status: String(r.campaign?.status ?? ''),
        spend: Number(r.metrics?.costMicros ?? 0) / 1_000_000,
        impressions, clicks,
        conversions: Number(r.metrics?.conversions ?? 0),
        ctr: impressions ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      }
    })
    return {
      ...base, configured: true, missing: [],
      account: { name: String(acc?.customer?.descriptiveName ?? 'Google Ads'), currency: String(acc?.customer?.currencyCode ?? '') },
      totals: totalsOf(campaigns), campaigns,
    }
  } catch (e) {
    return { ...base, configured: true, missing: [], error: e instanceof Error ? e.message.slice(0, 300) : 'error' }
  }
}

// ── Meta Ads ──
export async function metaSummary(env: Env, days: 7 | 30): Promise<PlatformSummary> {
  const missing = adsConfig(env).meta
  const base = { platform: 'meta' as const, days, fetchedAt: new Date().toISOString() }
  if (missing.length) return { ...base, configured: false, missing }
  const act = `act_${env.META_AD_ACCOUNT_ID!.replace(/^act_/, '')}`
  const graph = `https://graph.facebook.com/${env.META_API_VERSION}`
  const headers = { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` }
  try {
    const accRes = await fetch(`${graph}/${act}?fields=name,currency`, { headers })
    const acc = (await accRes.json()) as { name?: string; currency?: string; error?: { message?: string } }
    if (!accRes.ok) throw new Error(`meta: ${acc.error?.message ?? accRes.status}`)

    const params = new URLSearchParams({
      level: 'campaign',
      date_preset: days === 7 ? 'last_7d' : 'last_30d',
      fields: 'campaign_name,spend,impressions,clicks,actions',
      limit: '50',
    })
    const res = await fetch(`${graph}/${act}/insights?${params}`, { headers })
    const data = (await res.json()) as { data?: Record<string, any>[]; error?: { message?: string } }
    if (!res.ok) throw new Error(`meta: ${data.error?.message ?? res.status}`)

    const isConversion = (t: string) => /lead|complete_registration|purchase|subscribe|contact/.test(t)
    const campaigns: CampaignRow[] = (data.data ?? []).map(r => {
      const impressions = Number(r.impressions ?? 0), clicks = Number(r.clicks ?? 0)
      const conversions = ((r.actions ?? []) as { action_type: string; value: string }[])
        .filter(a => isConversion(a.action_type)).reduce((s, a) => s + Number(a.value || 0), 0)
      return {
        name: String(r.campaign_name ?? '—'), status: 'ACTIVE',
        spend: Number(r.spend ?? 0), impressions, clicks, conversions,
        ctr: impressions ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      }
    }).sort((a, b) => b.spend - a.spend)

    return {
      ...base, configured: true, missing: [],
      account: { name: acc.name ?? 'Meta Ads', currency: acc.currency ?? '' },
      totals: totalsOf(campaigns), campaigns,
    }
  } catch (e) {
    return { ...base, configured: true, missing: [], error: e instanceof Error ? e.message.slice(0, 300) : 'error' }
  }
}
