import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Dashboard' }

export default async function AdminDashboard() {
  const admin = createAdminClient()
  const [
    { count: productCount },
    { count: orderCount },
    { data: recentOrders },
  ] = await Promise.all([
    admin.from('products').select('id', { count: 'exact', head: true }),
    admin.from('orders').select('id', { count: 'exact', head: true }),
    admin.from('orders').select('order_number, total_cents, status, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Productos activos', value: productCount ?? 0, color: 'var(--cat-menta)' },
    { label: 'Pedidos totales', value: orderCount ?? 0, color: 'var(--cat-coral)' },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: '0 0 32px' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 40 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: s.color, borderRadius: 24, padding: '28px 32px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, color: 'var(--liora-uva)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--liora-uva)', marginBottom: 16 }}>Pedidos recientes</h2>
      <div style={{ background: 'var(--liora-blanco)', borderRadius: 20, border: '1.5px solid var(--liora-arena)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          <thead style={{ background: 'var(--liora-crema)' }}>
            <tr>
              {['Número', 'Estado', 'Total', 'Fecha'].map((h) => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--liora-uva)', opacity: 0.7 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentOrders ?? []).map((order, i) => (
              <tr key={order.order_number} style={{ borderTop: '1.5px solid var(--liora-arena)', background: i % 2 === 0 ? 'transparent' : 'rgba(251,241,226,0.3)' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700 }}>{order.order_number}</td>
                <td style={{ padding: '14px 20px' }}>{order.status}</td>
                <td style={{ padding: '14px 20px', fontWeight: 700 }}>S/{(order.total_cents / 100).toFixed(0)}</td>
                <td style={{ padding: '14px 20px', opacity: 0.65 }}>{new Date(order.created_at).toLocaleDateString('es-PE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
