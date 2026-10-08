'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SubscribeForm, SUBSCRIBED_KEY } from './SubscribeForm'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/analytics'
import { t, localeFromPath } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/useFocusTrap'

const DISMISSED_KEY   = 'rafa-popup-dismissed'
const DISMISS_DAYS    = 30
const SCROLL_TRIGGER  = 0.45   // fracción de la página recorrida
const TRIGGER_SECTION = 'discografia'

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY)) return false
    const dismissed = Number(localStorage.getItem(DISMISSED_KEY) || 0)
    return Date.now() - dismissed > DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return true
  }
}

/* Pop-up de suscripción: aparece después de que la persona hace scroll
   (no al cargar), una sola vez; si lo cierra no vuelve en 30 días. */
export function EmailPopupModal() {
  const pathname = usePathname()
  const locale = localeFromPath(pathname)
  const c = t(locale).signup
  const [visible, setVisible] = useState(false)
  const lastFocus = useRef<HTMLElement | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  useFocusTrap(panel, visible)

  useEffect(() => {
    if (!shouldShow() || !document.getElementById(TRIGGER_SECTION)) return
    let done = false
    const section = document.getElementById(TRIGGER_SECTION)

    const open = () => {
      if (done) return
      done = true
      cleanup()
      // No interrumpir si hay otro diálogo abierto (p. ej. letras)
      if (document.querySelector('[role="dialog"]:not([aria-hidden="true"])')) return
      lastFocus.current = document.activeElement as HTMLElement
      setVisible(true)
      track('subscribe_view', { source: 'popup' })
    }

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0 && window.scrollY / max >= SCROLL_TRIGGER) open()
    }

    const io = section
      ? new IntersectionObserver(([e]) => e.isIntersecting && open(), { threshold: 0.15 })
      : null
    if (section && io) io.observe(section)
    window.addEventListener('scroll', onScroll, { passive: true })

    function cleanup() {
      window.removeEventListener('scroll', onScroll)
      io?.disconnect()
    }
    return cleanup
  }, [])

  const close = useCallback((reason: 'dismiss' | 'success' = 'dismiss') => {
    setVisible(false)
    if (reason === 'dismiss') {
      try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch {}
      track('popup_dismiss')
    }
    lastFocus.current?.focus?.()
  }, [])

  // Escape para cerrar + bloquear scroll del fondo
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [visible, close])

  return (
    <>
      {visible && (
        <>
          <div
            key="backdrop"
            className="modal-backdrop"
            onClick={() => close()}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.78)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              zIndex: 99990,
            }}
            aria-hidden="true"
          />

          <div
            key="modal-wrapper"
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
              key="modal"
              ref={panel}
              className="modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="popup-title"
              style={{
                pointerEvents: 'all',
                width: '100%',
                maxWidth: 500,
                maxHeight: '90dvh',
                overflowY: 'auto',
                backgroundColor: 'var(--rafa-surface)',
                border: '1px solid var(--rafa-border)',
                padding: 'clamp(1.5rem, 5vw, 2.75rem)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => close()}
                aria-label={c.close}
                className="popup-close"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--rafa-muted)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  transition: 'color 150ms ease',
                }}
              >
                ✕
              </button>

              <p
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--rafa-muted)',
                  fontFamily: 'var(--font-inter)',
                  marginBottom: '0.85rem',
                }}
              >
                {c.label}
              </p>
              <h2
                id="popup-title"
                className="uppercase leading-none"
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: 'clamp(2rem, 7vw, 3.2rem)',
                  color: 'var(--rafa-text)',
                  marginBottom: '0.65rem',
                  letterSpacing: '0.02em',
                }}
              >
                {c.title}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontSize: '0.92rem',
                  color: 'var(--rafa-muted)',
                  lineHeight: 1.6,
                  marginBottom: '1.75rem',
                }}
              >
                {c.popupText}
              </p>

              <SubscribeForm
                source="popup"
                locale={locale}
                autoFocus
                onSuccess={() => setTimeout(() => close('success'), 3500)}
                secondary={
                  <button
                    type="button"
                    onClick={() => close()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--rafa-muted)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    {c.no}
                  </button>
                }
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
