import { defineConfig, devices } from '@playwright/test'

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

/**
 * La suite no se ejecuta contra una base que no sea local.
 *
 * No es solo por no ensuciar la analítica. Una visita a /tienda descarga ~8 MB de imágenes del
 * almacenamiento, y Playwright estrena caché en cada test: unas pocas corridas se comen el plan.
 * En octubre de 2026 pasó, y costó ~0,8 GB de egress (AUD-013).
 *
 * Esto es una puerta, no un consejo: lo que solo se pide por escrito no se cumple. Si de verdad
 * hace falta apuntar a otro sitio —validar un despliegue en staging, por ejemplo— se declara
 * explícitamente con PLAYWRIGHT_ALLOW_REMOTE_DB=1, y queda en el historial del comando.
 */
const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const dbEsLocal = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/.test(dbUrl)
if (dbUrl && !dbEsLocal && process.env.PLAYWRIGHT_ALLOW_REMOTE_DB !== '1') {
  throw new Error(
    `La suite apunta a una base remota (${dbUrl.replace(/\/\/([^.]+)\./, '//***.')}).\n` +
    'Levanta el stack local (ver docs/arquitectura/entorno-local.md) o, si es a propósito, ' +
    'ejecuta con PLAYWRIGHT_ALLOW_REMOTE_DB=1.',
  )
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // El JUnit XML lo lee el guardián de trazabilidad (node herramientas/trazabilidad.ts).
  reporter: [['html'], ['junit', { outputFile: 'build/test-results/playwright.xml' }]],
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    extraHTTPHeaders: vercelBypassSecret ? {
      'x-vercel-protection-bypass': vercelBypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    } : undefined,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-auth-analytics', testMatch: /.*(admin-auth|analytics)\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],
  webServer: externalBaseUrl ? undefined : {
    command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
