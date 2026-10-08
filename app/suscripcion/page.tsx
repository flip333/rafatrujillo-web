import type { Metadata } from 'next'
import { SubscriptionAction } from './SubscriptionAction'

export const metadata: Metadata = {
  title: 'Suscripción — rafatrujillo',
  robots: { index: false, follow: false },
}

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ accion?: string; token?: string }>
}) {
  const { accion, token } = await searchParams
  const action = accion === 'baja' ? 'unsubscribe' : accion === 'confirmar' ? 'confirm' : null

  return (
    <section className="px-6 flex items-center" style={{ minHeight: '80vh', paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <p
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--rafa-muted)',
            fontFamily: 'var(--font-inter)',
            marginBottom: '1rem',
          }}
        >
          — Lista de correo
        </p>
        {action && token ? (
          <SubscriptionAction action={action} token={token} />
        ) : (
          <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--rafa-muted)' }}>
            Este enlace no es válido. <a href="/" style={{ color: 'var(--rafa-accent)' }}>Volver al inicio</a>
          </p>
        )}
      </div>
    </section>
  )
}
