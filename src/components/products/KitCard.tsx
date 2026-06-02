'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { KitWithProducts } from '@/types/database'

const KIT_COLORS: Record<string, string> = {
  energia: 'var(--cat-mostaza)',
  piel: 'var(--cat-coral)',
  'post-entreno': 'var(--cat-durazno)',
  gym: 'var(--cat-durazno)',
  reset: 'var(--cat-menta)',
  detox: 'var(--cat-menta)',
  colageno: 'var(--cat-coral)',
  capilar: 'var(--cat-coral)',
  articulaciones: 'var(--cat-mostaza)',
  vitaminas: 'var(--cat-lavanda)',
  sueno: 'var(--cat-lavanda)',
  andino: 'var(--cat-menta)',
  bienestar: 'var(--cat-menta)',
  default: 'var(--cat-lavanda)',
}

function getKitColor(slug: string) {
  for (const [key, color] of Object.entries(KIT_COLORS)) {
    if (slug.includes(key)) return color
  }
  return KIT_COLORS.default
}

interface KitCardProps {
  kit: KitWithProducts
}

export function KitCard({ kit }: KitCardProps) {
  const [hovered, setHovered] = useState(false)
  const bg = getKitColor(kit.slug)
  const productNames = kit.kit_products.map((kp) => kp.variant?.product?.name).filter(Boolean)
  const totalCents = kit.kit_products.reduce((s, kp) => {
    const price = kp.variant?.prices?.[0]
    return s + (price?.amount_cents ?? 0) * kp.quantity
  }, 0)

  return (
    <Link href={`/tienda/kit/${kit.slug}`} style={{ textDecoration: 'none' }}>
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: bg, borderRadius: 32, padding: 32, display: 'flex', flexDirection: 'column', gap: 18, cursor: 'pointer', position: 'relative',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {kit.kit_products.length} productos · Bundle
        </div>

        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, color: 'var(--liora-uva)', margin: 0, lineHeight: 1.02, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {kit.name}
          </h3>
          {kit.description && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.45, color: 'var(--liora-uva)', opacity: 0.85, marginTop: 8, marginBottom: 0 }}>
              {kit.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {productNames.slice(0, 4).map((name) => (
            <span key={name} style={{ background: 'rgba(251,241,226,0.85)', borderRadius: 12, padding: '7px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)' }}>
              {name}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1.5px solid rgba(61,26,58,0.15)', marginTop: 4 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--liora-uva)' }}>
            S/{(totalCents / 100).toFixed(0)}
          </div>
          <span style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>
            Ver kit →
          </span>
        </div>
      </article>
    </Link>
  )
}
