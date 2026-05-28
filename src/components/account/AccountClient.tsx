'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignOut, Package, ArrowRight, Check } from '@phosphor-icons/react'

// ── Types passed from server ──────────────────────────────────────────────
export interface AccountOrder {
  id: string
  order_number: string
  total_cents: number
  status: string
  created_at: string
  item_count: number
}

export interface AccountKitItem {
  variantId: string
  name: string
  variantName: string
  categoryName: string
  categoryColor: string
  imageUrl: string | null
}

export interface AccountCoupon {
  id: string
  code: string
  type: string
  value: number
  expires_at: string | null
}

export interface AccountAddress {
  id: string
  first_name: string
  last_name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string | null
  postal_code: string | null
  country: string
  is_default: boolean
}

export interface AccountData {
  firstName: string
  lastName: string | null
  email: string
  memberSince: string
  avatarInitial: string
  orders: AccountOrder[]
  kitItems: AccountKitItem[]
  kitTitle: string
  kitProfileId: string | null
  coupons: AccountCoupon[]
  address: AccountAddress | null
  phone: string | null
}

const TABS = ['Resumen', 'Pedidos', 'Mi kit', 'Cupones', 'Datos'] as const
type Tab = typeof TABS[number]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Pendiente',  color: 'var(--cat-mostaza)' },
  paid:            { label: 'Pagado',     color: 'var(--cat-cielo)' },
  processing:      { label: 'Preparando', color: 'var(--cat-cielo)' },
  shipped:         { label: 'En camino',  color: 'var(--cat-mostaza)' },
  delivered:       { label: 'Entregado',  color: 'var(--cat-menta)' },
  cancelled:       { label: 'Cancelado',  color: 'var(--cat-coral)' },
  refunded:        { label: 'Reembolsado',color: 'var(--cat-lavanda)' },
}

const PROGRESS_STEPS = ['Confirmado', 'Empacando', 'En ruta', 'Entregado']
const STATUS_TO_STEP: Record<string, number> = {
  paid: 0, processing: 1, shipped: 2, delivered: 3,
}

function fmt(cents: number) { return `S/${(cents / 100).toFixed(0)}` }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────

function TabHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 10, opacity: 0.7 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        {title}
      </h2>
    </div>
  )
}

