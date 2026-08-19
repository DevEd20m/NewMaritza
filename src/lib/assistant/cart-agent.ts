import type { CatalogItem } from '@/lib/recommendation/related'

export interface CurrentCartItem {
  variantId: string
  quantity: number
}

export interface CartSwapSuggestion {
  id: string
  sourceVariantId: string
  replacementVariantId: string
  quantity: number
  reason: string
  savingsCents: number
}

const SWAP_INTENT = /(cambiar|cambio|reemplaz|sustitu|alternativ|otra opci[oó]n|m[aá]s econ[oó]mic[oa]?|m[aá]s barat[oa]?)/i
const CHEAPER_INTENT = /(econ[oó]mic[oa]?|barat[oa]?|ahorr|menor precio|cuesta menos)/i
const EXTERNAL_RECOMMENDATION = /(farmacia|tienda local|mercado libre|amazon|retailer|otro comercio)/i

const money = (cents: number) => `S/${(cents / 100).toFixed(0)}`

export function asksForSwap(message: string): boolean {
  return SWAP_INTENT.test(message)
}

export function asksForCheaperOption(message: string): boolean {
  return CHEAPER_INTENT.test(message)
}

export function containsExternalRecommendation(message: string): boolean {
  return EXTERNAL_RECOMMENDATION.test(message)
}

function messageMatchScore(message: string, item: CatalogItem): number {
  const normalized = message.toLocaleLowerCase('es')
  const terms = `${item.name} ${item.brand ?? ''}`
    .toLocaleLowerCase('es')
    .split(/[^a-záéíóúüñ0-9]+/)
    .filter((term) => term.length >= 4)
  return terms.reduce((score, term) => score + (normalized.includes(term) ? 1 : 0), 0)
}

function availableFor(item: CatalogItem, quantity: number): boolean {
  return item.stockQuantity === null || item.stockQuantity >= quantity
}

export function buildCartSwapSuggestions(
  catalog: CatalogItem[],
  cart: CurrentCartItem[],
  message: string,
  createId: () => string,
  limit = 3,
): CartSwapSuggestion[] {
  if (!asksForSwap(message)) return []

  const catalogByVariant = new Map(catalog.map((item) => [item.variantId, item]))
  const current = cart
    .map((line) => ({ line, item: catalogByVariant.get(line.variantId) }))
    .filter((entry): entry is { line: CurrentCartItem; item: CatalogItem } => Boolean(entry.item))
  if (!current.length) return []

  const bestMessageScore = Math.max(...current.map(({ item }) => messageMatchScore(message, item)))
  const sources = bestMessageScore > 0
    ? current.filter(({ item }) => messageMatchScore(message, item) === bestMessageScore)
    : [...current].sort((a, b) => b.item.priceCents - a.item.priceCents)
  const cheaperOnly = asksForCheaperOption(message)
  const cartProducts = new Set(current.map(({ item }) => item.productId))
  const ranked: Array<{ source: CatalogItem; quantity: number; candidate: CatalogItem; savings: number }> = []

  for (const { line, item: source } of sources) {
    for (const candidate of catalog) {
      if (candidate.variantId === source.variantId || candidate.productId === source.productId) continue
      if (candidate.categorySlug !== source.categorySlug) continue
      if (cartProducts.has(candidate.productId)) continue
      if (!availableFor(candidate, line.quantity)) continue
      const savings = source.priceCents - candidate.priceCents
      if (cheaperOnly && savings <= 0) continue
      ranked.push({ source, quantity: line.quantity, candidate, savings })
    }
  }

  ranked.sort((a, b) => {
    if (cheaperOnly && b.savings !== a.savings) return b.savings - a.savings
    const sourceMatch = messageMatchScore(message, b.source) - messageMatchScore(message, a.source)
    if (sourceMatch) return sourceMatch
    return a.candidate.priceCents - b.candidate.priceCents
  })

  const usedProducts = new Set<string>()
  const suggestions: CartSwapSuggestion[] = []
  for (const option of ranked) {
    if (usedProducts.has(option.candidate.productId)) continue
    usedProducts.add(option.candidate.productId)
    const savingText = option.savings > 0 ? ` y ahorras ${money(option.savings)}` : ''
    suggestions.push({
      id: createId(),
      sourceVariantId: option.source.variantId,
      replacementVariantId: option.candidate.variantId,
      quantity: option.quantity,
      savingsCents: Math.max(0, option.savings),
      reason: `Alternativa de ${option.candidate.categoryName}${savingText}.`,
    })
    if (suggestions.length >= limit) break
  }
  return suggestions
}

export function deterministicAssistantReply(message: string, suggestions: CartSwapSuggestion[]): string {
  if (suggestions.length) {
    return asksForCheaperOption(message)
      ? 'Encontré estas alternativas disponibles en LIORA para mantener el mismo tipo de cuidado y reducir el total. Revisa los precios y confirma solo la que prefieras.'
      : 'Encontré estas alternativas disponibles en nuestro catálogo. Puedes comparar sus precios y confirmar un cambio cuando estés lista.'
  }
  if (asksForSwap(message)) {
    return 'No encontré ahora una alternativa compatible y disponible dentro de LIORA. Dime qué producto quieres cambiar y si priorizas precio, marca o presentación.'
  }
  return 'Puedo explicarte tu rutina o buscar dentro de LIORA una alternativa por precio, marca o presentación. ¿Qué producto quieres revisar?'
}
