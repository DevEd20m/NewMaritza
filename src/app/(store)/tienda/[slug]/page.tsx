import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildProductMetadata, buildProductJsonLd } from '@/lib/seo/metadata'
import { AddToCartButton } from '@/components/products/AddToCartButton'

interface Props { params: Promise<{ slug: string }> }

interface DetailProduct {
  id: string
  name: string
  slug: string
  description: string | null
  indications: string | null
  usage_instructions: string | null
  cover_image_url: string | null
  gallery_urls: string[]
  categories: { id: string; name: string; slug: string } | null
  product_variants: Array<{
    id: string
    name: string
    sku: string | null
    weight_grams: number | null
    is_active: boolean
    product_prices: Array<{ amount_cents: number; compare_at_cents: number | null; currency: string; effective_to: string | null }>
  }>
  reviews: Array<{ rating: number; title: string | null; body: string | null; is_published: boolean; created_at: string }>
}

async function getProduct(slug: string): Promise<DetailProduct | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      categories ( id, name, slug ),
      product_variants (
        id, name, sku, weight_grams, is_active,
        product_prices ( amount_cents, compare_at_cents, currency, effective_to )
      ),
      reviews ( rating, title, body, is_published, created_at )
    `)
    .eq('slug', slug)
    .single()
  return data as DetailProduct | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  const price = product.product_variants?.[0]?.product_prices?.[0]
  return buildProductMetadata(product as unknown as import('@/types/database').Product, price?.amount_cents)
}

const CATEGORY_COLORS: Record<string, string> = {
  gym: 'var(--cat-durazno)', 'skin-care': 'var(--cat-coral)',
  vitaminas: 'var(--cat-mostaza)', organicos: 'var(--cat-menta)',
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const activeVariant = product.product_variants?.find((v) => v.is_active) ?? product.product_variants?.[0]
  const price = activeVariant?.product_prices?.find((p) => !p.effective_to)
  const catSlug = product.categories?.slug ?? ''
  const catColor = CATEGORY_COLORS[catSlug] ?? 'var(--cat-lavanda)'
  const jsonLd = buildProductJsonLd(product as unknown as import('@/types/database').Product, price?.amount_cents)
  const publishedReviews = (product.reviews ?? []).filter((r) => r.is_published)
  const avgRating = publishedReviews.length
    ? (publishedReviews.reduce((s, r) => s + r.rating, 0) / publishedReviews.length).toFixed(1)
    : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ background: 'var(--liora-crema)', padding: '48px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'flex-start' }}>
          {/* Image */}
          <div style={{ position: 'sticky', top: 120 }}>
            <div style={{ background: catColor, borderRadius: 32, aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {product.cover_image_url ? (
                <img src={product.cover_image_url} alt={product.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, color: 'var(--liora-uva)', textAlign: 'center', padding: 32 }}>{product.name}</div>
              )}
            </div>
            {/* Gallery thumbnails */}
            {product.gallery_urls?.length > 0 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {product.gallery_urls.slice(0, 4).map((url: string, i: number) => (
                  <div key={i} style={{ width: 80, height: 80, borderRadius: 16, background: catColor, overflow: 'hidden', border: '2px solid var(--liora-arena)' }}>
                    <img src={url} alt={`${product.name} ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, color: 'var(--liora-uva)', opacity: 0.7 }}>
              {product.categories?.name ?? 'Producto'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              {product.name}
            </h1>
            {activeVariant && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8 }}>{activeVariant.name}</div>
            )}

            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <span style={{ color: 'var(--cat-mostaza-ink)', fontWeight: 700 }}>★ {avgRating}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.65 }}>({publishedReviews.length} reseñas)</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, color: 'var(--liora-uva)' }}>
                S/{((price?.amount_cents ?? 0) / 100).toFixed(0)}
              </span>
              {price?.compare_at_cents && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: 'var(--liora-uva)', opacity: 0.5, textDecoration: 'line-through' }}>
                  S/{(price.compare_at_cents / 100).toFixed(0)}
                </span>
              )}
            </div>

            {product.description && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.6, color: 'var(--liora-uva)', marginTop: 24, opacity: 0.9 }}>
                {product.description}
              </p>
            )}

            {activeVariant && price && (
              <AddToCartButton
                variantId={activeVariant.id}
                productId={product.id}
                name={product.name}
                variantName={activeVariant.name}
                priceCents={price.amount_cents}
                currency={price.currency}
                imageUrl={product.cover_image_url ?? undefined}
                categoryColor={catColor}
              />
            )}

            {/* Product details */}
            {product.indications && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1.5px solid var(--liora-arena)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 12 }}>¿Para quién es?</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, opacity: 0.85 }}>{product.indications}</p>
              </div>
            )}
            {product.usage_instructions && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 12 }}>¿Cómo usarlo?</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, opacity: 0.85 }}>{product.usage_instructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
