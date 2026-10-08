interface Props {
  text: string
  reverse?: boolean
}

/* Cinta animada decorativa.
   - aria-hidden: los lectores de pantalla no leen la lista repetida.
   - data-nosnippet: Google no usa este texto repetido en los resultados.
   - Animación 100% CSS (sin JS) y se detiene con prefers-reduced-motion.
   - Solo 2 copias del texto: suficiente para el bucle continuo (-50%). */
export function SectionDivider({ text, reverse = false }: Props) {
  const content = `${text}  ·  `

  return (
    <div
      aria-hidden="true"
      data-nosnippet
      role="presentation"
      className="marquee overflow-hidden py-2.5"
      style={{
        borderTop: '1px solid var(--rafa-border)',
        borderBottom: '1px solid var(--rafa-border)',
        backgroundColor: 'rgba(17,17,17,0.5)',
      }}
    >
      <div className={`marquee-track ${reverse ? 'marquee-reverse' : ''}`}>
        <span>{content}</span>
        <span>{content}</span>
      </div>
    </div>
  )
}
