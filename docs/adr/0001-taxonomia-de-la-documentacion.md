# ADR-0001 · Qué va en cada capa de la documentación, y cómo se sabe
**Estado:** Aceptado · **Fecha:** 2026-10-04

## Contexto

LIORA adopta un método de desarrollo guiado por especificaciones con varias capas de
documentación y una regla: **cada dato tiene un solo dueño**. La experiencia del proyecto del que
procede el método enseña que la regla, por sí sola, no basta. Un barrido a las dos semanas de
adoptarla encontró:

- decenas de reglas de producto alojadas en documentos de arquitectura;
- reglas que solo existían en tablas de flujos;
- reglas escondidas en el campo `Notas:` de las especificaciones, que ningún guardián lee;
- entradas de backlog que eran funcionalidad de producto, no deuda técnica.

Los documentos enunciaban bien cada regla. El problema era que **no había forma de saber si una
frase estaba en su sitio** más que releyéndolo todo. Este ADR da esa forma.

## Decisión

### 1. Las capas y su pregunta

| Capa | Pregunta que responde | Cambia |
|---|---|---|
| `docs/specs/` | ¿Qué **debe** hacer el sistema? | A menudo. Es donde producto trabaja |
| `docs/adr/` | ¿**Por qué** se construyó así? | Rara vez. Y no se edita: se sustituye |
| `docs/arquitectura/` | ¿**Cómo** está construido? | Cuando cambia la técnica, no el negocio |
| `docs/auditoria/` | ¿Qué está **roto**? | Nunca: es una instantánea fechada |
| `docs/BACKLOG.md` | ¿Qué se hará y **cuándo**? Y ¿en qué estado está cada hallazgo? | Continuamente |

### 2. La prueba de la frontera

Ante cualquier frase que se vaya a escribir fuera de una spec:

> **¿Podría producto cambiarla sin que la arquitectura se mueva?**

Si la respuesta es **sí**, es una regla de producto y su sitio es un criterio de aceptación. Si
describe *cómo conseguimos técnicamente cumplir esa regla*, es arquitectura.

| Frase | Capa |
|---|---|
| «Fuera de la zona se avisa, pero la acción no se bloquea» | **Spec.** Producto puede decidir mañana que sí bloquee |
| «La zona la recalcula el servidor, ignorando lo que proponga el cliente» | **Arquitectura.** Cambiarlo no cambia la regla, cambia quién la hace cumplir |
| «Se creyó al cliente hasta la versión 12, y fue un error» | **ADR.** Es el porqué |
| «Un usuario puede saltarse la zona hablando con la API» | **Auditoría** |

Cuando una frase mezcla dos capas se parte: la regla a la spec, el motivo a su capa.

### 3. Una regla vive donde se puede demostrar

Una regla que no está en un criterio de aceptación **no la comprueba nadie**: el guardián solo lee
criterios. Por tanto:

- Las reglas van en el **cuerpo del criterio**, nunca en `Notas:`.
- `Aplicada en:` es **contrato, no implementación**: dice quién hace cumplir la regla. Se queda en la
  spec. Un `solo cliente` que proteja datos o permisos es un hallazgo de seguridad.
- Lo que **no** va en una spec: rutas de archivo, nombres de clase, nombres de migración, **ni qué
  test la cubre**. Todo eso envejece con cada refactor, y su dueño es la matriz generada.
- Una regla que aún no tiene historia se anota en
  [`REGLAS-SIN-HISTORIA.md`](../specs/REGLAS-SIN-HISTORIA.md), no se deja suelta.

### 4. `Propuesto` no autoriza a implementar

Que exista código que implementa un ADR `Propuesto` es un desfase, no una aprobación. Y un ADR **no
se edita cuando cambia la realidad: se sustituye**. Una nota de estado en la cabecera sí es
admisible.

### 5. Nunca un `B-NNN` para lo que debería ser un `US-NNN`

El backlog **planifica**; no especifica. La prueba: si al leer la entrada se puede escribir un
criterio de aceptación, es producto, y la fila del backlog solo debería programarla.

### 6. El vocabulario persistido

La **spec** decide qué estados existen como concepto de producto. El **esquema** (un enum, una
restricción) es la forma en que esa decisión se hace cumplir. Cambiar la spec **obliga a una
migración**. Por eso los clientes no inventan estados, y conviene una regla de lint que prohíba
comparar literales de estado fuera del módulo que los define.

### 7. La auditoría es una foto; su estado vive en el backlog

Si la auditoría se edita al corregir cada hallazgo, deja de ser la foto de un momento y pasa a ser
un segundo backlog. La descripción se congela; el estado (abierto, corregido, descartado) se sigue
en [`BACKLOG.md`](../BACKLOG.md#hallazgos-de-auditoría).

## Consecuencias

**A favor.** La prueba del punto 2 se puede aplicar frase a frase, por una persona o por una IA, sin
haber leído el resto del corpus. Y el punto 3 convierte «esta regla está mal colocada» en algo con
consecuencia mecánica: si no está en un criterio, el guardián no la cubre.

**En contra, y es real.** Aplicar la prueba con rigor genera trabajo de especificación. La salida no
es escribirlo todo de golpe —produciría specs que producto no ha validado— sino
`REGLAS-SIN-HISTORIA.md`, que hace la deuda contable en vez de disolverla.

**Lo que este ADR no resuelve.** Nada impide mecánicamente escribir una regla de producto en un
documento de arquitectura: la prueba es una disciplina, no una comprobación. Lo que sí se automatiza
es que un criterio declarado tenga quien lo demuestre.

## Alternativas descartadas

- **Un único documento de requisitos.** Mezcla el qué, el cómo y el porqué, y no se puede comprobar
  contra el código.
- **Especificar en los tests (BDD puro).** El test es el mejor dueño del *cómo se comprueba*, pero
  un mal dueño del *qué se decidió y por qué*: producto no lee tests.
