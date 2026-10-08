import type { Metadata } from 'next'
import { HomePage } from '@/components/HomePage'
import { t } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'rafatrujillo — Colombian singer-songwriter & producer · “Borracho y Loco”',
  description: t('en').meta.description,
  alternates: { canonical: '/en', languages: { es: '/', en: '/en' } },
  openGraph: { locale: 'en_US', url: '/en', description: t('en').meta.description },
}

/* Versión en inglés. El atributo lang en el contenedor indica el idioma a
   lectores de pantalla y buscadores (el <html> raíz se mantiene en "es"). */
export default function EnglishPage() {
  return (
    <div lang="en">
      <HomePage locale="en" />
    </div>
  )
}
