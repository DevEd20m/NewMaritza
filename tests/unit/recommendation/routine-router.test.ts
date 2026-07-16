import { describe, it, expect } from 'vitest'
import { selectRoutineKit, DEFAULT_ROUTINE_SLUG, FALLBACK_DIAGNOSIS, FALLBACK_TAGS } from '@/lib/recommendation/kit-routes'
import { CATEGORY_SLUGS } from '@/lib/recommendation/types'

describe('selectRoutineKit — enrutador de rutinas curadas', () => {
  it('perfil real del bug (2026-07-15): digestión + reflujo + hinchazón → rutina digestiva', () => {
    // Slugs exactos del perfil 9d6f3b40-2565-42b3-a890-e03f838b254b que recibió
    // desodorante de pies + protector solar por el embed ambiguo
    const slugs = [
      'obj-digestivo', 'digestivo-reflujo', 'digestivo-hinchazon',
      'prefiere-natural', 'sin-restriccion', 'presupuesto-premium',
      'sin-condicion', 'rutina-guiada',
    ]
    const { kitSlug, topCategory } = selectRoutineKit(slugs)
    expect(topCategory).toBe('digestivo')
    expect(kitSlug).toBe('rutina-acidez-y-pesadez-estomacal')
  })

  it('piel sensible → rutina piel sensible', () => {
    const { kitSlug } = selectRoutineKit(['obj-belleza', 'foco-piel', 'piel-sensible'])
    expect(kitSlug).toBe('rutina-skin-care-piel-sensible')
  })

  it('piel con rojeces → rutina piel sensible', () => {
    const { kitSlug } = selectRoutineKit(['obj-belleza', 'foco-piel', 'piel-normal', 'piel-rojeces'])
    expect(kitSlug).toBe('rutina-skin-care-piel-sensible')
  })

  it('piel grasa → rutina piel grasa', () => {
    const { kitSlug } = selectRoutineKit(['obj-belleza', 'foco-piel', 'piel-grasa', 'piel-poros'])
    expect(kitSlug).toBe('rutina-skin-care-piel-grasa')
  })

  it('cabello → rutina piel grasa (default de belleza)', () => {
    const { kitSlug, topCategory } = selectRoutineKit(['obj-belleza', 'foco-cabello', 'cabello-caida'])
    expect(topCategory).toBe('piel')
    expect(kitSlug).toBe('rutina-skin-care-piel-grasa')
  })

  it('mal sueño → rutina sueño y descanso', () => {
    const { kitSlug } = selectRoutineKit(['obj-bienestar', 'foco-sueno', 'frecuencia-diaria'])
    expect(kitSlug).toBe('rutina-sueno-y-descanso')
  })

  it('sueño + estrés → rutina sueño y descanso', () => {
    const { kitSlug } = selectRoutineKit(['obj-bienestar', 'foco-sueno-estres', 'frecuencia-semanal'])
    expect(kitSlug).toBe('rutina-sueno-y-descanso')
  })

  it('pantallas → rutina oficina y pantallas', () => {
    const { kitSlug } = selectRoutineKit(['obj-bienestar', 'foco-pantallas'])
    expect(kitSlug).toBe('rutina-oficina-y-pantallas')
  })

  it('estrés → rutina estrés y calma', () => {
    const { kitSlug } = selectRoutineKit(['obj-bienestar', 'foco-estres', 'frecuencia-diaria'])
    expect(kitSlug).toBe('rutina-estres-y-calma-diaria')
  })

  it('nutrición → rutina de bienestar (no hay kit de vitaminas aún)', () => {
    const { kitSlug, topCategory } = selectRoutineKit(['obj-nutricion', 'nutricion-base', 'nutricion-inmune'])
    expect(topCategory).toBe('bienestar')
    expect(kitSlug).toBe('rutina-estres-y-calma-diaria')
  })

  it('gym → rutina gym y recuperación', () => {
    const { kitSlug } = selectRoutineKit(['obj-rendimiento', 'tipo-fuerza', 'nivel-alto', 'gym-fuerza'])
    expect(kitSlug).toBe('rutina-gym-y-recuperacion')
  })

  it('solar diario → rutina protector solar diario', () => {
    const { kitSlug } = selectRoutineKit(['obj-solar', 'solar-diario'])
    expect(kitSlug).toBe('rutina-protector-solar-diario')
  })

  it('solar playa → kit playa y outdoor', () => {
    const { kitSlug } = selectRoutineKit(['obj-solar', 'solar-playa'])
    expect(kitSlug).toBe('kit-protector-solar-playa-y-outdoor')
  })

  it('viaje → kit viaje esencial', () => {
    const { kitSlug } = selectRoutineKit(['obj-viaje', 'viaje-ciudad'])
    expect(kitSlug).toBe('kit-viaje-esencial')
  })

  it('hogar familiar → kit primeros auxilios familiar', () => {
    const { kitSlug } = selectRoutineKit(['obj-hogar', 'hogar-familiar'])
    expect(kitSlug).toBe('kit-primeros-auxilios-familiar')
  })

  it('hogar móvil → kit botiquín compacto', () => {
    const { kitSlug } = selectRoutineKit(['obj-hogar', 'hogar-movil'])
    expect(kitSlug).toBe('kit-botiquin-compacto')
  })

  it('pies → rutina pies perfectos', () => {
    const { kitSlug } = selectRoutineKit(['obj-pies-cuerpo', 'pies-durezas'])
    expect(kitSlug).toBe('rutina-pies-perfectos')
  })

  it('rozaduras corporales → rutina cuidado piel corporal', () => {
    const { kitSlug } = selectRoutineKit(['obj-pies-cuerpo', 'cuerpo-rozaduras'])
    expect(kitSlug).toBe('rutina-cuidado-piel-corporal')
  })

  it('obj-guia con sub-señal → rutina de esa categoría', () => {
    const { kitSlug } = selectRoutineKit(['obj-guia', 'guia-digestivo'])
    expect(kitSlug).toBe('rutina-acidez-y-pesadez-estomacal')
  })

  it('sin señal alguna → rutina default, nunca vacío', () => {
    const { kitSlug, topCategory } = selectRoutineKit(['sin-condicion', 'sin-restriccion', 'rutina-guiada'])
    expect(topCategory).toBeNull()
    expect(kitSlug).toBe(DEFAULT_ROUTINE_SLUG)
  })

  it('slugs desconocidos no rompen el enrutador', () => {
    const { kitSlug } = selectRoutineKit(['slug-inventado', 'otro-slug'])
    expect(kitSlug).toBe(DEFAULT_ROUTINE_SLUG)
  })

  it('toda categoría tiene diagnosis y tags de fallback', () => {
    for (const cat of CATEGORY_SLUGS) {
      expect(FALLBACK_DIAGNOSIS[cat]).toBeTruthy()
      expect(FALLBACK_TAGS[cat].length).toBeGreaterThan(0)
    }
  })
})
