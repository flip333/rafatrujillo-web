import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { POSTS, getPost, sortedPosts, readingMinutes, fmtPostDate, postUrl, plainText, type Post } from '@/lib/blog'
import { ARTIST } from '@/lib/artist-data'
import { PostBody } from '@/components/blog/PostBody'
import { PostToc, PostShare, ReadMarker } from '@/components/blog/PostAside'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { PostTile } from '@/components/blog/PostTile'

const SITE = 'https://rafatrujillo.xyz'

export const dynamicParams = false
export function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPost((await params).slug)
  if (!p) return {}
  return {
    title: p.seoTitle,
    description: p.description,
    keywords: p.keywords,
    authors: [{ name: 'Rafa Trujillo', url: SITE }],
    alternates: { canonical: postUrl(p) },
    openGraph: {
      type: 'article',
      title: p.title,
      description: p.description,
      url: postUrl(p),
      siteName: 'rafatrujillo',
      locale: 'es_CO',
      publishedTime: p.date,
      modifiedTime: p.updated ?? p.date,
      authors: ['Rafa Trujillo'],
      section: p.category,
      tags: p.keywords,
      images: [{ url: p.cover, alt: p.coverAlt }],
    },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description, images: [p.cover] },
  }
}

function jsonLd(p: Post) {
  const url = `${SITE}${postUrl(p)}`
  const faq = p.blocks.find(b => b.t === 'faq')
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#post`,
      headline: p.title,
      description: p.description,
      image: `${SITE}${p.cover}`,
      datePublished: p.date,
      dateModified: p.updated ?? p.date,
      inLanguage: 'es-CO',
      keywords: p.keywords.join(', '),
      articleSection: p.category,
      mainEntityOfPage: url,
      author: { '@type': 'Person', name: 'Rafa Trujillo', alternateName: 'rafatrujillo', url: SITE, sameAs: [ARTIST.urls.spotify, ARTIST.urls.instagram, ARTIST.urls.youtube] },
      publisher: { '@type': 'Person', name: 'rafatrujillo', url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: p.title, item: url },
      ],
    },
  ]
  if (faq?.t === 'faq') {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plainText(a) } })),
    })
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug)
  if (!p) notFound()

  const minutes = readingMinutes(p)
  const toc = p.blocks.flatMap(b => (b.t === 'h2' ? [{ id: b.id, text: b.text }] : []))
  const more = sortedPosts().filter(x => x.slug !== p.slug).slice(0, 2)
  const words = p.title.split(' ')

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(p) }} />

      {/* ── Portada ── */}
      <header className="post-hero">
        <div className="post-hero-media" aria-hidden="true">
          <Image src={p.cover} alt="" fill priority sizes="100vw" className="post-hero-img object-cover" style={{ objectPosition: p.coverPosition ?? 'center' }} />
        </div>
        <div className="relative w-full px-6" style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 'clamp(3rem, 8vh, 6rem)', paddingTop: '8rem' }}>
          <nav aria-label="Ruta" className="hero-fade" style={{ '--d': '0.1s', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(240,236,228,0.7)' } as React.CSSProperties}>
            <Link href="/" className="lyrics-link">Inicio</Link>
            <span aria-hidden="true" style={{ margin: '0 0.6rem' }}>/</span>
            <Link href="/blog" className="lyrics-link">Blog</Link>
          </nav>
          <p className="hero-fade" style={{ '--d': '0.25s', marginTop: '1.4rem', fontSize: '0.7rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--rafa-accent)' } as React.CSSProperties}>
            — {p.category}
          </p>
          <h1 className="post-hero-title" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.5rem, 5.4vw, 4.8rem)', lineHeight: 0.95, color: 'var(--rafa-text)', marginTop: '0.8rem', maxWidth: '22ch' }}>
            {words.map((w, i) => (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.06em' }}>
                <span className="hero-letter" style={{ '--i': i * 2.2 } as React.CSSProperties}>{w}</span>{i < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <p className="hero-fade" style={{ '--d': '0.9s', fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: 'clamp(1.05rem, 2vw, 1.35rem)', lineHeight: 1.5, color: 'rgba(240,236,228,0.88)', marginTop: '1.4rem', maxWidth: '46ch' } as React.CSSProperties}>
            {p.dek}
          </p>
          <p className="hero-fade flex flex-wrap gap-x-4 gap-y-1" style={{ '--d': '1.1s', marginTop: '1.6rem', fontSize: '0.78rem', color: 'rgba(240,236,228,0.7)' } as React.CSSProperties}>
            <span>Por <strong style={{ color: 'var(--rafa-text)', fontWeight: 500 }}>Rafa Trujillo</strong></span>
            <span aria-hidden="true">·</span>
            <time dateTime={p.date}>{fmtPostDate(p.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{minutes} min de lectura</span>
          </p>
        </div>
      </header>

      {/* ── Texto ── */}
      <div className="px-6" style={{ paddingTop: 'clamp(2.5rem, 6vw, 4.5rem)', paddingBottom: '4rem' }}>
        <div className="post-layout">
          <PostToc items={toc} />
          <div className="post-col">
            <PostBody blocks={p.blocks} />
            <ReadMarker slug={p.slug} />

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--rafa-border)' }}>
              <PostShare title={p.title} slug={p.slug} />
            </div>

            {/* Autor */}
            <ScrollReveal>
              <aside className="post-card flex flex-col sm:flex-row gap-5 items-start" style={{ marginTop: '2.5rem' }} aria-label="Sobre el autor">
                <div className="relative shrink-0 overflow-hidden" style={{ width: 88, height: 88, borderRadius: '50%' }}>
                  <Image src="/fotos/foto-press-01.jpg" alt="Rafa Trujillo, músico y compositor colombiano" fill sizes="88px" className="object-cover" style={{ objectPosition: 'center 20%' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.66rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-accent)' }}>Escrito por</p>
                  <p style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', lineHeight: 1.05, color: 'var(--rafa-text)', marginTop: '0.2rem' }}>Rafa Trujillo · rafatrujillo</p>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--rafa-muted)', marginTop: '0.5rem' }}>
                    Artista, compositor, productor y multiinstrumentista colombiano de Manizales, con formación en cine. Escribe canciones como escenas de una historia más grande.
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3" style={{ fontSize: '0.8rem' }}>
                    <Link href="/#discografia" className="post-link">Escuchar su música</Link>
                    <a href={ARTIST.urls.spotify} target="_blank" rel="noopener noreferrer" className="post-link">Spotify ↗</a>
                    <a href={ARTIST.urls.instagram} target="_blank" rel="noopener noreferrer" className="post-link">Instagram ↗</a>
                  </div>
                </div>
              </aside>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* ── Sigue leyendo ── */}
      {more.length > 0 && (
        <section aria-labelledby="sigue-leyendo" className="px-6" style={{ paddingTop: '4rem', paddingBottom: '6rem', borderTop: '1px solid var(--rafa-border)', background: 'var(--rafa-surface)' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-muted)' }}>— Blog</p>
            </ScrollReveal>
            <ScrollReveal variant="mask">
              <h2 id="sigue-leyendo" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', lineHeight: 1, color: 'var(--rafa-text)', margin: '0.8rem 0 2rem' }}>Sigue leyendo</h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {more.map((m, i) => <ScrollReveal key={m.slug} delay={i * 0.08}><PostTile post={m} /></ScrollReveal>)}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
