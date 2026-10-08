import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Playfair_Display, Inter, Courier_Prime } from 'next/font/google'
import './globals.css'
import { Navbar }           from '@/components/layout/Navbar'
import { Footer }           from '@/components/layout/Footer'
import { CustomCursor }     from '@/components/shared/CustomCursor'
import { EmailPopupModal }  from '@/components/shared/EmailPopupModal'
import { ARTIST, LATEST_RELEASE, ALBUM_DEBUT, EP_01, EQUO, YOUTUBE_VIDEOS } from '@/lib/artist-data'
import { Analytics }        from '@vercel/analytics/next'
import { SpeedInsights }    from '@vercel/speed-insights/next'
import { AnalyticsTracker } from '@/components/shared/AnalyticsTracker'
import { MusicPlayer }      from '@/components/shared/MusicPlayer'
import { BackToTop }        from '@/components/shared/BackToTop'
import { TapEffects }       from '@/components/shared/TapEffects'

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

// Máquina de escribir — misma estética del logo; se usa para el nombre
// "rafatrujillo" (Bebas Neue no tiene minúsculas).
const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  variable: '--font-type',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const SITE_URL = 'https://rafatrujillo.xyz'
const DESCRIPTION =
  'rafatrujillo — artista, compositor, productor y multiinstrumentista colombiano. Nuevo sencillo “Borracho y Loco” (rafatrujillo x Equo), primer adelanto de Mosquito Beach, su segundo álbum.'

// Barra del navegador móvil en el color del sitio
export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'rafatrujillo',
  description: DESCRIPTION,
  keywords: ['rafatrujillo', 'Borracho y Loco', 'Mosquito Beach', 'Equo', 'indie pop-rock', 'Manizales', 'Colombia', 'Ya no es mi canción, y otras películas'],
  alternates: { canonical: '/', languages: { es: '/', en: '/en' } },
  openGraph: {
    title: 'rafatrujillo',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'rafatrujillo',
    locale: 'es_CO',
    type: 'website',
    images: [{
      url: '/og.jpg',
      width: 1200,
      height: 630,
      alt: 'rafatrujillo — “Borracho y Loco” (rafatrujillo x Equo), ya disponible',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'rafatrujillo',
    description: DESCRIPTION,
    images: ['/og.jpg'],
  },
}

// Datos estructurados (schema.org) para buscadores.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: ARTIST.name,
  url: SITE_URL,
  genre: ARTIST.genre,
  foundingLocation: `${ARTIST.city}, ${ARTIST.country}`,
  sameAs: [ARTIST.urls.spotify, ARTIST.urls.appleMusic, ARTIST.urls.instagram, ARTIST.urls.youtube],
  image: `${SITE_URL}/og.jpg`,
  member: [{ '@type': 'Person', name: ARTIST.fullName, alternateName: ARTIST.name }],
  track: {
    '@type': 'MusicRecording',
    name: LATEST_RELEASE.title,
    byArtist: LATEST_RELEASE.credit,
    datePublished: LATEST_RELEASE.releaseDate,
    url: LATEST_RELEASE.spotifyUrl,
  },
  album: [
    { '@type': 'MusicAlbum', name: ALBUM_DEBUT.title, datePublished: String(ALBUM_DEBUT.year), numTracks: ALBUM_DEBUT.tracks.length, albumProductionType: 'StudioAlbum' },
    { '@type': 'MusicAlbum', name: EP_01.title, datePublished: String(EP_01.year), numTracks: EP_01.tracks.length, albumReleaseType: 'EPRelease' },
  ],
  subjectOf: YOUTUBE_VIDEOS.slice(0, 3).map(v => ({
    '@type': 'VideoObject',
    name: v.title,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    uploadDate: String(v.year),
  })),
  knowsAbout: ['música para cine', 'música para publicidad', 'producción musical', EQUO.name],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${playfair.variable} ${inter.variable} ${courierPrime.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <div className="scroll-progress" aria-hidden="true" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <CustomCursor />
        <EmailPopupModal />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <MusicPlayer />
        <BackToTop />
        <TapEffects />
        <AnalyticsTracker />
        {/* Los scripts de Vercel solo existen en despliegues de Vercel */}
        {process.env.VERCEL && <Analytics />}
        {process.env.VERCEL && <SpeedInsights />}
      </body>
    </html>
  )
}
