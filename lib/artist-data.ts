export const ARTIST = {
  name:        'rafatrujillo',
  displayName: 'rafatrujillo',
  fullName:    'Rafa Trujillo',
  genre:       'Indie Pop-Rock',
  city:        'Manizales',
  country:     'Colombia',
  bio: `rafatrujillo es un artista, compositor, productor y multiinstrumentista colombiano que construye su música desde la canción, las guitarras, la producción independiente y una mirada profundamente narrativa.`,
  images: {
    // Hero: foto de la sesión del álbum 2025 (vertical, cinematográfica)
    hero:       '/fotos/sesion-2025-05.jpg',
    profile640: '/fotos/foto-press-01.jpg',
    profile320: '/fotos/foto-press-01.jpg',
    portrait:   '/fotos/foto-press-02.jpg',
    megaland:   '/fotos/foto-megaland-2024.jpg',
  },
  urls: {
    spotify:      'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
    appleMusic:   'https://music.apple.com/mx/artist/rafatrujillo/1758386046',
    instagram:    'https://www.instagram.com/rafatrujillomusic/',
    youtube:      'https://www.youtube.com/@rafatrujillo.oficial',
  },
  spotifyId: '6RgSjDL2gCy477DQ9azqYi',
  // Booking, colaboraciones y servicios (música para cine, publicidad, proyectos)
  bookingEmail: 'trujillorafa.rafa@gmail.com',
} as const

