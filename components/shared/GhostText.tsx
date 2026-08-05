interface Props {
  text: string
  className?: string
  style?: React.CSSProperties
}

export function GhostText({ text, className = '', style }: Props) {
  return (
    <span
      className={`ghost absolute select-none pointer-events-none ${className}`}
      aria-hidden="true"
      style={style}
    >
      {text}
    </span>
  )
}
