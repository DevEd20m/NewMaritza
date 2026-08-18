import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderGuideSnapshot } from '@/lib/guides/snapshot'

export type FinalizePaymentResult =
  | 'paid'
  | 'already_paid'
  | 'payment_review'
  | 'order_not_found'
  | 'order_not_payable'
  | 'reservation_not_found'

/**
 * Finalizes payment, reservation, coupon and outbox in one database transaction.
 * Both Stripe's webhook and the verified return page call this function safely.
 */
export async function markOrderPaid(
  orderId: string,
  source: 'stripe_webhook' | 'stripe_redirect',
  providerReference: string,
): Promise<FinalizePaymentResult> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('finalize_paid_order', {
    p_order_id: orderId,
    p_provider_reference: providerReference,
    p_source: source,
  })

  if (error) throw error
  const result = data as FinalizePaymentResult

  // Snapshot generation is independently idempotent. Await it so a serverless
  // invocation cannot be frozen before the immutable guide is persisted.
  if (result === 'paid') await generateOrderGuideSnapshot(orderId)

  return result
}
