import { describe, it, expect } from 'vitest'
import { validateAiRoutine, nameMatches, MIN_ROUTINE_STEPS, type CatalogRef } from '@/lib/recommendation/ai-routine'

// El orden importa: #1 = CATALOG[0], como en el prompt
const CATALOG: CatalogRef[] = [
  { variantId: 'v1', productId: 'p1', name: 'Kéfir de Leche', brand: 'Mama Pacha' },   // #1
  { variantId: 'v2', productId: 'p2', name: 'Kéfir de Agua', brand: 'Mama Pacha' },    // #2
  { variantId: 'v3', productId: 'p3', name: 'Moringa Oleifera Herbals', brand: 'H&H' },// #3
  { variantId: 'v4', productId: 'p4', name: 'Neem Herbals & Health', brand: 'H&H' },   // #4
  { variantId: 'v5', productId: 'p5', name: 'Siete Semillas Vainilla', brand: 'Naturandes' }, // #5
  // Caso real: mismo nombre, OTRA marca → producto distinto y válido
  { variantId: 'v6', productId: 'p6', name: 'Kéfir de Leche', brand: 'Hiri' },         // #6
  { variantId: 'v7', productId: 'p7', name: 'Cortauñas Grande para Pies', brand: 'Biu' }, // #7
  // Duplicado verdadero: mismo nombre y MISMA marca que #1
  { variantId: 'v8', productId: 'p8', name: 'Kéfir de Leche', brand: 'Mama Pacha' },   // #8
]

const step = (item: number, product_name: string) => ({
  item,
  product_name,
  step_label: 'Rol del producto',
  step_when: '🌅 En ayunas',
  step_instruction: 'Toma una porción al despertar.',
})

const base = {
  routine_name: 'Rutina Digestión Ligera',
  diagnosis: 'Tu digestión necesita un reinicio suave y constante.',
  tags: ['Digestión', 'Natural'],
}

describe('nameMatches', () => {
  it('acepta copia exacta, contención y abreviaciones con token compartido', () => {
    expect(nameMatches('Kéfir de Leche', 'Kéfir de Leche')).toBe(true)
    expect(nameMatches('kefir de leche', 'Kéfir de Leche')).toBe(true)
    expect(nameMatches('Neem en Cápsulas', 'Neem Herbals & Health')).toBe(true)
    expect(nameMatches('Moringa', 'Moringa Oleifera Herbals')).toBe(true)
  })

  it('rechaza nombres de productos distintos (caso real: Neem vs cortaúñas)', () => {
    expect(nameMatches('Neem en Cápsulas', 'Cortauñas Grande para Pies')).toBe(false)
    expect(nameMatches('Protector solar facial', 'Kéfir de Agua')).toBe(false)
  })
})

