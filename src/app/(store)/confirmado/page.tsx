import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProvider } from '@/lib/payment/provider'
import { getStoreSettings } from '@/lib/settings'
import { markOrderPaid } from '@/lib/orders/mark-paid'
import { SuccessClient } from '@/components/checkout/SuccessClient'

export const metadata: Metadata = { title: 'Pedido confirmado', robots: { index: false, follow: false } }

interface Props { searchParams: Promise<{ order?: string; session_id?: string }> }

async function getOrder(orderNumber: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('*, order_items(*), shipments(*)')
    .eq('order_number', orderNumber)
    .single()
  return data
}

async function getQuizProfileId(userId: string | null): Promise<string | null> {
  if (!userId) return null
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('quiz_profile_id').eq('id', userId).single()
  return (data as any)?.quiz_profile_id ?? null
}

async function confirmOrderFromSession(sessionId: string, orderNumber: string) {
  try {
    const admin = createAdminClient()
    const { data: order } = await admin
      .from('orders')
      .select('id, status, total_cents')
      .eq('order_number', orderNumber)
      .single()

    if (!order || order.status !== 'pending_payment') return

    const provider = getPaymentProvider('stripe')
    const result = await provider.confirmPayment(sessionId)

    if (result.status !== 'succeeded') return

    // Verificar que la sesión de Stripe corresponde a ESTA orden y por el monto correcto,
    // para que un session_id ajeno no pueda marcar pagada una orden distinta.
    const session = (result.metadata?.session ?? {}) as { metadata?: { order_id?: string }; amount_total?: number | null }
    const sessionOrderId = session.metadata?.order_id
    const sessionAmount = session.amount_total
    if (sessionOrderId !== order.id) return
    if (typeof sessionAmount === 'number' && sessionAmount !== order.total_cents) return

    await admin.from('payments').update({ provider_reference: sessionId }).eq('order_id', order.id)
    await markOrderPaid(order.id, 'stripe_redirect')
  } catch {
    // Silently fail — webhook will catch it as backup
  }
}

export default async function SuccessPage({ searchParams }: Props) {
  const { order: orderNumber, session_id: sessionId } = await searchParams

  // Confirm payment immediately from Stripe's API — don't wait for webhook
  if (sessionId && orderNumber) {
    await confirmOrderFromSession(sessionId, orderNumber)
  }

  const [order, settings] = await Promise.all([
    orderNumber ? getOrder(orderNumber) : Promise.resolve(null),
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

  const quizProfileId = await getQuizProfileId((order as any).user_id ?? null)
  return <SuccessClient order={order} whatsappNumber={settings.whatsapp_number} quizProfileId={quizProfileId} />
}
