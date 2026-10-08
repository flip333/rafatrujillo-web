'use client'

import { useEffect, useRef, useState } from 'react'
import { t, type Locale } from '@/lib/i18n'
import { track } from '@/lib/analytics'
import { useFocusTrap } from '@/lib/useFocusTrap'

export interface LyricsModalData {
  title:     string
  meta?:     string          // p. ej. "Álbum · 2025" o "EP · 2024"
  body:      string | null   // letra o créditos
  variant?:  'lyrics' | 'credits'
  instrumental?: boolean
  shareUrl?: string        // enlace directo a la letra
}

interface Props {
  data: LyricsModalData | null
  onClose: () => void
  locale?: Locale
}

export function LyricsModal({ data, onClose, locale = 'es' }: Props) {
  const open = data !== null
  const c = t(locale).lyrics
  const closeRef = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  useFocusTrap(panel, open)
  const [copied, setCopied] = useState(false)

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

  return (
    <>
      {open && data && (
        <>
          {/* Backdrop */}
          <div
            key="lyrics-backdrop"
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
            key="lyrics-wrapper"
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
              key="lyrics-modal"
              ref={panel}
              className="modal-panel"
              role="dialog"
              aria-modal="true"
              aria-label={data.variant === 'credits' ? data.title : `${c.lyricsOf} ${data.title}`}
              style={{
                pointerEvents: 'all',
                width: '100%',
                maxWidth: 560,
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
                  padding: 'clamp(1.4rem, 5vw, 2rem) clamp(1.4rem, 5vw, 2.2rem) 1rem',
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
                <h2
                  className="leading-none"
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
                    color: 'var(--rafa-text)',
                    letterSpacing: '0.01em',
                    textTransform: 'uppercase',
                    paddingRight: '1.5rem',
                  }}
                >
                  {data.title}
                </h2>
                {data.shareUrl && (
                  <button
                    type="button"
                    onClick={copyLink}
                    className="lyrics-link mt-3"
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
              </div>

              {/* Cuerpo con scroll */}
              <div
                style={{
                  padding: 'clamp(1.4rem, 5vw, 2rem) clamp(1.4rem, 5vw, 2.2rem)',
                  overflowY: 'auto',
                }}
              >
                {data.instrumental || !data.body ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontStyle: 'italic',
                      fontSize: '1rem',
                      color: 'var(--rafa-muted)',
                      lineHeight: 1.7,
                    }}
                  >
                    {data.instrumental
                      ? c.instrumental
                      : c.unavailable}
                  </p>
                ) : (
                  <p
                    style={{
                      fontFamily:
                        data.variant === 'credits'
                          ? 'var(--font-inter)'
                          : 'var(--font-playfair)',
                      fontSize: data.variant === 'credits' ? '0.9rem' : '1.02rem',
                      lineHeight: 1.85,
                      color: 'var(--rafa-text)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {data.body}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
