import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { Rich }         from '@/components/shared/Rich'
import { EQUO }         from '@/lib/artist-data'
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

export function EquoSection({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).equo

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ScrollReveal>
            <p style={{ ...LABEL, marginBottom: '0.25rem' }}>{c.label}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.08} variant="mask">
            <h2
              className="leading-none"
              style={{
                fontFamily: 'var(--font-type)',
                fontWeight: 700,
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                letterSpacing: '-0.02em',
                color: 'var(--rafa-text)',
              }}
            >
              {EQUO.name}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.16}>
            <div className="flex flex-col gap-5" style={BODY}>
              {c.body.map((p, i) => (
                <p key={i} style={i === 0 ? { color: 'var(--rafa-text)' } : undefined}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <div className="lg:col-span-2">
          <ScrollReveal delay={0.12}>
            <h3 style={{ ...LABEL, marginBottom: '1rem' }}>{c.singles}</h3>
            <ul style={{ borderTop: '1px solid var(--rafa-border)' }}>
              {EQUO.singles.map(single => (
                <li
                  key={single.title}
                  className="flex items-baseline justify-between gap-4 py-3"
                  style={{ borderBottom: '1px solid var(--rafa-border)' }}
                >
                  <span style={{ fontSize: '0.9rem', color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)' }}>
                    {single.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: single.year === 2026 ? 'var(--rafa-accent)' : 'var(--rafa-muted)',
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '0.1em',
                      flexShrink: 0,
                    }}
                  >
                    {single.year}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
