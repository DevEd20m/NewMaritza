import { ALLERGY_LABELS, SAFETY_FLAG_TEXTS } from './slug-weights'
import type { SafetyFlags, PreferenceFilters } from './types'

export function extractSafetyFlags(slugs: string[]): SafetyFlags {
  const set = new Set(slugs)
  return {
    pregnancy:         set.has('cond-embarazo'),
    medications:       set.has('cond-medicamentos'),
    medicalCondition:  set.has('cond-medica'),
    strongReactions:   set.has('cond-reacciones'),
    persistentSymptoms:set.has('cond-sintomas'),
  }
}

export function needsHumanReview(flags: SafetyFlags): boolean {
  return flags.persistentSymptoms || flags.medicalCondition
}

export function extractRestrictions(slugs: string[]): string[] {
  if (slugs.includes('sin-restriccion')) return []
  return slugs
    .filter(s => s in ALLERGY_LABELS)
    .map(s => ALLERGY_LABELS[s])
    .filter(Boolean)
}

export function extractPreferences(slugs: string[]): PreferenceFilters {
  return {
    restrictions: extractRestrictions(slugs),
    prefersNatural: slugs.includes('prefiere-natural'),
  }
}

export function buildActiveSafetyFlagTexts(slugs: string[]): string[] {
  return slugs
    .filter(s => SAFETY_FLAG_TEXTS[s])
    .map(s => SAFETY_FLAG_TEXTS[s])
}
