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

// Posiciones del abanico para hasta 3 imágenes
const FAN: Array<{ bottom: number; left: number; rotate: number; size: number; z: number }> = [
  { bottom: 8,  left: 0,   rotate: -9, size: 90, z: 1 },
  { bottom: 32, left: 58,  rotate:  2, size: 98, z: 2 },
  { bottom: 4,  left: 114, rotate:  9, size: 90, z: 3 },
]

interface KitCardProps {
  kit: KitWithProducts
}

export function KitCard({ kit }: KitCardProps) {
  const [hovered, setHovered] = useState(false)
  const bg = getKitColor(kit.slug)

  const totalCents = kit.kit_products.reduce((s, kp) => {
    const price = kp.variant?.prices?.[0]
    return s + (price?.amount_cents ?? 0) * kp.quantity
  }, 0)

  const images = kit.kit_products
    .map(kp => kp.variant?.product?.cover_image_url)
    .filter((url): url is string => Boolean(url))
    .slice(0, 3)

  return (
    <Link href={`/tienda/kit/${kit.slug}`} style={{ textDecoration: 'none' }}>
      <article
        className="liora-kit-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: bg,
          borderRadius: 32,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 220,
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div className="liora-kit-card-inner" style={{ padding: '32px 32px 32px 36px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        {/* ── Left: texto ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>
            {kit.kit_products.length} productos · Bundle
          </div>

          <div>
            <h3 className="liora-kit-card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--liora-uva)', margin: 0, lineHeight: 1.05, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              {kit.name}
            </h3>
            {kit.description && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.45, color: 'var(--liora-uva)', opacity: 0.8, margin: '8px 0 0' }}>
                {kit.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1.5px solid rgba(61,26,58,0.13)', marginTop: 'auto' }}>
            <div className="liora-kit-card-price" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)' }}>
              S/{(totalCents / 100).toFixed(0)}
            </div>
            <span style={{
              background: 'var(--liora-uva)', color: 'var(--liora-crema)',
              borderRadius: 999, padding: '10px 20px',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
              transition: 'opacity 150ms',
              opacity: hovered ? 1 : 0.9,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              Personalizar →
            </span>
          </div>
        </div>

        {/* ── Right: abanico de imágenes ── */}
        <div className="liora-kit-card-images" style={{ position: 'relative', width: 210, height: 160, flexShrink: 0 }}>
          {images.map((url, i) => {
            const slot = FAN[i]
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: slot.bottom,
                  left: slot.left,
                  width: slot.size,
                  height: slot.size,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.55)',
                  boxShadow: '0 6px 24px rgba(61,26,58,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  transform: `rotate(${slot.rotate}deg)`,
                  zIndex: slot.z,
                  transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
                  ...(hovered ? { transform: `rotate(${slot.rotate}deg) translateY(-4px) scale(1.04)` } : {}),
                }}
              >
                <img
                  src={url}
                  alt=""
                  aria-hidden="true"
                  style={{ width: '84%', height: '84%', objectFit: 'contain' }}
                />
              </div>
            )
          })}

          {/* Si hay menos de 3 imágenes: círculo vacío decorativo de fondo */}
          {images.length < 3 && Array.from({ length: 3 - images.length }).map((_, i) => {
            const slot = FAN[images.length + i]
            return (
              <div
                key={`empty-${i}`}
                style={{
                  position: 'absolute',
                  bottom: slot.bottom,
                  left: slot.left,
                  width: slot.size,
                  height: slot.size,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)',
                  zIndex: slot.z,
                  transform: `rotate(${slot.rotate}deg)`,
                }}
              />
            )
          })}
        </div>
        </div>{/* end liora-kit-card-inner */}
      </article>
    </Link>
  )
}
