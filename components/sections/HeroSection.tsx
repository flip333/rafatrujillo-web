'use client'
import Image from 'next/image'
import { motion } from 'motion/react'
import { ARTIST, ALBUM_DEBUT } from '@/lib/artist-data'

export function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: 620, zIndex: 10000 }}
    >
      {/* Foto — zoom-out al cargar */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.07 }}
        animate={{ scale: 1.0 }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src={ARTIST.images.hero}
          alt={ARTIST.fullName}
          fill
          priority
          sizes="100vw"
          className="object-cover hero-photo"
        />
      </motion.div>

      {/* Gradient hacia abajo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.15) 45%, rgba(10,10,10,0.88) 78%, #0a0a0a 100%)',
        }}
      />

      {/* Meta top-right — Manizales · Colombia · Indie Pop-Rock */}
      <motion.div
        className="absolute top-20 right-6 text-right hidden sm:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
      >
        <p
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.26em',
            lineHeight: 2.1,
            textTransform: 'uppercase',
            color: 'rgba(240,236,228,0.45)',
            fontFamily: 'var(--font-inter)',
          }}
        >
          {ARTIST.city}<br />
          {ARTIST.country}<br />
          {ARTIST.genre}
        </p>
      </motion.div>

      {/* Contenido — bottom left */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 pb-12 sm:pb-16"
        style={{ maxWidth: 1200, margin: '0 auto', right: 'auto', width: '100%' }}
      >
        {/* Nombre del artista — tipografía brutalista */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(5rem, 19vw, 14rem)',
              lineHeight: 0.9,
              letterSpacing: '-0.01em',
              color: 'var(--rafa-text)',
              textTransform: 'uppercase',
            }}
          >
            {ARTIST.displayName}
          </motion.h1>
        </div>

        {/* Subtítulo — álbum en Playfair italic */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="mt-3 flex items-center gap-4 flex-wrap"
        >
          <p
            style={{
              fontFamily: 'var(--font-playfair)',
              fontStyle: 'italic',
              fontSize: 'clamp(0.9rem, 2.2vw, 1.3rem)',
              color: 'var(--rafa-accent)',
            }}
          >
            {ALBUM_DEBUT.title}
          </p>
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--rafa-muted)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            — {ALBUM_DEBUT.year}
          </span>
        </motion.div>
      </div>
    </section>
  )
}
