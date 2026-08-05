export const ARTIST = {
  name:        'rafatrujillo',
  displayName: 'RAFATRUJILLO',
  fullName:    'Rafa Trujillo',
  label:       'Cruzao Music',
  genre:       'Alternativa',
  country:     'Colombia',
  bio: `rafatrujillo creció entre acordes e historias.
Con formación como cineasta, encontró en la música el lenguaje
más honesto para narrar lo que le preocupa: el tiempo,
el amor que se va, los lunes que pesan.`,
  bioLong: `rafatrujillo creció entre acordes e historias. Formado como cineasta,
encontró en la música un lenguaje más honesto para narrar lo que le preocupa:
el tiempo, el amor que se va, los lunes que pesan. Su debut
"Ya no es mi canción, y otras películas" es exactamente eso:
un conjunto de canciones que son también pequeñas películas personales.`,
  images: {
    profile640: 'https://i.scdn.co/image/ab6761610000e5eb2de274b6bf5dc6d2fb2d07bd',
    profile320: 'https://i.scdn.co/image/ab676161000051742de274b6bf5dc6d2fb2d07bd',
  },
  urls: {
    spotify:      'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
    appleMusic:   'https://music.apple.com/mx/artist/rafatrujillo/1758386046',
    instagram:    'https://instagram.com/rafaeltrujillo_official',
    spotifyEmbed: 'https://open.spotify.com/embed/artist/6RgSjDL2gCy477DQ9azqYi',
  },
  spotifyId: '6RgSjDL2gCy477DQ9azqYi',
} as const

export const ALBUM_DEBUT = {
  title:  'Ya no es mi canción, y otras películas',
  slug:   'ya-no-es-mi-cancion',
  year:   2025,
  type:   'album' as const,
  label:  'Cruzao Music',
  cover:  'https://i.scdn.co/image/ab67616d0000b273a2667cfb8ec18219085ed32c',
  tracks: [
    { n: 1, title: 'Bailas de la nada',                        exclusive: true,  cover: 'https://i.scdn.co/image/ab67616d0000b273a2667cfb8ec18219085ed32c' },
    { n: 2, title: 'Ya no es mi canción, Pt.2',                exclusive: true,  cover: 'https://i.scdn.co/image/ab67616d0000b273a2667cfb8ec18219085ed32c' },
    { n: 3, title: 'Ya no es mi canción, Pt.1',                exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b27378e3c7b8a1669833f2af79af' },
    { n: 4, title: 'Suenan las alarmas',                        exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b273f5d10e141674502278734d27' },
    { n: 5, title: 'Mi canción desesperada (Versión Acústica)', exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b2730a84d387e9b711a15304f6de' },
    { n: 6, title: 'Cuento',                                    exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b273d7c53d4385242cfef00c22b3' },
    { n: 7, title: 'Fallas en el corazón',                     exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b273480647da3300fc6132acf272' },
    { n: 8, title: 'sin tenerte a ti (Instrumental)',           exclusive: false, cover: 'https://i.scdn.co/image/ab67616d0000b27356ca6c97c7afa70d557c0b2a' },
  ],
} as const

export const EP_01 = {
  title:  'EP. 01',
  year:   2024,
  type:   'ep' as const,
  cover:  'https://i.scdn.co/image/ab67616d0000b273724daea1dab90bf481c1f955',
  tracks: [
    { title: 'si te vas', cover: 'https://i.scdn.co/image/ab67616d0000b2735f0d162d7793db300b3385ae' },
    { title: 'cenizas',   cover: 'https://i.scdn.co/image/ab67616d0000b27343f0728bb77ce2bae07ffa9a' },
    { title: 'no sigue',  cover: 'https://i.scdn.co/image/ab67616d0000b273e935627a270b0fdb21d064db' },
  ],
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
  { title: 'no sigue',                    year: 2023, cover: 'https://i.scdn.co/image/ab67616d0000b273e935627a270b0fdb21d064db' },
] as const

// Canciones interactivas para la sección principal
export const FEATURED_TRACKS = [
  {
    title:    'los lunes pienso',
    year:     2023,
    plays:    '14,679',
    cover:    'https://i.scdn.co/image/ab67616d0000b273a68759222fa4fa254a41473e',
    spotifyUrl: 'https://open.spotify.com/track/los-lunes-pienso',
  },
  {
    title:    'sin tenerte a ti',
    year:     2023,
    plays:    '5,841',
    cover:    'https://i.scdn.co/image/ab67616d0000b27356ca6c97c7afa70d557c0b2a',
    spotifyUrl: 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
  },
  {
    title:    'Suenan las alarmas',
    year:     2025,
    plays:    '2,508',
    cover:    'https://i.scdn.co/image/ab67616d0000b273f5d10e141674502278734d27',
    spotifyUrl: 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
  },
  {
    title:    'Cuento',
    year:     2024,
    plays:    '2,035',
    cover:    'https://i.scdn.co/image/ab67616d0000b273d7c53d4385242cfef00c22b3',
    spotifyUrl: 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
  },
  {
    title:    'Ya no es mi canción, Pt.1',
    year:     2025,
    plays:    null,
    cover:    'https://i.scdn.co/image/ab67616d0000b27378e3c7b8a1669833f2af79af',
    spotifyUrl: 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
  },
  {
    title:    'Fallas en el corazón',
    year:     2024,
    plays:    null,
    cover:    'https://i.scdn.co/image/ab67616d0000b273480647da3300fc6132acf272',
    spotifyUrl: 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
  },
  {
    title:    'cenizas',
    year:     2024,
    plays:    null,
    cover:    'https://i.scdn.co/image/ab67616d0000b27343f0728bb77ce2bae07ffa9a',
    spotifyUrl: 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
  },
  {
    title:    'no sigue',
    year:     2023,
    plays:    null,
    cover:    'https://i.scdn.co/image/ab67616d0000b273e935627a270b0fdb21d064db',
    spotifyUrl: 'https://open.spotify.com/artist/6RgSjDL2gCy477DQ9azqYi',
  },
] as const

// Videos de YouTube
export const YOUTUBE_VIDEOS = [
  {
    id:    'AIlwZJciG1o',
    title: 'ya no es mi canción pt I + pt II',
    type:  'official' as const,
    year:  2025,
  },
  {
    id:    '-UxhIUjIHNg',
    title: 'Suenan las alarmas',
    type:  'official' as const,
    year:  2025,
  },
  {
    id:    'XSiahemUDJs',
    title: 'Mi canción desesperada (Acústica)',
    type:  'official' as const,
    year:  2025,
  },
] as const

export const RELATED_ARTISTS = [
  'Samuel Ortiz',
  'Sónet',
  'Giorgio Rome',
  'Noche en Praga',
] as const
