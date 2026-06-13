'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, Plus } from '@phosphor-icons/react'
import { useCartStore } from '@/lib/store/cart'
import { trackAddToCart } from '@/lib/analytics/events'

interface ProductCardProps {
  variantId: string
  productId: string
  slug: string
  name: string
  subname?: string
  priceCents: number
  compareAtCents?: number
  currency?: string
  badge?: string
  badgeKind?: 'lima' | 'uva'
  categoryColor: string
  categoryName?: string
  imageUrl?: string
}

export function ProductCard({
  variantId, productId, slug, name, subname,
  priceCents, compareAtCents, currency = 'PEN',
  badge, badgeKind = 'lima', categoryColor, categoryName, imageUrl,
}: ProductCardProps) {
  const { addItem } = useCartStore()
  const [addHover, setAddHover] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({ variantId, productId, name, variantName: subname ?? '', priceCents, currency, imageUrl, categoryColor })
    trackAddToCart({ variantId, name, priceCents, quantity: 1, currency })
  }

  const metaLine = [categoryName, subname].filter(Boolean).join(' · ')

  return (
    <Link href={`/tienda/${slug}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
      <article
        style={{
          background: 'var(--liora-blanco)',
          borderRadius: 28,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          position: 'relative',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-1)',
          transition: 'transform 220ms var(--ease), box-shadow 220ms var(--ease)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = 'var(--shadow-2)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'var(--shadow-1)'
        }}
      >
        {badge && (
          <span style={{
            position: 'absolute', top: 20, left: 20, zIndex: 2,
            background: badgeKind === 'lima' ? 'var(--liora-lima)' : 'var(--liora-uva)',
            color: badgeKind === 'lima' ? 'var(--liora-uva)' : 'var(--liora-crema)',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
            padding: '5px 12px', borderRadius: 999,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>{badge}</span>
        )}

        <button
          onClick={(e) => e.preventDefault()}
          aria-label="Guardar en favoritos"
          style={{
            position: 'absolute', top: 20, right: 20, zIndex: 2,
            width: 36, height: 36, borderRadius: 999, border: 'none',
            background: 'var(--liora-blanco)', color: 'var(--liora-uva)',
            boxShadow: 'var(--shadow-1)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Heart size={18} weight="regular" />
        </button>

        {/* Product image area — tinted with category color */}
        <div style={{
          aspectRatio: '1/1', borderRadius: 20,
          background: `color-mix(in srgb, ${categoryColor} 30%, white)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Soft floor shadow under the product */}
          <div style={{
            position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)',
            width: '55%', height: 14,
            background: 'radial-gradient(ellipse at center, rgba(61,26,58,0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          {imageUrl ? (
            <img src={imageUrl} alt={name} style={{ width: '78%', height: '78%', objectFit: 'contain', position: 'relative' }} />
          ) : (
            <div style={{
              background: 'var(--liora-blanco)', padding: '12px 14px', borderRadius: 12,
              fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--liora-uva)',
              textAlign: 'center', lineHeight: 1.1, fontSize: 18,
            }}>
              {name}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '16px 12px 12px', flex: 1 }}>
          {metaLine && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: categoryColor, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--liora-uva)', opacity: 0.55 }}>
                {metaLine}
              </span>
            </div>
          )}
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.2, color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 80,'SOFT' 60,'WONK' 0", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, color: 'var(--liora-uva)' }}>
                S/{(priceCents / 100).toFixed(0)}
              </span>
              {compareAtCents && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.5, textDecoration: 'line-through' }}>
                  S/{(compareAtCents / 100).toFixed(0)}
                </span>
              )}
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              onMouseEnter={() => setAddHover(true)}
              onMouseLeave={() => setAddHover(false)}
              aria-label="Agregar al carrito"
              style={{
                width: 40, height: 40, borderRadius: 999, flexShrink: 0,
                border: addHover ? '1.5px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)',
                background: addHover ? 'var(--liora-uva)' : 'var(--liora-crema)',
                color: addHover ? 'var(--liora-crema)' : 'var(--liora-uva)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 180ms var(--ease), color 180ms var(--ease), border-color 180ms var(--ease)',
              }}
            >
              <Plus size={18} weight="bold" />
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
