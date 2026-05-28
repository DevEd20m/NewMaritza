import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Productos' }

interface AdminProduct { id: string; name: string; slug: string; is_active: boolean; categories: { name: string } | null; product_variants: Array<{ id: string; product_prices: Array<{ amount_cents: number; effective_to: string | null }> }> }

export default async function AdminProductsPage() {
  const admin = createAdminClient()
  const { data: productsRaw } = await admin
    .from('products')
    .select(`*, categories(name), product_variants(id, product_prices(amount_cents, effective_to))`)
    .order('created_at', { ascending: false })
  const products = productsRaw as AdminProduct[] | null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: 0 }}>Productos</h1>
        <span style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '10px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'not-allowed', opacity: 0.5 }}>
          + Nuevo producto (próximamente)
        </span>
      </div>

      <div style={{ background: 'var(--liora-blanco)', borderRadius: 20, border: '1.5px solid var(--liora-arena)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          <thead style={{ background: 'var(--liora-crema)' }}>
            <tr>
              {['Producto', 'Categoría', 'Precio', 'Estado', 'Acciones'].map((h) => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p, i) => {
              const variant = p.product_variants?.[0]
              const price = variant?.product_prices?.find((pp) => !pp.effective_to)
              const cat = p.categories
              return (
                <tr key={p.id} style={{ borderTop: '1.5px solid var(--liora-arena)', background: i % 2 === 0 ? 'transparent' : 'rgba(251,241,226,0.3)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700 }}>{p.name}</td>
                  <td style={{ padding: '14px 20px', opacity: 0.75 }}>{cat?.name ?? '—'}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{price ? `S/${(price.amount_cents / 100).toFixed(0)}` : '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: p.is_active ? 'var(--color-success-bg)' : 'var(--color-error-bg)', color: p.is_active ? 'var(--color-success)' : 'var(--color-error)', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Link href={`/tienda/${p.slug}`} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.7, textDecoration: 'underline' }} target="_blank">
                      Ver
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
