# Backlog

Todo lo que queda pendiente, con justificación. **Nada de `TODO` silenciosos en el código**: si no
está aquí, no existe.

El backlog **planifica**, no especifica. Si una entrada describe algo que un usuario puede hacer o
dejar de hacer, es una historia (`US-NNN`) y aquí solo se programa. La prueba: si al leer la entrada
se puede escribir un criterio de aceptación, es producto.

## Pendiente

| ID | Fase | Ítem | Justificación / bloqueo |
|---|---|---|---|
| B-001 | 1 · SDD | Desinstalar el Node 20 que ocupa `C:\Program Files
odejs` | nvm-windows gestiona esa ruta como enlace simbólico, pero ahí hay una instalación normal de Node 20, así que `nvm use` termina con código 0 **sin cambiar nada**. Node 22.23.2 ya está instalado bajo nvm y se usa por su ruta; para que `nvm use 22` funcione hay que desinstalar el Node 20 desde Programas y características (pide permisos de administrador) |
| ~~B-002~~ | 1 · SDD | ~~Convertir el TAP de pgTAP a JUnit XML en CI~~ | **Cerrado 2026-10-04** por `scripts/tests-sql-junit.mjs`, que ejecuta los mismos ficheros con psql en crudo y traduce su TAP. `backend.runner = true` desde entonces, y el baseline que lo toleraba queda retirado |
| ~~B-003~~ | 1 · SDD | ~~Hacer llegar el JUnit de Playwright al guardián~~ | **Retirado 2026-10-04** por [ADR-0002](adr/0002-adoptar-sdd-con-el-guardian-dentro-del-gate.md) §1: el guardián corre dentro de `ci.yml`, donde Playwright ya se ejecuta, así que `e2e.runner = true` desde el principio y no hay nada que cruzar. Lo que decía: duplicar el job en un workflow aparte haría la puerta lenta |
| B-004 | 1 · SDD | Mover `QUIZ_KITS_AUDIT_REPORT.md` y `STRIPE_ORDERS_AUDIT.md` a `docs/auditoria/` | Son instantáneas de auditoría viviendo sueltas en la raíz, fuera de la taxonomía que fija [ADR-0001](adr/0001-taxonomia-de-la-documentacion.md). Hay que numerar sus hallazgos como `AUD-NNN` y traer su estado aquí |
| ~~B-005~~ | 2 · Móvil | ~~Responsive de la tienda en celular~~ | **Cerrado 2026-10-04** por [US-002](specs/TIENDA/comprar-desde-el-celular.md), en DONE con sus 5 criterios en verde |
| ~~B-006~~ | 2 · Móvil | ~~Responsive del panel administrativo~~ | **Cerrado 2026-10-04** por [US-003](specs/ADMIN/atender-desde-el-celular.md), en DONE con sus 5 criterios en verde. Desbloquea B-007: ya se puede atender un pedido desde el celular |
| B-007 | 3 · Avisos | Avisar al dueño por WhatsApp cuando entra un pedido | **Parcial 2026-10-04**: el correo a `hola@liora.pe` y la campana del panel los cierra [US-004](specs/ADMIN/enterarse-de-que-entro-un-pedido.md). Queda el canal de WhatsApp, que depende de B-010 |
| B-008 | 4 · Contenido | Videos reel reales en el home | · **Es producto, no deuda técnica**: nace como US-xxx el día que se aborde. El módulo «#LIORA en TikTok» renderiza un array hardcodeado de marcadores de posición. Depende de [AUD-001](auditoria/hallazgos.md#aud-001) y [AUD-008](auditoria/hallazgos.md#aud-008) |
| B-009 | 5 · Entrega | Entrega en agencia de Shalom / Olva | · **Es producto, no deuda técnica**: nace como US-xxx el día que se aborde. Agencia en provincias, domicilio en Lima. Sin API hasta que haya contrato corporativo con el courier |
| B-013 | legal | Libro de Reclamaciones Virtual | Obligación de Indecopi para quien vende al consumidor. No es una página de texto: necesita formulario, almacenamiento, copia al consumidor y respuesta en 15 días hábiles. [US-005](specs/TIENDA/saber-con-quien-se-compra.md) lo deja fuera a propósito y **no** lo enlaza mientras no exista · **Es producto**: nace como US-xxx |
| B-014 | 2 · Móvil | Quitar los `<main>` anidados de las páginas públicas | El layout de `(store)` ya envuelve todo en un `<main>`; varias páginas añaden otro dentro. Es HTML inválido y confunde a los lectores de pantalla. Las tres de US-005 ya usan `<article>`/`<section>`; faltan `/nosotros`, `/tracking`, `/guia` y las demás |
| B-015 | legal | Código de inscripción del banco de datos ante la ANPD | La Política de Privacidad lo citaría, pero no lo tenemos. La cláusula se omite en vez de publicarse con un hueco; cuando llegue el número se añade |
| B-016 | costo | Reparar la cabecera `Cache-Control` de las imágenes ya subidas | Las ~774 del catálogo responden `no-cache` pese a que los guiones piden un año al subir; la causa no está determinada (uploader del panel, un `upsert` que no actualizó metadata, o el gateway nuevo). Necesita diagnóstico y un guion que se ejecuta **contra producción**. [US-006](specs/TIENDA/servir-el-catalogo-sin-malgastar.md) impide que se sigan creando mal; esto repara las existentes |
| B-017 | costo | La tienda envía el catálogo entero en cada visita | En producción viajan 774 URLs de imagen para dibujar 24 tarjetas, en 860 KB. Origen localizado: `getKits()` en `src/app/(store)/tienda/page.tsx:36` usa `select('*')` y expande cada kit con sus productos miembros. **No se puede demostrar con los datos locales** (58 URLs para 31 imágenes), así que incluye preparar un conjunto de datos que lo reproduzca · **Es producto**: nace como US-xxx |
| B-018 | 2 · Móvil | `shop.spec.ts` falla de forma intermitente | Agota 30 s en `page.goto('/tienda')` con dos workers. Cambia de test entre corridas —`:9` una vez, `:15` la siguiente—, así que es arranque en frío, no un defecto. Deuda preexistente |
| B-010 | 3 · Avisos | Dar de alta WhatsApp Business API | Bloqueo externo: requiere cuenta Meta o proveedor, número verificado y plantilla aprobada. Es el único punto del plan con coste recurrente. Bloquea la mitad de B-007 |
| B-012 | 2 · Móvil | Dos columnas de producto a 320px dejan 91px de contenido | [US-002](specs/TIENDA/comprar-desde-el-celular.md) garantiza que nada desborde, pero a 320px una tarjeta de producto queda con 91px útiles: cabe, y aun así se lee mal. Pasar a una columna por debajo de cierto ancho es una decisión de diseño, que la historia deja fuera de alcance a propósito |
| B-011 | 1 · SDD | Borrar `docs/specs/EJEMPLO/` y liberar el id `US-001` | Se conserva mientras no haya un área real: hoy lo enlazan `funcionalidades.md`, `GLOSARIO.md` y `specs/README.md` como ejemplo de formato, y borrarlo ahora dejaría esos enlaces rotos. Se va con la primera historia de verdad, que será la de B-005 |