export const ALBUM_DEBUT = {
  title:  'Ya no es mi canción, y otras películas',
  slug:   'ya-no-es-mi-cancion',
  year:   2025,
  type:   'album' as const,
  cover:  '/fotos/portada-album.png',
  tracks: [
    { n: 1, title: 'Cuento',                                     exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b273d7c53d4385242cfef00c22b3' },
    { n: 2, title: 'Ya no es mi canción, Pt.1',                 exclusive: false, cover: '/fotos/portada-ya-no-es-mi-cancion-pt1.jpg' },
    { n: 3, title: 'Ya no es mi canción, Pt.2',                 exclusive: false, cover: '/fotos/portada-album.png' },
    { n: 4, title: 'Fallas en el corazón',                      exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b273480647da3300fc6132acf272' },
    { n: 5, title: 'Suenan las alarmas',                         exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b273f5d10e141674502278734d27' },
    { n: 6, title: 'Mi canción desesperada (versión eléctrica)', exclusive: false, cover: '/fotos/portada-album.png' },
    { n: 7, title: 'Bailas de la nada',                         exclusive: false, cover: '/fotos/portada-album.png' },
    { n: 8, title: 'Mi canción desesperada (versión acústica)',  exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b2730a84d387e9b711a15304f6de' },
  ],
} as const

export const EP_01 = {
  title:  'EP. 01',
  year:   2024,
  type:   'ep' as const,
  cover:  'https://i.scdn.co/image/ab67616d0000b273724daea1dab90bf481c1f955',
  tracks: [
    { title: 'los lunes pienso',              cover: 'https://i.scdn.co/image/ab67616d0000b273a68759222fa4fa254a41473e' },
    { title: 'sin tenerte a ti',              cover: 'https://i.scdn.co/image/ab67616d0000b27356ca6c97c7afa70d557c0b2a' },
    { title: 'cenizas',                       cover: 'https://i.scdn.co/image/ab67616d0000b27343f0728bb77ce2bae07ffa9a' },
    { title: 'no sigue',                      cover: 'https://i.scdn.co/image/ab67616d0000b273724daea1dab90bf481c1f955' },
    { title: 'si te vas',                     cover: 'https://i.scdn.co/image/ab67616d0000b2735f0d162d7793db300b3385ae' },
    { title: 'sin tenerte a ti (Instrumental)', cover: 'https://i.scdn.co/image/ab67616d0000b27356ca6c97c7afa70d557c0b2a' },
  ],
} as const

export const EQUO = {
  name:     'Equo',
  members:  ['Sergio Hoyos', 'rafatrujillo'],
  producer: 'Ragga On Fire',
  singles: [
    { title: 'Nombre y Apellido',               year: 2021 },
    { title: 'El Flamenquillo',                 year: 2024 },
    { title: 'Borracho y Loco',                   year: 2026 },
  ],
} as const

// ─── Último lanzamiento / nueva etapa ──────────────────────────────
export const LATEST_RELEASE = {
  title:       'Borracho y Loco',
  credit:      'rafatrujillo x Equo',
  releaseDate: '2026-09-25',
  releaseLabel:'25 de septiembre de 2026',
  cover:       '/fotos/portada-borracho-y-loco.jpg',
  spotifyUrl:  'https://open.spotify.com/album/4nP7yOmEMKuxeePJHO02E2',
  appleMusicUrl: 'https://music.apple.com/co/album/borracho-y-loco/6814494737',
  youtubeId:   'bYalxExKqP0',
} as const

export const MOSQUITO_BEACH = {
  title: 'Mosquito Beach',
  year:  2026,
} as const

export const SINGLES = [
  { title: 'Ya no es mi canción, Pt.1',  year: 2025, cover: 'https://i.scdn.co/image/ab67616d0000b27378e3c7b8a1669833f2af79af' },
  { title: 'Suenan las alarmas',          year: 2025, cover: 'https://i.scdn.co/image/ab67616d0000b273f5d10e141674502278734d27' },
  { title: 'Mi canción desesperada',      year: 2025, cover: 'https://i.scdn.co/image/ab67616d0000b2730a84d387e9b711a15304f6de' },
  { title: 'Cuento',                      year: 2024, cover: 'https://i.scdn.co/image/ab67616d0000b273d7c53d4385242cfef00c22b3' },
  { title: 'Fallas en el corazón',       year: 2024, cover: 'https://i.scdn.co/image/ab67616d0000b273480647da3300fc6132acf272' },
  { title: 'si te vas',                   year: 2024, cover: 'https://i.scdn.co/image/ab67616d0000b2735f0d162d7793db300b3385ae' },
  { title: 'sin tenerte a ti',            year: 2023, cover: 'https://i.scdn.co/image/ab67616d0000b27356ca6c97c7afa70d557c0b2a' },
  { title: 'los lunes pienso',            year: 2023, cover: 'https://i.scdn.co/image/ab67616d0000b273a68759222fa4fa254a41473e' },
  { title: 'no sigue',                    year: 2023, cover: 'https://i.scdn.co/image/ab67616d0000b273724daea1dab90bf481c1f955' },
] as const

// Keywords de las barras animadas (SectionDivider) = nombres de las canciones.
// Se arma desde álbum + EP + singles, quitando versiones/instrumentales y duplicados.
const _SONG_TITLES: string[] = [
  LATEST_RELEASE.title,
  ...ALBUM_DEBUT.tracks.map(t => t.title),
  ...EP_01.tracks.map(t => t.title),
  ...SINGLES.map(s => s.title),
]
export const SONG_KEYWORDS: string = Array.from(
  new Map(
    _SONG_TITLES
      .map(t => t.replace(/\s*\((?:versión|version|instrumental)[^)]*\)/i, '').trim())
      .map(t => [t.toLowerCase(), t]),
  ).values(),
).join('  ·  ')

// ─── Reproductor global (Spotify iFrame API) ──────────────────────
// URIs de Spotify. Al abrir la página se elige una canción al azar.
export const PLAYLIST = [
  { title: 'Borracho y Loco',            uri: 'spotify:album:4nP7yOmEMKuxeePJHO02E2' },
  { title: 'Ya no es mi canción, Pt.1',  uri: 'spotify:album:1dACyXqypaxzlLgoUbThP8' },
  { title: 'Suenan las alarmas',         uri: 'spotify:album:5hMTyQBO360iVUooAwwiII' },
  { title: 'Mi canción desesperada',     uri: 'spotify:album:5xHGNyx5ET2lEfegqgx2AL' },
  { title: 'Cuento',                     uri: 'spotify:album:2oiktsf7PRZJzRYdORNBha' },
  { title: 'Fallas en el corazón',       uri: 'spotify:album:3HyEMCVS5I6mJK9ZtUic3A' },
  { title: 'si te vas',                  uri: 'spotify:album:3cMNWj6JNDx2dATpFu2uVY' },
  { title: 'sin tenerte a ti',           uri: 'spotify:album:42Fl9IcP19OeFLgFFFK8vF' },
  { title: 'los lunes pienso',           uri: 'spotify:album:7cK0rwtbgM3MsZLdkcFhS0' },
] as const

export const SPOTIFY_URIS = {
  latest: 'spotify:album:4nP7yOmEMKuxeePJHO02E2',
  album:  'spotify:album:1naj0GmVEGImqQgMgoLoWE',
  ep:     'spotify:album:78ocnQbrpoth2IDsmPnoae',
} as const

// ─── Fechas / eventos ────────────────────────────────────────────
// La sección "Fechas" solo aparece si hay eventos futuros en esta lista.
export type LiveEvent = {
  date: string       // ISO, p. ej. '2026-11-20'
  city: string
  venue: string
  ticketsUrl?: string
}
export const EVENTS: LiveEvent[] = []

// ─── Prensa / EPK ────────────────────────────────────────────────
export const PRESS = {
  shortBio: 'rafatrujillo es un artista, compositor, productor y multiinstrumentista colombiano. Con formación en cine, construye canciones como escenas de una historia mayor. En 2025 lanzó su primer álbum, "Ya no es mi canción, y otras películas", y en 2026 inicia Mosquito Beach, su segundo álbum, con el sencillo "Borracho y Loco" junto a Equo.',
  shortBioEn: 'rafatrujillo is a Colombian artist, songwriter, producer and multi-instrumentalist. Trained in film, he writes songs as scenes from a larger story. In 2025 he released his first album, "Ya no es mi canción, y otras películas", and in 2026 he begins Mosquito Beach, his second album, with the single "Borracho y Loco" featuring Equo.',
} as const

// Videos oficiales del canal de YouTube (@rafatrujillo.oficial), del más reciente al más antiguo.
// No incluye Shorts.
export const YOUTUBE_VIDEOS = [
  { id: 'bYalxExKqP0', title: 'Borracho y Loco — rafatrujillo x Equo',  type: 'official', year: 2026 },
  { id: 'AIlwZJciG1o', title: 'ya no es mi canción pt I + pt II',          type: 'official', year: 2025 },
  { id: '-UxhIUjIHNg', title: 'Suenan las alarmas',                        type: 'official', year: 2025 },
  { id: 'FrzctFi_tp4', title: 'Mi canción desesperada',                    type: 'official', year: 2025 },
  { id: 'XSiahemUDJs', title: 'Mi canción desesperada (Acústica)',         type: 'live',     year: 2025 },
  { id: 'TTdUmHufO64', title: 'Cuento',                                    type: 'official', year: 2024 },
  { id: 'pIb499yEVS0', title: 'Fallas en el corazón',                      type: 'official', year: 2024 },
  { id: 'MgBHEZn6oDI', title: 'si te vas',                                 type: 'official', year: 2024 },
  { id: 'FYUXWpylWqI', title: 'no sigue',                                  type: 'official', year: 2023 },
  { id: '8DOjQvELPY4', title: 'cenizas',                                   type: 'official', year: 2023 },
  { id: 'Fh3yTUK3l-E', title: 'los lunes pienso',                          type: 'official', year: 2023 },
  { id: 'XtXiwRDGVP4', title: 'sin tenerte a ti',                          type: 'official', year: 2023 },
] as const

// ─── Letras de las canciones ───────────────────────────────────────
// Clave = título normalizado (minúsculas, sin sufijos de versión).
export const LYRICS: Record<string, string> = {
  'borracho y loco': `Aunque digan que soy un borracho
No soy así,
Fue dos fiestas después
Y yo no te reconocí.
Ahora háblame de tu vida,
No quiero poner en tema la mía,
Tal vez porque te irías,
Porque te irías.

Borracho y loco,
Yo te digo poco a poco, verás,
Borracho y loco,
Pierdo el freno y no me choco,
Pienso en tu amor,
Y yo me pongo sentimental, wo'
Y ahí sí cada vez más
Borracho y loco,
Y loco.

A las doce yo no aparecía,
Yo me perdí,
No podría explicarles
En qué hueco me metí,
Y yo nada que aparecía,
Y tú llame y llame a la policía
Mientras yo me escondía,
Yo me escondía.

Borracho y loco,
Yo te digo poco a poco, verás,
Borracho y loco,
Pierdo el freno y no me choco,
Pienso en tu amor,
Y yo me pongo sentimental, wo'
Y ahí sí cada vez más
Borracho y loco,
Y loco.

Pienso en tu amor,
Y me pongo sentimental, wo'
Y ahí sí cada vez más
Borracho y loco,
Y loco.`,

  'cuento': `Ahora que
viniste a mi casa y no te vi,
y no te vi, y no te vi.
Me duele porque
me acostumbré a vivir sin ti,
vivir sin ti, vivir sin ti.

Mi realidad es un cuento,
entre más te dejo ir, más cercano me siento.
Debo esperar el momento,
si te preguntan por ahí, se te olvidó lo que siento.

Lo sabes bien,
que estando con él piensas en mí,
sabes que sí, piensas en mí.
Me duele porque
me acostumbré a vivir sin ti,
morir por ti, vivir sin ti.

Mi realidad es un cuento,
entre más te dejo ir, más cercano me siento.
Debo esperar el momento,
si te preguntan por ahí, se te olvidó lo que siento.`,

  'ya no es mi canción, pt.1': `Me despido en la estación,
y aunque nada fue ficción,
ya no puedo, ya no es mi canción.

No alarguemos el final,
lo dejamos al azar,
yo y el tiempo, tú y el mar.

Esta vez no lo conseguí,
llegó el invierno y yo sin ti.

Signos de interrogación,
te lo escribo en el avión,
ya no quiero, ya no es mi canción.

Esta vez no lo conseguí,
llegó el invierno y yo sin ti,
y entre más persigo el cielo,
ya lo perdí.
No me puedo quedar aquí.

Ya no es mi canción.`,

  'ya no es mi canción, pt.2': `No puedo más con esto,
me despido en la estación,
ya no es mi canción.

Me quedo con el resto,
y aunque nada fue ficción,
ya no es mi canción.

No es para mí, ya no da más.
No puedo repetir nunca jamás.

Si me hubieras dicho antes
que el invierno terminó,
nunca fue una obra de arte,
nunca fue una religión,
si me lo hubieras dicho antes
me guardaba esta ilusión
de marinero delirante,
ya no es mi canción.

En marzo me congelo,
no tengo calefacción,
ya no es mi canción.

Me quedo aquí en el suelo sucio
de mi habitación,
ya no es mi canción.

No es para mí, no quiero más.
No puedo repetir nunca jamás.

Si me hubieras dicho antes
que el invierno terminó,
nunca fue una obra de arte,
nunca fue una religión,
si me lo hubieras dicho antes
me guardaba esta ilusión
de marinero delirante,
ya no es mi canción. (x2)

Si me hubieras dicho antes
me guardaba esta ilusión
de marinero delirante.
Ya no es mi canción.`,

  'fallas en el corazón': `Si alguna vez te di todo lo que no tengo,
tú eras la dueña de cada rincón,
y sí, fallé, lo siento, yo te lo sostengo
que tengo fallas en el corazón.

Me olvidé de todo,
ya no tengo tiempo,
pero nunca supe si hubo explicación
de las cosas que vivimos,
de todo lo que sentimos,
tengo muchos problemas,
tienes toda la razón.

Y que no se te olvide,
antes que el corazón se te oxide,
me verás en las cartas que tires,
las cosas que mires,
me tienes en cada momento que vives.
Que no se te olvide,
antes que el corazón se te oxide,
me verás en las cartas que tires,
las cosas que mires,
me tienes en cada momento que vives.

Ya no tienes fotos, ya no más recuerdos,
ya en tu cuarto pones la calefacción
que faltaba sin mi abrigo,
ya no estoy allá contigo,
seguro ya encontraste algo mejor.

Que no se te olvide,
antes que el corazón se te oxide,
me verás en las cartas que tires,
las cosas que mires,
me tienes en cada momento que vives.`,

  'suenan las alarmas': `Ya que,
no tiene sentido preocuparse,
ya no estoy aquí para esperar que todo pase,
y que no rime la frase con la verdad.

Ya que,
no quiero saber de sentimiento,
no queda motivo pa’ robarle tiempo al tiempo,
pa’ enfrentarme contra el viento y contra el mar.

Suenan las alarmas,
no puedes despertar,
ves a tu fantasma sentado en el sofá.
No quedan palabras pa’ decirte a ti,
“no quiero estar sin ti”,
porque de amor no quiero más.
Ves a tu fantasma sentado en el sofá.

Ya qué,
antes que me ponga yo a buscarte,
antes de empezar a caminar hacia otra parte,
de seguir sin preguntarme si volverás.

Ya que,
no tengo razón de levantarme,
no tengo palabras pa’ explicarte lo que siento,
lo que me come por dentro, no quiero más.

Suenan las alarmas,
no puedes despertar,
ves a tu fantasma sentado en el sofá.
No quedan palabras pa’ decirte a ti,
“no quiero estar sin ti”,
porque de amor no quiero más.
Ves a tu fantasma sentado en el sofá.`,

  'mi canción desesperada': `Soñaste que me iba,
tú soñaste que no estaba,
soñaste que partía,
que mi vida terminaba.

Soñaste con espejos,
ya has soñado con heridas,
con un montón de viejos
que ya cantaron sus mentiras.

Pero dime qué soñaste, dime cómo era,
dime que robaste mi sombra aquí en la tierra.
Dime cómo iba, dime qué pasaba,
dime si mi vida se ve bonita terminada.

Soñaste con montañas,
tumbas grises en silencio,
soñaste que anunciaban
una oreja y cambio de tercio,
soñaste con el norte,
tú soñaste con espadas,
soñaste con el borde de una vida acumulada.

Pero dime qué soñaste, dime cómo era,
dime que robaste mi sombra aquí en la tierra.
Dime cómo iba, dime qué pasaba,
dime si mi vida se ve bonita terminada.
Mi canción desesperada.`,

  'bailas de la nada': `Día gris y bailas de la nada,
no estás ahí, todo es cuento de hadas
para ti, para ti.

Día gris y cambia tu mirada,
habla de ti tu casa abandonada.
No estás ahí, no estás ahí.

Si no estás en tu cuerpo,
dime dónde te encuentro.
Si te vas para adentro,
llévame a mí, llévame a mí.

Día gris, muestra tus cicatrices,
no tiene sentido lo que dices.
No estás ahí, no estás ahí.

Si no estás en tu cuerpo,
dime dónde te encuentro.
Si te vas para adentro,
llévame a mí, llévame a mí.`,

  'los lunes pienso': `Pienso que mi vida no es así,
que me duele estar sin ti,
te lo confieso.

Siento que mi vida no es igual,
que no aguanto si no estás
un segundo más aquí.

Y lo presiento,
el tiempo no me va a alcanzar para ti,
y lo presiento,
que mi vida no es para ti.

Los lunes pienso
que yo cambié por no dejarme morir,
que al fin la vida me enseñó a vivir.
Los lunes pienso.
Cómo pensar
si estoy tan solo en este lugar,
si yo morí por no dejarme matar.
Los lunes pienso.

Siento el espejo frente a mí,
yo me digo vuelve aquí,
y no me entiendo.

Siento que vivir es suspirar
cuando juegas al azar
sin argumento.

Y lo presiento,
el tiempo no me va a alcanzar para ti,
y lo presiento,
que mi vida no es para ti.

Los lunes pienso
que yo cambié por no dejarme morir,
que al fin la vida me enseñó a vivir.
Los lunes pienso.
Cómo pensar
si estoy tan solo en este lugar,
si yo morí por no dejarme matar.
Los lunes pienso.`,

  'sin tenerte a ti': `No, no, ya verás que no,
ya no quiero ser el viejo impostor,
el que miente en las campañas,
el del miedo en sus hazañas
terminó, terminó.

Adiós a todo lo que fui yo,
ando en busca de respuestas,
de perdón.
Me descubro, me reinvento,
aprendí a soñar despierto
sin razón, sin razón.

No, nada cambió.
No, nada cambió.

Entra el desespero,
dime qué debo sentir
cuando todo lo que veo
me recuerda lo que fui,
lo que era sin tenerte,
lo que fui dejando atrás
lo perdí, lo perdí.

Llegó la hora de decirlo,
este es mi turno de vivir,
quiero dejar de resistirlo,
nunca parar de sonreír.
Muéstrame cómo vivir
sin tenerte a ti.`,

  'cenizas': `Se va por la carretera,
dejó una foto en la escalera,
y nadie la encontró,
nadie lo vio salir.
Y no sé dónde leyó
que el mar era hacia allí.

Y solo quedan cenizas,
pero las cenizas queman.
Y solo quedan cenizas,
pero las cenizas queman.

Se va, el camino se hace largo.
Salió, cada paso sabe amargo.
Y sin mirar atrás,
sin tiempo para huir
de la tristeza que quizás
lo persiga por ahí.

Y solo quedan cenizas,
pero las cenizas queman.
Y solo quedan cenizas,
pero las cenizas queman.`,

  'no sigue': `Si en algún lugar, en algún rincón,
ya no puedes más, ya no ves el sol,
se te fue la luz, se te fue el calor,
se te fue la vida en esa habitación.

Si encontrara yo la forma,
retroceder la historia que quedó el mar,
y flota hacia otra realidad invisible,
invisible, invisible.
Terminaré este cuento que no fue verdad,
quedó partido a la mitad y no sigue,
y no sigue, y no sigue.

Si ya son las tres y no puedes dormir,
si después de un mes nada te hace reír,
y todo es igual, vuelve a repetir,
y me sientes aunque ya no esté aquí.

Si encontrara yo la forma,
retroceder la historia que quedó el mar,
y flota hacia otra realidad invisible,
invisible, invisible.
Terminaré este cuento que no fue verdad,
quedó partido a la mitad y no sigue,
y no sigue, y no sigue.`,

  'si te vas': `Si te vas, llévate mi cuerpo,
mi dolor, mis momentos de miedo,
mi realidad.

Si te vas, llévate mi historia,
andaré sin que tenga sentido,
sin saber nada más.

Y no sé qué va a pasar contigo.

Si te vas, devuelve mis canciones,
las que dices que canto distinto,
“ya no es igual”.
Si te vas, llévame contigo amor,
llévame de ilegal, vamos lejos
a otro lugar.

Y no sé qué va a pasar contigo,
y no sé qué va a pasar.

Si te vas, llévate mi historia,
andaré sin que tenga sentido,
sin saber nada más.
Si te vas, llévame contigo amor,
llévame de ilegal, vamos lejos
a otro lugar.

Y no sé qué va a pasar contigo,
y no sé qué va a pasar.`,
}

// Créditos del álbum (sin mención al sello, por decisión editorial).
export const ALBUM_CREDITS = `Música y letras por rafatrujillo.

Producido por rafatrujillo, Rafael González y Gerónimo Salazar.

Mezcla y Master — Alejandro Granados (5, 8), Alejandro Prias (4), Gerónimo Salazar (1–3, 7), Gustavo Sacchetti (6).

rafatrujillo — Voz, guitarra eléctrica, guitarra acústica, teclados (1, 2, 4, 5, 7), batería (3, 5), percusión (1, 4, 5, 8).
Gerónimo Salazar — Teclados, bajo (1, 2, 4–7), guitarra eléctrica (2, 3), guitarra acústica (8), percusión (6, 7).
Eduardo Oviedo — Batería (2).
Sergio Gutiérrez — Batería (7).
Juan Fernando Rodríguez — Bajo (3).

Diseños por Victoria Gutiérrez.
Fotos por Sebastián Comba.`

// Helpers para el pop-up de letras
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*\((?:versión|version|instrumental)[^)]*\)/i, '')
    .trim()
}
export function isInstrumental(title: string): boolean {
  return /instrumental/i.test(title)
}
export function getLyrics(title: string): string | null {
  return LYRICS[normalizeTitle(title)] ?? null
}
