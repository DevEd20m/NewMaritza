import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProvider } from '@/lib/payment/provider'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''

  const provider = getPaymentProvider('stripe')
  const admin = createAdminClient()

  let webhookEvent
  try {
    webhookEvent = await provider.constructWebhookEvent(payload, signature)
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Store raw event
  const { data: paymentRecord } = await admin
    .from('payments')
    .select('id')
    .eq('order_id', webhookEvent.orderId ?? '')
    .single()

  if (paymentRecord) {
    await admin.from('payment_events').insert({
      payment_id: paymentRecord.id,
      provider: webhookEvent.provider,
      event_type: webhookEvent.type,
      payload: webhookEvent.rawPayload as unknown as import('@/types/database').Json,
      hmac_verified: true,
      processed: false,
    })
  }

  // Process known event types
  if (webhookEvent.type === 'checkout.session.completed' && webhookEvent.orderId && webhookEvent.status) {
    const { data: order } = await admin.from('orders').select('id, status, coupon_id').eq('id', webhookEvent.orderId).single()

    if (order && order.status === 'pending_payment') {
      const newStatus = webhookEvent.status === 'succeeded' ? 'paid' : 'cancelled'

      await admin.from('orders').update({ status: newStatus }).eq('id', webhookEvent.orderId)
      await admin.from('payments').update({ status: webhookEvent.status as 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled' }).eq('order_id', webhookEvent.orderId)
      await admin.from('order_status_history').insert({
        order_id: webhookEvent.orderId,
        status: newStatus,
        note: `Webhook: ${webhookEvent.type}`,
        created_by: 'stripe_webhook',
      })

      // Decrement stock for tracked variants
      if (newStatus === 'paid') {
        const { data: items } = await admin
          .from('order_items')
          .select('variant_id, quantity')
          .eq('order_id', webhookEvent.orderId)

        if (items) {
          for (const item of items) {
            if (!item.variant_id) continue
            await (admin as any).rpc('decrement_variant_stock', {
              p_variant_id: item.variant_id,
              p_qty: item.quantity,
            })
          }
        }
      }

      // Increment coupon used_count on successful payment
      if (newStatus === 'paid' && (order as any).coupon_id) {
        await (admin as any).rpc('increment_coupon_used_count', { p_coupon_id: (order as any).coupon_id })
      }

      // Enviar email de guía de uso (Day 0) — fire and forget
      if (newStatus === 'paid') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
        fetch(`${siteUrl}/api/email/send-guide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: webhookEvent.orderId, type: 'day0' }),
        }).catch(() => {}) // silent — no bloquea el webhook

        // Guardar en cola para Day 7
        await (admin as any).from('email_queue').insert({
          order_id: webhookEvent.orderId,
          type: 'day7',
          scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          sent: false,
        }).catch(() => {}) // silent si la tabla no existe aún
      }

      if (paymentRecord) {
        await admin.from('payment_events').update({ processed: true }).eq('payment_id', paymentRecord.id).eq('event_type', webhookEvent.type)
      }
    }
  }

  return NextResponse.json({ received: true })
}
