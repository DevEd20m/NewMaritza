import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProvider } from '@/lib/payment/provider'
import { getStoreSettings } from '@/lib/settings'
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

async function confirmOrderFromSession(sessionId: string, orderNumber: string) {
  try {
    const admin = createAdminClient()
    const { data: order } = await admin
      .from('orders')
      .select('id, status')
      .eq('order_number', orderNumber)
      .single()

    if (!order || order.status !== 'pending_payment') return

    const provider = getPaymentProvider('stripe')
    const result = await provider.confirmPayment(sessionId)

    if (result.status === 'succeeded') {
      await admin.from('orders').update({ status: 'paid' }).eq('id', order.id)
      await admin.from('payments').update({ status: 'succeeded', provider_reference: sessionId }).eq('order_id', order.id)
      await (admin as any).from('order_status_history').insert({
        order_id: order.id,
        status: 'paid',
        note: 'Confirmado vía success_url de Stripe',
        created_by: 'stripe_redirect',
      })
    }
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

  return <SuccessClient order={order} whatsappNumber={settings.whatsapp_number} />
}
