'use client'

import { useState } from 'react'
import Link from 'next/link'

const COPY = {
  confirm: {
    title: 'Confirma tu suscripción',
    text: 'Un clic más y quedas en la lista de rafatrujillo.',
    button: 'Confirmar',
    endpoint: '/api/subscribe/confirm',
    done: 'Listo, ya estás en la lista. Te enviamos un correo de bienvenida.',
  },
  unsubscribe: {
    title: 'Darte de baja',
    text: 'Dejarás de recibir correos de rafatrujillo.',
    button: 'Darme de baja',
    endpoint: '/api/unsubscribe',
    done: 'Te diste de baja. No recibirás más correos.',
  },
} as const

/* Acción explícita con botón (POST): evita que los escáneres de enlaces
   de los clientes de correo confirmen o den de baja sin la persona. */
export function SubscriptionAction({ action, token }: { action: keyof typeof COPY; token: string }) {
  const c = COPY[action]
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const submit = async () => {
    setStatus('loading')
    try {
      const res = await fetch(c.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
      setStatus(res.ok && data.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1
        style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 'clamp(2.4rem, 8vw, 4rem)',
          lineHeight: 1,
          color: 'var(--rafa-text)',
          textTransform: 'uppercase',
        }}
      >
        {c.title}
      </h1>

      {status === 'done' ? (
        <p role="status" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--rafa-accent)' }}>
          {c.done}
        </p>
      ) : (
        <>
          <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--rafa-muted)', lineHeight: 1.7 }}>{c.text}</p>
          {status === 'error' && (
            <p role="alert" style={{ fontSize: '0.85rem', color: '#e06060', fontFamily: 'var(--font-inter)' }}>
              El enlace no es válido o ya expiró.
            </p>
          )}
          <button
            onClick={submit}
            disabled={status === 'loading'}
            className="btn-subscribe self-start"
            style={{
              padding: '0.85rem 2rem',
              border: '1px solid var(--rafa-accent)',
              color: 'var(--rafa-accent)',
              background: 'transparent',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {status === 'loading' ? 'Procesando...' : c.button}
          </button>
        </>
      )}

      <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--rafa-muted)' }}>
        ← Volver a rafatrujillo
      </Link>
    </div>
  )
}
