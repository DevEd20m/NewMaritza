import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL } from '@/lib/email/client'
import { orderConfirmationEmail } from '@/lib/email/templates/order-confirmation'
import { weekCheckinEmail } from '@/lib/email/templates/week-checkin'
import { detectKitFromItemsDB } from '@/lib/guides/db'
import { getStoreSettings } from '@/lib/settings'

export type OrderEmailType = 'day0' | 'day7'

export type DeliveryResult =
  | { status: 'captured'; html: string }
  | { status: 'sent' }
  | { status: 'skipped' }

/**
 * Renders and delivers one order email without crossing the public HTTP edge.
 * This is intentionally server-only: webhook and cron are the only callers.
 */
export async function deliverOrderEmail(
  orderId: string,
  type: OrderEmailType,
): Promise<DeliveryResult> {
  if (process.env.EMAIL_DELIVERY_MODE !== 'capture' && !process.env.RESEND_API_KEY) {
    throw new Error('email_not_configured')
  }

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*), payments(metadata)')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('order_not_found')
  if (!['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
    throw new Error('order_not_paid')
  }

  let toEmail: string | null = (order as any).guest_email ?? null
  let customerName: string | null = (order as any).guest_name ?? null

  if (!toEmail && (order as any).user_id) {
    const userId = (order as any).user_id as string
    const [{ data: authData }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from('profiles').select('first_name').eq('id', userId).single(),
    ])
    toEmail = authData.user?.email ?? null
    customerName = (profile as any)?.first_name ?? null
  }

  if (!toEmail) throw new Error('order_email_missing')

  const orderData = order as any
  const productNames = (orderData.order_items ?? []).map(
    (item: any) => item.product_name_snapshot as string,
  )
  const guide = await detectKitFromItemsDB(productNames)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
  const { whatsapp_number } = await getStoreSettings()
  const waMessage = guide
    ? `Hola, compré el ${guide.kitName} (pedido #${orderData.order_number}) y tengo una pregunta`
    : `Hola, tengo una pregunta sobre mi pedido #${orderData.order_number}`
  const waUrl = `https://wa.me/${whatsapp_number}?text=${encodeURIComponent(waMessage)}`

  if (type === 'day7') {
    if (!guide) return { status: 'skipped' }
    const html = weekCheckinEmail({
      orderNumber: orderData.order_number,
      customerName: customerName ?? undefined,
      guide,
      guideUrl: `${siteUrl}/guia/${guide.slug}`,
      whatsappUrl: waUrl,
    })
    if (process.env.EMAIL_DELIVERY_MODE === 'capture') return { status: 'captured', html }

    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `¿Cómo van tus primeros 7 días con ${guide.kitName}? 🌱`,
      html,
    }, { idempotencyKey: `order:${orderId}:day7` })
    if (error) throw new Error(`resend_day7_failed:${error.message}`)
    return { status: 'sent' }
  }

  let quizProfileId: string | null = null
  if (orderData.user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('quiz_profile_id')
      .eq('id', orderData.user_id)
      .single()
    quizProfileId = (profile as any)?.quiz_profile_id ?? null
  }

  const guideUrl = guide
    ? `${siteUrl}/guia/${guide.slug}${quizProfileId ? `?profileId=${quizProfileId}` : ''}`
    : undefined
  const paymentMetadata = orderData.payments?.[0]?.metadata as { tracking_token?: string } | null | undefined
  const trackingUrl = paymentMetadata?.tracking_token
    ? `${siteUrl}/tracking?token=${encodeURIComponent(paymentMetadata.tracking_token)}`
    : `${siteUrl}/tracking`

  let activationUrl: string | undefined
  if (!orderData.user_id && orderData.guest_email) {
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: toEmail,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/cuenta` },
    })
    activationUrl = linkData?.properties?.action_link
  }

  const html = orderConfirmationEmail({
    orderNumber: orderData.order_number,
    customerName: customerName ?? undefined,
    items: (orderData.order_items ?? []).map((item: any) => ({
      product_name_snapshot: item.product_name_snapshot,
      variant_name_snapshot: item.variant_name_snapshot,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
    })),
    subtotalCents: orderData.subtotal_cents,
    discountCents: orderData.discount_cents ?? 0,
    shippingCents: orderData.total_cents - orderData.subtotal_cents + (orderData.discount_cents ?? 0),
    totalCents: orderData.total_cents,
    guide: guide ?? undefined,
    guideUrl,
    activationUrl,
    whatsappUrl: waUrl,
    siteUrl,
    trackingUrl,
  })

  if (process.env.EMAIL_DELIVERY_MODE === 'capture') return { status: 'captured', html }

  const subject = guide
    ? `¡Pedido confirmado! + Tu guía del ${guide.kitName} 🌿`
    : `¡Pedido confirmado! #${orderData.order_number} — LIORA 🌿`
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html,
  }, { idempotencyKey: `order:${orderId}:day0` })
  if (error) throw new Error(`resend_day0_failed:${error.message}`)
  return { status: 'sent' }
}
