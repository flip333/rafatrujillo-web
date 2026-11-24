import Image from 'next/image'
import Link from 'next/link'
import { fmtPostDate, postUrl, readingMinutes, type Post } from '@/lib/blog'

/* Tarjeta de una entrada (índice del blog y "Sigue leyendo") */
export function PostTile({ post, large = false }: { post: Post; large?: boolean }) {
  return (
    <Link href={postUrl(post)} className="post-tile h-full">
      <div className="post-tile-img" style={large ? { aspectRatio: '16 / 9' } : undefined}>
        <Image src={post.cover} alt={post.coverAlt} fill sizes={large ? '(min-width: 1100px) 1100px, 100vw' : '(min-width: 768px) 560px, 100vw'} className="object-cover" style={{ objectPosition: post.coverPosition ?? 'center' }} />
      </div>
      <div style={{ padding: large ? 'clamp(1.4rem, 3vw, 2.2rem)' : '1.4rem' }}>
        <p style={{ fontSize: '0.66rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rafa-accent)' }}>
          {post.category} · {readingMinutes(post)} min
        </p>
        <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: large ? 'clamp(2rem, 4.4vw, 3.2rem)' : 'clamp(1.6rem, 3vw, 2.1rem)', lineHeight: 1, color: 'var(--rafa-text)', margin: '0.6rem 0' }}>
          {post.title}
        </h3>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--rafa-muted)', maxWidth: '60ch' }}>{post.dek}</p>
        <p className="flex justify-between items-center" style={{ marginTop: '1.1rem', fontSize: '0.78rem', color: 'var(--rafa-muted)' }}>
          <time dateTime={post.date}>{fmtPostDate(post.date)}</time>
          <span style={{ color: 'var(--rafa-accent)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.7rem' }}>Leer <span className="post-tile-arrow">→</span></span>
        </p>
      </div>
    </Link>
  )
}
