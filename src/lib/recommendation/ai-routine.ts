import { z } from 'zod'

// Validación de la rutina que arma la IA desde el catálogo completo.
//
// El catálogo se presenta a la IA con índices cortos (#1..#N) en vez de UUIDs:
// los modelos confunden UUIDs largos entre cientos de líneas (en pruebas, un
// paso "Neem en Cápsulas" llegó con el ID de un cortaúñas). Además cada paso
// debe repetir el nombre del producto, y si no coincide con el índice, el paso
// se descarta. También se filtran repetidos y rutas con <3 pasos.
//
// La identidad de un producto es NOMBRE + MARCA: el catálogo tiene productos
// con el mismo nombre en marcas distintas (ej. "Kéfir de Leche" Mama Pacha e
// Hiri, con precios distintos) y ambos son válidos — solo se deduplica cuando
// nombre y marca coinciden.

export const aiRoutineSchema = z.object({
  routine_name: z.string().min(3).max(90),
  diagnosis:    z.string().min(10).max(1200),
  tags:         z.array(z.string().min(1).max(40)).min(1).max(6),
  steps: z.array(z.object({
    item:             z.number().int().min(1),
    product_name:     z.string().min(1).max(160),
    step_label:       z.string().min(1).max(90),
    step_when:        z.string().min(1).max(70),
    step_instruction: z.string().min(1).max(500),
  })).min(1).max(8),
  suggestion_items: z.array(z.number().int().min(1)).max(8).optional(),
})

export interface CatalogRef {
  variantId: string
  productId: string
  name: string
  brand?: string | null
}

export interface ValidatedStep {
  variantId: string
  stepLabel: string
  stepWhen: string
  stepInstruction: string
}

export interface ValidatedRoutine {
  routineName: string
  diagnosis: string
  tags: string[]
  steps: ValidatedStep[]
  suggestionVariantIds: string[]
}

export const MIN_ROUTINE_STEPS = 3

const norm = (s: string) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Identidad de producto: nombre + marca. Mismo nombre con marca distinta son
// productos diferentes y ambos pueden ofrecerse.
const identityKey = (ref: CatalogRef) => norm(`${ref.name} ${ref.brand ?? ''}`)

// Veto de seguridad: el nombre que la IA dice haber elegido debe corresponder
// al producto real del índice. Acepta copia exacta, contención o al menos un
// token significativo compartido (la IA a veces abrevia: "Neem en Cápsulas"
// vs "Neem Herbals & Health").
export function nameMatches(aiName: string, actualName: string): boolean {
  const a = norm(aiName)
  const b = norm(actualName)
  if (!a || !b) return false
  if (a === b || b.includes(a) || a.includes(b)) return true
  const bTokens = new Set(b.split(' ').filter((t) => t.length >= 4))
  return a.split(' ').some((t) => t.length >= 4 && bTokens.has(t))
}

// `catalog` debe venir en el MISMO orden en que se numeró el prompt (#1 = catalog[0]).
export function validateAiRoutine(raw: unknown, catalog: CatalogRef[]): ValidatedRoutine | null {
  const parsed = aiRoutineSchema.safeParse(raw)
  if (!parsed.success) return null

  const usedProducts = new Set<string>()
  const usedIdentities = new Set<string>()

  const steps: ValidatedStep[] = []
  for (const s of parsed.data.steps) {
    const ref = catalog[s.item - 1]
    if (!ref) continue
    // La IA puede citar el nombre con o sin marca: se compara contra ambos
    if (!nameMatches(s.product_name, `${ref.name} ${ref.brand ?? ''}`)) continue
    if (usedProducts.has(ref.productId) || usedIdentities.has(identityKey(ref))) continue
    usedProducts.add(ref.productId)
    usedIdentities.add(identityKey(ref))
    steps.push({
      variantId: ref.variantId,
      stepLabel: s.step_label.trim(),
      stepWhen: s.step_when.trim(),
      stepInstruction: s.step_instruction.trim(),
    })
  }

  if (steps.length < MIN_ROUTINE_STEPS) return null

  const suggestionVariantIds: string[] = []
  for (const item of parsed.data.suggestion_items ?? []) {
    if (suggestionVariantIds.length >= 4) break
    const ref = catalog[item - 1]
    if (!ref) continue
    if (usedProducts.has(ref.productId) || usedIdentities.has(identityKey(ref))) continue
    usedProducts.add(ref.productId)
    usedIdentities.add(identityKey(ref))
    suggestionVariantIds.push(ref.variantId)
  }

  return {
    routineName: parsed.data.routine_name.trim(),
    diagnosis: parsed.data.diagnosis.trim(),
    tags: parsed.data.tags.map((t) => t.trim()).filter(Boolean).slice(0, 5),
    steps,
    suggestionVariantIds,
  }
}
