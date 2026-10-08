'use client'

/* Envía una canción/álbum al reproductor global (MusicPlayer).
   Reemplaza los iframes de Spotify incrustados: nada se carga hasta tocar. */
export function PlayButton({ uri, title, label, className = 'btn-play' }: {
  uri: string
  title: string
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        navigator.vibrate?.(12) // respuesta háptica sutil en Android
        window.dispatchEvent(new CustomEvent('rafa:play', { detail: { uri, title } }))
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 4v16l13-8z" />
      </svg>
      {label}
    </button>
  )
}
