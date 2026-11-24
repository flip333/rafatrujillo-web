import Link from 'next/link'
import { ScrollReveal }   from '@/components/shared/ScrollReveal'
import { GhostText }      from '@/components/shared/GhostText'
import { LiteYouTube }    from '@/components/shared/LiteYouTube'
import { VideoLensCarousel, type LensVideo } from '@/components/shared/VideoLensCarousel'
import { YOUTUBE_VIDEOS, ARTIST } from '@/lib/artist-data'
import { t, type Locale } from '@/lib/i18n'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

/* El último videoclip va en grande; el resto en el carrusel con lente de vidrio. */
export function Videoclips({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).videos
  const typeLabel: Record<string, string> = { official: c.official, live: c.live }
  const [featured, ...rest] = YOUTUBE_VIDEOS
  const carousel: LensVideo[] = rest.map(v => ({ id: v.id, title: v.title, label: `${typeLabel[v.type]} · ${v.year}` }))

  return (
    <section className="relative py-20 overflow-clip">
      <div className="relative px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <GhostText text="VIDEO" style={{ position: 'absolute', top: '-2rem', right: '-1rem', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <p style={{ ...LABEL_STYLE, marginBottom: '1.25rem' }}>{c.label}</p>
          </ScrollReveal>

          <ScrollReveal delay={0.08} variant="mask">
            <h2
              className="uppercase leading-none mb-12"
              style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.5rem, 8vw, 5rem)', color: 'var(--rafa-text)' }}
            >
              {c.title}
            </h2>
          </ScrollReveal>

          {/* Último video — destacado */}
          <ScrollReveal delay={0.1} variant="image">
            <div className="flex flex-col gap-3 mb-16">
              <LiteYouTube id={featured.id} title={featured.title} playLabel={c.play} hiRes />
              <VideoCaption title={featured.title} label={`${typeLabel[featured.type]} · ${featured.year}`} large />
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <p style={{ ...LABEL_STYLE, marginBottom: '1.5rem' }}>— {c.more}</p>
          </ScrollReveal>
        </div>
      </div>

      {/* Resto de videoclips — carrusel a todo el ancho */}
      <VideoLensCarousel
        videos={carousel}
        labels={{ hint: c.hint, play: c.play, more: c.more, close: c.close }}
      />

      <div className="px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal>
          <Link
            href={ARTIST.urls.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="lyrics-link inline-block mt-10 py-3"
            style={{ ...LABEL_STYLE, color: 'var(--rafa-accent)' }}
          >
            {c.channel}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}

function VideoCaption({ title, label, large = false }: { title: string; label: string; large?: boolean }) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: large ? '1rem' : '0.85rem', color: 'var(--rafa-text)', fontWeight: 500, lineHeight: 1.4 }}>
        {title}
      </h3>
      <p style={{ ...LABEL_STYLE, marginTop: '0.3rem', color: 'var(--rafa-accent)' }}>{label}</p>
    </div>
  )
}
