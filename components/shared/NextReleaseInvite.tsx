'use client'

import { useEffect, useState } from 'react'
import { NEXT_RELEASE, MOSQUITO_BEACH, ARTIST } from '@/lib/artist-data'
import { Rich } from '@/components/shared/Rich'
import { track } from '@/lib/analytics'
import { t, type Locale } from '@/lib/i18n'

const LABEL: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

function remaining(target: number) {
  const ms = Math.max(0, target - Date.now())
  return {
    done: ms === 0,
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: Math.floor(ms / 1000) % 60,
  }
}

/* Invitación al próximo sencillo de Mosquito Beach, con cuenta regresiva.
   El contador se calcula solo en el navegador (evita desajustes de hidratación). */
export function NextReleaseInvite({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).latest
  const target = NEXT_RELEASE ? Date.parse(NEXT_RELEASE.releaseAt) : 0
  const [left, setLeft] = useState<ReturnType<typeof remaining> | null>(null)

  useEffect(() => {
    if (!NEXT_RELEASE) return
    const tick = () => setLeft(remaining(target))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  if (!NEXT_RELEASE) return null
  const pad = (n?: number) => (n === undefined ? '--' : String(n).padStart(2, '0'))

  return (
    <aside
      aria-labelledby="next-release-title"
      className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center mt-16"
      style={{ border: '1px solid rgba(200,176,138,0.35)', padding: 'clamp(1.5rem, 4vw, 2.75rem)', background: 'var(--rafa-surface)' }}
    >
      <div className="md:col-span-3 flex flex-col gap-4">
        <p className="flex items-center gap-3" style={{ ...LABEL, color: 'var(--rafa-accent)' }}>
          <span className="next-release-dot" aria-hidden="true" />
          {c.nextLabel} · <time dateTime={NEXT_RELEASE.releaseDate}>{c.nextDate}</time>
        </p>
        <h3
          id="next-release-title"
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            lineHeight: 0.95,
            color: 'var(--rafa-text)',
            textTransform: 'uppercase',
          }}
        >
          {NEXT_RELEASE.title}
        </h3>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.98rem', lineHeight: 1.75, color: 'var(--rafa-muted)', maxWidth: 520 }}>
          <Rich text={c.nextText} vars={{ mb: MOSQUITO_BEACH.title }} />
        </p>
        <div className="flex flex-wrap gap-3 mt-1">
          <a
            href="#contacto"
            className="btn-apple"
            onClick={() => track('next_release_cta', { action: 'subscribe' })}
          >
            {c.nextCta}
          </a>
          <a
            href={ARTIST.urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-spotify"
            onClick={() => track('next_release_cta', { action: 'spotify_follow' })}
          >
            {c.nextFollow}
          </a>
        </div>
      </div>

      <div className="md:col-span-2" aria-live="off">
        {left?.done ? (
          <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '1.6rem', color: 'var(--rafa-accent)' }}>
            {c.nextOut}
          </p>
        ) : (
          <div className="countdown" role="timer" aria-label={`${NEXT_RELEASE.title} — ${c.nextDate}`}>
            {(['d', 'h', 'm', 's'] as const).map(k => (
              <div key={k} className="countdown-cell">
                <span className="countdown-num">{pad(left?.[k])}</span>
                <span className="countdown-unit">{c.units[k]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
