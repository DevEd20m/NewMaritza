import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderGuideSnapshot } from '@/lib/guides/snapshot'

/**
 * Marca una orden como pagada y ejecuta los side effects (stock, cupón, guía, emails)
 * exactamente una vez, sin importar si la dispara el webhook de Stripe o el redirect
 * de success_url. La transición pending_payment -> paid es atómica: solo quien la logra
 * ejecuta los side effects, así que es seguro llamarla desde ambos caminos y de forma repetida.
 */
export async function markOrderPaid(orderId: string, source: 'stripe_webhook' | 'stripe_redirect'): Promise<void> {
  const admin = createAdminClient()

  // Transición atómica: solo pasa de pending_payment a paid una vez.
  // Si otra ruta ya la marcó, el WHERE no encuentra fila y no hacemos nada.
  const { data: updated } = await admin
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId)
    .eq('status', 'pending_payment')
    .select('id, coupon_id')

  const order = updated?.[0]
  if (!order) return // ya estaba pagada (u otra ruta ganó la carrera): no re-ejecutar side effects

  await admin.from('payments').update({ status: 'succeeded' }).eq('order_id', orderId)

  await admin.from('order_status_history').insert({
    order_id: orderId,
    status: 'paid',
    note: source === 'stripe_webhook' ? 'Webhook: checkout.session.completed' : 'Confirmado vía success_url de Stripe',
    created_by: source,
  })

  // Descontar stock de variantes que lo trackean
  const { data: items } = await admin
    .from('order_items')
    .select('variant_id, quantity')
    .eq('order_id', orderId)

  for (const item of items ?? []) {
    if (!item.variant_id) continue
    await (admin as any).rpc('decrement_variant_stock', {
      p_variant_id: item.variant_id,
      p_qty: item.quantity,
    })
  }

  // Incrementar uso del cupón
  if (order.coupon_id) {
    await (admin as any).rpc('increment_coupon_used_count', { p_coupon_id: order.coupon_id })
  }

  // Snapshot inmutable de guía (fire and forget)
  generateOrderGuideSnapshot(orderId).catch(() => {})

  // Email de guía Day 0 (fire and forget) + cola Day 7
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
  fetch(`${siteUrl}/api/email/send-guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, type: 'day0' }),
  }).catch(() => {})

  await (admin as any).from('email_queue').insert({
    order_id: orderId,
    type: 'day7',
    scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    sent: false,
  })
}
