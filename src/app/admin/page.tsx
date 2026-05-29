import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Package, Receipt, Warning, TrendUp } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Dashboard — Admin LIORA' }

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'var(--cat-mostaza)',
  paid:            'var(--cat-cielo)',
  processing:      'var(--cat-lavanda)',
  shipped:         'var(--cat-menta)',
  delivered:       'var(--cat-menta)',
  cancelled:       'var(--cat-coral)',
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pago pendiente',
  paid:            'Pagado',
  processing:      'Preparando',
  shipped:         'En camino',
  delivered:       'Entregado',
  cancelled:       'Cancelado',
}

interface Order {
  id: string; order_number: string; status: string; total_cents: number; created_at: string
  order_items: { id: string }[]
}
interface Product { id: string; name: string; is_active: boolean }

export default async function AdminDashboard() {
  const admin = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { data: recentOrders },
    { count: productCount },
    { count: orderCountTotal },
    { data: todayOrders },
    { data: monthOrders },
    { count: lowStockCount },
  ] = await Promise.all([
    (admin as any).from('orders').select('id, order_number, status, total_cents, created_at, order_items(id)').order('created_at', { ascending: false }).limit(8),
    admin.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('orders').select('id', { count: 'exact', head: true }),
    (admin as any).from('orders').select('id, total_cents, status').gte('created_at', startOfToday),
    (admin as any).from('orders').select('id, total_cents, status').gte('created_at', startOfMonth),
    admin.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).lt('stock_quantity', 10),
  ])

  const orders = (recentOrders ?? []) as Order[]
  const todayRevenue = ((todayOrders ?? []) as { total_cents: number; status: string }[]).filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_cents, 0)
  const todayCount = ((todayOrders ?? []) as { status: string }[]).filter(o => o.status !== 'cancelled').length
  const monthRevenue = ((monthOrders ?? []) as { total_cents: number; status: string }[]).filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_cents, 0)
  const pendingCount = orders.filter(o => ['pending_payment', 'paid', 'processing'].includes(o.status)).length

  const kpis = [
    { eyebrow: 'Hoy', value: `S/${Math.round(todayRevenue / 100).toLocaleString()}`, label: `${todayCount} pedidos`, bg: 'var(--liora-uva)', fg: 'var(--liora-crema)', accent: 'var(--liora-lima)', Icon: TrendUp },
    { eyebrow: 'Este mes', value: `S/${Math.round(monthRevenue / 100).toLocaleString()}`, label: `${orderCountTotal ?? 0} pedidos totales`, bg: 'var(--cat-mostaza)', fg: 'var(--liora-uva)', Icon: Receipt },
    { eyebrow: 'Por preparar', value: String(pendingCount), label: 'pedidos activos', bg: 'var(--cat-coral)', fg: 'var(--liora-uva)', Icon: Package, href: '/admin/pedidos' },
    { eyebrow: 'Productos activos', value: String(productCount ?? 0), label: lowStockCount ? `${lowStockCount} con stock bajo` : 'en catálogo', bg: 'var(--cat-lavanda)', fg: 'var(--liora-uva)', Icon: Warning, href: '/admin/productos' },
  ]

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Resumen</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Dashboard</h1>
        </div>
        <Link href="/admin/pedidos" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '11px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Receipt size={15} weight="bold" /> Ver pedidos
        </Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {kpis.map(k => {
          const { Icon } = k
          return (
            <article key={k.eyebrow} style={{ background: k.bg, borderRadius: 22, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 168, position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: k.fg, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.14em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} weight="bold" color={k.fg} />
                {k.eyebrow}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1, letterSpacing: '-0.02em', color: k.accent ?? k.fg, marginTop: 'auto', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 0" }}>{k.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: k.fg, opacity: 0.75 }}>{k.label}</div>
                {k.href && (
                  <Link href={k.href} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, cursor: 'pointer', textDecoration: 'none' }}>Ver →</Link>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* Recent orders */}
      <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1.5px solid var(--liora-arena)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)', lineHeight: 1.1 }}>Pedidos recientes</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 4 }}>Últimos 8 pedidos</div>
          </div>
          <Link href="/admin/pedidos" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Ver todos →</Link>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1.4fr 1fr 140px 110px', gap: 14, padding: '12px 22px', background: 'var(--liora-crema)', borderBottom: '1.5px solid var(--liora-arena)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <div>Pedido</div>
          <div>Items</div>
          <div>Fecha</div>
          <div>Estado</div>
          <div style={{ textAlign: 'right' }}>Total</div>
        </div>

        {orders.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55 }}>Aún no hay pedidos.</div>
        )}

        {orders.map((order, i) => {
          const color = STATUS_COLORS[order.status] ?? 'var(--liora-arena)'
          const label = STATUS_LABELS[order.status] ?? order.status
          return (
            <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '130px 1.4fr 1fr 140px 110px', gap: 14, padding: '14px 22px', borderBottom: i < orders.length - 1 ? '1.5px solid var(--liora-arena)' : 'none', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>{order.order_number}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.7 }}>{(order.order_items ?? []).length} {(order.order_items ?? []).length === 1 ? 'item' : 'items'}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65 }}>{new Date(order.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</div>
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
