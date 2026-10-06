# Hallazgos de auditoría — costo de servir el catálogo

**Instantánea del 2026-10-05 · commit `a437deb` · rama `sdd/adopcion-metodo`**

Tercera instantánea. Nace de una alerta real: el proyecto de Supabase superó su cuota mensual de
egress (**5,7 GB de 5 GB, 114 %**) y quedó a un paso de que le restrinjan el servicio.

La numeración `AUD-NNN` continúa la de las anteriores y no se reutiliza.

## Método y sus límites

- Medición sobre **producción** (`liora.pe`), no sobre el stack local: el problema es de producción y
  el catálogo local apunta a otro almacenamiento.
- Peticiones `HEAD` y `Range` para leer tamaños, cabeceras y dimensiones **sin descargar los
  cuerpos**: investigar el consumo no podía aumentarlo.
- Muestra de 30 imágenes para tamaños, 25 repartidas por todo el catálogo para cabeceras, 8 para
  dimensiones.
- **No se consultó el desglose de uso de Supabase**, que es quien tiene la cifra por día: la cuenta
  disponible durante la auditoría no contiene este proyecto. El reparto de responsabilidad entre
  tráfico real, rastreadores y pruebas automáticas es por tanto **una estimación**, y se señala
  como tal.
- No se midió el consumo de Vercel, que es una cuota distinta.

## Resumen

| ID | Sev. | Categoría | Componente | Título |
|---|---|---|---|---|
| [AUD-013](#aud-013) | Alto | costo / rendimiento | tienda | Cada visita a la tienda descarga ~8 MB de imágenes sin optimizar ni cachear |

---

## AUD-013

### Cada visita a la tienda descarga ~8 MB de imágenes sin optimizar ni cachear

- **Severidad:** Alto · **Categoría:** costo / rendimiento · **Componente:** tienda
- **Confianza:** Confirmado por ejecución
- **Flujos:** navegación del catálogo

**Evidencia.** Tres medidas, todas sobre el HTML que sirve `liora.pe/tienda`:

**1. El tamaño.** 24 imágenes se dibujan en la rejilla. Muestra de 30 del catálogo:

```
media   : 342 KB
mediana : 320 KB
mínima  : 153 KB
máxima  : 627 KB
```

→ **~8,2 MB de egress por visita**, solo en imágenes. El HTML añade otros 860 KB.

**2. Las dimensiones.** Los originales son de **1600×1600 px** (algunos 1500×1500). La tarjeta los
pinta en una caja de **~124 px** en un viewport de 360. Incluso contando pantallas de densidad
doble, son **~42 veces más píxeles de los necesarios**.

El optimizador de imágenes de Next **está configurado** para este almacenamiento
(`next.config.ts:44-50`), y no se usa: `src/components/products/ProductCard.tsx:106` y
`src/app/(store)/tienda/[slug]/page.tsx:157,167` renderizan con `<img>` plano.

**3. Las cabeceras.** Muestra de 25 imágenes repartidas por todo el catálogo — **las 25** responden:

```
Cache-Control: no-cache
CF-Cache-Status: REVALIDATED
ETag: "5b8054633e9b399eb6e863ec05962ffd"
```

Y sin embargo los scripts de subida piden un año (`scripts/catalog-builder.mjs:255`,
`scripts/migrate-images.mjs:49`, `scripts/import-aruma-skin.mjs:276`). Hay una discrepancia entre lo
que se pide al subir y lo que se sirve, **y su causa no está determinada**. Candidatos: el uploader
del panel (`src/components/admin/ImageUploadField.tsx:14`, que no pasa `cacheControl`), un `upsert`
que no actualizó la metadata, o el gateway nuevo del proveedor (`sb-gateway-mode: direct`).

**Impacto.** A 8,2 MB por visita, **~700 visitas a la tienda agotan el plan de 5 GB**. La cuota ya
se superó (5,7 GB) y el proveedor avisa de restricciones al proyecto: no es una ineficiencia, es un
servicio a punto de degradarse.

El `no-cache` multiplica el problema por dos vías: el visitante que vuelve revalida en cada carga, y
cualquier capa de caché intermedia no puede retener las variantes.

Hay además un impacto que no es de dinero: una página de **~9 MB** en un celular con datos móviles
es exactamente el «se ve horrible» que motivó [US-002](../specs/TIENDA/comprar-desde-el-celular.md),
por una vía que esa historia no cubre.

**Precondiciones.** Ninguna: ocurre en cada visita.

**Reparto de responsabilidad — estimado, no medido.** Parte del consumo lo causaron las propias
pruebas de este trabajo. Durante la fase de [US-002](../specs/TIENDA/comprar-desde-el-celular.md) la
suite de navegador se ejecutó contra la base de **producción**, y Playwright estrena caché en cada
test, de modo que cada corrida descargó el catálogo entero de nuevo. Reconstruyendo las ejecuciones
(≈7 corridas de `mobile-tienda.spec.ts` a ~95 MB cada una, más los guiones de diagnóstico):
**≈0,8 GB, en torno al 14 %**. El resto es tráfico real, rastreadores y el trabajo de catálogo de
principios de mes. **La cifra exacta solo la tiene el desglose por día del proveedor**; un pico el
4 de octubre confirmaría la estimación, un consumo repartido la desmentiría.

**Recomendación.** Cuatro frentes, el primero es el que resuelve el 90 %:

1. **Servir las imágenes en el tamaño en que se muestran** (`next/image` con `sizes`). Además de
   reducir el peso, traslada el tráfico al CDN de la plataforma: el almacenamiento pasa a servir
   cada imagen una vez por variante, no una vez por visitante.
2. **Determinar y corregir el `no-cache`.** Sin esto, el punto 1 rinde la mitad: la caché de
   variantes no puede retenerlas.
3. **Dejar de enviar el catálogo completo** en cada visita (774 URLs para dibujar 24 tarjetas).
4. **Impedir que las suites de navegador se ejecuten contra una base remota.** Es una puerta, no un
   consejo; ya está puesta en `playwright.config.ts`.

Los tres primeros son comportamiento observable y por tanto historia
([US-006](../specs/TIENDA/servir-el-catalogo-sin-malgastar.md)), con criterios **medibles**, para
que el arreglo no se deshaga solo dentro de seis meses.

**Esfuerzo:** M.
