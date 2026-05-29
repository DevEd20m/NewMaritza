import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createOrderSchema } from '@/lib/validation/checkout'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { cartSessionToken, address, couponCode, notes } = parsed.data
    const saveToProfile = body.saveToProfile === true
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Resolve coupon
    let couponId: string | null = null
    let discountCents = 0
    if (couponCode) {
      const { data: coupon } = await admin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()
      if (coupon) {
        couponId = coupon.id
      }
    }

    // Snapshot cart items from the store (sent from frontend via cart session)
    const cartItems = body.items as Array<{
      variantId: string; name: string; variantName: string; priceCents: number; currency: string; quantity: number
    }>

    if (!cartItems?.length) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    const subtotalCents = cartItems.reduce((s: number, i) => s + i.priceCents * i.quantity, 0)
    const shippingCents = subtotalCents >= 15000 ? 0 : 1500
    const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents

    // Save address
    let shippingAddressId: string | null = null
    const { data: savedAddress } = await admin.from('addresses').insert({
      user_id: user?.id ?? null,
      first_name: address.firstName,
      last_name: address.lastName,
      phone: address.phone ?? null,
      address_line1: address.addressLine1,
      address_line2: address.addressLine2 ?? null,
      district: address.district ?? null,
      city: address.city,
      country: address.country ?? 'PE',
      postal_code: address.postalCode ?? null,
    }).select('id').single()
    if (savedAddress) shippingAddressId = savedAddress.id

    // Resolve email for logged-in users
    let orderEmail: string | null = null
    if (user) {
      orderEmail = user.email ?? null
    } else {
      orderEmail = (address as any).email ?? null
    }

    // Create order — always store name/email/phone for admin visibility
    const { data: order, error: orderError } = await admin.from('orders').insert({
      user_id: user?.id ?? null,
      guest_email: orderEmail,
      guest_name: `${address.firstName} ${address.lastName}`.trim(),
      guest_phone: address.phone ?? null,
      shipping_address_id: shippingAddressId,
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      tax_cents: 0,
      total_cents: totalCents,
      currency: 'PEN',
      coupon_id: couponId,
      notes: notes ?? null,
      status: 'pending_payment',
    }).select('id, order_number').single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    }

    // Insert order items
    await admin.from('order_items').insert(
      cartItems.map((item) => ({
        order_id: order.id,
        variant_id: item.variantId,
        product_name_snapshot: item.name,
        variant_name_snapshot: item.variantName,
        quantity: item.quantity,
        unit_price_cents: item.priceCents,
        currency: item.currency,
      }))
    )

    // Save data to user profile if requested
    if (saveToProfile && user) {
      await Promise.all([
        admin.from('profiles').update({
          first_name: address.firstName,
          last_name: address.lastName,
          phone: address.phone ?? null,
        }).eq('id', user.id),
        // Unset previous defaults then upsert this address as default
        admin.from('addresses').update({ is_default: false }).eq('user_id', user.id),
        shippingAddressId
          ? admin.from('addresses').update({ is_default: true, user_id: user.id }).eq('id', shippingAddressId)
          : Promise.resolve(),
      ])
    }

    // Create pending payment record
    const idempotencyKey = `order_${order.id}_${Date.now()}`
    await admin.from('payments').insert({
      order_id: order.id,
      provider: 'stripe',
      status: 'pending',
      amount_cents: totalCents,
      currency: 'PEN',
      idempotency_key: idempotencyKey,
    })

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, totalCents })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
