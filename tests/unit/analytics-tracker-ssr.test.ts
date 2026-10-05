import { afterEach, describe, expect, it, vi } from 'vitest'

// Regresión de AUD-006 (docs/auditoria/hallazgos.md#aud-006).
//
// `track()` empezaba leyendo `window.location.hostname` en un console.log de depuración, una línea
// ANTES del guard `typeof window === 'undefined'`. Dos consecuencias: cada evento se imprimía en la
// consola de cada visitante, y cualquier ruta que llamase a track() durante el renderizado en
// servidor habría lanzado ReferenceError. Lo segundo no llegó a ocurrir porque todas las llamadas
// salen de componentes cliente, pero la protección que el código creía tener no estaba donde creía.
//
// El entorno de Vitest de este proyecto es 'node', así que aquí `window` no existe: es exactamente
// la situación del renderizado en servidor.

describe('tracker de analítica en el servidor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('track() no revienta cuando no hay window', async () => {
    expect(typeof globalThis.window).toBe('undefined')
    const { track } = await import('@/lib/analytics/tracker')

    expect(() => track({ event: 'page_view' })).not.toThrow()
  })

  it('track() no escribe en la consola', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { track } = await import('@/lib/analytics/tracker')

    track({ event: 'page_view' })
    track({ event: 'add_to_cart' })

    expect(log).not.toHaveBeenCalled()
  })
})
