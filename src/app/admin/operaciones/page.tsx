import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Operaciones — Admin LIORA' }
export const dynamic = 'force-dynamic'

const panelStyle = {
  background: 'var(--liora-blanco)',
  border: '1.5px solid var(--liora-arena)',
  borderRadius: 20,
  padding: 24,
} as const

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.6,
} as const

const tdStyle = {
  padding: '11px 12px',
  borderTop: '1px solid var(--liora-arena)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
} as const

function dateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(cents / 100)
}

export default async function AdminOperationsPage() {
  const admin = createAdminClient()
  const [reservationsResult, reviewsResult, emailsResult] = await Promise.all([
    admin.from('admin_inventory_reservation_summary').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('admin_payment_review').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('admin_failed_email_jobs').select('*').order('created_at', { ascending: false }).limit(100),
  ])

  const reservations = reservationsResult.data ?? []
  const reviews = reviewsResult.data ?? []
  const failedEmails = emailsResult.data ?? []
  const hasQueryError = Boolean(reservationsResult.error || reviewsResult.error || emailsResult.error)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6 }}>Salud operativa</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: 'var(--liora-uva)', margin: '6px 0 8px' }}>Pagos, stock y correos</h1>
        <p style={{ fontFamily: 'var(--font-body)', margin: 0, opacity: 0.7 }}>Revisa aquí los casos que requieren intervención antes de preparar un pedido.</p>
      </div>

      {hasQueryError && (
        <div role="alert" style={{ ...panelStyle, background: 'var(--cat-durazno)' }}>
          No se pudieron cargar todos los controles operativos. Verifica que la migración de producción esté aplicada.
        </div>
      )}

      <section style={panelStyle}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>Pagos en revisión ({reviews.length})</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.65, margin: '0 0 16px' }}>El pago existe, pero el inventario no pudo volver a reservarse. No cumplimentar automáticamente.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>Pedido</th><th style={thStyle}>Total</th><th style={thStyle}>Stripe</th><th style={thStyle}>Fecha</th></tr></thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={`${review.id}-${review.provider_reference ?? ''}`}>
                  <td style={tdStyle}><Link href="/admin/pedidos">#{review.order_number}</Link></td>
                  <td style={tdStyle}>{money(review.total_cents, review.currency)}</td>
                  <td style={tdStyle}>{review.provider_reference ?? '—'}</td>
                  <td style={tdStyle}>{dateTime(review.payment_updated_at ?? review.created_at)}</td>
                </tr>
              ))}
              {!reviews.length && <tr><td style={tdStyle} colSpan={4}>Sin pagos pendientes de revisión.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px' }}>Reservas recientes ({reservations.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>Pedido</th><th style={thStyle}>Estado</th><th style={thStyle}>Unidades finitas</th><th style={thStyle}>Expira</th></tr></thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td style={tdStyle}>#{reservation.order_number}</td>
                  <td style={tdStyle}>{reservation.status}</td>
                  <td style={tdStyle}>{reservation.finite_units}</td>
                  <td style={tdStyle}>{dateTime(reservation.expires_at)}</td>
                </tr>
              ))}
              {!reservations.length && <tr><td style={tdStyle} colSpan={4}>Sin reservas registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px' }}>Correos fallidos ({failedEmails.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>Tipo</th><th style={thStyle}>Intentos</th><th style={thStyle}>Error</th><th style={thStyle}>Programado</th></tr></thead>
            <tbody>
              {failedEmails.map((job) => (
                <tr key={job.id}>
                  <td style={tdStyle}>{job.type}</td>
                  <td style={tdStyle}>{job.attempts}/5</td>
                  <td style={{ ...tdStyle, maxWidth: 520 }}>{job.last_error ?? '—'}</td>
                  <td style={tdStyle}>{dateTime(job.scheduled_for)}</td>
                </tr>
              ))}
              {!failedEmails.length && <tr><td style={tdStyle} colSpan={4}>Sin correos fallidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
