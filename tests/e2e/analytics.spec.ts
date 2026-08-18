import { expect, test } from '@playwright/test'

const enabled = process.env.RUN_ANALYTICS_E2E === '1'
const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.describe('Recorrido y WhatsApp', () => {
  test.skip(!enabled, 'RUN_ANALYTICS_E2E=1 habilita la prueba contra staging migrado')

  test('crea un recorrido anónimo y atribuye la apertura de WhatsApp', async ({ page }) => {
    await page.goto('/')
    const accept = page.getByRole('button', { name: 'Aceptar' })
    if (await accept.isVisible().catch(() => false)) await accept.click()
    const tiendaTracked = page.waitForResponse(response => {
      if (!response.url().includes('/api/track') || response.status() !== 204) return false
      const payload = response.request().postDataJSON() as { events?: Array<{ path?: string }> } | null
      return payload?.events?.some(event => event.path === '/tienda') ?? false
    })
    await page.goto('/tienda')
    await tiendaTracked

    const whatsapp = page.getByLabel('Contactar por WhatsApp')
    await expect(whatsapp).toBeVisible({ timeout: 8_000 })
    const href = await whatsapp.getAttribute('href')
    expect(href).toContain('/go/whatsapp?placement=floating')
    const redirect = await page.request.get(href!, { maxRedirects: 0 })
    expect(redirect.status()).toBe(302)
    const location = redirect.headers().location
    expect(location).toContain('wa.me')
    expect(decodeURIComponent(location)).toMatch(/Ref\. LIO-[A-F0-9]{6}/)

    if (!email || !password) return
    const code = decodeURIComponent(location).match(/LIO-[A-F0-9]{6}/)?.[0]
    await page.goto('/login?next=/admin/analytics')
    await page.getByPlaceholder('tu@email.com').fill(email)
    await page.getByPlaceholder('Contraseña').fill(password)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.goto(`/admin/analytics?dias=1&q=${code}&whatsapp=1`)
    await expect(page.getByText(code!)).toBeVisible()
  })

  test('desactivar analítica persiste la preferencia', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Configurar' }).click()
    await page.getByRole('button', { name: 'Desactivar' }).click()
    await expect.poll(async () => page.context().cookies().then(cookies => cookies.find(cookie => cookie.name === 'liora_analytics_preference')?.value)).toBe('optout')
  })
})
