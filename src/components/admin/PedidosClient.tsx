'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight, X, Package, Truck, House, CheckCircle, CreditCard, Download } from '@phosphor-icons/react'

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'var(--cat-mostaza)',
  paid: 'var(--cat-cielo)',
  processing: 'var(--cat-lavanda)',
  shipped: 'var(--cat-menta)',
  delivered: 'var(--cat-menta)',
  cancelled: 'var(--cat-coral)',
  refunded: 'var(--cat-durazno)',
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pend. pago',
  paid: 'Pagado',
  processing: 'Preparando',
  shipped: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

const FILTER_OPTIONS = [
  { id: 'all',             label: 'Todos' },
  { id: 'pending_payment', label: 'Pendiente' },
  { id: 'paid',            label: 'Pagado' },
  { id: 'processing',      label: 'Preparando' },
  { id: 'shipped',         label: 'En camino' },
  { id: 'delivered',       label: 'Entregado' },
  { id: 'cancelled',       label: 'Cancelado' },
]

const TIMELINE_STAGES = [
  { id: 'pending_payment', label: 'Pago',        Icon: CreditCard },
  { id: 'paid',            label: 'Confirmado',  Icon: CheckCircle },
  { id: 'processing',      label: 'Empacando',   Icon: Package },
  { id: 'shipped',         label: 'En camino',   Icon: Truck },
  { id: 'delivered',       label: 'Entregado',   Icon: House },
]

export interface AdminOrderItem {
  id: string
  product_name_snapshot: string
  variant_name_snapshot: string
  quantity: number
  unit_price_cents: number
}

export interface AdminOrderAddress {
  first_name: string
  last_name: string
  phone: string | null
  address_line1: string
  address_line2: string | null
  district: string | null
  city: string
}

export interface AdminOrderData {
  id: string
  order_number: string
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  user_id: string | null
  profile_first_name: string | null
  profile_last_name: string | null
  status: string
  total_cents: number
  subtotal_cents: number
  discount_cents: number
  created_at: string
  items: AdminOrderItem[]
  address: AdminOrderAddress | null
}

function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'var(--liora-arena)'
  const label = STATUS_LABELS[status] ?? status
  return (
    <span style={{ background: color, color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--liora-uva)', opacity: 0.45, display: 'inline-block' }} />
      {label}
    </span>
  )
}

function TotalsRow({ label, value, bold, negative }: { label: string; value: string; bold?: boolean; negative?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontFamily: 'var(--font-body)', fontSize: bold ? 16 : 13, fontWeight: bold ? 700 : 500, color: negative ? '#2e7d5a' : 'var(--liora-uva)' }}>
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

