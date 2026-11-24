'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SubscribeForm, SUBSCRIBED_KEY } from './SubscribeForm'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/analytics'
import { t, localeFromPath } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/useFocusTrap'

const DISMISSED_KEY = 'rafa-popup-dismissed'
const DISMISS_DAYS  = 7
const ENTRY_DELAY   = 3500   // ms después de entrar a la página
const RETRY_DELAY   = 2500   // si hay otro diálogo abierto, reintenta
// Páginas donde el pop-up estorbaría (flujos propios o legales)
const SKIP_PATHS = ['/admin', '/suscripcion', '/privacidad', '/en/privacy']

function shouldShow(): boolean {
  try {
    // ?popup=1 lo fuerza (útil para probarlo aunque ya se haya cerrado)
    if (new URLSearchParams(location.search).get('popup') === '1') return true
    if (localStorage.getItem(SUBSCRIBED_KEY)) return false
    const dismissed = Number(localStorage.getItem(DISMISSED_KEY) || 0)
    return Date.now() - dismissed > DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return true
  }
}

/* Pop-up de suscripción: aparece a los pocos segundos de entrar a la página,
   una sola vez por visita; si lo cierra no vuelve en 7 días y si se suscribe,
   nunca más. Si en ese momento hay otro diálogo abierto (letras, menú, video),
   espera a que se cierre. */
export function EmailPopupModal() {
  const pathname = usePathname()
  const locale = localeFromPath(pathname)
  const c = t(locale).signup
  const [visible, setVisible] = useState(false)
  const lastFocus = useRef<HTMLElement | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  useFocusTrap(panel, visible)

  useEffect(() => {
    if (SKIP_PATHS.some(p => pathname?.startsWith(p))) return
    if (!shouldShow()) return
    let timer: ReturnType<typeof setTimeout>

    const open = () => {
      // No interrumpir si hay otro diálogo abierto (p. ej. letras o el menú)
      if (document.querySelector('[role="dialog"]:not([aria-hidden="true"])')) {
        timer = setTimeout(open, RETRY_DELAY)
        return
      }
      lastFocus.current = document.activeElement as HTMLElement
      setVisible(true)
      track('subscribe_view', { source: 'popup' })
    }

    timer = setTimeout(open, ENTRY_DELAY)
    return () => clearTimeout(timer)
  }, [pathname])

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
                  top: '0.35rem',
                  right: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--rafa-muted)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: '0.75rem 0.9rem',   // área táctil ≥ 44 px
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
                      padding: '0.75rem 0.5rem',
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
