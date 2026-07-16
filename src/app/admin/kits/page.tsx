import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { KitsClient, type AdminKitData, type AdminVariantOption } from '@/components/admin/KitsClient'

export const metadata: Metadata = { title: 'Kits — Admin LIORA' }

export default async function AdminKitsPage() {
  const admin = createAdminClient()

  const [kitsResult, variantsResult] = await Promise.all([
    (admin as any)
      .from('kits')
      .select(`
        id, name, slug, description, is_active, type, cover_image_url, show_in_home, home_sort_order, benefits,
        kit_products(
          variant_id, quantity, sort_order, step_label, step_when, step_instruction,
          product_variants(id, name, product_prices(amount_cents, effective_to))
        )
      `)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false }),

    (admin as any)
      .from('product_variants')
      .select('id, name, product_id, is_active, products(id, name), product_prices(amount_cents, effective_to)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  type RawKit = {
    id: string; name: string; slug: string; description: string | null; is_active: boolean; type: string
    cover_image_url: string | null; show_in_home: boolean; home_sort_order: number; benefits: unknown[]
    kit_products: Array<{
      variant_id: string; quantity: number; sort_order: number
      step_label: string | null; step_when: string | null; step_instruction: string | null
      product_variants: { id: string; name: string; product_prices: Array<{ amount_cents: number; effective_to: string | null }> } | null
    }>
  }

  type RawVariant = {
    id: string; name: string; product_id: string; is_active: boolean
    products: { id: string; name: string } | null
    product_prices: Array<{ amount_cents: number; effective_to: string | null }>
  }

  const rawKits = (kitsResult.data ?? []) as RawKit[]
  const rawVariants = (variantsResult.data ?? []) as RawVariant[]

  const kits: AdminKitData[] = rawKits.map(k => {
    const kitProducts = (k.kit_products ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(kp => {
        const variant = kp.product_variants
        const price = variant?.product_prices?.find(p => !p.effective_to)
        return {
          variantId: kp.variant_id,
          variantName: variant?.name ?? '',
          productName: '', // We need to look up the product from allVariants
          priceCents: price?.amount_cents ?? 0,
          stepLabel: kp.step_label ?? null,
          stepWhen: kp.step_when ?? null,
          stepInstruction: kp.step_instruction ?? null,
        }
      })

    const totalCents = kitProducts.reduce((s, kp) => s + kp.priceCents, 0)

    return {
      id: k.id,
      name: k.name,
      slug: k.slug,
      description: k.description,
      is_active: k.is_active,
      type: k.type,
      cover_image_url: k.cover_image_url,
      show_in_home: k.show_in_home,
      home_sort_order: k.home_sort_order,
      benefits: (k.benefits ?? []) as import('@/lib/kit-benefits').KitBenefit[],
      kitProducts,
      totalCents,
    }
  })

  const variantMap = new Map<string, RawVariant>()
  rawVariants.forEach(v => variantMap.set(v.id, v))

  // Fill in product names from variantMap
  kits.forEach(k => {
    k.kitProducts.forEach(kp => {
      const v = variantMap.get(kp.variantId)
      if (v) {
        kp.productName = v.products?.name ?? kp.variantName
        if (!kp.priceCents) {
          const price = v.product_prices?.find(p => !p.effective_to)
          kp.priceCents = price?.amount_cents ?? 0
        }
      } else {
        kp.productName = kp.variantName
      }
    })
    k.totalCents = k.kitProducts.reduce((s, kp) => s + kp.priceCents, 0)
  })

  const allVariants: AdminVariantOption[] = rawVariants.map(v => {
    const price = v.product_prices?.find(p => !p.effective_to)
    return {
      variantId: v.id,
      variantName: v.name,
      productId: v.product_id,
      productName: v.products?.name ?? v.name,
      priceCents: price?.amount_cents ?? 0,
      categoryName: null,
    }
  })

  return <KitsClient kits={kits} allVariants={allVariants} />
}
