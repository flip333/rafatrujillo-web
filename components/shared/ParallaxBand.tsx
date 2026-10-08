'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { ScrollReveal } from './ScrollReveal'
import { Rich } from './Rich'

interface Props {
  src: string
  quote: string           // admite marcas de Rich (*cursiva*, **acento**)
  cite?: string
  position?: string       // object-position de la foto
}

/* Banda a pantalla completa con foto en parallax y frase destacada.
   - Navegadores con CSS scroll-driven animations (Chrome/Edge/Android, Safari 26):
     el movimiento es 100 % CSS (.parallax-media en globals.css).
   - Resto (p. ej. iOS anterior): fallback con un único requestAnimationFrame. */
export function ParallaxBand({ src, quote, cite, position = 'center' }: Props) {
  const band = useRef<HTMLElement>(null)
  const media = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (CSS.supports('animation-timeline: view()')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const el = band.current, m = media.current
      if (!el || !m) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      if (r.bottom < 0 || r.top > vh) return
      const progress = (vh - r.top) / (vh + r.height)        // 0 → 1 mientras cruza la pantalla
      m.style.transform = `translate3d(0, ${(progress - 0.5) * 24}%, 0)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={band} className="parallax-band relative overflow-clip" aria-label={cite ?? undefined}>
      <div ref={media} className="parallax-media absolute inset-x-0" aria-hidden="true">
        <Image src={src} alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: position }} />
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0a0a0a 0%, rgba(10,10,10,0.35) 22%, rgba(10,10,10,0.45) 70%, #0a0a0a 100%)' }} />

      <div className="relative h-full flex items-center px-6">
        <figure style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <ScrollReveal variant="words">
            <blockquote
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontSize: 'clamp(1.6rem, 4.6vw, 3.4rem)',
                lineHeight: 1.25,
                color: 'var(--rafa-text)',
                textShadow: '0 2px 24px rgba(0,0,0,0.5)',
              }}
            >
              <Rich text={quote} words emStyle={{ fontStyle: 'normal', color: 'var(--rafa-accent)' }} />
            </blockquote>
          </ScrollReveal>
          {cite && (
            <ScrollReveal delay={0.5}>
              <figcaption
                className="mt-6"
                style={{ fontFamily: 'var(--font-type)', fontSize: '0.95rem', color: 'var(--rafa-accent)' }}
              >
                — {cite}
              </figcaption>
            </ScrollReveal>
          )}
        </figure>
      </div>
    </section>
  )
}
