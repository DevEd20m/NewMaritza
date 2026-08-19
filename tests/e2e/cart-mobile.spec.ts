import { expect, test, type Page } from '@playwright/test'

const profileId = '11111111-1111-4111-8111-111111111111'
const sourceVariantId = '22222222-2222-4222-8222-222222222222'
const secondVariantId = '33333333-3333-4333-8333-333333333333'
const replacementVariantId = '44444444-4444-4444-8444-444444444444'

const kitResponse = {
  routineName: 'Rutina Protección Solar',
  diagnosis: 'Una rutina pensada para proteger e hidratar tu piel durante todo el día.',
  tags: ['protección solar', 'rutina equilibrada'],
  routineSlug: 'proteccion-solar',
  kit: [
    {
      variantId: sourceVariantId,
      productId: '55555555-5555-4555-8555-555555555555',
      name: 'FRASCO 50 ML Protector Solar Facial en Gel Crema Eucerin Oil Control FPS50+',
      brand: 'Eucerin',
      variantName: 'Frasco 50 ml',
      categoryName: 'Protección solar',
      priceCents: 9000,
      currency: 'PEN',
      imageUrl: null,
      categoryColor: '#f8d75a',
      stockQuantity: null,
      stepLabel: 'Protección solar facial',
      stepWhen: '🌅 Mañana',
      stepInstruction: 'Aplica una cantidad generosa sobre el rostro y cuello antes de salir al sol.',
    },
    {
      variantId: secondVariantId,
      productId: '66666666-6666-4666-8666-666666666666',
      name: 'Crema Hidratante CeraVe Piel Seca a Muy Seca con nombre especialmente largo',
      brand: 'CeraVe',
      variantName: 'Unidad',
      categoryName: 'Cuidado de la piel',
      priceCents: 6900,
      currency: 'PEN',
      imageUrl: null,
      categoryColor: '#f4b6ad',
      stockQuantity: 4,
      stepLabel: 'Hidratación profunda',
      stepWhen: '🌅 Mañana',
      stepInstruction: 'Aplica una capa delgada después del protector.',
    },
  ],
  suggestions: Array.from({ length: 4 }, (_, index) => ({
    variantId: `77777777-7777-4777-8777-77777777777${index}`,
    productId: `88888888-8888-4888-8888-88888888888${index}`,
    name: `Producto complementario de nombre largo ${index + 1}`,
    brand: 'LIORA',
    variantName: 'Unidad',
    categoryName: 'Cuidado de la piel',
    priceCents: 3000 + index * 500,
    currency: 'PEN',
    imageUrl: null,
    categoryColor: '#f6c1bc',
    stockQuantity: null,
  })),
}

async function openMockedKit(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 })
  await page.addInitScript(() => localStorage.clear())
  await page.route('**/api/kit/recommend**', (route) => route.fulfill({ json: kitResponse }))
  await page.goto(`/carrito?profileId=${profileId}`)
  await expect(page.getByText('Rutina Protección Solar', { exact: true })).toBeVisible()
}

for (const width of [320, 360, 390, 412, 768]) {
  test(`personalized cart fits a ${width}px viewport`, async ({ page }) => {
    await openMockedKit(page, width)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    const removeButtons = page.getByRole('button', { name: /^Quitar / })
    await expect(removeButtons).toHaveCount(2)
    for (const button of await removeButtons.all()) {
      await expect(button).toBeVisible()
      const box = await button.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
    }
  })
}

test('Lía suggests and applies a confirmed catalog replacement', async ({ page }) => {
  await openMockedKit(page, 390)
  await page.route('**/api/kit/chat', (route) => route.fulfill({
    json: {
      conversationId: '99999999-9999-4999-8999-999999999999',
      messageId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      reply: 'Encontré una alternativa disponible en LIORA con menor precio.',
      suggestions: [{
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        sourceVariantId,
        quantity: 1,
        reason: 'Alternativa de Protección solar y ahorras S/45.',
        savingsCents: 4500,
        replacement: {
          variantId: replacementVariantId,
          productId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          name: 'Protector Solar LIORA Esencial',
          brand: 'LIORA',
          variantName: 'Frasco 50 ml',
          categoryName: 'Protección solar',
          priceCents: 4500,
          currency: 'PEN',
          imageUrl: null,
          categoryColor: '#f8d75a',
          stockQuantity: null,
          usageInstructions: 'Aplica siguiendo las instrucciones del envase.',
        },
      }],
    },
  }))
  await page.route('**/api/kit/chat/accept', (route) => route.fulfill({
    json: {
      sourceVariantId,
      replacement: {
        variantId: replacementVariantId,
        productId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        name: 'Protector Solar LIORA Esencial',
        brand: 'LIORA',
        variantName: 'Frasco 50 ml',
        categoryName: 'Protección solar',
        priceCents: 4500,
        currency: 'PEN',
        imageUrl: null,
        categoryColor: '#f8d75a',
        stockQuantity: null,
        usageInstructions: 'Aplica siguiendo las instrucciones del envase.',
      },
    },
  }))

  const input = page.getByPlaceholder('Pregúntame sobre tu kit…')
  await input.fill('¿Tienes algo más económico?')
  await input.press('Enter')
  await expect(page.getByText('Protector Solar LIORA Esencial')).toBeVisible()
  await page.getByRole('button', { name: 'Reemplazar' }).click()

  await expect(page.getByText('Listo, reemplacé el producto por Protector Solar LIORA Esencial.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reemplazado' })).toBeDisabled()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
