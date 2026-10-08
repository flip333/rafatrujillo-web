'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ARTIST } from '@/lib/artist-data'
import { t, localeFromPath } from '@/lib/i18n'
import { track } from '@/lib/analytics'
import { CURSOR_KEY } from '@/components/shared/CustomCursor'

const COL_HEAD: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
  marginBottom: '1rem',
  display: 'block',
}

const COL_LINK: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
  display: 'block',
  padding: '0.6rem 0',
  textDecoration: 'none',
  transition: 'color 150ms',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
}

export function Footer() {
  const locale = localeFromPath(usePathname())
  const c = t(locale)
  const base = locale === 'en' ? '/en' : '/'

  // Preferencia de cursor (animado / clásico)
  const [classic, setClassic] = useState(false)
  useEffect(() => {
    try { setClassic(localStorage.getItem(CURSOR_KEY) === 'classic') } catch {}
  }, [])
  const toggleCursor = () => {
    const next = !classic
    setClassic(next)
    try { localStorage.setItem(CURSOR_KEY, next ? 'classic' : 'animated') } catch {}
    window.dispatchEvent(new Event('rafa:cursor'))
    track('cursor_toggle', { mode: next ? 'classic' : 'animated' })
  }

  const nav = [
    { label: c.nav.latest,  id: 'lanzamiento' },
    { label: c.nav.music,   id: 'discografia' },
    { label: c.nav.videos,  id: 'videos'      },
    { label: c.nav.about,   id: 'sobre'       },
    { label: c.nav.equo,    id: 'equo'        },
    { label: c.nav.contact, id: 'contacto'    },
  ]
  const streaming = [
    { label: 'Spotify ↗',     href: ARTIST.urls.spotify    },
    { label: 'Apple Music ↗', href: ARTIST.urls.appleMusic },
    { label: 'YouTube ↗',     href: ARTIST.urls.youtube    },
    { label: 'Instagram ↗',   href: ARTIST.urls.instagram  },
  ]

  return (
    <footer style={{ backgroundColor: 'var(--rafa-surface)', borderTop: '1px solid var(--rafa-border)' }}>
      <div className="px-6 pt-14 pb-24 sm:pb-14" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-10">
          <nav aria-label={c.footer.nav}>
            <span style={COL_HEAD}>{c.footer.nav}</span>
            {nav.map(item => (
              <Link key={item.id} href={`${base}#${item.id}`} style={COL_LINK} className="hover:!text-[var(--rafa-accent)]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div>
            <span style={COL_HEAD}>{c.footer.listen}</span>
            {streaming.map(item => (
              <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" style={COL_LINK} className="hover:!text-[var(--rafa-accent)]">
                {item.label}
              </Link>
            ))}
          </div>

          <div>
            <span style={COL_HEAD}>{c.footer.booking}</span>
            <Link href={`${base}#prensa`} style={COL_LINK} className="hover:!text-[var(--rafa-accent)]">{c.nav.press}</Link>
            <Link href={`${base}#contacto-booking`} style={COL_LINK} className="hover:!text-[var(--rafa-accent)]">Booking</Link>
            <Link href={locale === 'en' ? '/en/privacy' : '/privacidad'} style={COL_LINK} className="hover:!text-[var(--rafa-accent)]">
              {c.footer.privacy}
            </Link>
          </div>

          <div>
            <span style={COL_HEAD}>{c.footer.artist}</span>
            <p style={{ ...COL_LINK, cursor: 'default', lineHeight: 1.8 }}>
              {ARTIST.name}<br />
              {ARTIST.city} · {ARTIST.country}<br />
              {ARTIST.genre}
            </p>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-6"
          style={{ borderTop: '1px solid var(--rafa-border)' }}
        >
          <span style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em', color: 'var(--rafa-muted)' }}>
            {ARTIST.name}
          </span>
          <div className="flex flex-wrap items-center gap-x-6">
            <Link
              href={c.nav.switchHref}
              lang={locale === 'en' ? 'es' : 'en'}
              onClick={() => track('lang_switch', { to: locale === 'en' ? 'es' : 'en' })}
              style={{ ...COL_LINK, fontSize: '0.75rem' }}
              className="hover:!text-[var(--rafa-accent)]"
            >
              {c.nav.switchLang}
            </Link>
            <button type="button" onClick={toggleCursor} style={{ ...COL_LINK, fontSize: '0.75rem' }} className="hidden md:block hover:!text-[var(--rafa-accent)]">
              {classic ? c.footer.cursorOn : c.footer.cursor}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}>
              © {new Date().getFullYear()} rafatrujillo
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
