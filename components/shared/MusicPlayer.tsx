'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PLAYLIST } from '@/lib/artist-data'
import { track } from '@/lib/analytics'

/* ────────────────────────────────────────────────────────────────
   Reproductor flotante con la Spotify iFrame API.
   - Al abrir la página elige una canción de Rafa al azar.
   - Intenta reproducir solo; los navegadores bloquean el audio sin
     interacción, así que si falla arranca con el primer toque/clic.
   - Si la persona pausa o cierra, se respeta en las siguientes visitas.
   - Otros componentes pueden pedir reproducir/pausar con eventos:
       window.dispatchEvent(new CustomEvent('rafa:play', { detail: { uri, title } }))
       window.dispatchEvent(new Event('rafa:pause'))
   ──────────────────────────────────────────────────────────────── */

type Controller = {
  loadUri: (uri: string) => void
  play: () => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  destroy: () => void
  addListener: (ev: string, cb: (e: { data: { isPaused?: boolean; isBuffering?: boolean; position?: number; duration?: number } }) => void) => void
}
type IFrameAPI = {
  createController: (el: HTMLElement, opts: { uri: string; width?: string | number; height?: number }, cb: (c: Controller) => void) => void
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void
    __spotifyApi?: IFrameAPI
  }
}

const OFF_KEY = 'rafa-player-off'
const API_SRC = 'https://open.spotify.com/embed/iframe-api/v1'

function loadApi(): Promise<IFrameAPI> {
  if (window.__spotifyApi) return Promise.resolve(window.__spotifyApi)
  return new Promise(resolve => {
    window.onSpotifyIframeApiReady = api => { window.__spotifyApi = api; resolve(api) }
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const s = document.createElement('script')
      s.src = API_SRC
      s.async = true
      document.body.appendChild(s)
    }
  })
}

const COPY = {
  es: { now: 'Sonando', tap: 'Toca en cualquier parte para escuchar', shuffle: 'Otra canción', close: 'Cerrar reproductor', open: 'Abrir reproductor de música', paused: 'En pausa' },
  en: { now: 'Now playing', tap: 'Tap anywhere to listen', shuffle: 'Another song', close: 'Close player', open: 'Open music player', paused: 'Paused' },
}