function OrderRow({ order, onDetail }: { order: AccountOrder; onDetail?: () => void }) {
  const s = STATUS_MAP[order.status] ?? { label: order.status, color: 'var(--cat-lavanda)' }
  return (
    <article style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '18px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Pedido</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)' }}>#{order.order_number}</div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Fecha</div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)' }}>{fmtDate(order.created_at)}</div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Total</div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)' }}>{fmt(order.total_cents)} · {order.item_count} items</div>
      </div>
      <div>
        <span style={{ background: s.color, color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
          {s.label}
        </span>
      </div>
      <button onClick={onDetail} style={{ background: 'transparent', border: '1.5px solid var(--liora-uva)', color: 'var(--liora-uva)', borderRadius: 999, padding: '8px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
        Ver detalle
      </button>
    </article>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────

function ResumenTab({ data, onReorder }: { data: AccountData; onReorder: () => void }) {
  const activeOrder = data.orders.find((o) => ['paid', 'processing', 'shipped'].includes(o.status))
  const latestCoupon = data.coupons[0]

  return (
    <div>
      <TabHeader eyebrow="Mi cuenta" title={`Hola, ${data.firstName}.`} />

      {/* Active order tracking */}
      {activeOrder && (
        <article style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 28, padding: 32, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-lima)', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 10 }}>
              Pedido {STATUS_MAP[activeOrder.status]?.label ?? 'activo'} · #{activeOrder.order_number}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--liora-crema)', lineHeight: 1.1, marginBottom: 20 }}>
              {activeOrder.status === 'shipped' ? 'Tu pedido está en camino' : 'Tu pedido está siendo preparado'}
            </div>
            {/* Progress tracker */}
            <div style={{ display: 'flex', alignItems: 'center', maxWidth: 480 }}>
              {PROGRESS_STEPS.map((step, i) => {
                const currentStep = STATUS_TO_STEP[activeOrder.status] ?? 0
                const done = i <= currentStep
                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < PROGRESS_STEPS.length - 1 ? 1 : undefined }}>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 999, background: done ? 'var(--liora-lima)' : 'rgba(251,241,226,0.15)', color: 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                        {done && <Check size={12} weight="bold" />}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, opacity: 0.85, whiteSpace: 'nowrap' as const, color: 'var(--liora-crema)' }}>{step}</span>
                    </div>
                    {i < PROGRESS_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: i < currentStep ? 'var(--liora-lima)' : 'rgba(251,241,226,0.15)', marginBottom: 22, marginLeft: 0, marginRight: 0 }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <button style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '14px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' as const, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Ver tracking <ArrowRight size={16} weight="bold" />
          </button>
        </article>
      )}

      {/* Kit + Coupon tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
        <button onClick={onReorder} style={{ background: 'var(--cat-mostaza)', borderRadius: 24, padding: 24, border: 'none', textAlign: 'left' as const, cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Mi kit</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', lineHeight: 1.15 }}>
            {data.kitTitle || 'Ver mi kit →'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', marginTop: 'auto' }}>Repedir →</div>
        </button>
        <div style={{ background: 'var(--cat-lavanda)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Cupón disponible</div>
          {latestCoupon
            ? <>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', lineHeight: 1.15 }}>
                  {latestCoupon.code} · {latestCoupon.value}{latestCoupon.type === 'percentage' ? '% off' : ' PEN'}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', marginTop: 'auto' }}>Aplicar →</div>
              </>
            : <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)', opacity: 0.6 }}>Sin cupones activos</div>
          }
        </div>
      </div>

      {/* Recent orders */}
      {data.orders.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)', margin: '0 0 16px' }}>Pedidos recientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {data.orders.slice(0, 3).map((o) => <OrderRow key={o.id} order={o} />)}
          </div>
        </div>
      )}

      {!data.orders.length && !activeOrder && (
        <div style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 40, textAlign: 'center' as const }}>
          <Package size={48} style={{ color: 'var(--liora-arena)', marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.7, margin: 0 }}>Aún no tienes pedidos.</p>
        </div>
      )}
    </div>
  )
}

function PedidosTab({ orders }: { orders: AccountOrder[] }) {
  return (
    <div>
      <TabHeader eyebrow="Historial" title="Tus pedidos" />
      {orders.length === 0
        ? <p style={{ fontFamily: 'var(--font-body)', opacity: 0.65, color: 'var(--liora-uva)' }}>Aún no tienes pedidos.</p>
        : <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {orders.map((o) => <OrderRow key={o.id} order={o} />)}
          </div>
      }
    </div>
  )
}

function MiKitTab({ data, onReorder }: { data: AccountData; onReorder: () => void }) {
  return (
    <div>
      <TabHeader eyebrow="Tu kit personalizado" title={data.kitTitle || 'Mi kit'} />
      {data.kitItems.length === 0
        ? (
          <div style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 40, textAlign: 'center' as const }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.7, margin: 0 }}>
              Aún no tienes un kit. <a href="/cuestionario" style={{ color: 'var(--liora-uva)', fontWeight: 700 }}>Hacer cuestionario →</a>
            </p>
          </div>
        )
        : (
          <>
            <div style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 28, padding: 32, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-lima)', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 8 }}>
                  {data.kitItems.length} productos · Hecho para ti
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, lineHeight: 1, color: 'var(--liora-crema)' }}>
                  {fmt(data.kitItems.reduce((s, i) => s + 0, 0) || 0)}
                </div>
              </div>
              <button onClick={onReorder} style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '14px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                Repedir mi kit
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {data.kitItems.map((item) => (
                <article key={item.variantId} style={{ background: item.categoryColor, borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)', flexShrink: 0 }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                      : <Package size={24} style={{ opacity: 0.6 }} />
                    }
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--liora-uva)' }}>{item.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 2 }}>{item.variantName} · {item.categoryName}</div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )
      }
    </div>
  )
}

