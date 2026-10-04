# Hallazgos de auditoría

**Instantánea del 2026-10-04 · commit `080d0e1` · rama `main`**

La descripción y la evidencia viven aquí y **no se editan**. El estado y la planificación viven en
el [backlog](../BACKLOG.md#hallazgos-de-auditoría); la decisión, en los [ADR](../adr/README.md).

## Método y sus límites

Revisión estática del repositorio completo en el commit indicado, más comprobación del HTML y las
cabeceras servidas por `liora.pe` en producción. Se leyeron: `src/`, `supabase/migrations/`,
`supabase/tests/`, `.github/workflows/`, la configuración de Next, Vitest y Playwright, y el
`.env.example`.

**Lo que NO se hizo, y por qué importa para el campo Confianza:**

- **No se leyeron las variables de entorno de producción.** La cuenta de Vercel disponible durante
  la auditoría no contiene el proyecto LIORA. Todo lo que dependa de un valor de entorno real queda
  como *Requiere verificación en ejecución* — en particular AUD-003.
- **No se consultó la base de datos de producción.** La cuenta de Supabase disponible no contiene el
  proyecto `skcfrccoexscaiayzjzd`. El esquema se reconstruyó desde `supabase/migrations/`, que es
  precisamente lo que permitió detectar AUD-002.
- **No se ejecutó ninguna suite.** La máquina tenía Node 20 y el proyecto exige Node 22, así que
  Vitest no arranca. Ningún hallazgo se apoya en un resultado de test.
- **No se hizo prueba de penetración ni análisis dinámico.** AUD-001 está confirmado por código
  (la política SQL y el cliente que la usa), no por explotación.

## Severidad

| Nivel | Significa |
|---|---|
| **Crítico** | Fuga o alteración de datos entre clientes/empresas alcanzable por un usuario corriente, sin condiciones especiales |
| **Alto** | Alcanzable por un rol legítimo; o riesgo legal; o divergencia repo↔producción que impide reconstruir el entorno |
| **Medio** | Control ausente que hoy tapa otra barrera; o integridad de datos confiada al cliente |
| **Bajo** | Higiene: código muerto, dependencias, ruido, puertas que no pasan en una plataforma |
| **Informativo** | Observación sin riesgo asociado |

Si todo fuera Alto, la lista no ordenaría nada: la escala se aplica con rigor.

## Resumen

| ID | Sev. | Categoría | Componente | Título |
|---|---|---|---|---|
| [AUD-001](#aud-001) | Alto | validación de entrada | storage | El límite de tipo y tamaño de las subidas solo existe en el navegador |
| [AUD-002](#aud-002) | Alto | divergencia repo↔producción | backend | `orders.quiz_profile_id` existe en producción y en los tipos, pero en ninguna migración |
| [AUD-003](#aud-003) | Alto | configuración | email | `EMAIL_DELIVERY_MODE=capture` apaga todos los correos sin fallar ni avisar |
| [AUD-004](#aud-004) | Medio | integridad | checkout | El redirect de confirmación silencia los errores y no entrega el correo |
| [AUD-005](#aud-005) | Medio | riesgo legal | tienda | El pie de página enlaza `/terminos` y `/contacto`, y ninguna de las dos existe |
| [AUD-006](#aud-006) | Medio | fuga de información | analítica | Un `console.log` de depuración publica cada evento en la consola del cliente |
| [AUD-007](#aud-007) | Bajo | integridad | checkout | El distrito guardado nunca se re-prellena: se lee de otra columna |
| [AUD-008](#aud-008) | Bajo | configuración | tienda | La CSP no declara `media-src`, así que bloqueará cualquier `<video>` |
| [AUD-009](#aud-009) | Bajo | higiene | tienda | El menú móvil puede abrirse en escritorio: su regla está fuera de la media query |
| [AUD-010](#aud-010) | Bajo | código muerto | email | La plantilla `order-guide.ts` nunca se importa |
| [AUD-011](#aud-011) | Informativo | rendimiento | tienda | Las fuentes se cargan por `@import` en CSS en vez de `next/font` |

---

## AUD-001

### El límite de tipo y tamaño de las subidas solo existe en el navegador

- **Severidad:** Alto · **Categoría:** validación de entrada · **Componente:** storage
- **Confianza:** Confirmado por código
- **Flujos:** subida de medios desde `/admin`

**Evidencia.** `src/components/admin/ImageUploadField.tsx:8-18`:

```ts
export async function uploadAdminImage(file: File, path: string): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Solo se aceptan imágenes' }
  if (file.size > 5 * 1024 * 1024) return { error: 'La imagen no puede superar 5 MB' }
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true, contentType: file.type })
```

`createClient()` es el cliente de navegador con la *anon key* (`src/lib/supabase/client.ts`): la
subida va **del navegador directo a Supabase Storage**, sin pasar por Next. Las dos comprobaciones
de arriba se ejecutan en el navegador y nada las repite del lado del servidor.

La política que autoriza el `INSERT`
(`supabase/migrations/20260714194153_storage_admin_policies.sql`) comprueba el rol y nada más:

```sql
create policy "admin_insert_product_images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

Sin `allowed_mime_types` ni `file_size_limit` en el bucket (`supabase/config.toml:115-120` tiene el
bloque `[storage.buckets.*]` comentado; el bucket se creó fuera de migración, en
`scripts/migrate-images.mjs:63`).

**Impacto.** Cualquiera que tenga una sesión con `role = 'admin'` puede subir un archivo de
cualquier tipo y cualquier tamaño llamando directamente a la API de Storage — basta con abrir la
consola del navegador y saltarse el formulario. El bucket es público, así que el archivo queda
servido desde el dominio de Supabase del proyecto. En el vocabulario de este método, el criterio es
`solo cliente` y eso, cuando lo que protege es la integridad del almacenamiento, es un hallazgo.

**Precondiciones.** Una cuenta con rol `admin`. Hoy el daño está acotado porque el único uploader es
de imágenes y el coste de almacenamiento es bajo.

**Recomendación.** Mover el límite al bucket (`file_size_limit` y `allowed_mime_types`) mediante
migración, para que la regla la imponga el servidor. Hacerlo **antes** de habilitar la subida de
video: un archivo de video es de otro orden de magnitud y la ausencia de límite deja de ser teórica.

**Esfuerzo:** S.

---

## AUD-002

### `orders.quiz_profile_id` existe en producción y en los tipos, pero en ninguna migración

- **Severidad:** Alto · **Categoría:** divergencia repo↔producción · **Componente:** backend
- **Confianza:** Confirmado por código
- **Flujos:** checkout

**Evidencia.** `src/app/api/checkout/route.ts:204` inserta la columna y
`src/types/database.ts:185` la declara en el `Row` de `orders`. Ninguna migración la crea: un
barrido de `supabase/migrations/` por `add column` + `quiz_profile_id` solo encuentra
`20260819010000_quiz_email_and_lia_agent.sql`, que la añade a `email_queue` y a
`bot_conversations`, nunca a `orders`.

**Impacto.** El repositorio deja de ser la fuente de verdad del esquema. Un entorno reconstruido
desde cero — que es exactamente lo que hace CI en cada PR con `supabase db reset` — no tiene esa
columna, y el `INSERT` del checkout falla. Si hoy CI pasa, es porque la columna llegó a producción
por una vía que no deja rastro en el repositorio, y nadie puede reproducir el entorno.

**Recomendación.** Añadir la migración `add column if not exists` que regulariza la columna, y
comprobar con `supabase db diff` si hay más deriva del mismo tipo.

**Esfuerzo:** S.

---

## AUD-003

### `EMAIL_DELIVERY_MODE=capture` apaga todos los correos sin fallar ni avisar

- **Severidad:** Alto · **Categoría:** configuración · **Componente:** email
- **Confianza:** **Requiere verificación en ejecución** — no se pudo leer el entorno de Vercel
- **Flujos:** confirmación de pedido, seguimiento día 7, bienvenida del cuestionario

**Evidencia.** `.env.example` reparte el valor `capture` como si fuera el normal:

```
# capture: persist rendered HTML without sending; send: deliver through Resend
EMAIL_DELIVERY_MODE=capture
```

Y el gate corta justo antes de llamar a Resend, en `src/lib/email/deliver-order-email.ts:80` y
`:142` (y en `deliver-quiz-email.ts:30`):

```ts
if (process.env.EMAIL_DELIVERY_MODE === 'capture') return { status: 'captured', html }
```

El job queda `status = 'captured'`, que **no** es un estado de error: no entra en la vista
`admin_failed_email_jobs`, no incrementa `attempts` y el cron no lo repesca.

**Impacto.** Si el valor está así en producción, ningún cliente recibe la confirmación de su compra
y nadie se entera, porque el sistema se comporta como si todo hubiera ido bien. Es el modo de fallo
más caro de los de esta lista: silencioso, indistinguible del éxito desde dentro, y afecta a cada
venta.

**Precondiciones.** Que la variable valga `capture` en el entorno de producción. **Verificar antes
de actuar**; si vale `send`, este hallazgo se cierra como Descartado.

**Recomendación.** Comprobar el valor en Vercel. Independientemente del resultado, invertir el
defecto: que el modo seguro sea enviar y que `capture` haya que pedirlo explícitamente, para que un
despiste de configuración no se traduzca en silencio. Y exponer el recuento de jobs `captured` en
`/admin/operaciones`, que hoy solo mira los `failed`.

**Esfuerzo:** S.

---

## AUD-004

### El redirect de confirmación silencia los errores y no entrega el correo

- **Severidad:** Medio · **Categoría:** integridad · **Componente:** checkout
- **Confianza:** Confirmado por código
- **Flujos:** pago con Stripe

**Evidencia.** Hay dos caminos para confirmar un pago. El webhook
(`src/app/api/payment/webhook/route.ts:117-128`) marca el pedido como pagado **y además** ejecuta
el job `day0` en el momento. El redirect del navegador
(`src/app/(store)/confirmado/page.tsx:34-62`) llama a `markOrderPaid`, que solo **encola** vía el
RPC `finalize_paid_order`, y nunca llama a `processEmailJob`. La función entera termina en:

```ts
} catch { return null }
```

**Impacto.** Si el webhook de Stripe no llega o falla, el pedido sí queda pagado por la vía del
redirect, pero el correo de confirmación espera al cron — que corre **una vez al día** (límite del
plan Hobby, `vercel.json`). El cliente paga y puede pasar hasta 24 horas sin recibir nada. El
`catch` vacío además descarta cualquier error de esa ruta sin dejar traza.

**Recomendación.** Disparar `processEmailJob` también desde el redirect, igual que hace el webhook,
y registrar el error en vez de tragárselo.

**Esfuerzo:** S.

---

## AUD-005

### El pie de página enlaza `/terminos` y `/contacto`, y ninguna de las dos existe

- **Severidad:** Medio · **Categoría:** riesgo legal · **Componente:** tienda
- **Confianza:** Confirmado por código
- **Flujos:** navegación general

**Evidencia.** `src/components/layout/Footer.tsx:19` enlaza `/contacto` y `:24` y `:139` enlazan
`/terminos`. No existe ninguna ruta para ellas bajo `src/app/`: ambas devuelven 404. El pie de
página se renderiza en **todas** las páginas públicas.

**Impacto.** Una tienda que cobra en línea enlaza sus términos y condiciones desde cada página y
entrega un 404. Más allá de la mala impresión, es exposición: el cliente no tiene dónde consultar
las condiciones de venta que está aceptando al comprar.

**Recomendación.** Crear ambas páginas, o retirar los enlaces hasta que existan. Lo segundo es peor
para los términos.

**Esfuerzo:** M (el contenido legal no lo escribe el código).

---

## AUD-006

### Un `console.log` de depuración publica cada evento en la consola del cliente

- **Severidad:** Medio · **Categoría:** fuga de información · **Componente:** analítica
- **Confianza:** Confirmado por código
- **Flujos:** analítica de navegación

**Evidencia.** `src/lib/analytics/tracker.ts:187-190`:

```ts
export function track(event: TrackedEvent) {
  console.log('[track-debug]', event.event, typeof window, analyticsEnabled(), window.location.hostname, process.env.NEXT_PUBLIC_ANALYTICS_DEBUG)
  if (typeof window === 'undefined' || !analyticsEnabled()) return
```

Llegó con el commit `080d0e1` y no está condicionado por ninguna variable: se ejecuta siempre.

**Impacto.** Dos cosas distintas. Primera: cada evento de analítica —incluidos los de negocio, como
qué productos se mostraron o que alguien dejó su correo— se imprime en la consola del navegador de
cada visitante. Segunda, y más grave como defecto: la línea lee `window.location.hostname`
**antes** del guard `typeof window === 'undefined'` de la línea siguiente, así que cualquier ruta
que llame a `track()` durante el renderizado en servidor lanza `ReferenceError: window is not
defined`. Hoy no ocurre porque todas las llamadas salen de componentes cliente, pero la protección
que el código cree tener no está donde cree.

**Recomendación.** Borrar la línea. Si se quiere traza de depuración, ponerla **después** del guard
y detrás de `NEXT_PUBLIC_ANALYTICS_DEBUG`.

**Esfuerzo:** S.

---

## AUD-007

### El distrito guardado nunca se re-prellena: se lee de otra columna

- **Severidad:** Bajo · **Categoría:** integridad · **Componente:** checkout
- **Confianza:** Confirmado por código
- **Flujos:** checkout de cliente recurrente

**Evidencia.** `src/app/api/checkout/route.ts:169` guarda el valor en `addresses.district`. Pero
`src/app/(store)/pagar/page.tsx:21` selecciona `state` y `:37` lo asigna al campo del formulario:

```ts
district: address?.state ?? '',
```

Nada en el código escribe nunca `addresses.state`, que es nullable: el prefill devuelve siempre
cadena vacía.

**Impacto.** Un cliente que ya compró tiene que volver a escribir su distrito en cada pedido, aunque
el sistema lo tenga guardado. El campo es obligatorio en el formulario
(`src/lib/validation/checkout.ts:11`), así que la fricción es real en cada compra repetida.

**Recomendación.** Leer `district`. Comprobar de paso si `addresses.state` tiene algún uso o es una
columna muerta.

**Esfuerzo:** S.

---

## AUD-008

### La CSP no declara `media-src`, así que bloqueará cualquier `<video>`

- **Severidad:** Bajo · **Categoría:** configuración · **Componente:** tienda
- **Confianza:** Confirmado por código
- **Flujos:** —

**Evidencia.** La cabecera `Content-Security-Policy` que define `next.config.ts` —y que se puede
leer en la respuesta de `liora.pe`— incluye `img-src 'self' data: blob: https://*.supabase.co …`
pero no declara `media-src`. En CSP, `media-src` **no hereda de `img-src`**: cae a `default-src
'self'`.

**Impacto.** Ninguno hoy, porque no hay ningún elemento `<video>` ni `<audio>` en el proyecto. Pero
el día que se añada uno servido desde Supabase Storage, el navegador lo bloqueará sin que el fallo
se parezca a un problema de CSP para quien lo mire desde el código.

**Recomendación.** Añadir `media-src 'self' https://*.supabase.co blob:` al declarar el primer
reproductor, no después de depurarlo durante una tarde.

**Esfuerzo:** S.

---

## AUD-009

### El menú móvil puede abrirse en escritorio: su regla está fuera de la media query

- **Severidad:** Bajo · **Categoría:** higiene · **Componente:** tienda
- **Confianza:** Confirmado por código
- **Flujos:** navegación general

**Evidencia.** `src/styles/responsive.css:21-45` define `.liora-mobile-nav` como `position: fixed;
inset: 0` **sin envolverla en ningún `@media`**, y `.liora-mobile-nav.open { display: flex }`. La
clase `open` la pone el estado de React en `src/components/layout/Header.tsx:202`, que tampoco
consulta el ancho.

**Impacto.** El botón que la dispara sí está oculto en escritorio por media query, así que hoy no se
alcanza por interacción normal. Pero el overlay a pantalla completa está a un cambio de estado de
aparecer en escritorio, y nada en el código lo impide.

**Recomendación.** Mover la regla dentro de su media query, o condicionar el estado al ancho.

**Esfuerzo:** S.

---

## AUD-010

### La plantilla `order-guide.ts` nunca se importa

- **Severidad:** Bajo · **Categoría:** código muerto · **Componente:** email
- **Confianza:** Confirmado por código
- **Flujos:** —

**Evidencia.** `src/lib/email/templates/order-guide.ts` tiene 152 líneas y ningún `import` en todo
`src/` la referencia. Las cuatro plantillas que sí se usan (`order-confirmation`, `week-checkin`,
`quiz-welcome`, `account-activation`) tienen su call-site.

**Impacto.** Ninguno en ejecución. Es ruido que se mantiene, se typechequea y confunde a quien
busque qué correo se envía: aparenta ser una plantilla viva.

**Recomendación.** Borrarla, o conectarla si se escribió para algo que quedó a medias. El historial
de git la conserva en cualquier caso.

**Esfuerzo:** S.

---

## AUD-011

### Las fuentes se cargan por `@import` en CSS en vez de `next/font`

- **Severidad:** Informativo · **Categoría:** rendimiento · **Componente:** tienda
- **Confianza:** Confirmado por código
- **Flujos:** carga de cualquier página

**Evidencia.** `src/app/globals.css:1` empieza con un `@import url(...)` a Google Fonts que trae
Fraunces (5 pesos, eje óptico variable), DM Sans (4 pesos) y Caveat (3 pesos). No se usa `next/font`
en ningún sitio.

**Impacto.** Un `@import` dentro de una hoja de estilos se descubre tarde en la cascada de carga y
bloquea el renderizado; además no hay auto-hospedaje, ni `preload`, ni el `size-adjust` que
`next/font` calcula para evitar el salto de maquetación cuando la fuente real sustituye a la de
respaldo. En móvil con red lenta, que es el caso que motivó esta auditoría, se nota.

**Recomendación.** Migrar a `next/font/google`. Toca `globals.css` y `src/app/layout.tsx`, y las
variables CSS `--font-display` / `--font-body` / `--font-script` siguen funcionando igual.

**Esfuerzo:** M.
