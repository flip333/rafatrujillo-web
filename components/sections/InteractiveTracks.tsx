'use client'

import { useState }            from 'react'
import Image                   from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { ScrollReveal }        from '@/components/shared/ScrollReveal'
import { SpotifyEmbed }        from '@/components/shared/SpotifyEmbed'
import { FEATURED_TRACKS, ARTIST } from '@/lib/artist-data'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

export function InteractiveTracks() {
  const [selected, setSelected] = useState(0)
  const track = FEATURED_TRACKS[selected]

  return (
    <section className="py-20 px-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <ScrollReveal>
        <p style={{ ...LABEL_STYLE, marginBottom: '1.25rem' }}>— Canciones</p>
      </ScrollReveal>

      <ScrollReveal delay={0.08}>
        <h2
          className="uppercase leading-none mb-10"
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            color: 'var(--rafa-text)',
          }}
        >
          Escuchar
        </h2>
      </ScrollReveal>

      {/* Cover art visible only on mobile, above the list */}
      <div className="block lg:hidden mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ maxWidth: 280, margin: '0 auto' }}
          >
            <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
              <Image
                src={track.cover}
                alt={track.title}
                fill
                sizes="280px"
                className="photo-bw object-cover"
                priority={selected === 0}
              />
            </div>
            <div className="mt-3 text-center">
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  color: 'var(--rafa-text)',
                  fontWeight: 500,
                }}
              >
                {track.title}
              </p>
              <p style={{ ...LABEL_STYLE, marginTop: '0.25rem', color: 'var(--rafa-accent)' }}>
                {track.year}
                {track.plays ? ` · ${track.plays} reprod.` : ''}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">

        {/* Track list */}
        <div
          className="lg:col-span-3"
          style={{ borderTop: '1px solid var(--rafa-border)' }}
        >
          {FEATURED_TRACKS.map((t, i) => (
            <motion.button
              key={t.title}
              onClick={() => setSelected(i)}
              className="track-row w-full text-left"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem 0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                backgroundColor: selected === i ? 'var(--rafa-surface-2)' : 'transparent',
                transition: 'background-color 120ms ease',
              }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Number */}
              <span
                className="track-num"
                style={{
                  fontSize: '0.7rem',
                  color: selected === i ? 'var(--rafa-accent)' : 'var(--rafa-muted)',
                  fontFamily: 'var(--font-inter)',
                  width: '1.4rem',
                  textAlign: 'right',
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 120ms ease',
                }}
              >
                {selected === i ? '▶' : String(i + 1).padStart(2, '0')}
              </span>

              {/* Thumbnail — hidden on very small screens */}
              <div
                className="hidden sm:block"
                style={{
                  width: 44,
                  height: 44,
                  position: 'relative',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={t.cover}
                  alt={t.title}
                  fill
                  sizes="44px"
                  className="photo-bw object-cover"
                />
              </div>

              {/* Title + year */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: selected === i ? 'var(--rafa-text)' : 'var(--rafa-text)',
                    fontFamily: 'var(--font-inter)',
                    fontWeight: selected === i ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.title}
                </p>
                <p
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--rafa-muted)',
                    fontFamily: 'var(--font-inter)',
                    marginTop: '0.15rem',
                  }}
                >
                  {t.year}
                </p>
              </div>

              {/* Plays */}
              {t.plays && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--rafa-muted)',
                    fontFamily: 'var(--font-inter)',
                    flexShrink: 0,
                    display: 'none',
                  }}
                  className="plays-count"
                >
                  {t.plays}
                </span>
              )}

              {/* Active bar */}
              {selected === i && (
                <motion.div
                  layoutId="active-bar"
                  style={{
                    width: 2,
                    height: '70%',
                    backgroundColor: 'var(--rafa-accent)',
                    flexShrink: 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Cover art — desktop only, sticky */}
        <div
          className="hidden lg:flex lg:col-span-2 flex-col gap-5"
          style={{ position: 'sticky', top: '6rem' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '1/1',
                  width: '100%',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={track.cover}
                  alt={track.title}
                  fill
                  sizes="(min-width: 1024px) 360px, 0px"
                  className="photo-bw object-cover"
                  priority={selected === 0}
                />
              </div>

              <div className="mt-4">
                <p
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontStyle: 'italic',
                    fontSize: '1.05rem',
                    color: 'var(--rafa-text)',
                    lineHeight: 1.4,
                  }}
                >
                  {track.title}
                </p>
                <div
                  className="flex items-center gap-3 mt-2"
                  style={{ flexWrap: 'wrap' }}
                >
                  <span style={{ ...LABEL_STYLE, color: 'var(--rafa-accent)' }}>
                    {track.year}
                  </span>
                  {track.plays && (
                    <span style={{ ...LABEL_STYLE }}>
                      {track.plays} reprod.
                    </span>
                  )}
                </div>
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-spotify"
                  style={{ marginTop: '1.25rem', display: 'inline-flex' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.312a.75.75 0 01-1.031.249c-2.824-1.726-6.376-2.117-10.562-1.159a.75.75 0 01-.333-1.463c4.579-1.045 8.51-.594 11.678 1.342a.75.75 0 01.248 1.031zm1.472-3.275a.937.937 0 01-1.288.309C14.956 12.363 10.9 11.68 6.93 12.8a.938.938 0 01-.459-1.817c4.388-1.107 8.843-.354 12.207 1.766a.937.937 0 01.31 1.288zm.127-3.409C15.9 8.273 10.537 8.083 7.15 9.068a1.125 1.125 0 01-.634-2.156c3.907-1.15 10.401-.928 14.5 1.641a1.125 1.125 0 01-1.901.875z"/>
                  </svg>
                  Escuchar
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Spotify embed */}
      <div className="mt-12">
        <ScrollReveal delay={0.1}>
          <SpotifyEmbed src={ARTIST.urls.spotifyEmbed} height={152} />
        </ScrollReveal>
      </div>
    </section>
  )
}
