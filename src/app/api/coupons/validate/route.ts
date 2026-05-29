import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { couponValidateSchema } from '@/lib/validation/checkout'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = couponValidateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ valid: false, message: 'Datos inválidos' }, { status: 400 })

    const { code, cartTotalCents, cartVariantIds } = parsed.data
    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: coupon } = await (admin as any)
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (!coupon) return NextResponse.json({ valid: false, message: 'Cupón no encontrado o inactivo' })

    const now = new Date()
    if (coupon.starts_at && new Date(coupon.starts_at) > now)
      return NextResponse.json({ valid: false, message: 'Cupón aún no válido' })
    if (coupon.expires_at && new Date(coupon.expires_at) < now)
      return NextResponse.json({ valid: false, message: 'Cupón expirado' })
    if (coupon.max_uses !== null && (coupon.used_count ?? 0) >= coupon.max_uses)
      return NextResponse.json({ valid: false, message: 'Cupón agotado' })
    if (coupon.min_purchase_cents && cartTotalCents < coupon.min_purchase_cents) {
      const min = (coupon.min_purchase_cents / 100).toFixed(0)
      return NextResponse.json({ valid: false, message: `Monto mínimo S/${min}` })
    }

    // Solo primera compra
    if (coupon.new_customers_only) {
      if (!user) {
        return NextResponse.json({ valid: false, message: 'Este cupón es solo para nuevas clientas. Inicia sesión primero.' })
      }
      const { count } = await admin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['paid', 'processing', 'shipped', 'delivered'])
      if ((count ?? 0) > 0) {
        return NextResponse.json({ valid: false, message: 'Este cupón es solo para tu primera compra.' })
      }
    }

    // Límite de usos por cliente
    if (user) {
      const limit = coupon.max_uses_per_user ?? 1
      const { count } = await (admin as any)
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('coupon_id', coupon.id)
        .not('status', 'eq', 'cancelled')
      if ((count ?? 0) >= limit) {
        return NextResponse.json({ valid: false, message: 'Ya usaste este cupón.' })
      }
    }

    // Scope por categoría
    if (coupon.scope === 'category' && coupon.scope_category_ids?.length > 0) {
      const variantIds = cartVariantIds ?? []
      if (variantIds.length === 0) {
        return NextResponse.json({ valid: false, message: 'Este cupón aplica solo a categorías específicas.' })
      }
      const { data: variants } = await admin
        .from('product_variants')
        .select('product_id')
        .in('id', variantIds)
      const productIds = (variants ?? []).map((v: any) => v.product_id)
      const { data: products } = await admin
        .from('products')
        .select('category_id')
        .in('id', productIds)
      const cartCategoryIds = [...new Set((products ?? []).map((p: any) => p.category_id).filter(Boolean))]
      const scopeIds: string[] = coupon.scope_category_ids
      const hasMatch = cartCategoryIds.some((id) => scopeIds.includes(id as string))
      if (!hasMatch) {
        return NextResponse.json({ valid: false, message: 'Este cupón aplica solo a productos de categorías específicas.' })
      }
    }

    // Calcular descuento
    let discountCents = 0
    if (coupon.type === 'percentage') {
      discountCents = Math.round(cartTotalCents * (Number(coupon.value) / 100))
    } else if (coupon.type === 'fixed_amount') {
      discountCents = Math.min(Math.round(Number(coupon.value) * 100), cartTotalCents)
    } else if (coupon.type === 'free_shipping') {
      discountCents = 1500
    }

    return NextResponse.json({ valid: true, code: coupon.code, discountCents, type: coupon.type })
  } catch (err) {
    console.error('[coupons/validate]', err)
    return NextResponse.json({ valid: false, message: 'Error interno' }, { status: 500 })
  }
}
