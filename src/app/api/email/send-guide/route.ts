import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL } from '@/lib/email/client'
import { orderConfirmationEmail } from '@/lib/email/templates/order-confirmation'
import { weekCheckinEmail } from '@/lib/email/templates/week-checkin'
import { detectKitFromItemsDB } from '@/lib/guides/db'

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '51999999999'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const { orderId, type = 'day0' } = body as { orderId?: string; type?: 'day0' | 'day7' }

  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Resolve customer email
  let toEmail: string | null = (order as any).guest_email ?? null
  let customerName: string | null = (order as any).guest_name ?? null

  if (!toEmail && (order as any).user_id) {
    const { data: { user } } = await admin.auth.admin.getUserById((order as any).user_id)
    toEmail = user?.email ?? null
    const { data: profile } = await admin.from('profiles').select('first_name').eq('id', (order as any).user_id).single()
    customerName = (profile as any)?.first_name ?? null
  }

  if (!toEmail) return NextResponse.json({ error: 'No email address for order' }, { status: 422 })

  const productNames = ((order as any).order_items ?? []).map((i: any) => i.product_name_snapshot as string)
  const guide = await detectKitFromItemsDB(productNames)

  const waMessage = guide
    ? `Hola, compré el ${guide.kitName} (pedido #${(order as any).order_number}) y tengo una pregunta`
    : `Hola, tengo una pregunta sobre mi pedido #${(order as any).order_number}`
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`

  // Day 7 check-in — only send if we have a kit guide
  if (type === 'day7') {
    if (!guide) return NextResponse.json({ skipped: true, reason: 'no kit guide for day7' })
    const guideUrl = `${SITE_URL}/guia/${guide.slug}`
    const html = weekCheckinEmail({
      orderNumber: (order as any).order_number,
      customerName: customerName ?? undefined,
      guide,
      guideUrl,
      whatsappUrl: waUrl,
    })
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `¿Cómo van tus primeros 7 días con ${guide.kitName}? 🌱`,
      html,
    })
    if (error) {
      console.error('[email/send-guide] day7 error:', error)
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }
    return NextResponse.json({ sent: true, to: toEmail, type: 'day7', guide: guide.slug })
  }

  // Day 0 — always send order confirmation (include guide section if detected)
  const o = order as any

  // Get quiz_profile_id to personalize the guide URL
  let quizProfileId: string | null = null
  if (o.user_id) {
    const { data: profile } = await admin.from('profiles').select('quiz_profile_id').eq('id', o.user_id).single()
    quizProfileId = (profile as any)?.quiz_profile_id ?? null
  }

  const guideUrl = guide
    ? `${SITE_URL}/guia/${guide.slug}${quizProfileId ? `?profileId=${quizProfileId}` : ''}`
    : undefined

  // Generate magic link for guest orders so they can activate their account
  let activationUrl: string | undefined
  const isGuest = !o.user_id && !!o.guest_email
  if (isGuest) {
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: toEmail,
      options: { redirectTo: `${SITE_URL}/auth/callback?next=/cuenta` },
    })
    activationUrl = linkData?.properties?.action_link
  }

  const html = orderConfirmationEmail({
    orderNumber: o.order_number,
    customerName: customerName ?? undefined,
    items: (o.order_items ?? []).map((i: any) => ({
      product_name_snapshot: i.product_name_snapshot,
      variant_name_snapshot: i.variant_name_snapshot,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
    })),
    subtotalCents: o.subtotal_cents,
    discountCents: o.discount_cents ?? 0,
    shippingCents: o.total_cents - o.subtotal_cents + (o.discount_cents ?? 0),
    totalCents: o.total_cents,
    guide: guide ?? undefined,
    guideUrl,
    activationUrl,
    whatsappUrl: waUrl,
    siteUrl: SITE_URL,
  })

  const subject = guide
    ? `¡Pedido confirmado! + Tu guía del ${guide.kitName} 🌿`
    : `¡Pedido confirmado! #${o.order_number} — LIORA 🌿`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html,
  })

  if (error) {
    console.error('[email/send-guide] day0 error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ sent: true, to: toEmail, type: 'day0', guide: guide?.slug ?? null })
}
