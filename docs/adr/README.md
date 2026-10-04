# Architecture Decision Records

Por qué se construyó así. Formato corto: **Contexto → Decisión → Consecuencias → Alternativas
descartadas**. Plantilla: [`plantilla.md`](plantilla.md).

**Estados:** `Propuesto` (espera confirmación) · `Aceptado` · `Aceptado con reservas` (vigente en lo
esencial, con una parte desfasada) · `Sustituido por NNNN` · `Obsoleto`.

Tres reglas:

1. **Un ADR no se reescribe cuando cambia la realidad: se sustituye.** Editar uno en su sitio
   produce un documento que se contradice entre su cabecera y su cuerpo. Añadir una **nota de
   estado** en la cabecera sí es admisible: señala sin reescribir.
2. **`Propuesto` no autoriza a implementar.** Que exista código que implementa un ADR `Propuesto` es
   un desfase, no una aprobación. Se etiqueta `Propuesto · implementación existente en revisión` y
   dice qué hace hoy el sistema y qué se propone.
3. **Si el cuerpo de un ADR contradice al código**, la verdad sobre el *cómo* está en
   [`../arquitectura/`](../arquitectura/README.md); aquí queda por qué se decidió lo que se decidió.

Numeración: `NNNN-la-decision-en-una-frase.md`, secuencial, sin reutilizar. El nombre del archivo
es la decisión, no el tema: `0032-la-sesion-dura-el-turno.md`, no `0032-sesion.md`.

| Nº | Decisión | Estado |
|---|---|---|
| [0001](0001-taxonomia-de-la-documentacion.md) | Qué va en cada capa de la documentación, y cómo se sabe | Aceptado |
| [0002](0002-adoptar-sdd-con-el-guardian-dentro-del-gate.md) | Adoptar SDD con el guardián dentro de la puerta de producción | Aceptado |

<!-- La columna Estado lleva las relaciones: «Aceptado — su §2 lo **modifica [0007](…)**» ·
     «**Sustituido por [0009](…)**». Este índice no lleva totales escritos a mano. -->
