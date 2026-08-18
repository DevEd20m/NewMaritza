import { test, expect } from '@playwright/test'

test.describe('Shop page', () => {
  test('loads shop page', async ({ page }) => {
    await page.goto('/tienda')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('shows kits and individual products sections', async ({ page }) => {
    await page.goto('/tienda')
    await expect(page.locator('#kits-base')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Productos sueltos' })).toBeVisible()
  })

  test('product detail page loads', async ({ page }) => {
    await page.goto('/tienda')
    const firstProduct = page.locator('article a').first()
    if (await firstProduct.isVisible()) {
      await firstProduct.click()
      await expect(page.locator('h1')).toBeVisible()
    }
  })
})
