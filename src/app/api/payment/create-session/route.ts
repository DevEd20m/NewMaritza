import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider } from '@/lib/payment/provider'
import { z } from 'zod'
import { CHECKOUT_COOKIE, verifyOpaqueToken } from '@/lib/security/tokens'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'

const schema = z.object({ orderId: z.string().uuid() })

export async function POST(request: NextRequest) {
  try {
    if (!await consumeRateLimit('payment-session', requestIp(request), 5, 60)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
    }
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })

    const { orderId } = parsed.data
    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    interface OrderForPayment {
      id: string; order_number: string; total_cents: number; currency: string
      status: string; guest_email: string | null; guest_name: string | null
      user_id: string | null; checkout_token_hash: string | null
      reservation_expires_at: string | null
    }
    const { data: orderRaw } = await admin
      .from('orders')
      .select('id, order_number, total_cents, currency, status, guest_email, guest_name, user_id, checkout_token_hash, reservation_expires_at')
      .eq('id', orderId)
      .single()
    const order = orderRaw as OrderForPayment | null

    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    if (order.status !== 'pending_payment') return NextResponse.json({ error: 'Pedido ya procesado' }, { status: 400 })

    // Ownership: an authenticated customer owns the order; guests prove possession
    // with the short-lived HttpOnly capability cookie set by /api/checkout.
    if (order.user_id) {
      if (!user || user.id !== order.user_id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    } else {
      const checkoutToken = request.cookies.get(CHECKOUT_COOKIE)?.value ?? ''
      if (!verifyOpaqueToken(checkoutToken, order.checkout_token_hash)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    if (!order.reservation_expires_at || new Date(order.reservation_expires_at) <= new Date()) {
      await admin.rpc('release_order_inventory', {
        p_order_id: order.id,
        p_reason: 'session_requested_after_expiry',
        p_expired: true,
      })
      await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      return NextResponse.json({ error: 'La reserva expiró. Vuelve a confirmar tu carrito.' }, { status: 409 })
    }

    const customerEmail = user?.email ?? order.guest_email ?? ''
    const customerName = order.guest_name ?? user?.email ?? 'Cliente LIORA'

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const provider = getPaymentProvider('stripe')

    const session = await provider.createSession({
      orderId: order.id,
      orderNumber: order.order_number,
      amountCents: order.total_cents,
      currency: order.currency.toLowerCase(),
      customerEmail,
      customerName,
      successUrl: `${siteUrl}/confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${siteUrl}/carrito`,
      // Stripe's minimum and the inventory reservation are both 30 minutes.
      // If network timing makes Stripe complete after a release, finalization
      // performs the required atomic re-reservation or moves to payment_review.
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })

    // Store provider reference on payment record
    await admin
      .from('payments')
      .update({ provider_reference: session.providerReference })
      .eq('order_id', orderId)
      .eq('status', 'pending')

    return NextResponse.json({ redirectUrl: session.redirectUrl, sessionId: session.sessionId })
  } catch (err) {
    console.error('[create-session]', err)
    return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 500 })
  }
}