function OrderDrawer({
  order,
  onClose,
  onStatusChange,
  loading,
}: {
  order: AdminOrderData | null
  onClose: () => void
  onStatusChange: (orderId: string, status: string, trackingNumber?: string) => Promise<void>
  loading: boolean
}) {
  const [trackingNumber, setTrackingNumber] = useState('')

  if (!order) return null

  const customerName = order.guest_name
    ?? (order.address ? `${order.address.first_name} ${order.address.last_name}`.trim() : null)
    ?? order.guest_email
    ?? '—'
  const currentIdx = TIMELINE_STAGES.findIndex(s => s.id === order.status)
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded'

  const handleStatus = async (status: string) => {
    await onStatusChange(order.id, status, status === 'shipped' ? trackingNumber : undefined)
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(61,26,58,0.35)', zIndex: 50, backdropFilter: 'blur(2px)' }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 580, background: 'var(--liora-crema)',
        zIndex: 51, overflowY: 'auto', boxShadow: '-8px 0 40px rgba(61,26,58,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--liora-arena)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Detalle del pedido</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', lineHeight: 1.1 }}>{order.order_number}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.6, padding: 8 }}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Customer + status */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <StatusPill status={order.status} />
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6 }}>
                {new Date(order.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', lineHeight: 1.15 }}>{customerName}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
              {(order.guest_email) && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ opacity: 0.5 }}>✉</span> {order.guest_email}
                </div>
              )}
              {(order.guest_phone ?? order.address?.phone) && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ opacity: 0.5 }}>☎</span> {order.guest_phone ?? order.address?.phone}
                </div>
              )}
              {order.address && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ opacity: 0.5, marginTop: 1 }}>📍</span>
                  <span>
                    {`${order.address.first_name} ${order.address.last_name}`.trim()} — {order.address.address_line1}
                    {order.address.address_line2 ? `, ${order.address.address_line2}` : ''}
                    {order.address.district ? `, ${order.address.district}` : ''}
                    {`, ${order.address.city}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {!isCancelled && (
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7, marginBottom: 14 }}>Estado del pedido</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 17, left: 17, right: 17, height: 2, background: 'var(--liora-arena)', borderRadius: 999 }} />
                <div style={{
                  position: 'absolute', top: 17, left: 17, height: 2,
                  width: currentIdx > 0 ? `calc((100% - 34px) * ${currentIdx / (TIMELINE_STAGES.length - 1)})` : 0,
                  background: 'var(--liora-uva)', borderRadius: 999, transition: 'width 400ms ease',
                }} />
                {TIMELINE_STAGES.map((s, i) => {
                  const done = i <= currentIdx
                  const active = i === currentIdx
                  const { Icon } = s
                  return (
                    <div key={s.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto', width: 80 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 999,
                        background: done ? 'var(--liora-uva)' : 'var(--liora-blanco)',
                        border: '1.5px solid ' + (done ? 'var(--liora-uva)' : 'var(--liora-arena)'),
                        color: done ? 'var(--liora-lima)' : 'var(--liora-uva)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: done ? 1 : 0.4,
                        boxShadow: active ? '0 0 0 4px rgba(201,240,72,0.4)' : 'none',
                      }}>
                        <Icon size={15} weight="bold" />
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: 'var(--liora-uva)', opacity: done ? 1 : 0.5, textAlign: 'center', whiteSpace: 'nowrap' }}>{s.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7, marginBottom: 10 }}>Productos · {order.items.length}</div>
            <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, overflow: 'hidden' }}>
              {order.items.map((it, i) => (
                <div key={it.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: i < order.items.length - 1 ? '1.5px solid var(--liora-arena)' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--cat-mostaza)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
                    <Package size={18} weight="bold" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.15 }}>{it.product_name_snapshot}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>{it.variant_name_snapshot}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>×{it.quantity}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums', minWidth: 64, textAlign: 'right' }}>
                    S/{Math.round(it.unit_price_cents * it.quantity / 100)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: 16 }}>
            <TotalsRow label="Subtotal" value={`S/${Math.round(order.subtotal_cents / 100)}`} />
            {order.discount_cents > 0 && <TotalsRow label="Descuento" value={`− S/${Math.round(order.discount_cents / 100)}`} negative />}
            <div style={{ height: 1, background: 'var(--liora-arena)', margin: '8px 0' }} />
            <TotalsRow label="Total" value={`S/${Math.round(order.total_cents / 100)}`} bold />
          </div>

          {/* Tracking input if shipping */}
          {order.status === 'processing' && (
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7, marginBottom: 8 }}>Número de seguimiento (opcional)</div>
              <input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="Ej. ON123456789PE"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 12, background: 'var(--liora-blanco)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--liora-arena)', display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {order.status === 'pending_payment' && (
            <div style={{ flex: 1, background: 'var(--cat-mostaza)', borderRadius: 14, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', textAlign: 'center', lineHeight: 1.4 }}>
              Esperando confirmación de Stripe — se actualiza automáticamente al completarse el pago.
            </div>
          )}
          {order.status === 'paid' && (
            <button
              onClick={() => handleStatus('processing')}
              disabled={loading}
              style={{ flex: 1, background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '12px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              <Package size={15} weight="bold" /> Empezar preparación
            </button>
          )}
          {order.status === 'processing' && (
            <button
              onClick={() => handleStatus('shipped')}
              disabled={loading}
              style={{ flex: 1, background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '12px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              <Truck size={15} weight="bold" /> Marcar enviado
            </button>
          )}
          {order.status === 'shipped' && (
            <button
              onClick={() => handleStatus('delivered')}
              disabled={loading}
              style={{ flex: 1, background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '12px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              <House size={15} weight="bold" /> Confirmar entrega
            </button>
          )}
          {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
            <button
              onClick={() => handleStatus('cancelled')}
              disabled={loading}
              style={{ background: 'transparent', color: 'var(--cat-coral)', border: '1.5px solid var(--cat-coral)', borderRadius: 999, padding: '10px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              Cancelar pedido
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export function PedidosClient({
  orders: initialOrders,
  totalRevenue,
}: {
  orders: AdminOrderData[]
  totalRevenue: number
}) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const [orders, setOrders] = useState(initialOrders)
  const [loading, setLoading] = useState(false)

  const rows = useMemo(() => {
    let r = orders
    if (filter !== 'all') r = r.filter(o => o.status === filter)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        (o.guest_name ?? '').toLowerCase().includes(q) ||
        (o.guest_email ?? '').toLowerCase().includes(q) ||
        (o.profile_first_name ?? '').toLowerCase().includes(q)
      )
    }
    return r
  }, [orders, filter, search])

  const openOrder = openOrderId ? orders.find(o => o.id === openOrderId) ?? null : null

  const handleStatusChange = async (orderId: string, status: string, trackingNumber?: string) => {
    setLoading(true)
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(trackingNumber ? { trackingNumber } : {}) }),
      })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Operación</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Pedidos</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
            {orders.length} pedidos · S/{Math.round(totalRevenue / 100).toLocaleString()} facturados
          </p>
        </div>
        <button style={{ background: 'var(--liora-blanco)', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Download size={14} weight="bold" /> Exportar
        </button>
      </div>

      {/* Filters + search + table */}
      <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
        {/* Filter bar */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1.5px solid var(--liora-arena)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {FILTER_OPTIONS.map(opt => {
              const count = opt.id === 'all' ? orders.length : orders.filter(o => o.status === opt.id).length
              const active = filter === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  style={{
                    background: active ? 'var(--liora-uva)' : 'transparent',
                    color: active ? 'var(--liora-crema)' : 'var(--liora-uva)',
                    border: active ? 'none' : '1.5px solid var(--liora-arena)',
                    borderRadius: 999, padding: '7px 14px',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
                  }}
                >
                  {opt.label}
                  <span style={{ background: active ? 'var(--liora-lima)' : 'var(--liora-arena)', color: 'var(--liora-uva)', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 999, minWidth: 18 }}>{count}</span>
                </button>
              )
            })}
          </div>
          <div style={{ flex: 1, minWidth: 200, marginLeft: 'auto' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código, cliente o email…"
              style={{ width: '100%', padding: '9px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 999, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1.6fr 1fr 90px 150px 110px 28px', gap: 14, padding: '12px 22px', background: 'var(--liora-crema)', borderBottom: '1.5px solid var(--liora-arena)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <div>Pedido</div>
          <div>Cliente</div>
          <div>Fecha · Hora</div>
          <div>Items</div>
          <div>Estado</div>
          <div style={{ textAlign: 'right' }}>Total</div>
          <div />
        </div>

        {rows.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.6 }}>
            No hay pedidos con este filtro.
          </div>
        )}

        {rows.map((order, i) => {
          const customerName = order.guest_name
            ?? (order.address ? `${order.address.first_name} ${order.address.last_name}`.trim() : null)
            ?? '—'
          const customerEmail = order.guest_email
          const itemCount = order.items.reduce((s, it) => s + it.quantity, 0)

          return (
            <div
              key={order.id}
              onClick={() => setOpenOrderId(order.id)}
              style={{
                display: 'grid', gridTemplateColumns: '130px 1.6fr 1fr 90px 150px 110px 28px',
                gap: 14, padding: '14px 22px',
                borderBottom: i < rows.length - 1 ? '1.5px solid var(--liora-arena)' : 'none',
                alignItems: 'center', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--liora-crema)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
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
              <div><StatusPill status={order.status} /></div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>S/{Math.round(order.total_cents / 100)}</div>
              <div style={{ color: 'var(--liora-uva)', opacity: 0.4 }}><CaretRight size={14} weight="bold" /></div>
            </div>
          )
        })}
      </div>

      <OrderDrawer
        order={openOrder}
        onClose={() => setOpenOrderId(null)}
        onStatusChange={handleStatusChange}
        loading={loading}
      />
    </div>
  )
}
