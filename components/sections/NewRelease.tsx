import Image from 'next/image'
import Link from 'next/link'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { GhostText }    from '@/components/shared/GhostText'
import { PlayButton }   from '@/components/shared/PlayButton'
import { Rich }         from '@/components/shared/Rich'
import { LATEST_RELEASE, MOSQUITO_BEACH, SPOTIFY_URIS } from '@/lib/artist-data'
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
  maxWidth: 600,
}

const ITALIC_LEAD: React.CSSProperties = {
  fontFamily: 'var(--font-playfair)',
  fontStyle: 'italic',
  fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
  lineHeight: 1.6,
  color: 'var(--rafa-text)',
}

// Título dentro de un párrafo ya en cursiva → redonda (convención tipográfica)
const EM_IN_ITALIC: React.CSSProperties = { fontStyle: 'normal', color: 'var(--rafa-accent)' }

export function NewRelease({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).latest
  const vars = { mb: MOSQUITO_BEACH.title, title: LATEST_RELEASE.title }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="relative">
      <GhostText text={c.ghost} style={{ position: 'absolute', top: '-3rem', left: '-1rem', zIndex: 0 }} />

      <div className="relative" style={{ zIndex: 1 }}>
        <ScrollReveal>
          <p style={{ ...LABEL, marginBottom: '2rem' }}>{c.label}</p>
        </ScrollReveal>

        {/* ── Borracho y Loco ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center mb-24">
          <ScrollReveal delay={0.08} variant="image" className="media-clean img-lift img-parallax">
            <div style={{ position: 'relative', aspectRatio: '1289 / 1177', width: '100%', overflow: 'clip' }}>
              <Image
                src={LATEST_RELEASE.cover}
                alt={`${c.coverAlt} “${LATEST_RELEASE.title}” — ${LATEST_RELEASE.credit}`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.16}>
            <div className="flex flex-col gap-5">
              <span
                className="self-start px-2 py-1 text-[0.66rem] tracking-widest uppercase"
                style={{ color: 'var(--rafa-accent)', border: '1px solid rgba(200,176,138,0.35)', fontFamily: 'var(--font-inter)' }}
              >
                {c.badge}
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: 'clamp(2.8rem, 7vw, 5rem)',
                  lineHeight: 0.95,
                  color: 'var(--rafa-text)',
                  textTransform: 'uppercase',
                }}
              >
                {LATEST_RELEASE.title}
              </h2>
              <p style={{ fontFamily: 'var(--font-type)', fontSize: '1.05rem', color: 'var(--rafa-accent)', marginTop: '-0.5rem' }}>
                {LATEST_RELEASE.credit}
              </p>
              <ScrollReveal variant="words" delay={0.25}>
                <p style={ITALIC_LEAD}>
                  <Rich text={c.firstSingle} vars={vars} emStyle={EM_IN_ITALIC} words />
                </p>
              </ScrollReveal>
              <p style={BODY}>{c.body}</p>
              <p style={LABEL}>
                {c.releaseLabel}{' '}
                <time dateTime={LATEST_RELEASE.releaseDate} style={{ color: 'var(--rafa-text)' }}>
                  {c.releaseDate}
                </time>
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <PlayButton uri={SPOTIFY_URIS.latest} title={LATEST_RELEASE.title} label={c.listen} />
                <Link href={LATEST_RELEASE.spotifyUrl} target="_blank" rel="noopener noreferrer" className="btn-spotify">
                  {c.spotify}
                </Link>
                <Link href="#videos" className="btn-apple">
                  {c.video}
                </Link>
              </div>
              <a
                href="#letra-borracho-y-loco"
                className="lyrics-link self-start py-2"
                style={{ ...LABEL, color: 'var(--rafa-accent)' }}
              >
                {c.lyrics}
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* ── Mosquito Beach ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16 pt-16" style={{ borderTop: '1px solid var(--rafa-border)' }}>
          <ScrollReveal className="lg:col-span-2">
            <p style={{ ...LABEL, marginBottom: '1rem' }}>{c.mbLabel} · {MOSQUITO_BEACH.year}</p>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                lineHeight: 1.05,
                color: 'var(--rafa-text)',
              }}
            >
              {MOSQUITO_BEACH.title}
            </h2>
            <p style={{ ...LABEL, marginTop: '1rem', color: 'var(--rafa-accent)', textTransform: 'none', letterSpacing: '0.04em', fontSize: '0.85rem' }}>
              {c.mbSub} <span style={{ fontFamily: 'var(--font-type)' }}>rafatrujillo</span>
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="lg:col-span-3">
            <div className="flex flex-col gap-5" style={BODY}>
              {c.mb.map((para, i) => (
                <p key={i} style={i === 0 ? ITALIC_LEAD : undefined}>
                  <Rich text={para} vars={vars} emStyle={i === 0 ? EM_IN_ITALIC : undefined} />
                </p>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
