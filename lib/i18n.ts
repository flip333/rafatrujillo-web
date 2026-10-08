/* Textos del sitio en español e inglés.
   Marcas en los párrafos: *texto* → cursiva · **texto** → color de acento.
   Las letras de canciones y los títulos de obras no se traducen. */

export type Locale = 'es' | 'en'

const es = {
  meta: {
    description: 'rafatrujillo — artista, compositor, productor y multiinstrumentista colombiano. Nuevo sencillo “Borracho y Loco” (rafatrujillo x Equo), primer adelanto de Mosquito Beach, su segundo álbum.',
  },
  nav: {
    home: 'Inicio', latest: 'Nuevo', music: 'Música', videos: 'Videos', about: 'Sobre',
    equo: 'Equo', dates: 'Fechas', press: 'Booking', contact: 'Suscríbete',
    openMenu: 'Abrir menú', closeMenu: 'Cerrar menú', menu: 'Menú', main: 'Principal',
    newTab: '(abre en una pestaña nueva)', toTop: 'Volver arriba', switchLang: 'English', switchHref: '/en',
  },
  hero: {
    available: 'Ya disponible · Primer sencillo de',
    scroll: 'Scroll', scrollLabel: 'Bajar a nuevo lanzamiento',
  },
  latest: {
    label: '— Nuevo lanzamiento', ghost: 'NUEVO', badge: 'Ya disponible',
    coverAlt: 'Portada de',
    firstSingle: 'Primer sencillo de *{mb}*, segundo álbum de rafatrujillo.',
    body: 'Una canción nacida de años de amistad entre Rafa Trujillo y Sergio Hoyos, que vuelve a las fiestas de juventud en Manizales, las guitarras, la carretera, la complicidad y esos lugares emocionales a los que uno intenta regresar con el paso de los años.',
    releaseLabel: 'Lanzamiento:', releaseDate: '25 de septiembre de 2026',
    listen: 'Escuchar ahora', spotify: 'Spotify ↗', video: 'Ver el video oficial', lyrics: 'Leer la letra →',
    mbLabel: '— Segundo álbum', mbSub: 'Segundo álbum de',
    mb: [
      '*{mb}* nace de la necesidad de volver al origen para poder avanzar.',
      'El proyecto explora la adultez, la memoria, las amistades, Bogotá, los home studios, las colaboraciones y el regreso al niño interior como una forma de recuperar la capacidad de escribir, imaginar y volver a volar.',
      'Cada canción representa un momento distinto dentro de un tránsito que comienza en el atardecer y avanza hacia la noche.',
      '*“{title}”*, junto a Equo, es el primer sencillo oficial de esta nueva etapa.',
    ],
  },
  about: {
    label: '— El artista',
    lead: 'rafatrujillo es un artista, compositor, productor y multiinstrumentista **colombiano** que construye su música desde la canción, las guitarras, la producción independiente y una mirada profundamente narrativa.',
    body: [
      'Músico y compositor con formación en **cine**, integra elementos cinematográficos y de storytelling a su proyecto musical, construyendo un universo en el que cada canción funciona también como una escena, un recuerdo o un fragmento de una historia mayor.',
      'A través de su catálogo ha documentado distintos momentos personales y emocionales, mientras desarrolla una identidad sonora cada vez más ligada a su propia producción, los home studios, los instrumentos que interpreta y la colaboración con otros músicos.',
    ],
    timeline: [
      'En 2024 lanzó su primer EP como solista y ese mismo año participó como artista en el **Megaland Music Fest**.',
      'En 2025 lanzó su primer álbum, *Ya no es mi canción, y otras películas*, un proyecto atravesado por el duelo, las relaciones y la forma en que las canciones pueden convertirse en memoria.',
      'En 2026 inicia una nueva etapa con *Mosquito Beach*, su segundo álbum, un proyecto que explora la adultez, el regreso al niño interior y la necesidad de recuperar la capacidad de escribir, imaginar y volver a volar.',
    ],
    facts: { origin: 'Origen', genre: 'Género', country: 'País', firstAlbum: 'Primer álbum' },
  },
  equo: {
    label: '— El proyecto', singles: 'Sencillos',
    body: [
      'Equo es el proyecto conformado por **Sergio Hoyos** y rafatrujillo, nacido de una amistad de colegio y de los primeros años de ambos haciendo música juntos en Manizales.',
      'Su relación creativa comenzó entre guitarras, composiciones, estudios improvisados y una amistad que convirtió la música en uno de sus lenguajes compartidos.',
      'En 2021 lanzaron *“Nombre y Apellido”*, canción que superó las 175.000 reproducciones en Spotify, y en 2024 retomaron el proyecto con *“El Flamenquillo”*, ambos producidos por **Ragga On Fire**.',
      'Equo funciona hoy como un espacio creativo libre y espontáneo: dos amigos que siguen escribiendo canciones cuando la música vuelve a juntarlos, sin fórmulas ni presión por mantener una frecuencia determinada.',
      'En 2026 presentan *“Borracho y Loco”*, una colaboración acreditada como rafatrujillo x Equo que abre oficialmente el ciclo de *Mosquito Beach*, el segundo álbum de rafatrujillo.',
    ],
  },
  disco: {
    label: '— Discografía', title: 'Escucha y lee',
    newSingle: 'Nuevo sencillo', firstAlbum: 'Primer álbum', ep: '— EP', singles: '— Sencillos',
    firstSingleOf: 'Primer sencillo de *{mb}*, segundo álbum de rafatrujillo.',
    released: 'Lanzado el', songs: 'canciones',
    hintSongs: 'Toca una canción para leer su letra', hintCovers: 'Toca una portada para leer su letra',
    play: 'Reproducir', playAlbum: 'Reproducir álbum', playEp: 'Reproducir EP',
    credits: 'Ver créditos →', creditsTitle: 'Créditos', lyrics: 'Letra →', instr: 'Instr.',
    viewLyrics: 'Ver letra →', viewLyricsOf: 'Ver letra de', single: 'Sencillo', album: 'Álbum',
  },
  lyrics: {
    lyricsOf: 'Letra de', close: 'Cerrar', instrumental: 'Pista instrumental — sin letra.',
    unavailable: 'Letra no disponible por ahora.', copy: 'Copiar enlace', copied: 'Enlace copiado',
  },
  videos: {
    label: '— Video', title: 'Videoclips', channel: 'Ver canal de YouTube ↗',
    official: 'Video oficial', live: 'Live session', play: 'Reproducir video:',
  },
  dates: { label: '— En vivo', title: 'Fechas', tickets: 'Entradas ↗' },
  bands: {
    story: 'Cada canción funciona también como una **escena**, un **recuerdo** o un fragmento de una historia mayor.',
    studio: 'Del home studio a la pantalla: música hecha a la medida para **cine**, **publicidad** y nuevos proyectos.',
  },
  press: {
    label: '— Prensa, booking y servicios', title: 'Trabajemos juntos', ghost: 'PRESS',
    servicesTitle: 'Música para cine, publicidad y proyectos',
    servicesLead: 'Además de su proyecto como artista, Rafa crea música original a la medida: con formación en cine, compone pensando en la imagen, el ritmo de la edición y la historia que se quiere contar.',
    services: [
      ['Cine y series', 'Bandas sonoras, música incidental y canciones originales para largometrajes, cortos y documentales.'],
      ['Publicidad y marcas', 'Música para comerciales, campañas, contenido digital y identidad sonora de marca.'],
      ['Producción y composición', 'Producción musical, arreglos y composición para artistas, teatro, videojuegos y otros proyectos.'],
      ['Sesiones y colaboraciones', 'Guitarras y multiinstrumentista en estudio, colaboraciones y presentaciones en vivo.'],
    ],
    emailLabel: 'O escribe directamente a',
    bioTitle: 'Biografía corta', copyBio: 'Copiar biografía', copied: 'Copiada',
    photos: 'Fotos de prensa', download: 'Descargar',
    contactTitle: 'Booking y contacto',
    contactText: 'Conciertos, prensa, colaboraciones, licencias o música para tu proyecto: cuéntanos qué tienes en mente y te respondemos pronto.',
    name: 'Nombre', email: 'Correo', subject: 'Motivo', message: 'Mensaje', send: 'Enviar mensaje', sending: 'Enviando...',
    subjects: { booking: 'Booking / concierto', services: 'Música para cine / publicidad / proyecto', collab: 'Colaboración', press: 'Prensa / entrevista', other: 'Otro' },
    ok: 'Mensaje enviado. Gracias por escribir.', error: 'No se pudo enviar. Intenta de nuevo o escríbenos por Instagram.',
    notConfigured: 'El formulario aún no está activo. Escríbenos por Instagram mientras tanto.',
  },
  signup: {
    label: '— Lista de correo', title: 'Sé el primero',
    text: 'Nuevas canciones, fechas, detrás de cámaras y todo lo que no cabe en Instagram. Sin spam. Puedes salir cuando quieras.',
    popupText: 'Nuevas canciones, fechas y detrás de cámaras — directo a tu correo.',
    name: 'Tu nombre (opcional)', nameLabel: 'Nombre (opcional)', emailLabel: 'Correo electrónico',
    consent: 'Acepto recibir correos de rafatrujillo y la', privacy: 'política de privacidad',
    submit: 'Suscribirme', sending: 'Enviando...', no: 'No, gracias', close: 'Cerrar',
    checkTitle: 'Revisa tu correo.', checkText: 'Te enviamos un enlace para confirmar tu suscripción.',
    errors: {
      invalid_email: 'Ese correo no parece válido.',
      consent_required: 'Necesitamos tu autorización para escribirte.',
      rate_limited: 'Demasiados intentos. Prueba de nuevo en un rato.',
      not_configured: 'La suscripción aún no está activa. Vuelve pronto.',
      generic: 'Algo salió mal. Intenta de nuevo.',
    },
  },
  footer: {
    nav: 'Navegación', listen: 'Escuchar', artist: 'Artista', booking: 'Booking y prensa',
    privacy: 'Privacidad', cursor: 'Cursor clásico', cursorOn: 'Cursor animado',
  },
}

