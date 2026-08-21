import Link from 'next/link'
import { ARTIST } from '@/lib/artist-data'

const NAV = [
  { label: 'Inicio',  href: '#inicio'      },
  { label: 'Sobre',   href: '#sobre'       },
  { label: 'Música',  href: '#discografia' },
  { label: 'Equo',    href: '#equo'        },
  { label: 'Videos',  href: '#videos'      },
]

const STREAMING = [
  { label: 'Spotify ↗',     href: ARTIST.urls.spotify    },
  { label: 'Apple Music ↗', href: ARTIST.urls.appleMusic },
  { label: 'Instagram ↗',   href: ARTIST.urls.instagram  },
]

const COL_HEAD: React.CSSProperties = {
  fontSize: '0.65rem',
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
  marginBottom: '0.5rem',
  textDecoration: 'none',
  transition: 'color 150ms',
}

export function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--rafa-surface)', borderTop: '1px solid var(--rafa-border)' }}>
      <div className="px-6 py-14" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Navegación */}
          <div>
            <span style={COL_HEAD}>Navegación</span>
            {NAV.map(item => (
              <Link key={item.href} href={item.href} style={COL_LINK}
                className="hover:!text-[var(--rafa-accent)]">{item.label}</Link>
            ))}
          </div>

          {/* Escuchar */}
          <div>
            <span style={COL_HEAD}>Escuchar</span>
            {STREAMING.map(item => (
              <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                style={COL_LINK} className="hover:!text-[var(--rafa-accent)]">{item.label}</Link>
            ))}
          </div>

          {/* Info */}
          <div>
            <span style={COL_HEAD}>Artista</span>
            <p style={{ ...COL_LINK, lineHeight: 1.8 }}>
              {ARTIST.fullName}<br />
              {ARTIST.city} · {ARTIST.country}<br />
              {ARTIST.genre}
            </p>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-6"
          style={{ borderTop: '1px solid var(--rafa-border)' }}
        >
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '0.9rem', letterSpacing: '0.3em', color: 'var(--rafa-muted)' }}>
            {ARTIST.name}
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}>
            © 2025 rafatrujillo
          </p>
        </div>
      </div>
    </footer>
  )
}
