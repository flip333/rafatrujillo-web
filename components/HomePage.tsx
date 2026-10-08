import { HeroSection }    from '@/components/sections/HeroSection'
import { NewRelease }     from '@/components/sections/NewRelease'
import { Discography }    from '@/components/sections/Discography'
import { Videoclips }     from '@/components/sections/Videoclips'
import { AboutSection }   from '@/components/sections/AboutSection'
import { EquoSection }    from '@/components/sections/EquoSection'
import { EventsSection, upcomingEvents } from '@/components/sections/EventsSection'
import { PressSection }   from '@/components/sections/PressSection'
import { EmailSignup }    from '@/components/sections/EmailSignup'
import { FaqSection }     from '@/components/sections/FaqSection'
import { SectionDivider } from '@/components/shared/SectionDivider'
import { ParallaxBand }   from '@/components/shared/ParallaxBand'
import { SONG_KEYWORDS }  from '@/lib/artist-data'
import { t, type Locale } from '@/lib/i18n'

/* Recorrido: lo nuevo → la música → los videos → la historia → contacto.
   (La lista de correo va al final; el pop-up cubre la captación temprana.) */
export function HomePage({ locale = 'es' }: { locale?: Locale }) {
  const hasEvents = upcomingEvents().length > 0
  const surface: React.CSSProperties = {
    backgroundColor: 'var(--rafa-surface)',
    borderTop: '1px solid var(--rafa-border)',
    borderBottom: '1px solid var(--rafa-border)',
  }

  return (
    <>
      <div id="inicio">
        <HeroSection locale={locale} />
      </div>

      <SectionDivider text={SONG_KEYWORDS} />

      <section id="lanzamiento" className="section-anchor py-24 px-6">
        <NewRelease locale={locale} />
      </section>

      <SectionDivider text={SONG_KEYWORDS} reverse />

      <section id="discografia" className="section-anchor py-24 px-6">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Discography locale={locale} />
        </div>
      </section>

      <SectionDivider text={SONG_KEYWORDS} />

      <div id="videos" className="section-anchor">
        <Videoclips locale={locale} />
      </div>

      <ParallaxBand src="/fotos/sesion-2025-06.jpg" quote={t(locale).bands.story} cite="rafatrujillo" position="center 35%" />

      <section id="sobre" className="section-anchor py-24 px-6">
        <AboutSection locale={locale} />
      </section>

      <section id="equo" className="section-anchor py-24 px-6" style={surface}>
        <EquoSection locale={locale} />
      </section>

      {hasEvents && (
        <section id="fechas" className="section-anchor py-24 px-6">
          <EventsSection locale={locale} />
        </section>
      )}

      <ParallaxBand src="/fotos/sesion-2024-03.jpg" quote={t(locale).bands.studio} position="center 40%" />

      <section id="prensa" className="section-anchor py-24 px-6">
        <PressSection locale={locale} />
      </section>

      <section id="preguntas" className="section-anchor py-24 px-6" style={{ borderTop: '1px solid var(--rafa-border)' }}>
        <FaqSection locale={locale} />
      </section>

      <div id="contacto" className="section-anchor">
        <EmailSignup locale={locale} />
      </div>
    </>
  )
}