type Dict = typeof es

const en: Dict = {
  meta: {
    description: 'rafatrujillo — Colombian artist, songwriter, producer and multi-instrumentalist. New single “Borracho y Loco” (rafatrujillo x Equo), the first taste of Mosquito Beach, his second album.',
  },
  nav: {
    home: 'Home', latest: 'New', music: 'Music', videos: 'Videos', about: 'About',
    equo: 'Equo', dates: 'Dates', press: 'Booking', contact: 'Subscribe',
    openMenu: 'Open menu', closeMenu: 'Close menu', menu: 'Menu', main: 'Main',
    newTab: '(opens in a new tab)', toTop: 'Back to top', switchLang: 'Español', switchHref: '/',
  },
  hero: {
    available: 'Out now · First single from',
    scroll: 'Scroll', scrollLabel: 'Jump to the new release',
  },
  latest: {
    label: '— New release', ghost: 'NEW', badge: 'Out now',
    coverAlt: 'Cover of',
    firstSingle: 'First single from *{mb}*, rafatrujillo’s second album.',
    body: 'A song born from years of friendship between Rafa Trujillo and Sergio Hoyos, going back to the teenage parties in Manizales, the guitars, the road trips, the complicity, and those emotional places we keep trying to return to as the years go by.',
    releaseLabel: 'Released:', releaseDate: 'September 25, 2026',
    listen: 'Listen now', spotify: 'Spotify ↗', video: 'Watch the official video', lyrics: 'Read the lyrics (Spanish) →',
    mbLabel: '— Second album', mbSub: 'Second album by',
    mb: [
      '*{mb}* comes from the need to go back to the origin in order to move forward.',
      'The project explores adulthood, memory, friendship, Bogotá, home studios, collaboration and the return to the inner child as a way to recover the ability to write, imagine and fly again.',
      'Each song captures a different moment in a journey that begins at sunset and moves into the night.',
      '*“{title}”*, with Equo, is the first official single of this new chapter.',
    ],
  },
  about: {
    label: '— The artist',
    lead: 'rafatrujillo is a **Colombian** artist, songwriter, producer and multi-instrumentalist who builds his music from the song itself, guitars, independent production and a deeply narrative point of view.',
    body: [
      'A musician and songwriter trained in **film**, he brings cinematic and storytelling elements into his music, building a universe where every song is also a scene, a memory or a fragment of a larger story.',
      'Through his catalog he has documented different personal and emotional moments, while developing a sound increasingly tied to his own production, home studios, the instruments he plays and collaboration with other musicians.',
    ],
    timeline: [
      'In 2024 he released his first solo EP and, that same year, performed at **Megaland Music Fest**.',
      'In 2025 he released his first album, *Ya no es mi canción, y otras películas*, a project shaped by grief, relationships and the way songs can turn into memory.',
      'In 2026 he begins a new chapter with *Mosquito Beach*, his second album, a project about adulthood, the return to the inner child and the need to recover the ability to write, imagine and fly again.',
    ],
    facts: { origin: 'Hometown', genre: 'Genre', country: 'Country', firstAlbum: 'First album' },
  },
  equo: {
    label: '— The project', singles: 'Singles',
    body: [
      'Equo is the project formed by **Sergio Hoyos** and rafatrujillo, born from a high-school friendship and their first years making music together in Manizales.',
      'Their creative bond began among guitars, songwriting, makeshift studios and a friendship that turned music into one of their shared languages.',
      'In 2021 they released *“Nombre y Apellido”*, which surpassed 175,000 streams on Spotify, and in 2024 they returned with *“El Flamenquillo”*, both produced by **Ragga On Fire**.',
      'Today Equo is a free and spontaneous creative space: two friends who keep writing songs whenever music brings them back together, with no formulas and no pressure to release on a schedule.',
      'In 2026 they present *“Borracho y Loco”*, credited as rafatrujillo x Equo, which officially opens the *Mosquito Beach* cycle, rafatrujillo’s second album.',
    ],
  },
  disco: {
    label: '— Discography', title: 'Listen & read',
    newSingle: 'New single', firstAlbum: 'First album', ep: '— EP', singles: '— Singles',
    firstSingleOf: 'First single from *{mb}*, rafatrujillo’s second album.',
    released: 'Released on', songs: 'songs',
    hintSongs: 'Tap a song to read its lyrics (in Spanish)', hintCovers: 'Tap a cover to read its lyrics (in Spanish)',
    play: 'Play', playAlbum: 'Play album', playEp: 'Play EP',
    credits: 'View credits →', creditsTitle: 'Credits', lyrics: 'Lyrics →', instr: 'Instr.',
    viewLyrics: 'Lyrics →', viewLyricsOf: 'Read the lyrics of', single: 'Single', album: 'Album',
  },
  lyrics: {
    lyricsOf: 'Lyrics of', close: 'Close', instrumental: 'Instrumental track — no lyrics.',
    unavailable: 'Lyrics not available yet.', copy: 'Copy link', copied: 'Link copied',
  },
  videos: {
    label: '— Video', title: 'Music videos', channel: 'YouTube channel ↗',
    official: 'Official video', live: 'Live session', play: 'Play video:',
  },
  dates: { label: '— Live', title: 'Tour dates', tickets: 'Tickets ↗' },
  bands: {
    story: 'Every song is also a **scene**, a **memory** or a fragment of a larger story.',
    studio: 'From the home studio to the screen: music made to measure for **film**, **advertising** and new projects.',
  },
  press: {
    label: '— Press, booking & services', title: 'Work together', ghost: 'PRESS',
    servicesTitle: 'Music for film, advertising and projects',
    servicesLead: 'Beyond his work as an artist, Rafa creates original music to order: trained in film, he writes with the picture, the rhythm of the edit and the story in mind.',
    services: [
      ['Film & series', 'Scores, incidental music and original songs for features, shorts and documentaries.'],
      ['Advertising & brands', 'Music for commercials, campaigns, digital content and sonic branding.'],
      ['Production & songwriting', 'Music production, arrangements and composition for artists, theater, games and other projects.'],
      ['Sessions & collaborations', 'Guitars and multi-instrumental studio sessions, collaborations and live performances.'],
    ],
    emailLabel: 'Or write directly to',
    bioTitle: 'Short bio', copyBio: 'Copy bio', copied: 'Copied',
    photos: 'Press photos', download: 'Download',
    contactTitle: 'Booking & contact',
    contactText: 'Shows, press, collaborations, licensing or music for your project: tell us what you have in mind and we’ll get back to you soon.',
    name: 'Name', email: 'Email', subject: 'Topic', message: 'Message', send: 'Send message', sending: 'Sending...',
    subjects: { booking: 'Booking / show', services: 'Music for film / advertising / project', collab: 'Collaboration', press: 'Press / interview', other: 'Other' },
    ok: 'Message sent. Thanks for writing.', error: 'Could not send. Try again or reach us on Instagram.',
    notConfigured: 'The form is not active yet. Reach us on Instagram in the meantime.',
  },
  signup: {
    label: '— Mailing list', title: 'Be the first',
    text: 'New songs, dates, behind the scenes and everything that doesn’t fit on Instagram. No spam. Leave anytime.',
    popupText: 'New songs, dates and behind the scenes — straight to your inbox.',
    name: 'Your name (optional)', nameLabel: 'Name (optional)', emailLabel: 'Email address',
    consent: 'I agree to receive emails from rafatrujillo and the', privacy: 'privacy policy',
    submit: 'Subscribe', sending: 'Sending...', no: 'No, thanks', close: 'Close',
    checkTitle: 'Check your inbox.', checkText: 'We sent you a link to confirm your subscription.',
    errors: {
      invalid_email: 'That email doesn’t look right.',
      consent_required: 'We need your consent to email you.',
      rate_limited: 'Too many attempts. Please try again later.',
      not_configured: 'Sign-ups are not active yet. Come back soon.',
      generic: 'Something went wrong. Please try again.',
    },
  },
  footer: {
    nav: 'Navigation', listen: 'Listen', artist: 'Artist', booking: 'Booking & press',
    privacy: 'Privacy', cursor: 'Classic cursor', cursorOn: 'Animated cursor',
  },
}

export const DICT: Record<Locale, Dict> = { es, en }
export const t = (locale: Locale = 'es') => DICT[locale]
export const localeFromPath = (path?: string | null): Locale => (path?.startsWith('/en') ? 'en' : 'es')
