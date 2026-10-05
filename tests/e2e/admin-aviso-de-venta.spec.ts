import { expect, test, type Page } from '@playwright/test'

// US-004 · Enterarse de que entró un pedido
// docs/specs/ADMIN/enterarse-de-que-entro-un-pedido.md
//
// AC-004-05 · El panel dice cuántos pedidos están sin atender

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Un id reconocible, para que si algo queda colgado se sepa de dónde salió.
const ORDER_ID = 'a0000000-0000-4000-8000-00000000e2e5'
const ORDER_NUMBER = 'E2E-AVISO-1'

function cabeceras() {
  return {
    apikey: serviceKey!,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
}

async function borrarPedido() {
  await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${ORDER_ID}`, {
    method: 'DELETE',
    headers: cabeceras(),
  })
}

/** Un pedido pagado y sin despachar: exactamente lo que el recuento debe contar. */
async function crearPedidoPagado() {
  await borrarPedido()
  const respuesta = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: 'POST',
    headers: { ...cabeceras(), Prefer: 'return=representation' },
    body: JSON.stringify({
      id: ORDER_ID,
      order_number: ORDER_NUMBER,
      guest_email: 'e2e@ejemplo.test',
      guest_name: 'Pedido de prueba e2e',
      subtotal_cents: 10000,
      total_cents: 10000,
      status: 'paid',
    }),
  })
  if (!respuesta.ok) throw new Error(`no se pudo crear el pedido de prueba: ${respuesta.status} ${await respuesta.text()}`)
}

async function entrar(page: Page) {
  await page.goto('/login?next=/admin', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('form[data-auth-ready="true"]')).toBeVisible({ timeout: 30_000 })
  await page.getByPlaceholder('tu@email.com').fill(email!)
  await page.getByPlaceholder('Contraseña').fill(password!)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.waitForURL((u) => new URL(u).pathname.startsWith('/admin'), { timeout: 60_000 })
}

test.describe('US-004 · Enterarse de que entró un pedido', () => {
  test.skip(
    !email || !password || !supabaseUrl || !serviceKey,
    'Requiere cuenta admin y clave de servicio (ver docs/arquitectura/entorno-local.md)',
  )
  test.setTimeout(120_000)

  test.beforeEach(async ({ baseURL }) => {
    if (baseURL && /(^|\.)liora\.pe$/.test(new URL(baseURL).hostname)) {
      throw new Error('Este test escribe en la base: no puede correr contra producción')
    }
  })

  test.afterAll(async () => { await borrarPedido() })

  test('AC-004-05 el panel dice cuántos pedidos están sin atender y lleva a ellos', async ({ page }) => {
    await entrar(page)

    const campana = page.locator('a[href="/admin/pedidos"][data-sin-atender]')
    await expect(campana, 'el panel no muestra ningún recuento de pedidos sin atender').toBeVisible()
    const antes = Number(await campana.getAttribute('data-sin-atender'))

    await crearPedidoPagado()
    await page.reload({ waitUntil: 'domcontentloaded' })

    const despues = Number(await campana.getAttribute('data-sin-atender'))
    expect(despues, `el recuento no subió al entrar un pedido pagado (${antes} → ${despues})`).toBe(antes + 1)

    // No basta con que el número exista: tiene que verse.
    await expect(campana).toContainText(String(despues))

    // Y tiene que llevar a los pedidos, que es lo que se va a hacer al verlo.
    await campana.click()
    await page.waitForURL((u) => new URL(u).pathname === '/admin/pedidos', { timeout: 30_000 })
    await expect(page.getByText(ORDER_NUMBER)).toBeVisible({ timeout: 20_000 })
  })
})