function CuponesTab({ coupons }: { coupons: AccountCoupon[] }) {
  const COLORS = ['var(--liora-lima)', 'var(--cat-rosa)', 'var(--cat-coral)', 'var(--cat-cielo)', 'var(--cat-lavanda)', 'var(--cat-mostaza)']
  return (
    <div>
      <TabHeader eyebrow="Beneficios" title="Cupones activos" />
      {coupons.length === 0
        ? <p style={{ fontFamily: 'var(--font-body)', opacity: 0.65, color: 'var(--liora-uva)' }}>Sin cupones disponibles ahora mismo.</p>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {coupons.map((c, i) => (
              <article key={c.id} style={{ background: COLORS[i % COLORS.length], borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column' as const, gap: 14, overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>
                  {c.type === 'percentage' ? 'Descuento %' : c.type === 'fixed_amount' ? 'Monto fijo' : c.type === 'free_shipping' ? 'Envío gratis' : 'Regalo'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, color: 'var(--liora-uva)', lineHeight: 0.95, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                  {c.type === 'percentage' ? `${c.value}% off` : c.type === 'fixed_amount' ? `S/${c.value} off` : 'Envío gratis'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px dashed rgba(61,26,58,0.25)', paddingTop: 14, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', letterSpacing: '0.08em' }}>{c.code}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.7 }}>
                    {c.expires_at ? `Vence: ${new Date(c.expires_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}` : 'Sin caducidad'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )
      }
    </div>
  )
}

function DatosTab({ data }: { data: AccountData }) {
  const fields: [string, string][] = [
    ['Nombre', `${data.firstName}${data.lastName ? ' ' + data.lastName : ''}`],
    ['Teléfono', data.phone ?? '—'],
    ...(data.address ? [
      ['Dirección', `${data.address.address_line1}${data.address.address_line2 ? ', ' + data.address.address_line2 : ''}`] as [string, string],
      ['Ciudad', `${data.address.city}${data.address.state ? ', ' + data.address.state : ''}`] as [string, string],
    ] : []),
  ]
  return (
    <div>
      <TabHeader eyebrow="Tu cuenta" title="Datos personales" />
      <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 28, padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {fields.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4, opacity: 0.7 }}>{k}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-uva)' }}>{v}</div>
            </div>
          ))}
        </div>
        <button style={{ marginTop: 28, background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-uva)', borderRadius: 999, padding: '12px 22px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Editar datos
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export function AccountClient({ data }: { data: AccountData }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Resumen')

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const handleReorder = () => {
    if (data.kitProfileId) {
      router.push(`/carrito?profileId=${data.kitProfileId}`)
    } else {
      router.push('/cuestionario')
    }
  }

  return (
    <section style={{ background: 'var(--liora-crema)', padding: '48px 48px 96px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 36, alignItems: 'flex-start', maxWidth: 1100, margin: '0 auto' }}>

        {/* Sidebar */}
        <aside style={{ background: 'var(--liora-blanco)', borderRadius: 28, border: '1.5px solid var(--liora-arena)', padding: '24px 20px', position: 'sticky', top: 100 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 20, borderBottom: '1.5px solid var(--liora-arena)' }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              {data.avatarInitial}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)', lineHeight: 1.1, textAlign: 'center' }}>
              {data.firstName}{data.lastName ? ' ' + data.lastName.charAt(0) + '.' : ''}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', whiteSpace: 'nowrap' }}>
              {data.email}
            </div>
            <span style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 999, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {data.memberSince}
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16 }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? 'var(--liora-uva)' : 'transparent', color: tab === t ? 'var(--liora-crema)' : 'var(--liora-uva)', border: 'none', borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, textAlign: 'left' as const, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t}
              </button>
            ))}
            <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--liora-uva)', border: 'none', borderRadius: 12, padding: '12px 16px', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, textAlign: 'left' as const, cursor: 'pointer', opacity: 0.65, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <SignOut size={16} weight="bold" /> Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div>
          {tab === 'Resumen'  && <ResumenTab  data={data} onReorder={handleReorder} />}
          {tab === 'Pedidos'  && <PedidosTab  orders={data.orders} />}
          {tab === 'Mi kit'   && <MiKitTab    data={data} onReorder={handleReorder} />}
          {tab === 'Cupones'  && <CuponesTab  coupons={data.coupons} />}
          {tab === 'Datos'    && <DatosTab    data={data} />}
        </div>
      </div>
    </section>
  )
}
