import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { couponValidateSchema } from '@/lib/validation/checkout'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = couponValidateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ valid: false, message: 'Datos inválidos' }, { status: 400 })

    const { code, cartTotalCents } = parsed.data
    const admin = createAdminClient()

    const { data: coupon } = await admin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (!coupon) return NextResponse.json({ valid: false, message: 'Cupón no encontrado o inactivo' })

    const now = new Date()
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ valid: false, message: 'Cupón aún no válido' })
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({ valid: false, message: 'Cupón expirado' })
    }
    if (coupon.min_purchase_cents && cartTotalCents < coupon.min_purchase_cents) {
      const min = (coupon.min_purchase_cents / 100).toFixed(0)
      return NextResponse.json({ valid: false, message: `Monto mínimo S/${min}` })
    }

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
