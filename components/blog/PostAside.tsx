'use client'

import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics'

/* Índice lateral con la sección activa resaltada (escritorio) */
export function PostToc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id)
    }, { rootMargin: '-15% 0px -70% 0px' })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [items])

  return (
    <nav aria-label="En esta entrada" className="post-toc">
      <p style={{ fontSize: '0.66rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-muted)', marginBottom: '0.9rem' }}>En esta entrada</p>
      {items.map(i => (
        <a key={i.id} href={`#${i.id}`} aria-current={active === i.id ? 'true' : undefined}>{i.text.replace(/^\d+\.\s*/, '')}</a>
      ))}
    </nav>
  )
}

/* Compartir: menú nativo del teléfono, WhatsApp, X y copiar enlace */
export function PostShare({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const [canNative, setCanNative] = useState(false)
  useEffect(() => { setCanNative(typeof navigator !== 'undefined' && 'share' in navigator) }, [])
  const url = () => `${location.origin}/blog/${slug}`
  const BTN: React.CSSProperties = { padding: '0.6rem 1rem', border: '1px solid var(--rafa-border)', background: 'transparent', color: 'var(--rafa-text)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }

  const copy = async () => {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2200) } catch {}
    track('post_share', { post: slug, via: 'copy' })
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span style={{ fontSize: '0.66rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-muted)', marginRight: '0.4rem' }}>Compartir</span>
      {canNative && (
        <button type="button" style={BTN} className="post-btn" onClick={() => { navigator.share({ title, url: url() }).catch(() => {}); track('post_share', { post: slug, via: 'native' }) }}>Compartir…</button>
      )}
      <a className="post-btn" style={BTN} target="_blank" rel="noopener noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — https://rafatrujillo.xyz/blog/${slug}`)}`}
        onClick={() => track('post_share', { post: slug, via: 'whatsapp' })}>WhatsApp</a>
      <a className="post-btn" style={BTN} target="_blank" rel="noopener noreferrer"
        href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(`https://rafatrujillo.xyz/blog/${slug}`)}`}
        onClick={() => track('post_share', { post: slug, via: 'x' })}>X</a>
      <button type="button" style={BTN} className="post-btn" onClick={copy} aria-live="polite">{copied ? '✓ Enlace copiado' : 'Copiar enlace'}</button>
    </div>
  )
}

/* Marca "leído" cuando la persona llega al final del texto */
export function ReadMarker({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { track('post_read', { post: slug }); io.disconnect() }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [slug])
  return <div ref={ref} aria-hidden="true" />
}
