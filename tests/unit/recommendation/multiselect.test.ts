import { describe, it, expect } from 'vitest'
import { calculateCategoryScores } from '@/lib/recommendation/score'
import { extractRestrictions } from '@/lib/recommendation/safety'

describe('sin-* exclusive semantics', () => {
  it('sin-restriccion clears all other allergy restrictions', () => {
    const r = extractRestrictions(['sin-restriccion', 'alerg-lactosa', 'alerg-gluten'])
    expect(r).toEqual([])
  })

  it('sin-condicion has no effect on other slugs in scoring', () => {
    const withSin = calculateCategoryScores(['sin-condicion', 'obj-gym'])
    const withoutSin = calculateCategoryScores(['obj-gym'])
    expect(withSin).toEqual(withoutSin)
  })
})

describe('multi-select digestive symptoms', () => {
  it('multiple digestivo-* slugs accumulate correctly', () => {
    const scores = calculateCategoryScores([
      'obj-digestivo',
      'digestivo-hinchazon',
      'digestivo-estrenimiento',
      'digestivo-reset',
    ])
    // obj-digestivo:3, gym:1 + digestivo-hinchazon:2 + digestivo-estrenimiento:2 + digestivo-reset:3 = digestivo:10
    expect(scores.digestivo).toBe(10)
    expect(scores.digestivo).toBeGreaterThan(scores.gym)
  })
})

describe('multi-select skin concerns', () => {
  it('multiple piel-* slugs accumulate without duplicating', () => {
    const scores = calculateCategoryScores([
      'obj-belleza',
      'foco-piel',
      'piel-arrugas',
      'piel-manchas',
      'piel-firmeza',
    ])
    // obj-belleza:3 + foco-piel:3 + piel-arrugas(piel:3,bienestar:1) + piel-manchas:3 + piel-firmeza(piel:3,bienestar:1)
    expect(scores.piel).toBeGreaterThanOrEqual(15)
    expect(scores.bienestar).toBe(2)
  })
})

describe('multi-select gym focus areas', () => {
  it('combines gym focus areas correctly', () => {
    const scores = calculateCategoryScores([
      'obj-rendimiento',
      'gym-fuerza',
      'gym-recuperacion',
      'gym-energia',
    ])
    // obj-rendimiento:3 + gym-fuerza:4 + gym-recuperacion:3 + gym-energia:3 = gym:13
    expect(scores.gym).toBe(13)
  })
})

describe('duplicate slug deduplication', () => {
  it('same slug twice does not accumulate', () => {
    const once = calculateCategoryScores(['piel-grasa'])
    const twice = calculateCategoryScores(['piel-grasa', 'piel-grasa'])
    expect(twice.piel).toBe(once.piel)
  })

  it('three copies of same slug still count as one', () => {
    const once = calculateCategoryScores(['obj-rendimiento'])
    const thrice = calculateCategoryScores(['obj-rendimiento', 'obj-rendimiento', 'obj-rendimiento'])
    expect(thrice.gym).toBe(once.gym)
  })
})

describe('mixed objective + context slugs', () => {
  it('viaje-playa adds to both solar and viaje', () => {
    const scores = calculateCategoryScores(['obj-viaje', 'viaje-playa'])
    expect(scores.viaje).toBeGreaterThan(0)
    expect(scores.solar).toBeGreaterThan(0)
    expect(scores.viaje).toBeGreaterThan(scores.solar)
  })

  it('vacaciones-playa adds to both solar and viaje', () => {
    const scores = calculateCategoryScores(['vacaciones-playa'])
    expect(scores.solar).toBe(2)
    expect(scores.viaje).toBe(2)
  })
})
