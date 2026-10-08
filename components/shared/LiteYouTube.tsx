'use client'
import Image from 'next/image'
import { useState } from 'react'
import { track } from '@/lib/analytics'

interface Props {
  id: string
  title: string
  priority?: boolean
  /** Usa la miniatura en alta resolución (para el video destacado). */
  hiRes?: boolean
  playLabel?: string
}

/* Fachada ligera: muestra la miniatura y solo carga el iframe de YouTube
   al hacer clic (evita ~1 MB de JS por video en la carga inicial). */
export function LiteYouTube({ id, title, priority = false, hiRes = false, playLabel = 'Reproducir video:' }: Props) {
  const [active, setActive] = useState(false)

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: '16 / 9', backgroundColor: 'var(--rafa-surface)' }}
    >
      {active ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setActive(true)
            window.dispatchEvent(new Event('rafa:pause')) // pausa el reproductor de música
            track('video_play', { video: id, title })
          }}
          aria-label={`${playLabel} ${title}`}
          className="lite-yt group absolute inset-0 w-full h-full"
          style={{ border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/${hiRes ? 'maxresdefault' : 'hqdefault'}.jpg`}
            alt=""
            fill
            sizes={hiRes ? '(min-width: 1200px) 1150px, 100vw' : '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center transition-colors duration-200 group-hover:bg-black/10"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          >
            <span
              className="flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                border: '1px solid rgba(240,236,228,0.8)',
                backgroundColor: 'rgba(10,10,10,0.55)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--rafa-text)" style={{ marginLeft: 3 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
