import Image            from 'next/image'
import { ScrollReveal }   from '@/components/shared/ScrollReveal'
import { SectionDivider } from '@/components/shared/SectionDivider'
import { SpotifyEmbed }   from '@/components/shared/SpotifyEmbed'
import { StreamingLinks } from '@/components/shared/StreamingLinks'
import { GhostText }      from '@/components/shared/GhostText'
import { ALBUM_DEBUT, EP_01, SINGLES, ARTIST } from '@/lib/artist-data'

export const metadata = {
  title: 'Música — rafatrujillo',
  description: 'Discografía completa de rafatrujillo.',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

const TRACK_NUM: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
  width: '1.25rem',
  textAlign: 'right',
  flexShrink: 0,
  fontVariantNumeric: 'tabular-nums',
}

const TRACK_TITLE: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--rafa-text)',
  fontFamily: 'var(--font-inter)',
  flex: 1,
}

export default function MusicaPage() {
  const s2025 = SINGLES.filter(s => s.year === 2025)
  const s2024 = SINGLES.filter(s => s.year === 2024)
  const s2023 = SINGLES.filter(s => s.year === 2023)

  return (
    <>
      {/* ── Header página ── */}
      <div
        className="relative pt-28 pb-12 px-6 overflow-hidden"
        style={{ backgroundColor: 'var(--rafa-surface)' }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <GhostText
            text="MUSIC"
            style={{ position: 'absolute', top: '-1rem', left: '-0.5rem', zIndex: 0 }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ ...LABEL_STYLE, marginBottom: '1rem' }}>rafatrujillo</p>
            <h1
              className="uppercase leading-none"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                color: 'var(--rafa-text)',
              }}
            >
              Discografía
            </h1>
          </div>
        </div>
      </div>

      <SectionDivider text="MÚSICA · MÚSICA · MÚSICA · MÚSICA · MÚSICA" />

      {/* ── Álbum debut ── */}
      <section className="py-20 px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal>
          <span
            className="inline-block mb-10 px-2 py-1 text-[0.6rem] tracking-widest uppercase"
            style={{
              color: 'var(--rafa-accent)',
              border: '1px solid rgba(200,176,138,0.35)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Álbum debut · {ALBUM_DEBUT.year}
          </span>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Portada real */}
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

          <ScrollReveal delay={0.18}>
            <h2
              className="uppercase leading-none mb-2"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                color: 'var(--rafa-text)',
              }}
            >
              {ALBUM_DEBUT.title}
            </h2>
            <p className="mb-8" style={{ ...LABEL_STYLE, color: 'var(--rafa-accent)' }}>
              8 canciones
            </p>

            <div style={{ borderTop: '1px solid var(--rafa-border)' }}>
              {ALBUM_DEBUT.tracks.map(t => (
                <div
                  key={t.n}
                  className="track-row flex items-center gap-4 py-3"
                >
                  <span style={TRACK_NUM}>{String(t.n).padStart(2, '0')}</span>
                  <span style={TRACK_TITLE}>{t.title}</span>
                  {t.exclusive && (
                    <span
                      className="text-[0.58rem] tracking-widest uppercase px-1.5 py-0.5 hidden sm:inline"
                      style={{
                        color: 'var(--rafa-accent)',
                        border: '1px solid rgba(200,176,138,0.35)',
                        fontFamily: 'var(--font-inter)',
                        flexShrink: 0,
                      }}
                    >
                      nuevo
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-5">
              <StreamingLinks />
              <SpotifyEmbed src={ARTIST.urls.spotifyEmbed} height={152} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SectionDivider text="EP · SINGLES · LANZAMIENTOS · EP · SINGLES" reverse />

      {/* ── EP.01 ── */}
      <section className="py-16 px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal>
          <p style={{ ...LABEL_STYLE, marginBottom: '2rem' }}>— EP</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8" style={{ maxWidth: 680 }}>

            {/* Portada EP real */}
            <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', overflow: 'hidden' }}>
              <Image
                src={EP_01.cover}
                alt={EP_01.title}
                fill
                sizes="(min-width: 640px) 340px, 100vw"
                className="photo-bw object-cover"
              />
            </div>

            {/* Tracks EP */}
            <div className="flex flex-col justify-center">
              <h3
                className="uppercase mb-4"
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  color: 'var(--rafa-text)',
                }}
              >
                {EP_01.title}
              </h3>
              <p style={{ ...LABEL_STYLE, color: 'var(--rafa-accent)', marginBottom: '1rem' }}>
                {EP_01.year}
              </p>
              <div style={{ borderTop: '1px solid var(--rafa-border)' }}>
                {EP_01.tracks.map((t, i) => (
                  <div key={t.title} className="track-row flex items-center gap-3 py-2.5">
                    <span style={{ ...TRACK_NUM }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={TRACK_TITLE}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Singles ── */}
      <section className="py-16 px-6 pb-24" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal>
          <p style={{ ...LABEL_STYLE, marginBottom: '2.5rem' }}>— Singles</p>
        </ScrollReveal>

        {[{ year: 2025, items: s2025 }, { year: 2024, items: s2024 }, { year: 2023, items: s2023 }].map(
          ({ year, items }) => (
            <div key={year} className="mb-12">
              <ScrollReveal>
                <p
                  className="uppercase mb-5"
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                    color: 'var(--rafa-accent)',
                  }}
                >
                  {year}
                </p>
              </ScrollReveal>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((s, i) => (
                  <ScrollReveal key={s.title} delay={i * 0.05}>
                    <div className="single-card-img group" style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
                      <Image
                        src={s.cover}
                        alt={s.title}
                        fill
                        sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="photo-bw object-cover"
                      />
                      {/* Overlay con título */}
                      <div
                        className="single-cover-overlay"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0) 55%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          padding: '0.75rem',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--rafa-text)',
                            fontFamily: 'var(--font-inter)',
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          {s.title}
                        </p>
                        <p
                          style={{
                            fontSize: '0.6rem',
                            color: 'var(--rafa-muted)',
                            fontFamily: 'var(--font-inter)',
                            marginTop: '0.2rem',
                          }}
                        >
                          {s.year}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          ),
        )}
      </section>
    </>
  )
}
