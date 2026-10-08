'use client'
import { useEffect, useRef } from 'react'

type Variant = 'up' | 'fade' | 'image' | 'mask' | 'stagger' | 'words'

interface Props {
  children: React.ReactNode
  delay?: number
  className?: string
  y?: number
  /** up: sube + aparece · fade: solo opacidad · image: cortina + zoom · mask: texto que emerge · stagger: hijos en cascada */
  variant?: Variant
}

/* Un solo IntersectionObserver para toda la página (antes: uno por elemento
   + un componente de animación JS por cada bloque). La animación es 100% CSS
   (transform/opacity/clip-path → compositor de GPU), ver .reveal en globals.css. */
let observer: IntersectionObserver | null = null

function observe(el: Element) {
  observer ??= new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          observer!.unobserve(e.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
  )
  observer.observe(el)
  return () => observer?.unobserve(el)
}

export function ScrollReveal({ children, delay = 0, className = '', y = 28, variant = 'up' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return observe(el)
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${className}`}
      style={{ '--rd': `${delay}s`, '--ry': `${y}px` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
