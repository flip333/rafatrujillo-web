'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { ScrollReveal }  from '@/components/shared/ScrollReveal'
import { SpotifyEmbed }  from '@/components/shared/SpotifyEmbed'
import { StreamingLinks } from '@/components/shared/StreamingLinks'
import { LyricsModal, type LyricsModalData } from '@/components/shared/LyricsModal'
import {
  ALBUM_DEBUT, EP_01, SINGLES, ARTIST, ALBUM_CREDITS,
  getLyrics, isInstrumental,
} from '@/lib/artist-data'

const LABEL: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--rafa-muted)',
  fontFamily: 'var(--font-inter)',
}

const SUBHEAD: React.CSSProperties = {
  fontFamily: 'var(--font-bebas)',
  color: 'var(--rafa-text)',
  textTransform: 'uppercase',
  lineHeight: 0.95,
}

export function Discography() {
  const [modal, setModal] = useState<LyricsModalData | null>(null)
  const close = useCallback(() => setModal(null), [])

  const openSong = (title: string, meta: string) =>
    setModal({
      title,
      meta,
      body: getLyrics(title),
      variant: 'lyrics',
      instrumental: isInstrumental(title),
    })

  const openCredits = () =>
    setModal({
      title: 'Créditos',
      meta: 'Ya no es mi canción, y otras películas',
      body: ALBUM_CREDITS,
      variant: 'credits',
    })

  return (
    <>
      {/* Encabezado */}
      <ScrollReveal>
        <p style={{ ...LABEL, marginBottom: '0.75rem' }}>— Discografía</p>
      </ScrollReveal>
      <ScrollReveal delay={0.06}>
        <h2
          style={{
            ...SUBHEAD,
            fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
            marginBottom: '0.5rem',
          }}
        >
          Escucha y lee
        </h2>
      </ScrollReveal>
      <ScrollReveal delay={0.12}>
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontStyle: 'italic',
            fontSize: 'clamp(1rem, 2.2vw, 1.3rem)',
            color: 'var(--rafa-muted)',
            marginBottom: '3.5rem',
            maxWidth: 560,
          }}
        >
          Toca cualquier canción para leer su letra.
        </p>
      </ScrollReveal>

      {/* ── Álbum ── */}
      <span
        className="inline-block mb-8 px-2 py-1 text-[0.6rem] tracking-widest uppercase"
        style={{
          color: 'var(--rafa-accent)',
          border: '1px solid rgba(200,176,138,0.35)',
          fontFamily: 'var(--font-inter)',
        }}
      >
        Álbum debut · {ALBUM_DEBUT.year}
      </span>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start mb-24">
        {/* Portada */}
        <ScrollReveal delay={0.1} className="media-clean">
          <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', overflow: 'hidden' }}>
            <Image
              src={ALBUM_DEBUT.cover}
              alt={ALBUM_DEBUT.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </ScrollReveal>

        {/* Tracklist interactivo */}
        <ScrollReveal delay={0.18}>
          <div>
            <h3
              className="mb-2"
              style={{ ...SUBHEAD, fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              {ALBUM_DEBUT.title}
            </h3>
            <p className="mb-6" style={{ ...LABEL, color: 'var(--rafa-accent)' }}>
              8 canciones
            </p>

            <div style={{ borderTop: '1px solid var(--rafa-border)' }}>
              {ALBUM_DEBUT.tracks.map(t => (
                <TrackButton
                  key={t.n}
                  index={t.n}
                  title={t.title}
                  onClick={() => openSong(t.title, `Álbum · ${ALBUM_DEBUT.year}`)}
                />
              ))}
            </div>

            <div className="mt-8 space-y-5">
              <StreamingLinks />
              <button
                onClick={openCredits}
                className="lyrics-link"
                style={{
                  ...LABEL,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--rafa-muted)',
                }}
              >
                Ver créditos →
              </button>
              <SpotifyEmbed src={ARTIST.urls.spotifyEmbed} height={152} />
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ── EP ── */}
      <ScrollReveal>
        <p style={{ ...LABEL, marginBottom: '1.5rem' }}>— EP</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-24" style={{ maxWidth: 680 }}>
        <ScrollReveal delay={0.1} className="media-clean">
          <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', overflow: 'hidden' }}>
            <Image
              src={EP_01.cover}
              alt={EP_01.title}
              fill
              sizes="(min-width: 640px) 340px, 100vw"
              className="object-cover"
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.16}>
          <div className="flex flex-col justify-center h-full">
            <h3 className="mb-1" style={{ ...SUBHEAD, fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
              {EP_01.title}
            </h3>
            <p style={{ ...LABEL, color: 'var(--rafa-accent)', marginBottom: '1rem' }}>
              {EP_01.year}
            </p>
            <div style={{ borderTop: '1px solid var(--rafa-border)' }}>
              {EP_01.tracks.map((t, i) => (
                <TrackButton
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  onClick={() => openSong(t.title, `EP · ${EP_01.year}`)}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ── Singles ── */}
      <ScrollReveal>
        <p style={{ ...LABEL, marginBottom: '2rem' }}>— Sencillos</p>
      </ScrollReveal>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SINGLES.map((s, i) => (
          <ScrollReveal key={s.title} delay={(i % 4) * 0.05} className="media-clean">
            <button
              onClick={() => openSong(s.title, `Sencillo · ${s.year}`)}
              className="single-card-img group"
              aria-label={`Ver letra de ${s.title}`}
              style={{
                position: 'relative',
                aspectRatio: '1/1',
                overflow: 'hidden',
                width: '100%',
                display: 'block',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: 'var(--rafa-surface)',
              }}
            >
              <Image
                src={s.cover}
                alt={s.title}
                fill
                sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
              <div
                className="single-cover-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0) 55%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '0.75rem',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--rafa-text)',
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {s.title}
                </p>
                <p
                  style={{
                    fontSize: '0.58rem',
                    color: 'var(--rafa-accent)',
                    fontFamily: 'var(--font-inter)',
                    marginTop: '0.2rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Ver letra →
                </p>
              </div>
            </button>
          </ScrollReveal>
        ))}
      </div>

      <LyricsModal data={modal} onClose={close} />
    </>
  )
}

/* Fila de canción clickeable */
function TrackButton({ index, title, onClick }: { index: number; title: string; onClick: () => void }) {
  const instr = isInstrumental(title)
  return (
    <button
      onClick={onClick}
      className="track-row lyrics-row flex items-center gap-4 py-3 w-full text-left"
      style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--rafa-border)' }}
    >
      <span
        className="track-num"
        style={{
          fontSize: '0.7rem',
          color: 'var(--rafa-muted)',
          fontFamily: 'var(--font-inter)',
          width: '1.25rem',
          textAlign: 'right',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(index).padStart(2, '0')}
      </span>
      <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)' }}>
        {title}
      </span>
      <span
        className="lyrics-hint text-[0.58rem] tracking-widest uppercase"
        style={{
          color: 'var(--rafa-accent)',
          fontFamily: 'var(--font-inter)',
          flexShrink: 0,
        }}
      >
        {instr ? 'Instr.' : 'Letra →'}
      </span>
    </button>
  )
}
