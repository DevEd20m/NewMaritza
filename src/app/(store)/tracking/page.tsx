import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, CheckCircle, Package, Truck, MapPin, HandHeart, Copy } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Rastrear pedido — LIORA', robots: { index: false, follow: false } }

interface Props { searchParams: Promise<{ order?: string }> }

const STEP_ICONS = [CheckCircle, Package, Truck, MapPin, HandHeart]
const STEP_LABELS = ['Pedido confirmado', 'Empacando con cariño', 'En camino', 'En reparto', 'Entregado']

const STATUS_STEP: Record<string, number> = {
  pending_payment: 0, paid: 0, processing: 1, shipped: 2, delivered: 4, cancelled: -1,
}

export default async function TrackingPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams

  if (!orderNumber) {
    return (
      <div style={{ background: 'var(--liora-crema)', padding: '64px 48px 96px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Tu pedido</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
          Rastrea tu <span style={{ fontFamily: 'var(--font-script)' }}>pedido.</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--liora-uva)', opacity: 0.8, marginTop: 16 }}>Ingresa tu número de pedido.</p>
        <form method="GET" style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <input name="order" placeholder="L-0001-PE" required style={{ flex: 1, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 12, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', outline: 'none' }} />
          <button type="submit" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Buscar</button>
        </form>
      </div>
    )
  }

  interface TrackingOrder {
    order_number: string; status: string; total_cents: number; created_at: string
    guest_name: string | null
    addresses: { first_name: string | null; last_name: string | null; address_line1: string | null; city: string | null; district: string | null } | null
    order_items: Array<{ product_name_snapshot: string; quantity: number; unit_price_cents: number }>
    shipments: Array<{ carrier: string | null; tracking_number: string | null; estimated_delivery_at: string | null }>
    order_status_history: Array<{ status: string; created_at: string; note: string | null }>
  }

  const admin = createAdminClient()
  const { data: orderRaw } = await (admin as any)
    .from('orders')
    .select('order_number, status, total_cents, created_at, guest_name, addresses(first_name, last_name, address_line1, city, district), order_items(product_name_snapshot, quantity, unit_price_cents), shipments(carrier, tracking_number, estimated_delivery_at), order_status_history(status, created_at, note)')
    .eq('order_number', orderNumber)
    .single()
  const order = orderRaw as TrackingOrder | null

  if (!order) {
    return (
      <div style={{ background: 'var(--liora-crema)', padding: '96px 48px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: '0 0 16px' }}>Pedido no encontrado</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.7 }}>Verifica el número y vuelve a intentar.</p>
        <Link href="/tracking" style={{ display: 'inline-block', marginTop: 24, background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>Intentar de nuevo</Link>
      </div>
    )
  }

  const currentStep = STATUS_STEP[order.status] ?? 0
  const shipment = order.shipments?.[0]
  const items = order.order_items ?? []
  const isCancelled = order.status === 'cancelled'

  const stepDetails = [
    `Recibimos tu pedido el ${new Date(order.created_at).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}.`,
    'Nuestro equipo está armando tu kit a mano.',
    shipment?.tracking_number ? `Enviado con ${shipment.carrier ?? 'courier'}. Código: ${shipment.tracking_number}` : 'Tu pedido está de camino.',
    'A pocas paradas. Recibirás un SMS cuando estemos a 5 minutos.',
    '¡Entregado! Cuéntanos cómo te llegó.',
  ]

  return (
    <section style={{ background: 'var(--liora-crema)', padding: '32px 48px 96px', maxWidth: 1100, margin: '0 auto' }}>
      <Link href="/cuenta" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, textDecoration: 'none' }}>
        <ArrowLeft size={16} weight="bold" /> Volver a mi cuenta
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Tu pedido</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
          {isCancelled ? 'Pedido cancelado.' : currentStep >= 4 ? 'Kit entregado.' : 'Tu kit va'} {!isCancelled && currentStep < 4 && <span style={{ fontFamily: 'var(--font-script)' }}>en camino.</span>}
        </h1>

        {/* Tracking code */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: 'var(--liora-uva)', color: 'var(--liora-crema)', padding: '14px 12px 14px 24px', borderRadius: 999, marginTop: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.12em', lineHeight: 1 }}>Código de tracking</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--liora-crema)', lineHeight: 1.1, marginTop: 2, letterSpacing: '0.04em' }}>#{order.order_number}</div>
          </div>
          <form action="">
            <button formAction={`/tracking?order=${order.order_number}`} style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Copy size={13} weight="bold" /> Copiar
            </button>
          </form>
        </div>

        {shipment?.estimated_delivery_at && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--liora-uva)', opacity: 0.8, marginTop: 16 }}>
            Entrega estimada: {new Date(shipment.estimated_delivery_at).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'flex-start' }}>
        {/* Timeline */}
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 28, padding: 32 }}>
          {isCancelled ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', opacity: 0.7 }}>Este pedido fue cancelado. Si tienes dudas, contáctanos.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STEP_LABELS.map((label, i) => {
                const done = i <= currentStep
                const current = i === currentStep
                const Icon = STEP_ICONS[i]
                return (
                  <div key={label} style={{ display: 'flex', gap: 20, position: 'relative' }}>
                    {i < STEP_LABELS.length - 1 && (
                      <div style={{ position: 'absolute', left: 23, top: 48, bottom: -24, width: 2, background: done ? 'var(--liora-uva)' : 'var(--liora-arena)' }} />
                    )}
                    <div style={{ width: 48, height: 48, borderRadius: 999, flexShrink: 0, background: current ? 'var(--liora-lima)' : done ? 'var(--liora-uva)' : 'var(--liora-arena)', color: current ? 'var(--liora-uva)' : done ? 'var(--liora-crema)' : 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: current ? '0 0 0 6px rgba(201, 240, 72, 0.25)' : 'none', zIndex: 1 }}>
                      <Icon size={22} weight="bold" />
                    </div>
                    <div style={{ paddingBottom: 28, flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', opacity: done || current ? 1 : 0.5, lineHeight: 1.1 }}>{label}</div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: done || current ? 0.8 : 0.45, margin: 0, marginTop: 6 }}>{stepDetails[i]}</p>
                      {current && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, background: 'var(--liora-lima)', color: 'var(--liora-uva)', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--liora-uva)', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
                          Activo ahora
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>
          {/* Products */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 28, padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Tu pedido ({items.length} {items.length === 1 ? 'producto' : 'productos'})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cat-mostaza)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={20} weight="bold" color="var(--liora-uva)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name_snapshot}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.65 }}>×{item.quantity}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', flexShrink: 0 }}>S/{Math.round(item.unit_price_cents * item.quantity / 100)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, marginTop: 16, borderTop: '1.5px solid var(--liora-arena)' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--liora-uva)' }}>S/{Math.round(order.total_cents / 100)}</span>
            </div>
          </div>

          {/* Delivery address */}
          {order.addresses && (
            <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 28, padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Entregamos en</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <MapPin size={22} weight="fill" color="var(--liora-uva)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.4 }}>
                  {(order.addresses.first_name || order.addresses.last_name) && (
                    <strong>{[order.addresses.first_name, order.addresses.last_name].filter(Boolean).join(' ')}<br /></strong>
                  )}
                  {order.addresses.address_line1}
                  {order.addresses.district && `, ${order.addresses.district}`}
                  {order.addresses.city && `, ${order.addresses.city}`}
                </div>
              </div>
            </div>
          )}

          <Link href="/cuenta" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '14px 24px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Volver a mi cuenta
          </Link>
        </aside>
      </div>
    </section>
  )
}
