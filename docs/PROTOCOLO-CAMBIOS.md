# Protocolo de cambios

El objetivo del método es **evitar regresiones, no aumentar la ceremonia**.

Cuando se pide un cambio funcional, **no se empieza implementando** y **no se genera documentación
adicional** por iniciativa propia.

## Antes del cambio

Leer únicamente:

1. La spec directamente afectada.
2. Las specs que esa spec enlace explícitamente.
3. El contrato funcional del área, si existe.
4. El código y los tests relacionados.

No recorrer todos los ADR, la arquitectura y los flujos salvo que exista una dependencia directa.

Responder primero con este análisis de impacto:

### Estado actual

Máximo 5 puntos: lo que el sistema y la spec establecen hoy.

### Cambio entendido

Máximo 5 puntos: cómo debe funcionar después.

### Diferencia

Exactamente qué criterios **cambian**, cuáles **se añaden** y cuáles **se retiran** (por su id).

### Fuera de alcance

Qué comportamientos relacionados **no** se van a modificar.

### Dudas bloqueantes

Solo aquello sin lo cual existen dos implementaciones funcionalmente distintas. Lo que tenga una
respuesta razonable por defecto no se pregunta: se decide y se dice.

**No modificar archivos todavía.** Cuando quien pidió el cambio confirme el entendimiento, se
implementa sin pedir una segunda aprobación.

## Durante la implementación

Orden: **spec afectada → tests afectados → código.**

- Los tests se actualizan antes que el código y **deben fallar**: es la señal de que el cambio es
  real.
- **No se crea un ADR por una decisión funcional.** Un ADR solo se crea cuando cambia una decisión
  técnica estructural:
  - modelo de persistencia;
  - límites entre módulos;
  - mecanismo de seguridad;
  - tecnología;
  - contratos estructurales;
  - estrategia de comunicación;
  - una decisión técnica costosa de revertir.
- Cambiar una regla de negocio, añadir o retirar una funcionalidad o modificar un flujo **no**
  requiere ADR por sí mismo. Retirar un criterio casi siempre sí: retirar una regla es una decisión.
- No se actualiza la arquitectura cuando solo cambia comportamiento funcional.
- No se actualiza un flujo si la secuencia de actores y sistemas no cambió.
- **No se hacen refactors oportunistas.**
- No se tocan historias o criterios que no estén en el análisis de impacto. Si hace falta, **se
  detiene el trabajo y se reporta** antes de ampliar el alcance.
- **El estado de la historia se mueve en el mismo cambio** que lo justifica: el primer código la
  lleva a `IMPLEMENTING`; el último verde, a `TESTING` o `DONE`. El guardián avisa si el estado se
  queda atrás.

## Tests

**Cada criterio se prueba en el punto que tiene autoridad sobre la regla.** No se duplica la misma
regla automáticamente en todas las plataformas.

| La regla la impone… | El test autoritativo está en… |
|---|---|
| el servidor | el servidor |
| solo un cliente | ese cliente |
| el servidor, y el cliente la repite para avisar antes | el servidor; el del cliente solo si el comportamiento visible lo justifica |

- El id del criterio va en el **nombre** del test.
- **El tiempo se inyecta**: ningún test depende del día, la hora o la zona horaria en que se ejecuta.
- Durante el desarrollo se ejecutan solo los tests afectados. La regresión completa, el E2E completo
  y la trazabilidad global se ejecutan antes de integrar, en CI.

## Specs en `DRAFT`

Una spec en `DRAFT` puede cambiar libremente. Mientras siga en `DRAFT`:

- no requiere cobertura completa;
- no requiere ADR por cada cambio;
- no sube su versión por cada corrección;
- no obliga a actualizar documentos derivados.

La versión sube solamente cuando cambia comportamiento que ya había sido aprobado.

## Regla principal

La fuente de verdad funcional es [`specs/`](specs/). La seguridad proviene de:

**spec aprobada → test autoritativo → código → regresión.**

No de duplicar la misma decisión en varios documentos.
