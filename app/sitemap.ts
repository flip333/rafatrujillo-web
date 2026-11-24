import type { MetadataRoute } from 'next'
import { LATEST_RELEASE } from '@/lib/artist-data'
import { POSTS, postUrl } from '@/lib/blog'

const SITE_URL = process.env.SITE_URL ?? 'https://rafatrujillo.xyz'

export default function sitemap(): MetadataRoute.Sitemap {
  const alt = { languages: { es: SITE_URL, en: `${SITE_URL}/en` } }
  return [
    {
      url: `${SITE_URL}/en`,
      lastModified: new Date(LATEST_RELEASE.releaseDate),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: alt,
    },
    { url: `${SITE_URL}/blog`, lastModified: new Date(POSTS.map(p => p.updated ?? p.date).sort().at(-1)!), changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map(p => ({ url: `${SITE_URL}${postUrl(p)}`, lastModified: new Date(p.updated ?? p.date), changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${SITE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/en/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    {
      alternates: alt,
      url: SITE_URL,
      lastModified: new Date(LATEST_RELEASE.releaseDate),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
