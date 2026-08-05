'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const STORAGE_KEY = 'rafa-popup-v1'

export function EmailPopupModal() {
  const [visible, setVisible]   = useState(false)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY)) return
    const timer = setTimeout(() => setVisible(true), 2200)
    return () => clearTimeout(timer)
  }, [])

  const close = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')

    // TODO: vincular a Supabase
    // const { error } = await supabase
    //   .from('subscribers')
    //   .insert({ name: name.trim(), email: email.trim().toLowerCase() })
    // if (error) { setStatus('idle'); return }

    await new Promise(r => setTimeout(r, 900))
    setStatus('success')
    setTimeout(close, 2200)
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
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

          {/* Centering wrapper — flex centrado, sin transform */}
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
          {/* Modal */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Suscribirse a la lista de correo"
            initial={{ opacity: 0, y: 36, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
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
            {/* Cerrar */}
            <button
              onClick={close}
              aria-label="Cerrar"
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
              className="popup-close"
            >
              ✕
            </button>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center', padding: '1rem 0' }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: 'clamp(2rem, 6vw, 3rem)',
                      color: 'var(--rafa-accent)',
                      lineHeight: 1.1,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Ya estás en la lista
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.88rem',
                      color: 'var(--rafa-muted)',
                      marginTop: '0.6rem',
                    }}
                  >
                    Pronto recibirás noticias de Rafa.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form">
                  {/* Encabezado */}
                  <p
                    style={{
                      fontSize: '0.62rem',
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'var(--rafa-muted)',
                      fontFamily: 'var(--font-inter)',
                      marginBottom: '0.85rem',
                    }}
                  >
                    — Lista de correo
                  </p>
                  <h2
                    className="uppercase leading-none"
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: 'clamp(2rem, 7vw, 3.2rem)',
                      color: 'var(--rafa-text)',
                      marginBottom: '0.65rem',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Sé el primero
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
                    Nuevas canciones, fechas y detrás de cámaras — directo a tu correo.
                  </p>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Tu nombre (opcional)"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={status === 'loading'}
                      className="email-input"
                      style={{
                        width: '100%',
                        padding: '0.82rem 1rem',
                        backgroundColor: 'var(--rafa-surface-2)',
                        border: '1px solid var(--rafa-border)',
                        color: 'var(--rafa-text)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={status === 'loading'}
                      className="email-input"
                      style={{
                        width: '100%',
                        padding: '0.82rem 1rem',
                        backgroundColor: 'var(--rafa-surface-2)',
                        border: '1px solid var(--rafa-border)',
                        color: 'var(--rafa-text)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                    <div className="flex items-center gap-3 mt-1" style={{ flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="btn-subscribe"
                        style={{
                          padding: '0.82rem 2rem',
                          border: '1px solid var(--rafa-accent)',
                          color: status === 'loading' ? 'var(--rafa-muted)' : 'var(--rafa-accent)',
                          backgroundColor: 'transparent',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.68rem',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                          cursor: status === 'loading' ? 'default' : 'pointer',
                          transition: 'background-color 180ms ease, color 180ms ease',
                        }}
                      >
                        {status === 'loading' ? 'Enviando...' : 'Suscribirme'}
                      </button>
                      <button
                        type="button"
                        onClick={close}
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
                        No, gracias
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
