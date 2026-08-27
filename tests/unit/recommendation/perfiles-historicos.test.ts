import { describe, expect, it } from 'vitest'
import { buildProfileIndex, renderProfile } from '@/lib/recommendation/profile-index'
import { calculateCategoryScores, selectTopCategory } from '@/lib/recommendation/score'

// Los perfiles que ya están guardados en producción se resolvieron con el
// cuestionario anterior. El rediseño no puede romperlos: sus respuestas
// referencian UUIDs de preguntas que ahora están ocultas, pero el motor las
// sigue resolviendo por id y sus slugs deben seguir produciendo un perfil útil.
// Estos son los conjuntos de slugs reales, extraídos de quiz_profiles.
const PERFILES_HISTORICOS: string[][] = [
  // 2026-06-12 — perfil real de producción
  ["foco-piel", "obj-belleza", "piel-arrugas", "piel-grasa", "presupuesto-medio", "sin-sensibilidad"],
  // 2026-06-12 — perfil real de producción
  ["foco-piel", "obj-belleza", "piel-arrugas", "piel-grasa", "presupuesto-medio", "sin-sensibilidad"],
  // 2026-07-16 — perfil real de producción
  ["digestivo-hinchazon", "digestivo-reflujo", "obj-digestivo", "prefiere-natural", "presupuesto-premium", "rutina-guiada", "sin-condicion", "sin-restriccion"],
  // 2026-07-18 — perfil real de producción
  ["obj-viaje", "prefiere-natural", "presupuesto-bajo", "rutina-balanceada", "sin-condicion", "sin-restriccion", "viaje-aventura"],
  // 2026-07-18 — perfil real de producción
  ["obj-viaje", "prefiere-natural", "presupuesto-bajo", "rutina-balanceada", "sin-condicion", "viaje-aventura"],
  // 2026-08-18 — perfil real de producción
  ["foco-piel", "natural-importante", "obj-belleza", "piel-grasa", "piel-poros", "presupuesto-medio", "rutina-balanceada", "sin-condicion", "sin-sensibilidad"],
  // 2026-08-19 — perfil real de producción
  ["natural-importante", "obj-solar", "presupuesto-medio", "rutina-balanceada", "sin-condicion", "solar-diario"],
  // 2026-08-19 — perfil real de producción
  ["digestivo-hinchazon", "obj-digestivo", "prefiere-natural", "presupuesto-medio", "rutina-balanceada", "sin-condicion"],
  // 2026-08-19 — perfil real de producción
  ["foco-piel", "obj-belleza", "piel-grasa", "piel-manchas", "prefiere-natural", "presupuesto-bajo", "rutina-simple", "sin-condicion", "sin-sensibilidad"],
  // 2026-08-19 — perfil real de producción
  ["cabello-caida", "foco-cabello", "natural-importante", "obj-belleza", "piel-rojeces", "presupuesto-alto", "rutina-balanceada", "sin-condicion"],
  // 2026-08-24 — perfil real de producción
  ["foco-piel", "obj-belleza", "piel-manchas", "piel-rojeces", "piel-seca", "prefiere-natural", "presupuesto-medio", "rutina-completa", "sin-condicion"],
  // 2026-08-25 — perfil real de producción
  ["foco-piel", "obj-belleza", "piel-arrugas", "piel-grasa", "prefiere-natural", "presupuesto-alto", "rutina-completa", "sin-condicion", "sin-sensibilidad"],
  // 2026-08-27 — perfil real de producción
  ["foco-piel", "obj-belleza", "piel-firmeza", "piel-normal", "prefiere-natural", "presupuesto-bajo", "rutina-balanceada", "sin-condicion", "sin-sensibilidad"],]

describe('compatibilidad con perfiles guardados', () => {
  it('los 13 perfiles de producción siguen produciendo un índice utilizable', () => {
    for (const slugs of PERFILES_HISTORICOS) {
      const p = buildProfileIndex({ slugs })
      expect(p.objetivos.principal, `sin objetivo: ${slugs.join(',')}`).toBeDefined()
      expect(renderProfile(p).length).toBeGreaterThan(40)
    }
  })

  it('ninguno se queda sin categoría para el fallback', () => {
    for (const slugs of PERFILES_HISTORICOS) {
      expect(selectTopCategory(calculateCategoryScores(slugs)), slugs.join(',')).not.toBeNull()
    }
  })

  it('conserva el nivel del ritual, que decide el presupuesto interno', () => {
    for (const slugs of PERFILES_HISTORICOS) {
      if (slugs.some(s => s.startsWith('presupuesto-'))) {
        expect(buildProfileIndex({ slugs }).ritual.nivel).toBeDefined()
      }
    }
  })
})
