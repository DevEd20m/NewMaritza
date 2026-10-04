import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    globals: true,
    // El guardián de trazabilidad certifica contra JUnit XML: sin este reporter
    // no hay veredictos y los criterios salen como «hay test pero nadie lo ejecutó».
    reporters: ['default', ['junit', { outputFile: 'build/test-results/vitest.xml' }]],
  },
})
