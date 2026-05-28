import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('loads and shows LIORA brand', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=LIORA')).toBeVisible()
    await expect(page.locator('text=Hecho')).toBeVisible()
  })

  test('has CTA to cuestionario', async ({ page }) => {
    await page.goto('/')
    const cta = page.locator('a[href="/cuestionario"]').first()
    await expect(cta).toBeVisible()
  })

  test('announcement bar is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Envío gratis')).toBeVisible()
  })
})
