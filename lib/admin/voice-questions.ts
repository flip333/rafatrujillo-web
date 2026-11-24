/* Onboarding de voz para el asistente SEO·GEO.
   Preguntas cortas, en el lenguaje de Rafa, con ejemplos sacados de sus propias
   historias para que reconozca su forma de contar. Los ids los usa el Worker
   (services/admin-worker/src/voice.ts) para armar el perfil de voz. */

export type QuestionKind = 'text' | 'long' | 'tags' | 'choice' | 'multi' | 'scale'

export interface VoiceQuestion {
  id: string
  kind: QuestionKind
  title: string
  why: string            // para qué sirve (transparencia)
  hint?: string          // ejemplo/guía tomada de su material
  placeholder?: string
  options?: { value: string; label: string }[]
  scale?: { min: string; max: string }
}

export const VOICE_INTRO = {
  title: 'Antes de sugerirte contenidos, quiero conocer tu voz',
  text: 'Son 13 preguntas cortas. No hay respuestas correctas: escribe como hablas, sin pulir. Con esto aprendo tus palabras, tu tono y lo que te gusta contar, para que lo que te proponga suene a ti y no a una marca. Puedes saltar cualquiera y volver después.',
}

export const VOICE_QUESTIONS: VoiceQuestion[] = [
  {
    id: 'una_frase', kind: 'text',
    title: 'Si alguien en una fiesta te pregunta “¿y tú qué música haces?”, ¿qué le dices?',
    why: 'Es tu forma natural de presentarte. La uso para abrir textos y descripciones.',
    hint: 'Sin pensarlo mucho, como saldría en una conversación real.',
    placeholder: 'Hago canciones que…',
  },
  {
    id: 'primer_mensaje', kind: 'long',
    title: 'Escríbele un mensaje corto a alguien que acaba de escuchar “Sin tenerte a ti” por primera vez.',
    why: 'Así veo cómo le hablas a quien te escucha: tu saludo, tu ritmo, tu calidez.',
    hint: 'Tú mismo escribiste que es tu canción favorita y que “se escribió sola”. ¿Qué le contarías?',
    placeholder: 'Oye, …',
  },
  {
    id: 'expresiones', kind: 'tags',
    title: '¿Qué palabras o expresiones se te salen siempre?',
    why: 'Son las que voy a usar (sin abusar) para que los textos suenen a ti.',
    hint: 'En tus historias aparecen “parche”, “re difícil”, “full rockera”, “dizque”, “cogiendo forma”. ¿Cuáles son tuyas de verdad? Sepáralas con comas.',
    placeholder: 'parche, re, …',
  },
  {
    id: 'evitar', kind: 'tags',
    title: '¿Qué palabras o tonos nunca usarías?',
    why: 'Lo que no te representa es tan importante como lo que sí.',
    hint: 'Por ejemplo: “contenido”, “brutal”, “no te lo pierdas”, “link en la bio”, demasiados emojis, hablar como marca…',
    placeholder: 'no te lo pierdas, …',
  },
  {
    id: 'que_contar', kind: 'multi',
    title: '¿Qué te gusta contar de tus canciones?',
    why: 'Define los ejes de tus newsletters y del blog.',
    options: [
      { value: 'El proceso de grabación y producción', label: 'El proceso de grabación y producción' },
      { value: 'La historia personal detrás', label: 'La historia personal detrás' },
      { value: 'El humor y lo cotidiano', label: 'El humor y lo cotidiano' },
      { value: 'Los lugares: Manizales, Bogotá, Barcelona', label: 'Los lugares: Manizales, Bogotá, Barcelona' },
      { value: 'El cine y mis referencias', label: 'El cine y mis referencias' },
      { value: 'Las personas con las que trabajo', label: 'Las personas con las que trabajo' },
    ],
  },
  {
    id: 'cercania', kind: 'scale',
    title: '¿Qué tan personal quieres ser con quien te lee?',
    why: 'Ajusta cuánto de tu vida entra en cada texto.',
    scale: { min: 'Solo la música', max: 'Como una carta a un amigo' },
  },
  {
    id: 'trato', kind: 'choice',
    title: '¿Cómo le hablas a tu audiencia?',
    why: 'Para que todos los textos sean consistentes.',
    options: [
      { value: 'tú', label: 'Tú' },
      { value: 'ustedes', label: 'Ustedes (al grupo)' },
      { value: 'usted', label: 'Usted' },
      { value: 'mezcla', label: 'Depende del momento' },
    ],
  },
  {
    id: 'idioma', kind: 'choice',
    title: '¿En qué idioma te sientes más tú escribiendo?',
    why: 'Define si los textos llevan palabras en inglés o van en versión bilingüe.',
    options: [
      { value: 'Español', label: 'Español' },
      { value: 'Español con palabras en inglés', label: 'Español con palabras en inglés' },
      { value: 'Bilingüe (español e inglés)', label: 'Bilingüe' },
    ],
  },
  {
    id: 'anecdota', kind: 'long',
    title: 'Cuéntame una anécdota como la contarías en una fiesta.',
    why: 'Es la mejor muestra de tu voz: ritmo, humor y detalles. La uso como modelo de apertura.',
    hint: 'Algo como grabar “Los lunes pienso” en el baño “dizque para el eco”, o la casa de Barcelona con siete músicos. Lo que quieras.',
    placeholder: 'Una vez…',
  },
  {
    id: 'referentes', kind: 'text',
    title: 'Tres personas (músicos, directores, escritores) cuya forma de contar te gusta. ¿Qué tienen?',
    why: 'Me da pistas de estilo sin copiar a nadie.',
    placeholder: 'Por ejemplo: X, porque cuenta todo con humor…',
  },
  {
    id: 'sentir', kind: 'text',
    title: '¿Qué quieres que sienta alguien al terminar de leer tu newsletter?',
    why: 'Es el norte de cada cierre.',
    placeholder: 'Que sienta que…',
  },
  {
    id: 'fuera_musica', kind: 'text',
    title: '¿De qué te gusta hablar que no sea música?',
    why: 'Los mejores correos a veces se salen del tema: cine, comida, lugares, libros…',
    placeholder: 'Cine, …',
  },
  {
    id: 'frecuencia', kind: 'choice',
    title: '¿Cada cuánto te ves escribiéndole a tu lista sin que se vuelva una carga?',
    why: 'Con esto armo el calendario de los ciclos de contenido.',
    options: [
      { value: 'semanal', label: 'Cada semana' },
      { value: 'quincenal', label: 'Cada 15 días' },
      { value: 'mensual', label: 'Una vez al mes' },
      { value: 'lanzamientos', label: 'Solo cuando hay lanzamiento' },
    ],
  },
]
