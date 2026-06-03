'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Barbell, Leaf, Drop, Pill } from '@phosphor-icons/react'

const CARDS = [
  { slug: 'organicos',  label: 'Orgánicos',       bg: '#2F8C5A', accent: 'var(--cat-menta)',   Icon: Leaf },
  { slug: 'gym',        label: 'Gym &\nproteínas', bg: '#C25240', accent: 'var(--cat-coral)',   Icon: Barbell },
  { slug: 'skin-care',  label: 'Skin care',        bg: '#6A4DA3', accent: 'var(--cat-lavanda)', Icon: Drop },
  { slug: 'vitaminas',  label: 'Vitaminas',        bg: '#B8870A', accent: 'var(--cat-mostaza)', Icon: Pill },
]

interface CardProps { slug: string; label: string; bg: string; accent: string; Icon: typeof Leaf; count?: number }

function CategoryCard({ slug, label, bg, accent, Icon, count }: CardProps) {
  const [hovered, setHovered] = useState(false)
  const sub = count !== undefined ? `${count} producto${count !== 1 ? 's' : ''}` : ''

  return (
    <Link href={`/tienda?categoria=${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative', borderRadius: 32, padding: 28, height: 360,
          background: bg, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', cursor: 'pointer',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{ position: 'absolute', top: 28, right: 28, width: 120, height: 120, borderRadius: 999, background: accent, opacity: 0.55 }} />
        <div style={{ position: 'absolute', top: 60, right: 60, width: 56, height: 56, background: 'var(--liora-crema)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
          <Icon size={28} weight="bold" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 0.98, letterSpacing: '-0.02em', color: 'var(--liora-crema)', margin: 0, whiteSpace: 'pre-line', fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>
          {label}
        </h3>
        {sub && (
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-crema)', opacity: 0.8, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {sub}
          </div>
        )}
      </div>
    </Link>
  )
}

interface Props { counts?: Record<string, number> }

export function CategoryGrid({ counts = {} }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {CARDS.map((card) => (
        <CategoryCard key={card.slug} {...card} count={counts[card.slug]} />
      ))}
    </div>
  )
}
