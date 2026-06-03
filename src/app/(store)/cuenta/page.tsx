import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AccountClient, type AccountData } from '@/components/account/AccountClient'

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false, follow: false } }

const CAT_COLORS: Record<string, string> = {
  organicos: 'var(--cat-menta)',
  gym: 'var(--cat-coral)',
  'skin-care': 'var(--cat-lavanda)',
  vitaminas: 'var(--cat-mostaza)',
}

function memberSinceLabel(createdAt: string): string {
  const months = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
  if (months < 1) return 'Miembro nuevo'
  if (months < 12) return `Miembro · ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `Miembro · ${years} ${years === 1 ? 'año' : 'años'}`
}

export default async function AccountPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, quiz_profile_id, created_at')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { first_name: string | null; last_name: string | null; phone: string | null; quiz_profile_id: string | null; created_at: string } | null

  // Orders
  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('id, order_number, total_cents, status, created_at, order_items(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  const ordersData = (ordersRaw ?? []) as Array<{ id: string; order_number: string; total_cents: number; status: string; created_at: string; order_items: { id: string }[] }>

  // Active public coupons only
  const { data: couponsRaw } = await (admin as any)
    .from('coupons')
    .select('id, code, type, value, expires_at')
    .eq('is_active', true)
    .eq('is_public', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(6)
  const coupons = (couponsRaw ?? []) as Array<{ id: string; code: string; type: string; value: number; expires_at: string | null }>

  // Default address
  const { data: addressRaw } = await supabase
    .from('addresses')
    .select('id, first_name, last_name, address_line1, address_line2, district, city, state, postal_code, country, is_default')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .limit(1)
    .single()
  const address = addressRaw as AccountData['address'] | null

  // Kit items from last quiz profile
  const kitProfileId = profile?.quiz_profile_id ?? null
  let kitItems: AccountData['kitItems'] = []
  let kitTitle = ''

  if (kitProfileId) {
    const { data: recsRaw } = await admin
      .from('recommendations')
      .select('variant_id, score, rationale')
      .eq('quiz_profile_id', kitProfileId)
      .eq('rationale', 'suggestion')
      .order('score', { ascending: false })
      .limit(6)

    const variantIds = (recsRaw ?? []).map((r) => (r as { variant_id: string }).variant_id)

    if (variantIds.length > 0) {
      const { data: variantsRaw } = await (admin as any)
        .from('product_variants')
        .select('id, name, product_id, product_prices(amount_cents, effective_to)')
        .in('id', variantIds)
      const variants = (variantsRaw ?? []) as Array<{ id: string; name: string; product_id: string; product_prices: Array<{ amount_cents: number; effective_to: string | null }> }>

      const productIds = [...new Set(variants.map((v) => v.product_id))]
      const { data: productsRaw } = await admin
        .from('products')
        .select('id, name, cover_image_url, category_id')
        .in('id', productIds)
      const products = (productsRaw ?? []) as Array<{ id: string; name: string; cover_image_url: string | null; category_id: string | null }>

      const categoryIds = [...new Set(products.map((p) => p.category_id).filter(Boolean))] as string[]
      const { data: catsRaw } = await admin
        .from('categories')
        .select('id, name, slug')
        .in('id', categoryIds)
      const cats = (catsRaw ?? []) as Array<{ id: string; name: string; slug: string }>
      const catMap = Object.fromEntries(cats.map((c) => [c.id, c]))

      kitItems = variantIds
        .map((vid) => {
          const v = variants.find((x) => x.id === vid)
          if (!v) return null
          const p = products.find((x) => x.id === v.product_id)
          if (!p) return null
          const cat = p.category_id ? catMap[p.category_id] : null
          const activePrice = v.product_prices?.find(pp => !pp.effective_to)
          return {
            variantId: v.id,
            name: p.name,
            variantName: v.name,
            categoryName: cat?.name ?? '',
            categoryColor: cat ? (CAT_COLORS[cat.slug] ?? 'var(--cat-lavanda)') : 'var(--cat-lavanda)',
            imageUrl: p.cover_image_url,
            priceCents: activePrice?.amount_cents ?? 0,
          }
        })
        .filter(Boolean) as AccountData['kitItems']

      const uniqueCats = [...new Set(kitItems.map((i) => i.categoryName).filter(Boolean))]
      kitTitle = uniqueCats.slice(0, 2).join(' + ') || 'Mi kit'
    }
  }

  const firstName = profile?.first_name ?? user.email?.split('@')[0] ?? 'Usuaria'
  const lastName = profile?.last_name ?? null

  const data: AccountData = {
    firstName,
    lastName,
    email: user.email ?? '',
    memberSince: profile?.created_at ? memberSinceLabel(profile.created_at) : 'Miembro',
    avatarInitial: firstName.charAt(0).toUpperCase(),
    orders: ordersData.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      total_cents: o.total_cents,
      status: o.status,
      created_at: o.created_at,
      item_count: o.order_items?.length ?? 0,
    })),
    kitItems,
    kitTitle,
    kitProfileId,
    coupons,
    address: address ?? null,
    phone: profile?.phone ?? null,
  }

  return <AccountClient data={data} />
}
