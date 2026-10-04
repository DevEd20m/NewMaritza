# Trazabilidad

**Generado por `node herramientas/trazabilidad.ts` en CI. No editar a mano.** Tras un merge no se resuelve el
conflicto a mano: se regenera o se trae el artefacto de CI.

Leyenda: ✅ el test se ejecutó y pasó · ❌ falló · ⚠️ hay test pero ninguna suite lo ejecutó ·
○ sin ningún test · 🪦 retirado: se comprueba que **no** le quede ningún test · `·` la
plataforma no aplica al criterio, según su campo «Aplicada en».

| Historia | Estado | Criterio | Android | Web | Backend | Se hace cumplir en | Tests |
|---|---|---|---|---|---|---|---|
| [US-001](EJEMPLO/historia-ejemplo.md) Cancelar un pedido | SPECIFIED | **AC-001-01** Un pedido pendiente se cancela y no se cobra | · | · | ○ | servidor · la transición la hace la función que cambia el estado; el cliente solo la pide | — |
|  |  | **AC-001-02** 🪦 ~~Un pedido se puede cancelar en cualquier momento~~ | · | · | · | retirado · v2, 2026-01-15 · [ADR-0001](../adr/0001-taxonomia-de-la-documentacion.md) | — |
|  |  | **AC-001-03** Un pedido que ya salió no se cancela | · | ○ | ○ | servidor+cliente · el servidor rechaza; el cliente no ofrece el botón y explica el motivo | — |
|  |  | **AC-001-04** El botón de cancelar dice qué va a pasar | · | ○ | · | solo cliente · es presentación: la regla de cobro está en AC-001-01 | — |
