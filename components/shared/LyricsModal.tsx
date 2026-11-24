'use client'

import { useEffect, useRef, useState } from 'react'
import { t, type Locale } from '@/lib/i18n'
import { track } from '@/lib/analytics'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { SongWave } from '@/components/shared/SongWave'

export interface LyricsModalData {
  title:     string
  meta?:     string          // p. ej. "Álbum · 2025" o "EP · 2024"
  body:      string | null   // letra o créditos
  variant?:  'lyrics' | 'credits'
  instrumental?: boolean
  shareUrl?: string        // enlace directo a la letra
  story?:    string | null   // historia detrás de la canción
  spotify?:  { url: string; embed: string }
}

type Tab = 'story' | 'lyrics' | 'listen'

interface Props {
  data: LyricsModalData | null
  onClose: () => void
  locale?: Locale
}

const SERIF_BODY: React.CSSProperties = {
  fontFamily: 'var(--font-playfair)',
  fontSize: '1.02rem',
  lineHeight: 1.85,
  color: 'var(--rafa-text)',
  whiteSpace: 'pre-line',
}

export function LyricsModal({ data, onClose, locale = 'es' }: Props) {
  const open = data !== null
  const c = t(locale).lyrics
  const closeRef = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panel, open)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<Tab>('lyrics')

  const isSong = data?.variant !== 'credits'
  const tabs: Tab[] = isSong
    ? [...(data?.story ? ['story' as const] : []), 'lyrics', ...(data?.spotify ? ['listen' as const] : [])]
    : []
  const tabLabel: Record<Tab, string> = { story: c.tabStory, lyrics: c.tabLyrics, listen: c.tabListen }

  // Cada canción abre en "Letra" (los enlaces del sitio dicen "Leer la letra")
  useEffect(() => { setTab('lyrics') }, [data?.title])

  const choose = (next: Tab) => {
    setTab(next)
    bodyRef.current?.scrollTo({ top: 0 })
    if (data) track('song_tab', { song: data.title, tab: next })
  }

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = tabs.indexOf(tab)
    let n = -1
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = tabs.length - 1
    if (n < 0) return
    e.preventDefault()
    choose(tabs[n])
    document.getElementById(`song-tab-${tabs[n]}`)?.focus()
  }

  const copyLink = async () => {
    if (!data?.shareUrl) return
    try {
      await navigator.clipboard.writeText(data.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      track('lyrics_share', { song: data.title })
    } catch {}
  }

  // Cerrar con Escape + bloquear scroll del fondo
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prevFocus?.focus?.()
    }
  }, [open, onClose])

  if (!open || !data) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 99990,
        }}
        aria-hidden="true"
      />

      {/* Wrapper centrado */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99991,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          pointerEvents: 'none',
        }}
      >
        <div
          ref={panel}
          className="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-label={isSong ? `${c.lyricsOf} ${data.title}` : data.title}
          style={{
            pointerEvents: 'all',
            width: '100%',
            maxWidth: 580,
            maxHeight: '88dvh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--rafa-surface)',
            border: '1px solid var(--rafa-border)',
            position: 'relative',
          }}
        >
          {/* Cabecera fija */}
          <div
            style={{
              padding: `clamp(1.4rem, 5vw, 2rem) clamp(1.4rem, 5vw, 2.2rem) ${isSong ? '0' : '1rem'}`,
              borderBottom: '1px solid var(--rafa-border)',
              flexShrink: 0,
            }}
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label={c.close}
              className="popup-close"
              style={{
                position: 'absolute',
                top: '0.9rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--rafa-muted)',
                fontSize: '1rem',
                lineHeight: 1,
                cursor: 'pointer',
                padding: '0.6rem 0.8rem',
                transition: 'color 150ms ease',
              }}
            >
              ✕
            </button>

            {data.meta && (
              <p
                style={{
                  fontSize: '0.66rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--rafa-accent)',
                  fontFamily: 'var(--font-inter)',
                  marginBottom: '0.5rem',
                }}
              >
                {data.meta}
              </p>
            )}
            <div className="flex items-end gap-3" style={{ paddingRight: '1.5rem' }}>
              <h2
                className="leading-none"
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
                  color: 'var(--rafa-text)',
                  letterSpacing: '0.01em',
                  textTransform: 'uppercase',
                }}
              >
                {data.title}
              </h2>
              {isSong && <span style={{ paddingBottom: '0.35rem' }}><SongWave title={data.title} bars={9} size="lg" playing /></span>}
            </div>
            {data.shareUrl && (
              <button
                type="button"
                onClick={copyLink}
                className="lyrics-link mt-2"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: copied ? 'var(--rafa-accent)' : 'var(--rafa-muted)',
                  background: 'none',
                  border: 'none',
                  padding: '0.4rem 0',
                  cursor: 'pointer',
                }}
              >
                {copied ? `✓ ${c.copied}` : `↗ ${c.copy}`}
              </button>
            )}

            {isSong && tabs.length > 1 && (
              <div className="song-tabs" role="tablist" aria-label={c.tabsLabel} onKeyDown={onTabKey}>
                {tabs.map(k => (
                  <button
                    key={k}
                    id={`song-tab-${k}`}
                    type="button"
                    role="tab"
                    className="song-tab"
                    aria-selected={tab === k}
                    aria-controls="song-panel"
                    tabIndex={tab === k ? 0 : -1}
                    onClick={() => choose(k)}
                  >
                    {tabLabel[k]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cuerpo con scroll */}
          <div
            ref={bodyRef}
            id="song-panel"
            role={isSong && tabs.length > 1 ? 'tabpanel' : undefined}
            aria-labelledby={isSong && tabs.length > 1 ? `song-tab-${tab}` : undefined}
            style={{
              padding: 'clamp(1.4rem, 5vw, 2rem) clamp(1.4rem, 5vw, 2.2rem)',
              overflowY: 'auto',
            }}
          >
            <div key={isSong ? tab : 'credits'} className="song-panel">
              {!isSong ? (
                <p style={{ ...SERIF_BODY, fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>{data.body}</p>
              ) : tab === 'story' && data.story ? (
                <>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.66rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'var(--rafa-muted)',
                      marginBottom: '1rem',
                    }}
                  >
                    {c.storyBy}
                  </p>
                  <p style={{ ...SERIF_BODY, fontSize: '0.98rem', color: 'var(--rafa-text)' }}>{data.story}</p>
                </>
              ) : tab === 'listen' && data.spotify ? (
                <div className="flex flex-col gap-4">
                  <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', color: 'var(--rafa-muted)' }}>
                    {c.listenText} <span style={{ color: 'var(--rafa-text)', fontStyle: 'normal' }}>{data.title}</span>
                  </p>
                  <iframe
                    src={data.spotify.embed}
                    title={`Spotify — ${data.title}`}
                    width="100%"
                    height="352"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    style={{ border: 0, borderRadius: 12, background: 'var(--rafa-surface-2)' }}
                  />
                  <a
                    href={data.spotify.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-spotify self-start"
                    onClick={() => track('outbound_click', { platform: 'spotify', place: 'lyrics_modal', song: data.title })}
                  >
                    {c.openSpotify}
                  </a>
                </div>
              ) : data.instrumental || !data.body ? (
                <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--rafa-muted)', lineHeight: 1.7 }}>
                  {data.instrumental ? c.instrumental : c.unavailable}
                </p>
              ) : (
                <p style={SERIF_BODY}>{data.body}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
