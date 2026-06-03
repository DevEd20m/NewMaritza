import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { EnvelopeSimple, Download } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = { title: 'Clientes — Admin LIORA' }

const TIER_COLORS: Record<string, string> = {
  Nueva:      'var(--cat-cielo)',
  Activa:     'var(--cat-menta)',
  Recurrente: 'var(--cat-mostaza)',
  VIP:        'var(--cat-lavanda)',
  'En pausa': 'var(--cat-coral)',
}

interface Profile {
  id: string; first_name: string | null; last_name: string | null; created_at: string
  users: { email: string } | null
  orders: { id: string; total_cents: number }[]
}

export default async function AdminCustomersPage() {
  const admin = createAdminClient()
  const { data: profilesRaw } = await (admin as any)
    .from('profiles')
    .select('id, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  const profiles = (profilesRaw ?? []) as Profile[]

  const { data: ordersRaw } = await (admin as any)
    .from('orders')
    .select('user_id, id, total_cents, guest_email')
    .neq('status', 'cancelled')
  const orders = (ordersRaw ?? []) as { user_id: string; id: string; total_cents: number; guest_email: string | null }[]

  const ordersByUser: Record<string, { count: number; total: number }> = {}
  for (const o of orders) {
    if (o.user_id) {
      if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = { count: 0, total: 0 }
      ordersByUser[o.user_id].count++
      ordersByUser[o.user_id].total += o.total_cents
    }
  }

  const { data: authUsersRaw } = await (admin as any).auth.admin.listUsers({ perPage: 200 })
  const authUsers = (authUsersRaw?.users ?? []) as { id: string; email: string }[]
  const emailById: Record<string, string> = {}
  for (const u of authUsers) emailById[u.id] = u.email

  function getTier(orderCount: number, totalCents: number): string {
    if (totalCents > 150000) return 'VIP'
    if (orderCount >= 4) return 'Recurrente'
    if (orderCount >= 1) return 'Activa'
    return 'Nueva'
  }

  const totalSpent = Object.values(ordersByUser).reduce((s, v) => s + v.total, 0)
  const avgOrders = profiles.length > 0
    ? (Object.values(ordersByUser).reduce((s, v) => s + v.count, 0) / profiles.length).toFixed(1)
    : '0'

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>CRM</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Clientes</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
            {profiles.length} clientes · S/{Math.round(totalSpent / 100).toLocaleString()} LTV · {avgOrders} pedidos/cliente
          </p>
        </div>
        <button style={{ background: 'var(--liora-blanco)', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Download size={14} weight="bold" /> Exportar segmento
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1.6fr 1fr 100px 130px 130px 80px', gap: 14, padding: '12px 22px', background: 'var(--liora-crema)', borderBottom: '1.5px solid var(--liora-arena)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <div />
          <div>Cliente</div>
          <div>Email</div>
          <div>Pedidos</div>
          <div>Total gastado</div>
          <div>Segmento</div>
          <div />
        </div>

        {profiles.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55 }}>
            Sin clientes registrados aún.
          </div>
        )}

        {profiles.map((profile, i) => {
          const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Sin nombre'
          const email = emailById[profile.id] ?? '—'
          const stats = ordersByUser[profile.id] ?? { count: 0, total: 0 }
          const tier = getTier(stats.count, stats.total)
          const tierColor = TIER_COLORS[tier] ?? 'var(--cat-cielo)'
          const initial = name.slice(0, 2).toUpperCase()

          return (
            <div key={profile.id} style={{ display: 'grid', gridTemplateColumns: '44px 1.6fr 1fr 100px 130px 130px 80px', gap: 14, padding: '14px 22px', borderBottom: i < profiles.length - 1 ? '1.5px solid var(--liora-arena)' : 'none', alignItems: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: tierColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{initial}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>Desde {new Date(profile.created_at).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>{stats.count}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>S/{Math.round(stats.total / 100).toLocaleString()}</div>
              <div>
                <span style={{ background: tierColor, color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--liora-uva)', opacity: 0.55, display: 'inline-block' }} />
                  {tier}
                </span>
              </div>
              <div>
                <button style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, width: 30, height: 30, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title={`Enviar email a ${email}`}>
                  <EnvelopeSimple size={13} weight="bold" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
