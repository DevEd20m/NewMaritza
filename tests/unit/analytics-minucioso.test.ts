// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { visibleText } from '@/lib/analytics/tracker'
import { ANALYTICS_EVENTS, trackedEventSchema, sanitizeAnalyticsMetadata } from '@/lib/analytics/schema'

describe('visibleText — nombres legibles en vez de posicionales', () => {
  const btn = (html: string) => {
    const el = document.createElement('button')
    el.innerHTML = html
    return el
  }

  it('convierte el texto visible en un id estable', () => {
    expect(visibleText(btn('Agregar al carrito'))).toBe('agregar-al-carrito')
    expect(visibleText(btn('Ver mi kit personalizado'))).toBe('ver-mi-kit-personalizado')
  })

  it('quita precios y cantidades para que el id no cambie entre renders', () => {
    expect(visibleText(btn('Agregar — S/49.90'))).toBe('agregar')
    expect(visibleText(btn('Cargar más productos (120)'))).toBe('cargar-mas-productos')
  })

  it('quita acentos y símbolos', () => {
    expect(visibleText(btn('Cuéntanos más ✨'))).toBe('cuentanos-mas')
  })

  it('devuelve null si no hay texto útil (cae al siguiente fallback)', () => {
    expect(visibleText(btn(''))).toBeNull()
    expect(visibleText(btn('✕'))).toBeNull()
  })
})

describe('eventos de negocio nuevos', () => {
  const base = { event_id: '11111111-1111-4111-8111-111111111111', occurred_at: new Date().toISOString() }

  it.each(['kit_shown', 'view_item_list', 'lead_captured', 'coupon_applied', 'coupon_rejected',
    'coupon_copied', 'exit_modal_shown', 'exit_modal_dismissed', 'assistant_opened',
    'assistant_closed', 'filter_applied', 'sort_changed', 'search_result_click'] as const)(
    'el esquema acepta %s', (event) => {
      expect(ANALYTICS_EVENTS).toContain(event)
      expect(trackedEventSchema.safeParse({ ...base, event }).success).toBe(true)
    })

  it('la metadata de kit_shown pasa el sanitizador con su lista de productos', () => {
    const out = sanitizeAnalyticsMetadata({
      routine: 'Rutina Piel Grasa', products: ['gel-limpiador', 'crema-hidratante'], count: 2, engine: 'ia',
    })
    expect(out.products).toEqual(['gel-limpiador', 'crema-hidratante'])
    expect(out.routine).toBe('Rutina Piel Grasa')
  })

  it('lead_captured jamás transporta el correo aunque se intente', () => {
    const out = sanitizeAnalyticsMetadata({ source: 'quiz', con_celular: true, email: 'x@y.com', lead_email: 'x@y.com' })
    expect(out).toEqual({ source: 'quiz', con_celular: true })
  })
})
