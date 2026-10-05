---
id: US-003
titulo: Atender el negocio desde el celular
area: ADMIN
estado: DONE
plataformas: [e2e]
version: 1
---

Como dueña de LIORA
quiero usar el panel desde el celular
para poder atender un pedido en el momento en que me entero de que entró, sin tener que llegar a
una computadora.

**Vocabulario:** [GLOSARIO.md](../../GLOSARIO.md) · **Entorno:** [entorno-local.md](../../arquitectura/entorno-local.md)

> **v1 (2026-10-04):** primera versión. Nace de medir el panel a 360 px: no desborda, pero deja
> **40 px útiles de contenido**.

El panel no desborda a lo ancho, y eso engaña: `AdminShell` tiene `overflow: hidden`, así que en vez
de desbordar **aplasta**. Con la barra lateral de 240 px fija y 40 px de relleno a cada lado, en una
ventana de 360 px el área de contenido mide 120 px y su interior 40. No hay desplazamiento
horizontal que rescate nada, porque el contenedor lo recorta.

Esta historia no pide que el panel sea bonito en el celular. Pide que **se pueda usar**.

**El ancho de referencia es 360 px**, y los criterios se comprueban también en 320, 390 y 412.

## Criterios de aceptación

### AC-003-01 · El contenido ocupa la pantalla, no un margen de ella
Dado que abro cualquier pantalla del panel en una pantalla angosta
cuando termina de cargar
entonces el área de contenido ocupa prácticamente todo el ancho de la ventana: la navegación no se
queda con la mayor parte.

- **Aplicada en:** solo cliente · es maquetación; el servidor devuelve el mismo HTML en cualquier pantalla
- **Notas:** «prácticamente todo» se comprueba como al menos el 90 % del ancho de la ventana. El
  umbral existe para que el criterio sea medible, no porque 90 sea una cifra de diseño.

### AC-003-02 · La navegación del panel sigue estando a mano
Dado que la barra lateral deja de mostrarse en una pantalla angosta
cuando pido el menú
entonces puedo llegar a cualquiera de las secciones del panel.

- **Aplicada en:** solo cliente · la navegación es un enlace por sección, siempre la misma lista
- **Notas:** esconder la barra sin dar otra forma de navegar dejaría el panel inutilizable en el
  celular, que es lo contrario de lo que pide esta historia.

### AC-003-03 · Una tabla más ancha que la pantalla se puede recorrer entera
Dado un listado cuyas columnas no caben en el ancho de la ventana
cuando lo miro en una pantalla angosta
entonces puedo desplazarlo a lo ancho hasta ver la última columna.

- **Aplicada en:** solo cliente · qué cabe en la pantalla y qué se puede desplazar solo lo sabe el navegador
- **Notas:** hoy esas tablas quedan recortadas por un `overflow: hidden` de un contenedor superior,
  sin ninguna forma de alcanzar lo que queda fuera. El patrón correcto ya existe en el panel, en la
  tabla de analítica.

### AC-003-04 · Los paneles de detalle caben en la pantalla
Dado que abro el detalle de un pedido, un producto, un kit o un cupón
cuando el panel lateral termina de abrirse
entonces cabe completo a lo ancho de la ventana y sus controles quedan dentro de ella.

- **Aplicada en:** solo cliente · el panel se dibuja entero en el navegador; el servidor no interviene
- **Notas:** son cuatro paneles con anchos fijos distintos (580, 680, 680 y 600 px), todos anclados
  a la derecha: lo que se sale lo hace por la izquierda, que es donde está el contenido.

### AC-003-05 · Ninguna pantalla del panel desborda a lo ancho
Dado cualquier pantalla del panel en una pantalla angosta
cuando termina de cargar
entonces el documento no es más ancho que la ventana.

- **Aplicada en:** solo cliente · el ancho del documento solo existe en el navegador
- **Notas:** hoy se cumple por accidente —el `overflow: hidden` lo esconde— y por eso el criterio se
  escribe ahora: al dejar que el contenido ocupe la pantalla (AC-003-01) deja de haber red, y sin
  este criterio la corrección podría introducir el desborde que hoy no existe.

## Fuera del alcance de esta historia

- **La tienda.** Es [US-002](../TIENDA/comprar-desde-el-celular.md).
- **El aviso de que entró un pedido.** Poder atenderlo desde el celular y enterarse de que hay algo
  que atender son dos cosas distintas; la segunda tendrá su historia.
- **Rediseñar el panel.** Qué columnas se muestran, en qué orden y con qué jerarquía en una pantalla
  angosta es diseño. Aquí solo se exige que todo sea alcanzable.
- **La campana del topbar**, que hoy no hace nada: no es un problema de pantalla angosta.
