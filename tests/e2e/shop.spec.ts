import { test, expect } from '@playwright/test'

test.describe('Shop page', () => {
  test('loads shop page', async ({ page }) => {
    await page.goto('/tienda')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('can toggle between kits and individual products', async ({ page }) => {
    await page.goto('/tienda')
    const individualBtn = page.locator('a[href="/tienda?modo=individual"]')
    await expect(individualBtn).toBeVisible()
    await individualBtn.click()
    await expect(page.url()).toContain('modo=individual')
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
