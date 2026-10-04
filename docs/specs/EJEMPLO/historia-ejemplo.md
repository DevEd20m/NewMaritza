---
id: US-001
titulo: Cancelar un pedido
area: EJEMPLO
estado: SPECIFIED
plataformas: [web, backend]
version: 2
---

Como cliente
quiero cancelar un pedido que aún no ha salido
para que no se me cobre algo que ya no necesito.

**Vocabulario:** [GLOSARIO.md](../../GLOSARIO.md) · **Decisiones:** [ADR-0001](../../adr/0001-taxonomia-de-la-documentacion.md)

> **v2 (2026-01-15):** cancelar deja de estar permitido una vez el pedido sale del almacén. Nace
> **AC-001-03**; se retira **AC-001-02**, que decía lo contrario.
>
> **v1 (2026-01-02):** primera versión.

> Esta historia es el ejemplo del kit: muestra el formato completo, incluida una lápida. Bórrala
> —y la carpeta `EJEMPLO/`— cuando tengas tu primera historia real.

## Criterios de aceptación

### AC-001-01 · Un pedido pendiente se cancela y no se cobra
Dado un pedido mío en estado **pendiente**
cuando lo cancelo
entonces pasa a **cancelado** y **no se genera ningún cobro**.

- **Aplicada en:** servidor · la transición la hace la función que cambia el estado; el cliente solo la pide
- **Notas:** «pendiente» es el único estado desde el que cancelar no tiene coste para el almacén.

### AC-001-02 · ~~Un pedido se puede cancelar en cualquier momento~~
**RETIRADO en v2.** Lo sustituye **AC-001-03**, que dice lo contrario.

- **Retirado:** v2, 2026-01-15 · [ADR-0001](../../adr/0001-taxonomia-de-la-documentacion.md)
- **Qué decía:** el cliente podía cancelar hasta la entrega.
- **Por qué se fue:** cancelar un pedido ya enviado obligaba a una devolución que el almacén no
  podía absorber.
- **Su número no se reutiliza.** Ningún test puede volver a nombrarlo: lo comprueba el guardián.

### AC-001-03 · Un pedido que ya salió no se cancela
Dado un pedido mío que ya **salió del almacén**
cuando intento cancelarlo
entonces se rechaza y se me dice **por qué** y **qué puedo hacer** (una devolución).

- **Aplicada en:** servidor+cliente · el servidor rechaza; el cliente no ofrece el botón y explica el motivo

### AC-001-04 · El botón de cancelar dice qué va a pasar
Dado un pedido que se puede cancelar
cuando veo su detalle
entonces el botón explica que **no se cobrará nada**.

- **Aplicada en:** solo cliente · es presentación: la regla de cobro está en AC-001-01

## Fuera del alcance de esta historia

- Las devoluciones de pedidos entregados (tendrán su propia historia).
- Cancelar un pedido ajeno: lo impide la autorización general, no esta historia.
