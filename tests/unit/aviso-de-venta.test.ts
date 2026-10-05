import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// US-004 · Enterarse de que entró un pedido
// docs/specs/ADMIN/enterarse-de-que-entro-un-pedido.md
//
// AC-004-03 · El aviso trae lo necesario para atender el pedido
// AC-004-04 · El destinatario del aviso se puede cambiar sin tocar el código

import { adminNewOrderEmail } from '@/lib/email/templates/admin-new-order'
import { adminNotificationRecipient } from '@/lib/email/admin-recipient'

const pedido = {
  orderNumber: 'LIO-10234',
  customerName: 'Rosa Quispe',
  customerEmail: 'rosa@ejemplo.pe',
  customerPhone: '+51 987 654 321',
  items: [
    { product_name_snapshot: 'Colágeno con Biotina', variant_name_snapshot: '500 g', quantity: 2, unit_price_cents: 8900 },
    { product_name_snapshot: 'Magnesio', variant_name_snapshot: '60 cápsulas', quantity: 1, unit_price_cents: 4500 },
  ],
  totalCents: 22300,
  shipping: {
    addressLine1: 'Av. Larco 1234, dpto 502',
    district: 'Miraflores',
    city: 'Lima',
  },
  adminUrl: 'https://liora.pe/admin/pedidos',
  placedAt: '2026-10-04T14:32:00.000Z',
}

describe('AC-004-03 el aviso trae lo necesario para atender el pedido', () => {
  it('AC-004-03 lleva el número de pedido en el asunto, para distinguirlo en la bandeja', () => {
    const { subject } = adminNewOrderEmail(pedido)
    expect(subject).toContain('LIO-10234')
  })

  it('AC-004-03 identifica a quien compró y cómo contactarle', () => {
    const { html } = adminNewOrderEmail(pedido)
    expect(html).toContain('Rosa Quispe')
    expect(html).toContain('rosa@ejemplo.pe')
    expect(html).toContain('987 654 321')
  })

  it('AC-004-03 detalla qué compró, con cantidades', () => {
    const { html } = adminNewOrderEmail(pedido)
    expect(html).toContain('Colágeno con Biotina')
    expect(html).toContain('Magnesio')
    expect(html).toMatch(/2\s*×|×\s*2/)
  })

  it('AC-004-03 muestra el total', () => {
    // formatPEN omite los céntimos cuando son cero, a propósito: S/ 223, no S/ 223.00.
    const { html } = adminNewOrderEmail(pedido)
    expect(html).toMatch(/S\/\s?223(?![\d.])/)
  })

  it('AC-004-03 muestra los céntimos cuando los hay', () => {
    const { html } = adminNewOrderEmail({ ...pedido, totalCents: 22350 })
    expect(html).toMatch(/S\/\s?223\.50/)
  })

  it('AC-004-03 incluye los datos de entrega, que es lo que hay que leer para despachar', () => {
    const { html } = adminNewOrderEmail(pedido)
    expect(html).toContain('Av. Larco 1234, dpto 502')
    expect(html).toContain('Miraflores')
  })

  it('AC-004-03 enlaza al pedido en el panel', () => {
    const { html } = adminNewOrderEmail(pedido)
    expect(html).toContain('https://liora.pe/admin/pedidos')
  })

  it('AC-004-03 no se rompe cuando el pedido no trae teléfono ni dirección', () => {
    const { html } = adminNewOrderEmail({
      ...pedido,
      customerPhone: null,
      shipping: null,
    })
    expect(html).toContain('LIO-10234')
    expect(html).not.toContain('undefined')
    expect(html).not.toContain('null')
  })

  it('AC-004-03 escapa el contenido que viene del cliente', () => {
    const { html } = adminNewOrderEmail({
      ...pedido,
      customerName: '<script>alert(1)</script>',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('AC-004-04 el destinatario se puede cambiar sin tocar el código', () => {
  const original = process.env.ADMIN_NOTIFICATION_EMAIL

  beforeEach(() => { delete process.env.ADMIN_NOTIFICATION_EMAIL })
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_NOTIFICATION_EMAIL
    else process.env.ADMIN_NOTIFICATION_EMAIL = original
  })

  it('AC-004-04 usa la dirección configurada en el entorno', () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = 'pedidos@liora.pe'
    expect(adminNotificationRecipient()).toBe('pedidos@liora.pe')
  })

  it('AC-004-04 sin configurar, cae en la dirección de contacto del negocio', () => {
    expect(adminNotificationRecipient()).toBe('hola@liora.pe')
  })

  it('AC-004-04 ignora un valor en blanco en vez de enviar a ninguna parte', () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = '   '
    expect(adminNotificationRecipient()).toBe('hola@liora.pe')
  })
})
