import { ARTIST, LATEST_RELEASE, MOSQUITO_BEACH, ALBUM_DEBUT, EP_01, EQUO, YOUTUBE_VIDEOS, PRESS } from './artist-data'

const SITE = 'https://rafatrujillo.xyz'
const ID = {
  site:    `${SITE}/#website`,
  person:  `${SITE}/#rafa`,
  artist:  `${SITE}/#rafatrujillo`,
  equo:    `${SITE}/#equo`,
  latest:  `${SITE}/#borracho-y-loco`,
  mb:      `${SITE}/#mosquito-beach`,
  album:   `${SITE}/#ya-no-es-mi-cancion`,
  ep:      `${SITE}/#ep-01`,
}

/* Grafo de entidades (schema.org) para buscadores y modelos de IA.
   Cada entidad tiene un @id estable y se enlaza con las demás, de modo que
   "rafatrujillo", "Rafa Trujillo", Equo, sus discos y videos quedan conectados
   y no se confunden con otras personas del mismo nombre. */
export function buildJsonLd() {
  const sameAs = [ARTIST.urls.spotify, ARTIST.urls.appleMusic, ARTIST.urls.youtube, ARTIST.urls.instagram]
  const artistRef = { '@id': ID.artist }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': ID.site,
        url: SITE,
        name: 'rafatrujillo',
        inLanguage: ['es', 'en'],
        about: artistRef,
        publisher: { '@id': ID.person },
      },
      {
        '@type': 'Person',
        '@id': ID.person,
        name: ARTIST.fullName,
        alternateName: [ARTIST.name, 'rafa trujillo'],
        description: PRESS.shortBio,
        jobTitle: ['Cantautor', 'Compositor', 'Productor musical', 'Multiinstrumentista'],
        homeLocation: { '@type': 'Place', name: `${ARTIST.city}, ${ARTIST.country}` },
        nationality: { '@type': 'Country', name: 'Colombia' },
        email: `mailto:${ARTIST.bookingEmail}`,
        url: SITE,
        image: `${SITE}${ARTIST.images.portrait}`,
        sameAs,
        memberOf: [artistRef, { '@id': ID.equo }],
        knowsAbout: ['composición musical', 'producción musical', 'música para cine', 'música para publicidad', 'guitarra', 'indie pop-rock', 'cine'],
        makesOffer: [
          'Música original para cine y series',
          'Música para publicidad y marcas',
          'Producción musical, arreglos y composición',
          'Sesiones de estudio y colaboraciones',
        ].map(name => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, provider: { '@id': ID.person } } })),
      },
      {
        '@type': 'MusicGroup',
        '@id': ID.artist,
        name: ARTIST.name,
        alternateName: 'Rafa Trujillo',
        description: 'Proyecto musical solista de Rafa Trujillo: indie pop-rock colombiano con mirada cinematográfica y narrativa.',
        url: SITE,
        genre: [ARTIST.genre, 'Indie', 'Pop rock'],
        foundingLocation: { '@type': 'Place', name: `${ARTIST.city}, ${ARTIST.country}` },
        member: { '@id': ID.person },
        image: `${SITE}/og.jpg`,
        logo: `${SITE}/icon.png`,
        sameAs,
        album: [{ '@id': ID.mb }, { '@id': ID.album }, { '@id': ID.ep }],
        track: { '@id': ID.latest },
      },
      {
        '@type': 'MusicGroup',
        '@id': ID.equo,
        name: EQUO.name,
        description: 'Proyecto de Sergio Hoyos y rafatrujillo nacido en Manizales, Colombia.',
        member: [{ '@type': 'Person', name: 'Sergio Hoyos' }, { '@id': ID.person }],
        foundingLocation: { '@type': 'Place', name: 'Manizales, Colombia' },
      },
      {
        '@type': 'MusicRecording',
        '@id': ID.latest,
        name: LATEST_RELEASE.title,
        byArtist: [artistRef, { '@id': ID.equo }],
        datePublished: LATEST_RELEASE.releaseDate,
        inAlbum: { '@id': ID.mb },
        url: LATEST_RELEASE.spotifyUrl,
        sameAs: [LATEST_RELEASE.spotifyUrl, LATEST_RELEASE.appleMusicUrl, `https://www.youtube.com/watch?v=${LATEST_RELEASE.youtubeId}`],
        image: `${SITE}${LATEST_RELEASE.cover}`,
      },
      {
        '@type': 'MusicAlbum',
        '@id': ID.mb,
        name: MOSQUITO_BEACH.title,
        byArtist: artistRef,
        albumProductionType: 'StudioAlbum',
        description: 'Segundo álbum de rafatrujillo (2026): adultez, memoria, amistades, Bogotá, home studios y el regreso al niño interior.',
        track: { '@id': ID.latest },
      },
      {
        '@type': 'MusicAlbum',
        '@id': ID.album,
        name: ALBUM_DEBUT.title,
        byArtist: artistRef,
        datePublished: String(ALBUM_DEBUT.year),
        albumProductionType: 'StudioAlbum',
        numTracks: ALBUM_DEBUT.tracks.length,
        image: `${SITE}${ALBUM_DEBUT.cover}`,
        track: {
          '@type': 'ItemList',
          numberOfItems: ALBUM_DEBUT.tracks.length,
          itemListElement: ALBUM_DEBUT.tracks.map(t => ({
            '@type': 'ListItem', position: t.n, item: { '@type': 'MusicRecording', name: t.title, byArtist: artistRef },
          })),
        },
      },
      {
        '@type': 'MusicAlbum',
        '@id': ID.ep,
        name: EP_01.title,
        byArtist: artistRef,
        datePublished: String(EP_01.year),
        albumReleaseType: 'EPRelease',
        numTracks: EP_01.tracks.length,
        track: {
          '@type': 'ItemList',
          numberOfItems: EP_01.tracks.length,
          itemListElement: EP_01.tracks.map((t, i) => ({
            '@type': 'ListItem', position: i + 1, item: { '@type': 'MusicRecording', name: t.title, byArtist: artistRef },
          })),
        },
      },
      ...YOUTUBE_VIDEOS.map(v => ({
        '@type': 'VideoObject',
        name: `${v.title} — rafatrujillo`,
        description: `${v.type === 'live' ? 'Live session' : 'Video oficial'} de rafatrujillo (${v.year}).`,
        thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
        contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
        uploadDate: `${v.year}-01-01`,
        creator: artistRef,
      })),
    ],
  }
}
