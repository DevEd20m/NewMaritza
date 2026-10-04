---
id: US-002
titulo: Comprar desde el celular
area: TIENDA
estado: DONE
plataformas: [e2e]
version: 1
---

Como visitante que entra desde el celular
quiero leer la tienda y comprar sin que el contenido se solape, se corte o se salga de la pantalla
para que pueda decidir y pagar sin pelearme con la página.

**Vocabulario:** [GLOSARIO.md](../../GLOSARIO.md) · **Decisiones:** [ADR-0002](../../adr/0002-adoptar-sdd-con-el-guardian-dentro-del-gate.md)

> **v1 (2026-10-04):** primera versión. Nace de un defecto reportado con captura —en la ficha de
> producto el título se dibuja encima de la foto— y de la auditoría
> [AUD-009](../../auditoria/hallazgos.md#aud-009).

Esta historia fija el comportamiento mínimo de la tienda en pantallas angostas. No describe cómo
debe verse —eso es diseño— sino qué no puede pasar: que un texto tape a otro, que algo quede fuera
de la pantalla, o que un control no se pueda tocar.

**El ancho de referencia es 360 px**, el más común entre los visitantes de LIORA, y los criterios se
comprueban también en 320, 390, 412 y 768 px.

## Criterios de aceptación

### AC-002-01 · En la ficha de producto, el texto nunca se dibuja sobre la foto
Dado que veo la ficha de un producto en una pantalla angosta
cuando desplazo la página de arriba abajo
entonces la categoría, el nombre y el precio se leen completos y **en ningún momento del
desplazamiento** quedan superpuestos a la foto.

- **Aplicada en:** solo cliente · es maquetación: no hay ninguna regla de negocio detrás
- **Notas:** el mismo criterio vale para la ficha de kit, que repite la misma estructura de dos
  columnas.

### AC-002-02 · Ninguna pantalla pública desborda a lo ancho
Dado cualquier pantalla pública de la tienda en una pantalla angosta
cuando termina de cargar
entonces el documento no es más ancho que la ventana: no aparece desplazamiento horizontal.

- **Aplicada en:** solo cliente · el ancho del documento solo existe en el navegador; el servidor no sabe en qué pantalla se dibuja
- **Notas:** «pantalla pública» son las 17 rutas bajo `(store)`. El desborde se mide como
  `scrollWidth − innerWidth`, que ya es la convención de los tests móviles del carrito.

### AC-002-03 · Un título largo no se sale de su columna
Dado un producto, kit o sección cuyo nombre sea largo
cuando se muestra en una pantalla angosta
entonces el título se reduce o se parte, pero su caja no sobresale del contenedor que lo encierra.

- **Aplicada en:** solo cliente · el ancho que ocupa un texto depende de la fuente ya cargada, que es cosa del navegador
- **Notas:** es un criterio aparte de AC-002-02 porque un título puede desbordar su columna sin
  llegar a provocar desplazamiento horizontal en el documento, y aun así quedar ilegible.

### AC-002-04 · El panel del carrito cabe completo en la pantalla
Dado que abro el carrito lateral en una pantalla angosta
cuando el panel termina de desplegarse
entonces cabe entero a lo ancho de la ventana y todos sus controles quedan dentro de ella.

- **Aplicada en:** solo cliente · el carrito lateral se dibuja entero en el navegador; el servidor no interviene

### AC-002-05 · El menú a pantalla completa no es alcanzable en escritorio
Dado que veo la tienda en una ventana de escritorio
cuando la página está cargada
entonces el menú desplegable a pantalla completa no se muestra, aunque algo cambie el estado que lo
abre.

- **Aplicada en:** solo cliente · recoge [AUD-009](../../auditoria/hallazgos.md#aud-009)
- **Notas:** hoy el botón que lo abre sí está oculto en escritorio, pero la regla que lo dibuja no
  depende del ancho. El criterio exige que dependa.

## Fuera del alcance de esta historia

- **El panel administrativo.** Tiene sus propias pantallas, su propio público y ninguna regla
  responsive hoy; tendrá su historia.
- **El rendimiento de carga en móvil.** La forma en que se cargan las fuentes
  ([AUD-011](../../auditoria/hallazgos.md#aud-011)) afecta a lo que se ve, pero es otra cosa y se
  mide de otra manera.
- **El diseño.** Qué tamaño exacto tiene cada título, qué espaciado o qué jerarquía visual se usa no
  es un criterio: es una decisión de diseño que puede cambiar sin tocar esta historia.
- **Las rutas que el pie de página enlaza y no existen**
  ([AUD-005](../../auditoria/hallazgos.md#aud-005)): que devuelvan 404 no es un problema de
  pantalla angosta.
