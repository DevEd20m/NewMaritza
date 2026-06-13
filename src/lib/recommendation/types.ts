export type CategorySlug =
  | 'piel'
  | 'solar'
  | 'bienestar'
  | 'gym'
  | 'viaje'
  | 'digestivo'
  | 'hogar'
  | 'pies-cuerpo'

export type CategoryScores = Record<CategorySlug, number>

export const CATEGORY_SLUGS: CategorySlug[] = [
  'piel', 'solar', 'bienestar', 'gym', 'viaje', 'digestivo', 'hogar', 'pies-cuerpo',
]

export interface SafetyFlags {
  pregnancy: boolean
  medications: boolean
  medicalCondition: boolean
  strongReactions: boolean
  persistentSymptoms: boolean
}

export interface PreferenceFilters {
  restrictions: string[]
  prefersNatural: boolean
}

export interface RecommendationInput {
  slugs: string[]
  scores: CategoryScores
  safetyFlags: SafetyFlags
  preferences: PreferenceFilters
  budgetSlug?: string
  routinePreference?: string
}
