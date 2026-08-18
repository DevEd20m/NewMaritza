# LIORA

Ecommerce peruano de bienestar personalizado construido con Next.js 16, React 19, Supabase, Stripe, Resend y OpenAI.

## Requisitos

- Node.js 22
- npm
- Docker Desktop
- Supabase CLI 2.114 o posterior
- Stripe CLI

## Configuración local

```bash
nvm use
npm ci
cp .env.example .env.local
supabase start
npm run dev
```

Completa `.env.local` con claves exclusivamente de desarrollo. Nunca apuntes un servidor local o un Preview de Vercel a la base de producción.

Para probar webhooks de Stripe:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

Copia el `whsec_…` temporal entregado por Stripe CLI en `STRIPE_WEBHOOK_SECRET` y usa una tarjeta de prueba de Stripe.

## Entornos

| Entorno | Supabase | Stripe | Email |
|---|---|---|---|
| Local | Supabase local o staging | Test | `capture` |
| Vercel Preview | Staging | Test | `capture` |
| Producción | Producción | Live | `send` |

Las variables de Preview y Production se administran separadamente en Vercel. `CRON_SECRET`, claves de servicio, Stripe, Resend y OpenAI son siempre server-only.

## Comandos de calidad

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run test:e2e
```

La compra Stripe completa está protegida por una bandera para no crear órdenes
en ejecuciones locales accidentales:

```bash
PLAYWRIGHT_BASE_URL=https://preview.example \
VERCEL_AUTOMATION_BYPASS_SECRET=... \
RUN_STRIPE_E2E=1 npx playwright test tests/e2e/checkout.spec.ts
```

## Base de datos

Producción es la fuente histórica canónica. Antes de crear una migración:

```bash
supabase migration list
supabase db pull
supabase db reset
supabase db lint --local --fail-on error
```

Antes de aplicar en staging o producción:

```bash
supabase db push --linked --dry-run
```

No uses `db reset --linked` contra producción. Las correcciones productivas son siempre migraciones nuevas y forward-only.

## Checkout e inventario

- `product_variants.stock_quantity = NULL`: stock ilimitado.
- Un entero no negativo: stock finito disponible.
- Checkout reserva inventario durante aproximadamente 30 minutos.
- Stripe consume o libera la reserva mediante webhooks idempotentes.
- Los correos salen desde un outbox reintentable; staging captura el HTML sin enviarlo.
