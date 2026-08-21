'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { ARTIST } from '@/lib/artist-data'

const NAV_LINKS = [
  { label: 'Inicio',  href: '#inicio'      },
  { label: 'Sobre',   href: '#sobre'       },
  { label: 'Música',  href: '#discografia' },
  { label: 'Equo',    href: '#equo'        },
  { label: 'Videos',  href: '#videos'      },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* bloquear scroll cuando menú abierto */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Barra ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-[10010] transition-all duration-400 ${scrolled ? 'nav-blur' : ''}`}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ maxWidth: 1200, margin: '0 auto' }}
        >
          {/* Menú hamburger */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="p-1 transition-colors duration-150 hover:text-[var(--rafa-accent)]"
            style={{ color: 'var(--rafa-text)' }}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          {/* Logo / nombre */}
          <Link
            href="#inicio"
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '0.95rem',
              letterSpacing: '0.35em',
              color: 'var(--rafa-text)',
            }}
            className="hover:text-[var(--rafa-accent)] transition-colors duration-150"
          >
            {ARTIST.name}
          </Link>

          {/* Íconos sociales */}
          <div className="flex items-center gap-4">
            <Link
              href={ARTIST.urls.spotify}
              target="_blank" rel="noopener noreferrer"
              aria-label="Spotify"
              className="transition-colors duration-150 hover:text-[#1DB954]"
              style={{ color: 'var(--rafa-muted)' }}
            >
              <IconSpotify />
            </Link>
            <Link
              href={ARTIST.urls.instagram}
              target="_blank" rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-colors duration-150 hover:text-[var(--rafa-accent)]"
              style={{ color: 'var(--rafa-muted)' }}
            >
              <IconInstagram />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Overlay fullscreen ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[10020] flex flex-col"
            style={{ backgroundColor: 'var(--rafa-bg)' }}
          >
            {/* Cabecera del overlay */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.35em',
                  color: 'var(--rafa-text)',
                }}
              >
                {ARTIST.name}
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="p-1 transition-colors duration-150 hover:text-[var(--rafa-accent)]"
                style={{ color: 'var(--rafa-text)' }}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Links grandes */}
            <div
              className="flex flex-col justify-center flex-1 px-6 gap-0"
              style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}
            >
              {NAV_LINKS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3, ease: 'easeOut' }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block transition-colors duration-150 hover:text-[var(--rafa-accent)]"
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: 'clamp(3.5rem, 12vw, 7.5rem)',
                      lineHeight: 1.0,
                      color: 'var(--rafa-text)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Links externos */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="flex gap-6 mt-8"
              >
                {[
                  { label: 'Spotify ↗',   href: ARTIST.urls.spotify,   color: '#1DB954' },
                  { label: 'Instagram ↗', href: ARTIST.urls.instagram, color: 'var(--rafa-accent)' },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="text-xs tracking-widest uppercase transition-colors duration-150"
                    style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}
                    onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.color = item.color }}
                    onMouseOut={e  => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--rafa-muted)' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function IconSpotify() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}
