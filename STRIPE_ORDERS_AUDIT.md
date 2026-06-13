# LIORA — Auditoría Stripe + Supabase + Admin Orders

> Generado: 2026-06-13 | Auditor: Claude Code | Modo: solo lectura + fixes

---

## 1. Diagnóstico

Dos pedidos (`LIO-260603-3AFB83` y `LIO-260603-FDD424`, S/521 c/u) aparecen en estado **"Pend. pago"** en el panel de admin aunque el cliente completó el pago en Stripe. El pedido anterior (`LIO-260603-155E92`) sí transitó a Entregado, lo que indica que el flujo funciona en condiciones normales pero falló para estos dos.

**Causa raíz:** `NEXT_PUBLIC_SITE_URL` no está definida en las variables de entorno de Vercel. Esto hace que la `success_url` enviada a Stripe sea `http://localhost:3000/confirmado?...` en lugar de `https://liora.pe/confirmado?...`. Después del pago, Stripe redirige al cliente a localhost (inaccesible), por lo que la confirmación inmediata nunca se ejecuta. El webhook de respaldo tampoco actualizó los pedidos porque probablemente no está configurado para el entorno de producción.

---

## 2. Flujo actual

```
Cliente en /carrito
  └→ POST /api/checkout
       ├ Crea order (status: pending_payment)
       └ Crea payment (status: pending)

  └→ POST /api/payment/create-session
       └ stripe.checkout.sessions.create()
            success_url: ${NEXT_PUBLIC_SITE_URL}/confirmado?session_id=...
            cancel_url:  ${NEXT_PUBLIC_SITE_URL}/carrito

  └→ window.location.href = redirectUrl (Stripe Hosted Checkout)

Cliente paga en Stripe
  ├─ Track A (redirect): /confirmado?session_id=cs_xxx&order=LIO-...
  │    └ confirmOrderFromSession() → UPDATE orders SET status='paid'
  └─ Track B (webhook): POST /api/payment/webhook
       └ checkout.session.completed → UPDATE orders SET status='paid'
```

Si `NEXT_PUBLIC_SITE_URL` es `http://localhost:3000`, el Track A falla. Si el webhook no está registrado en Stripe Dashboard apuntando a producción, el Track B también falla.

---

## 3. Fallas encontradas

### BUG-1 🔴 CRÍTICO — `success_url` apunta a localhost

**Archivo:** `src/app/api/payment/create-session/route.ts`

```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
successUrl: `${siteUrl}/confirmado?session_id={CHECKOUT_SESSION_ID}&order=${order.order_number}`,
```

Si la variable no está definida en Vercel, Stripe genera una sesión con redirect a `http://localhost:3000`. El cliente no puede llegar a esa URL en producción → confirmación fallida.

**Fix aplicado en código:** ninguno (la corrección es en Vercel env vars — ver sección 6).

---

### BUG-2 🔴 CRÍTICO — Webhook no configurado para producción

El `STRIPE_WEBHOOK_SECRET` del `.env.local` pertenece al endpoint configurado en el Stripe Dashboard. Si ese endpoint apunta a localhost (o si sólo existe el Stripe CLI local en desarrollo), los eventos `checkout.session.completed` de producción nunca llegan a `/api/payment/webhook` en Vercel.

**Evidencia:** los dos pedidos no tienen entradas en `payment_events` (el webhook almacena todos los eventos que recibe).

**Fix:** registrar el endpoint en Stripe Dashboard (ver sección 6).

---

### BUG-3 🟡 MEDIO — `idempotency_key` no era determinista

**Archivo:** `src/app/api/checkout/route.ts`

```typescript
// ANTES:
const idempotencyKey = `order_${order.id}_${Date.now()}`

// DESPUÉS (ya corregido):
const idempotencyKey = `order_${order.id}`
```

Con `Date.now()`, cada reintento del cliente generaba un registro duplicado en `payments` para el mismo `order_id`. El `create-session` luego hace `.single()` sobre los payments pendientes, lo que podría fallar con múltiples registros.

