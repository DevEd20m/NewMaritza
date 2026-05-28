import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Pedidos' }

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pend. pago', paid: 'Pagado', processing: 'Procesando',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado',
}
const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'var(--color-warning-bg)', paid: 'var(--color-info-bg)',
  processing: 'var(--cat-cielo)', shipped: 'var(--cat-menta)',
  delivered: 'var(--color-success-bg)', cancelled: 'var(--color-error-bg)', refunded: 'var(--cat-lavanda)',
}

interface AdminOrder { id: string; order_number: string; guest_email: string | null; guest_name: string | null; status: string; total_cents: number; created_at: string; order_items: Array<{ product_name_snapshot: string; quantity: number }> }

export default async function AdminOrdersPage() {
  const admin = createAdminClient()
  const { data: ordersRaw } = await admin
    .from('orders')
    .select('*, order_items(product_name_snapshot, quantity)')
    .order('created_at', { ascending: false })
    .limit(50)
  const orders = ordersRaw as AdminOrder[] | null

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: '0 0 32px' }}>Pedidos</h1>
      <div style={{ background: 'var(--liora-blanco)', borderRadius: 20, border: '1.5px solid var(--liora-arena)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          <thead style={{ background: 'var(--liora-crema)' }}>
            <tr>
              {['Número', 'Cliente', 'Productos', 'Estado', 'Total', 'Fecha'].map((h) => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order, i) => (
              <tr key={order.id} style={{ borderTop: '1.5px solid var(--liora-arena)', background: i % 2 === 0 ? 'transparent' : 'rgba(251,241,226,0.3)' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700 }}>{order.order_number}</td>
                <td style={{ padding: '14px 20px', opacity: 0.8 }}>{order.guest_email ?? order.guest_name ?? '—'}</td>
                <td style={{ padding: '14px 20px', opacity: 0.7 }}>{order.order_items?.length} items</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ background: STATUS_COLORS[order.status] ?? 'var(--cat-uva-clara)', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
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
