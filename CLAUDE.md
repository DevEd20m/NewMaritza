@AGENTS.md

# Cómo se trabaja en LIORA

Léelo entero antes de tocar nada. Es corto a propósito. Vale igual para personas y para agentes de
IA: es el contrato de trabajo del repositorio.

## Lo primero

**`docs/specs/` es la fuente de verdad de qué debe hacer el sistema.** El código es una
implementación de lo que ahí se dice. Cuando el código y una especificación discrepan, el que está
mal es el código — o la especificación está desactualizada y **entonces se actualiza primero**.

Antes de cambiar comportamiento, mira si el área tiene historia en `docs/specs/`. Si la tiene,
empieza por ahí. Si no la tiene y vas a tocar el área, escríbela: es el momento en que sale más
barata.

**Todo cambio funcional sigue [`docs/PROTOCOLO-CAMBIOS.md`](docs/PROTOCOLO-CAMBIOS.md)**: primero
el análisis de impacto (estado actual · cambio entendido · diferencia · fuera de alcance · dudas
bloqueantes), sin implementar ni generar documentación de más; tras la confirmación, spec → tests
→ código sin pedir una segunda aprobación. El objetivo es evitar regresiones, no aumentar la
ceremonia.

## Las siete reglas

1. Un cambio que **altera** comportamiento observable exige modificar primero la historia. Un
   arreglo que **restaura** el comportamiento ya especificado no necesita historia nueva: necesita
   el test que impida que vuelva a romperse.
2. Nunca cambies una regla de negocio directamente en el código sin tocar antes su criterio de
   aceptación.
3. Nunca borres ni modifiques un criterio sin actualizar sus tests en el mismo commit.
4. Una historia vale para todas las plataformas que declara. **Ningún cliente inventa reglas de
   negocio propias**: son implementaciones de la misma regla.
5. Un cambio de interfaz que no altera la funcionalidad no toca la historia.
6. **Un cambio de arquitectura exige un ADR** en `docs/adr/`. Y la inversa también rige: **un
   cambio funcional NO exige ADR por sí mismo** — qué cuenta como estructural lo dice
   [`docs/PROTOCOLO-CAMBIOS.md`](docs/PROTOCOLO-CAMBIOS.md).
7. `DONE` es lo que dice el guardián (`node herramientas/trazabilidad.ts`), no lo que dice quien
   implementó.

## Las puertas

Una **puerta** es una comprobación que bloquea la integración. Tres reglas sobre ellas:

- **Toda puerta corre en CI.** Lo que solo se pide por escrito no es una puerta, es un deseo.
- **Toda puerta es determinista**: el mismo código da el mismo resultado hoy y dentro de un mes, en
  cualquier máquina. Lo que depende de la fecha o de la red —«hay una versión nueva de esta
  dependencia»— va a un workflow programado que avisa, nunca a una puerta.
- **`main` siempre está verde.** Una puerta roja en `main` es la prioridad cero de quien la vea:
  una puerta que siempre está roja deja de mirarse, y el día que falle por un motivo real nadie lo
  distinguirá del ruido. La deuda que se decide tolerar va a un *baseline* explícito y fechado.

Antes de integrar (lo corre CI; durante el desarrollo basta con los tests afectados):

```bash
npm test && npm run test:e2e         # todas las suites: dejan JUnit XML
node herramientas/trazabilidad.ts    # la cadena criterio → test → veredicto no está rota
node herramientas/verificar-docs.ts  # ni enlaces rotos ni diagramas inválidos
npm run lint                         # lint determinista
```

## La matriz de trazabilidad

`docs/specs/TRAZABILIDAD.md` es **generada por CI** y está commiteada para que se lea en el
repositorio. Nunca se edita ni se resuelve a mano:

- **Fuera de CI el guardián no la escribe.** Los veredictos solo son fiables donde corren todas las
  suites en el sistema de referencia; en otra máquina salen rojos que no son reales.
- **Si CI dice que no coincide** (típico tras un merge): `node herramientas/traer-matriz.ts` baja la
  de CI, y se commitea.
- **Fallos que solo ocurren en una plataforma de desarrollo** (p. ej. Windows) se declaran en
  `fallos-conocidos.json`, cada uno con el hallazgo que lo explica. Si fallan esos y solo esos, tu
  cambio está bien. Si aparece uno más, es tuyo.

## Al escribir un criterio de aceptación

- Rellena siempre `Aplicada en:` — `servidor`, `servidor+cliente` o `solo cliente`. `solo cliente`
  obliga a justificarse (`solo cliente · <motivo>`). Un criterio que protege datos o permisos y solo
  lo impone el cliente **es un hallazgo de seguridad**: llévalo a `docs/auditoria/hallazgos.md`.
