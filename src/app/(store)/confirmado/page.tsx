import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProvider } from '@/lib/payment/provider'
import { getStoreSettings } from '@/lib/settings'
import { markOrderPaid } from '@/lib/orders/mark-paid'
import { SuccessClient } from '@/components/checkout/SuccessClient'
import type { ConfirmedOrder } from '@/components/checkout/SuccessClient'
import type { Json } from '@/types/database'

export const metadata: Metadata = { title: 'Pedido confirmado', robots: { index: false, follow: false } }

interface Props { searchParams: Promise<{ session_id?: string }> }

type ConfirmedOrderWithPayments = ConfirmedOrder & {
  payments?: Array<{ metadata: Json | null }>
}

async function getOrder(orderId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('*, order_items(*), shipments(*), payments(metadata)')
    .eq('id', orderId)
    .single()
  return data as unknown as ConfirmedOrderWithPayments | null
}

async function getQuizProfileId(userId: string | null): Promise<string | null> {
  if (!userId) return null
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('quiz_profile_id').eq('id', userId).single()
  return data?.quiz_profile_id ?? null
}

async function confirmOrderFromSession(sessionId: string): Promise<string | null> {
  try {
    const provider = getPaymentProvider('stripe')
    const result = await provider.confirmPayment(sessionId)
    if (result.status !== 'succeeded') return null

    const session = (result.metadata?.session ?? {}) as { metadata?: { order_id?: string }; amount_total?: number | null }
    const sessionOrderId = session.metadata?.order_id
    const sessionAmount = session.amount_total
    if (!sessionOrderId) return null

    const admin = createAdminClient()
    const { data: order } = await admin
      .from('orders')
      .select('id, total_cents')
      .eq('id', sessionOrderId)
      .single()
    if (!order) return null
    if (typeof sessionAmount === 'number' && sessionAmount !== order.total_cents) return null

    await markOrderPaid(order.id, 'stripe_redirect', sessionId)
    return order.id
  } catch {
    return null
  }
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams
  const orderId = sessionId ? await confirmOrderFromSession(sessionId) : null

  const [order, settings] = await Promise.all([
    orderId ? getOrder(orderId) : Promise.resolve(null),
    getStoreSettings(),
  ])

  if (!order) {
    return (
      <div style={{ padding: '96px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--liora-uva)' }}>Pedido no encontrado</h1>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Volver al inicio</Link>
      </div>
    )
  }

  const quizProfileId = await getQuizProfileId(order.user_id)
  const paymentMetadata = order.payments?.[0]?.metadata as { tracking_token?: string } | null | undefined
  return (
    <SuccessClient
      order={order}
      whatsappNumber={settings.whatsapp_number}
      quizProfileId={quizProfileId}
      trackingToken={paymentMetadata?.tracking_token ?? null}
    />
  )
}
