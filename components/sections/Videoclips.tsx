import { ScrollReveal }   from '@/components/shared/ScrollReveal'
import { GhostText }      from '@/components/shared/GhostText'
import { YOUTUBE_VIDEOS } from '@/lib/artist-data'

type VideoEntry = { id: string | null; title: string; type: string; year: number }
const videos = YOUTUBE_VIDEOS as readonly VideoEntry[]

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

const TYPE_LABEL: Record<string, string> = {
  interview: 'Entrevista',
  official:  'Videoclip oficial',
  live:      'Live session',
}

export function Videoclips() {
  return (
    <section
      className="relative py-20 px-6 overflow-hidden"
      style={{ maxWidth: 1200, margin: '0 auto' }}
    >
      <GhostText
        text="VIDEO"
        style={{ position: 'absolute', top: '-2rem', right: '-1rem', zIndex: 0 }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <ScrollReveal>
          <p style={{ ...LABEL_STYLE, marginBottom: '1.25rem' }}>— Video</p>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <h2
            className="uppercase leading-none mb-12"
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              color: 'var(--rafa-text)',
            }}
          >
            Videoclips
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
          {videos.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 0.1}>
              {v.id ? (
                <div className="video-card flex flex-col gap-3">
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ paddingTop: '56.25%', backgroundColor: 'var(--rafa-surface)' }}
                  >
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        border: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8rem',
                        color: 'var(--rafa-text)',
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {v.title}
                    </p>
                    <p style={{ ...LABEL_STYLE, marginTop: '0.3rem', color: 'var(--rafa-accent)' }}>
                      {TYPE_LABEL[v.type]} · {v.year}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    className="relative w-full flex flex-col items-center justify-center"
                    style={{
                      paddingTop: '56.25%',
                      backgroundColor: 'var(--rafa-surface)',
                      border: '1px solid var(--rafa-border)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <p
                        className="uppercase"
                        style={{
                          fontFamily: 'var(--font-bebas)',
                          fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                          color: 'var(--rafa-accent)',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Próximamente
                      </p>
                      <p style={{ ...LABEL_STYLE }}>{v.year}</p>
                    </div>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8rem',
                        color: 'var(--rafa-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {v.title}
                    </p>
                    <p style={{ ...LABEL_STYLE, marginTop: '0.3rem' }}>
                      {TYPE_LABEL[v.type]} · {v.year}
                    </p>
                  </div>
                </div>
              )}
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
