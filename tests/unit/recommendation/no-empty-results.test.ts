import { describe, it, expect } from 'vitest'
import { calculateCategoryScores, selectTopCategory } from '@/lib/recommendation/score'

const OBJ_SLUGS = [
  'obj-rendimiento',
  'obj-belleza',
  'obj-bienestar',
  'obj-digestivo',
  'obj-nutricion',
  'obj-solar',
  'obj-viaje',
  'obj-hogar',
  'obj-pies-cuerpo',
]

describe('all obj-* routes produce non-zero score', () => {
  for (const slug of OBJ_SLUGS) {
    it(`${slug} scores at least one category > 0`, () => {
      const scores = calculateCategoryScores([slug])
      const total = Object.values(scores).reduce((a, b) => a + b, 0)
      expect(total).toBeGreaterThan(0)
    })
  }
})

describe('obj-guia branch resolution', () => {
  it('obj-guia alone produces zero score (requires follow-up)', () => {
    const scores = calculateCategoryScores(['obj-guia'])
    const total = Object.values(scores).reduce((a, b) => a + b, 0)
    expect(total).toBe(0)
  })

  it('obj-guia + guia-piel → piel: 2', () => {
    const scores = calculateCategoryScores(['obj-guia', 'guia-piel'])
    expect(scores.piel).toBe(2)
  })

  it('obj-guia + guia-bienestar → bienestar: 2', () => {
    expect(calculateCategoryScores(['obj-guia', 'guia-bienestar']).bienestar).toBe(2)
  })

  it('obj-guia + guia-gym → gym: 2', () => {
    expect(calculateCategoryScores(['obj-guia', 'guia-gym']).gym).toBe(2)
  })

  it('obj-guia + guia-digestivo → digestivo: 2', () => {
    expect(calculateCategoryScores(['obj-guia', 'guia-digestivo']).digestivo).toBe(2)
  })

  it('obj-guia + guia-viaje → viaje: 2, solar: 1', () => {
    const scores = calculateCategoryScores(['obj-guia', 'guia-viaje'])
    expect(scores.viaje).toBe(2)
    expect(scores.solar).toBe(1)
  })

  it('obj-guia + guia-hogar → hogar: 2', () => {
    expect(calculateCategoryScores(['obj-guia', 'guia-hogar']).hogar).toBe(2)
  })

  it('selectTopCategory with obj-guia + guia-gym returns gym', () => {
    const scores = calculateCategoryScores(['obj-guia', 'guia-gym'])
    expect(selectTopCategory(scores)).toBe('gym')
  })
})

describe('selectTopCategory edge cases', () => {
  it('all-zero scores returns null, not a crash', () => {
    expect(() => selectTopCategory(calculateCategoryScores(['obj-guia']))).not.toThrow()
    expect(selectTopCategory(calculateCategoryScores(['obj-guia']))).toBeNull()
  })

  it('informational-only profile returns null', () => {
    const scores = calculateCategoryScores(['prefiere-natural', 'rutina-simple', 'presupuesto-bajo', 'sin-condicion'])
    expect(selectTopCategory(scores)).toBeNull()
  })
})

describe('safety flags do not prevent routing', () => {
  it('cond-embarazo + obj-belleza still routes to piel', () => {
    const scores = calculateCategoryScores(['cond-embarazo', 'obj-belleza', 'foco-piel'])
    expect(selectTopCategory(scores)).toBe('piel')
  })

  it('all cond-* slugs + obj-bienestar still scores bienestar', () => {
    const scores = calculateCategoryScores([
      'cond-embarazo', 'cond-medicamentos', 'cond-medica', 'cond-reacciones', 'cond-sintomas',
      'obj-bienestar',
    ])
    expect(scores.bienestar).toBeGreaterThan(0)
  })
})
