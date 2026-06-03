import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { ProductsClient, type AdminProductData, type AdminCategory } from '@/components/admin/ProductsClient'

export const metadata: Metadata = { title: 'Productos — Admin LIORA' }

export default async function AdminProductsPage() {
  const admin = createAdminClient()

  const [{ data: productsRaw }, { data: categoriesRaw }] = await Promise.all([
    (admin as any)
      .from('products')
      .select('id, name, slug, description, brand, category_id, cover_image_url, is_active, stock_quantity, categories(id, name, slug), product_variants(id, name, sku, product_prices(amount_cents, compare_at_cents, effective_to))')
      .order('created_at', { ascending: false }),
    admin.from('categories').select('id, name, slug').order('name'),
  ])

  const categories: AdminCategory[] = (categoriesRaw ?? []) as AdminCategory[]

  const products: AdminProductData[] = ((productsRaw ?? []) as any[]).map(p => {
    const firstVariant = p.product_variants?.[0] ?? null
    const activePrice = firstVariant?.product_prices?.find((pp: any) => !pp.effective_to) ?? firstVariant?.product_prices?.[0] ?? null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? null,
      brand: p.brand ?? null,
      category_id: p.category_id ?? null,
      cover_image_url: p.cover_image_url ?? null,
      is_active: p.is_active,
      stock_quantity: p.stock_quantity ?? null,
      category: p.categories ? { name: p.categories.name, slug: p.categories.slug } : null,
      variant_id: firstVariant?.id ?? null,
      variant_name: firstVariant?.name ?? null,
      sku: firstVariant?.sku ?? null,
      price_cents: activePrice?.amount_cents ?? null,
      compare_at_cents: activePrice?.compare_at_cents ?? null,
    }
  })

  return <ProductsClient products={products} categories={categories} />
}
