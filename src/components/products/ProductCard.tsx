'use client'
import Link from 'next/link'
import { Heart } from '@phosphor-icons/react'
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
  imageUrl?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  gym: 'var(--cat-durazno)',
  'skin-care': 'var(--cat-coral)',
  vitaminas: 'var(--cat-mostaza)',
  organicos: 'var(--cat-menta)',
  default: 'var(--cat-lavanda)',
}

export function ProductCard({
  variantId, productId, slug, name, subname,
  priceCents, compareAtCents, currency = 'PEN',
  badge, badgeKind = 'uva', categoryColor, imageUrl,
}: ProductCardProps) {
  const { addItem } = useCartStore()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({ variantId, productId, name, variantName: subname ?? '', priceCents, currency, imageUrl, categoryColor })
    trackAddToCart({ variantId, name, priceCents, quantity: 1, currency })
  }

  return (
    <Link href={`/tienda/${slug}`} style={{ textDecoration: 'none' }}>
      <article
        style={{
          background: categoryColor,
          borderRadius: 28,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
      >
        {badge && (
          <span style={{
            position: 'absolute', top: 16, left: 16, zIndex: 2,
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
            position: 'absolute', top: 16, right: 16, zIndex: 2,
            width: 36, height: 36, borderRadius: 999, border: 'none',
            background: 'rgba(255,255,255,0.6)', color: 'var(--liora-uva)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Heart size={18} weight="regular" />
        </button>

        {/* Product image area */}
        <div style={{
          aspectRatio: '1/1', borderRadius: 999, background: 'rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
        }}>
          {imageUrl ? (
            <img src={imageUrl} alt={name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          ) : (
            <div style={{
              background: 'var(--liora-crema)', padding: '12px 14px', borderRadius: 12,
              fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--liora-uva)',
              textAlign: 'center', lineHeight: 1.1, fontSize: 18,
            }}>
              {name}
              {subname && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, opacity: 0.7, marginTop: 4 }}>{subname}</div>}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.1, color: 'var(--liora-uva)', margin: 0 }}>{name}</h3>
          {subname && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.7 }}>{subname}</div>}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700, color: 'var(--liora-uva)' }}>
              S/{(priceCents / 100).toFixed(0)}
            </span>
            {compareAtCents && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.5, textDecoration: 'line-through' }}>
                S/{(compareAtCents / 100).toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          style={{
            background: 'var(--liora-uva)', color: 'var(--liora-crema)',
            border: 'none', borderRadius: 999, padding: '12px 20px',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', width: '100%',
          }}
        >
          Agregar al carrito
        </button>
      </article>
    </Link>
  )
}
