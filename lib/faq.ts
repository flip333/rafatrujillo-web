import type { Locale } from './i18n'

/* Preguntas frecuentes (GEO): respuestas directas y autocontenidas que los
   buscadores con IA pueden citar tal cual. Se muestran en la página, se
   publican como FAQPage (schema.org) y se incluyen en /llms.txt.
   Regla: cada respuesta debe entenderse sola, sin depender de la pregunta. */
export const FAQ: Record<Locale, { q: string; a: string }[]> = {
  es: [
    {
      q: '¿Quién es rafatrujillo?',
      a: 'rafatrujillo (Rafa Trujillo) es un artista, compositor, productor y multiinstrumentista colombiano de Manizales. Con formación en cine, hace indie pop-rock con una mirada narrativa: cada canción funciona como una escena o un recuerdo. Lanzó su primer EP en 2024, su primer álbum, "Ya no es mi canción, y otras películas", en 2025, y en 2026 inicia su segundo álbum, Mosquito Beach.',
    },
    {
      q: '¿Cuál es el último lanzamiento de rafatrujillo?',
      a: 'El último lanzamiento de rafatrujillo es "Borracho y Loco" (rafatrujillo x Equo), publicado el 25 de septiembre de 2026. Es el primer sencillo de Mosquito Beach, su segundo álbum, y está disponible en Spotify, Apple Music y YouTube, donde tiene video oficial.',
    },
    {
      q: '¿Qué es Mosquito Beach?',
      a: 'Mosquito Beach es el segundo álbum de rafatrujillo (2026). Explora la adultez, la memoria, las amistades, Bogotá, los home studios, las colaboraciones y el regreso al niño interior. Cada canción representa un momento de un tránsito que va del atardecer a la noche. Su primer sencillo es "Borracho y Loco", junto a Equo.',
    },
    {
      q: '¿Qué es Equo?',
      a: 'Equo es el proyecto de Sergio Hoyos y rafatrujillo, nacido de una amistad de colegio en Manizales. Lanzaron "Nombre y Apellido" (2021), que superó las 175.000 reproducciones en Spotify, y "El Flamenquillo" (2024), ambos producidos por Ragga On Fire. En 2026 presentan "Borracho y Loco" como rafatrujillo x Equo.',
    },
    {
      q: '¿Cuál es el primer álbum de rafatrujillo?',
      a: 'El primer álbum de rafatrujillo es "Ya no es mi canción, y otras películas" (2025), de 8 canciones: Cuento; Ya no es mi canción, Pt.1; Ya no es mi canción, Pt.2; Fallas en el corazón; Suenan las alarmas; Mi canción desesperada (versión eléctrica); Bailas de la nada; y Mi canción desesperada (versión acústica). Es un disco atravesado por el duelo, las relaciones y la memoria.',
    },
    {
      q: '¿Dónde escuchar a rafatrujillo?',
      a: 'La música de rafatrujillo está en Spotify, Apple Music y YouTube (canal @rafatrujillo.oficial, con 12 videos oficiales). En rafatrujillo.xyz se pueden escuchar las canciones y leer sus letras.',
    },
    {
      q: '¿rafatrujillo hace música para cine, publicidad u otros proyectos?',
      a: 'Sí. Además de su proyecto como artista, rafatrujillo compone y produce música original por encargo para cine y series, publicidad y marcas, teatro, videojuegos y otros proyectos, y participa en sesiones de estudio y colaboraciones. Su formación en cine le permite componer pensando en la imagen y la edición. Contacto: trujillorafa.rafa@gmail.com o el formulario de booking en rafatrujillo.xyz.',
    },
    {
      q: '¿Cómo contactar a rafatrujillo para conciertos o colaboraciones?',
      a: 'Para booking, conciertos, prensa, colaboraciones o licencias se puede escribir a trujillorafa.rafa@gmail.com o usar el formulario de la sección "Trabajemos juntos" en rafatrujillo.xyz. En Instagram está como @rafatrujillomusic.',
    },
  ],
  en: [
    {
      q: 'Who is rafatrujillo?',
      a: 'rafatrujillo (Rafa Trujillo) is a Colombian artist, songwriter, producer and multi-instrumentalist from Manizales. Trained in film, he makes indie pop-rock with a narrative approach: every song works as a scene or a memory. He released his first EP in 2024, his first album, "Ya no es mi canción, y otras películas", in 2025, and in 2026 he begins his second album, Mosquito Beach.',
    },
    {
      q: 'What is rafatrujillo’s latest release?',
      a: 'rafatrujillo’s latest release is "Borracho y Loco" (rafatrujillo x Equo), released on September 25, 2026. It is the first single from Mosquito Beach, his second album, and it is available on Spotify, Apple Music and YouTube, where it has an official music video.',
    },
    {
      q: 'What is Mosquito Beach?',
      a: 'Mosquito Beach is rafatrujillo’s second album (2026). It explores adulthood, memory, friendship, Bogotá, home studios, collaboration and the return to the inner child. Each song captures a moment in a journey from sunset into the night. Its first single is "Borracho y Loco", with Equo.',
    },
    {
      q: 'What is Equo?',
      a: 'Equo is the project of Sergio Hoyos and rafatrujillo, born from a high-school friendship in Manizales, Colombia. They released "Nombre y Apellido" (2021), which passed 175,000 Spotify streams, and "El Flamenquillo" (2024), both produced by Ragga On Fire. In 2026 they present "Borracho y Loco" as rafatrujillo x Equo.',
    },
    {
      q: 'What is rafatrujillo’s first album?',
      a: 'rafatrujillo’s first album is "Ya no es mi canción, y otras películas" (2025), with 8 songs: Cuento; Ya no es mi canción, Pt.1; Ya no es mi canción, Pt.2; Fallas en el corazón; Suenan las alarmas; Mi canción desesperada (electric version); Bailas de la nada; and Mi canción desesperada (acoustic version). It is an album shaped by grief, relationships and memory.',
    },
    {
      q: 'Where can I listen to rafatrujillo?',
      a: 'rafatrujillo’s music is on Spotify, Apple Music and YouTube (channel @rafatrujillo.oficial, with 12 official videos). On rafatrujillo.xyz you can play the songs and read the lyrics (in Spanish).',
    },
    {
      q: 'Does rafatrujillo compose music for film, advertising or other projects?',
      a: 'Yes. Beyond his artist project, rafatrujillo composes and produces original music to order for film and series, advertising and brands, theater, games and other projects, and does studio sessions and collaborations. His film training lets him write with the picture and the edit in mind. Contact: trujillorafa.rafa@gmail.com or the booking form on rafatrujillo.xyz.',
    },
    {
      q: 'How do I contact rafatrujillo for shows or collaborations?',
      a: 'For booking, shows, press, collaborations or licensing, email trujillorafa.rafa@gmail.com or use the form in the "Work together" section of rafatrujillo.xyz. On Instagram he is @rafatrujillomusic.',
    },
  ],
}
