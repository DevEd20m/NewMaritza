import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Package, UploadSimple } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Productos — Admin LIORA' }

const CAT_COLORS: Record<string, string> = {
  gym:         'var(--cat-durazno)',
  'skin-care': 'var(--cat-coral)',
  vitaminas:   'var(--cat-mostaza)',
  organicos:   'var(--cat-menta)',
}

interface AdminProduct {
  id: string; name: string; slug: string; is_active: boolean; stock_quantity: number | null
  categories: { name: string; slug: string } | null
  product_variants: Array<{ id: string; product_prices: Array<{ amount_cents: number; effective_to: string | null }> }>
}

export default async function AdminProductsPage() {
  const admin = createAdminClient()
  const { data: productsRaw } = await (admin as any)
    .from('products')
    .select('id, name, slug, is_active, stock_quantity, categories(name, slug), product_variants(id, product_prices(amount_cents, effective_to))')
    .order('created_at', { ascending: false })
  const products = (productsRaw ?? []) as AdminProduct[]

  const activeCount  = products.filter(p => p.is_active).length
  const lowStock = products.filter(p => (p.stock_quantity ?? 999) < 10 && p.is_active)
  const outStock = products.filter(p => (p.stock_quantity ?? 999) === 0)

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Catálogo</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Productos</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>{products.length} productos · {activeCount} activos{outStock.length > 0 ? ` · ${outStock.length} agotados` : ''}</p>
        </div>
        <button style={{ background: 'var(--liora-blanco)', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <UploadSimple size={14} weight="bold" /> Importar CSV
        </button>
      </div>

      {/* Stock alerts */}
      {outStock.length > 0 && (
        <div style={{ background: 'var(--cat-coral)', borderRadius: 16, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)' }}>
          <Package size={20} weight="bold" />
          <span><strong>{outStock.length} {outStock.length === 1 ? 'producto agotado' : 'productos agotados'}:</strong> {outStock.slice(0, 3).map(p => p.name).join(', ')}{outStock.length > 3 ? '…' : ''}</span>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {products.map(p => {
          const variant = p.product_variants?.[0]
          const price = variant?.product_prices?.find(pp => !pp.effective_to)
          const catSlug = (p.categories as any)?.slug ?? ''
          const bg = CAT_COLORS[catSlug] ?? 'var(--cat-lavanda)'
          const out = p.stock_quantity === 0
          const low = !out && (p.stock_quantity ?? 999) < 10

          return (
            <article key={p.id} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1/1', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Package size={56} weight="bold" color="var(--liora-uva)" style={{ opacity: 0.6 }} />
                {!p.is_active && (
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--liora-uva)', color: 'var(--liora-lima)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inactivo</span>
                )}
                {out && (
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(217,83,79,0.9)', color: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Agotado</span>
                )}
                {low && !out && (
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--cat-mostaza)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stock bajo</span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{p.categories?.name ?? '—'}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)', lineHeight: 1.15, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>
                    {price ? `S/${Math.round(price.amount_cents / 100)}` : '—'}
                  </div>
                  <Link href={`/tienda/${p.slug}`} target="_blank" style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '6px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, cursor: 'pointer', textDecoration: 'none' }}>
                    Ver
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
