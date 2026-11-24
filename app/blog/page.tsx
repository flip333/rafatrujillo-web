import type { Metadata } from 'next'
import { sortedPosts, postUrl } from '@/lib/blog'
import { PostTile } from '@/components/blog/PostTile'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { GhostText } from '@/components/shared/GhostText'

const SITE = 'https://rafatrujillo.xyz'

export const metadata: Metadata = {
  title: 'Blog de Rafa Trujillo — historias detrás de las canciones | rafatrujillo',
  description: 'El blog de Rafa Trujillo (rafatrujillo): la historia detrás de cada canción, el proceso de Mosquito Beach y lo que aprendió construyendo un proyecto musical independiente.',
  keywords: ['blog rafatrujillo', 'Rafa Trujillo', 'historia detrás de la canción', 'Mosquito Beach', 'músico independiente colombiano'],
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    title: 'Blog de Rafa Trujillo — historias detrás de las canciones',
    description: 'La historia detrás de cada canción de rafatrujillo, el proceso de Mosquito Beach y el camino de un proyecto musical independiente.',
    url: '/blog',
    locale: 'es_CO',
  },
}

export default function BlogIndex() {
  const [first, ...rest] = sortedPosts()
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de rafatrujillo',
    url: `${SITE}/blog`,
    inLanguage: 'es-CO',
    author: { '@type': 'Person', name: 'Rafa Trujillo', alternateName: 'rafatrujillo', url: SITE },
    blogPost: sortedPosts().map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}${postUrl(p)}`, datePublished: p.date, image: `${SITE}${p.cover}` })),
  }

  return (
    <section className="relative px-6 overflow-clip" style={{ paddingTop: '9rem', paddingBottom: '6rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <div className="relative" style={{ maxWidth: 1180, margin: '0 auto' }}>
        <GhostText text="BLOG" style={{ position: 'absolute', top: '-3rem', right: '-1rem', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-muted)' }}>— Blog</p>
          </ScrollReveal>
          <ScrollReveal variant="mask" delay={0.05}>
            <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(3rem, 10vw, 6.5rem)', lineHeight: 0.92, color: 'var(--rafa-text)', marginTop: '1rem' }}>
              Historias detrás<br />de las canciones
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.12}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', lineHeight: 1.6, color: 'var(--rafa-muted)', maxWidth: '52ch', margin: '1.4rem 0 3rem' }}>
              Soy Rafa Trujillo. Aquí cuento de dónde sale cada canción, cómo se graba un disco desde casa y qué viene en <span style={{ color: 'var(--rafa-text)' }}>Mosquito Beach</span>.
            </p>
          </ScrollReveal>

          {first && (
            <ScrollReveal variant="image">
              <div><PostTile post={first} large /></div>
            </ScrollReveal>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ marginTop: '1.25rem' }}>
            {rest.map((p, i) => <ScrollReveal key={p.slug} delay={i * 0.08}><PostTile post={p} /></ScrollReveal>)}
          </div>
        </div>
      </div>
    </section>
  )
}
