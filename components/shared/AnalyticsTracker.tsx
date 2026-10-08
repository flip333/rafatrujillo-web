'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

const SECTIONS = ['lanzamiento', 'discografia', 'videos', 'sobre', 'equo', 'fechas', 'prensa', 'preguntas', 'contacto']

const PLATFORMS: [RegExp, string][] = [
  [/spotify\.com/, 'spotify'],
  [/music\.apple\.com/, 'apple'],
  [/youtube\.com|youtu\.be/, 'youtube'],
  [/instagram\.com/, 'instagram'],
]

/* Métricas automáticas sin tocar cada componente:
   page_view · scroll_depth (25/50/75/100) · section_view · outbound_click */
export function AnalyticsTracker() {
  useEffect(() => {
    track('page_view')

    // Profundidad de scroll
    const marks = new Set<number>()
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = (window.scrollY / max) * 100
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m - 1 && !marks.has(m)) {
          marks.add(m)
          track('scroll_depth', { depth: m })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Secciones vistas (una vez cada una)
    const seen = new Set<string>()
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting && !seen.has(e.target.id)) {
            seen.add(e.target.id)
            track('section_view', { section: e.target.id })
          }
        }
      },
      { threshold: 0.3 },
    )
    SECTIONS.forEach(id => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })

    // Clics a plataformas externas (delegado)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest?.('a[href^="http"]') as HTMLAnchorElement | null
      if (!a) return
      const platform = PLATFORMS.find(([re]) => re.test(a.href))?.[1] ?? 'other'
      const place = a.closest('section, footer, nav')?.id || a.closest('footer, nav')?.tagName.toLowerCase() || 'page'
      track('outbound_click', { platform, place })
    }
    document.addEventListener('click', onClick, { capture: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      document.removeEventListener('click', onClick, { capture: true })
    }
  }, [])

  return null
}
