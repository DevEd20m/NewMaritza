import { expect, test, type Page } from '@playwright/test'

// US-006 · Servir el catálogo sin malgastar datos
// docs/specs/TIENDA/servir-el-catalogo-sin-malgastar.md
//
// Los criterios se comprueban sobre las PETICIONES, no sobre los bytes descargados: así el test es
// determinista, no depende de la red y no gasta tráfico por ejecutarse.

const ANCHO_REFERENCIA = 360

/** ¿La petición es de una imagen? Por tipo de recurso, no por extensión. */
const esImagen = (tipo: string) => tipo === 'image'

/** El optimizador de Next sirve bajo /_next/image?url=…&w=…&q=… */
const vaPorElOptimizador = (url: string) => new URL(url).pathname === '/_next/image'

/**
 * Hosts de almacenamiento de catálogo: pedirles una imagen directamente es el defecto.
 * Se mira el ORIGEN y no la URL entera: la del optimizador lleva la original codificada en su
 * query, y compararla completa daba falsos positivos.
 */
const esAlmacenamientoCrudo = (url: string) => /supabase\.co$|vtexassets\.com$/.test(new URL(url).hostname)

async function recogerImagenes(page: Page, ruta: string) {
  const peticiones: { url: string; crudo: boolean }[] = []
  const escucha = (req: import('@playwright/test').Request) => {
    if (!esImagen(req.resourceType())) return
    peticiones.push({ url: req.url(), crudo: esAlmacenamientoCrudo(req.url()) })
  }
  page.on('request', escucha)
  await page.goto(ruta, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  page.off('request', escucha)
  return peticiones
}

test.describe('US-006 · Servir el catálogo sin malgastar datos', () => {
  test.setTimeout(120_000)

  for (const ruta of ['/', '/tienda']) {
    test(`AC-006-01 las imágenes del catálogo pasan por el optimizador en ${ruta}`, async ({ page }) => {
      await page.setViewportSize({ width: ANCHO_REFERENCIA, height: 800 })
      const imagenes = await recogerImagenes(page, ruta)

      expect(imagenes.length, `${ruta} no pidió ninguna imagen: el test no estaría comprobando nada`).toBeGreaterThan(0)

      const crudas = imagenes.filter((i) => i.crudo).map((i) => i.url.split('/').slice(-2).join('/'))
      expect(
        crudas,
        `${ruta} pide ${crudas.length} imágenes directamente al almacenamiento, saltándose el optimizador`,
      ).toEqual([])
    })
  }

  test('AC-006-02 se pide el ancho que se va a mostrar, no el original', async ({ page }) => {
    await page.setViewportSize({ width: ANCHO_REFERENCIA, height: 800 })
    await page.goto('/tienda', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle').catch(() => {})

    // Cada imagen contra SU propio tamaño: una tarjeta de rejilla y una del carrusel de kits
    // se muestran a anchos distintos, y pedir lo mismo para las dos sería el error contrario.
    const medidas = await page.evaluate(() => {
      const salida: { ancho: number; pedido: number; src: string }[] = []
      for (const img of Array.from(document.images)) {
        const caja = Math.round(img.getBoundingClientRect().width)
        if (caja === 0) continue
        // Solo `currentSrc`: es lo que el navegador eligió del srcset y descargó de verdad.
        // `src` lleva el candidato MÁS GRANDE como respaldo —3840 px—, y leerlo da un falso
        // positivo clamoroso. Si está vacío, la imagen aún no resolvió y no hay nada que medir.
        if (!img.currentSrc) continue
        let u: URL
        try { u = new URL(img.currentSrc, location.href) } catch { continue }
        if (u.pathname !== '/_next/image') continue
        salida.push({ ancho: caja, pedido: Number(u.searchParams.get('w') ?? 0), src: u.searchParams.get('url') ?? '' })
      }
      return salida
    })

    expect(medidas.length, 'ninguna imagen pasó por el optimizador: el test no comprueba nada').toBeGreaterThan(0)

    // El techo son 2,5×: densidad 2 —lo que hay en un celular— más el redondeo al siguiente
    // tamaño que el optimizador puede servir. Pedir 1600 px para una caja de 124 da 12,9×.
    const TECHO = 2.5
    const excesivas = medidas
      .filter((m) => m.pedido > m.ancho * TECHO)
      .map((m) => `${m.pedido}px para una caja de ${m.ancho}px (${(m.pedido / m.ancho).toFixed(1)}×)`)

    expect(excesivas, `se piden imágenes mucho mayores de lo que se muestran: ${excesivas.join(' · ')}`).toEqual([])
  })

})
