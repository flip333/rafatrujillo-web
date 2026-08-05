'use client'
import { motion, type Variants } from 'motion/react'

interface Props {
  n: number
  title: string
  year?: number
  plays?: number | null
  duration?: string | null
  exclusive?: boolean
}

export const trackListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

export const trackItemVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.38, ease: 'easeOut' } },
}

export function TrackRow({ n, title, year, plays, duration, exclusive }: Props) {
  return (
    <motion.div
      variants={trackItemVariants}
      className="track-row flex items-center gap-4 py-3 px-1"
    >
      <span
        className="track-num text-xs w-6 shrink-0 text-right tabular-nums transition-colors duration-150"
        style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter, system-ui)' }}
      >
        {String(n).padStart(2, '0')}
      </span>

      <span
        className="flex-1 text-sm truncate"
        style={{ color: 'var(--rafa-text)', fontFamily: 'var(--font-inter, system-ui)' }}
      >
        {title}
      </span>

      <div className="flex items-center gap-3 shrink-0">
        {exclusive && (
          <span
            className="hidden sm:inline-block text-[0.58rem] tracking-widest uppercase px-1.5 py-0.5"
            style={{
              color: 'var(--rafa-accent)',
              border: '1px solid rgba(200,176,138,0.35)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            nuevo
          </span>
        )}
        {year != null && (
          <span
            className="text-xs hidden md:block"
            style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}
          >
            {year}
          </span>
        )}
        {plays != null && (
          <span
            className="text-xs hidden sm:block tabular-nums w-14 text-right"
            style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}
          >
            {plays.toLocaleString()}
          </span>
        )}
        {duration && (
          <span
            className="text-xs tabular-nums w-8 text-right hidden sm:block"
            style={{ color: 'var(--rafa-muted)', fontFamily: 'var(--font-inter)' }}
          >
            {duration}
          </span>
        )}
      </div>
    </motion.div>
  )
}
