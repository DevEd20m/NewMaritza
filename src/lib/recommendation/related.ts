import type { createAdminClient } from '@/lib/supabase/admin'
import { ingredientTokens } from './ai-routine'

// Sugerencias determinísticas (sin IA) compartidas por el motor del quiz,
// el endpoint /api/related y las secciones de cross-sell del sitio.

type AdminClient = ReturnType<typeof createAdminClient>

export const CAT_COLORS: Record<string, string> = {
  piel:          'var(--cat-coral)',
  solar:         'var(--cat-mostaza)',
  bienestar:     'var(--cat-lavanda)',
  gym:           'var(--cat-durazno)',
  viaje:         'var(--cat-cielo)',
  hogar:         'var(--cat-rosa)',
  digestivo:     'var(--cat-menta)',
  'pies-cuerpo': 'var(--cat-durazno)',
}

export interface CatalogItem {
  variantId: string
  productId: string
  name: string
  brand: string | null
  variantName: string
  categoryName: string
  categorySlug: string
  priceCents: number
  currency: string
  imageUrl: string | null
  categoryColor: string
  productSlug: string
  stockQuantity: number | null
  description: string | null
  usageInstructions: string | null
  indications: string | null
  stepLabel?: string | null
  stepWhen?: string | null
  stepInstruction?: string | null
}

// Catálogo activo completo con precio vigente (extraído de kit/recommend).
export async function loadCatalog(admin: AdminClient): Promise<CatalogItem[]> {
  const [{ data: products }, { data: categories }, { data: variants }, { data: prices }] = await Promise.all([
    admin.from('products').select('id, name, slug, brand, cover_image_url, category_id, description, usage_instructions, indications').eq('is_active', true),
    admin.from('categories').select('id, name, slug'),
    admin.from('product_variants').select('id, product_id, name, stock_quantity').eq('is_active', true),
    admin.from('product_prices').select('variant_id, amount_cents, currency, effective_to').is('effective_to', null),
  ])

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]))
  const priceMap = new Map((prices ?? []).map((p) => [p.variant_id, p]))
  const productMap = new Map((products ?? []).map((p) => [p.id, p]))

  const catalog: CatalogItem[] = []
  for (const v of (variants ?? [])) {
    if (v.stock_quantity === 0) continue
    const price = priceMap.get(v.id)
    if (!price) continue
    const product = productMap.get(v.product_id)
    if (!product) continue
    const cat = catMap[product.category_id ?? '']
    catalog.push({
      variantId: v.id,
      productId: product.id,
      name: product.name,
      brand: (product as { brand?: string | null }).brand ?? null,
      variantName: v.name,
      categoryName: cat?.name ?? '',
      categorySlug: cat?.slug ?? '',
      priceCents: price.amount_cents,
      currency: price.currency,
      imageUrl: product.cover_image_url,
      categoryColor: cat ? (CAT_COLORS[cat.slug] ?? 'var(--cat-lavanda)') : 'var(--cat-lavanda)',
      productSlug: product.slug,
      stockQuantity: v.stock_quantity,
      description: product.description,
      usageInstructions: product.usage_instructions,
      indications: product.indications,
    })
  }
  return catalog
}

// Identidad de producto = nombre + marca (hay productos con el mismo nombre
// en marcas distintas y ambos son válidos)
const identity = (item: Pick<CatalogItem, 'name' | 'brand'>) =>
  `${item.name} · ${item.brand ?? ''}`.trim().toLowerCase()

export interface BuildSuggestionsInput {
  catalog: CatalogItem[]
  // Productos ya presentes (kit o carrito): se excluyen y sus ingredientes no se repiten
  exclude: Pick<CatalogItem, 'productId' | 'name' | 'brand'>[]
  // Categorías afines en orden de prioridad
  preferredCategories: string[]
  limit?: number
  maxPerCategory?: number
  // En rutinas/carrito no se repite el mismo activo; en "productos similares"
  // de la página de producto sí tiene sentido ofrecer otra marca o variante.
  dedupeIngredients?: boolean
}

