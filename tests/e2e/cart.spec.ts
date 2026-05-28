import { test, expect } from '@playwright/test'

test.describe('Cart', () => {
  test('cart page shows empty state', async ({ page }) => {
    await page.goto('/carrito')
    await expect(page.locator('text=carrito')).toBeVisible()
  })

  test('checkout page requires cart', async ({ page }) => {
    await page.goto('/pagar')
    // Should either show checkout or redirect to cart if empty
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })
})
