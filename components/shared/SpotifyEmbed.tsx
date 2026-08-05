interface Props {
  src: string
  height?: number
  className?: string
}

export function SpotifyEmbed({ src, height = 352, className = '' }: Props) {
  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style={{ borderRadius: '10px', border: 'none', display: 'block' }}
      className={className}
    />
  )
}
