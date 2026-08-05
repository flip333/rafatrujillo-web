import { HeroSection }       from '@/components/sections/HeroSection'
import { LatestRelease }     from '@/components/sections/LatestRelease'
import { InteractiveTracks } from '@/components/sections/InteractiveTracks'
import { EmailSignup }       from '@/components/sections/EmailSignup'
import { Videoclips }        from '@/components/sections/Videoclips'
import { BioTeaser }         from '@/components/sections/BioTeaser'
import { SectionDivider }    from '@/components/shared/SectionDivider'

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <SectionDivider
        text="MÚSICA · YA NO ES MI CANCIÓN · CRUZAO MUSIC · ALTERNATIVA · COLOMBIA"
      />

      <LatestRelease />

      <SectionDivider
        text="CANCIONES · ESCUCHAR · DESCUBRIR · los lunes pienso · sin tenerte a ti · cuento"
        reverse
      />

      <InteractiveTracks />

      <EmailSignup />

      <SectionDivider
        text="VIDEO · YOUTUBE · ENTREVISTAS · VIDEOCLIPS · LANZAMIENTOS · 2025"
      />

      <Videoclips />

      <SectionDivider
        text="ALTERNATIVA · INDIE · CRUZAO MUSIC · RAFATRUJILLO · 2025"
        reverse
      />

      <BioTeaser />
    </>
  )
}
