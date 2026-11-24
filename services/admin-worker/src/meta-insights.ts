import type { Env } from './env'
import { adsConfig, totalsOf, type CampaignRow, type PlatformSummary } from './ads'

/* Meta Ads (solo lectura): insights por campaña con las mediciones que
   importan para un artista — alcance, frecuencia, clics al enlace, visitas
   a la web, suscripciones del pixel, reproducciones de video y costo por
   resultado según el objetivo — más una lectura automática en lenguaje simple. */

export interface MetaCampaign extends CampaignRow {
  id: string
  objective: string
  objectiveLabel: string
  reach: number
  frequency: number
  cpm: number
  linkClicks: number
  linkCtr: number
  landingViews: number
  leads: number
  registrations: number
  videoViews: number
  thruplays: number
  engagement: number
  results: number
  resultLabel: string
  costPerResult: number | null
  tips: string[]
}

export interface MetaDay { day: string; spend: number; reach: number; linkClicks: number; registrations: number; leads: number }

export type MetaSummary = PlatformSummary & { metaCampaigns?: MetaCampaign[]; daily?: MetaDay[] }

const OBJECTIVES: Record<string, string> = {
  OUTCOME_AWARENESS: 'Reconocimiento', OUTCOME_TRAFFIC: 'Tráfico', OUTCOME_ENGAGEMENT: 'Interacción',
  OUTCOME_LEADS: 'Clientes potenciales', OUTCOME_SALES: 'Ventas / conversiones', OUTCOME_APP_PROMOTION: 'App',
  LINK_CLICKS: 'Tráfico', CONVERSIONS: 'Conversiones', VIDEO_VIEWS: 'Reproducciones de video', REACH: 'Alcance',
  POST_ENGAGEMENT: 'Interacción', LEAD_GENERATION: 'Clientes potenciales', BRAND_AWARENESS: 'Reconocimiento',
}
const STATUS: Record<string, string> = {
  ACTIVE: 'Activa', PAUSED: 'Pausada', CAMPAIGN_PAUSED: 'Pausada', ADSET_PAUSED: 'Pausada', ARCHIVED: 'Archivada',
  DELETED: 'Eliminada', IN_PROCESS: 'Procesando', WITH_ISSUES: 'Con problemas', PENDING_REVIEW: 'En revisión', DISAPPROVED: 'Rechazada',
}

type Action = { action_type: string; value: string }
const pick = (list: Action[] | undefined, ...types: string[]) => {
  for (const t of types) { const a = list?.find(x => x.action_type === t); if (a) return Number(a.value || 0) }
  return 0
}

type Measures = { reach: number; linkClicks: number; landingViews: number; leads: number; registrations: number; thruplays: number; videoViews: number; engagement: number }

function resultOf(objective: string, m: Measures) {
  if (/LEADS|SALES|CONVERSIONS|LEAD_GENERATION/.test(objective)) {
    return m.registrations ? { label: 'Suscripciones confirmadas', value: m.registrations } : { label: 'Suscripciones (formulario)', value: m.leads }
  }
  if (/TRAFFIC|LINK_CLICKS/.test(objective)) return m.landingViews ? { label: 'Visitas a la web', value: m.landingViews } : { label: 'Clics al enlace', value: m.linkClicks }
  if (/AWARENESS|REACH/.test(objective)) return { label: 'Personas alcanzadas', value: m.reach }
  if (/VIDEO/.test(objective) || m.thruplays) return { label: 'Reproducciones completas (ThruPlay)', value: m.thruplays }
  return { label: 'Interacciones', value: m.engagement }
}

function tipsFor(c: Omit<MetaCampaign, 'tips'>, cur: string): string[] {
  const tips: string[] = []
  const fmt = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: 0 }).format(v)
  if (c.frequency >= 3.5) tips.push(`Cada persona vio el anuncio ${c.frequency.toFixed(1)} veces en promedio: el público se está cansando. Cambia el video o la imagen, o amplía el público.`)
  if (c.impressions >= 2000 && c.linkClicks > 0 && c.linkCtr < 0.6) tips.push(`Solo ${c.linkCtr.toFixed(2).replace('.', ',')} de cada 100 personas que lo ven hacen clic. Prueba otro gancho en los primeros 3 segundos o un texto más directo.`)
  if (c.linkClicks >= 30 && c.landingViews / c.linkClicks < 0.5) tips.push(`De ${c.linkClicks} clics, solo ${c.landingViews} llegaron a ver la web. Puede haber muchos clics accidentales: revisa las ubicaciones (Audience Network) y que el enlace sea el correcto.`)
  if (c.spend > 0 && c.results === 0 && c.impressions >= 3000) tips.push(`Lleva ${fmt(c.spend)} invertidos y todavía 0 en “${c.resultLabel.toLowerCase()}”. Si sigue así 2 o 3 días más, pausa y prueba otro anuncio.`)
  if (c.registrations > 0 && c.costPerResult != null && c.resultLabel.startsWith('Suscrip')) tips.push(`Cada suscriptor nuevo te está costando ${fmt(c.costPerResult)}.`)
  return tips.slice(0, 3)
}

