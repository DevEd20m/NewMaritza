import { describe, it, expect } from 'vitest'
import { calculateCategoryScores, selectTopCategory, emptyScores } from '@/lib/recommendation/score'
import type { CategoryScores } from '@/lib/recommendation/types'

describe('emptyScores', () => {
  it('returns all 8 categories at 0', () => {
    const s = emptyScores()
    expect(Object.keys(s)).toHaveLength(8)
    for (const v of Object.values(s)) expect(v).toBe(0)
  })
})

describe('calculateCategoryScores', () => {
  it('empty slug list → all zeros', () => {
    const scores = calculateCategoryScores([])
    for (const v of Object.values(scores)) expect(v).toBe(0)
  })

  it('obj-belleza + foco-piel + piel-grasa → piel dominates', () => {
    const scores = calculateCategoryScores(['obj-belleza', 'foco-piel', 'piel-grasa'])
    expect(scores.piel).toBeGreaterThanOrEqual(9)
    expect(scores.piel).toBeGreaterThan(scores.bienestar)
    expect(scores.piel).toBeGreaterThan(scores.gym)
  })

  it('obj-rendimiento + tipo-fuerza + gym-fuerza → gym dominates', () => {
    const scores = calculateCategoryScores(['obj-rendimiento', 'tipo-fuerza', 'gym-fuerza'])
    expect(scores.gym).toBeGreaterThanOrEqual(10)
    expect(scores.gym).toBeGreaterThan(scores.piel)
    expect(scores.gym).toBeGreaterThan(scores.bienestar)
  })

  it('obj-bienestar + foco-sueno + frecuencia-diaria → bienestar dominates', () => {
    const scores = calculateCategoryScores(['obj-bienestar', 'foco-sueno', 'frecuencia-diaria'])
    expect(scores.bienestar).toBeGreaterThanOrEqual(8)
    expect(scores.bienestar).toBeGreaterThan(scores.gym)
  })

  it('obj-digestivo + digestivo-hinchazon + digestivo-reset → digestivo dominates', () => {
    const scores = calculateCategoryScores(['obj-digestivo', 'digestivo-hinchazon', 'digestivo-reset'])
    expect(scores.digestivo).toBeGreaterThan(scores.bienestar)
    expect(scores.digestivo).toBeGreaterThan(scores.gym)
  })

  it('obj-solar + solar-playa → solar very high', () => {
    const scores = calculateCategoryScores(['obj-solar', 'solar-playa'])
    expect(scores.solar).toBeGreaterThanOrEqual(7)
  })

  it('obj-viaje + viaje-aventura → viaje dominates', () => {
    const scores = calculateCategoryScores(['obj-viaje', 'viaje-aventura'])
    expect(scores.viaje).toBeGreaterThanOrEqual(6)
    expect(scores.viaje).toBeGreaterThan(scores.solar)
  })

  it('obj-hogar + hogar-familiar → hogar dominates', () => {
    const scores = calculateCategoryScores(['obj-hogar', 'hogar-familiar'])
    expect(scores.hogar).toBeGreaterThanOrEqual(7)
  })

  it('obj-pies-cuerpo + pies-durezas → pies-cuerpo dominates', () => {
    const scores = calculateCategoryScores(['obj-pies-cuerpo', 'pies-durezas'])
    expect(scores['pies-cuerpo']).toBeGreaterThanOrEqual(7)
  })

  it('duplicate slugs do not double-count', () => {
    const once = calculateCategoryScores(['obj-belleza'])
    const twice = calculateCategoryScores(['obj-belleza', 'obj-belleza'])
    expect(twice.piel).toBe(once.piel)
  })

  it('unknown slugs are ignored without crashing', () => {
    expect(() => calculateCategoryScores(['totally-unknown-slug-xyz'])).not.toThrow()
  })

  it('informational-only slugs produce zero scores', () => {
    const slugs = ['prefiere-natural', 'rutina-simple', 'presupuesto-medio', 'sin-condicion', 'alerg-lactosa', 'pref-vegano', 'obj-guia']
    const scores = calculateCategoryScores(slugs)
    for (const v of Object.values(scores)) expect(v).toBe(0)
  })
})

describe('selectTopCategory', () => {
  it('returns null when all scores are 0', () => {
    expect(selectTopCategory(emptyScores())).toBeNull()
  })

  it('returns the highest-scoring category', () => {
    const scores = { ...emptyScores(), gym: 10, piel: 3, bienestar: 1 }
    expect(selectTopCategory(scores)).toBe('gym')
  })

  it('resolves ties deterministically (piel > bienestar in tiebreak order)', () => {
    const scores = { ...emptyScores(), piel: 5, bienestar: 5 }
    expect(selectTopCategory(scores)).toBe('piel')
  })

  it('resolves ties: bienestar > gym when equal', () => {
    const scores = { ...emptyScores(), bienestar: 4, gym: 4 }
    expect(selectTopCategory(scores)).toBe('bienestar')
  })
})

describe('end-to-end profile scoring', () => {
  it('foco-antiedad scores piel higher than bienestar', () => {
    const scores = calculateCategoryScores(['obj-belleza', 'foco-antiedad'])
    expect(scores.piel).toBeGreaterThan(scores.bienestar)
  })

  it('foco-energia scores bienestar (no digestivo bleed)', () => {
    const scores = calculateCategoryScores(['obj-bienestar', 'foco-energia'])
    expect(scores.bienestar).toBeGreaterThan(scores.digestivo)
  })

  it('guia-piel gives piel:2 even after obj-guia', () => {
    const scores = calculateCategoryScores(['obj-guia', 'guia-piel'])
    expect(scores.piel).toBe(2)
  })

  it('guia-viaje gives viaje:2 solar:1', () => {
    const scores = calculateCategoryScores(['obj-guia', 'guia-viaje'])
    expect(scores.viaje).toBe(2)
    expect(scores.solar).toBe(1)
  })
})
