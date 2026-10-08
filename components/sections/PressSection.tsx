'use client'

import { useId, useState } from 'react'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { GhostText }    from '@/components/shared/GhostText'
import { Rich }         from '@/components/shared/Rich'
import { PRESS, ARTIST } from '@/lib/artist-data'
import { t, type Locale } from '@/lib/i18n'
import { track } from '@/lib/analytics'

const LABEL: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

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

/* Prensa / EPK: biografía corta copiable, fotos descargables y formulario de booking. */
export function PressSection({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).press
  const bio = locale === 'en' ? PRESS.shortBioEn : PRESS.shortBio
  const [copied, setCopied] = useState(false)

  const copyBio = async () => {
    try {
      await navigator.clipboard.writeText(bio)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      track('press_bio_copy')
    } catch {}
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="relative">
      <GhostText text={c.ghost} style={{ position: 'absolute', top: '-3rem', right: '-1rem', zIndex: 0 }} />

      <div className="relative" style={{ zIndex: 1 }}>
        <ScrollReveal>
          <p style={{ ...LABEL, marginBottom: '0.75rem' }}>{c.label}</p>
        </ScrollReveal>
        <ScrollReveal delay={0.06} variant="mask">
          <h2 className="uppercase leading-none mb-12" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.5rem, 8vw, 5rem)', color: 'var(--rafa-text)' }}>
            {c.title}
          </h2>
        </ScrollReveal>

        {/* ── Servicios: música para cine, publicidad y proyectos ── */}
        <div className="mb-20">
          <ScrollReveal variant="words">
            <h3
              className="mb-4"
              style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(1.6rem, 3.6vw, 2.6rem)', lineHeight: 1.15, color: 'var(--rafa-text)', maxWidth: 760 }}
            >
              <Rich text={c.servicesTitle} words />
            </h3>
            <p className="mb-10" style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', lineHeight: 1.8, color: 'var(--rafa-muted)', maxWidth: 680 }}>
              {c.servicesLead}
            </p>
          </ScrollReveal>
          <ScrollReveal variant="stagger" delay={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" >
            {c.services.map(([title, text], i) => (
              <div key={title} className="service-card p-6 flex flex-col gap-3">
                <span style={{ fontFamily: 'var(--font-type)', fontSize: '0.85rem', color: 'var(--rafa-accent)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.6rem', lineHeight: 1, color: 'var(--rafa-text)', letterSpacing: '0.02em' }}>
                  {title}
                </h4>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--rafa-muted)' }}>{text}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Biografía corta */}
          <div className="flex flex-col gap-10">
            <ScrollReveal>
              <h3 style={{ ...LABEL, color: 'var(--rafa-accent)', marginBottom: '0.75rem' }}>{c.bioTitle}</h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--rafa-muted)' }}>{bio}</p>
              <button
                type="button"
                onClick={copyBio}
                className="lyrics-link mt-3"
                style={{ ...LABEL, color: copied ? 'var(--rafa-accent)' : 'var(--rafa-muted)', background: 'none', border: 'none', padding: '0.6rem 0', cursor: 'pointer' }}
              >
                {copied ? `✓ ${c.copied}` : `⧉ ${c.copyBio}`}
              </button>
            </ScrollReveal>

          </div>

          {/* Contacto */}
          <ScrollReveal delay={0.12} className="lg:sticky lg:top-24">
            <div id="contacto-booking" className="section-anchor p-6 sm:p-8" style={{ background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)' }}>
              <h3 className="uppercase leading-none mb-3" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--rafa-text)' }}>
                {c.contactTitle}
              </h3>
              <p className="mb-6" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--rafa-muted)' }}>
                {c.contactText}
              </p>
              <ContactForm locale={locale} />
              <p className="mt-6 pt-5" style={{ borderTop: '1px solid var(--rafa-border)', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--rafa-muted)' }}>
                {c.emailLabel}{' '}
                <a href={`mailto:${ARTIST.bookingEmail}`} className="link-draw" style={{ color: 'var(--rafa-accent)', wordBreak: 'break-all' }}>
                  {ARTIST.bookingEmail}
                </a>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}

function ContactForm({ locale }: { locale: Locale }) {
  const c = t(locale).press
  const uid = useId()
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error' | 'not_configured'>('idle')
  const [form, setForm] = useState({ name: '', email: '', subject: 'booking', message: '', website: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    track('contact_submit', { subject: form.subject })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) setStatus('ok')
      else setStatus(data.error === 'not_configured' ? 'not_configured' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return <p role="status" className="fade-in" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--rafa-accent)' }}>{c.ok}</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-n`} className="sr-only">{c.name}</label>
          <input id={`${uid}-n`} required maxLength={80} autoComplete="name" placeholder={c.name} value={form.name} onChange={set('name')} className="email-input" style={INPUT} />
        </div>
        <div>
          <label htmlFor={`${uid}-e`} className="sr-only">{c.email}</label>
          <input id={`${uid}-e`} required type="email" maxLength={254} autoComplete="email" placeholder={c.email} value={form.email} onChange={set('email')} className="email-input" style={INPUT} />
        </div>
      </div>
      <label htmlFor={`${uid}-s`} className="sr-only">{c.subject}</label>
      <select id={`${uid}-s`} value={form.subject} onChange={set('subject')} className="email-input" style={INPUT}>
        {Object.entries(c.subjects).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <label htmlFor={`${uid}-m`} className="sr-only">{c.message}</label>
      <textarea id={`${uid}-m`} required minLength={10} maxLength={3000} rows={5} placeholder={c.message} value={form.message} onChange={set('message')} className="email-input" style={{ ...INPUT, resize: 'vertical' }} />
      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>
      {(status === 'error' || status === 'not_configured') && (
        <p role="alert" style={{ fontSize: '0.85rem', color: '#e06060', fontFamily: 'var(--font-inter)' }}>
          {status === 'error' ? c.error : c.notConfigured}{' '}
          <a href={ARTIST.urls.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rafa-accent)' }}>Instagram ↗</a>
        </p>
      )}
      <button type="submit" disabled={status === 'loading'} className="btn-play self-start mt-1">
        {status === 'loading' ? c.sending : c.send}
      </button>
    </form>
  )
}
