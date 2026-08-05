import Image from 'next/image'
import { ScrollReveal }   from '@/components/shared/ScrollReveal'
import { StreamingLinks } from '@/components/shared/StreamingLinks'
import { GhostText }      from '@/components/shared/GhostText'
import { ARTIST, RELATED_ARTISTS } from '@/lib/artist-data'

export const metadata = {
  title: 'Sobre — rafatrujillo',
  description: 'Conoce la historia de rafatrujillo, artista colombiano de música alternativa.',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

export default function SobrePage() {
  return (
    <>
      {/* ── Header ── */}
      <div
        className="relative pt-28 pb-12 px-6 overflow-hidden"
        style={{ backgroundColor: 'var(--rafa-surface)' }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <GhostText
            text="RAFA"
            style={{ position: 'absolute', top: '-1rem', right: '-0.5rem', zIndex: 0 }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ ...LABEL_STYLE, marginBottom: '1rem' }}>— El artista</p>
            <h1
              className="uppercase leading-none"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                color: 'var(--rafa-text)',
              }}
            >
              {ARTIST.displayName}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Bio principal ── */}
      <section className="py-20 px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">

          {/* Texto */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ScrollReveal>
              <p
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.1rem, 2.2vw, 1.45rem)',
                  lineHeight: 1.7,
                  color: 'var(--rafa-text)',
                  maxWidth: 660,
                }}
              >
                rafatrujillo creció entre acordes e historias. Formado como{' '}
                <span style={{ color: 'var(--rafa-accent)' }}>cineasta</span>,
                encontró en la música un lenguaje más honesto para narrar lo que
                le preocupa: el tiempo, el amor que se va, los lunes que pesan.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.12}>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  color: 'var(--rafa-muted)',
                  maxWidth: 640,
                }}
              >
                Su debut{' '}
                <em style={{ color: 'var(--rafa-text)' }}>
                  "Ya no es mi canción, y otras películas"
                </em>{' '}
                es exactamente eso: un conjunto de canciones que son también pequeñas
                películas personales. Cada track, un encuadre. Cada letra, un plano
                cercano a lo que duele y lo que permanece.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.22}>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  color: 'var(--rafa-muted)',
                  maxWidth: 640,
                }}
              >
                Desde{' '}
                <span style={{ color: 'var(--rafa-accent)' }}>Colombia</span>,
                rafatrujillo construye un proyecto sonoro que cruza el indie
                alternativo con la sensibilidad narrativa del cine. Bajo el sello{' '}
                <span style={{ color: 'var(--rafa-accent)' }}>Cruzao Music</span>,
                su música encuentra a quienes también piensan demasiado los lunes.
              </p>
            </ScrollReveal>
          </div>

          {/* Polaroid */}
          <div className="lg:col-span-2 flex justify-center">
            <ScrollReveal delay={0.1}>
              <div
                className="polaroid"
                style={{ maxWidth: 310, transform: 'rotate(1.5deg)' }}
              >
                <Image
                  src={ARTIST.images.profile640}
                  alt={ARTIST.fullName}
                  width={310}
                  height={310}
                  className="photo-bw w-full object-cover block"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Datos ── */}
      <section
        className="py-14 px-6"
        style={{
          backgroundColor: 'var(--rafa-surface)',
          borderTop: '1px solid var(--rafa-border)',
          borderBottom: '1px solid var(--rafa-border)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{ ...LABEL_STYLE, marginBottom: '2rem' }}>— Sobre el proyecto</p>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: 'Sello',  value: ARTIST.label   },
              { label: 'Género', value: ARTIST.genre   },
              { label: 'País',   value: ARTIST.country },
              { label: 'Debut',  value: '2025'         },
            ].map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 0.07}>
                <div style={{ borderTop: '1px solid var(--rafa-border)', paddingTop: '1rem' }}>
                  <p style={{ ...LABEL_STYLE, marginBottom: '0.5rem' }}>{item.label}</p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--rafa-text)',
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 500,
                  }}>
                    {item.value}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Streaming ── */}
      <section className="py-16 px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal>
          <p style={{ ...LABEL_STYLE, marginBottom: '2rem', textAlign: 'center' }}>
            — Escuchar
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="flex justify-center">
            <StreamingLinks />
          </div>
        </ScrollReveal>
      </section>

      {/* ── Artistas relacionados ── */}
      <section
        className="py-12 px-6 pb-24"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          borderTop: '1px solid var(--rafa-border)',
        }}
      >
        <ScrollReveal>
          <p style={{ ...LABEL_STYLE, marginBottom: '1.5rem' }}>
            También te puede gustar
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap gap-3">
            {RELATED_ARTISTS.map(a => (
              <span
                key={a}
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--rafa-muted)',
                  border: '1px solid var(--rafa-border)',
                  padding: '0.4rem 0.85rem',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </>
  )
}
