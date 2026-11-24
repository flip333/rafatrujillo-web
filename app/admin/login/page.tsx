import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ingresar — Métricas rafatrujillo',
  robots: { index: false, follow: false },
}

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <section className="px-6 flex items-center justify-center" style={{ minHeight: '100svh' }}>
      <form
        action="/api/admin/login"
        method="post"
        className="w-full flex flex-col gap-4 p-7"
        style={{ maxWidth: 380, background: 'var(--rafa-surface)', border: '1px solid var(--rafa-border)', fontFamily: 'var(--font-inter)' }}
      >
        <p style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--rafa-text)' }}>rafatrujillo</p>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '2.4rem', lineHeight: 1, color: 'var(--rafa-text)' }}>MÉTRICAS</h1>
        <label htmlFor="pw" style={{ fontSize: '0.8rem', color: 'var(--rafa-muted)' }}>Contraseña del panel</label>
        <input
          id="pw"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="email-input"
          style={{ padding: '0.85rem 1rem', background: 'var(--rafa-surface-2)', border: '1px solid var(--rafa-border)', color: 'var(--rafa-text)', fontSize: '1rem', outline: 'none' }}
        />
        {error && (
          <p role="alert" style={{ fontSize: '0.85rem', color: '#e06060' }}>
            {error === 'locked' ? 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' : 'Contraseña incorrecta.'}
          </p>
        )}
        <button type="submit" className="btn-play justify-center">Entrar</button>
        <p style={{ fontSize: '0.75rem', color: 'var(--rafa-muted)' }}>La sesión queda abierta en este dispositivo durante 1 año y se renueva sola cada vez que usas el panel. Para cerrarla, usa “Salir”.</p>
      </form>
    </section>
  )
}
