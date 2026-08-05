'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ScrollReveal } from '@/components/shared/ScrollReveal'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

export function EmailSignup() {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')

    // TODO: vincular a Supabase
    // const { error } = await supabase
    //   .from('subscribers')
    //   .insert({ name: name.trim(), email: email.trim().toLowerCase() })
    // if (error) { setStatus('error'); return }

    await new Promise(r => setTimeout(r, 900))
    setStatus('success')
  }

  return (
    <section
      className="py-20 px-6"
      style={{
        backgroundColor: 'var(--rafa-surface)',
        borderTop: '1px solid var(--rafa-border)',
        borderBottom: '1px solid var(--rafa-border)',
      }}
    >
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <ScrollReveal>
          <p style={{ ...LABEL_STYLE, marginBottom: '1.25rem' }}>— Lista de correo</p>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <h2
            className="uppercase leading-tight mb-3"
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(2.2rem, 7vw, 4rem)',
              color: 'var(--rafa-text)',
            }}
          >
            Sé el primero
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.14}>
          <p
            className="mb-8"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'var(--rafa-muted)',
            }}
          >
            Nuevas canciones, fechas, detrás de cámaras y todo lo que no cabe en Instagram.
            Sin spam. Puedes salir cuando quieras.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(200,176,138,0.35)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontStyle: 'italic',
                    fontSize: '1.05rem',
                    color: 'var(--rafa-accent)',
                  }}
                >
                  Ya estás en la lista.
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.82rem',
                    color: 'var(--rafa-muted)',
                    marginTop: '0.4rem',
                  }}
                >
                  Pronto recibirás noticias de Rafa.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-3"
              >
                <input
                  type="text"
                  placeholder="Tu nombre (opcional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--rafa-surface-2)',
                    border: '1px solid var(--rafa-border)',
                    color: 'var(--rafa-text)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  className="email-input"
                />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--rafa-surface-2)',
                    border: '1px solid var(--rafa-border)',
                    color: 'var(--rafa-text)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  className="email-input"
                />

                {status === 'error' && (
                  <p style={{ fontSize: '0.8rem', color: '#e06060', fontFamily: 'var(--font-inter)' }}>
                    Algo salió mal. Intenta de nuevo.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-subscribe"
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.85rem 2rem',
                    border: '1px solid var(--rafa-accent)',
                    color: status === 'loading' ? 'var(--rafa-muted)' : 'var(--rafa-accent)',
                    backgroundColor: 'transparent',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    cursor: status === 'loading' ? 'default' : 'pointer',
                    transition: 'background-color 180ms ease, color 180ms ease',
                    alignSelf: 'flex-start',
                  }}
                >
                  {status === 'loading' ? 'Registrando...' : 'Suscribirme'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </ScrollReveal>
      </div>
    </section>
  )
}
