import { calculateCategoryScores, selectTopCategory } from './score'
import type { CategorySlug } from './types'

// Enrutador determinístico: categoría ganadora + sub-señales del quiz → kit curado.
// El kit curado trae sus productos con pasos (kit_products.step_*), así el
// resultado del quiz siempre es una rutina coherente aunque la IA no corra.

export const DEFAULT_ROUTINE_SLUG = 'rutina-estres-y-calma-diaria'

const ROUTINE_BY_CATEGORY: Record<CategorySlug, (has: (s: string) => boolean) => string> = {
  digestivo: () => 'rutina-acidez-y-pesadez-estomacal',
  piel: (has) =>
    has('piel-sensible') || has('piel-rojeces') || has('alerg-piel')
      ? 'rutina-skin-care-piel-sensible'
      : 'rutina-skin-care-piel-grasa',
  bienestar: (has) => {
    if (has('foco-sueno') || has('foco-sueno-estres')) return 'rutina-sueno-y-descanso'
    if (has('foco-pantallas')) return 'rutina-oficina-y-pantallas'
    return 'rutina-estres-y-calma-diaria'
  },
  gym: () => 'rutina-gym-y-recuperacion',
  solar: (has) =>
    has('solar-playa') || has('solar-outdoor') || has('solar-completo')
      ? 'kit-protector-solar-playa-y-outdoor'
      : 'rutina-protector-solar-diario',
  viaje: () => 'kit-viaje-esencial',
  hogar: (has) => (has('hogar-familiar') ? 'kit-primeros-auxilios-familiar' : 'kit-botiquin-compacto'),
  'pies-cuerpo': (has) =>
    has('cuerpo-rozaduras') || has('cuerpo-muscular')
      ? 'rutina-cuidado-piel-corporal'
      : 'rutina-pies-perfectos',
  // Todavía no existe un kit curado de cabello. Devolver un slug inexistente es
  // deliberado: el fallback 1 no encuentra kit y cae al fallback 2, que ahora sí
  // puede tomar productos de la categoría `cabello`. Antes ni eso era posible,
  // porque ningún slug la puntuaba y sus 28 productos eran inalcanzables.
  cabello: () => 'rutina-cabello',
}

export function selectRoutineKit(slugs: string[]): { kitSlug: string; topCategory: CategorySlug | null } {
  const scores = calculateCategoryScores(slugs)
  const topCategory = selectTopCategory(scores)
  if (!topCategory) return { kitSlug: DEFAULT_ROUTINE_SLUG, topCategory: null }
  const set = new Set(slugs)
  const kitSlug = ROUTINE_BY_CATEGORY[topCategory]((s) => set.has(s))
  return { kitSlug, topCategory }
}

// Diagnosis templado por categoría cuando la IA no está disponible
export const FALLBACK_DIAGNOSIS: Record<CategorySlug, string> = {
  digestivo:     'Armamos tu rutina digestiva paso a paso: probióticos, desinflamantes naturales y fibra prebiótica en el orden y horario exactos para aliviar la acidez y la pesadez.',
  piel:          'Armamos tu rutina de cuidado de piel paso a paso, con los productos en el orden exacto de aplicación para tu tipo de piel.',
  bienestar:     'Armamos tu rutina de bienestar paso a paso para ayudarte a recuperar calma, descanso y energía en tu día a día.',
  gym:           'Armamos tu rutina de rendimiento y recuperación paso a paso, para acompañar tu entrenamiento antes, durante y después.',
  solar:         'Armamos tu rutina de protección solar paso a paso, para cuidar tu piel de la exposición diaria.',
  viaje:         'Armamos tu kit de viaje con lo esencial para que estés cubierta/o en cualquier destino.',
  hogar:         'Armamos tu botiquín con lo esencial para atender los imprevistos de casa.',
  'pies-cuerpo': 'Armamos tu rutina de cuidado corporal paso a paso, para pies y piel del cuerpo.',
  cabello:       'Armamos tu rutina capilar paso a paso, pensada para tu tipo de cabello y tu cuero cabelludo.',
}

export const FALLBACK_TAGS: Record<CategorySlug, string[]> = {
  digestivo:     ['Digestión', 'Rutina paso a paso', 'Natural'],
  piel:          ['Cuidado de piel', 'Rutina paso a paso'],
  bienestar:     ['Bienestar', 'Calma', 'Rutina diaria'],
  gym:           ['Rendimiento', 'Recuperación'],
  solar:         ['Protección solar', 'Cuidado diario'],
  viaje:         ['Viaje', 'Esenciales'],
  hogar:         ['Hogar', 'Primeros auxilios'],
  'pies-cuerpo': ['Cuidado corporal', 'Rutina paso a paso'],
  cabello:       ['Cabello', 'Rutina paso a paso'],
}
