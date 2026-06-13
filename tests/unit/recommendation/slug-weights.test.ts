import { describe, it, expect } from 'vitest'
import { SLUG_WEIGHTS, ALLERGY_LABELS, SAFETY_FLAG_TEXTS } from '@/lib/recommendation/slug-weights'
import { ALL_QUIZ_SLUGS } from './fixtures/quiz-structure'

describe('SLUG_WEIGHTS coverage', () => {
  it('every slug from the quiz fixture exists in SLUG_WEIGHTS', () => {
    const missing = ALL_QUIZ_SLUGS.filter(s => !(s in SLUG_WEIGHTS))
    expect(missing).toEqual([])
  })

  it('preference slugs do not accumulate category score', () => {
    const neutral = [
      'prefiere-natural', 'natural-importante', 'natural-indiferente',
      'rutina-simple', 'rutina-balanceada', 'rutina-completa', 'rutina-guiada',
      'presupuesto-bajo', 'presupuesto-medio', 'presupuesto-alto', 'presupuesto-premium',
    ]
    for (const s of neutral) {
      expect(SLUG_WEIGHTS[s], `${s} should have empty weights`).toEqual({})
    }
  })

  it('safety condition slugs do not accumulate category score', () => {
    const safety = ['sin-condicion', 'cond-embarazo', 'cond-medicamentos', 'cond-medica', 'cond-reacciones', 'cond-sintomas']
    for (const s of safety) {
      expect(SLUG_WEIGHTS[s], `${s} should have empty weights`).toEqual({})
    }
  })

  it('allergy/preference slugs that have no category effect are empty', () => {
    const noCat = ['sin-restriccion', 'alerg-lactosa', 'alerg-gluten', 'alerg-soya', 'alerg-azucar', 'alerg-cafeina', 'pref-vegano', 'pref-sin-fragancia']
    for (const s of noCat) {
      expect(SLUG_WEIGHTS[s], `${s} should have empty weights`).toEqual({})
    }
  })

  it('obj-guia has no category score — it opens the guidance branch', () => {
    expect(SLUG_WEIGHTS['obj-guia']).toEqual({})
  })

  it('all scores in SLUG_WEIGHTS are positive numbers', () => {
    for (const [slug, weights] of Object.entries(SLUG_WEIGHTS)) {
      for (const [cat, pts] of Object.entries(weights)) {
        expect(pts, `${slug}[${cat}] must be a positive number`).toBeGreaterThan(0)
      }
    }
  })

  it('no weight targets an unknown category', () => {
    const VALID_CATS = new Set(['piel', 'solar', 'bienestar', 'gym', 'viaje', 'digestivo', 'hogar', 'pies-cuerpo'])
    for (const [slug, weights] of Object.entries(SLUG_WEIGHTS)) {
      for (const cat of Object.keys(weights)) {
        expect(VALID_CATS.has(cat), `${slug} → unknown category "${cat}"`).toBe(true)
      }
    }
  })
})

describe('ALLERGY_LABELS', () => {
  it('maps all expected allergy/preference slugs to readable strings', () => {
    const expected = ['alerg-lactosa', 'alerg-gluten', 'alerg-soya', 'alerg-piel', 'alerg-azucar', 'alerg-cafeina', 'pref-vegano', 'pref-sin-fragancia']
    for (const s of expected) {
      expect(ALLERGY_LABELS[s], `ALLERGY_LABELS missing entry for ${s}`).toBeTruthy()
    }
  })

  it('all labels are non-empty strings', () => {
    for (const [slug, label] of Object.entries(ALLERGY_LABELS)) {
      expect(typeof label, `${slug} label must be string`).toBe('string')
      expect(label.length, `${slug} label must not be empty`).toBeGreaterThan(0)
    }
  })
})

describe('SAFETY_FLAG_TEXTS', () => {
  it('covers all 5 safety condition slugs', () => {
    const expected = ['cond-embarazo', 'cond-medicamentos', 'cond-medica', 'cond-reacciones', 'cond-sintomas']
    for (const s of expected) {
      expect(SAFETY_FLAG_TEXTS[s], `SAFETY_FLAG_TEXTS missing entry for ${s}`).toBeTruthy()
    }
  })

  it('all flag texts are non-empty strings', () => {
    for (const [slug, text] of Object.entries(SAFETY_FLAG_TEXTS)) {
      expect(typeof text, `${slug} text must be string`).toBe('string')
      expect(text.length, `${slug} text must not be empty`).toBeGreaterThan(0)
    }
  })
})
