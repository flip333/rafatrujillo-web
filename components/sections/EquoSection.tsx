import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { EQUO }         from '@/lib/artist-data'

const LABEL: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

export function EquoSection() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">
        {/* Texto */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ScrollReveal>
            <p style={{ ...LABEL, marginBottom: '0.25rem' }}>— La agrupación</p>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <h2
              className="uppercase leading-none"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                color: 'var(--rafa-text)',
              }}
            >
              {EQUO.name}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.16}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'var(--rafa-muted)',
                maxWidth: 640,
              }}
            >
              {EQUO.name} es una agrupación formada por{' '}
              <span style={{ color: 'var(--rafa-accent)' }}>Sergio Hoyos</span> y
              rafatrujillo, con el cual inició todo su camino musical. El grupo lanzó
              el sencillo <em style={{ color: 'var(--rafa-text)' }}>"Nombre y Apellido"</em>{' '}
              en 2021, antes de disolverse temporalmente. En 2024 se reúnen para lanzar
              su segundo sencillo,{' '}
              <em style={{ color: 'var(--rafa-text)' }}>"El Flamenquillo"</em>, ambos
              producidos por{' '}
              <span style={{ color: 'var(--rafa-accent)' }}>{EQUO.producer}</span>. El
              grupo se ha mantenido activo de manera esporádica, y actualmente se
              prepara para dar a conocer su nuevo sencillo{' '}
              <em style={{ color: 'var(--rafa-text)' }}>"Borracho y Loco"</em>.
            </p>
          </ScrollReveal>
        </div>

        {/* Sencillos */}
        <div className="lg:col-span-2">
          <ScrollReveal delay={0.12}>
            <p style={{ ...LABEL, marginBottom: '1rem' }}>Sencillos</p>
            <div style={{ borderTop: '1px solid var(--rafa-border)' }}>
              {EQUO.singles.map(single => (
                <div
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
                      color: single.status === 'próximo' ? 'var(--rafa-accent)' : 'var(--rafa-muted)',
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    {single.year ?? 'Próximo'}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
