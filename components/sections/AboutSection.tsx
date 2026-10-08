import Image from 'next/image'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { GhostText }    from '@/components/shared/GhostText'
import { Rich }         from '@/components/shared/Rich'
import { ARTIST }       from '@/lib/artist-data'
import { t, type Locale } from '@/lib/i18n'

const LABEL: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

const BODY: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1rem',
  lineHeight: 1.8,
  color: 'var(--rafa-muted)',
  maxWidth: 640,
}

export function AboutSection({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).about

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="relative">
      <GhostText text="RAFA" style={{ position: 'absolute', top: '-3rem', right: '-1rem', zIndex: 0 }} />

      <div className="relative" style={{ zIndex: 1 }}>
        <ScrollReveal>
          <p style={{ ...LABEL, marginBottom: '1rem' }}>{c.label}</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ScrollReveal delay={0.06} variant="words">
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
                <Rich text={c.lead} words />
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.12}>
              <div className="flex flex-col gap-5" style={BODY}>
                {c.body.map((p, i) => <p key={i}><Rich text={p} /></p>)}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.18}>
              <div className="flex flex-col gap-5" style={BODY}>
                {c.timeline.map((p, i) => <p key={i}><Rich text={p} /></p>)}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.24}>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
                {[
                  { label: c.facts.origin,     value: ARTIST.city    },
                  { label: c.facts.genre,      value: ARTIST.genre   },
                  { label: c.facts.country,    value: ARTIST.country },
                  { label: c.facts.firstAlbum, value: '2025'         },
                ].map(item => (
                  <div key={item.label} style={{ borderTop: '1px solid var(--rafa-border)', paddingTop: '1rem' }}>
                    <dt style={{ ...LABEL, marginBottom: '0.5rem' }}>{item.label}</dt>
                    <dd style={{ fontSize: '0.9rem', color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-2 flex justify-center">
            <ScrollReveal delay={0.1} variant="image" className="media-clean">
              <div className="polaroid" style={{ maxWidth: 310, transform: 'rotate(1.5deg)' }}>
                <Image
                  src={ARTIST.images.portrait}
                  alt={ARTIST.fullName}
                  width={310}
                  height={310}
                  sizes="310px"
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
