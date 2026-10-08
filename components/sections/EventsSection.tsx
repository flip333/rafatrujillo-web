import Link from 'next/link'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { EVENTS }       from '@/lib/artist-data'
import { t, type Locale } from '@/lib/i18n'

/* Próximas fechas. Devuelve null si no hay eventos futuros,
   así la sección (y su ancla en el menú) solo aparece cuando hay shows. */
export function upcomingEvents() {
  const today = new Date().toISOString().slice(0, 10)
  return EVENTS.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
}

export function EventsSection({ locale = 'es' }: { locale?: Locale }) {
  const events = upcomingEvents()
  if (events.length === 0) return null
  const c = t(locale).dates
  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
      <ul style={{ borderTop: '1px solid var(--rafa-border)' }}>
        {events.map((e, i) => (
          <ScrollReveal key={`${e.date}-${e.city}`} delay={i * 0.05}>
            <li className="grid grid-cols-[auto_1fr] sm:grid-cols-[10rem_1fr_auto] gap-x-6 gap-y-1 items-center py-5" style={{ borderBottom: '1px solid var(--rafa-border)' }}>
              <time dateTime={e.date} style={{ fontFamily: 'var(--font-type)', color: 'var(--rafa-accent)', fontSize: '0.95rem' }}>
                {fmt.format(new Date(e.date))}
              </time>
              <div>
                <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--rafa-text)', fontWeight: 500 }}>{e.city}</p>
                <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--rafa-muted)', fontSize: '0.85rem' }}>{e.venue}</p>
              </div>
              {e.ticketsUrl && (
                <Link href={e.ticketsUrl} target="_blank" rel="noopener noreferrer" className="btn-apple col-span-2 sm:col-span-1 justify-self-start sm:justify-self-end mt-2 sm:mt-0">
                  {c.tickets}
                </Link>
              )}
            </li>
          </ScrollReveal>
        ))}
      </ul>
    </div>
  )
}
