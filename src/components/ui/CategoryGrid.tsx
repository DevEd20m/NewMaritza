'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Barbell, Leaf, Drop, Pill } from '@phosphor-icons/react'

const CARDS = [
  { slug: 'organicos',  label: 'Orgánicos',        sub: '48 productos', bg: '#2F8C5A', accent: 'var(--cat-menta)',   Icon: Leaf },
  { slug: 'gym',        label: 'Gym &\nproteínas',  sub: '36 productos', bg: '#C25240', accent: 'var(--cat-coral)',   Icon: Barbell },
  { slug: 'skin-care',  label: 'Skin care',         sub: '52 productos', bg: '#6A4DA3', accent: 'var(--cat-lavanda)', Icon: Drop },
  { slug: 'vitaminas',  label: 'Vitaminas',         sub: '41 productos', bg: '#B8870A', accent: 'var(--cat-mostaza)', Icon: Pill },
]

function CategoryCard({ slug, label, sub, bg, accent, Icon }: typeof CARDS[0]) {
  const [hovered, setHovered] = useState(false)
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
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-crema)', opacity: 0.8, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {sub}
        </div>
      </div>
    </Link>
  )
}

export function CategoryGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {CARDS.map((card) => <CategoryCard key={card.slug} {...card} />)}
    </div>
  )
}
