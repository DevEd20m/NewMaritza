---
id: US-004
titulo: Enterarse de que entró un pedido
area: ADMIN
estado: DONE
plataformas: [backend, web, e2e]
version: 1
---

Como dueña de LIORA
quiero que el sistema me avise cuando alguien compra
para no descubrir el pedido días después, cuando el cliente ya se cansó de esperar.

**Vocabulario:** [GLOSARIO.md](../../GLOSARIO.md) · **Atender el pedido:** [US-003](atender-desde-el-celular.md)

> **v1 (2026-10-04):** primera versión. Hoy no existe ningún aviso: los únicos correos del sistema
> van al cliente, y la campana del panel es un botón sin `onClick`.

El sistema ya encola dos correos cuando un pedido se paga, ambos **al cliente**. Esta historia añade
un tercer destinatario, el negocio, por la misma cola: los reintentos, la idempotencia y el repesque
por cron ya existen y no hay motivo para inventar otro camino.

## Criterios de aceptación

### AC-004-01 · Cuando un pedido queda pagado, se encola un aviso para el negocio
Dado un pedido que pasa a **pagado**
cuando se confirma el pago
entonces queda encolado un aviso dirigido al negocio, además de los correos que ya recibe el
cliente.

- **Aplicada en:** servidor · lo decide la misma función que marca el pedido como pagado; ningún cliente participa
- **Notas:** un pedido que queda en revisión de pago (cobrado sin inventario) **no** genera aviso de
  venta: no hay nada que despachar todavía. Ese caso ya tiene su propia pantalla en Operaciones.

### AC-004-02 · El aviso se encola una sola vez por pedido
Dado un pedido cuya confirmación de pago llega dos veces —el webhook y la vuelta del navegador, o
un reintento de la pasarela—
cuando se procesa la segunda
entonces el aviso al negocio sigue siendo uno solo.

- **Aplicada en:** servidor · la garantiza la clave de idempotencia de la cola, no quien la llama

### AC-004-03 · El aviso trae lo necesario para atender el pedido
Dado un aviso de venta
cuando el negocio lo abre
entonces encuentra el número de pedido, quién compró y cómo contactarle, qué compró, el total, y un
enlace que lleva al pedido en el panel.

- **Aplicada en:** servidor · el contenido lo arma el servidor al entregar
- **Notas:** el correo de confirmación al cliente no muestra los datos de envío
  ([AUD-004](../../auditoria/hallazgos.md#aud-004) no lo cubre), pero el aviso interno sí los
  necesita: es lo que hay que leer para despachar.

### AC-004-04 · El destinatario del aviso se puede cambiar sin tocar el código
Dado que el negocio cambia su dirección de contacto
cuando se actualiza la configuración del entorno
entonces el aviso pasa a llegar a la nueva dirección sin desplegar código nuevo.

- **Aplicada en:** servidor
- **Notas:** hoy el remitente está escrito a mano en `src/lib/email/client.ts`. El destinatario del
  aviso no repite ese error.

### AC-004-05 · El panel dice cuántos pedidos están sin atender
Dado que hay pedidos pagados que todavía no se han despachado
cuando abro cualquier pantalla del panel
entonces veo cuántos son, y puedo llegar a ellos desde ahí.

- **Aplicada en:** servidor+cliente · el recuento lo calcula el servidor; el cliente solo lo muestra y enlaza
- **Notas:** «sin atender» son los pedidos en `paid` o `processing`: pagados y aún no enviados.

## Fuera del alcance de esta historia

- **El aviso por WhatsApp.** Exige WhatsApp Business API con número verificado y plantilla aprobada,
  que es un alta externa con coste recurrente ([B-010](../../BACKLOG.md)). Tendrá su propia historia
  cuando la cuenta exista; el aviso por correo no depende de ella.
- **Que el correo salga de verdad.** Si `EMAIL_DELIVERY_MODE` vale `capture`, nada sale por Resend y
  el aviso se queda en la cola como los demás ([AUD-003](../../auditoria/hallazgos.md#aud-003)). Es
  un problema de configuración del entorno, no de esta historia.
- **Avisar de otras cosas**: un pago en revisión, un correo fallido, stock crítico. Operaciones ya
  los muestra; avisar de ellos es otra historia.
- **El tiempo que tarda en llegar.** Si el webhook de la pasarela falla, el aviso espera al cron
  diario. Acortarlo es [AUD-004](../../auditoria/hallazgos.md#aud-004) y se arregla aparte.
