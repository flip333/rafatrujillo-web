'use client'
import { motion } from 'motion/react'

interface Props {
  text: string
  reverse?: boolean
}

export function SectionDivider({ text, reverse = false }: Props) {
  const content = Array(10).fill(text).join('  ·  ') + '  ·  '

  return (
    <div
      className="overflow-hidden py-2.5"
      style={{
        borderTop: '1px solid var(--rafa-border)',
        borderBottom: '1px solid var(--rafa-border)',
        backgroundColor: 'rgba(17,17,17,0.5)',
      }}
    >
      <motion.p
        className="whitespace-nowrap"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--rafa-muted)',
          fontFamily: 'var(--font-inter, system-ui)',
        }}
      >
        {content}
      </motion.p>
    </div>
  )
}
