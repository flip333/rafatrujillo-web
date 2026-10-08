'use client'

import { useEffect, useRef, useState } from 'react'

export const CURSOR_KEY = 'rafa-cursor'   // 'classic' = cursor del sistema

interface Particle {
  x: number
  y: number
  alpha: number
  size: number
}

/* Cursor con estela dibujado en canvas.
   - Se oculta al entrar a un iframe (YouTube/Spotify): ahí la página deja de
     recibir mousemove y el punto quedaba congelado en el borde del video.
   - Se desactiva en pantallas táctiles y con prefers-reduced-motion.
   - El bucle de animación se detiene cuando no hay nada que dibujar. */
/* Respeta la preferencia de la persona (selector en el footer). */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const read = () => {
      try { setEnabled(localStorage.getItem(CURSOR_KEY) !== 'classic') } catch { setEnabled(true) }
    }
    read()
    window.addEventListener('rafa:cursor', read)
    return () => window.removeEventListener('rafa:cursor', read)
  }, [])
  return enabled ? <CursorCanvas /> : null
}

function CursorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const mouse = { x: -200, y: -200 }
    const particles: Particle[] = []
    let rafId = 0
    let running = false
    let isVisible = false

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const start = () => {
      if (!running) {
        running = true
        rafId = requestAnimationFrame(draw)
      }
    }

    const hide = () => {
      isVisible = false
      particles.length = 0
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight) // limpia ya, sin esperar un frame
    }

    const onMouseMove = (e: MouseEvent) => {
      if ((e.target as Element)?.tagName === 'IFRAME') return hide()
      mouse.x = e.clientX
      mouse.y = e.clientY
      isVisible = true
      particles.push({ x: mouse.x, y: mouse.y, alpha: 0.8, size: Math.random() * 3 + 1.5 })
      if (particles.length > 35) particles.shift()
      start()
    }

    // El puntero salió del documento (hacia un iframe o fuera de la ventana):
    // el iframe usa su propio cursor y aquí ya no llegan eventos.
    const onMouseOut = (e: MouseEvent) => {
      const to = e.relatedTarget as Element | null
      if (!to || to.tagName === 'IFRAME') hide()
    }

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      if (isVisible) {
        particles.forEach((p, i) => {
          const progress = i / particles.length
          p.alpha *= 0.87
          const radius = p.size * progress

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2.5)
          grad.addColorStop(0, `rgba(200, 176, 138, ${p.alpha * progress})`)
          grad.addColorStop(1, 'rgba(200, 176, 138, 0)')

          ctx.beginPath()
          ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        })
        // Descarta partículas ya invisibles
        while (particles.length && particles[0].alpha < 0.01) particles.shift()

        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200, 176, 138, 0.95)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(200, 176, 138, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Seguir animando solo mientras la estela se desvanece
      if (isVisible && particles.length > 0) {
        rafId = requestAnimationFrame(draw)
      } else {
        running = false
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('blur', hide)
    document.documentElement.setAttribute('data-cursor', 'true')

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('blur', hide)
      document.documentElement.removeAttribute('data-cursor')
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99998,
      }}
      aria-hidden="true"
    />
  )
}
