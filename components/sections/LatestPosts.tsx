import Link from 'next/link'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { GhostText } from '@/components/shared/GhostText'
import { VideoLensCarousel, type LensVideo } from '@/components/shared/VideoLensCarousel'
import { sortedPosts, postUrl, readingMinutes } from '@/lib/blog'
import type { Locale } from '@/lib/i18n'

/* "Últimas entradas" del blog en el inicio: mismo carrusel con lente de vidrio
   de la sección de videoclips; al tocar una portada se abre la entrada. */
const COPY = {
  es: {
    label: '— Blog', title: 'Últimas entradas',
    intro: 'Las historias detrás de las canciones, el proceso de Mosquito Beach y lo que he aprendido haciendo música.',
    hint: 'Desliza o arrastra · toca para leer', read: 'Leer:', all: 'Ver todas las entradas →', min: 'min de lectura',
  },
  en: {
    label: '— Blog', title: 'Latest posts',
    intro: 'The stories behind the songs, the making of Mosquito Beach and what I’ve learned making music (posts in Spanish).',
    hint: 'Swipe or drag · tap to read', read: 'Read:', all: 'See all posts →', min: 'min read',
  },
}

const LABEL: React.CSSProperties = { fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }

export function LatestPosts({ locale = 'es' }: { locale?: Locale }) {
  const c = COPY[locale]
  const posts = sortedPosts().slice(0, 6)
  if (!posts.length) return null
  const items: LensVideo[] = posts.map(p => ({
    id: p.slug, title: p.title, label: `${p.category} · ${readingMinutes(p)} ${c.min}`, image: p.cover, href: postUrl(p),
  }))

  return (
    <section className="relative py-20 overflow-clip" aria-labelledby="blog-title">
      <div className="relative px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <GhostText text="BLOG" style={{ position: 'absolute', top: '-2rem', right: '-1rem', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal><p style={{ ...LABEL, marginBottom: '1.25rem' }}>{c.label}</p></ScrollReveal>
          <ScrollReveal delay={0.08} variant="mask">
            <h2 id="blog-title" className="uppercase leading-none" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.5rem, 8vw, 5rem)', color: 'var(--rafa-text)' }}>{c.title}</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.12}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', lineHeight: 1.6, color: 'var(--rafa-muted)', maxWidth: '54ch', margin: '1rem 0 2.5rem' }}>{c.intro}</p>
          </ScrollReveal>
        </div>
      </div>

      <VideoLensCarousel videos={items} labels={{ hint: c.hint, play: c.read, more: c.title, close: '' }} />

      {/* Enlaces rastreables (SEO) y accesibles sin el canvas */}
      <div className="px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ul className="flex flex-col gap-2" style={{ marginTop: '2rem' }}>
          {posts.slice(0, 3).map(p => (
            <li key={p.slug}>
              <Link href={postUrl(p)} className="lyrics-link" style={{ fontSize: '0.92rem', color: 'var(--rafa-text)' }}>
                <span style={{ color: 'var(--rafa-accent)', marginRight: '0.6rem' }}>→</span>{p.title}
              </Link>
            </li>
          ))}
        </ul>
        <ScrollReveal>
          <Link href="/blog" className="lyrics-link inline-block mt-8 py-3" style={{ ...LABEL, color: 'var(--rafa-accent)' }}>{c.all}</Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
