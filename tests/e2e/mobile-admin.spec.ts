import { expect, test, type Page } from '@playwright/test'

// US-003 · Atender el negocio desde el celular — docs/specs/ADMIN/atender-desde-el-celular.md
//
// Necesita una cuenta con rol admin. En local la crea el procedimiento de
// docs/arquitectura/entorno-local.md; en CI vienen de los secretos de staging.
const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

const ANCHOS_ANGOSTOS = [320, 360, 390, 412] as const
const ANCHO_REFERENCIA = 360

const RUTAS_ADMIN = [
  '/admin',
  '/admin/pedidos',
  '/admin/operaciones',
  '/admin/productos',
  '/admin/kits',
  '/admin/categorias',
  '/admin/guias',
  '/admin/cupones',
  '/admin/cuestionario',
  '/admin/tags',
  '/admin/analytics',
  '/admin/clientes',
  '/admin/configuracion',
] as const

test.describe('US-003 · Atender el negocio desde el celular', () => {
  test.skip(!email || !password, 'Requiere una cuenta admin (ver docs/arquitectura/entorno-local.md)')
  test.setTimeout(120_000)

  test.beforeEach(async ({ baseURL }) => {
    if (baseURL && /(^|\.)liora\.pe$/.test(new URL(baseURL).hostname)) {
      throw new Error('Las credenciales admin no pueden ejecutarse contra producción')
    }
  })

  async function entrar(page: Page, ancho: number) {
    await page.setViewportSize({ width: ancho, height: 800 })
    await page.goto('/login?next=/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('form[data-auth-ready="true"]')).toBeVisible({ timeout: 30_000 })
    await page.getByPlaceholder('tu@email.com').fill(email!)
    await page.getByPlaceholder('Contraseña').fill(password!)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.waitForURL((u) => new URL(u).pathname.startsWith('/admin'), { timeout: 60_000 })
  }

  test(`AC-003-01 el contenido ocupa la pantalla, no un margen de ella`, async ({ page }) => {
    await entrar(page, ANCHO_REFERENCIA)
    for (const ruta of RUTAS_ADMIN) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' })
      const ancho = await page.locator('main').first().evaluate((el) => el.getBoundingClientRect().width)
      expect(
        ancho,
        `${ruta}: el contenido mide ${Math.round(ancho)}px en una ventana de ${ANCHO_REFERENCIA}px`,
      ).toBeGreaterThanOrEqual(ANCHO_REFERENCIA * 0.9)
    }
  })

  test(`AC-003-02 la navegación del panel sigue estando a mano`, async ({ page }) => {
    await entrar(page, ANCHO_REFERENCIA)

    // Esconder la barra lateral obliga a ofrecer otra puerta de entrada a las secciones.
    await page.getByRole('button', { name: /^Men/ }).click()

    for (const ruta of ['/admin/pedidos', '/admin/productos', '/admin/configuracion']) {
      await expect(
        page.locator(`a[href="${ruta}"]`).first(),
        `la navegación no ofrece ${ruta}`,
      ).toBeVisible()
    }

    await page.locator('a[href="/admin/pedidos"]').first().click()
    await page.waitForURL((u) => new URL(u).pathname === '/admin/pedidos', { timeout: 30_000 })
  })

  test(`AC-003-03 una tabla más ancha que la pantalla se puede recorrer entera`, async ({ page }) => {
    await entrar(page, ANCHO_REFERENCIA)
    for (const ruta of ['/admin/pedidos', '/admin/clientes']) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1_000)

      const alcanzable = await page.evaluate(() => {
        // Un elemento cuyo contenido no cabe en su propia caja solo es alcanzable si él, o
        // alguno de sus ancestros, se puede desplazar a lo ancho. Si lo primero que aparece
        // al subir es un `overflow: hidden`, lo que sobresale es inalcanzable.
        for (const el of Array.from(document.querySelectorAll('main *')) as HTMLElement[]) {
          const sobra = el.scrollWidth - el.clientWidth
          if (sobra <= 1) continue
          let a: HTMLElement | null = el
          let rescatado = false
          while (a) {
            const ox = getComputedStyle(a).overflowX
            if (ox === 'auto' || ox === 'scroll') { rescatado = true; break }
            if (ox === 'hidden' && a !== el) return { ok: false, culpable: el.tagName.toLowerCase(), ancho: sobra }
            a = a.parentElement
          }
          if (!rescatado) return { ok: false, culpable: el.tagName.toLowerCase(), ancho: sobra }
        }
        return { ok: true as const }
      })
      expect(
        alcanzable.ok,
        `${ruta}: un <${'culpable' in alcanzable ? alcanzable.culpable : ''}> de ${'ancho' in alcanzable ? alcanzable.ancho : 0}px se sale de su caja sin forma de alcanzarlo`,
      ).toBe(true)
    }
  })

  test(`AC-003-04 los paneles de detalle caben en la pantalla`, async ({ page }) => {
    await entrar(page, ANCHO_REFERENCIA)
    // «Nuevo …» abre el mismo panel que el detalle, y no depende de que haya datos cargados.
    const paneles = [
      ['/admin/productos', /^Nuevo producto$/],
      ['/admin/kits', /^Crear kit$/],
      ['/admin/cupones', /^Nuevo cupón$/],
    ] as const

    for (const [ruta, boton] of paneles) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('load')
      const panel = page.locator('.liora-admin-drawer').first()
      // El botón se dibuja en el HTML servido, pero no abre nada hasta que React hidrata.
      await expect(async () => {
        await page.getByRole('button', { name: boton }).first().click()
        await expect(panel).toBeVisible({ timeout: 2_000 })
      }, `${ruta}: el panel no llegó a abrirse`).toPass({ timeout: 30_000 })
      const caja = await panel.boundingBox()
      expect(caja).not.toBeNull()
      expect(caja!.width, `${ruta}: el panel mide ${Math.round(caja!.width)}px en una ventana de ${ANCHO_REFERENCIA}px`).toBeLessThanOrEqual(ANCHO_REFERENCIA + 1)
      expect(caja!.x, `${ruta}: el panel empieza fuera de la ventana (left=${Math.round(caja!.x)})`).toBeGreaterThanOrEqual(-1)
    }
  })

  for (const ancho of ANCHOS_ANGOSTOS) {
    test(`AC-003-05 ninguna pantalla del panel desborda a lo ancho en ${ancho}px`, async ({ page }) => {
      await entrar(page, ancho)
      for (const ruta of RUTAS_ADMIN) {
        await page.goto(ruta, { waitUntil: 'domcontentloaded' })
        const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(desborde, `${ruta} desborda a ${ancho}px`).toBeLessThanOrEqual(1)
      }
    })
  }
})
