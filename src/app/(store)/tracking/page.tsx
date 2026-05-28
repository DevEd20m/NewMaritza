import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rastrear pedido', robots: { index: false, follow: false } }

interface Props { searchParams: Promise<{ order?: string }> }

export default async function TrackingPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams
  if (!orderNumber) {
    return (
      <div style={{ padding: '96px 48px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--liora-uva)' }}>Rastrea tu pedido</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, opacity: 0.7, marginTop: 16 }}>Ingresa tu número de pedido.</p>
        <form method="GET" style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <input name="order" placeholder="L-0001-PE" required style={{ flex: 1, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 12, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 15 }} />
          <button type="submit" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Buscar</button>
        </form>
      </div>
    )
  }

  interface TrackingOrder {
    order_number: string; status: string
    order_items: Array<{ product_name_snapshot: string; quantity: number; unit_price_cents: number }>
    shipments: Array<{ carrier: string | null; tracking_number: string | null; estimated_delivery_at: string | null }>
    order_status_history: Array<{ status: string; created_at: string; note: string | null }>
  }
  const admin = createAdminClient()
  const { data: orderRaw } = await admin
    .from('orders')
    .select(`*, order_items(*), shipments(*), order_status_history(status, created_at, note)`)
    .eq('order_number', orderNumber)
    .single()
  const order = orderRaw as TrackingOrder | null

  if (!order) {
    return (
      <div style={{ padding: '96px 48px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)' }}>Pedido no encontrado</h1>
        <Link href="/tracking" style={{ display: 'inline-block', marginTop: 24, background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Intentar de nuevo</Link>
      </div>
    )
  }

  const shipment = order.shipments?.[0]
  const statusHistory = order.order_status_history ?? []

  const STEPS = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered']
  const currentIdx = STEPS.indexOf(order.status)

  return (
    <div style={{ background: 'var(--liora-crema)', padding: '48px 48px 96px', maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, color: 'var(--liora-uva)', margin: '0 0 8px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        Tracking
      </h1>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--liora-uva)', letterSpacing: '-0.01em', marginBottom: 40 }}>
        {order.order_number}
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {STEPS.map((step, i) => {
            const done = i <= currentIdx
            const labels: Record<string, string> = { pending_payment: 'Pago', paid: 'Confirmado', processing: 'Preparando', shipped: 'En camino', delivered: 'Entregado' }
            return (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', top: 14, right: '50%', width: '100%', height: 3, background: done ? 'var(--liora-uva)' : 'var(--liora-arena)' }} />}
                <div style={{ width: 28, height: 28, borderRadius: 999, background: done ? 'var(--liora-uva)' : 'var(--liora-arena)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  {done && <span style={{ color: 'var(--liora-crema)', fontSize: 14 }}>✓</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, marginTop: 8, opacity: done ? 1 : 0.5, textAlign: 'center' }}>{labels[step]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Shipment info */}
      {shipment?.tracking_number && (
        <div style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: '24px 28px', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7, marginBottom: 12 }}>Envío</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15 }}>
            <strong>{shipment.carrier}</strong> · {shipment.tracking_number}
          </div>
          {shipment.estimated_delivery_at && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.75, marginTop: 8 }}>
              Entrega estimada: {new Date(shipment.estimated_delivery_at).toLocaleDateString('es-PE')}
            </div>
          )}
        </div>
      )}

      {/* Products */}
      <div style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: '24px 28px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7, marginBottom: 12 }}>Productos</div>
        {order.order_items.map((item: { product_name_snapshot: string; quantity: number; unit_price_cents: number }) => (
          <div key={item.product_name_snapshot} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--liora-arena)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            <span>{item.quantity}× {item.product_name_snapshot}</span>
            <span style={{ fontWeight: 600 }}>S/{((item.unit_price_cents * item.quantity) / 100).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