// Filler determinístico (extraído de kit/recommend): máximo N por categoría
// para variar, sin repetir producto, identidad ni ingrediente activo.
export function buildSuggestions({
  catalog,
  exclude,
  preferredCategories,
  limit = 4,
  maxPerCategory = 2,
  dedupeIngredients = true,
}: BuildSuggestionsInput): CatalogItem[] {
  const excludedProductIds = new Set(exclude.map((e) => e.productId))
  const excludedIdentities = new Set(exclude.map(identity))
  const usedIngredients = new Set<string>()
  for (const e of exclude) {
    ingredientTokens(e.name, e.brand).forEach((t) => usedIngredients.add(t))
  }

  const suggestions: CatalogItem[] = []
  for (const cat of preferredCategories) {
    if (suggestions.length >= limit) break
    let fromCat = 0
    for (const item of catalog) {
      if (suggestions.length >= limit || fromCat >= maxPerCategory) break
      if (item.categorySlug !== cat) continue
      if (excludedProductIds.has(item.productId) || excludedIdentities.has(identity(item))) continue
      if (dedupeIngredients && ingredientTokens(item.name, item.brand).some((t) => usedIngredients.has(t))) continue
      if (suggestions.some((s) => s.productId === item.productId || identity(s) === identity(item))) continue
      suggestions.push(item)
      fromCat++
      ingredientTokens(item.name, item.brand).forEach((t) => usedIngredients.add(t))
    }
  }
  return suggestions
}

export interface RelatedKit {
  id: string
  name: string
  slug: string
  description: string | null
  coverImageUrl: string | null
  totalCents: number
  productCount: number
}

type KitRow = {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  kit_products: Array<{
    product_variants: { product_prices: Array<{ amount_cents: number; effective_to: string | null }> } | null
  }>
}

function toRelatedKit(k: KitRow): RelatedKit {
  const products = k.kit_products ?? []
  const totalCents = products.reduce((sum, kp) => {
    const price = (kp.product_variants?.product_prices ?? []).find((p) => !p.effective_to)
    return sum + (price?.amount_cents ?? 0)
  }, 0)
  return {
    id: k.id,
    name: k.name,
    slug: k.slug,
    description: k.description,
    coverImageUrl: k.cover_image_url,
    totalCents,
    productCount: products.length,
  }
}

const KIT_SELECT = `id, name, slug, description, cover_image_url,
  kit_products(product_variants(product_prices(amount_cents, effective_to)))`

// Kits activos que incluyen alguna variante del producto ("este producto es parte de...")
export async function getKitsContainingProduct(admin: AdminClient, productId: string, limit = 4): Promise<RelatedKit[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: variants } = await (admin as any)
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)
  const variantIds = ((variants ?? []) as { id: string }[]).map((v) => v.id)
  if (!variantIds.length) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: links } = await (admin as any)
    .from('kit_products')
    .select('kit_id')
    .in('variant_id', variantIds)
  const kitIds = [...new Set(((links ?? []) as { kit_id: string }[]).map((l) => l.kit_id))]
  if (!kitIds.length) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: kits } = await (admin as any)
    .from('kits')
    .select(KIT_SELECT)
    .in('id', kitIds)
    .eq('is_active', true)
    .limit(limit)

  return (((kits ?? []) as KitRow[])).map(toRelatedKit).filter((k) => k.totalCents > 0)
}

// Otros kits activos (para "Otros kits para ti"), ordenados como en la home.
export async function getOtherKits(admin: AdminClient, excludeSlug?: string, limit = 6): Promise<RelatedKit[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('kits')
    .select(KIT_SELECT)
    .eq('is_active', true)
    .order('home_sort_order')
    .limit(limit + 1)
  if (excludeSlug) query = query.neq('slug', excludeSlug)
  const { data: kits } = await query

  return (((kits ?? []) as KitRow[]))
    .map(toRelatedKit)
    .filter((k) => k.totalCents > 0)
    .slice(0, limit)
}
