import type { MetadataRoute } from 'next'

const SITE_URL = process.env.SITE_URL ?? 'https://rafatrujillo.xyz'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/suscripcion', '/admin'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
