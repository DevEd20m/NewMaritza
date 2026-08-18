import { expect, test } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
const customerEmail = process.env.E2E_CUSTOMER_EMAIL
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD

test('una sesión anónima es redirigida al login', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin|\/login\?next=\/admin/)
})

test.describe('Acceso administrativo', () => {
  test.skip(!email || !password, 'Requiere la cuenta admin exclusiva de staging')

  test.beforeEach(async ({ baseURL }) => {
    if (baseURL && /(^|\.)liora\.pe$/.test(new URL(baseURL).hostname)) throw new Error('Las credenciales E2E admin no pueden ejecutarse contra producción')
  })

  test('un solo login abre el panel y la sesión sobrevive al refresh', async ({ page }) => {
    await page.goto('/login?next=/admin')
    await page.getByPlaceholder('tu@email.com').fill(email!)
    await page.getByPlaceholder('Contraseña').fill(password!)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await expect(page).toHaveURL(/\/admin(?:\/)?$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/\/admin(?:\/)?$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('la URL directa funciona con una sesión existente', async ({ page }) => {
    await page.goto('/login?next=/admin/analytics')
    await page.getByPlaceholder('tu@email.com').fill(email!)
    await page.getByPlaceholder('Contraseña').fill(password!)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL(/\/admin\/analytics/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin(?:\/)?$/)
  })

  test('un cliente sin rol admin no puede abrir el panel', async ({ page }) => {
    test.skip(!customerEmail || !customerPassword, 'Requiere cuenta customer de staging')
    await page.goto('/login?next=/admin')
    await page.getByPlaceholder('tu@email.com').fill(customerEmail!)
    await page.getByPlaceholder('Contraseña').fill(customerPassword!)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