<!-- Cerrado:   | ~~B-001~~ | … | ~~título~~ | **Cerrado AAAA-MM-DD** por [ADR/AC/commit] |
     Retirado:  | ~~B-002~~ | … | ~~título~~ | **Retirado AAAA-MM-DD** (motivo). Lo que decía: … |
     Producto:  añadir «· **Es producto, no deuda técnica**: nace como US-xxx el día que se aborde». -->

## Hallazgos de auditoría

La auditoría es una **foto congelada**: la descripción y la evidencia de cada hallazgo viven allí y
no se editan. **Su estado vive aquí.**

| Hallazgo | Sev. | Qué hay que hacer | Estado |
|---|---|---|---|
| [AUD-001](auditoria/hallazgos.md#aud-001) | Alto | Mover el límite de tipo y tamaño al bucket (`allowed_mime_types`, `file_size_limit`) por migración | Abierto |
| ~~[AUD-002](auditoria/hallazgos.md#aud-002)~~ | ~~Alto~~ | — | **Descartado 2026-10-04**: falso positivo. La columna sí la crea `20260712021621_order_guide_snapshots.sql:2`, con `ADD COLUMN` en mayúsculas, que la búsqueda del hallazgo no cogía. Comprobado contra una base reconstruida desde cero. Ver [la corrección](auditoria/hallazgos-2026-10-04-ejecucion.md#corrección-sobre-la-instantánea-anterior) |
| [AUD-003](auditoria/hallazgos.md#aud-003) | Alto | Leer `EMAIL_DELIVERY_MODE` en Vercel; invertir el defecto y exponer los jobs `captured` en `/admin/operaciones` | Abierto · requiere verificación en producción |
| [AUD-004](auditoria/hallazgos.md#aud-004) | Medio | Disparar `processEmailJob` también desde el redirect y registrar el error en vez de tragarlo | Abierto |
| [AUD-005](auditoria/hallazgos.md#aud-005) | Medio | Crear `/terminos` y `/contacto` | Corregido 2026-10-04 por [US-005](specs/TIENDA/saber-con-quien-se-compra.md); el criterio AC-005-01 cubre todos los enlaces del pie, no solo los dos que fallaban |
| [AUD-006](auditoria/hallazgos.md#aud-006) | Medio | Borrar el `console.log` de `tracker.ts` | Corregido 2026-10-04 · con test de regresión en `tests/unit/analytics-tracker-ssr.test.ts`, verificado restaurando el fallo |
| [AUD-007](auditoria/hallazgos.md#aud-007) | Bajo | Leer `addresses.district` en el prefill del checkout | Corregido 2026-10-04 |
| [AUD-008](auditoria/hallazgos.md#aud-008) | Bajo | Declarar `media-src` en la CSP al añadir el primer reproductor | Corregido 2026-10-04 · declarado antes de tiempo, para que el reproductor de la fase 4 no nazca bloqueado |
| [AUD-009](auditoria/hallazgos.md#aud-009) | Bajo | Meter `.liora-mobile-nav` dentro de su media query | Corregido 2026-10-04 · lo fija [AC-002-05](specs/TIENDA/comprar-desde-el-celular.md) |
| [AUD-010](auditoria/hallazgos.md#aud-010) | Bajo | Borrar o conectar `order-guide.ts` | Abierto |
| [AUD-011](auditoria/hallazgos.md#aud-011) | Informativo | Migrar las fuentes a `next/font/google` | Abierto |
| [AUD-012](auditoria/hallazgos-2026-10-04-ejecucion.md#aud-012) | Medio | Revocar los permisos de tabla de `anon` y `authenticated` sobre las tres tablas de analítica | Corregido 2026-10-04 · migración `20261004120000`; su test llevaba tiempo en rojo y ahora pasa |
| [AUD-013](auditoria/hallazgos-2026-10-05.md#aud-013) | Alto | Servir las imágenes optimizadas y cacheables, y dejar de enviar el catálogo entero | Parcial 2026-10-05 · [US-006](specs/TIENDA/servir-el-catalogo-sin-malgastar.md) cierra la optimización y la política de subida; quedan B-016 y B-017 |

<!-- Estado: Abierto · Parcial · Corregido AAAA-MM-DD (commit/migración) · Resuelto por ADR-NNNN · Descartado (motivo) -->

## Baselines de puertas

Deuda que una puerta tolera a sabiendas. Cada línea tiene fecha y un `B-NNN` que la liquida: una
excepción sin dueño ni fecha es una puerta rota que nadie mira.

| Puerta | Qué tolera | Desde | Se liquida con |
|---|---|---|---|

*Ninguno abierto.* El último, `backend.runner = false`, se liquidó el 2026-10-04 con B-002.
