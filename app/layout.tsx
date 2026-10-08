import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Playfair_Display, Inter, Courier_Prime } from 'next/font/google'
import './globals.css'
import { Navbar }           from '@/components/layout/Navbar'
import { Footer }           from '@/components/layout/Footer'
import { CustomCursor }     from '@/components/shared/CustomCursor'
import { EmailPopupModal }  from '@/components/shared/EmailPopupModal'
import { buildJsonLd }      from '@/lib/structured-data'
import { VercelInsights }   from '@/components/shared/VercelInsights'
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
  title: 'rafatrujillo — cantautor y productor colombiano · “Borracho y Loco”',
  description: DESCRIPTION,
  applicationName: 'rafatrujillo',
  authors: [{ name: 'Rafa Trujillo', url: SITE_URL }],
  creator: 'rafatrujillo',
  category: 'music',
  keywords: ['rafatrujillo', 'Rafa Trujillo', 'Borracho y Loco', 'Mosquito Beach', 'Equo', 'indie pop-rock colombiano', 'cantautor colombiano', 'Manizales', 'música para cine', 'música para publicidad', 'Ya no es mi canción, y otras películas'],
  alternates: {
    canonical: '/',
    languages: { es: '/', en: '/en' },
    types: { 'text/markdown': '/llms.txt' },
  },
  openGraph: {
    title: 'rafatrujillo — “Borracho y Loco” (rafatrujillo x Equo)',
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
    title: 'rafatrujillo — “Borracho y Loco” (rafatrujillo x Equo)',
    description: DESCRIPTION,
    images: ['/og.jpg'],
  },
}

// Datos estructurados: grafo de entidades (ver lib/structured-data.ts)
const JSON_LD = buildJsonLd()

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
        <VercelInsights />
      </body>
    </html>
  )
}
