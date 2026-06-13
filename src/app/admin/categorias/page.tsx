import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { CategoriasClient, type AdminCategory } from '@/components/admin/CategoriasClient'

export const metadata: Metadata = { title: 'Categorías — Admin LIORA' }

async function getCategories(): Promise<AdminCategory[]> {
  const admin = createAdminClient()
  const { data: categories } = await (admin as any)
    .from('categories')
    .select('id, name, slug, parent_id, sort_order, created_at, show_in_hero, hero_sort_order, hero_tagline, color, image_url')
    .order('sort_order')
    .order('name')

  const { data: products } = await admin
    .from('products')
    .select('category_id')
    .eq('is_active', true)

  const countMap: Record<string, number> = {}
  for (const p of (products ?? []) as Array<{ category_id: string | null }>) {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1
  }

  return ((categories ?? []) as AdminCategory[]).map(c => ({ ...c, product_count: countMap[c.id] ?? 0 }))
}

export default async function CategoriasPage() {
  const categories = await getCategories()
  return <CategoriasClient initialCategories={categories} />
}
