import { test, expect } from '@playwright/test'

// Recorridos del cuestionario rediseñado. Comprueban lo que solo existe al
// avanzar: el árbol de ramas, el campo abierto y el botón de saltar.

type Page = import('@playwright/test').Page

/** Avanza sin responder: la pantalla es opcional o de texto libre. */
async function avanzar(page: Page) {
  await page.getByRole('button', { name: /Siguiente|Saltar|Ver mi kit/ }).click()
  await page.waitForTimeout(250)
}

async function elegir(page: Page, texto: string | RegExp) {
  await page.getByRole('button', { name: texto, exact: false }).first().click()
  await avanzar(page)
}

test.describe('Cuestionario rediseñado', () => {
  test('la primera pantalla separa piel de cabello y ofrece la salida de escape', async ({ page }) => {
    await page.goto('/cuestionario')
    await expect(page.getByRole('heading', { name: '¿Qué quieres cuidar hoy?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mi piel y mi rostro' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mi cabello' })).toBeVisible()
    await expect(page.getByRole('button', { name: /prefiero contarles con mis palabras/i })).toBeVisible()
  })

  test('la rama de piel pregunta tipo, preocupaciones y rutina actual', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, 'Mi piel y mi rostro')
    await elegir(page, 'Nada más por ahora')
    await expect(page.getByRole('heading', { name: '¿Cómo describirías tu piel?' })).toBeVisible()
    await elegir(page, 'Grasa: brilla')
    await expect(page.getByRole('heading', { name: '¿Qué te gustaría mejorar?' })).toBeVisible()
    await elegir(page, 'Granitos o brotes')
    await expect(page.getByRole('heading', { name: '¿Cómo es tu rutina hoy?' })).toBeVisible()
  })

  test('quien no sabe su tipo de piel recibe la pregunta proxy', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, 'Mi piel y mi rostro')
    await elegir(page, 'Nada más por ahora')
    await elegir(page, 'No estoy seguro/a')
    await expect(page.getByRole('heading', { name: /A media tarde/ })).toBeVisible()
    // El caso «grasa pero se me reseca», que antes no existía.
    await expect(page.getByRole('button', { name: /Brillosa y tirante a la vez/ })).toBeVisible()
  })

  test('la rama de cabello existe y es propia', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, 'Mi cabello')
    await elegir(page, 'Nada más por ahora')
    await expect(page.getByRole('heading', { name: '¿Cómo es tu cabello?' })).toBeVisible()
    await elegir(page, 'Rizado o afro')
    await expect(page.getByRole('heading', { name: '¿Y tu cuero cabelludo?' })).toBeVisible()
  })

  test('la segunda pregunta no repite el objetivo ya elegido', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, 'Mi cabello')
    await expect(page.getByRole('heading', { name: '¿Algo más que quieras trabajar?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mi cabello' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Mi piel y mi rostro' })).toBeVisible()
  })

  test('el campo abierto se muestra y se puede saltar', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, /prefiero contarles con mis palabras/)
    // Q1b no aparece en esta ruta: no hay objetivo declarado del que preguntar «¿algo más?».
    await expect(page.getByRole('heading', { name: 'Cuéntanos con tus palabras' })).toBeVisible()
    const campo = page.locator('textarea')
    await expect(campo).toBeVisible()
    // Al estar vacío el botón invita a saltar, no a seguir.
    await expect(page.getByRole('button', { name: 'Saltar' })).toBeVisible()
    const texto = 'Tengo la piel grasa pero se me reseca en las mejillas'
    await campo.fill(texto)
    await expect(page.getByText(`${texto.length} / 500`)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible()
  })

  test('el atajo de texto libre salta el árbol de ramas', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, /prefiero contarles con mis palabras/)
    await expect(page.getByRole('heading', { name: 'Cuéntanos con tus palabras' })).toBeVisible()
    // Justo después del campo abierto viene la pantalla de salud: ninguna rama.
    await avanzar(page)
    await expect(page.getByRole('heading', { name: /Hay algo de tu salud/ })).toBeVisible()
  })

  test('el progreso sobrevive a una recarga', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, 'Mi piel y mi rostro')
    await elegir(page, 'Nada más por ahora')
    await expect(page.getByRole('heading', { name: '¿Cómo describirías tu piel?' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: '¿Cómo describirías tu piel?' })).toBeVisible()
  })
})

// Envío completo — escribe en la BD real, así que solo corre bajo bandera
// explícita, igual que quiz-email.spec.ts.
const runSubmit = process.env.RUN_QUIZ_E2E === '1'
test.describe('Envío del cuestionario', () => {
  test.skip(!runSubmit, 'exportar RUN_QUIZ_E2E=1 para correr el envío real')

  test('la ruta de texto libre llega al carrito', async ({ page }) => {
    await page.goto('/cuestionario')
    await elegir(page, /prefiero contarles con mis palabras/)
    await page.locator('textarea').fill('Prueba e2e: piel grasa que se reseca en las mejillas, probé retinol y me irritó.')
    await avanzar(page)
    await elegir(page, 'Nada de lo siguiente')
    await elegir(page, 'Ninguna')
    await avanzar(page)   // edad: se puede saltar
    await avanzar(page)   // sexo: se puede saltar
    await page.getByRole('button', { name: 'Un ritual equilibrado' }).click()
    await page.getByRole('button', { name: 'Ver mi kit' }).click()
    // Pantalla de captura de correo
    await page.getByPlaceholder(/correo|email/i).fill(`e2e+${Date.now()}@liora.test`)
    await page.getByRole('button', { name: /Ver mi kit|kit/i }).last().click()
    await page.waitForURL(/\/carrito\?profileId=/, { timeout: 30000 })
  })
})
