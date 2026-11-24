'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/* Recarga los datos del servidor cada `seconds` mientras la pestaña está visible
   (y al volver a ella), sin recargar la página ni perder el scroll. */
export function LiveRefresh({ seconds = 30, generatedAt }: { seconds?: number; generatedAt?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [paused, setPaused] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (paused) return
    const tick = () => { if (document.visibilityState === 'visible') start(() => router.refresh()) }
    const id = window.setInterval(tick, seconds * 1000)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [router, seconds, paused])

  // La hora se pinta solo en el cliente (el formato de Intl difiere entre Node y el navegador)
  const time = mounted && generatedAt
    ? new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(generatedAt))
    : ''

  return (
    <button
      type="button"
      onClick={() => setPaused(p => !p)}
      title={paused ? 'Reanudar actualización automática' : `Se actualiza solo cada ${seconds} s. Clic para pausar`}
      className="flex items-center gap-2 px-3 py-2"
      style={{ border: '1px solid var(--rafa-border)', background: 'transparent', color: 'var(--rafa-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
    >
      <span
        aria-hidden="true"
        className={paused ? undefined : 'live-dot'}
        style={{ width: 8, height: 8, borderRadius: 99, background: paused ? 'var(--rafa-muted)' : pending ? 'var(--rafa-accent)' : '#7fbf8e' }}
      />
      {paused ? 'Pausado' : 'En vivo'}{time && <span style={{ opacity: 0.75 }}>· {time}</span>}
    </button>
  )
}
