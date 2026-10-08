import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

/* Content-Security-Policy: solo se permiten los orígenes que la web usa.
   En desarrollo Next necesita 'unsafe-eval' (HMR), por eso solo aplica en prod. */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval': lo exige la Spotify iFrame API oficial (reproductor global).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://open.spotify.com https://embed-cdn.spotifycdn.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.scdn.co https://*.spotifycdn.com https://i.ytimg.com",
  "font-src 'self'",
  "frame-src https://open.spotify.com https://www.youtube-nocookie.com https://www.youtube.com",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://open.spotify.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
]

const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'image-cdn-ak.spotifycdn.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ]
  },
}

export default config
