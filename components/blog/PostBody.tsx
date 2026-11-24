import Link from 'next/link'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { LiteYouTube } from '@/components/shared/LiteYouTube'
import { SubscribeForm } from '@/components/shared/SubscribeForm'
import type { Block } from '@/lib/blog'

/* Cuerpo de una entrada del blog. Columna de lectura de ~68 caracteres,
   párrafos cortos, subtítulos numerados, citas grandes y bloques de apoyo
   (ficha, video, escucha, suscripción, preguntas) que cortan el texto en
   tramos fáciles de leer. Todo aparece con las animaciones del sitio. */

const P: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.02rem, 1.2vw, 1.12rem)', lineHeight: 1.85, color: '#d9d4cb' }
const LABEL: React.CSSProperties = { fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-accent)', fontFamily: 'var(--font-inter)' }

/* **acento** · *cursiva* · [texto](enlace) */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (link) {
          const [, label, href] = link
          const external = /^https?:\/\//.test(href)
          return external
            ? <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="post-link"><Inline text={label} /></a>
            : <Link key={i} href={href} className="post-link"><Inline text={label} /></Link>
        }
        if (p.startsWith('**')) return <strong key={i} style={{ color: 'var(--rafa-text)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
        if (p.startsWith('*')) return <em key={i} style={{ color: 'var(--rafa-text)' }}>{p.slice(1, -1)}</em>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

export function PostBody({ blocks }: { blocks: Block[] }) {
  let h2 = 0
  let firstP = true
  return (
    <div className="post-body flex flex-col" style={{ gap: '1.6rem' }}>
      {blocks.map((b, k) => {
        switch (b.t) {
          case 'p': {
            const lead = firstP
            firstP = false
            return (
              <ScrollReveal key={k} y={16}>
                <p className={lead ? 'post-lead' : undefined} style={lead ? { ...P, fontSize: 'clamp(1.12rem, 1.5vw, 1.28rem)', color: 'var(--rafa-text)' } : P}>
                  <Inline text={b.text} />
                </p>
              </ScrollReveal>
            )
          }

          case 'h2': {
            h2++
            return (
              <ScrollReveal key={k} variant="mask">
                <h2 id={b.id} className="post-h2" style={{ scrollMarginTop: '6rem', marginTop: '2.2rem' }}>
                  <span aria-hidden="true" style={{ ...LABEL, display: 'block', marginBottom: '0.6rem' }}>{String(h2).padStart(2, '0')}</span>
                  <span style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2rem, 4.6vw, 3rem)', lineHeight: 1, color: 'var(--rafa-text)', letterSpacing: '0.01em' }}>{b.text.replace(/^\d+\.\s*/, '')}</span>
                </h2>
              </ScrollReveal>
            )
          }

          case 'quote':
            return (
              <ScrollReveal key={k} variant="mask">
                <figure className="post-quote">
                  <blockquote style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)', lineHeight: 1.25, color: 'var(--rafa-accent)' }}>
                    “{b.text}”
                  </blockquote>
                  {b.cite && <figcaption style={{ ...LABEL, color: 'var(--rafa-muted)', marginTop: '0.9rem' }}>— {b.cite}</figcaption>}
                </figure>
              </ScrollReveal>
            )

          case 'lyrics':
            return (
              <ScrollReveal key={k}>
                <figure className="post-lyrics">
                  <p style={{ ...LABEL, marginBottom: '0.8rem' }}>Fragmento de la letra · «{b.song}»</p>
                  <blockquote style={{ fontFamily: 'var(--font-type)', fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', lineHeight: 1.7, color: 'var(--rafa-text)' }}>
                    {b.lines.map(l => <span key={l} style={{ display: 'block' }}>{l}</span>)}
                  </blockquote>
                  {b.href && <Link href={b.href} className="post-link" style={{ display: 'inline-block', marginTop: '0.8rem', fontSize: '0.85rem' }}>Leer la letra completa →</Link>}
                </figure>
              </ScrollReveal>
            )

          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul'
            return (
              <ScrollReveal key={k} variant="stagger">
                <Tag className={`post-list ${b.ordered ? 'is-ordered' : ''}`}>
                  {b.items.map((it, i) => <li key={i} style={P}><Inline text={it} /></li>)}
                </Tag>
              </ScrollReveal>
            )
          }

          case 'facts':
            return (
              <ScrollReveal key={k}>
                <aside className="post-card" aria-label={b.title}>
                  <p style={{ ...LABEL, marginBottom: '1rem' }}>{b.title}</p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2" style={{ columnGap: '2rem' }}>
                    {b.items.map(([dt, dd]) => (
                      <div key={dt} className="flex justify-between gap-4 py-2.5" style={{ borderTop: '1px solid var(--rafa-border)' }}>
                        <dt style={{ fontSize: '0.8rem', color: 'var(--rafa-muted)' }}>{dt}</dt>
                        <dd style={{ fontSize: '0.88rem', color: 'var(--rafa-text)', textAlign: 'right' }}>{dd}</dd>
                      </div>
                    ))}
                  </dl>
                </aside>
              </ScrollReveal>
            )

          case 'video':
            return (
              <ScrollReveal key={k} variant="image">
                <figure className="post-wide">
                  <LiteYouTube id={b.id} title={b.title} hiRes playLabel="Ver video:" />
                  <figcaption style={{ fontSize: '0.78rem', color: 'var(--rafa-muted)', marginTop: '0.7rem' }}>{b.title}</figcaption>
                </figure>
              </ScrollReveal>
            )

          case 'listen':
            return (
              <ScrollReveal key={k}>
                <aside className="post-card post-listen">
                  <p style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(1.6rem, 3.4vw, 2.1rem)', lineHeight: 1, color: 'var(--rafa-text)' }}>{b.title}</p>
                  <p style={{ ...P, fontSize: '0.92rem', color: 'var(--rafa-muted)', marginTop: '0.4rem' }}>{b.text}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {b.spotify && <a href={b.spotify} target="_blank" rel="noopener noreferrer" className="btn-spotify post-btn">Spotify ↗</a>}
                    {b.apple && <a href={b.apple} target="_blank" rel="noopener noreferrer" className="post-btn">Apple Music ↗</a>}
                    {b.youtube && <a href={b.youtube} target="_blank" rel="noopener noreferrer" className="post-btn">YouTube ↗</a>}
                  </div>
                </aside>
              </ScrollReveal>
            )

          case 'callout':
            return (
              <ScrollReveal key={k}>
                <p className="post-callout" style={{ ...P, fontSize: '1rem', color: 'var(--rafa-text)' }}><Inline text={b.text} /></p>
              </ScrollReveal>
            )

          case 'subscribe':
            return (
              <ScrollReveal key={k}>
                <aside className="post-card post-subscribe" id="suscribete">
                  <p style={{ ...LABEL, marginBottom: '0.6rem' }}>— Lista de correo</p>
                  <p style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', lineHeight: 1, color: 'var(--rafa-text)' }}>{b.title}</p>
                  <p style={{ ...P, fontSize: '0.95rem', color: 'var(--rafa-muted)', margin: '0.5rem 0 1.2rem' }}>{b.text}</p>
                  <SubscribeForm source="blog" />
                </aside>
              </ScrollReveal>
            )

          case 'faq':
            return (
              <ScrollReveal key={k}>
                <section aria-labelledby={`faq-${k}`} style={{ marginTop: '2rem' }}>
                  <h2 id={`faq-${k}`} style={{ ...LABEL, marginBottom: '1rem' }}>Preguntas rápidas</h2>
                  <div style={{ borderBottom: '1px solid var(--rafa-border)' }}>
                    {b.items.map(([q, a]) => (
                      <details key={q} className="post-faq">
                        <summary>{q}</summary>
                        <p style={{ ...P, fontSize: '0.98rem', paddingBottom: '1.1rem' }}><Inline text={a} /></p>
                      </details>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )
        }
      })}
    </div>
  )
}
