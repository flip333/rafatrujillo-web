import Image from 'next/image'
import { ARTIST, LATEST_RELEASE, MOSQUITO_BEACH } from '@/lib/artist-data'
import { t, type Locale } from '@/lib/i18n'

/* Hero 100% servidor + animaciones CSS (ver .hero-* en globals.css):
   el nombre y la foto aparecen sin esperar a que cargue el JavaScript. */
export function HeroSection({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).hero
  const letters = [...ARTIST.displayName]

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: 560, zIndex: 10000 }}
    >
      {/* Foto a pantalla completa — zoom-out suave al cargar */}
      <div className="absolute inset-0 hero-parallax">
      <div className="absolute inset-0 hero-zoom">
        <Image
          src={ARTIST.images.hero}
          alt={ARTIST.fullName}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover hero-photo"
        />
      </div>
      </div>

      {/* Degradado hacia abajo para legibilidad del texto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.05) 18%, rgba(10,10,10,0.12) 45%, rgba(10,10,10,0.88) 78%, #0a0a0a 100%)',
        }}
      />

      {/* Meta arriba a la derecha */}
      <div
        className="absolute top-20 right-6 text-right hidden sm:block hero-fade"
        style={{ '--d': '1.1s' } as React.CSSProperties}
      >
        <p
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.26em',
            lineHeight: 2.1,
            textTransform: 'uppercase',
            color: 'rgba(240,236,228,0.6)',
            fontFamily: 'var(--font-inter)',
          }}
        >
          {ARTIST.city}<br />
          {ARTIST.country}<br />
          {ARTIST.genre}
        </p>
      </div>

      {/* Contenido — abajo, alineado con el contenedor de 1200px */}
      <div className="absolute inset-x-0 bottom-0 hero-exit">
        <div className="px-6 pb-24 sm:pb-24 flex items-end justify-between gap-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="min-w-0">
            <h1
              aria-label={ARTIST.displayName}
              className="overflow-hidden"
              style={{
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-type)',
                fontWeight: 700,
                // Monoespaciada: 12 caracteres ≈ 7em → máx ~12.5vw para no desbordar
                fontSize: 'clamp(2.6rem, 12.5vw, 9.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                color: 'var(--rafa-text)',
                paddingBottom: '0.05em',
              }}
            >
              {letters.map((ch, i) => (
                <span key={i} aria-hidden="true" className="hero-letter" style={{ '--i': i } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </h1>

            <div
              className="mt-4 flex items-center gap-x-4 gap-y-2 flex-wrap hero-fade"
              style={{ '--d': '0.75s' } as React.CSSProperties}
            >
              <a
                href="#lanzamiento"
                className="link-draw"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(1rem, 2.2vw, 1.3rem)',
                  color: 'var(--rafa-accent)',
                  paddingBlock: '0.4rem',
                }}
              >
                “{LATEST_RELEASE.title}” — {LATEST_RELEASE.credit}
              </a>
              <span
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(240,236,228,0.7)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {c.available}{' '}
                <em style={{ textTransform: 'none', letterSpacing: '0.05em' }}>{MOSQUITO_BEACH.title}</em>
              </span>
            </div>
          </div>

          {/* Indicador de scroll (decorativo) */}
          <a
            href="#lanzamiento"
            aria-label={c.scrollLabel}
            className="hidden sm:flex flex-col items-center gap-3 shrink-0 hero-fade min-w-11 py-2"
            style={{ '--d': '1.4s' } as React.CSSProperties}
          >
            <span
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(240,236,228,0.55)',
                fontFamily: 'var(--font-inter)',
                writingMode: 'vertical-rl',
              }}
            >
              {c.scroll}
            </span>
            <span className="scroll-cue" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
