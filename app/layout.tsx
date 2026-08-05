import type { Metadata } from 'next'
import { Bebas_Neue, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { Navbar }           from '@/components/layout/Navbar'
import { Footer }           from '@/components/layout/Footer'
import { CustomCursor }     from '@/components/shared/CustomCursor'
import { EmailPopupModal }  from '@/components/shared/EmailPopupModal'

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

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'rafatrujillo',
  description: 'Música alternativa colombiana. Debut "Ya no es mi canción, y otras películas" — disponible en Spotify.',
  keywords: ['rafatrujillo', 'música alternativa', 'colombia', 'cruzao music', 'indie'],
  openGraph: {
    title: 'rafatrujillo',
    description: 'Música alternativa colombiana.',
    url: 'https://rafatrujillo.vercel.app',
    type: 'website',
    images: [{
      url: 'https://i.scdn.co/image/ab6761610000e5eb2de274b6bf5dc6d2fb2d07bd',
      width: 640,
      height: 640,
    }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${playfair.variable} ${inter.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <CustomCursor />
        <EmailPopupModal />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
