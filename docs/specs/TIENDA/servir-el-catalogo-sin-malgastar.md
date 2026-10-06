---
id: US-006
titulo: Servir el catálogo sin malgastar datos
area: TIENDA
estado: DONE
plataformas: [web, e2e]
version: 1
---

Como persona que entra a la tienda desde un celular con datos móviles
quiero que la página pese lo que tiene que pesar
para no esperar medio minuto ni gastarme el plan en ver cuatro productos.

Y como negocio, para no agotar la cuota del almacenamiento y quedarse sin servicio.

**Vocabulario:** [GLOSARIO.md](../../GLOSARIO.md) · **Hallazgo:** [AUD-013](../../auditoria/hallazgos-2026-10-05.md#aud-013)

> **v1 (2026-10-05):** primera versión. Nace de [AUD-013](../../auditoria/hallazgos-2026-10-05.md#aud-013):
> la cuota mensual de egress se superó (5,7 GB de 5 GB) y cada visita a la tienda descarga ~8 MB de
> imágenes de 1600×1600 px para pintarlas en tarjetas de 124 px.

Los criterios son **medibles a propósito**. Una limpieza de rendimiento sin criterio se deshace sola
en seis meses, cuando alguien añada el siguiente `<img>`. Esto tiene que quedar como puerta.

## Criterios de aceptación

### AC-006-01 · Las imágenes del catálogo pasan por el optimizador
Dado que abro cualquier pantalla que muestre productos o kits
cuando el navegador pide sus imágenes
entonces las pide al optimizador de la aplicación, no al almacenamiento en crudo.

- **Aplicada en:** solo cliente · lo determina el marcado que genera el servidor, y se observa en las peticiones del navegador
- **Notas:** es el criterio que impide que esto se deshaga. Un `<img src={url}>` nuevo lo rompe, y
  eso es exactamente lo que debe pasar.

### AC-006-02 · Se pide el ancho que se va a mostrar, no el original
Dado un producto cuya imagen original mide 1600 px de ancho
cuando se dibuja en una tarjeta de la rejilla en una pantalla angosta
entonces el ancho solicitado guarda proporción con el ancho en que se muestra.

- **Aplicada en:** solo cliente · el ancho depende del viewport y de la densidad de pantalla, que solo conoce el navegador
- **Notas:** «proporción» se comprueba como **2,5 veces** el ancho mostrado: densidad 2 —lo que hay
  en un celular— más el redondeo al siguiente tamaño que el optimizador puede servir. El umbral se
  fijó **después de medir**: la tarjeta de la rejilla se dibuja a 124 px y se pide 256 (2,06×); el
  carrusel de kits se dibuja a 260 y pide 640 (2,46×). Pedir el original de 1600 px para la caja de
  124 es 12,9×, que es lo que esta historia corrige.
- **Notas:** cada imagen se mide contra **la suya**: una tarjeta de rejilla y una de carrusel se
  muestran a anchos distintos, y exigirles lo mismo sería el error contrario.

### AC-006-03 · Una imagen de catálogo se sube como cacheable
Dado que se sube una imagen desde el panel
cuando se guarda en el almacenamiento
entonces queda marcada como cacheable a largo plazo.

- **Aplicada en:** servidor+cliente · la sube el navegador directo al almacenamiento, pero la política la fija quien escribe
- **Notas:** el nombre de archivo lleva marca de tiempo y por tanto **nunca cambia de contenido**:
  no hay motivo para revalidarla. Los guiones de importación ya lo hacen; el uploader del panel no.
  Que lo servido hoy diga `no-cache` es un problema distinto —de los objetos ya subidos— y se
  arregla aparte: esta historia impide que se sigan creando mal.

## Fuera del alcance de esta historia

- **Que la tienda deje de enviar el catálogo entero.** Es real —en producción viajan 774 URLs de
  imagen para dibujar 24 tarjetas, en un documento de 860 KB— y su origen está localizado:
  `getKits()` en `src/app/(store)/tienda/page.tsx:36` usa `select('*')` y expande cada kit con
  todos sus productos miembros. **Pero no se puede demostrar con el conjunto de datos local**, que
  no tiene galerías ni el mismo volumen de kits: ahí viajan 58 URLs para 31 imágenes, y un criterio
  que pasa en verde antes y después del arreglo no protege de nada. Va a [B-017](../../BACKLOG.md),
  que incluye preparar un conjunto de datos que lo reproduzca.
- **Reparar la cabecera de los objetos ya subidos.** Son ~774 imágenes con metadata incorrecta en
  producción, y su causa aún no está determinada. Necesita diagnóstico y un guion de migración que
  se ejecuta contra producción: va aparte ([B-016](../../BACKLOG.md)).
- **Qué imágenes tiene cada producto**, su encuadre o su calidad artística. Eso es catálogo.
- **El peso de las fuentes** ([AUD-011](../../auditoria/hallazgos.md#aud-011)), que también afecta a
  la carga pero se mide y se arregla de otra forma.
- **El consumo de la plataforma de despliegue.** Trasladar el tráfico al optimizador mueve parte del
  costo a otra cuota; vigilarlo es operación, no esta historia.
