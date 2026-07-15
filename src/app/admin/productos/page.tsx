import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { ProductsClient, type AdminProductData, type AdminCategory } from '@/components/admin/ProductsClient'
import type { AdminTag } from '@/components/admin/TagsClient'

export const metadata: Metadata = { title: 'Productos — Admin LIORA' }

export default async function AdminProductsPage() {
  const admin = createAdminClient()

  const [{ data: productsRaw }, { data: categoriesRaw }, { data: tagsRaw }, { data: productTagsRaw }] = await Promise.all([
    (admin as any)
      .from('products')
      .select('id, name, slug, description, brand, category_id, cover_image_url, is_active, usage_instructions, indications, contraindications, gallery_urls, categories(id, name, slug), product_variants(id, name, sku, stock_quantity, product_prices(amount_cents, compare_at_cents, effective_to))')
      .order('created_at', { ascending: false }),
    admin.from('categories').select('id, name, slug').order('name'),
    (admin as any).from('tags').select('id, name, slug, group, is_internal').order('group').order('name'),
    (admin as any).from('product_tags').select('product_id, tag_id'),
  ])

  const categories: AdminCategory[] = (categoriesRaw ?? []) as AdminCategory[]
  const tags: AdminTag[] = ((tagsRaw ?? []) as AdminTag[]).map(t => ({ ...t, product_count: 0 }))

  // Build product_id → tag_id[] map
  const productTagMap: Record<string, string[]> = {}
  for (const row of (productTagsRaw ?? []) as Array<{ product_id: string; tag_id: string }>) {
    if (!productTagMap[row.product_id]) productTagMap[row.product_id] = []
    productTagMap[row.product_id].push(row.tag_id)
  }

  const products: AdminProductData[] = ((productsRaw ?? []) as any[]).map(p => {
    const firstVariant = p.product_variants?.[0] ?? null
    const activePrice = firstVariant?.product_prices?.find((pp: any) => !pp.effective_to) ?? firstVariant?.product_prices?.[0] ?? null
    return {
      id: p.id, name: p.name, slug: p.slug,
      description: p.description ?? null, brand: p.brand ?? null,
      category_id: p.category_id ?? null, cover_image_url: p.cover_image_url ?? null,
      is_active: p.is_active, stock_quantity: firstVariant?.stock_quantity ?? null,
      usage_instructions: p.usage_instructions ?? null,
      indications: p.indications ?? null,
      contraindications: p.contraindications ?? null,
      gallery_urls: p.gallery_urls ?? [],
      category: p.categories ? { name: p.categories.name, slug: p.categories.slug } : null,
      variant_id: firstVariant?.id ?? null, variant_name: firstVariant?.name ?? null,
      sku: firstVariant?.sku ?? null,
      price_cents: activePrice?.amount_cents ?? null,
      compare_at_cents: activePrice?.compare_at_cents ?? null,
      tag_ids: productTagMap[p.id] ?? [],
    }
  })

  return <ProductsClient products={products} categories={categories} tags={tags} />
}
