# ADR-0002 · Adoptar SDD con el guardián dentro de la puerta de producción
**Estado:** Aceptado · **Fecha:** 2026-10-04
> **Nota de estado (2026-10-04):** su **§3 ya no describe la realidad**. `backend.runner` pasó a
> `true` el mismo día, al cerrarse `B-002` con `scripts/tests-sql-junit.mjs`. Con ello decae
> también la tercera consecuencia «en contra» que este ADR aceptaba. El resto sigue vigente.

## Contexto

LIORA está en producción y vendiendo, pero no tiene método de desarrollo: no hay `docs/`, ninguna
regla de negocio está especificada, y lo que el sistema debe hacer solo existe en el código y en la
cabeza de quien lo escribió. La auditoría del 2026-10-04 (`AUD-001` … `AUD-011`) destapó, entre
otras cosas, un drift de esquema que nadie detectó durante meses (`AUD-002`) y un modo de
configuración que puede apagar todos los correos sin fallar (`AUD-003`): dos problemas que una
cadena criterio → test → veredicto habría hecho visibles.

Se decide adoptar el método SDD de `sdd-kit` como estándar. La pregunta que resuelve este ADR no es
*si* adoptarlo, sino **de dónde saca el guardián sus veredictos**, porque el kit propone un workflow
propio (`especificaciones.yml`) que en este repositorio choca con lo que ya existe.

El estado de las suites en el momento de adoptar:

| Suite | Dónde corre | Emite JUnit XML | Necesita |
|---|---|---|---|
| Vitest (`tests/unit`) | `ci.yml` | sí, desde este cambio | nada |
| Playwright (`tests/e2e`) | `ci.yml` | sí, desde este cambio | Supabase de staging, claves Stripe de test, navegadores |
| pgTAP (`supabase/tests`) | `ci.yml`, vía `supabase test db` | **no: emite TAP** | un conversor TAP → JUnit |

`ci.yml` («Production gate») ya ejecuta las tres con todos sus secretos y un Postgres efímero, y ya
se dispara en cada pull request sin filtro de rutas.

## Decisión

### 1. El guardián corre dentro de `ci.yml`, no en un workflow aparte

Los pasos `trazabilidad`, `verificar-docs` y la comprobación de la matriz se añaden al final del job
`quality` de `ci.yml`. No se crea `especificaciones.yml`.

El kit recomienda un workflow propio porque «la cadena cruza todas las plataformas: engancharlo al
de una sola haría que renombrar un test de otra disparase trabajo que no le toca». Ese razonamiento
supone varias plataformas con CI independiente. LIORA tiene una sola aplicación y un único job que
ya ejecuta todo: aquí no hay trabajo ajeno que disparar, y separarlo significaría duplicar 25
minutos de ejecución y dos copias del bloque de secretos y del arranque de Supabase.

### 2. `if: always()` cumple el papel del `continue-on-error` que pide el kit

El kit ejecuta las suites con `continue-on-error` para que un test rojo se refleje como ❌ en su
criterio en vez de cortar el flujo antes de contarlo. Aquí no se puede: `ci.yml` es la puerta de
producción y un test rojo **debe** tumbarla.

Lo que sí se puede es marcar los pasos del guardián con `if: always()`, que los ejecuta pase lo que
pase con los anteriores. El efecto sobre la matriz es el mismo —se genera y dice la verdad aunque
una suite haya fallado— sin rebajar la puerta.

### 3. `backend` se declara como plataforma con `"runner": false`

`supabase/tests` queda declarado —para que sus tests se escaneen y sus etiquetas `AC-NNN-MM`
cuenten— pero sin exigir veredicto, porque pgTAP emite TAP y el guardián lee JUnit. El guardián
marca esos criterios como ⚠️ («hay test pero ninguna suite lo ejecutó») en vez de ❌.

