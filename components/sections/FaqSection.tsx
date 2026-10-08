import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { FAQ } from '@/lib/faq'
import type { Locale } from '@/lib/i18n'

const COPY = {
  es: { label: '— Preguntas frecuentes', title: 'Preguntas' },
  en: { label: '— FAQ', title: 'Questions' },
}

/* Preguntas frecuentes: <details> nativo (sin JS), contenido siempre en el HTML
   (legible por buscadores e IA aunque esté plegado) + FAQPage en JSON-LD. */
export function FaqSection({ locale = 'es' }: { locale?: Locale }) {
  const c = COPY[locale]
  const items = FAQ[locale]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: items.map(i => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScrollReveal>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)', marginBottom: '0.75rem' }}>
          {c.label}
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.06} variant="mask">
        <h2 className="uppercase leading-none mb-10" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.5rem, 8vw, 5rem)', color: 'var(--rafa-text)' }}>
          {c.title}
        </h2>
      </ScrollReveal>
      <ScrollReveal variant="stagger" className="faq-list">
        {items.map(i => (
          <details key={i.q} className="faq-item">
            <summary>
              <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 500, color: 'var(--rafa-text)', lineHeight: 1.5 }}>{i.q}</h3>
              <span className="faq-icon" aria-hidden="true" />
            </summary>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--rafa-muted)', padding: '0 0 1.4rem', maxWidth: 760 }}>
              {i.a}
            </p>
          </details>
        ))}
      </ScrollReveal>
    </div>
  )
}
