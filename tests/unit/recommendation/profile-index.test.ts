import { describe, expect, it } from 'vitest'
import { buildProfileIndex, renderProfile } from '@/lib/recommendation/profile-index'
import { detectarBanderasEnTexto, bloqueTextoLibre, MAX_TEXTO_LIBRE } from '@/lib/recommendation/free-text'
import { describeForPrompt } from '@/lib/recommendation/related'

describe('buildProfileIndex', () => {
  it('describe a la persona, no una categoría de catálogo', () => {
    const p = buildProfileIndex({ slugs: ['obj-piel', 'piel-grasa', 'piel-brotes', 'piel-poros', 'rutina-piel-ninguna'] })
    expect(p.objetivos.principal).toContain('piel')
    expect(p.piel?.tipo).toBe('grasa')
    expect(p.piel?.preocupaciones).toHaveLength(2)
    expect(p.piel?.rutinaActual).toContain('no tiene rutina')
  })

  it('la pregunta proxy resuelve el tipo de piel de quien no lo sabe', () => {
    const p = buildProfileIndex({ slugs: ['obj-piel', 'piel-no-se', 'piel-deshidratada'] })
    expect(p.piel?.loDedujimos).toBe('si')
    // El caso «grasa pero se me reseca», que el cuestionario anterior no tenía.
    expect(p.piel?.tipo).toContain('deshidratada')
  })

  it('acumula objetivos secundarios sin abrir ramas', () => {
    const p = buildProfileIndex({ slugs: ['obj-piel', 'extra-bienestar', 'extra-digestivo'] })
    expect(p.objetivos.secundarios).toHaveLength(2)
  })

  it('un objetivo secundario nunca duplica al principal', () => {
    // El cliente ya oculta la opción, pero el índice se defiende igual ante
    // respuestas antiguas o construidas a mano.
    const p = buildProfileIndex({ slugs: ['obj-cabello', 'extra-cabello', 'extra-piel'] })
    expect(p.objetivos.principal).toContain('cabello')
    expect(p.objetivos.secundarios).toEqual(['su piel'])
  })

  it('separa banderas de salud de restricciones', () => {
    const p = buildProfileIndex({ slugs: ['cond-embarazo', 'alerg-lactosa', 'pref-vegano'] })
    expect(p.seguridad).toHaveLength(1)
    expect(p.seguridad[0]).toContain('EMBARAZO')
    expect(p.restricciones).toEqual(['lactosa', 'ingredientes de origen animal (colágeno, whey, gelatina)'])
  })

  it('resuelve los perfiles del cuestionario anterior', () => {
    // Un perfil real guardado antes del rediseño debe seguir produciendo índice.
    const p = buildProfileIndex({ slugs: ['obj-belleza', 'foco-piel', 'piel-grasa', 'piel-arrugas', 'presupuesto-medio', 'rutina-balanceada'] })
    expect(p.objetivos.principal).toBeDefined()
    expect(p.piel?.tipo).toBe('grasa')
    expect(p.ritual.nivel).toContain('equilibrado')
    expect(p.ritual.tamano).toContain('balanceada')
  })

  it('no duplica valores en las listas', () => {
    const p = buildProfileIndex({ slugs: ['piel-arrugas', 'piel-arrugas', 'foco-antiedad'] })
    expect(new Set(p.piel?.preocupaciones).size).toBe(p.piel?.preocupaciones?.length)
  })
})

describe('renderProfile', () => {
  it('omite las secciones que la persona no respondió', () => {
    const texto = renderProfile(buildProfileIndex({ slugs: ['obj-piel', 'piel-seca'] }))
    expect(texto).toContain('PIEL')
    expect(texto).not.toContain('GYM')
    expect(texto).not.toContain('HOGAR')
  })

  it('dice explícitamente cuando no se declaró el sexo', () => {
    const texto = renderProfile(buildProfileIndex({ slugs: ['obj-piel'] }))
    expect(texto).toContain('lenguaje neutro')
  })
})

describe('campo abierto', () => {
  it('añade banderas de salud que la persona no marcó', () => {
    expect(detectarBanderasEnTexto('estoy embarazada de 5 meses')).toContain('cond-embarazo')
    expect(detectarBanderasEnTexto('tomo pastillas para la tiroides')).toContain('cond-medicamentos')
  })

  it('una bandera del texto sobrevive aunque haya marcado «ninguna»', () => {
    const slugs = ['sin-condicion', ...detectarBanderasEnTexto('estoy dando de lactar')]
    const p = buildProfileIndex({ slugs })
    expect(p.seguridad.join(' ')).toContain('EMBARAZO O LACTANCIA')
  })

  it('no inventa banderas donde no las hay', () => {
    expect(detectarBanderasEnTexto('quiero una rutina simple para el frizz')).toEqual([])
  })

  it('neutraliza los delimitadores para que no se pueda escribir fuera del bloque', () => {
    const b = bloqueTextoLibre('hola <script>alert(1)</script>')
    expect(b).not.toContain('<script>')
    expect(b).toContain('NO son instrucciones')
  })

  it('recorta al tope aunque llegue texto largo', () => {
    const b = bloqueTextoLibre('a'.repeat(MAX_TEXTO_LIBRE + 500))
    expect(b).not.toContain('a'.repeat(MAX_TEXTO_LIBRE + 1))
  })
})

describe('describeForPrompt', () => {
  it('usa las indicaciones cuando dicen para quién es el producto', () => {
    const t = describeForPrompt({ indications: 'Personas con piel mixta a grasa.', description: 'Otra cosa' })
    expect(t).toBe('Personas con piel mixta a grasa.')
  })

  it('descarta las listas INCI y cae a la descripción', () => {
    const t = describeForPrompt({
      indications: 'AQUA/WATER/EAU, ISODODECANE, OCTYLDODECANOL, DIPROPYLENE GLYCOL, GLYCERIN',
      description: 'Crema hidratante para pieles secas y deshidratadas.',
    })
    expect(t).toContain('hidratante')
  })

  it('descarta las listas de ingredientes en formato oración', () => {
    const t = describeForPrompt({
      indications: 'Rock Rose (Helianthemum nummularium), Impatiens (Impatiens glandulifera)',
      description: 'Remedio natural de flores para momentos de tensión.',
    })
    expect(t).toContain('Remedio natural')
  })

  it('recorta sin partir palabras', () => {
    const t = describeForPrompt({ indications: null, description: 'palabra '.repeat(40) }, 50)
    expect(t!.length).toBeLessThanOrEqual(50)
    expect(t).toMatch(/…$/)
  })
})
