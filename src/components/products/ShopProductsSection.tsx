'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/products/ProductCard'

const CATEGORY_COLORS: Record<string, string> = {
  gym: 'var(--cat-durazno)',
  'skin-care': 'var(--cat-coral)',
  vitaminas: 'var(--cat-mostaza)',
  organicos: 'var(--cat-menta)',
}

const FILTERS = [
  { slug: '',          label: 'Todos' },
  { slug: 'organicos', label: 'Orgánicos' },
  { slug: 'gym',       label: 'Gym & proteínas' },
  { slug: 'skin-care', label: 'Skin care' },
  { slug: 'vitaminas', label: 'Vitaminas' },
] as const

export interface ShopProduct {
  id: string
  name: string
  slug: string
  cover_image_url: string | null
  category_id: string | null
  categories: { slug: string } | null
  product_variants: Array<{
    id: string
    name: string
    product_prices: Array<{
      amount_cents: number
      compare_at_cents: number | null
      currency: string
      effective_to: string | null
    }>
  }>
}

interface Props {
  products: ShopProduct[]
  initialCategoria?: string
}

export function ShopProductsSection({ products, initialCategoria = '' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categoria, setCategoria] = useState(initialCategoria)

  // Sincronizar si el usuario navega back/forward
  useEffect(() => {
    const cat = searchParams.get('categoria') ?? ''
    setCategoria(cat)
  }, [searchParams])

  const handleFilter = (slug: string) => {
    setCategoria(slug)
    const params = new URLSearchParams()
    if (slug) params.set('categoria', slug)
    // replace sin scroll y sin añadir entrada al historial
    router.replace(slug ? `/tienda?${params.toString()}#productos-sueltos` : '/tienda#productos-sueltos', { scroll: false })
  }

  const filtered = categoria
    ? products.filter(p => p.categories?.slug === categoria)
    : products

  const activeLabel = FILTERS.find(f => f.slug === categoria)?.label ?? 'Todos'

  return (
    <section id="productos-sueltos" style={{ borderTop: '1.5px solid var(--liora-arena)', paddingTop: 72 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 10,
          }}>
            Para recompras y quien ya sabe lo que quiere
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44,
            color: 'var(--liora-uva)', margin: 0, lineHeight: 1.0,
            fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
          }}>
            Productos sueltos
            {categoria && (
              <span style={{ fontSize: 28, opacity: 0.45 }}> · {activeLabel}</span>
            )}
          </h2>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36, alignItems: 'center' }}>
        {FILTERS.map(({ slug, label }) => {
          const active = categoria === slug
          return (
            <a
              key={slug}
              href={slug ? `/tienda?categoria=${slug}` : '/tienda'}
              onClick={(e) => { e.preventDefault(); handleFilter(slug) }}
              style={{
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
                background: active ? 'var(--liora-uva)' : 'var(--liora-blanco)',
                color: active ? 'var(--liora-crema)' : 'var(--liora-uva)',
                border: `1.5px solid ${active ? 'var(--liora-uva)' : 'var(--liora-arena)'}`,
                transition: 'background 180ms, color 180ms, border-color 180ms',
                whiteSpace: 'nowrap', textDecoration: 'none',
              }}
            >
              {label}
            </a>
          )
        })}
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--liora-uva)', opacity: 0.4,
          marginLeft: 4,
        }}>
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {filtered.map((p) => {
          const variant = p.product_variants?.[0]
          const price = variant?.product_prices?.find(pp => !pp.effective_to)
          if (!variant || !price) return null
          const catSlug = p.categories?.slug ?? ''
          return (
            <ProductCard
              key={p.id}
              variantId={variant.id}
              productId={p.id}
              slug={p.slug}
              name={p.name}
              subname={variant.name}
              priceCents={price.amount_cents}
              compareAtCents={price.compare_at_cents ?? undefined}
              categoryColor={CATEGORY_COLORS[catSlug] ?? 'var(--cat-lavanda)'}
              imageUrl={p.cover_image_url ?? undefined}
            />
          )
        })}
      </div>
    </section>
  )
}