export function MusicPlayer() {
  const pathname = usePathname()
  const t = pathname?.startsWith('/en') ? COPY.en : COPY.es
  const hidden = pathname?.startsWith('/admin') || pathname?.startsWith('/suscripcion')

  const host = useRef<HTMLDivElement>(null)
  const ctrl = useRef<Controller | null>(null)
  const startedOnce = useRef(false)
  const [current, setCurrent]   = useState<{ uri: string; title: string } | null>(null)
  const [isPaused, setIsPaused] = useState(true)
  const [waiting, setWaiting]   = useState(false)   // listo, esperando el primer gesto
  const [open, setOpen]         = useState(true)
  const [autoCompact, setAutoCompact] = useState(true) // compacto en el hero y siempre en móvil
  const [expanded, setExpanded] = useState(false)      // la persona lo abrió a mano
  const compact = autoCompact && !expanded

  useEffect(() => {
    const onScroll = () =>
      setAutoCompact(window.innerWidth < 640 || window.scrollY < window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pick = useCallback((exclude?: string) => {
    const pool = PLAYLIST.filter(p => p.uri !== exclude)
    return pool[Math.floor(Math.random() * pool.length)]
  }, [])

  // Crear el reproductor cuando la página ya cargó (no compite con el LCP)
  useEffect(() => {
    if (hidden) return
    let off = false
    try { off = localStorage.getItem(OFF_KEY) === '1' } catch {}
    if (off) { setOpen(false) }

    const song = pick()
    setCurrent({ uri: song.uri, title: song.title })

    let cancelled = false
    const start = () => {
      loadApi().then(api => {
        if (cancelled || !host.current) return
        api.createController(host.current, { uri: song.uri, width: '100%', height: 80 }, c => {
          ctrl.current = c
          c.addListener('playback_update', e => {
            const paused = !!e.data.isPaused
            setIsPaused(paused)
            if (!paused) { setWaiting(false); startedOnce.current = true }
          })
          c.addListener('ready', () => {
            if (off) return
            // Intento de autoplay (el navegador puede bloquearlo hasta el primer gesto)
            c.play()
            setWaiting(true)
          })
        })
      })
    }

    // Primer gesto de la persona (toque, clic o tecla): arranca la música.
    // Se registra desde el inicio para no perder un toque hecho antes de que cargue Spotify.
    const onGesture = (e: Event) => {
      if (off || startedOnce.current) return cleanupGesture()
      // No interferir si el gesto fue sobre el propio reproductor o un video
      if ((e.target as Element)?.closest?.('.music-player, .lite-yt, iframe')) return
      if (ctrl.current) {
        ctrl.current.play()
        track('player_autostart', { song: song.title })
        cleanupGesture()
      }
    }
    const cleanupGesture = () => {
      window.removeEventListener('pointerdown', onGesture, true)
      window.removeEventListener('keydown', onGesture, true)
    }
    window.addEventListener('pointerdown', onGesture, true)
    window.addEventListener('keydown', onGesture, true)

    const idle = (cb: () => void) => {
      const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
      if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 3000 })
      else setTimeout(cb, 1500)
    }
    if (document.readyState === 'complete') idle(start)
    else window.addEventListener('load', () => idle(start), { once: true })

    return () => { cancelled = true; cleanupGesture(); ctrl.current?.destroy(); ctrl.current = null }
  }, [hidden, pick])

  // Peticiones externas: reproducir una canción concreta o pausar
  useEffect(() => {
    const onPlay = (e: Event) => {
      const { uri, title } = (e as CustomEvent<{ uri: string; title: string }>).detail
      setOpen(true)
      try { localStorage.removeItem(OFF_KEY) } catch {}
      setCurrent({ uri, title })
      startedOnce.current = true
      ctrl.current?.loadUri(uri)
      ctrl.current?.play()
      track('player_play', { song: title })
    }
    const onPause = () => ctrl.current?.pause()
    window.addEventListener('rafa:play', onPlay)
    window.addEventListener('rafa:pause', onPause)
    return () => {
      window.removeEventListener('rafa:play', onPlay)
      window.removeEventListener('rafa:pause', onPause)
    }
  }, [])

  const shuffle = () => {
    const song = pick(current?.uri)
    setCurrent({ uri: song.uri, title: song.title })
    startedOnce.current = true
    ctrl.current?.loadUri(song.uri)
    ctrl.current?.play()
    track('player_shuffle', { song: song.title })
  }

  const close = () => {
    ctrl.current?.pause()
    setOpen(false)
    try { localStorage.setItem(OFF_KEY, '1') } catch {}
    track('player_close')
  }

  const reopen = () => {
    setOpen(true)
    try { localStorage.removeItem(OFF_KEY) } catch {}
    startedOnce.current = true
    ctrl.current?.play()
  }

  if (hidden) return null

  return (
    <>
      {/* Panel del reproductor (se mantiene montado para no perder la reproducción) */}
      <aside
        aria-label="Reproductor de música"
        className={`music-player ${open ? 'is-open' : ''} ${compact ? 'is-compact' : ''}`}
        inert={!open}
      >
        <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1.5">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={!compact}
            className="truncate text-left flex-1 min-w-0 py-2"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rafa-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className={`eq ${isPaused ? '' : 'is-playing'}`} aria-hidden="true"><i /><i /><i /></span>
            {waiting && isPaused ? t.tap : <>{isPaused ? t.paused : t.now}{current && <span style={{ color: 'var(--rafa-text)', textTransform: 'none', letterSpacing: '0.02em' }}> · {current.title}</span>}</>}
          </button>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={shuffle}
              aria-label={t.shuffle}
              title={t.shuffle}
              className="player-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            </button>
            <button type="button" onClick={close} aria-label={t.close} title={t.close} className="player-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="player-body px-2 pb-2">
          <div ref={host} style={{ minHeight: 80, borderRadius: 12, overflow: 'hidden', background: 'var(--rafa-surface-2)' }} />
        </div>
      </aside>

      {/* Botón para volver a abrir */}
      {!open && (
        <button type="button" onClick={reopen} aria-label={t.open} className="player-fab">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </button>
      )}
    </>
  )
}
