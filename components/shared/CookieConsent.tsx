'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localeFromPath } from '@/lib/i18n'
import { CONSENT_EVENT, getConsent, loadPixel, pixelPageView, setConsent } from '@/lib/pixel'

/* Aviso de cookies (Ley 1581 de 2012 — autorización previa, expresa e informada).
   - Solo aparece si hay un pixel configurado en /admin → Conexiones.
   - "Aceptar" y "Rechazar" tienen el mismo peso visual.
   - Se puede cambiar la decisión desde el enlace "Cookies" del pie de página. */

const COPY = {
  es: {
    title: 'Cookies de medición',
    text: 'Usamos el pixel de Meta (Facebook e Instagram) para saber si nuestros anuncios funcionan y mostrar la música de rafatrujillo a quien le puede gustar. Solo se activa si aceptas.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    more: 'Política de privacidad',
    href: '/privacidad',
  },
  en: {
    title: 'Measurement cookies',
    text: 'We use the Meta pixel (Facebook and Instagram) to know whether our ads work and to show rafatrujillo’s music to people who may like it. It only turns on if you accept.',
    accept: 'Accept',
    reject: 'Decline',
    more: 'Privacy policy',
    href: '/en/privacy',
  },
}

export function CookieConsent() {
  const pathname = usePathname() ?? '/'
  const c = COPY[localeFromPath(pathname)]
  const [pixelId, setPixelId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const firstPath = useRef(true)
  const isAdmin = pathname.startsWith('/admin')

  // ¿Hay pixel configurado? (respuesta en caché de la CDN, 5 min)
  useEffect(() => {
    if (isAdmin) return
    let alive = true
    fetch('/api/tracking/config')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { metaPixelId?: string | null } | null) => {
        if (!alive || !d?.metaPixelId) return
        setPixelId(d.metaPixelId)
        const consent = getConsent()
        if (consent === 'granted') loadPixel(d.metaPixelId)
        else if (consent === null) setOpen(true)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [isAdmin])

  // Reabrir desde el pie de página
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(CONSENT_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_EVENT, onOpen)
  }, [])

  // Navegación interna: una vista de página más (solo si ya aceptó)
  useEffect(() => {
    if (firstPath.current) { firstPath.current = false; return }
    pixelPageView()
  }, [pathname])

  if (isAdmin || !open) return null

  const decide = (v: 'granted' | 'denied') => {
    setConsent(v)
    if (v === 'granted' && pixelId) loadPixel(pixelId)
    if (v === 'denied' && window.fbq) { location.reload(); return } // descarga el pixel ya cargado
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fade-in"
      style={{
        position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 99995,
        maxWidth: 440, padding: '1.1rem 1.2rem',
        background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)', fontFamily: 'var(--font-inter)',
      }}
    >
      <p id="cookie-title" style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rafa-accent)' }}>{c.title}</p>
      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--rafa-muted)', marginTop: '0.45rem' }}>
        {c.text}{' '}
        <Link href={c.href} style={{ color: 'var(--rafa-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{c.more}</Link>
      </p>
      <div className="flex gap-2 mt-4">
        {(['denied', 'granted'] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => decide(v)}
            style={{
              flex: 1, padding: '0.7rem 1rem', cursor: 'pointer',
              border: '1px solid var(--rafa-accent)',
              background: v === 'granted' ? 'var(--rafa-accent)' : 'transparent',
              color: v === 'granted' ? '#0a0a0a' : 'var(--rafa-accent)',
              fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            }}
          >
            {v === 'granted' ? c.accept : c.reject}
          </button>
        ))}
      </div>
    </div>
  )
}