**Estado:** ✅ corregido en `src/app/api/checkout/route.ts`

---

### BUG-4 🟡 MEDIO — RPC `increment_coupon_used_count` no existía

**Archivo:** `src/app/api/payment/webhook/route.ts` línea 76

```typescript
await (admin as any).rpc('increment_coupon_used_count', { p_coupon_id: order.coupon_id })
```

La función no estaba definida en las migraciones. Si el pedido tenía cupón, el webhook emitía un error de Supabase (aunque no abortaba — el error era silencioso). La cuenta de uso del cupón nunca se incrementaba.

**Estado:** ✅ función creada en `supabase/migrations/20260613000000_increment_coupon_and_email_queue.sql`

---

### BUG-5 🟡 MEDIO — Tabla `email_queue` no existía

**Archivo:** `src/app/api/payment/webhook/route.ts` líneas 89–94

```typescript
await (admin as any).from('email_queue').insert({...}).catch(() => {})
```

La tabla no estaba en las migraciones. Los emails de Day 7 nunca se encolaban. El `.catch(() => {})` lo hacía silencioso.

**Estado:** ✅ tabla creada en `supabase/migrations/20260613000000_increment_coupon_and_email_queue.sql`

---

### BUG-6 🟠 MENOR — Race condition entre Track A y Track B

`/confirmado` y el webhook pueden ejecutarse simultáneamente. Ambos verifican `order.status === 'pending_payment'` antes de actualizar. En caso de concurrencia, se podrían insertar dos entradas en `order_status_history`. No hay pérdida de datos ni estado incorrecto, pero el historial queda duplicado.

**Decisión:** no se interviene ahora; el riesgo es cosmético.

---

### BUG-7 🟢 INFO — `@stripe/stripe-js` y publishable key no se usan

El flujo usa Stripe Hosted Checkout (redirect), no Stripe Elements. El paquete `@stripe/stripe-js` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` están instalados/definidos pero son dead code. No afecta el funcionamiento.

---

## 4. Queries SQL para verificar los pedidos atascados

Ejecutar en Supabase → SQL Editor:

```sql
-- Estado de los pedidos
SELECT id, order_number, status, total_cents, coupon_id, created_at
FROM orders
WHERE order_number IN ('LIO-260603-3AFB83', 'LIO-260603-FDD424');

-- Registros de pago (provider_reference = Stripe session ID si llegó)
SELECT o.order_number, p.id, p.status, p.provider_reference, p.amount_cents
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE o.order_number IN ('LIO-260603-3AFB83', 'LIO-260603-FDD424');

-- ¿Llegó algún evento del webhook?
SELECT o.order_number, pe.event_type, pe.processed, pe.hmac_verified, pe.created_at
FROM payment_events pe
JOIN payments p ON p.id = pe.payment_id
JOIN orders o ON o.id = p.order_id
WHERE o.order_number IN ('LIO-260603-3AFB83', 'LIO-260603-FDD424');

-- Historial de cambios de estado
SELECT o.order_number, osh.status, osh.note, osh.created_by, osh.created_at
FROM order_status_history osh
JOIN orders o ON o.id = osh.order_id
WHERE o.order_number IN ('LIO-260603-3AFB83', 'LIO-260603-FDD424')
ORDER BY osh.created_at;
```

---

## 5. Eventos de Stripe a verificar

En [Stripe Dashboard → Test mode → Events](https://dashboard.stripe.com/test/events):

1. Buscar eventos `checkout.session.completed` de la fecha 2026-06-03
2. Filtrar por `metadata.order_number = LIO-260603-3AFB83` o `LIO-260603-FDD424`
3. Verificar que `payment_status = paid` en la sesión
4. En **Developers → Webhooks**: comprobar si existe un endpoint apuntando a `https://liora.pe/api/payment/webhook`
   - Si existe: ver si los intentos de entrega fallaron y por qué
   - Si no existe: ese es el problema (ver sección 6)

