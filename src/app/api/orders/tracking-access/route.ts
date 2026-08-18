import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'
import { createOpaqueToken, hashOpaqueToken } from '@/lib/security/tokens'

const schema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(320),
})

export async function POST(request: NextRequest) {
  if (!await consumeRateLimit('tracking-access', requestIp(request), 8, 15 * 60)) {
    return NextResponse.json({ ok: true })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: true })

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('id')
    .eq('order_number', parsed.data.orderNumber)
    .ilike('guest_email', parsed.data.email)
    .maybeSingle()

  const response = NextResponse.json({ ok: true })
  if (!order) return response

  const token = createOpaqueToken()
  await admin.from('orders')
    .update({ tracking_token_hash: hashOpaqueToken(token) })
    .eq('id', order.id)

  response.cookies.set('liora_tracking', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/tracking',
    maxAge: 30 * 24 * 60 * 60,
  })
  return response
}
