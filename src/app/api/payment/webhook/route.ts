import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProvider } from '@/lib/payment/provider'
import { markOrderPaid } from '@/lib/orders/mark-paid'
import { processEmailJob } from '@/lib/email/process-job'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''
  const provider = getPaymentProvider('stripe')
  const admin = createAdminClient()

  let webhookEvent
  try {
    webhookEvent = await provider.constructWebhookEvent(payload, signature)
  } catch (error) {
    console.error('[webhook] signature verification failed', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { data: duplicate } = await admin
    .from('payment_events')
    .select('id')
    .eq('provider', webhookEvent.provider)
    .eq('provider_event_id', webhookEvent.id)
    .maybeSingle()
  if (duplicate) return NextResponse.json({ received: true, duplicate: true })

  const { data: paymentRecord } = await admin
    .from('payments')
    .select('id, amount_cents, currency')
    .eq('order_id', webhookEvent.orderId ?? '')
    .maybeSingle()

  if (webhookEvent.orderId && !paymentRecord) {
    console.error('[webhook] order has no payment record', webhookEvent.orderId)
    return NextResponse.json({ error: 'Payment record not found' }, { status: 500 })
  }

  let storedEventId: string | null = null
  if (paymentRecord) {
    const { data: storedEvent, error } = await admin.from('payment_events').insert({
      payment_id: paymentRecord.id,
      provider: webhookEvent.provider,
      provider_event_id: webhookEvent.id,
      event_type: webhookEvent.type,
      payload: webhookEvent.rawPayload as unknown as import('@/types/database').Json,
      hmac_verified: true,
      processed: false,
    }).select('id').single()
    if (error) {
      // A concurrent delivery may have inserted the same unique Stripe event.
      if (error.code === '23505') return NextResponse.json({ received: true, duplicate: true })
      console.error('[webhook] failed to persist event', error)
      return NextResponse.json({ error: 'Event persistence failed' }, { status: 500 })
    }
    storedEventId = storedEvent?.id ?? null
  }

  try {
    if (
      webhookEvent.type === 'checkout.session.completed'
      && webhookEvent.orderId
      && webhookEvent.status === 'succeeded'
    ) {
      if (
        !paymentRecord
        || webhookEvent.amountCents !== paymentRecord.amount_cents
        || webhookEvent.currency?.toUpperCase() !== paymentRecord.currency.toUpperCase()
      ) {
        throw new Error('stripe_amount_or_currency_mismatch')
      }
      const finalization = await markOrderPaid(
        webhookEvent.orderId,
        'stripe_webhook',
        webhookEvent.providerReference ?? webhookEvent.id,
      )

      // Vercel Hobby only permits a daily cron. Deliver day0 immediately from
      // the same retryable outbox; a failure remains queued for the cron.
      if (finalization === 'paid' || finalization === 'already_paid') {
        const { data: day0Job } = await admin.from('email_queue')
          .select('id, order_id, type')
          .eq('order_id', webhookEvent.orderId)
          .eq('type', 'day0')
          .in('status', ['pending', 'failed'])
          .maybeSingle()
        if (day0Job) {
          const emailResult = await processEmailJob(day0Job)
          if (emailResult === 'failed') console.error('[webhook] day0 email queued for retry')
        }
      }
    }

    if (webhookEvent.type === 'checkout.session.expired' && webhookEvent.orderId) {
      await admin.rpc('release_order_inventory', {
        p_order_id: webhookEvent.orderId,
        p_reason: 'stripe_session_expired',
        p_expired: true,
      })
      await Promise.all([
        admin.from('orders')
          .update({ status: 'cancelled' })
          .eq('id', webhookEvent.orderId)
          .eq('status', 'pending_payment'),
        admin.from('payments')
          .update({ status: 'cancelled' })
          .eq('order_id', webhookEvent.orderId)
          .eq('status', 'pending'),
      ])
    }

    if (storedEventId) {
      await admin.from('payment_events')
        .update({ processed: true, processing_error: null })
        .eq('id', storedEventId)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (storedEventId) {
      await admin.from('payment_events')
        .update({ processing_error: message })
        .eq('id', storedEventId)
    }
    console.error('[webhook] processing failed', error)
    return NextResponse.json({ error: 'Event processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
