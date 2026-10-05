# Entorno local completo

Responde a: **¿cómo levanto LIORA entero en mi máquina, incluido el panel administrativo?**

El `.env.local` del repositorio apunta a Supabase de producción, lo que sirve para mirar la tienda
pero no para trabajar: no hay forma de entrar al panel, y cualquier escritura iría a datos reales.
Para eso está el stack local, que es el mismo que levanta CI.

## 1. El stack

```bash
supabase start --exclude logflare,vector,imgproxy,edge-runtime,postgres-meta,supavisor
```

Aplica las migraciones de `supabase/migrations/` sobre un Postgres limpio y carga
`supabase/seed.sql`. Las exclusiones son los servicios que nada de este proyecto usa; quitarlas solo
hace el arranque más lento.

Deja la API en `http://127.0.0.1:54321`, la base en `54322`, Studio en `54323` y el buzón de correo
en `54324`. Las claves que imprime son las de demostración del CLI, iguales en todas las máquinas:
no son secretos y no sirven fuera de `localhost`.

## 2. La cuenta administrativa

`seed.sql` crea datos de catálogo y ningún usuario: no puede, porque un usuario vive en el esquema
`auth`, que gestiona GoTrue. Lo hace un script:

```bash
node scripts/crear-admin-local.mjs                       # usa .env.local
node scripts/crear-admin-local.mjs admin@local.test 1234 # o se le pasan
```

Crea el usuario por la API de administración, lo confirma sin pasar por el buzón, y promueve su fila
de `profiles` a `role = 'admin'`, que es lo único que mira `verifyAdminPage()`. Es idempotente y se
niega a ejecutarse contra cualquier cosa que no sea `localhost`.

**Hay que volver a ejecutarlo después de cada `supabase db reset`**, que borra la base entera.

Las credenciales que uses van en `.env.local` como `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD`, que es
donde las buscan los tests de extremo a extremo. **`.env.local` está ignorado por git**, y esa
cuenta solo existe dentro del contenedor de tu máquina.

## 3. Apuntar la aplicación al stack local

Next no pisa una variable que ya esté en el entorno, así que no hace falta tocar `.env.local`:

```bash
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY que imprimió supabase start>
export SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY que imprimió supabase start>
npm run dev
```

Con esas tres variables exportadas, `npm run test:e2e` también corre contra el stack local, porque
Playwright arranca el servidor heredando el entorno del proceso que lo invoca.

## 4. Qué NO replica el stack local

- **Stripe.** Sin `STRIPE_SECRET_KEY` de test no hay checkout; los tests que lo necesitan se saltan.
- **Resend.** Los correos no salen: con `EMAIL_DELIVERY_MODE=capture` el HTML se guarda en
  `email_queue.html_snapshot`. El buzón local (`54324`) solo recibe los correos de GoTrue.
- **El catálogo real.** `seed.sql` trae dos productos sintéticos a propósito; el catálogo de
  producción no se copia aquí nunca.

## 5. Apagarlo

```bash
supabase stop            # conserva los datos
supabase stop --no-backup   # los descarta
```
