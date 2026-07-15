import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createOrderSchema } from '@/lib/validation/checkout'
import { getStoreSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { address, couponCode, notes } = parsed.data
    const saveToProfile = body.saveToProfile === true
    const quizProfileId: string | null = typeof body.quizProfileId === 'string' ? body.quizProfileId : null
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    const orderEmail: string | null = user ? (user.email ?? null) : address.email

    // Validate cart items — NUNCA confiar en el precio enviado por el cliente
    const rawItems = body.items as Array<{ variantId: string; quantity: number }>
    if (!rawItems?.length) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    const MAX_QTY_PER_LINE = 20
    // Consolidar cantidades por variante y sanear
    const qtyByVariant = new Map<string, number>()
    for (const it of rawItems) {
      if (typeof it?.variantId !== 'string') continue
      const q = Math.floor(Number(it.quantity))
      if (!Number.isFinite(q) || q <= 0) continue
      qtyByVariant.set(it.variantId, (qtyByVariant.get(it.variantId) ?? 0) + q)
    }
    if (qtyByVariant.size === 0) {
      return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 })
    }

    // Traer variantes activas (de productos activos) con su precio vigente
    const { data: dbVariants } = await (admin as any)
      .from('product_variants')
      .select('id, name, is_active, stock_quantity, products!inner(name, is_active), product_prices(amount_cents, currency, effective_to)')
      .in('id', [...qtyByVariant.keys()])

    const cartItems: Array<{
      variantId: string; name: string; variantName: string; priceCents: number; currency: string; quantity: number
    }> = []

    for (const [variantId, requestedQty] of qtyByVariant) {
      const v = (dbVariants ?? []).find((x: any) => x.id === variantId) as any
      if (!v || !v.is_active || !v.products?.is_active) {
        return NextResponse.json({ error: 'Uno de los productos ya no está disponible' }, { status: 400 })
      }
      const priceRow = (v.product_prices ?? []).find((p: any) => p.effective_to === null) ?? (v.product_prices ?? [])[0]
      if (!priceRow) {
        return NextResponse.json({ error: 'Uno de los productos no tiene precio disponible' }, { status: 400 })
      }
      const quantity = Math.min(requestedQty, MAX_QTY_PER_LINE)
      if (v.stock_quantity !== null && v.stock_quantity < quantity) {
        return NextResponse.json({ error: `Stock insuficiente para ${v.products.name}` }, { status: 400 })
      }
      cartItems.push({
        variantId,
        name: v.products.name,
        variantName: v.name,
        priceCents: priceRow.amount_cents,
        currency: priceRow.currency,
        quantity,
      })
    }

    const subtotalCents = cartItems.reduce((s: number, i) => s + i.priceCents * i.quantity, 0)
    const { free_shipping_threshold_cents, shipping_cost_cents } = await getStoreSettings()
    let shippingCents = subtotalCents >= free_shipping_threshold_cents ? 0 : shipping_cost_cents

    // Resolve and re-validate coupon
    let couponId: string | null = null
    let discountCents = 0
    let couponFreeShipping = false

    if (couponCode) {
      const { data: coupon } = await admin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (coupon) {
        const now = new Date()
        const basicValid =
          (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
          (!coupon.expires_at || new Date(coupon.expires_at) > now) &&
          (coupon.max_uses === null || (coupon.used_count ?? 0) < coupon.max_uses) &&
          (!coupon.min_purchase_cents || subtotalCents >= coupon.min_purchase_cents)

        if (basicValid) {
          couponId = coupon.id

          // Solo primera compra: para invitados se verifica por guest_email
          if (coupon.new_customers_only) {
            let query = admin
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .in('status', ['paid', 'processing', 'shipped', 'delivered'])
            query = user ? query.eq('user_id', user.id) : query.eq('guest_email', orderEmail ?? '')
            const { count } = await query
            if ((count ?? 0) > 0) couponId = null
          }

          // Límite por cliente (por user_id o guest_email): cuenta órdenes pagadas/en
          // proceso y pending_payment solo de las últimas 24h (una orden abandonada
          // no bloquea el cupón para siempre)
          if (couponId) {
            const limit = coupon.max_uses_per_user ?? 1
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            let query = admin
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('coupon_id', coupon.id)
              .or(`status.in.(paid,processing,shipped,delivered),and(status.eq.pending_payment,created_at.gt.${cutoff})`)
            query = user ? query.eq('user_id', user.id) : query.eq('guest_email', orderEmail ?? '')
            const { count } = await query
            if ((count ?? 0) >= limit) couponId = null
          }

          // Calcular descuento
          if (couponId) {
            if (coupon.type === 'percentage') {
              discountCents = Math.round(subtotalCents * (Number(coupon.value) / 100))
            } else if (coupon.type === 'fixed_amount') {
              discountCents = Math.min(Math.round(Number(coupon.value) * 100), subtotalCents)
            } else if (coupon.type === 'free_shipping') {
              couponFreeShipping = true
              discountCents = shippingCents
              shippingCents = 0
            }
          }
        }
      }
    }

    const totalCents = Math.max(0, subtotalCents - (couponFreeShipping ? 0 : discountCents)) + shippingCents

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

    // Validate quizProfileId if provided
    let validatedQuizProfileId: string | null = null
    if (quizProfileId) {
      const { data: qp } = await (admin as any)
        .from('quiz_profiles')
        .select('id')
        .eq('id', quizProfileId)
        .maybeSingle()
      if (qp) validatedQuizProfileId = quizProfileId
    }

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
      quiz_profile_id: validatedQuizProfileId,
    } as any).select('id, order_number').single()

    if (orderError || !order) {
      console.error('[checkout] error al insertar orden', orderError)
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    }

    const { error: itemsError } = await admin.from('order_items').insert(
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

    if (itemsError) {
      // No dejar una orden cobrable sin líneas: revertir.
      console.error('[checkout] error al insertar order_items', itemsError)
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    }

    if (saveToProfile && user) {
      await Promise.all([
        admin.from('profiles').update({
          first_name: address.firstName,
          last_name: address.lastName,
          phone: address.phone ?? null,
        }).eq('id', user.id),
        admin.from('addresses').update({ is_default: false }).eq('user_id', user.id),
        shippingAddressId
          ? admin.from('addresses').update({ is_default: true, user_id: user.id }).eq('id', shippingAddressId)
          : Promise.resolve(),
      ])
    }

    const idempotencyKey = `order_${order.id}`
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
