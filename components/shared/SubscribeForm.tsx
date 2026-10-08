'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { track } from '@/lib/analytics'
import { t, type Locale } from '@/lib/i18n'

export const SUBSCRIBED_KEY = 'rafa-subscribed'


const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  backgroundColor: 'var(--rafa-surface-2)',
  border: '1px solid var(--rafa-border)',
  color: 'var(--rafa-text)',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.9rem',
  outline: 'none',
}

interface Props {
  source: 'popup' | 'inline'
  onSuccess?: () => void
  /** Botón secundario (p. ej. "No, gracias" del pop-up) */
  secondary?: React.ReactNode
  autoFocus?: boolean
  locale?: Locale
}

export function SubscribeForm({ source, onSuccess, secondary, autoFocus, locale = 'es' }: Props) {
  const c = t(locale).signup
  const uid = useId()
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || status === 'loading') return
    setStatus('loading')
    setError('')
    track('subscribe_submit', { source })

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, consent, website, source: `${source}${locale === 'en' ? '-en' : ''}` }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error || 'unknown')

      setStatus('success')
      track('subscribe_success', { source })
      try { localStorage.setItem(SUBSCRIBED_KEY, '1') } catch {}
      onSuccess?.()
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown'
      setStatus('error')
      setError((c.errors as Record<string, string>)[code] ?? c.errors.generic)
      track('subscribe_error', { source, error: code })
    }
  }

  return (
    <>
      {status === 'success' ? (
        <div
          key="success"
          className="fade-in"
          role="status"
          style={{ padding: '1.5rem', border: '1px solid rgba(200,176,138,0.35)', textAlign: 'center' }}
        >
          <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--rafa-accent)' }}>
            {c.checkTitle}
          </p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--rafa-muted)', marginTop: '0.4rem' }}>
            {c.checkText}
          </p>
        </div>
      ) : (
        <form key="form" onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate={false}>
          <label htmlFor={`${uid}-name`} className="sr-only">{c.nameLabel}</label>
          <input
            id={`${uid}-name`}
            type="text"
            autoComplete="given-name"
            maxLength={80}
            placeholder={c.name}
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={status === 'loading'}
            className="email-input"
            style={INPUT}
            autoFocus={autoFocus}
          />
          <label htmlFor={`${uid}-email`} className="sr-only">{c.emailLabel}</label>
          <input
            id={`${uid}-email`}
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
            className="email-input"
            style={INPUT}
          />

          {/* Honeypot anti-bots: invisible para personas y lectores de pantalla */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
            <label>
              No llenar
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
            </label>
          </div>

          <label
            className="flex items-start gap-2.5"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--rafa-muted)', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              required
              disabled={status === 'loading'}
              style={{ marginTop: '0.2rem', accentColor: 'var(--rafa-accent)' }}
            />
            <span>
              {c.consent}{' '}
              <Link href={locale === 'en' ? '/en/privacy' : '/privacidad'} className="underline" style={{ color: 'var(--rafa-accent)' }}>
                {c.privacy}
              </Link>.
            </span>
          </label>

          {status === 'error' && (
            <p role="alert" style={{ fontSize: '0.8rem', color: '#e06060', fontFamily: 'var(--font-inter)' }}>
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1" style={{ flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-subscribe"
              style={{
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
              }}
            >
              {status === 'loading' ? c.sending : c.submit}
            </button>
            {secondary}
          </div>
        </form>
      )}
    </>
  )
}