Es un **baseline fechado** en [`../BACKLOG.md`](../BACKLOG.md#baselines-de-puertas), con `B-002`
como la entrada que lo liquida. No es permanente y tiene dueño.

### 4. El contrato de trabajo vive en `CLAUDE.md`, debajo de `@AGENTS.md`

`next dev` regenera ficheros de reglas para agentes. Comprobado en
`node_modules/next/dist/server/lib/generate-agent-files.js:98-103`: mientras `AGENTS.md` contenga el
marcador `BEGIN:nextjs-agent-rules`, Next actualiza **solo ese bloque de `AGENTS.md`** y devuelve
`claudeMd: 'skipped'`. Por tanto `CLAUDE.md` es un sitio estable para el contrato, siempre que la
primera línea siga siendo `@AGENTS.md` para no perder las reglas de Next.

### 5. Las historias se escriben al tocar cada área, no de golpe

No se especifica el sistema entero antes de seguir trabajando. Cada fase del plan vigente escribe su
propia `US-NNN` cuando le toca. Lo que ya existe y nadie ha especificado se recoge, mientras tanto,
en [`../specs/REGLAS-SIN-HISTORIA.md`](../specs/REGLAS-SIN-HISTORIA.md).

## Consecuencias

**A favor.** Dos de las tres plataformas dan veredictos desde el primer día, incluida la de
extremo a extremo, que es donde se demuestran los criterios de interfaz y de recorrido completo. No
hay configuración duplicada. Y la matriz se genera en el mismo sitio donde corren los tests, que es
la única manera de que los veredictos sean ciertos.

**En contra, y es real.** Tres cosas:

1. **La puerta del guardián tarda lo que tarda `ci.yml`**: unos 25 minutos, también para un cambio
   que solo toca `docs/`. El kit habría dado respuesta en dos. Se acepta porque `ci.yml` ya se
   dispara en todos los pull requests sin filtro de rutas, así que no se añade ninguna espera que no
   existiera.
2. **Si una suite falla pronto, las posteriores no llegan a ejecutarse** y sus criterios salen ⚠️ en
   la matriz de esa ejecución. El `if: always()` garantiza que el guardián corra, no que las suites
   lo hagan. En la práctica eso solo ocurre con CI ya en rojo, que es una situación que se arregla,
   no que se interpreta.
3. **Los criterios demostrados solo en pgTAP no pueden llevar su historia a `DONE`**, porque el
   método exige un test verde por plataforma con runner. Eso empuja a demostrar reglas de servidor
   en una suite que no es la del servidor — justo el sesgo contra el que advierte el método cuando
   dice «pruébalo donde se impone la regla». Es un coste aceptado con fecha (2026-10-04) y con una
   entrada de backlog que lo liquida; si dentro de tres meses `B-002` sigue abierto, la decisión hay
   que revisarla, no renovarla en silencio.

**Lo que este cambio no toca.** `ci.yml` sigue siendo la puerta de producción con las mismas
exigencias: ningún test deja de correr ni deja de tumbar la build. No cambia nada del código de la
aplicación. Y `dependencias-programado.yml` sí se queda como workflow aparte, porque depende de la
red y de la fecha y por eso mismo no puede ser una puerta.

## Alternativas descartadas

- **El workflow aparte que propone el kit, ejecutando solo la suite unitaria.** Era la opción
  inicial. Da una puerta rápida y sin secretos, pero deja `e2e` sin veredictos, y la primera
  historia real —el responsive móvil, que solo se puede demostrar en un navegador— habría nacido ya
  incapaz de llegar a `DONE`. Un método cuya primera historia no puede cerrarse no se adopta: se
  abandona.
- **El workflow aparte duplicando el job completo.** Daría veredictos de todo, pero convierte la
  puerta en 25 minutos *añadidos* a los 25 que ya existen, y obliga a mantener dos copias del bloque
  de secretos y del arranque de Supabase. Dos copias de una configuración divergen.
- **Poner `continue-on-error` en las suites de `ci.yml`** para seguir el kit al pie de la letra.
  Haría que un test rojo no tumbase la puerta de producción. Inaceptable: es exactamente lo que la
  puerta existe para impedir.
- **Esperar a tener los tres runners antes de adoptar el método.** Es la opción que suena más
  rigurosa y la que garantiza que nunca se adopte.
