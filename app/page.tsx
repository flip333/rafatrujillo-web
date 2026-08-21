import { HeroSection }    from '@/components/sections/HeroSection'
import { AboutSection }   from '@/components/sections/AboutSection'
import { Discography }    from '@/components/sections/Discography'
import { EquoSection }    from '@/components/sections/EquoSection'
import { Videoclips }     from '@/components/sections/Videoclips'
import { EmailSignup }    from '@/components/sections/EmailSignup'
import { SectionDivider } from '@/components/shared/SectionDivider'
import { SONG_KEYWORDS }  from '@/lib/artist-data'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <div id="inicio">
        <HeroSection />
      </div>

      <SectionDivider text={SONG_KEYWORDS} />

      {/* Sobre el artista */}
      <section id="sobre" className="section-anchor py-24 px-6">
        <AboutSection />
      </section>

      {/* Contacto / lista de correo — justo después de "Sobre mí" */}
      <div id="contacto" className="section-anchor">
        <EmailSignup />
      </div>

      <SectionDivider text={SONG_KEYWORDS} reverse />

      {/* Discografía interactiva (clic → letra) */}
      <section id="discografia" className="section-anchor py-24 px-6">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Discography />
        </div>
      </section>

      <SectionDivider text={SONG_KEYWORDS} />

      {/* Equo */}
      <section
        id="equo"
        className="section-anchor py-24 px-6"
        style={{
          backgroundColor: 'var(--rafa-surface)',
          borderTop: '1px solid var(--rafa-border)',
          borderBottom: '1px solid var(--rafa-border)',
        }}
      >
        <EquoSection />
      </section>

      <SectionDivider text={SONG_KEYWORDS} reverse />

      {/* Videoclips */}
      <div id="videos" className="section-anchor">
        <Videoclips />
      </div>
    </>
  )
}
