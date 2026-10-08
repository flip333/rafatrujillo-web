/* Catálogo único de eventos de producto. Lo usan el cliente (lib/analytics.ts)
   y la lista blanca del servidor (app/api/track). Añadir un evento = añadirlo aquí. */
export const TRACKED_EVENTS = [
  'page_view',           // carga de la página (complementa Vercel Analytics)
  'scroll_depth',        // { depth: 25 | 50 | 75 | 100 }
  'section_view',        // { section: 'lanzamiento' | 'sobre' | ... }
  'subscribe_view',      // se mostró el pop-up / formulario
  'subscribe_submit',    // { source: 'popup' | 'inline' }
  'subscribe_success',   // { source }
  'subscribe_error',     // { source, error }
  'popup_dismiss',
  'video_play',          // { video: id, title }
  'lyrics_open',         // { song }
  'credits_open',
  'outbound_click',      // { platform: 'spotify' | 'apple' | 'youtube' | 'instagram', place }
  'lyrics_share',        // { song } — copió el enlace directo a una letra
  'player_autostart',    // { song } — el reproductor arrancó con el primer toque
  'player_play',         // { song } — reproducir desde un botón
  'player_shuffle',      // { song }
  'player_close',
  'contact_submit',      // { subject }
  'press_bio_copy',
  'press_photo_download',// { photo }
  'lang_switch',         // { to }
  'cursor_toggle',       // { mode }
] as const

export type TrackedEvent = (typeof TRACKED_EVENTS)[number]
