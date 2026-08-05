import Image from 'next/image'
import Link from 'next/link'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { GhostText }    from '@/components/shared/GhostText'
import { ARTIST }       from '@/lib/artist-data'

export function BioTeaser() {
  return (
    <section
      className="relative py-24 px-6 overflow-hidden"
      style={{ maxWidth: 1200, margin: '0 auto' }}
    >
      {/* Ghost text de fondo */}
      <GhostText
        text="RAFA"
        style={{ bottom: '-2rem', right: '-1rem', position: 'absolute' }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-center relative z-10">

        {/* Texto — 3 de 5 columnas */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ScrollReveal>
            <p style={{
              fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)',
            }}>
              — El artista
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontSize: 'clamp(1.1rem, 2.4vw, 1.5rem)',
                lineHeight: 1.65,
                color: 'var(--rafa-text)',
              }}
            >
              rafatrujillo creció entre acordes e historias. Con formación como{' '}
              <span style={{ color: 'var(--rafa-accent)' }}>cineasta</span>, encontró
              en la música el lenguaje más honesto para narrar lo que le preocupa.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                lineHeight: 1.75,
                color: 'var(--rafa-muted)',
              }}
            >
              El tiempo, el amor que se va, los lunes que pesan.{' '}
              <em style={{ color: 'var(--rafa-text)', fontStyle: 'italic' }}>
                "Ya no es mi canción, y otras películas"
              </em>{' '}
              — canciones que son también pequeñas películas personales.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Link
              href="/sobre"
              className="text-xs tracking-widest uppercase transition-colors duration-150 hover:text-[var(--rafa-accent)]"
              style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}
            >
              Leer más →
            </Link>
          </ScrollReveal>
        </div>

        {/* Polaroid — 2 de 5 columnas */}
        <div className="lg:col-span-2 flex justify-center lg:justify-end">
          <ScrollReveal delay={0.12}>
            <div
              className="polaroid"
              style={{ maxWidth: 300, rotate: '-2deg' }}
            >
              <Image
                src={ARTIST.images.profile640}
                alt={ARTIST.fullName}
                width={300}
                height={300}
                className="photo-bw w-full object-cover block"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
