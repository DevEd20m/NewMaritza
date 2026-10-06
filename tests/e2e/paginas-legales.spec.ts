import { expect, test, type Page } from '@playwright/test'

// US-005 · Saber con quién se compra y bajo qué condiciones
// docs/specs/TIENDA/saber-con-quien-se-compra.md

/** Los enlaces del pie, leídos del propio pie: así el test cubre los que se añadan después. */
async function enlacesDelPie(page: Page): Promise<string[]> {
  const hrefs = await page.locator('footer a[href^="/"]').evaluateAll((nodos) =>
    nodos.map((n) => (n as HTMLAnchorElement).getAttribute('href') ?? ''),
  )
  // Se normalizan las anclas: /ayuda#envios y /ayuda son la misma página.
  return [...new Set(hrefs.map((h) => h.split('#')[0]).filter(Boolean))]
}

test.describe('US-005 · Saber con quién se compra y bajo qué condiciones', () => {
  test.setTimeout(120_000)

  test('AC-005-01 todo enlace del pie de página lleva a una página real', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const rutas = await enlacesDelPie(page)
    expect(rutas.length, 'el pie no tiene enlaces internos que comprobar').toBeGreaterThan(3)

    // En paralelo: todas estas páginas son `force-dynamic` y cada una consulta la base, así
    // que en serie el recorrido completo no cabe en el tiempo de un test.
    const estados = await Promise.all(
      rutas.map(async (ruta) => ({ ruta, estado: (await request.get(ruta, { maxRedirects: 5 })).status() })),
    )
    const rotos = estados.filter((r) => r.estado >= 400).map((r) => `${r.ruta} → ${r.estado}`)
    expect(rotos, `el pie enlaza páginas que no existen: ${rotos.join(', ')}`).toEqual([])
  })

  test('AC-005-02 las condiciones identifican quién vende', async ({ page }) => {
    await page.goto('/terminos', { waitUntil: 'domcontentloaded' })
    const texto = await page.locator('[data-legal-doc]').innerText()

    expect(texto, 'falta el RUC del proveedor').toMatch(/RUC\s*\d{11}/)
    expect(texto, 'falta el nombre del proveedor').toContain('José Edmundo Prado Astucuri')
    expect(texto, 'falta el domicilio fiscal').toMatch(/domicilio fiscal/i)
  })

  test('AC-005-02 los datos del proveedor están en letra menor, pero legibles', async ({ page }) => {
    await page.goto('/terminos', { waitUntil: 'domcontentloaded' })
    const legal = page.locator('[data-legal="proveedor"]')
    await expect(legal).toBeVisible()

    const tamaño = await legal.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    const cuerpo: number = await page.locator('[data-legal-body]').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

    expect(tamaño, 'los datos del proveedor no son más pequeños que el cuerpo').toBeLessThan(cuerpo)
    // La ley pide que el proveedor sea identificable: pequeño sí, ilegible no.
    expect(tamaño, 'los datos del proveedor son demasiado pequeños para leerse').toBeGreaterThanOrEqual(11)
  })

  test('AC-005-03 las condiciones y la privacidad dicen cuándo se actualizaron', async ({ page }) => {
    for (const ruta of ['/terminos', '/privacidad']) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' })
      await expect(
        page.locator('[data-actualizado]').first(),
        `${ruta} no dice cuándo se actualizó`,
      ).toBeVisible()
    }
  })

  test('AC-005-04 la política de privacidad es alcanzable desde las condiciones', async ({ page }) => {
    await page.goto('/terminos', { waitUntil: 'domcontentloaded' })
    await page.locator('[data-legal-doc] a[href^="/privacidad"]').first().click()
    await page.waitForURL((u) => new URL(u).pathname === '/privacidad', { timeout: 30_000 })

    const texto = await page.locator('[data-legal-doc]').innerText()
    expect(texto, 'la política no habla de cookies').toMatch(/cookies/i)
    expect(texto, 'la política no cita la ley de protección de datos').toMatch(/29733/)
  })

  test('AC-005-05 los canales de atención son los mismos que usa el resto del sitio', async ({ page }) => {
    // El número vive en store_settings y el pie ya lo publica: esa es la fuente.
    await page.goto('/ayuda', { waitUntil: 'domcontentloaded' })
    const enAyuda = await page.locator('a[href^="https://wa.me/"], a[href^="/go/whatsapp"]').count()
    expect(enAyuda, 'la página de ayuda no publica WhatsApp').toBeGreaterThan(0)

    await page.goto('/contacto', { waitUntil: 'domcontentloaded' })
    const texto = await page.locator('[data-legal-doc]').innerText()
    expect(texto, 'contacto no publica el correo').toContain('hola@liora.pe')
    await expect(
      page.locator('[data-legal-doc] a[href^="/go/whatsapp"], [data-legal-doc] a[href^="https://wa.me/"]').first(),
      'contacto no ofrece WhatsApp',
    ).toBeVisible()
  })
})
