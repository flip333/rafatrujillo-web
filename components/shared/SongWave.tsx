/* Animación propia de cada canción: una onda de barras generada a partir del
   título (misma canción → misma forma y ritmo, en cualquier lista).
   Reposa en un perfil estático; se anima al pasar el cursor / enfocar la fila
   (.track-row:hover, .single-card-img:hover) o siempre con `playing`.
   Solo CSS: sin JS por fotograma. Con reduced-motion queda estática. */

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function songWaveBars(title: string, count: number) {
  const r = rng(hash(title.toLowerCase()))
  const tempo = 0.55 + r() * 0.7          // "bpm" de la canción: duración base del ciclo
  return Array.from({ length: count }, (_, i) => {
    const rest = 0.18 + r() * 0.5         // altura en reposo
    return {
      rest,
      peak: Math.min(1, rest + 0.35 + r() * 0.45),
      dur: +(tempo * (0.7 + r() * 0.8)).toFixed(3),
      delay: +(-(r() * tempo) - i * 0.04).toFixed(3),
    }
  })
}

export function SongWave({ title, bars = 7, playing = false, size = 'sm' }: {
  title: string
  bars?: number
  playing?: boolean
  size?: 'sm' | 'lg'
}) {
  const data = songWaveBars(title, bars)
  return (
    <span className={`song-wave song-wave--${size}${playing ? ' is-playing' : ''}`} aria-hidden="true">
      {data.map((b, i) => (
        <span
          key={i}
          style={{
            '--rest': b.rest,
            '--peak': b.peak,
            '--dur': `${b.dur}s`,
            '--delay': `${b.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </span>
  )
}
