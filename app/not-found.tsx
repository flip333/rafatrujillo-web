import Link from 'next/link'
import Image from 'next/image'
import { ARTIST } from '@/lib/artist-data'

/* 404 con la estética del sitio. */
export default function NotFound() {
  return (
    <section className="relative w-full overflow-hidden flex items-end" style={{ minHeight: '100svh' }}>
      <Image src={ARTIST.images.hero} alt="" fill sizes="100vw" className="object-cover hero-photo" style={{ opacity: 0.35 }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.3), #0a0a0a 85%)' }} />
      <div className="relative w-full px-6 pb-16" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-type)', fontWeight: 700, fontSize: 'clamp(5rem, 22vw, 14rem)', lineHeight: 0.9, color: 'var(--rafa-text)', letterSpacing: '-0.04em' }}>
          404
        </p>
        <h1 className="mt-4" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: 'var(--rafa-accent)' }}>
          Esta página ya no es mi canción.
        </h1>
        <p className="mt-2" style={{ fontFamily: 'var(--font-inter)', color: 'var(--rafa-muted)' }}>
          La página que buscas no existe o cambió de lugar. · <span lang="en">This page doesn’t exist.</span>
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/" className="btn-play">Volver al inicio</Link>
          <Link href="/#discografia" className="btn-apple">Escuchar la música</Link>
        </div>
      </div>
    </section>
  )
}
