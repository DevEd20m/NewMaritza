import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Kits' }

interface AdminKit { id: string; name: string; type: string; description: string | null; is_active: boolean; kit_products: Array<{ kit_id: string }> }

export default async function AdminKitsPage() {
  const admin = createAdminClient()
  const { data: kitsRaw } = await admin
    .from('kits')
    .select(`*, kit_products(kit_id)`)
    .order('created_at', { ascending: false })
  const kits = kitsRaw as AdminKit[] | null

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: '0 0 32px' }}>Kits</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {(kits ?? []).map((kit) => (
          <div key={kit.id} style={{ background: 'var(--liora-blanco)', borderRadius: 20, border: '1.5px solid var(--liora-arena)', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)', margin: 0 }}>{kit.name}</h3>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.65, marginTop: 4 }}>{kit.type} · {kit.kit_products?.length ?? 0} productos</div>
              </div>
              <span style={{ background: kit.is_active ? 'var(--color-success-bg)' : 'var(--color-error-bg)', color: kit.is_active ? 'var(--color-success)' : 'var(--color-error)', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                {kit.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {kit.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.75, margin: 0 }}>{kit.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
