import { expect, test, type Page } from '@playwright/test'

// US-002 · Comprar desde el celular — docs/specs/TIENDA/comprar-desde-el-celular.md
//
// El ancho de referencia es 360 px; los criterios se comprueban además en los otros anchos
// declarados por la historia. 768 es el borde del breakpoint, donde más fácil se cuela un defecto.
const ANCHOS_ANGOSTOS = [320, 360, 390, 412, 768] as const
const ANCHO_REFERENCIA = 360

// Rutas públicas que se pueden abrir sin sesión, sin carrito y sin un pedido previo.
// Quedan fuera /pagar (exige carrito), /cuenta (exige sesión), /confirmado, /guia/[slug] y
// /mi-guia/[token] (exigen datos que no existen en un entorno limpio).
const RUTAS_PUBLICAS = [
  '/',
  '/tienda',
  '/carrito',
  '/cuestionario',
  '/ayuda',
  '/nosotros',
  '/tracking',
  '/login',
  '/privacidad',
] as const

/** Lo que sobra del documento respecto de la ventana. La convención ya la usa cart-mobile.spec.ts. */
async function desborde(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

/**
 * En desarrollo Next compila cada ruta la primera vez que se pide, y una navegación que llega
 * mientras tanto se aborta (`net::ERR_ABORTED`). Reintentar es parte de hablar con un servidor
 * de desarrollo, no del comportamiento que esta historia especifica.
 */
async function ir(page: Page, ruta: string) {
  await expect(async () => {
    await page.goto(ruta, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  }).toPass({ timeout: 90_000 })
  await page.waitForLoadState('load').catch(() => {})
}

/** Abre la ficha del primer producto del catálogo. El atributo lo pone ProductCard. */
async function abrirPrimeraFicha(page: Page, ancho: number) {
  await page.setViewportSize({ width: ancho, height: 800 })
  await ir(page, '/tienda')
  const primera = page.locator('[data-analytics-id^="product-card:"]').first()
  await expect(primera).toBeVisible({ timeout: 20_000 })
  await primera.click()
  await expect(page.locator('.liora-product-grid')).toBeVisible({ timeout: 20_000 })
}

function seSolapan(a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

test.describe('US-002 · Comprar desde el celular', () => {
  // En desarrollo Next compila cada ruta la primera vez que se pide; el recorrido por las nueve
  // pantallas públicas no cabe en el timeout por defecto de 30 s con el servidor en frío.
  test.setTimeout(120_000)

  test(`AC-002-01 en la ficha de producto el texto nunca se dibuja sobre la foto`, async ({ page }) => {
    await abrirPrimeraFicha(page, ANCHO_REFERENCIA)

    const foto = page.locator('.liora-product-grid img').first()
    const titulo = page.locator('.liora-product-grid h1').first()
    await expect(foto).toBeVisible()
    await expect(titulo).toBeVisible()

    // El defecto solo aparece al desplazar: la foto queda clavada y el texto le pasa por encima.
    const alto = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < Math.min(alto, 3000); y += 150) {
      await page.evaluate((destino) => window.scrollTo(0, destino), y)
      const [cajaFoto, cajaTitulo] = await Promise.all([foto.boundingBox(), titulo.boundingBox()])
      if (!cajaFoto || !cajaTitulo) continue
      expect(
        seSolapan(cajaFoto, cajaTitulo),
        `el título se dibuja sobre la foto con scrollY=${y}`,
      ).toBe(false)
    }
  })

  for (const ancho of ANCHOS_ANGOSTOS) {
    test(`AC-002-02 ninguna pantalla pública desborda a lo ancho en ${ancho}px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 800 })
      for (const ruta of RUTAS_PUBLICAS) {
        await ir(page, ruta)
        expect(await desborde(page), `${ruta} desborda a ${ancho}px`).toBeLessThanOrEqual(1)
      }
    })
  }

  test(`AC-002-02 la ficha de producto y la de kit tampoco desbordan`, async ({ page }) => {
    await abrirPrimeraFicha(page, ANCHO_REFERENCIA)
    expect(await desborde(page), 'la ficha de producto desborda').toBeLessThanOrEqual(1)

    await ir(page, '/tienda')
    const kit = page.locator('[data-analytics-id^="kit-card:"]').first()
    if (await kit.count()) {
      await kit.click()
      await expect(page.locator('.liora-product-grid')).toBeVisible({ timeout: 20_000 })
      expect(await desborde(page), 'la ficha de kit desborda').toBeLessThanOrEqual(1)
    }
  })

  test(`AC-002-03 un título largo no se sale de su columna`, async ({ page }) => {
    await abrirPrimeraFicha(page, ANCHO_REFERENCIA)
    const titulo = page.locator('.liora-product-grid h1').first()

    // La caja del título no puede ser más ancha que la del contenedor que lo encierra, ni
    // empezar antes ni terminar después.
    const medidas = await titulo.evaluate((el) => {
      const padre = el.parentElement!
      const t = el.getBoundingClientRect()
      const p = padre.getBoundingClientRect()
      return { tIzq: t.left, tDer: t.right, pIzq: p.left, pDer: p.right, desbordeTexto: el.scrollWidth - el.clientWidth }
    })
    expect(medidas.tIzq, 'el título empieza antes que su columna').toBeGreaterThanOrEqual(medidas.pIzq - 1)
    expect(medidas.tDer, 'el título termina después que su columna').toBeLessThanOrEqual(medidas.pDer + 1)
    expect(medidas.desbordeTexto, 'el texto del título desborda su propia caja').toBeLessThanOrEqual(1)
  })

  for (const ancho of ANCHOS_ANGOSTOS) {
    test(`AC-002-04 el panel del carrito cabe completo en ${ancho}px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 800 })
      await ir(page, '/')
      // El botón existe en el HTML servido, pero no abre nada hasta que React hidrata.
      await page.waitForLoadState('load')

      const panel = page.locator('aside').filter({ hasText: 'Tu carrito' }).first()
      await expect(async () => {
        await page.getByRole('button', { name: /^Carrito —/ }).click()
        await expect(panel).toBeVisible({ timeout: 2_000 })
      }).toPass({ timeout: 20_000 })
      const caja = await panel.boundingBox()
      expect(caja).not.toBeNull()
      expect(caja!.width, `el panel mide ${caja!.width}px en una ventana de ${ancho}px`).toBeLessThanOrEqual(ancho + 1)
      expect(caja!.x, 'el panel empieza fuera de la ventana por la izquierda').toBeGreaterThanOrEqual(-1)
      expect(caja!.x + caja!.width, 'el panel termina fuera de la ventana').toBeLessThanOrEqual(ancho + 1)
    })
  }

  test(`AC-002-05 el menú a pantalla completa no es alcanzable en escritorio`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await ir(page, '/')

    const menu = page.locator('.liora-mobile-nav')
    await expect(menu).toBeHidden()

    // La regla no puede depender de que nadie ponga la clase: en escritorio el menú no se dibuja
    // aunque el estado diga que está abierto.
    await menu.evaluate((el) => el.classList.add('open'))
    await expect(menu, 'el menú móvil se abre en escritorio').toBeHidden()
  })
})
