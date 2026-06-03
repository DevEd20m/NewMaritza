import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL } from '@/lib/email/client'
import { orderGuideEmail } from '@/lib/email/templates/order-guide'
import { weekCheckinEmail } from '@/lib/email/templates/week-checkin'
import { detectKitFromItems, getGuideBySlug } from '@/lib/guides'

const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
const WA_NUMBER    = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '51999999999'

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

  // Get customer email (guest or authenticated)
  let toEmail: string | null = (order as any).guest_email ?? null
  let customerName: string | null = (order as any).guest_name ?? null

  if (!toEmail && (order as any).user_id) {
    const { data: { user } } = await admin.auth.admin.getUserById((order as any).user_id)
    toEmail = user?.email ?? null
    const { data: profile } = await admin.from('profiles').select('first_name').eq('id', (order as any).user_id).single()
    customerName = (profile as any)?.first_name ?? null
  }

  if (!toEmail) return NextResponse.json({ error: 'No email address for order' }, { status: 422 })

  // Detect kit guide from order items
  const productNames = ((order as any).order_items ?? []).map((i: any) => i.product_name_snapshot as string)
  const guide = detectKitFromItems(productNames)

  if (!guide) return NextResponse.json({ skipped: true, reason: 'no matching kit guide' })

  const guideUrl  = `${SITE_URL}/guia/${guide.slug}`
  const waMessage = `Hola, tengo preguntas sobre mi ${guide.kitName} (pedido #${(order as any).order_number})`
  const waUrl     = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`

  const html = type === 'day7'
    ? weekCheckinEmail({ orderNumber: (order as any).order_number, customerName: customerName ?? undefined, guide, guideUrl, whatsappUrl: waUrl })
    : orderGuideEmail({ orderNumber: (order as any).order_number, customerName: customerName ?? undefined, guide, guideUrl, whatsappUrl: waUrl })

  const subject = type === 'day7'
    ? `¿Cómo van tus primeros 7 días con ${guide.kitName}? 🌱`
    : `Tu guía de uso del ${guide.kitName} — LIORA 🌿`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html,
  })

  if (error) {
    console.error('[email/send-guide] Resend error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ sent: true, to: toEmail, guide: guide.slug, type })
}
