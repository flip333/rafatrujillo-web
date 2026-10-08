'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { ScrollReveal }  from '@/components/shared/ScrollReveal'
import { StreamingLinks } from '@/components/shared/StreamingLinks'
import { PlayButton }    from '@/components/shared/PlayButton'
import { LyricsModal, type LyricsModalData } from '@/components/shared/LyricsModal'
import { track } from '@/lib/analytics'
import { t, type Locale } from '@/lib/i18n'
import {
  ALBUM_DEBUT, EP_01, SINGLES, ALBUM_CREDITS, LATEST_RELEASE, MOSQUITO_BEACH, SPOTIFY_URIS,
  getLyrics, isInstrumental,
} from '@/lib/artist-data'

const LABEL: React.CSSProperties = {
  fontSize: '0.7rem',
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

const BADGE = 'inline-block mb-8 px-2 py-1 text-[0.66rem] tracking-widest uppercase'
const BADGE_STYLE: React.CSSProperties = {
  color: 'var(--rafa-accent)',
  border: '1px solid rgba(200,176,138,0.35)',
  fontFamily: 'var(--font-inter)',
}

/* "Ya no es mi canción, Pt.1" → "ya-no-es-mi-cancion-pt-1" (enlace directo a la letra) */
export const songSlug = (title: string) =>
  title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function Discography({ locale = 'es' }: { locale?: Locale }) {
  const c = t(locale).disco
  const [modal, setModal] = useState<LyricsModalData | null>(null)

  // Todas las canciones con su contexto, para abrir letras desde un enlace #letra-…
  const songs = useMemo(() => {
    const m = new Map<string, { title: string; meta: string }>()
    m.set(songSlug(LATEST_RELEASE.title), { title: LATEST_RELEASE.title, meta: `${LATEST_RELEASE.credit} · ${MOSQUITO_BEACH.year}` })
    ALBUM_DEBUT.tracks.forEach(tr => m.set(songSlug(tr.title), { title: tr.title, meta: `${c.album} · ${ALBUM_DEBUT.year}` }))
    EP_01.tracks.forEach(tr => m.set(songSlug(tr.title), { title: tr.title, meta: `EP · ${EP_01.year}` }))
    SINGLES.forEach(s => { if (!m.has(songSlug(s.title))) m.set(songSlug(s.title), { title: s.title, meta: `${c.single} · ${s.year}` }) })
    return m
  }, [c.album, c.single])

  const openSong = useCallback((title: string, meta: string) => {
    track('lyrics_open', { song: title })
    const slug = songSlug(title)
    history.replaceState(null, '', `#letra-${slug}`)
    setModal({
      title,
      meta,
      body: getLyrics(title),
      variant: 'lyrics',
      instrumental: isInstrumental(title),
      shareUrl: `${location.origin}${location.pathname}#letra-${slug}`,
    })
  }, [])

  const close = useCallback(() => {
    setModal(null)
    if (location.hash.startsWith('#letra-')) history.replaceState(null, '', location.pathname + location.search)
  }, [])

  // Abrir la letra si se llega con un enlace directo (p. ej. /#letra-borracho-y-loco)
  useEffect(() => {
    const fromHash = () => {
      const h = decodeURIComponent(location.hash)
      if (!h.startsWith('#letra-')) return
      const song = songs.get(h.slice('#letra-'.length))
      if (song) openSong(song.title, song.meta)   // el modal es fijo: no hace falta desplazar
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [songs, openSong])

  const openCredits = () => {
    track('credits_open')
    setModal({ title: c.creditsTitle, meta: ALBUM_DEBUT.title, body: ALBUM_CREDITS, variant: 'credits' })
  }

  return (
    <>
      <ScrollReveal>
        <p style={{ ...LABEL, marginBottom: '0.75rem' }}>{c.label}</p>
      </ScrollReveal>
      <ScrollReveal delay={0.06} variant="mask">
        <h2 style={{ ...SUBHEAD, fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', marginBottom: '3.5rem' }}>{c.title}</h2>
      </ScrollReveal>

      {/* Álbum y EP con el mismo formato (el último sencillo vive en "Nuevo lanzamiento") */}
      <div className="flex flex-col gap-20 lg:gap-24 mb-24">
        <ReleaseBlock
          badge={`${c.firstAlbum} · ${ALBUM_DEBUT.year}`}
          title={ALBUM_DEBUT.title}
          cover={ALBUM_DEBUT.cover}
          meta={`${ALBUM_DEBUT.tracks.length} ${c.songs}`}
          hint={c.hintSongs}
          tracks={ALBUM_DEBUT.tracks.map(tr => tr.title)}
          labels={c}
          onTrack={title => openSong(title, `${c.album} · ${ALBUM_DEBUT.year}`)}
          actions={
            <>
              <div className="flex flex-wrap gap-3">
                <PlayButton uri={SPOTIFY_URIS.album} title={ALBUM_DEBUT.title} label={c.playAlbum} />
                <StreamingLinks />
              </div>
              <button
                onClick={openCredits}
                className="lyrics-link"
                style={{ ...LABEL, background: 'none', border: 'none', padding: '0.75rem 0', cursor: 'pointer' }}
              >
                {c.credits}
              </button>
            </>
          }
        />

        <ReleaseBlock
          reverse
          badge={`EP · ${EP_01.year}`}
          title={EP_01.title}
          cover={EP_01.cover}
          meta={`${EP_01.tracks.length} ${c.songs}`}
          hint={c.hintSongs}
          tracks={EP_01.tracks.map(tr => tr.title)}
          labels={c}
          onTrack={title => openSong(title, `EP · ${EP_01.year}`)}
          actions={<PlayButton uri={SPOTIFY_URIS.ep} title={EP_01.title} label={c.playEp} />}
        />
      </div>

      {/* ── Sencillos ── */}
      <div className="pt-16" style={{ borderTop: '1px solid var(--rafa-border)' }}>
        <ScrollReveal>
          <span className={BADGE} style={{ ...BADGE_STYLE, marginBottom: '1rem' }}>{c.singles.replace('— ', '')}</span>
          <LyricsHint text={c.hintCovers} />
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {SINGLES.map((s, i) => (
            <ScrollReveal key={s.title} delay={(i % 4) * 0.08} variant="image" className="media-clean img-lift">
              <button
                onClick={() => openSong(s.title, `${c.single} · ${s.year}`)}
                className="single-card-img group"
                aria-label={`${c.viewLyricsOf} ${s.title}`}
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
                <Image src={s.cover} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)', fontWeight: 500, lineHeight: 1.3 }}>
                    {s.title} <span style={{ color: 'var(--rafa-muted)', fontWeight: 400 }}>· {s.year}</span>
                  </p>
                  <p
                    style={{
                      fontSize: '0.66rem',
                      color: 'var(--rafa-accent)',
                      fontFamily: 'var(--font-inter)',
                      marginTop: '0.2rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.viewLyrics}
                  </p>
                </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <LyricsModal data={modal} onClose={close} locale={locale} />
    </>
  )
}

/* Bloque de lanzamiento (álbum / EP): portada + ficha + lista de canciones.
   Mismo formato para todos; `reverse` alterna el lado de la portada. */
function ReleaseBlock({ badge, title, cover, meta, hint, tracks, labels, onTrack, actions, reverse = false }: {
  badge: string
  title: string
  cover: string
  meta: string
  hint: string
  tracks: string[]
  labels: { lyrics: string; instr: string }
  onTrack: (title: string) => void
  actions: React.ReactNode
  reverse?: boolean
}) {
  return (
    <article className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start">
      <ScrollReveal
        delay={0.05}
        variant="image"
        className={`media-clean img-lift md:sticky md:top-24 ${reverse ? 'md:order-2' : ''}`}
      >
        <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', overflow: 'hidden' }}>
          <Image src={cover} alt={`“${title}”`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      </ScrollReveal>

      <div className={reverse ? 'md:order-1' : ''}>
        <ScrollReveal delay={0.1}>
          <span className={BADGE} style={{ ...BADGE_STYLE, marginBottom: '1rem' }}>{badge}</span>
          <h3 className="mb-2" style={{ ...SUBHEAD, fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>{title}</h3>
          <p className="mb-6" style={{ ...LABEL, color: 'var(--rafa-accent)' }}>{meta}</p>
          <LyricsHint text={hint} />
        </ScrollReveal>

        <ScrollReveal delay={0.15} variant="stagger" className="track-list">
          {tracks.map((tr, i) => (
            <TrackButton key={tr} index={i + 1} title={tr} labels={labels} onClick={() => onTrack(tr)} />
          ))}
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-8 flex flex-col items-start gap-4">{actions}</div>
        </ScrollReveal>
      </div>
    </article>
  )
}

/* Indicación junto a cada lista: dónde tocar para ver la letra */
function LyricsHint({ text }: { text: string }) {
  return (
    <p
      className="flex items-center gap-2 mb-3"
      style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--rafa-muted)' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rafa-accent)" strokeWidth="1.6" aria-hidden="true">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
      {text}
    </p>
  )
}

/* Fila de canción clickeable */
function TrackButton({ index, title, onClick, labels }: {
  index: number
  title: string
  onClick: () => void
  labels: { lyrics: string; instr: string }
}) {
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
      <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--rafa-text)', fontFamily: 'var(--font-inter)' }}>{title}</span>
      <span
        className="lyrics-hint text-[0.66rem] tracking-widest uppercase"
        style={{ color: 'var(--rafa-accent)', fontFamily: 'var(--font-inter)', flexShrink: 0 }}
      >
        {instr ? labels.instr : labels.lyrics}
      </span>
    </button>
  )
}
