import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('coupons')
    .select('code, type, value, description')
    .eq('is_active', true)
    .eq('is_public', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return NextResponse.json(null)

  const discountText =
    data.type === 'percentage' ? `${data.value}% OFF` :
    data.type === 'fixed_amount' ? `S/${data.value} OFF` :
    'Envío gratis'

  return NextResponse.json({ code: data.code, discountText, description: data.description })
}
