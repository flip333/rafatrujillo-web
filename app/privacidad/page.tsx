import type { Metadata } from 'next'
import { PrivacyPolicy } from '@/components/PrivacyPolicy'

export const metadata: Metadata = {
  title: 'Política de privacidad — rafatrujillo',
  description: 'Cómo rafatrujillo.xyz recoge y protege tus datos personales (Ley 1581 de 2012).',
  alternates: { canonical: '/privacidad', languages: { es: '/privacidad', en: '/en/privacy' } },
}

export default function Page() {
  return <PrivacyPolicy locale="es" />
}