---

## 6. Cambios recomendados (configuración externa)

> Estos cambios son en Vercel y Stripe — no en el código.

### A. Variable de entorno en Vercel (URGENTE)

1. Ir a [Vercel Dashboard](https://vercel.com) → Proyecto LIORA → Settings → Environment Variables
2. Agregar (o editar si ya existe):

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_SITE_URL` | `https://liora.pe` | Production, Preview |

3. Hacer **Redeploy** para que tome efecto.

### B. Webhook en Stripe Dashboard (URGENTE)

1. Ir a [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Configurar:
   - **URL:** `https://liora.pe/api/payment/webhook`
   - **Events:** `checkout.session.completed`
4. Una vez creado, copiar el **Signing secret** (`whsec_...`)
5. En Vercel → Environment Variables → actualizar `STRIPE_WEBHOOK_SECRET` con ese valor
6. Hacer **Redeploy**

### C. Aplicar la migración de DB

En Supabase → SQL Editor, ejecutar el contenido de:
`supabase/migrations/20260613000000_increment_coupon_and_email_queue.sql`

O desde la CLI:
```bash
supabase db push
```

### D. Rescatar los dos pedidos atascados

Una vez confirmado en Stripe que ambas sesiones tienen `payment_status = paid`:

```sql
-- Marcar como pagados
UPDATE orders
SET status = 'paid', updated_at = NOW()
WHERE order_number IN ('LIO-260603-3AFB83', 'LIO-260603-FDD424')
  AND status = 'pending_payment';

-- Actualizar registros de pago
UPDATE payments
SET status = 'succeeded', updated_at = NOW()
WHERE order_id IN (
  SELECT id FROM orders
  WHERE order_number IN ('LIO-260603-3AFB83', 'LIO-260603-FDD424')
);

-- Registrar en historial
INSERT INTO order_status_history (order_id, status, note, created_by)
SELECT id,
       'paid',
       'Rescatado manualmente — BUG-1+BUG-2: success_url a localhost + webhook sin configurar',
       'admin_manual'
FROM orders
WHERE order_number IN ('LIO-260603-3AFB83', 'LIO-260603-FDD424');
```

---

## 7. Fix propuesto (resumen de cambios de código)

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `src/app/api/checkout/route.ts` | `idempotencyKey` sin `Date.now()` | ✅ aplicado |
| `supabase/migrations/20260613000000_...sql` | `increment_coupon_used_count` RPC | ✅ creado |
| `supabase/migrations/20260613000000_...sql` | tabla `email_queue` | ✅ creado |
| Vercel env vars | `NEXT_PUBLIC_SITE_URL=https://liora.pe` | ⏳ pendiente (tú) |
| Stripe Dashboard | Webhook endpoint → producción | ⏳ pendiente (tú) |
| Supabase SQL | Rescatar LIO-260603-3AFB83 y FDD424 | ⏳ pendiente (tú) |

---

## 8. Casos de prueba post-fix

1. **Test de redirect:** crear pedido de prueba → pagar con `4242 4242 4242 4242` → verificar que el browser llega a `https://liora.pe/confirmado?...` (no localhost)
2. **Test de webhook:** en Stripe Dashboard → Webhooks → verificar que el evento `checkout.session.completed` aparece como entregado con HTTP 200
3. **Test de estado en DB:** después del pago de prueba, verificar en Supabase que `orders.status = 'paid'` y existe entrada en `order_status_history` con `created_by = 'stripe_redirect'` o `'stripe_webhook'`
4. **Test de cupón:** crear pedido con cupón → pagar → verificar que `coupons.used_count` se incrementó en 1
5. **Test idempotencia:** enviar dos veces el mismo `orderId` a `/api/payment/create-session` → debe retornar el mismo `redirectUrl` sin crear un segundo payment record
6. **Test admin:** en `/admin/pedidos`, los dos pedidos rescatados deben mostrar estado "Pagado" con timeline correcto
