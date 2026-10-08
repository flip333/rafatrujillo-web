import type { Metadata } from 'next'
import { PrivacyPolicy } from '@/components/PrivacyPolicy'

export const metadata: Metadata = {
  title: 'Privacy policy — rafatrujillo',
  description: 'How rafatrujillo.xyz collects and protects your personal data.',
  alternates: { canonical: '/en/privacy', languages: { es: '/privacidad', en: '/en/privacy' } },
}

export default function Page() {
  return (
    <div lang="en">
      <PrivacyPolicy locale="en" />
    </div>
  )
}
