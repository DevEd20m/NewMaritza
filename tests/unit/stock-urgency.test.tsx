import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StockUrgency } from '@/components/urgency/StockUrgency'

describe('StockUrgency', () => {
  it('mantiene un CTA para stock ilimitado sin inventar unidades', () => {
    const html = renderToStaticMarkup(<StockUrgency stockQuantity={null} />)
    expect(html).toContain('Disponible ahora · Lima 36–48 h')
    expect(html).toContain('Pídelo hoy')
    expect(html).not.toContain('Solo quedan')
  })

  it('muestra la cantidad real cuando el stock finito es bajo', () => {
    const html = renderToStaticMarkup(<StockUrgency stockQuantity={2} />)
    expect(html).toContain('Solo quedan 2 unidades')
  })
})
