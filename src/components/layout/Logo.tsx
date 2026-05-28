import Link from 'next/link'

interface LogoProps {
  size?: number
  inverted?: boolean
}

export function Logo({ size = 36, inverted = false }: LogoProps) {
  const color = inverted ? '#FBF1E2' : '#3D1A3A'
  return (
    <Link href="/" className="relative inline-block" aria-label="LIORA — inicio">
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: size,
          color,
          letterSpacing: '-0.03em',
          fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
          lineHeight: 1,
        }}
      >
        LIORA
      </span>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: -size * 0.18,
          right: -size * 0.42,
          color: '#C9F048',
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: size * 0.6,
          lineHeight: 1,
        }}
      >
        *
      </span>
    </Link>
  )
}
