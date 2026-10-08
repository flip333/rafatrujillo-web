/* Renderiza las marcas de los textos del diccionario:
   **texto** → color de acento (con subrayado que se dibuja al aparecer)
   *texto*   → cursiva
   `vars` reemplaza {clave} por su valor antes de formatear.
   `words` envuelve cada palabra para animarla en cascada (.reveal-words). */
interface Props {
  text: string
  vars?: Record<string, string>
  /** Estilo para *cursiva* (p. ej. redonda dentro de un párrafo ya en cursiva) */
  emStyle?: React.CSSProperties
  words?: boolean
}

export function Rich({ text, vars, emStyle = { color: 'var(--rafa-text)' }, words = false }: Props) {
  let s = text
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v)

  let w = 0
  const split = (str: string) =>
    !words
      ? str
      : str.split(/(\s+)/).map((tok, i) =>
          /^\s+$/.test(tok) || !tok
            ? tok
            : <span key={i} className="w" style={{ '--i': w++ } as React.CSSProperties}>{tok}</span>,
        )

  const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <span key={i} className="hl" style={{ color: 'var(--rafa-accent)' }}>{split(p.slice(2, -2))}</span>
        ) : p.startsWith('*') ? (
          <em key={i} style={emStyle}>{split(p.slice(1, -1))}</em>
        ) : (
          <span key={i}>{split(p)}</span>
        ),
      )}
    </>
  )
}
