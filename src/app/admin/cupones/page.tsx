import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Cupones' }

export default async function AdminCouponesPage() {
  const admin = createAdminClient()
  const { data: coupons } = await admin.from('coupons').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: '0 0 32px' }}>Cupones</h1>
      <div style={{ background: 'var(--liora-blanco)', borderRadius: 20, border: '1.5px solid var(--liora-arena)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          <thead style={{ background: 'var(--liora-crema)' }}>
            <tr>
              {['Código', 'Tipo', 'Valor', 'Usos máx.', 'Estado', 'Expira'].map((h) => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map((c, i) => (
              <tr key={c.id} style={{ borderTop: '1.5px solid var(--liora-arena)', background: i % 2 === 0 ? 'transparent' : 'rgba(251,241,226,0.3)' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.08em' }}>{c.code}</td>
                <td style={{ padding: '14px 20px', opacity: 0.75 }}>{c.type}</td>
                <td style={{ padding: '14px 20px', fontWeight: 600 }}>{c.type === 'percentage' ? `${c.value}%` : `S/${c.value}`}</td>
                <td style={{ padding: '14px 20px', opacity: 0.75 }}>{c.max_uses ?? '∞'}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ background: c.is_active ? 'var(--color-success-bg)' : 'var(--color-error-bg)', color: c.is_active ? 'var(--color-success)' : 'var(--color-error)', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', opacity: 0.65 }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-PE') : '—'}</td>
              </tr>
            ))}
            {!coupons?.length && (
              <tr><td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', opacity: 0.5 }}>No hay cupones todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
