import { describe, expect, it } from 'vitest'
import { trackedWhatsAppHref } from '@/lib/analytics/whatsapp'

describe('trackedWhatsAppHref', () => {
  it('uses the controlled redirect and placement', () => {
    expect(trackedWhatsAppHref('floating')).toBe('/go/whatsapp?placement=floating')
  })

  it('encodes and limits the prefilled message', () => {
    const href = trackedWhatsAppHref('help', 'Hola, necesito ayuda con mi pedido')
    const url = new URL(href, 'https://liora.pe')
    expect(url.pathname).toBe('/go/whatsapp')
    expect(url.searchParams.get('placement')).toBe('help')
    expect(url.searchParams.get('message')).toBe('Hola, necesito ayuda con mi pedido')
  })
})
