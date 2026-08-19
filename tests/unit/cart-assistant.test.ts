import { describe, expect, it } from 'vitest'
import {
  buildCartSwapSuggestions,
  containsExternalRecommendation,
  deterministicAssistantReply,
} from '@/lib/assistant/cart-agent'
import type { CatalogItem } from '@/lib/recommendation/related'

function item(overrides: Partial<CatalogItem>): CatalogItem {
  return {
    variantId: crypto.randomUUID(),
    productId: crypto.randomUUID(),
    name: 'Producto',
    brand: 'LIORA',
    variantName: 'Unidad',
    categoryName: 'Cuidado de la piel',
    categorySlug: 'piel',
    priceCents: 5000,
    currency: 'PEN',
    imageUrl: null,
    categoryColor: '#fff',
    productSlug: 'producto',
    stockQuantity: null,
    description: null,
    usageInstructions: null,
    indications: null,
    ...overrides,
  }
}

describe('Lía cart alternatives', () => {
  it('returns real cheaper options in the same category', () => {
    const source = item({ name: 'Crema Premium', priceCents: 9000 })
    const cheaper = item({ name: 'Crema Esencial', priceCents: 4500 })
    const otherCategory = item({ name: 'Proteína', categorySlug: 'gym', priceCents: 2000 })
    const suggestions = buildCartSwapSuggestions(
      [source, cheaper, otherCategory],
      [{ variantId: source.variantId, quantity: 1 }],
      'Quiero algo más económico',
      () => crypto.randomUUID(),
    )

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].replacementVariantId).toBe(cheaper.variantId)
    expect(suggestions[0].savingsCents).toBe(4500)
  })

  it('excludes depleted stock but keeps unlimited stock', () => {
    const source = item({ priceCents: 9000 })
    const depleted = item({ name: 'Agotado', priceCents: 1000, stockQuantity: 0 })
    const unlimited = item({ name: 'Ilimitado', priceCents: 3000, stockQuantity: null })
    const suggestions = buildCartSwapSuggestions(
      [source, depleted, unlimited],
      [{ variantId: source.variantId, quantity: 2 }],
      '¿Tienes una alternativa más barata?',
      () => crypto.randomUUID(),
    )

    expect(suggestions.map((entry) => entry.replacementVariantId)).toEqual([unlimited.variantId])
  })

  it('does not invent alternatives when there is no compatible product', () => {
    const source = item({ priceCents: 9000 })
    const reply = deterministicAssistantReply(
      'Quiero cambiar este producto',
      buildCartSwapSuggestions([source], [{ variantId: source.variantId, quantity: 1 }], 'Quiero cambiar este producto', () => crypto.randomUUID()),
    )

    expect(reply).toContain('dentro de LIORA')
    expect(containsExternalRecommendation(reply)).toBe(false)
  })

  it('rejects external-retailer language from an AI reply', () => {
    expect(containsExternalRecommendation('Busca una opción en una farmacia local')).toBe(true)
  })
})

