import { ScrollReveal }  from '@/components/shared/ScrollReveal'
import { SubscribeForm } from '@/components/shared/SubscribeForm'
import { t, type Locale } from '@/lib/i18n'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

export function EmailSignup({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).signup
  return (
    <section
      className="py-20 px-6"
      style={{
        backgroundColor: 'var(--rafa-surface)',
        borderTop: '1px solid var(--rafa-border)',
        borderBottom: '1px solid var(--rafa-border)',
      }}
    >
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <ScrollReveal>
          <p style={{ ...LABEL_STYLE, marginBottom: '1.25rem' }}>{c.label}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.08} variant="mask">
          <h2
            className="uppercase leading-tight mb-3"
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(2.2rem, 7vw, 4rem)',
              color: 'var(--rafa-text)',
            }}
          >
            {c.title}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.14}>
          <p
            className="mb-8"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'var(--rafa-muted)',
            }}
          >
            {c.text}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <SubscribeForm source="inline" locale={locale} />
        </ScrollReveal>
      </div>
    </section>
  )
}
