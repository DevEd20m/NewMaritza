import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get('placement') ?? 'exit_modal'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  const audienceFilter: Array<'everyone' | 'logged_in' | 'logged_out'> = user
    ? ['everyone', 'logged_in']
    : ['everyone', 'logged_out']

  const admin = createAdminClient()
  const { data: candidates } = await admin
    .from('coupons')
    .select('code, type, value, description, new_customers_only, audience, promo_title, promo_subtitle, promo_cta, max_uses, used_count')
    .eq('is_active', true)
    .eq('is_public', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .or('starts_at.is.null,starts_at.lte.now()')
    .in('audience', audienceFilter)
    .contains('placements', [placement])
    .order('created_at', { ascending: false })
    .limit(5)

  // PostgREST no compara columnas entre sí: el agotamiento se filtra aquí
  const data = (candidates ?? []).find(
    (c) => c.max_uses === null || (c.used_count ?? 0) < c.max_uses
  )

  if (!data) return NextResponse.json(null)

  const discountText =
    data.type === 'percentage' ? `${data.value}% OFF` :
    data.type === 'fixed_amount' ? `S/${data.value} OFF` :
    'Envío gratis'

  const replace = (s: string | null) => s?.replace(/\{discount\}/g, discountText) ?? null

  return NextResponse.json({
    code: data.code,
    discountText,
    description: data.description,
    newCustomersOnly: data.new_customers_only,
    isLoggedIn: !!user,
    promoTitle: replace(data.promo_title),
    promoSubtitle: replace(data.promo_subtitle),
    promoCta: replace(data.promo_cta),
  })
}