describe('validateAiRoutine', () => {
  it('acepta una rutina válida y resuelve índices a variantIds', () => {
    const result = validateAiRoutine({
      ...base,
      steps: [
        step(1, 'Kéfir de Leche'),
        step(3, 'Moringa Oleifera Herbals'),
        step(4, 'Neem Herbals & Health'),
        step(5, 'Siete Semillas Vainilla'),
      ],
      suggestion_items: [2],
    }, CATALOG)
    expect(result).not.toBeNull()
    expect(result!.routineName).toBe('Rutina Digestión Ligera')
    expect(result!.steps.map(s => s.variantId)).toEqual(['v1', 'v3', 'v4', 'v5'])
    expect(result!.suggestionVariantIds).toEqual(['v2'])
  })

  it('descarta pasos donde el nombre no corresponde al índice (ID cruzado)', () => {
    // La IA dice "Neem en Cápsulas" pero apunta al item #7 (cortaúñas)
    const result = validateAiRoutine({
      ...base,
      steps: [
        step(1, 'Kéfir de Leche'),
        step(7, 'Neem en Cápsulas'),
        step(3, 'Moringa Oleifera Herbals'),
        step(5, 'Siete Semillas Vainilla'),
      ],
    }, CATALOG)
    expect(result).not.toBeNull()
    expect(result!.steps.map(s => s.variantId)).toEqual(['v1', 'v3', 'v5'])
  })

  it('descarta índices fuera de rango y rechaza si quedan menos de 3 pasos', () => {
    const result = validateAiRoutine({
      ...base,
      steps: [step(1, 'Kéfir de Leche'), step(99, 'Inventado'), step(120, 'Otro'), step(7, 'Neem')],
    }, CATALOG)
    expect(result).toBeNull()
  })

  it('permite el mismo nombre en marcas distintas (Mama Pacha e Hiri)', () => {
    // #1 y #6 son "Kéfir de Leche" de marcas distintas → ambos válidos
    const result = validateAiRoutine({
      ...base,
      steps: [
        step(1, 'Kéfir de Leche'),
        step(6, 'Kéfir de Leche Hiri'),
        step(3, 'Moringa Oleifera Herbals'),
        step(4, 'Neem Herbals & Health'),
      ],
    }, CATALOG)
    expect(result).not.toBeNull()
    expect(result!.steps.map(s => s.variantId)).toEqual(['v1', 'v6', 'v3', 'v4'])
  })

  it('deduplica el duplicado verdadero: mismo nombre y misma marca', () => {
    // #1 y #8 son "Kéfir de Leche · Mama Pacha" → solo entra uno
    const result = validateAiRoutine({
      ...base,
      steps: [
        step(1, 'Kéfir de Leche'),
        step(8, 'Kéfir de Leche'),
        step(3, 'Moringa Oleifera Herbals'),
        step(4, 'Neem Herbals & Health'),
      ],
    }, CATALOG)
    expect(result).not.toBeNull()
    expect(result!.steps.map(s => s.variantId)).toEqual(['v1', 'v3', 'v4'])
  })

  it('deduplica el mismo item repetido en steps', () => {
    const result = validateAiRoutine({
      ...base,
      steps: [
        step(1, 'Kéfir de Leche'),
        step(1, 'Kéfir de Leche'),
        step(3, 'Moringa Oleifera Herbals'),
        step(4, 'Neem Herbals & Health'),
      ],
    }, CATALOG)
    expect(result).not.toBeNull()
    expect(result!.steps).toHaveLength(3)
  })

  it('las sugerencias no repiten el kit, pero sí permiten otra marca del mismo nombre', () => {
    const result = validateAiRoutine({
      ...base,
      steps: [
        step(1, 'Kéfir de Leche'),
        step(3, 'Moringa Oleifera Herbals'),
        step(4, 'Neem Herbals & Health'),
      ],
      suggestion_items: [1, 8, 6, 2],
    }, CATALOG)
    expect(result).not.toBeNull()
    // #1 está en el kit; #8 es su duplicado exacto (misma marca);
    // #6 es otra marca → sugerencia válida
    expect(result!.suggestionVariantIds).toEqual(['v6', 'v2'])
  })

  it('rechaza JSON con forma inválida', () => {
    expect(validateAiRoutine({ foo: 'bar' }, CATALOG)).toBeNull()
    expect(validateAiRoutine(null, CATALOG)).toBeNull()
    expect(validateAiRoutine({ ...base, steps: [] }, CATALOG)).toBeNull()
    expect(validateAiRoutine({ ...base, steps: [{ item: 1 }] }, CATALOG)).toBeNull()
  })

  it('recorta tags a máximo 5', () => {
    const result = validateAiRoutine({
      ...base,
      tags: ['a', 'b', 'c', 'd', 'e', 'f'],
      steps: [
        step(1, 'Kéfir de Leche'),
        step(3, 'Moringa Oleifera Herbals'),
        step(4, 'Neem Herbals & Health'),
      ],
    }, CATALOG)
    expect(result!.tags).toHaveLength(5)
  })

  it('MIN_ROUTINE_STEPS es 3', () => {
    expect(MIN_ROUTINE_STEPS).toBe(3)
  })
})
