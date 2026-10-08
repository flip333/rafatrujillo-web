import type { MetadataRoute } from 'next'
import { LATEST_RELEASE } from '@/lib/artist-data'

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