- La regla va en el cuerpo del criterio, nunca en `Notas:`: si algo se puede incumplir, es criterio.
- No escribas rutas de test en la historia: quién demuestra cada criterio lo dice la matriz.

## Al escribir un test

- **El identificador del criterio va en el NOMBRE del test** (`AC-NNN-MM …`), o en la cabecera o el
  título de sección de un `.sql`. Citarlo en un comentario no cuenta como cobertura.
- **Pruébalo donde se impone la regla**: regla del servidor → test del servidor.
- **El tiempo se inyecta.** Ningún test lee el reloj real (`now()`, `Date.now()`, `LocalDate.now()`):
  un test que depende del día en que se ejecuta pasa hoy y falla el domingo.
- Escríbelo como si nadie fuera a comprobar que prueba lo que dice, porque en ese punto nadie lo
  hace.

## Dónde vive cada cosa

| Necesitas | Mira |
|---|---|
| Cómo se pide y ejecuta un cambio | `docs/PROTOCOLO-CAMBIOS.md` |
| Cómo se llama cada cosa | `docs/GLOSARIO.md` |
| Qué debe hacer el sistema | `docs/specs/` |
| Una regla que el sistema aplica y ninguna historia recoge | `docs/specs/REGLAS-SIN-HISTORIA.md` |
| Qué hace hoy, y qué no | `docs/funcionalidades.md` |
| Cómo está construido | `docs/arquitectura/` |
| Cómo se recorre de punta a punta | `docs/flujos/` |
| Por qué se decidió así | `docs/adr/` |
| Qué está roto o es vulnerable | `docs/auditoria/hallazgos.md` |
| Qué se hará y cuándo | `docs/BACKLOG.md` |

Índice completo en [`docs/README.md`](docs/README.md). **Cada dato tiene un solo dueño**: si lo
escribes en dos sitios, uno de los dos mentirá antes o después. Y **ninguna cifra se escribe a
mano**: se genera, o se cita junto al comando que la produce.

## Cosas de este proyecto que se olvidan

- **Node 22 o nada.** `.nvmrc` y `engines` piden `22.x`; con Node 20 Vitest ni arranca
  (`'node:util' does not provide an export named 'styleText'`) y las herramientas del guardián
  tampoco, porque se ejecutan como TypeScript sin compilar.
- **`AGENTS.md` lo reescribe `next dev`.** Solo se edita fuera del bloque `BEGIN:nextjs-agent-rules`.
  Este `CLAUDE.md` está a salvo: mientras `AGENTS.md` hospede ese bloque, Next lo deja intacto
  (`node_modules/next/dist/server/lib/generate-agent-files.js:98-103`).
- **El middleware se llama `src/proxy.ts`**, no `middleware.ts`: Next 16 lo renombró.
- **La autorización del admin vive en TypeScript, no en RLS.** Las páginas de `/admin` leen con
  `createAdminClient()` (service-role), que **salta RLS**; `src/proxy.ts` solo comprueba que haya
  sesión, no el rol. Quien decide es `verifyAdminPage()` / `requireAdmin()` en
  `src/lib/auth/guards.ts`. Por eso toda ruta nueva bajo `/api/admin/` tiene que llamar a
  `requireAdmin()` explícitamente: nada más la protege.
- **No hay Server Actions.** Toda mutación pasa por un route handler en `src/app/api/`.
- **El estilado es inline y el responsive es manual.** Casi todo es `style={{...}}`, así que una
  media query solo alcanza a un elemento si le pones un gancho `liora-*` y escribes su regla en
  `src/styles/responsive.css` (que pisa con `!important`). Un componente sin gancho queda congelado
  en su tamaño de escritorio.
- **Los parámetros de negocio no se tocan en el código.** Costo de envío, umbral de envío gratis,
  número de WhatsApp y textos de entrega viven en la tabla key/value `store_settings` y se editan
  desde `/admin/configuracion` (`src/lib/settings.ts` tiene los defaults).
- **`EMAIL_DELIVERY_MODE=capture` apaga todos los correos.** No falla ni avisa: guarda el HTML en
  `email_queue.html_snapshot` y marca el job como `captured`. Si en un entorno no llega nada, esto
  es lo primero que hay que mirar.
- **Los correos se encolan, no se envían directo.** El RPC `finalize_paid_order` inserta en
  `email_queue` con `idempotency_key`; el webhook procesa el job al momento y el cron repesca los
  fallidos. Un correo nuevo se añade como un tipo más de la cola, nunca con un `emails.send` suelto.
- **Los crons de Vercel corren una vez al día** (límite del plan Hobby). Nada que necesite
  reaccionar en minutos puede depender de ellos.
- **Las migraciones son la fuente de verdad del esquema**, no la base remota: CI hace `db reset` +
  `db lint --fail-on error` + `test db` sobre un Postgres limpio. Una columna que solo existe en
  producción rompe el CI.
