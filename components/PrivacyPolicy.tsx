import Link from 'next/link'
import type { Locale } from '@/lib/i18n'

const H2: React.CSSProperties = {
  fontFamily: 'var(--font-bebas)',
  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
  color: 'var(--rafa-text)',
  textTransform: 'uppercase',
  marginTop: '2.5rem',
  marginBottom: '0.75rem',
  lineHeight: 1,
}

const UPDATED = '2026-10-08'

const CONTENT = {
  es: {
    title: 'Política de privacidad',
    updated: 'Última actualización: 8 de octubre de 2026',
    intro: 'Esta política explica qué datos personales recoge rafatrujillo.xyz, para qué los usa y cómo puedes ejercer tus derechos, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia (habeas data).',
    sections: [
      ['Responsable', 'El responsable del tratamiento es rafatrujillo (Rafa Trujillo), artista con domicilio en Colombia. Para cualquier solicitud usa el formulario de contacto de la sección Prensa de este sitio.'],
      ['Qué datos recogemos', 'Lista de correo: tu correo electrónico, tu nombre (opcional), la fecha en que diste tu autorización y una huella cifrada (hash) de tu dirección IP para prevenir abusos; nunca guardamos la IP en claro. Formulario de contacto: nombre, correo y mensaje. Métricas: eventos anónimos de uso (páginas vistas, secciones, reproducciones, clics a plataformas) sin cookies y sin datos que te identifiquen.'],
      ['Para qué los usamos', 'Enviarte noticias sobre la música de rafatrujillo (nuevos lanzamientos, fechas, contenido exclusivo), responder tus mensajes de booking o prensa, y entender de forma agregada cómo se usa el sitio para mejorarlo. No vendemos ni cedemos tus datos a terceros con fines comerciales.'],
      ['Doble confirmación', 'Tu suscripción solo se activa cuando confirmas desde el enlace que te enviamos por correo. Las solicitudes que no se confirman se eliminan automáticamente a los 14 días.'],
      ['Encargados del tratamiento', 'Usamos proveedores que tratan los datos por cuenta nuestra: Supabase (base de datos), Resend (envío de correos) y Vercel (alojamiento y métricas anónimas). Pueden estar ubicados fuera de Colombia, con medidas de seguridad adecuadas.'],
      ['Tus derechos', 'Puedes conocer, actualizar, rectificar y suprimir tus datos, revocar tu autorización y presentar quejas ante la Superintendencia de Industria y Comercio. Para darte de baja, usa el enlace “Darte de baja” al final de cualquier correo; para lo demás, escríbenos por el formulario de contacto. Respondemos en los plazos de ley (10 días hábiles para consultas y 15 para reclamos).'],
      ['Conservación', 'Conservamos tu correo mientras sigas suscrito. Si te das de baja, dejamos de escribirte de inmediato. Los eventos de métricas se eliminan a los 13 meses.'],
      ['Cookies', 'Este sitio no usa cookies de seguimiento. Guarda en tu navegador (almacenamiento local) solo preferencias como cerrar el pop-up, el reproductor o el tipo de cursor. El reproductor de Spotify y los videos de YouTube (modo de privacidad mejorada) se cargan solo cuando los usas.'],
    ],
    back: '← Volver a rafatrujillo',
  },
  en: {
    title: 'Privacy policy',
    updated: 'Last updated: October 8, 2026',
    intro: 'This policy explains what personal data rafatrujillo.xyz collects, why, and how you can exercise your rights, in accordance with Colombian Law 1581 of 2012 and Decree 1377 of 2013 (habeas data).',
    sections: [
      ['Controller', 'The data controller is rafatrujillo (Rafa Trujillo), an artist based in Colombia. For any request, use the contact form in the Press section of this site.'],
      ['What we collect', 'Mailing list: your email address, your name (optional), the date you gave consent and an encrypted fingerprint (hash) of your IP address to prevent abuse; we never store your IP in plain text. Contact form: name, email and message. Metrics: anonymous usage events (page views, sections, plays, clicks to platforms) with no cookies and nothing that identifies you.'],
      ['How we use it', 'To send you news about rafatrujillo’s music (new releases, dates, exclusive content), to answer booking or press messages, and to understand site usage in aggregate in order to improve it. We never sell or share your data with third parties for commercial purposes.'],
      ['Double opt-in', 'Your subscription is only activated once you confirm through the link we email you. Unconfirmed requests are deleted automatically after 14 days.'],
      ['Processors', 'We use providers that process data on our behalf: Supabase (database), Resend (email delivery) and Vercel (hosting and anonymous metrics). They may be located outside Colombia, with appropriate security measures.'],
      ['Your rights', 'You can access, update, correct and delete your data, withdraw your consent and file complaints with Colombia’s Superintendence of Industry and Commerce. To unsubscribe, use the “unsubscribe” link at the bottom of any email; for anything else, write to us through the contact form.'],
      ['Retention', 'We keep your email while you remain subscribed. If you unsubscribe, we stop emailing you immediately. Metric events are deleted after 13 months.'],
      ['Cookies', 'This site uses no tracking cookies. It only stores preferences in your browser (local storage), such as closing the pop-up, the player or the cursor style. The Spotify player and YouTube videos (privacy-enhanced mode) load only when you use them.'],
    ],
    back: '← Back to rafatrujillo',
  },
}

export function PrivacyPolicy({ locale = 'es' }: { locale?: Locale }) {
  const c = CONTENT[locale]
  return (
    <article className="px-6" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(2.6rem, 8vw, 4.5rem)', lineHeight: 1, color: 'var(--rafa-text)', textTransform: 'uppercase' }}>
          {c.title}
        </h1>
        <p className="mt-3" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--rafa-muted)' }}>
          <time dateTime={UPDATED}>{c.updated}</time>
        </p>
        <p className="mt-8" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--rafa-text)' }}>
          {c.intro}
        </p>
        {c.sections.map(([h, p]) => (
          <section key={h}>
            <h2 style={H2}>{h}</h2>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--rafa-muted)' }}>{p}</p>
          </section>
        ))}
        <Link href={locale === 'en' ? '/en' : '/'} className="inline-block mt-12 py-3" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--rafa-accent)' }}>
          {c.back}
        </Link>
      </div>
    </article>
  )
}
