import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import { KitCard } from '@/components/products/KitCard'
import type { Metadata } from 'next'
import type { KitWithProducts } from '@/types/database'

export const metadata: Metadata = {
  title: 'Tienda — Kits y productos',
  description: 'Compra kits personalizados o productos individuales. Orgánicos, gym, skin care y vitaminas.',
}

const CATEGORY_COLORS: Record<string, string> = {
  gym: 'var(--cat-durazno)',
  'skin-care': 'var(--cat-coral)',
  vitaminas: 'var(--cat-mostaza)',
  organicos: 'var(--cat-menta)',
}

interface ShopProduct {
  id: string
  name: string
  slug: string
  cover_image_url: string | null
  category_id: string | null
  categories: { slug: string } | null
  product_variants: Array<{
    id: string
    name: string
    product_prices: Array<{ amount_cents: number; compare_at_cents: number | null; currency: string; effective_to: string | null }>
  }>
}

async function getProducts(categoria?: string): Promise<ShopProduct[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      id, name, slug, cover_image_url, category_id,
      categories ( slug ),
      product_variants (
        id, name,
        product_prices ( amount_cents, compare_at_cents, currency, effective_to )
      )
    `)
    .eq('is_active', true)

  if (categoria) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', categoria).single()
    const catData = cat as { id: string } | null
    if (catData) query = query.eq('category_id', catData.id)
  }

  const { data } = await query.limit(24)
  return (data as ShopProduct[]) ?? []
}

async function getKits(): Promise<KitWithProducts[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kits')
    .select(`
      *,
      kit_products (
        kit_id, variant_id, quantity, sort_order, is_required,
        variant:product_variants (
          id, name, sku,
          product:products ( id, name, slug, cover_image_url ),
          prices:product_prices ( amount_cents, compare_at_cents, currency, effective_to )
        )
      )
    `)
    .eq('is_active', true)
  return (data as KitWithProducts[]) ?? []
}

interface Props { searchParams: Promise<{ modo?: string; categoria?: string }> }

export default async function ShopPage({ searchParams }: Props) {
  const { modo = 'kits', categoria } = await searchParams
  const [products, kits] = await Promise.all([getProducts(categoria), getKits()])

  return (
    <div style={{ background: 'var(--liora-crema)', padding: '40px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Tienda</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, paddingBottom: 18, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        Compra <span style={{ fontFamily: 'var(--font-script)' }}>por kit</span> o suelto.
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: 0.85, marginTop: 8, marginBottom: 28, maxWidth: 620 }}>
        Los kits ahorran hasta 20% y combinan productos pensados para trabajar juntos.
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'inline-flex', background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: 5, gap: 4, marginBottom: 40 }}>
        {[
          { id: 'kits', label: 'Kits' },
          { id: 'individual', label: `Productos sueltos (${products.length})` },
        ].map((m) => (
          <a key={m.id} href={`/tienda?modo=${m.id}`} style={{
            background: modo === m.id ? 'var(--liora-uva)' : 'transparent',
            color: modo === m.id ? 'var(--liora-crema)' : 'var(--liora-uva)',
            border: 'none', borderRadius: 999, padding: '10px 24px',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
            display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}>
            {m.label}
            {m.id === 'kits' && modo === 'kits' && (
              <span style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>−20%</span>
            )}
          </a>
        ))}
      </div>

      {modo === 'kits' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {kits.map((kit) => <KitCard key={kit.id} kit={kit} />)}
        </div>
      ) : (
        <>
          {modo === 'individual' && (
            <div style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 18, padding: '14px 20px', marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-body)', fontSize: 14 }}>
              <strong>Tip:</strong> casi todos estos productos están en un kit con descuento — busca el badge "Mejor en kit".
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {products.map((p) => {
              const variant = p.product_variants?.[0]
              const price = variant?.product_prices?.find((pp) => !pp.effective_to)
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
        </>
      )}
    </div>
  )
}
