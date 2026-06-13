import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { CuponesClient, type AdminCoupon } from '@/components/admin/CuponesClient'

export const metadata: Metadata = { title: 'Cupones — Admin LIORA' }

export default async function AdminCuponesPage() {
  const admin = createAdminClient()

  const [{ data }, { data: catsData }] = await Promise.all([
    (admin as any)
      .from('coupons')
      .select('id, code, description, type, value, is_active, is_public, new_customers_only, scope, scope_category_ids, min_purchase_cents, max_uses, max_uses_per_user, used_count, starts_at, expires_at, color, created_at, audience, placements, promo_title, promo_subtitle, promo_cta')
      .order('created_at', { ascending: false }),
    admin.from('categories').select('id, name').order('sort_order'),
  ])

  const coupons: AdminCoupon[] = ((data ?? []) as any[]).map(c => ({
    id: c.id,
    code: c.code,
    description: c.description ?? null,
    type: c.type,
    value: Number(c.value),
    is_active: c.is_active,
    is_public: c.is_public ?? false,
    new_customers_only: c.new_customers_only ?? false,
    scope: c.scope ?? 'all',
    scope_category_ids: c.scope_category_ids ?? [],
    min_purchase_cents: c.min_purchase_cents ?? null,
    max_uses: c.max_uses ?? null,
    max_uses_per_user: c.max_uses_per_user ?? 1,
    used_count: c.used_count ?? 0,
    starts_at: c.starts_at ?? null,
    expires_at: c.expires_at ?? null,
    color: c.color ?? 'var(--cat-lavanda)',
    created_at: c.created_at,
    audience: c.audience ?? 'everyone',
    placements: c.placements ?? ['exit_modal'],
    promo_title: c.promo_title ?? null,
    promo_subtitle: c.promo_subtitle ?? null,
    promo_cta: c.promo_cta ?? null,
  }))

  const categories = ((catsData ?? []) as any[]).map(c => ({ id: c.id as string, name: c.name as string }))

  return <CuponesClient initialCoupons={coupons} categories={categories} />
}
