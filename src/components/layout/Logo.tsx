import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  size?: number
  inverted?: boolean
}

export function Logo({ size = 36, inverted = false }: LogoProps) {
  const imgWidth = Math.round(size * 3.2)
  return (
    <Link href="/" className="relative inline-block" aria-label="LIORA — inicio">
      <Image
        src="/logo.png"
        alt="LIORA"
        width={imgWidth}
        height={size}
        style={{
          height: size,
          width: 'auto',
          filter: inverted ? 'brightness(0) invert(1)' : 'none',
          display: 'block',
        }}
        priority
      />
    </Link>
  )
}
