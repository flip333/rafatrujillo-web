import { BORRACHO_Y_LOCO, LATEST_RELEASE, MOSQUITO_BEACH } from './artist-data'

/* Blog de rafatrujillo.xyz.
   Cada entrada está escrita con la voz de Rafa a partir de sus propias notas
   ("historias de canciones") y de los textos oficiales del sitio. No se
   inventan datos: lo que no se sabe (p. ej. la fecha del álbum completo) no se dice.

   SEO: cada entrada tiene una palabra clave principal (en el título, la URL,
   el primer párrafo y un H2), variantes secundarias repartidas en los H2 y
   "Rafa Trujillo" (separado) además de "rafatrujillo", porque Google hoy solo
   relaciona la forma unida con el artista.

   Marcas en los textos: **acento**, *cursiva* y [texto](enlace). */

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h2'; text: string; id: string }
  | { t: 'quote'; text: string; cite?: string }
  | { t: 'lyrics'; lines: string[]; song: string; href?: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  | { t: 'facts'; title: string; items: [string, string][] }
  | { t: 'video'; id: string; title: string }
  | { t: 'listen'; title: string; text: string; spotify?: string; apple?: string; youtube?: string }
  | { t: 'callout'; text: string }
  | { t: 'subscribe'; title: string; text: string }
  | { t: 'faq'; items: [string, string][] }

export interface Post {
  slug: string
  title: string          // H1
  seoTitle: string       // <title> (≤ 60 caracteres aprox.)
  description: string    // meta description (≈ 150–160)
  dek: string            // bajada bajo el título
  category: string
  keywords: string[]
  date: string           // publicación (YYYY-MM-DD)
  updated?: string
  cover: string
  coverAlt: string
  coverPosition?: string
  blocks: Block[]
}

const SPOTIFY_ARTIST = 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi'
const nextTitle = LATEST_RELEASE.title

export const POSTS: Post[] = [
  // ───────────────────────────── 1 ─────────────────────────────
  {
    slug: 'mosquito-beach-segundo-album-rafa-trujillo-asi-no-es-parie',
    title: `${MOSQUITO_BEACH.title}: el segundo álbum de Rafa Trujillo y lo que viene con «${nextTitle}»`,
    seoTitle: `${MOSQUITO_BEACH.title}, el nuevo álbum de Rafa Trujillo | rafatrujillo`,
    description: `Todo sobre ${MOSQUITO_BEACH.title}, el segundo álbum de Rafa Trujillo (rafatrujillo): de qué trata, su primer sencillo y «${nextTitle}», que sale el 27 de noviembre.`,
    dek: 'Un disco sobre volver al origen para poder avanzar. Esto es lo que ya sabes, y lo que llega muy pronto.',
    category: 'Nuevo álbum',
    keywords: ['Mosquito Beach', 'Mosquito Beach álbum', 'Así no es Parié', 'nuevo sencillo rafatrujillo', 'Rafa Trujillo nuevo álbum', 'rafatrujillo 2026', 'segundo álbum rafatrujillo', 'indie pop-rock colombiano'],
    date: '2026-11-24',
    cover: '/fotos/blog-parie.jpg',
    coverAlt: `Rafa Trujillo entre edificios de cartón, imagen de «${nextTitle}», el nuevo sencillo de ${MOSQUITO_BEACH.title}`,
    coverPosition: '32% 16%',
    blocks: [
      { t: 'p', text: `Después de *Ya no es mi canción, y otras películas*, mi primer álbum, llega **${MOSQUITO_BEACH.title}**: el segundo disco de rafatrujillo y, para mí, Rafa Trujillo, el más personal hasta ahora. Ya salió el primer sencillo y el siguiente está a punto de llegar. Aquí te cuento de qué se trata, cómo escucharlo y qué viene.` },

      { t: 'h2', id: 'que-es-mosquito-beach', text: `¿Qué es ${MOSQUITO_BEACH.title}?` },
      { t: 'p', text: `**${MOSQUITO_BEACH.title}** es mi segundo álbum como solista y su ciclo empezó en ${MOSQUITO_BEACH.year} y lo estoy presentando canción por canción. Nace de una necesidad muy concreta: **volver al origen para poder avanzar**.` },
      { t: 'p', text: 'Es un disco sobre crecer. Sobre lo que pasa cuando uno se vuelve adulto y, en el camino, se le olvida cómo era escribir, imaginar y jugar sin miedo. Estos son los temas que lo atraviesan:' },
      { t: 'list', items: [
        '**La adultez** y lo que se queda atrás.',
        '**La memoria**: los recuerdos que vuelven sin avisar.',
        '**Las amistades**, las de siempre y las nuevas.',
        '**Bogotá**, una ciudad que atraviesa todo el disco.',
        '**Los home studios**: grabar en casa, con lo que hay.',
        '**Las colaboraciones** con otros músicos.',
        '**El regreso al niño interior**, como una forma de recuperar la capacidad de volver a volar.',
      ] },
      { t: 'quote', text: 'Volver al origen para poder avanzar.', cite: `La idea detrás de ${MOSQUITO_BEACH.title}` },

      { t: 'h2', id: 'del-atardecer-a-la-noche', text: 'Un álbum que va del atardecer a la noche' },
      { t: 'p', text: 'Vengo del cine, y eso se nota en cómo pienso un disco. En *Mosquito Beach* **cada canción es un momento distinto de un mismo recorrido**: empieza en el atardecer y avanza hacia la noche.' },
      { t: 'p', text: 'Por eso te recomiendo escuchar las canciones en el orden en que van saliendo. Cada sencillo es una escena nueva de la misma película, y cuando el álbum esté completo vas a poder recorrerlo de principio a fin, como una tarde que se va apagando.' },

      { t: 'h2', id: 'del-primer-al-segundo-album', text: 'Del primer álbum al segundo: qué cambió' },
      { t: 'p', text: 'Mi primer álbum, *Ya no es mi canción, y otras películas* (2025), estuvo atravesado por **el duelo, las relaciones y la forma en que las canciones se vuelven memoria**. Fue también el disco en el que aprendí a producir: con [«Suenan las alarmas»](/#letra-suenan-las-alarmas) produje por primera vez una canción de principio a fin, sin ayuda de nadie.' },
      { t: 'p', text: 'Ese disco me dejó dos regalos que hoy son la base de *Mosquito Beach*: **la confianza para producir mis propias canciones** y las ganas de **abrir la puerta a otros músicos**. Además, en 2026 el videoclip de «Ya no es mi canción» fue seleccionado para el **Bogotá Music Video Festival**, una señal bonita de que esa forma de contar historias con imágenes también estaba llegando.' },
      { t: 'callout', text: 'Si quieres conocer el camino completo, desde la primera canción que escribí hasta hoy, lee [cómo construí mi proyecto musical independiente](/blog/como-construi-mi-proyecto-musical-independiente-rafa-trujillo).' },

      { t: 'h2', id: 'primer-sencillo-borracho-y-loco', text: `«${BORRACHO_Y_LOCO.title}», el primer sencillo` },
      { t: 'p', text: `El álbum arrancó el ${BORRACHO_Y_LOCO.releaseLabel} con **«${BORRACHO_Y_LOCO.title}»**, una canción que escribí con Sergio Hoyos y que salió como *${BORRACHO_Y_LOCO.credit}*, en homenaje a Equo, el proyecto que tenemos desde el colegio. Es pegajosa, tiene humor y fue la puerta perfecta para esta nueva etapa.` },
      { t: 'p', text: 'La historia completa de cómo la escribimos y la grabamos entre Bogotá y Manizales está aquí: [la historia detrás de «Borracho y Loco»](/blog/historia-borracho-y-loco-rafatrujillo-equo).' },
      { t: 'video', id: BORRACHO_Y_LOCO.youtubeId, title: `${BORRACHO_Y_LOCO.title} — ${BORRACHO_Y_LOCO.credit} (video oficial)` },

      { t: 'h2', id: 'asi-no-es-parie', text: `El segundo sencillo: «${nextTitle}»` },
      { t: 'p', text: `La siguiente canción de *${MOSQUITO_BEACH.title}* se llama **«${nextTitle}»** y salió el **${LATEST_RELEASE.releaseLabel}** en todas las plataformas, con videoclip oficial.` },
      { t: 'p', text: 'Es otra escena del mismo recorrido. Prefiero que la escuches primero; la historia detrás de la canción llegará pronto, aquí mismo en el blog.' },
      { t: 'video', id: LATEST_RELEASE.youtubeId, title: `${nextTitle} — ${LATEST_RELEASE.credit} (video oficial)` },
      { t: 'subscribe', title: 'Entérate primero del próximo sencillo', text: 'Suscríbete a la lista de correo y te escribo cuando salga la siguiente canción de *Mosquito Beach*. Sin spam: solo música nueva, historias y fechas.' },

      { t: 'h2', id: 'como-seguir-el-album', text: 'Cómo seguir el álbum canción por canción' },
      { t: 'list', items: [
        '**Suscríbete a la lista de correo** (arriba): es la forma más directa de enterarte primero.',
        `**Sigue a rafatrujillo en [Spotify](${SPOTIFY_ARTIST})** para que cada sencillo aparezca en tu Radar de Novedades.`,
        '**Lee el blog**: aquí voy a contar la historia detrás de cada canción de *Mosquito Beach*.',
        'Escucha la [discografía completa](/#discografia) para entender de dónde viene este disco.',
      ] },

      { t: 'faq', items: [
        [`¿Qué es ${MOSQUITO_BEACH.title}?`, `Es el segundo álbum de Rafa Trujillo (rafatrujillo), artista colombiano de indie pop-rock. Explora la adultez, la memoria, las amistades, Bogotá, los home studios, las colaboraciones y el regreso al niño interior, como un recorrido que va del atardecer a la noche.`],
        [`¿Cuál es el primer sencillo de ${MOSQUITO_BEACH.title}?`, `«${BORRACHO_Y_LOCO.title}» (${BORRACHO_Y_LOCO.credit}), publicado el ${BORRACHO_Y_LOCO.releaseLabel}.`],
        [`¿Cuál es el segundo sencillo de ${MOSQUITO_BEACH.title}?`, `«${nextTitle}», publicado el ${LATEST_RELEASE.releaseLabel} en Spotify, Apple Music, YouTube y las demás plataformas.`],
        ['¿Cuál fue el primer álbum de Rafa Trujillo?', '*Ya no es mi canción, y otras películas*, publicado en 2025.'],
      ] },
    ],
  },

  // ───────────────────────────── 2 ─────────────────────────────
  {
    slug: 'historia-borracho-y-loco-rafatrujillo-equo',
    title: `«${BORRACHO_Y_LOCO.title}»: la historia detrás de la canción de rafatrujillo y Equo`,
    seoTitle: `${BORRACHO_Y_LOCO.title}: la historia de la canción | Rafa Trujillo y Equo`,
    description: `La historia detrás de «${BORRACHO_Y_LOCO.title}», la canción de Rafa Trujillo (rafatrujillo) y Equo: cómo nació, quiénes la grabaron y por qué abre ${MOSQUITO_BEACH.title}.`,
    dek: 'Una canción escrita entre dos amigos, grabada entre Bogotá y Manizales, que abre una etapa nueva.',
    category: 'Historia de una canción',
    keywords: ['Borracho y Loco', 'Borracho y Loco historia', 'Borracho y Loco letra', 'rafatrujillo Equo', 'Rafa Trujillo', 'Sergio Hoyos', 'Equo Nombre y Apellido', 'canción indie colombiana'],
    date: '2026-11-24',
    cover: BORRACHO_Y_LOCO.cover,
    coverAlt: 'Portada de «Borracho y Loco»: Rafa Trujillo y Sergio Hoyos caminando con guitarras por un sendero entre árboles',
    coverPosition: 'center 55%',
    blocks: [
      { t: 'p', text: `Hay canciones que se escriben solas y otras que se escriben entre dos. **«${BORRACHO_Y_LOCO.title}»** es de las segundas: la escribí con **Sergio Hoyos**, mi compañero en **Equo**, y salió el ${BORRACHO_Y_LOCO.releaseLabel} como el primer sencillo de *${MOSQUITO_BEACH.title}*, mi segundo álbum. Soy Rafa Trujillo —rafatrujillo en las plataformas— y esta es la historia detrás de la canción.` },

      { t: 'h2', id: 'equo', text: 'Equo: el proyecto que se acaba y vuelve a empezar' },
      { t: 'p', text: 'Equo nació de una amistad de colegio en Manizales. Sergio y yo empezamos a hacer música juntos entre guitarras, composiciones y estudios improvisados, y la música se volvió uno de nuestros idiomas.' },
      { t: 'p', text: 'Es un proyecto **intermitente**, con muchos comienzos, finales y contradicciones. Tantos, que ya es casi un chiste interno.' },
      { t: 'quote', text: 'Equo se ha acabado tantas veces que ya suena chistoso.' },
      { t: 'p', text: 'Pero cada tanto volvemos a juntarnos y escribimos otra canción que nos encanta. La primera fue **«Nombre y Apellido»** en 2021, que superó las 175.000 reproducciones en Spotify. Después vino **«El Flamenquillo»** en 2024. Y ahora, **«Borracho y Loco»**.' },

      { t: 'h2', id: 'como-nacio', text: `Cómo nació «${BORRACHO_Y_LOCO.title}»` },
      { t: 'p', text: 'Con esta canción me quise **salir un poco del estilo** de las dos anteriores, pero sin perder lo que las hacía nuestras: **el humor y lo pegajoso**.' },
      { t: 'lyrics', song: BORRACHO_Y_LOCO.title, href: '/#letra-borracho-y-loco', lines: ['Aunque digan que soy un borracho', 'No soy así'] },
      { t: 'p', text: 'El coro lo resume todo: **perder el freno, pensar en alguien y ponerse sentimental**. Es una canción de fiesta, sí, pero también de esa honestidad rara que aparece cuando ya es tarde y uno dice lo que en otro momento se habría guardado. Puedes [leer la letra completa aquí](/#letra-borracho-y-loco).' },

      { t: 'h2', id: 'grabacion', text: 'La grabación: entre Bogotá y Manizales' },
      { t: 'p', text: '«Borracho y Loco» la **produje yo** y la grabamos en Bogotá, menos las voces de Sergio, que grabamos en Manizales. Toqué todos los instrumentos, excepto el bajo, que grabó **Juan Fernando Rodríguez**. La mezcla y el máster los hizo **Gerónimo Salazar**, con quien trabajo desde mi primer EP.' },
      { t: 'facts', title: 'Ficha de la canción', items: [
        ['Canción', `«${BORRACHO_Y_LOCO.title}»`],
        ['Artistas', BORRACHO_Y_LOCO.credit],
        ['Composición', 'Rafa Trujillo y Sergio Hoyos'],
        ['Producción', 'Rafa Trujillo'],
        ['Bajo', 'Juan Fernando Rodríguez'],
        ['Mezcla y máster', 'Gerónimo Salazar'],
        ['Grabación', 'Bogotá y Manizales'],
        ['Lanzamiento', BORRACHO_Y_LOCO.releaseLabel],
        ['Álbum', `${MOSQUITO_BEACH.title} (primer sencillo)`],
      ] },
      { t: 'p', text: 'Producirla yo mismo fue posible gracias a lo que aprendí en mi primer álbum. Con «Suenan las alarmas» produje por primera vez una canción de principio a fin; con «Borracho y Loco» volví a producir yo mismo, esta vez una canción hecha a cuatro manos.' },

      { t: 'h2', id: 'por-que-con-equo', text: '¿Por qué salió como rafatrujillo x Equo?' },
      { t: 'p', text: `Aunque es el primer sencillo de *${MOSQUITO_BEACH.title}*, un disco de rafatrujillo, quise que saliera **en colaboración con Equo**. Por dos razones: para **hacerle un homenaje al grupo** y para que la canción llegara a **todas esas personas que todavía aman a Equo** y siguen escuchando «Nombre y Apellido».` },
      { t: 'p', text: 'Si llegaste a mi música por Equo, bienvenido: esta canción es un puente entre las dos cosas.' },
      { t: 'video', id: BORRACHO_Y_LOCO.youtubeId, title: `${BORRACHO_Y_LOCO.title} — ${BORRACHO_Y_LOCO.credit} (video oficial)` },

      { t: 'h2', id: 'el-comienzo-de-mosquito-beach', text: `El comienzo de ${MOSQUITO_BEACH.title}` },
      { t: 'p', text: `«Borracho y Loco» abre oficialmente *${MOSQUITO_BEACH.title}*, un álbum sobre la adultez, la memoria, las amistades y el regreso al niño interior. Tenía sentido empezar con una canción hecha con un amigo de toda la vida. Si quieres saber de qué va el disco y qué canción viene ahora, lee [todo sobre ${MOSQUITO_BEACH.title} y «${nextTitle}»](/blog/mosquito-beach-segundo-album-rafa-trujillo-asi-no-es-parie).` },
      { t: 'listen', title: `Escucha «${BORRACHO_Y_LOCO.title}»`, text: 'Disponible en todas las plataformas.', spotify: BORRACHO_Y_LOCO.spotifyUrl, apple: BORRACHO_Y_LOCO.appleMusicUrl, youtube: `https://www.youtube.com/watch?v=${BORRACHO_Y_LOCO.youtubeId}` },

      { t: 'faq', items: [
        [`¿Quién escribió «${BORRACHO_Y_LOCO.title}»?`, 'Rafa Trujillo (rafatrujillo) y Sergio Hoyos, los dos integrantes de Equo.'],
        [`¿De qué álbum es «${BORRACHO_Y_LOCO.title}»?`, `Es el primer sencillo de ${MOSQUITO_BEACH.title}, el segundo álbum de rafatrujillo, publicado como ${BORRACHO_Y_LOCO.credit} el ${BORRACHO_Y_LOCO.releaseLabel}.`],
        ['¿Qué es Equo?', 'Equo es el proyecto de Sergio Hoyos y Rafa Trujillo, nacido de una amistad de colegio en Manizales. Sus canciones son «Nombre y Apellido» (2021), «El Flamenquillo» (2024) y «Borracho y Loco» (2026).'],
        [`¿Dónde escuchar «${BORRACHO_Y_LOCO.title}»?`, 'En Spotify, Apple Music y YouTube, donde tiene video oficial.'],
      ] },
    ],
  },

  // ───────────────────────────── 3 ─────────────────────────────
  {
    slug: 'como-construi-mi-proyecto-musical-independiente-rafa-trujillo',
    title: 'Cómo construí mi proyecto musical independiente: de una nota de voz a dos álbumes',
    seoTitle: 'Cómo construí mi proyecto musical independiente | Rafa Trujillo',
    description: 'Rafa Trujillo (rafatrujillo) cuenta cómo pasó del cine a la música: una nota de voz, Equo, Barcelona, un home studio y lo que aprendió como músico independiente.',
    dek: 'No empecé en la música: empecé en el cine. Esta es la historia, con todo lo que aprendí en el camino.',
    category: 'Proceso',
    keywords: ['proyecto musical independiente', 'cómo empezar un proyecto musical', 'músico independiente Colombia', 'home studio', 'Rafa Trujillo', 'Rafa Trujillo músico', 'rafatrujillo', 'Cruzao Music', 'música de Manizales'],
    date: '2026-11-24',
    cover: '/fotos/foto-megaland-2024.jpg',
    coverAlt: 'Rafa Trujillo cantando y tocando guitarra eléctrica en el escenario del Megaland Music Fest 2024',
    coverPosition: 'center 35%',
    blocks: [
      { t: 'p', text: '¿Cómo empieza un proyecto musical? En mi caso, la respuesta corta es que **no empecé en la música, empecé en el cine**. La larga es esta. Soy Rafa Trujillo, el músico detrás de rafatrujillo, y así fui construyendo mi **proyecto musical independiente**, paso a paso, con muchos errores y algunas sorpresas. Si estás empezando el tuyo, al final te dejo lo que aprendí.' },

      { t: 'h2', id: 'nota-de-voz', text: '1. Una nota de voz grabada en un baño' },
      { t: 'p', text: 'La primera canción que escribí en mi vida fue [«los lunes pienso»](/#letra-los-lunes-pienso). La grabé con el celular, **metido en el baño de mi apartamento en Bogotá**, dizque para que sonara con eco.' },
      { t: 'p', text: 'Yo todavía estudiaba cine y ni siquiera pensaba en ser músico. Pero esa nota de voz se regó entre amigos y conocidos, y años después terminó siendo la canción más escuchada de todo mi catálogo.' },
      { t: 'quote', text: 'La cantaré en cada concierto de mi vida, hasta que me muera.', cite: 'Sobre «los lunes pienso»' },

      { t: 'h2', id: 'la-cancion-demasiado-personal', text: '2. Equo y la canción que era demasiado personal' },
      { t: 'p', text: 'Durante el Covid, en la época de «Nombre y Apellido» con Equo, escribí [«sin tenerte a ti»](/#letra-sin-tenerte-a-ti). Iba a ser la segunda canción del grupo, pero era **demasiado personal**, así que decidí grabarla solo.' },
      { t: 'p', text: 'La grabé en los estudios de **Cruzao Music** con **Gerónimo Salazar**. Fue la primera vez que me senté a trabajar con Gero, y con cada sesión quedaba más en shock: la canción me causaba una reacción emocional muy fuerte, y eso que ni la habíamos terminado. La mezcla y el máster los hizo **Gustavo Sachetti**, antiguo tecladista de Vilma Palma e Vampiros.' },
      { t: 'quote', text: 'Me causaba una reacción emocional muy fuerte, y por esa sensación decidí tomármelo en serio y lanzarme como solista.' },
      { t: 'p', text: 'Salió en 2023 y fue **lo primero que publiqué como solista**, incluso antes que «los lunes pienso». Todavía hoy es mi canción favorita.' },

      { t: 'h2', id: 'barcelona', text: '3. Barcelona: aprender, tocar y vivir con músicos' },
      { t: 'p', text: 'Luego me fui a vivir a Barcelona, y esa etapa me cambió. Allá tomé **clases de producción con Emiliano Scippo**, un productor argentino con quien grabé la primera versión de [«cenizas»](/#letra-cenizas), una canción que nació del riff de guitarra de un cortometraje que dirigí en la universidad.' },
      { t: 'p', text: 'También escribí [«no sigue»](/#letra-no-sigue), la canción que más me costó. Me atasqué, y para salir de ahí probé cosas que nunca había hecho, como **escoger palabras al azar**, buscarles rima y darles sentido después. Aprendí muchísimo, porque hasta ese momento todas las canciones me habían salido sin esfuerzo.' },
      { t: 'p', text: 'Y viví en una casa con **siete personas de nacionalidades distintas**, casi todas músicas. Tocábamos todas las noches, iba gente a vernos, nos contrataron para eventos privados y una vez armamos un toque en una calle de la Barceloneta al que se fue sumando un montón de músicos. Me tuve que ir a los dos meses, pero me quedaron amistades increíbles y una canción: [«si te vas»](/#letra-si-te-vas).' },

      { t: 'h2', id: 'primer-ep', text: '4. Volver a Manizales y cerrar el primer EP' },
      { t: 'p', text: 'De vuelta en Manizales grabé con Gerónimo «cenizas», «no sigue» y «si te vas», que mezcló y masterizó **Stefano Pizzaia**. Con esas canciones, más «los lunes pienso» y «sin tenerte a ti», completé mi **primer EP**, que salió en 2024. Ese mismo año toqué en el **Megaland Music Fest**, la foto que ves arriba.' },

      { t: 'h2', id: 'home-studio', text: '5. Un home studio pequeño y la confianza para producir' },
      { t: 'p', text: 'Para mi primer álbum armé un **home studio mini** en mi casa. Ahí grabé [«Fallas en el corazón»](/#letra-fallas-en-el-corazon) con **Rafael González**, que había producido las canciones de Equo.' },
      { t: 'p', text: 'El gran salto fue [«Suenan las alarmas»](/#letra-suenan-las-alarmas): **la primera canción que produje de principio a fin, sin ayuda de nadie**. Toqué todos los instrumentos menos un teclado, incluida la batería, que grabamos en Antera Estudios con Sergio Gutiérrez, inspirada en el groove de Steve Gadd en «50 Ways to Leave Your Lover».' },
      { t: 'p', text: 'Así nació *Ya no es mi canción, y otras películas*, mi primer álbum, en 2025. En 2026 el videoclip de «Ya no es mi canción» fue seleccionado para el **Bogotá Music Video Festival**.' },

      { t: 'h2', id: 'del-cine-a-los-videoclips', text: '6. Del cine a los videoclips' },
      { t: 'p', text: 'Nunca dejé el cine: se metió en la música. «cenizas» salió de un cortometraje. Para el videoclip de «Fallas en el corazón» usé **videos antiguos grabados por mi abuelo** y material de archivo con mi familia y mis amigos. Y el de «Suenan las alarmas» lo dirigí yo, en Manizales. Para mí, **cada canción es una escena** de una historia más grande.' },

      { t: 'h2', id: 'lo-que-aprendi', text: 'Lo que aprendí (por si estás empezando tu proyecto musical)' },
      { t: 'list', ordered: true, items: [
        '**Graba la idea como sea.** Una nota de voz en el celular basta. Mi primera canción empezó en un baño.',
        '**Rodéate de gente que sepa más que tú.** Gerónimo, Gustavo, Emiliano y Stefano me enseñaron muchísimo.',
        '**Cuando te atasques, cambia las reglas.** Palabras al azar, otro círculo de acordes, otra afinación. Así salieron «no sigue» y «Ya no es mi canción, Pt.2».',
        '**No todas las canciones tienen que salir ya.** «Mi canción desesperada» esperó años hasta encontrar su disco.',
        '**Aprende a producir poco a poco.** Primero acompañado, después solo. El home studio no tiene que ser grande.',
        '**Cuenta tus propias historias.** El archivo de tu familia, tus amigos y tu ciudad valen más que cualquier tendencia.',
      ] },
      { t: 'callout', text: 'Hoy estoy en mi siguiente capítulo: [Mosquito Beach, mi segundo álbum](/blog/mosquito-beach-segundo-album-rafa-trujillo-asi-no-es-parie), que empezó con [«Borracho y Loco»](/blog/historia-borracho-y-loco-rafatrujillo-equo).' },
      { t: 'listen', title: 'Escucha el camino completo', text: 'Desde «sin tenerte a ti» hasta el último sencillo, en Spotify.', spotify: SPOTIFY_ARTIST },

      { t: 'faq', items: [
        ['¿Quién es Rafa Trujillo?', 'Rafa Trujillo (rafatrujillo) es un artista, compositor, productor y multiinstrumentista colombiano de Manizales, con formación en cine. Hace indie pop-rock con una mirada narrativa.'],
        ['¿Cuál fue la primera canción de rafatrujillo?', 'La primera que escribió fue «los lunes pienso»; la primera que publicó como solista fue «sin tenerte a ti», en 2023.'],
        ['¿Con quién ha trabajado Rafa Trujillo?', 'Con el productor Gerónimo Salazar (Cruzao Music), Rafael González, Emiliano Scippo, Gustavo Sachetti y Stefano Pizzaia, entre otros, y con Sergio Hoyos en Equo.'],
        ['¿Dónde graba rafatrujillo?', 'En su home studio, en los estudios de Cruzao Music en Manizales y en Antera Estudios en Bogotá.'],
      ] },
    ],
  },
]

// ── Utilidades ──
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*?([^*]+)\*\*?/g, '$1')

export function postText(p: Post): string {
  return p.blocks.map(b => {
    switch (b.t) {
      case 'p': case 'callout': case 'h2': return plain(b.text)
      case 'quote': return plain(b.text)
      case 'lyrics': return b.lines.join(' ')
      case 'list': return b.items.map(plain).join(' ')
      case 'facts': return b.items.map(i => i.join(' ')).join(' ')
      case 'faq': return b.items.map(([q, a]) => `${q} ${plain(a)}`).join(' ')
      case 'listen': case 'subscribe': return `${b.title} ${b.text}`
      default: return ''
    }
  }).join(' ')
}

export const readingMinutes = (p: Post) => Math.max(1, Math.round(postText(p).split(/\s+/).length / 220))

export const getPost = (slug: string) => POSTS.find(p => p.slug === slug) ?? null

// Más recientes primero (mismo día: se respeta el orden del arreglo)
export const sortedPosts = () => [...POSTS].sort((a, b) => b.date.localeCompare(a.date))

export const postUrl = (p: Post) => `/blog/${p.slug}`

export const fmtPostDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))

export { plain as plainText }
