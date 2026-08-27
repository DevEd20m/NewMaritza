import { describe, expect, it } from 'vitest'
import { roleToken, validateAiRoutine, ingredientTokens } from '@/lib/recommendation/ai-routine'
import { buildSuggestions, type CatalogItem } from '@/lib/recommendation/related'

// Regresión del caso real (perfil 708dfed5, 2026-08-27): el validador mataba
// pasos legítimos porque «hidratante» contaba como ingrediente compartido, y
// tras un kit de shampoos las sugerencias eran más shampoos.

const cat = (over: Partial<CatalogItem>): CatalogItem => ({
  variantId: crypto.randomUUID(), productId: crypto.randomUUID(),
  name: 'X', brand: 'M', variantName: 'u', categoryName: 'Piel', categorySlug: 'piel',
  priceCents: 5000, currency: 'PEN', imageUrl: null, categoryColor: '#fff',
  productSlug: 'x', stockQuantity: null, description: null,
  usageInstructions: null, indications: null, tags: [], ...over,
})

describe('roleToken', () => {
  it('detecta roles cosméticos', () => {
    expect(roleToken('Shampoo Diario Cantu Weightless 400 ml')).toBe('shampoo')
    expect(roleToken('Shampoo en Seco Re Fresh')).toBe('shampoo-seco')
    expect(roleToken('Protector Solar Facial Eucerin FPS50')).toBe('protector-solar')
    expect(roleToken('Sérum Hidratante CeraVe con Ácido Hialurónico')).toBe('serum')
    expect(roleToken('Gel Limpiador Espumoso CeraVe')).toBe('limpiador')
  })

  it('los suplementos no tienen rol cosmético', () => {
    expect(roleToken('ASHWAGANDHA DRASANVI 60 CAPS')).toBeNull()
    expect(roleToken('VITAMIN B12 2000MCG NUTRICOST')).toBeNull()
  })
})

describe('validateAiRoutine con roles', () => {
  const catalogo = [
    cat({ name: 'Gel Limpiador Espumoso CeraVe', brand: 'CeraVe' }),
    cat({ name: 'Crema en Gel Hidratante CeraVe Control de Grasa', brand: 'CeraVe' }),
    cat({ name: 'Sérum Hidratante CeraVe con Ácido Hialurónico', brand: 'CeraVe' }),
    cat({ name: 'Shampoo Lan Therapy Anticaída', brand: 'LAN' }),
    cat({ name: 'Shampoo Diario Cantu Weightless 400 ml', brand: 'CANTU' }),
  ]
  const paso = (item: number, nombre: string) => ({
    item, product_name: nombre, step_label: 'Paso', step_when: '🌅 Mañana', step_instruction: 'Aplicar.',
  })
  const base = { routine_name: 'Rutina Test', diagnosis: 'Un diagnóstico de prueba.', tags: ['piel'] }

  it('crema hidratante y sérum hidratante conviven (regresión del bug)', () => {
    const v = validateAiRoutine({ ...base, steps: [
      paso(1, 'Gel Limpiador Espumoso CeraVe'),
      paso(2, 'Crema en Gel Hidratante CeraVe Control de Grasa'),
      paso(3, 'Sérum Hidratante CeraVe con Ácido Hialurónico'),
    ] }, catalogo)
    expect(v).not.toBeNull()
    expect(v!.steps).toHaveLength(3)
  })

  it('jamás dos shampoos, aunque marca e ingredientes difieran', () => {
    const v = validateAiRoutine({ ...base, steps: [
      paso(4, 'Shampoo Lan Therapy Anticaída'),
      paso(5, 'Shampoo Diario Cantu Weightless 400 ml'),
      paso(1, 'Gel Limpiador Espumoso CeraVe'),
      paso(2, 'Crema en Gel Hidratante CeraVe Control de Grasa'),
    ] }, catalogo)
    expect(v).not.toBeNull()
    const nombres = v!.steps.map(s => catalogo.find(c => c.variantId === s.variantId)!.name)
    expect(nombres.filter(n => n.startsWith('Shampoo'))).toHaveLength(1)
  })

  it('«hidratante» ya no cuenta como ingrediente', () => {
    expect(ingredientTokens('Crema en Gel Hidratante CeraVe Control de Grasa', 'CeraVe'))
      .not.toContain('hidratante')
  })
})

describe('buildSuggestions con roles', () => {
  it('tras un kit con shampoo no sugiere más shampoos', () => {
    const kit = cat({ name: 'Shampoo Lan Therapy Anticaída', brand: 'LAN', categorySlug: 'cabello' })
    const catalogo = [
      kit,
      cat({ name: 'Shampoo Diario Cantu Weightless 400 ml', brand: 'CANTU', categorySlug: 'cabello' }),
      cat({ name: 'Shampoo Monday Moisture 354 ml', brand: 'MONDAY', categorySlug: 'cabello' }),
      cat({ name: 'Shampoo en Seco Re Fresh Summer Breeze', brand: 'RE FRESH', categorySlug: 'cabello' }),
    ]
    const sugeridas = buildSuggestions({ catalog: catalogo, exclude: [kit], preferredCategories: ['cabello'] })
    const roles = sugeridas.map(s => roleToken(s.name))
    expect(roles).not.toContain('shampoo')
    // El shampoo en seco es otro rol: sí puede sugerirse.
    expect(roles).toContain('shampoo-seco')
  })
})
