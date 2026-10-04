# Glosario

Esta página es el **único dueño** de la traducción entre el lenguaje del producto y los nombres del
código. Si escribes una historia, un criterio o un flujo, usa la columna de la izquierda.

Existe porque una misma palabra acaba nombrando cosas distintas —y cada conversación sobre una
regla empieza por averiguar de qué se está hablando—.

| En las historias | Qué es | En el código |
|---|---|---|
| **Pedido** | Lo que un cliente encarga. Tiene un estado, y solo el servidor lo cambia | `pedidos`, `EstadoPedido` |
| **Cancelar** | Pasar un pedido a `cancelado` sin coste. Solo desde `pendiente` ([AC-001-01](specs/EJEMPLO/historia-ejemplo.md)) | `cancelar_pedido()` |

## Las palabras que no se usan

| No digas | Porque | Di |
|---|---|---|
| {{palabra ambigua}} | {{qué dos cosas nombraba}} | {{la palabra buena}} |

<!-- Cuando se retira un término: se tacha aquí, con la fecha y el ADR que lo retira. -->
