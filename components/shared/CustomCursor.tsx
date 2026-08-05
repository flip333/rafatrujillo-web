'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  alpha: number
  size: number
}

export function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const mouse = { x: -200, y: -200 }
    const particles: Particle[] = []
    let rafId: number
    let isVisible = false

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      isVisible = true
      particles.push({
        x: mouse.x,
        y: mouse.y,
        alpha: 0.8,
        size: Math.random() * 3 + 1.5,
      })
      if (particles.length > 35) particles.shift()
    }

    const onMouseLeave = () => { isVisible = false }
    const onMouseEnter = () => { isVisible = true }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isVisible) {
        // Trail particles
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

        // Main dot
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200, 176, 138, 0.95)'
        ctx.fill()

        // Outer ring
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(200, 176, 138, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      rafId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)
    document.documentElement.setAttribute('data-cursor', 'true')
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
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
