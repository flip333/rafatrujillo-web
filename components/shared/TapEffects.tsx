'use client'

import { useEffect } from 'react'

const SELECTOR = '.btn-play, .btn-spotify, .btn-apple, .btn-subscribe, .track-row, .single-card-img, .service-card, .lite-yt, .tap-ripple'

/* Respuesta táctil: onda que nace donde se toca/clica (botones, canciones,
   portadas, tarjetas). Un solo listener delegado; la onda es CSS (.ripple). */
export function TapEffects() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element)?.closest?.(SELECTOR) as HTMLElement | null
      if (!el || (el as HTMLButtonElement).disabled) return
      const r = el.getBoundingClientRect()
      const size = Math.max(r.width, r.height) * 2
      const dot = document.createElement('span')
      dot.className = 'ripple'
      dot.setAttribute('aria-hidden', 'true')
      dot.style.width = dot.style.height = `${size}px`
      dot.style.left = `${e.clientX - r.left - size / 2}px`
      dot.style.top = `${e.clientY - r.top - size / 2}px`
      el.appendChild(dot)
      dot.addEventListener('animationend', () => dot.remove(), { once: true })
    }
    document.addEventListener('pointerdown', onDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  return null
}
