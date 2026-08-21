import Image from 'next/image'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { GhostText }    from '@/components/shared/GhostText'
import { ARTIST }       from '@/lib/artist-data'

const LABEL: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

export function AboutSection() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="relative">
      <GhostText
        text="RAFA"
        style={{ position: 'absolute', top: '-3rem', right: '-1rem', zIndex: 0 }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        <ScrollReveal>
          <p style={{ ...LABEL, marginBottom: '1rem' }}>— El artista</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">
          {/* Texto */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ScrollReveal delay={0.06}>
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
                rafatrujillo es un artista y productor de{' '}
                <span style={{ color: 'var(--rafa-accent)' }}>Manizales, Colombia</span>.
                Su proyecto fusiona los géneros Indie Pop-Rock con la cinematografía.
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
                Siendo músico natural y compositor, con una formación en{' '}
                <span style={{ color: 'var(--rafa-accent)' }}>cine</span>, integra
                elementos cinematográficos y de storytelling en su proyecto musical.
                En 2021 lanzó su primer sencillo{' '}
                <em style={{ color: 'var(--rafa-text)' }}>"Nombre y Apellido"</em>, con
                su antigua agrupación llamada Equo.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.18}>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  color: 'var(--rafa-muted)',
                  maxWidth: 640,
                }}
              >
                En 2024 lanza su primer EP como solista, y ese mismo año participó como
                artista en el{' '}
                <span style={{ color: 'var(--rafa-accent)' }}>Megaland Music Fest</span>.
                En 2025 lanza su primer álbum,{' '}
                <em style={{ color: 'var(--rafa-text)' }}>
                  "Ya no es mi canción, y otras películas"
                </em>. Actualmente prepara su segundo LP como solista, con la
                participación de diversos artistas colombianos.
              </p>
            </ScrollReveal>

            {/* Datos */}
            <ScrollReveal delay={0.24}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
                {[
                  { label: 'Origen', value: ARTIST.city    },
                  { label: 'Género', value: ARTIST.genre   },
                  { label: 'País',   value: ARTIST.country },
                  { label: 'Debut',  value: '2025'         },
                ].map(item => (
                  <div key={item.label} style={{ borderTop: '1px solid var(--rafa-border)', paddingTop: '1rem' }}>
                    <p style={{ ...LABEL, marginBottom: '0.5rem' }}>{item.label}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Polaroid */}
          <div className="lg:col-span-2 flex justify-center">
            <ScrollReveal delay={0.1} className="media-clean">
              <div className="polaroid" style={{ maxWidth: 310, transform: 'rotate(1.5deg)' }}>
                <Image
                  src={ARTIST.images.portrait}
                  alt={ARTIST.fullName}
                  width={310}
                  height={310}
                  className="w-full object-cover block"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  )
}
