import Image from 'next/image'
import { ScrollReveal }  from '@/components/shared/ScrollReveal'
import { SpotifyEmbed }  from '@/components/shared/SpotifyEmbed'
import { StreamingLinks } from '@/components/shared/StreamingLinks'
import { ALBUM_DEBUT, ARTIST } from '@/lib/artist-data'

export function LatestRelease() {
  return (
    <section className="py-20 px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>

      <ScrollReveal>
        <p className="meta-label" style={{
          fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)', marginBottom: '2.5rem',
        }}>
          — Último lanzamiento
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* Portada del álbum */}
        <ScrollReveal delay={0.1}>
          <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', overflow: 'hidden' }}>
            <Image
              src={ALBUM_DEBUT.cover}
              alt={ALBUM_DEBUT.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="photo-bw object-cover"
              priority
            />
          </div>
        </ScrollReveal>

        {/* Tracklist + controles */}
        <ScrollReveal delay={0.18}>
          <div>
            {/* Título sección */}
            <h2
              className="uppercase leading-none mb-2"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                color: 'var(--rafa-text)',
              }}
            >
              {ALBUM_DEBUT.title}
            </h2>
            <p
              className="mb-8"
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--rafa-accent)',
                fontFamily: 'var(--font-inter)',
              }}
            >
              Álbum debut · {ALBUM_DEBUT.year}
            </p>

            {/* Tracklist */}
            <div style={{ borderTop: '1px solid var(--rafa-border)' }}>
              {ALBUM_DEBUT.tracks.map(track => (
                <div
                  key={track.n}
                  className="track-row flex items-center gap-4 py-3"
                >
                  <span
                    className="track-num text-xs w-5 shrink-0 text-right tabular-nums"
                    style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}
                  >
                    {String(track.n).padStart(2, '0')}
                  </span>
                  <span
                    className="flex-1 text-sm"
                    style={{ color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)' }}
                  >
                    {track.title}
                  </span>
                  {track.exclusive && (
                    <span
                      className="text-[0.58rem] tracking-widest uppercase px-1.5 py-0.5 shrink-0 hidden sm:inline-block"
                      style={{
                        color: 'var(--rafa-accent)',
                        border: '1px solid rgba(200,176,138,0.35)',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      nuevo
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-6">
              <StreamingLinks />
              <SpotifyEmbed src={ARTIST.urls.spotifyEmbed} height={152} />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
