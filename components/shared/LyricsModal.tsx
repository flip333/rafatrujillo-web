'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export interface LyricsModalData {
  title:     string
  meta?:     string          // p. ej. "Álbum · 2025" o "EP · 2024"
  body:      string | null   // letra o créditos
  variant?:  'lyrics' | 'credits'
  instrumental?: boolean
}

interface Props {
  data: LyricsModalData | null
  onClose: () => void
}

export function LyricsModal({ data, onClose }: Props) {
  const open = data !== null

  // Cerrar con Escape + bloquear scroll del fondo
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && data && (
        <>
          {/* Backdrop */}
          <motion.div
            key="lyrics-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
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
            <motion.div
              key="lyrics-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Letra de ${data.title}`}
              initial={{ opacity: 0, y: 36, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.36, ease: 'easeOut' }}
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
                  onClick={onClose}
                  aria-label="Cerrar"
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
                    padding: '0.25rem 0.5rem',
                    transition: 'color 150ms ease',
                  }}
                >
                  ✕
                </button>

                {data.meta && (
                  <p
                    style={{
                      fontSize: '0.6rem',
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
                      ? 'Pista instrumental — sin letra.'
                      : 'Letra no disponible por ahora.'}
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