export async function metaSummary(env: Env, days: 7 | 30): Promise<MetaSummary> {
  const missing = adsConfig(env).meta
  const base = { platform: 'meta' as const, days, fetchedAt: new Date().toISOString() }
  if (missing.length) return { ...base, configured: false, missing }
  const act = `act_${env.META_AD_ACCOUNT_ID!.replace(/^act_/, '')}`
  const graph = `https://graph.facebook.com/${env.META_API_VERSION}`
  const headers = { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` }
  const preset = days === 7 ? 'last_7d' : 'last_30d'
  const get = async <T,>(path: string): Promise<T> => {
    const res = await fetch(`${graph}/${path}`, { headers })
    const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
    if (!res.ok || data.error) throw new Error(`meta: ${data.error?.message ?? res.status}`)
    return data
  }
  try {
    const fields = 'campaign_id,campaign_name,objective,spend,impressions,reach,frequency,cpm,clicks,inline_link_clicks,inline_link_click_ctr,actions,video_thruplay_watched_actions'
    const [acc, ins, camps, daily] = await Promise.all([
      get<{ name?: string; currency?: string }>(`${act}?fields=name,currency`),
      get<{ data?: Record<string, unknown>[] }>(`${act}/insights?${new URLSearchParams({ level: 'campaign', date_preset: preset, fields, limit: '100' })}`),
      get<{ data?: { id: string; effective_status: string }[] }>(`${act}/campaigns?fields=id,effective_status&limit=200`),
      get<{ data?: Record<string, unknown>[] }>(`${act}/insights?${new URLSearchParams({ level: 'account', date_preset: preset, time_increment: '1', fields: 'spend,reach,inline_link_clicks,actions', limit: '40' })}`),
    ])
    const cur = acc.currency ?? ''
    const statusById = new Map((camps.data ?? []).map(c => [c.id, c.effective_status]))

    const metaCampaigns: MetaCampaign[] = (ins.data ?? []).map(r => {
      const actions = r.actions as Action[] | undefined
      const impressions = Number(r.impressions ?? 0), clicks = Number(r.clicks ?? 0), spend = Number(r.spend ?? 0)
      const m: Measures = {
        reach: Number(r.reach ?? 0),
        linkClicks: Number(r.inline_link_clicks ?? 0),
        landingViews: pick(actions, 'landing_page_view', 'omni_landing_page_view'),
        leads: pick(actions, 'offsite_conversion.fb_pixel_lead', 'lead'),
        registrations: pick(actions, 'offsite_conversion.fb_pixel_complete_registration', 'complete_registration', 'omni_complete_registration'),
        videoViews: pick(actions, 'video_view'),
        thruplays: pick(r.video_thruplay_watched_actions as Action[] | undefined, 'video_view'),
        engagement: pick(actions, 'post_engagement', 'page_engagement'),
      }
      const objective = String(r.objective ?? '')
      const result = resultOf(objective, m)
      const st = statusById.get(String(r.campaign_id)) ?? ''
      const row: Omit<MetaCampaign, 'tips'> = {
        id: String(r.campaign_id), name: String(r.campaign_name ?? '—'),
        status: STATUS[st] ?? (st || '—'),
        objective, objectiveLabel: OBJECTIVES[objective] ?? objective,
        spend, impressions, clicks, ...m,
        frequency: Number(r.frequency ?? 0), cpm: Number(r.cpm ?? 0),
        linkCtr: Number(r.inline_link_click_ctr ?? 0),
        ctr: impressions ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        conversions: m.registrations || m.leads,
        results: result.value, resultLabel: result.label,
        costPerResult: result.value ? Math.round((spend / result.value) * 100) / 100 : null,
      }
      return { ...row, tips: tipsFor(row, cur) }
    }).sort((a, b) => b.spend - a.spend)

    const dailyRows: MetaDay[] = (daily.data ?? []).map(d => ({
      day: String(d.date_start),
      spend: Number(d.spend ?? 0),
      reach: Number(d.reach ?? 0),
      linkClicks: Number(d.inline_link_clicks ?? 0),
      registrations: pick(d.actions as Action[] | undefined, 'offsite_conversion.fb_pixel_complete_registration', 'complete_registration'),
      leads: pick(d.actions as Action[] | undefined, 'offsite_conversion.fb_pixel_lead', 'lead'),
    }))

    return {
      ...base, configured: true, missing: [],
      account: { name: acc.name ?? 'Meta Ads', currency: cur },
      totals: totalsOf(metaCampaigns), campaigns: metaCampaigns, metaCampaigns, daily: dailyRows,
    }
  } catch (e) {
    return { ...base, configured: true, missing: [], error: e instanceof Error ? e.message.slice(0, 300) : 'error' }
  }
}
