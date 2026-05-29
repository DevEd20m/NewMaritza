import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { Download } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Pedidos — Admin LIORA' }

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pend. pago', paid: 'Pagado', processing: 'Preparando',
  shipped: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado',
}
const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'var(--cat-mostaza)', paid: 'var(--cat-cielo)',
  processing: 'var(--cat-lavanda)', shipped: 'var(--cat-menta)',
  delivered: 'var(--cat-menta)', cancelled: 'var(--cat-coral)', refunded: 'var(--cat-durazno)',
}

interface AdminOrder {
  id: string; order_number: string; guest_email: string | null; guest_name: string | null
  status: string; total_cents: number; created_at: string; shipping_cents: number | null; discount_cents: number | null
  order_items: Array<{ product_name_snapshot: string; quantity: number; unit_price_cents: number }>
}

export default async function AdminOrdersPage() {
  const admin = createAdminClient()
  const { data: ordersRaw } = await (admin as any)
    .from('orders')
    .select('id, order_number, guest_email, guest_name, status, total_cents, created_at, shipping_cents, discount_cents, order_items(product_name_snapshot, quantity, unit_price_cents)')
    .order('created_at', { ascending: false })
    .limit(100)
  const orders = (ordersRaw ?? []) as AdminOrder[]

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_cents, 0)

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Operación</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Pedidos</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>{orders.length} pedidos · S/{Math.round(totalRevenue / 100).toLocaleString()} facturados</p>
        </div>
        <button style={{ background: 'var(--liora-blanco)', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Download size={14} weight="bold" /> Exportar
        </button>
      </div>

      {/* Orders table */}
      <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1.6fr 1fr 100px 150px 110px', gap: 14, padding: '12px 22px', background: 'var(--liora-crema)', borderBottom: '1.5px solid var(--liora-arena)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <div>Pedido</div>
          <div>Cliente</div>
          <div>Fecha</div>
          <div>Items</div>
          <div>Estado</div>
          <div style={{ textAlign: 'right' }}>Total</div>
        </div>

        {orders.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.6 }}>
            Aún no hay pedidos.
          </div>
        )}

        {orders.map((order, i) => {
          const color = STATUS_COLORS[order.status] ?? 'var(--liora-arena)'
          const label = STATUS_LABELS[order.status] ?? order.status
          const customerName = order.guest_name ?? order.guest_email ?? '—'
          const customerEmail = order.guest_email
          const itemCount = (order.order_items ?? []).reduce((s, it) => s + it.quantity, 0)

          return (
            <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '130px 1.6fr 1fr 100px 150px 110px', gap: 14, padding: '14px 22px', borderBottom: i < orders.length - 1 ? '1.5px solid var(--liora-arena)' : 'none', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>{order.order_number}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customerName}</div>
                {customerEmail && customerEmail !== customerName && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customerEmail}</div>
                )}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)' }}>{new Date(order.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>{new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</div>
              <div>
                <span style={{ background: color, color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--liora-uva)', opacity: 0.55, display: 'inline-block' }} />
                  {label}
                </span>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>S/{Math.round(order.total_cents / 100)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
