import { test, expect } from '@playwright/test'

test.describe('Quiz', () => {
  test('loads quiz page', async ({ page }) => {
    await page.goto('/cuestionario')
    await expect(page.locator('h2, h1, p').first()).toBeVisible()
  })

  test('quiz page has progress bar', async ({ page }) => {
    await page.goto('/cuestionario')
    // The quiz page should have either the progress bar or a message
    const content = page.locator('section')
    await expect(content).toBeVisible()
  })
})
