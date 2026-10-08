'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { ARTIST } from '@/lib/artist-data'
import { t, localeFromPath } from '@/lib/i18n'
import { upcomingEvents } from '@/components/sections/EventsSection'
import { track } from '@/lib/analytics'

export function Navbar() {
  const pathname = usePathname()
  const locale = localeFromPath(pathname)
  const c = t(locale).nav
  const base = locale === 'en' ? '/en' : '/'
  const hasEvents = upcomingEvents().length > 0

  // Mismo orden que las secciones de la página
  const NAV_LINKS = useMemo(() => [
    { id: 'inicio',      label: c.home   },
    { id: 'lanzamiento', label: c.latest },
    { id: 'discografia', label: c.music  },
    { id: 'videos',      label: c.videos },
    { id: 'sobre',       label: c.about  },
    { id: 'equo',        label: c.equo   },
    ...(hasEvents ? [{ id: 'fechas', label: c.dates }] : []),
    { id: 'prensa',      label: c.press  },
    { id: 'contacto',    label: c.contact },
  ].map(l => ({ ...l, href: `${base}#${l.id}` })), [c, base, hasEvents])

  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)
  const [active, setActive]     = useState('inicio')
  const menuBtn  = useRef<HTMLButtonElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Scrollspy: sección visible en el centro de la pantalla → activa en el menú
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    NAV_LINKS.forEach(l => { const el = document.getElementById(l.id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [NAV_LINKS, pathname])

  /* Menú abierto: bloquea el scroll, Escape cierra y el foco entra/sale del menú */
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const btn = menuBtn.current
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      btn?.focus()
    }
  }, [open])

  return (
    <>
      {/* ── Barra ── */}
      <nav
        aria-label={c.main}
        className={`fixed top-0 inset-x-0 z-[10010] transition-[background-color] duration-300 ${scrolled ? 'nav-blur' : ''}`}
      >
        <div
          className="flex items-center justify-between px-3 sm:px-4 py-1.5"
          style={{ maxWidth: 1224, margin: '0 auto' }}
        >
          <button
            ref={menuBtn}
            onClick={() => setOpen(true)}
            aria-label={c.openMenu}
            aria-expanded={open}
            aria-controls="menu-principal"
            className="tap-target transition-colors duration-150 hover:text-[var(--rafa-accent)]"
            style={{ color: 'var(--rafa-text)' }}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          <Link
            href={`${base}#inicio`}
            style={{
              fontFamily: 'var(--font-type)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              color: 'var(--rafa-text)',
            }}
            className="tap-target px-2 hover:text-[var(--rafa-accent)] transition-colors duration-150"
          >
            {ARTIST.name}
          </Link>

          <div className="flex items-center">
            <Link
              href={ARTIST.urls.spotify}
              target="_blank" rel="noopener noreferrer"
              aria-label={`Spotify ${c.newTab}`}
              className="tap-target transition-colors duration-150 hover:text-[#1DB954]"
              style={{ color: 'var(--rafa-muted)' }}
            >
              <IconSpotify />
            </Link>
            <Link
              href={ARTIST.urls.instagram}
              target="_blank" rel="noopener noreferrer"
              aria-label={`Instagram ${c.newTab}`}
              className="tap-target transition-colors duration-150 hover:text-[var(--rafa-accent)]"
              style={{ color: 'var(--rafa-muted)' }}
            >
              <IconInstagram />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Menú fullscreen (animación CSS: .nav-overlay en globals.css) ── */}
      <div
        id="menu-principal"
        role="dialog"
        aria-modal="true"
        aria-label={c.menu}
        aria-hidden={!open}
        inert={!open}
        className={`nav-overlay fixed inset-0 z-[10020] flex flex-col ${open ? 'is-open' : ''}`}
        style={{ backgroundColor: 'var(--rafa-bg)' }}
      >
        <div
          className="flex items-center justify-between px-3 sm:px-4 py-1.5"
          style={{ maxWidth: 1224, margin: '0 auto', width: '100%' }}
        >
          <span
            className="px-2"
            style={{
              fontFamily: 'var(--font-type)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              color: 'var(--rafa-text)',
            }}
          >
            {ARTIST.name}
          </span>
          <button
            ref={closeBtn}
            onClick={() => setOpen(false)}
            aria-label={c.closeMenu}
            className="tap-target transition-colors duration-150 hover:text-[var(--rafa-accent)]"
            style={{ color: 'var(--rafa-text)' }}
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <div
          className="flex flex-col justify-center flex-1 px-6 overflow-y-auto"
          style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}
        >
          {NAV_LINKS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active === item.id ? 'true' : undefined}
              className="nav-item block transition-colors duration-150 hover:text-[var(--rafa-accent)]"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(2.4rem, 8vh, 6.5rem)',
                lineHeight: 1.0,
                color: 'var(--rafa-text)',
                letterSpacing: '0.03em',
                '--i': i,
              } as React.CSSProperties}
            >
              {item.label}
            </Link>
          ))}

          <div className="nav-item flex flex-wrap gap-x-6 mt-8" style={{ '--i': NAV_LINKS.length } as React.CSSProperties}>
            {[
              { label: 'Spotify ↗',   href: ARTIST.urls.spotify   },
              { label: 'YouTube ↗',   href: ARTIST.urls.youtube   },
              { label: 'Instagram ↗', href: ARTIST.urls.instagram },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                target="_blank" rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="py-3 text-xs tracking-widest uppercase transition-colors duration-150 hover:text-[var(--rafa-accent)]"
                style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={c.switchHref}
              lang={locale === 'en' ? 'es' : 'en'}
              onClick={() => { setOpen(false); track('lang_switch', { to: locale === 'en' ? 'es' : 'en' }) }}
              className="py-3 text-xs tracking-widest uppercase transition-colors duration-150 hover:text-[var(--rafa-accent)]"
              style={{ color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)' }}
            >
              {c.switchLang}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

function IconSpotify() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.360-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}
