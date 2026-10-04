# Documentación de {{PROYECTO}}

Cada documento responde a **una** pregunta y tiene **un** dueño: si un dato aparece en dos sitios,
uno de los dos miente antes o después.

## Regla de propiedad única

| Pregunta | Dueño | Naturaleza |
|---|---|---|
| ¿Cómo se pide y ejecuta un cambio? | [`PROTOCOLO-CAMBIOS.md`](PROTOCOLO-CAMBIOS.md) | Vivo · se lee antes de tocar |
| ¿Cómo se llama cada cosa? | [`GLOSARIO.md`](GLOSARIO.md) | Vivo · se lee antes de escribir |
| ¿Qué **debe** hacer el sistema? | [`specs/`](specs/README.md) | Vivo · fuente de verdad |
| ¿Qué test demuestra cada criterio? | [`specs/TRAZABILIDAD.md`](specs/README.md#la-matriz) | Generado por CI · no se edita |
| ¿Qué hace **hoy**, y qué no? | [`funcionalidades.md`](funcionalidades.md) | Vivo |
| ¿**Cómo** está construido? | [`arquitectura/`](arquitectura/README.md) | Vivo · cambia con la técnica |
| ¿Cómo se recorre de punta a punta? | [`flujos/`](flujos/README.md) | Vivo |
| ¿**Por qué** se decidió así? | [`adr/`](adr/README.md) | Histórico · se sustituye, no se edita |
| ¿Qué está **roto** o es vulnerable? | [`auditoria/`](auditoria/README.md) | Instantánea fechada · no se edita |
| ¿Qué se hará y **cuándo**? | [`BACKLOG.md`](BACKLOG.md) | Vivo · también lleva el estado de cada hallazgo |

Corolarios:

- Un hallazgo se **describe** en la auditoría y se **planifica y sigue** en el backlog. En el backlog
  va la fila con el `AUD-NNN` y su estado, nunca la descripción repetida.
- Una regla de negocio vive en su criterio de aceptación, aunque se implemente en tres sitios.
- El estado de una historia vive en su frontmatter, y en ningún otro sitio.
- Qué test cubre qué criterio lo dice la matriz generada, no la historia.

## La prueba de la frontera

Ante cualquier frase que se vaya a escribir en `arquitectura/`, un flujo o un ADR:

> **¿Podría producto cambiarla sin que la arquitectura se mueva?**

Si la respuesta es sí, es una regla de producto y su sitio es un criterio de aceptación. Si la frase
mezcla las dos cosas, se parte: la regla a la spec, el porqué o el cómo a su capa. El detalle, con
ejemplos, está en [ADR-0001](adr/0001-taxonomia-de-la-documentacion.md).

## Convenciones

- **Identificadores que nunca se reutilizan ni se reordenan**: `US-NNN` (historia), `AC-NNN-MM`
  (criterio), `ADR-NNNN`, `AUD-NNN` (hallazgo), `B-NNN` (backlog), `F-NN` (flujo). Lo retirado se
  queda en su sitio, tachado y con el motivo.
- **Diagramas en Mermaid**, validados por `node herramientas/verificar-docs.ts`.
- **Referencias a código**: `ruta/archivo.ext` más el nombre del símbolo. El número de línea envejece
  con cada cambio; el símbolo, no.
- **Ninguna cifra a mano.** Toda cifra se genera o se cita junto al comando que la produce. Un
  «índice de las 31 decisiones» que ya son 49 es un dato con dos dueños: el índice y la carpeta.
