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

const CAT_COLORS: Record<string, string> = {
  piel:          'var(--cat-coral)',
  solar:         'var(--cat-mostaza)',
  bienestar:     'var(--cat-lavanda)',
  gym:           'var(--cat-durazno)',
  viaje:         'var(--cat-cielo)',
  hogar:         'var(--cat-rosa)',
  digestivo:     'var(--cat-menta)',
  'pies-cuerpo': 'var(--cat-durazno)',
}

export default async function AdminDashboard() {
  const admin = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { count: productCount },
    { count: orderCountTotal },
    { data: todayOrders },
    { data: monthOrders },
    { count: lowStockCount },
    { data: pendingOrdersRaw },
    { data: criticalStockRaw },
    { data: activeKitsRaw },
    { data: monthOrdersWithItems },
  ] = await Promise.all([
    admin.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('orders').select('id', { count: 'exact', head: true }),
    (admin as any).from('orders').select('id, total_cents, status').gte('created_at', startOfToday),
    (admin as any).from('orders').select('id, total_cents, status').gte('created_at', startOfMonth),
    (admin as any).from('product_variants').select('id, products!inner(id)', { count: 'exact', head: true }).eq('products.is_active', true).lt('stock_quantity', 10),
    (admin as any)
      .from('orders')
      .select('id, order_number, guest_name, guest_email, status, total_cents, created_at, order_items(quantity)')
      .in('status', ['pending_payment', 'paid', 'processing'])
      .order('created_at', { ascending: true })
      .limit(5),
    (admin as any)
      .from('product_variants')
      .select('id, stock_quantity, products!inner(id, name, is_active, categories(name, slug))')
      .eq('products.is_active', true)
      .lt('stock_quantity', 10)
      .order('stock_quantity', { ascending: true })
      .limit(6),
    (admin as any)
      .from('kits')
      .select('id, name, slug, is_active, kit_products(variant_id, product_variants(product_prices(amount_cents, effective_to)))')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4),
    (admin as any)
      .from('orders')
      .select('order_items(product_name_snapshot, quantity)')
      .gte('created_at', startOfMonth)
      .neq('status', 'cancelled'),
  ])

  const todayRevenue = ((todayOrders ?? []) as { total_cents: number; status: string }[]).filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_cents, 0)
  const todayCount = ((todayOrders ?? []) as { status: string }[]).filter(o => o.status !== 'cancelled').length
  const monthRevenue = ((monthOrders ?? []) as { total_cents: number; status: string }[]).filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_cents, 0)

  type PendingOrder = { id: string; order_number: string; guest_name: string | null; guest_email: string | null; status: string; total_cents: number; created_at: string; order_items: { quantity: number }[] }
  const pendingOrders = (pendingOrdersRaw ?? []) as PendingOrder[]
  const pendingCount = pendingOrders.length

  type CritProduct = { id: string; name: string; stock_quantity: number | null; categories: { name: string; slug: string } | null }
  const criticalStock: CritProduct[] = ((criticalStockRaw ?? []) as any[]).map(v => ({
    id: v.products?.id ?? v.id,
    name: v.products?.name ?? '',
    stock_quantity: v.stock_quantity ?? null,
    categories: v.products?.categories ?? null,
  }))

  type ActiveKit = { id: string; name: string; slug: string; is_active: boolean; kit_products: Array<{ variant_id: string; product_variants: { product_prices: Array<{ amount_cents: number; effective_to: string | null }> } | null }> }
  const activeKits = (activeKitsRaw ?? []) as ActiveKit[]

  // Aggregate top products from order items this month
  const productSales: Record<string, number> = {}
  const monthWithItems = (monthOrdersWithItems ?? []) as { order_items: Array<{ product_name_snapshot: string; quantity: number }> }[]
  for (const order of monthWithItems) {
    for (const item of order.order_items ?? []) {
      productSales[item.product_name_snapshot] = (productSales[item.product_name_snapshot] ?? 0) + item.quantity
    }
  }
  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const kpis = [
    { eyebrow: 'Hoy', value: `S/${Math.round(todayRevenue / 100).toLocaleString()}`, label: `${todayCount} pedidos`, bg: 'var(--liora-uva)', fg: 'var(--liora-crema)', accent: 'var(--liora-lima)', Icon: TrendUp },
    { eyebrow: 'Este mes', value: `S/${Math.round(monthRevenue / 100).toLocaleString()}`, label: `${orderCountTotal ?? 0} pedidos totales`, bg: 'var(--cat-mostaza)', fg: 'var(--liora-uva)', Icon: Receipt },
    { eyebrow: 'Por preparar', value: String(pendingCount), label: 'pedidos activos', bg: 'var(--cat-coral)', fg: 'var(--liora-uva)', Icon: Package, href: '/admin/pedidos' },
    { eyebrow: 'Productos activos', value: String(productCount ?? 0), label: lowStockCount ? `${lowStockCount} con stock bajo` : 'en catálogo', bg: 'var(--cat-lavanda)', fg: 'var(--liora-uva)', Icon: Warning, href: '/admin/productos' },
  ]

  const sectionHead = (title: string, sub: string, linkLabel: string, href: string) => (
    <div style={{ padding: '20px 24px 16px', borderBottom: '1.5px solid var(--liora-arena)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 4 }}>{sub}</div>
      </div>
      <Link href={href} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{linkLabel} →</Link>
    </div>
  )

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
                <Icon size={14} weight="bold" color={k.fg} />{k.eyebrow}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1, letterSpacing: '-0.02em', color: k.accent ?? k.fg, marginTop: 'auto', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 0" }}>{k.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: k.fg, opacity: 0.75 }}>{k.label}</div>
                {k.href && <Link href={k.href} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, cursor: 'pointer', textDecoration: 'none' }}>Ver →</Link>}
              </div>
            </article>
          )
        })}
      </div>

      {/* Two-column: pedidos por preparar + stock crítico */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Pedidos por preparar */}
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
          {sectionHead('Pedidos por preparar', 'Orden de antigüedad', 'Ver todos', '/admin/pedidos')}
          {pendingOrders.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55 }}>¡Sin pedidos pendientes!</div>
          ) : (
            pendingOrders.map((o, i) => {
              const color = STATUS_COLORS[o.status] ?? 'var(--liora-arena)'
              const label = STATUS_LABELS[o.status] ?? o.status
              const name = o.guest_name ?? o.guest_email ?? '—'
              const items = (o.order_items ?? []).reduce((s: number, it: { quantity: number }) => s + it.quantity, 0)
              return (
                <div key={o.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center', padding: '14px 24px', borderBottom: i < pendingOrders.length - 1 ? '1.5px solid var(--liora-arena)' : 'none' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>{o.order_number}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>{items} items · {new Date(o.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span style={{ background: color, color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>S/{Math.round(o.total_cents / 100)}</div>
                </div>
              )
            })
          )}
        </div>

        {/* Stock crítico */}
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
          {sectionHead('Stock crítico', 'Reabastecer pronto', 'Productos', '/admin/productos')}
          {criticalStock.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55 }}>Sin productos con stock bajo.</div>
          ) : (
            criticalStock.map((p, i) => {
              const out = p.stock_quantity === 0
              const catSlug = (p.categories as any)?.slug ?? ''
              const bg = CAT_COLORS[catSlug] ?? 'var(--cat-lavanda)'
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '14px 24px', borderBottom: i < criticalStock.length - 1 ? '1.5px solid var(--liora-arena)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
                    <Package size={16} weight="bold" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>{p.categories?.name ?? '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, color: out ? 'var(--cat-coral)' : 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>
                      {out ? 'Agotado' : `${p.stock_quantity} u.`}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Performance: kits + top products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Kits activos */}
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
          {sectionHead('Kits activos', 'Por precio total', 'Ver kits', '/admin/kits')}
          <div style={{ padding: '16px 24px 24px' }}>
            {activeKits.length === 0 ? (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55, paddingTop: 8 }}>Sin kits activos.</div>
            ) : (
              activeKits.map(k => {
                const totalCents = (k.kit_products ?? []).reduce((s: number, kp: { product_variants: { product_prices: Array<{ amount_cents: number; effective_to: string | null }> } | null }) => {
                  const price = kp.product_variants?.product_prices?.find((p: { effective_to: string | null }) => !p.effective_to)
                  return s + (price?.amount_cents ?? 0)
                }, 0)
                const maxCents = activeKits.reduce((m, ak) => {
                  const t = (ak.kit_products ?? []).reduce((s: number, kp: { product_variants: { product_prices: Array<{ amount_cents: number; effective_to: string | null }> } | null }) => {
                    const price = kp.product_variants?.product_prices?.find((p: { effective_to: string | null }) => !p.effective_to)
                    return s + (price?.amount_cents ?? 0)
                  }, 0)
                  return Math.max(m, t)
                }, 1)
                const pct = maxCents > 0 ? (totalCents / maxCents) * 100 : 0
                const slugColor = Object.entries({ energia: 'var(--cat-mostaza)', piel: 'var(--cat-coral)', reset: 'var(--cat-menta)', gym: 'var(--cat-durazno)' }).find(([key]) => k.slug.includes(key))?.[1] ?? 'var(--cat-lavanda)'
                return (
                  <div key={k.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)' }}>{k.name}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>S/{Math.round(totalCents / 100)}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: 'var(--liora-arena)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: slugColor, borderRadius: 999 }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Top products */}
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
          {sectionHead('Productos top', 'Por unidades este mes', 'Ver productos', '/admin/productos')}
          {topProducts.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55 }}>Sin ventas este mes.</div>
          ) : (
            topProducts.map(([name, qty], i) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center', padding: '12px 24px', borderBottom: i < topProducts.length - 1 ? '1.5px solid var(--liora-arena)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--cat-mostaza)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
                  <Package size={16} weight="bold" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>{qty}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>unidades</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
