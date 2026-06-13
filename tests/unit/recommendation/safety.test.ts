import { describe, it, expect } from 'vitest'
import {
  extractSafetyFlags,
  needsHumanReview,
  extractRestrictions,
  extractPreferences,
  buildActiveSafetyFlagTexts,
} from '@/lib/recommendation/safety'

describe('extractSafetyFlags', () => {
  it('all flags false when no cond-* slugs', () => {
    const flags = extractSafetyFlags(['obj-belleza', 'piel-grasa'])
    expect(flags).toEqual({
      pregnancy: false,
      medications: false,
      medicalCondition: false,
      strongReactions: false,
      persistentSymptoms: false,
    })
  })

  it('cond-embarazo → pregnancy:true', () => {
    const flags = extractSafetyFlags(['cond-embarazo'])
    expect(flags.pregnancy).toBe(true)
    expect(flags.medications).toBe(false)
  })

  it('cond-medicamentos → medications:true', () => {
    expect(extractSafetyFlags(['cond-medicamentos']).medications).toBe(true)
  })

  it('cond-medica → medicalCondition:true', () => {
    expect(extractSafetyFlags(['cond-medica']).medicalCondition).toBe(true)
  })

  it('cond-reacciones → strongReactions:true', () => {
    expect(extractSafetyFlags(['cond-reacciones']).strongReactions).toBe(true)
  })

  it('cond-sintomas → persistentSymptoms:true', () => {
    expect(extractSafetyFlags(['cond-sintomas']).persistentSymptoms).toBe(true)
  })

  it('sin-condicion alone → all flags false', () => {
    const flags = extractSafetyFlags(['sin-condicion'])
    for (const v of Object.values(flags)) expect(v).toBe(false)
  })

  it('multiple cond-* slugs → corresponding flags all true', () => {
    const flags = extractSafetyFlags(['cond-embarazo', 'cond-medicamentos', 'cond-medica'])
    expect(flags.pregnancy).toBe(true)
    expect(flags.medications).toBe(true)
    expect(flags.medicalCondition).toBe(true)
    expect(flags.strongReactions).toBe(false)
    expect(flags.persistentSymptoms).toBe(false)
  })
})

describe('needsHumanReview', () => {
  it('returns false when no critical flags', () => {
    const flags = extractSafetyFlags(['obj-bienestar'])
    expect(needsHumanReview(flags)).toBe(false)
  })

  it('returns true for persistentSymptoms', () => {
    expect(needsHumanReview(extractSafetyFlags(['cond-sintomas']))).toBe(true)
  })

  it('returns true for medicalCondition', () => {
    expect(needsHumanReview(extractSafetyFlags(['cond-medica']))).toBe(true)
  })

  it('pregnancy alone does NOT trigger needsHumanReview', () => {
    expect(needsHumanReview(extractSafetyFlags(['cond-embarazo']))).toBe(false)
  })
})

describe('extractRestrictions', () => {
  it('returns empty array when no restriction slugs', () => {
    expect(extractRestrictions(['obj-gym', 'tipo-fuerza'])).toEqual([])
  })

  it('sin-restriccion → always empty array', () => {
    expect(extractRestrictions(['sin-restriccion', 'alerg-lactosa'])).toEqual([])
  })

  it('alerg-cafeina → includes cafeína in restrictions', () => {
    const r = extractRestrictions(['alerg-cafeina'])
    expect(r).toContain('cafeína')
  })

  it('pref-vegano → includes ingredientes de origen animal restriction', () => {
    const r = extractRestrictions(['pref-vegano'])
    expect(r.some(x => x.includes('animal'))).toBe(true)
  })

  it('pref-sin-fragancia → includes fragancias sintéticas', () => {
    const r = extractRestrictions(['pref-sin-fragancia'])
    expect(r.some(x => x.includes('fragancia'))).toBe(true)
  })

  it('multiple restrictions are all returned', () => {
    const r = extractRestrictions(['alerg-lactosa', 'alerg-gluten', 'pref-vegano'])
    expect(r).toHaveLength(3)
    expect(r).toContain('lactosa')
    expect(r).toContain('gluten')
  })

  it('non-allergy slugs are not included in restrictions', () => {
    const r = extractRestrictions(['obj-belleza', 'piel-grasa', 'prefiere-natural'])
    expect(r).toEqual([])
  })
})

describe('extractPreferences', () => {
  it('prefersNatural is true when prefiere-natural present', () => {
    const p = extractPreferences(['prefiere-natural'])
    expect(p.prefersNatural).toBe(true)
  })

  it('prefersNatural is false without prefiere-natural', () => {
    const p = extractPreferences(['natural-importante'])
    expect(p.prefersNatural).toBe(false)
  })

  it('returns combined restrictions and prefersNatural', () => {
    const p = extractPreferences(['prefiere-natural', 'alerg-cafeina', 'pref-vegano'])
    expect(p.prefersNatural).toBe(true)
    expect(p.restrictions).toContain('cafeína')
    expect(p.restrictions.some(x => x.includes('animal'))).toBe(true)
  })
})

describe('buildActiveSafetyFlagTexts', () => {
  it('returns empty when no safety slugs', () => {
    expect(buildActiveSafetyFlagTexts(['obj-bienestar'])).toEqual([])
  })

  it('returns one text for cond-embarazo', () => {
    const texts = buildActiveSafetyFlagTexts(['cond-embarazo'])
    expect(texts).toHaveLength(1)
    expect(texts[0]).toContain('EMBARAZADA')
  })

  it('returns text for all 5 safety slugs when all present', () => {
    const slugs = ['cond-embarazo', 'cond-medicamentos', 'cond-medica', 'cond-reacciones', 'cond-sintomas']
    const texts = buildActiveSafetyFlagTexts(slugs)
    expect(texts).toHaveLength(5)
  })

  it('sin-condicion does not produce any safety text', () => {
    expect(buildActiveSafetyFlagTexts(['sin-condicion'])).toEqual([])
  })
})
