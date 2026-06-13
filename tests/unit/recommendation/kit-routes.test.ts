import { describe, it, expect } from 'vitest'
import { calculateCategoryScores, selectTopCategory } from '@/lib/recommendation/score'
import { extractSafetyFlags, needsHumanReview } from '@/lib/recommendation/safety'
import type { CategorySlug } from '@/lib/recommendation/types'

interface ProfileFixture {
  name: string
  slugs: string[]
  expectedTopCategory: CategorySlug
  expectedMinScore: number
  safetyNote?: string
  expectNeedsReview?: boolean
}

const PROFILES: ProfileFixture[] = [
  // ── Gym / Rendimiento ─────────────────────────────────────────────────────
  {
    name: 'P01 — Atleta de fuerza élite',
    slugs: ['obj-rendimiento', 'tipo-fuerza', 'nivel-elite', 'gym-fuerza', 'gym-recuperacion', 'sin-dolor'],
    expectedTopCategory: 'gym',
    expectedMinScore: 14,
  },
  {
    name: 'P02 — Cardio activo con dolor articular',
    slugs: ['obj-rendimiento', 'tipo-cardio', 'nivel-activo', 'gym-energia', 'dolor-frecuente'],
    expectedTopCategory: 'gym',
    expectedMinScore: 8,
  },
  {
    name: 'P03 — HIIT principiante',
    slugs: ['obj-rendimiento', 'tipo-hiit', 'nivel-principiante', 'gym-hidratacion'],
    expectedTopCategory: 'gym',
    expectedMinScore: 6,
  },
  {
    name: 'P04 — Rendimiento + dolor articular frecuente',
    slugs: ['obj-rendimiento', 'tipo-fuerza', 'nivel-alto', 'gym-articulaciones', 'dolor-frecuente'],
    expectedTopCategory: 'gym',
    expectedMinScore: 10,
  },
  // ── Belleza / Piel ────────────────────────────────────────────────────────
  {
    name: 'P05 — Cuidado facial antiedad',
    slugs: ['obj-belleza', 'foco-antiedad', 'piel-arrugas', 'piel-firmeza', 'piel-seca'],
    expectedTopCategory: 'piel',
    expectedMinScore: 12,
  },
  {
    name: 'P06 — Caída de cabello',
    slugs: ['obj-belleza', 'foco-cabello', 'cabello-caida'],
    expectedTopCategory: 'piel',
    expectedMinScore: 6,
  },
  {
    name: 'P07 — Piel grasa y poros',
    slugs: ['obj-belleza', 'foco-piel', 'piel-grasa', 'piel-poros'],
    expectedTopCategory: 'piel',
    expectedMinScore: 8,
  },
  {
    name: 'P08 — Colágeno (mujer embarazada)',
    slugs: ['obj-belleza', 'foco-colageno', 'cond-embarazo'],
    expectedTopCategory: 'piel',
    expectedMinScore: 4,
    safetyNote: 'pregnancy flag should be active',
  },
  // ── Bienestar ─────────────────────────────────────────────────────────────
  {
    name: 'P09 — Estrés diario severo',
    slugs: ['obj-bienestar', 'foco-estres', 'frecuencia-diaria'],
    expectedTopCategory: 'bienestar',
    expectedMinScore: 8,
  },
  {
    name: 'P10 — Insomnio frecuente',
    slugs: ['obj-bienestar', 'foco-sueno', 'frecuencia-diaria'],
    expectedTopCategory: 'bienestar',
    expectedMinScore: 8,
  },
  {
    name: 'P11 — Energía + pantallas',
    slugs: ['obj-bienestar', 'foco-energia', 'foco-pantallas', 'frecuencia-semanal'],
    expectedTopCategory: 'bienestar',
    expectedMinScore: 7,
  },
  {
    name: 'P12 — Bienestar con condición médica',
    slugs: ['obj-bienestar', 'foco-sueno-estres', 'cond-medica'],
    expectedTopCategory: 'bienestar',
    expectedMinScore: 6,
    expectNeedsReview: true,
  },
  // ── Digestivo ─────────────────────────────────────────────────────────────
  {
    name: 'P13 — Reset digestivo completo',
    slugs: ['obj-digestivo', 'digestivo-reset', 'digestivo-hinchazon'],
    expectedTopCategory: 'digestivo',
    expectedMinScore: 8,
  },
  {
    name: 'P14 — Estreñimiento con alergias',
    slugs: ['obj-digestivo', 'digestivo-estrenimiento', 'alerg-lactosa', 'alerg-gluten'],
    expectedTopCategory: 'digestivo',
    expectedMinScore: 5,
  },
  // ── Nutrición ─────────────────────────────────────────────────────────────
  {
    name: 'P15 — Vitaminas base (vegano)',
    slugs: ['obj-nutricion', 'nutricion-base', 'pref-vegano'],
    expectedTopCategory: 'bienestar',
    expectedMinScore: 6,
  },
  {
    name: 'P16 — Superalimentos andinos',
    slugs: ['obj-nutricion', 'nutricion-andino'],
    expectedTopCategory: 'digestivo',
    expectedMinScore: 4,
  },
  {
    name: 'P17 — Energía e inmunidad',
    slugs: ['obj-nutricion', 'nutricion-energia', 'nutricion-inmune'],
    expectedTopCategory: 'bienestar',
    expectedMinScore: 5,
  },
  // ── Solar ─────────────────────────────────────────────────────────────────
  {
    name: 'P18 — Kit solar de playa',
    slugs: ['obj-solar', 'solar-playa'],
    expectedTopCategory: 'solar',
    expectedMinScore: 7,
  },
  {
    name: 'P19 — Protección solar outdoor',
    slugs: ['obj-solar', 'solar-outdoor'],
    expectedTopCategory: 'solar',
    expectedMinScore: 6,
  },
  // ── Viaje ─────────────────────────────────────────────────────────────────
  {
    name: 'P20 — Viaje de aventura',
    slugs: ['obj-viaje', 'viaje-aventura'],
    expectedTopCategory: 'viaje',
    expectedMinScore: 6,
  },
  {
    name: 'P21 — Viaje largo internacional',
    slugs: ['obj-viaje', 'viaje-largo'],
    expectedTopCategory: 'viaje',
    expectedMinScore: 6,
  },
  // ── Hogar ─────────────────────────────────────────────────────────────────
  {
    name: 'P22 — Botiquín familiar completo',
    slugs: ['obj-hogar', 'hogar-familiar'],
    expectedTopCategory: 'hogar',
    expectedMinScore: 7,
  },
  // ── Pies/cuerpo ───────────────────────────────────────────────────────────
  {
    name: 'P23 — Callos y durezas',
    slugs: ['obj-pies-cuerpo', 'pies-durezas'],
    expectedTopCategory: 'pies-cuerpo',
    expectedMinScore: 7,
  },
  {
    name: 'P24 — Tensión muscular (gym overlap)',
    slugs: ['obj-pies-cuerpo', 'cuerpo-muscular'],
    expectedTopCategory: 'pies-cuerpo',
    expectedMinScore: 2,
  },
  // ── Orientación (obj-guia) ───────────────────────────────────────────────
  {
    name: 'P25 — Guía → piel',
    slugs: ['obj-guia', 'guia-piel'],
    expectedTopCategory: 'piel',
    expectedMinScore: 2,
  },
  {
    name: 'P26 — Guía → gym',
    slugs: ['obj-guia', 'guia-gym'],
    expectedTopCategory: 'gym',
    expectedMinScore: 2,
  },
]

describe('kit route profiles (26 profiles)', () => {
  for (const profile of PROFILES) {
    it(profile.name, () => {
      const scores = calculateCategoryScores(profile.slugs)
      const top = selectTopCategory(scores)

      expect(
        scores[profile.expectedTopCategory],
        `${profile.name}: expected ${profile.expectedTopCategory} score ≥ ${profile.expectedMinScore}, got ${scores[profile.expectedTopCategory]}`,
      ).toBeGreaterThanOrEqual(profile.expectedMinScore)

      expect(
        top,
        `${profile.name}: expected top=${profile.expectedTopCategory} but got top=${top}`,
      ).toBe(profile.expectedTopCategory)

      if (profile.safetyNote) {
        const flags = extractSafetyFlags(profile.slugs)
        if (profile.slugs.includes('cond-embarazo')) expect(flags.pregnancy).toBe(true)
        if (profile.slugs.includes('cond-medica'))   expect(flags.medicalCondition).toBe(true)
      }

      if (profile.expectNeedsReview) {
        const flags = extractSafetyFlags(profile.slugs)
        expect(needsHumanReview(flags), `${profile.name}: expected needsHumanReview=true`).toBe(true)
      }
    })
  }
})
