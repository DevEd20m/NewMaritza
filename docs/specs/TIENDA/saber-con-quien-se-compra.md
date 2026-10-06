---
id: US-005
titulo: Saber con quién se compra y bajo qué condiciones
area: TIENDA
estado: DONE
plataformas: [e2e]
version: 1
---

Como persona que va a dejar su dinero y sus datos en liora.pe
quiero poder leer las condiciones de venta y saber quién está detrás de la tienda
para decidir con información y saber a quién reclamar si algo sale mal.

**Vocabulario:** [GLOSARIO.md](../../GLOSARIO.md)

> **v1 (2026-10-04):** primera versión. Nace de [AUD-005](../../auditoria/hallazgos.md#aud-005): el
> pie de página enlaza `/terminos` y `/contacto` desde **todas** las páginas, y ambas devuelven 404.

No es solo higiene. Una tienda que cobra en línea en Perú tiene que identificar a su proveedor y
poner sus condiciones a disposición del consumidor: lo exige la Ley 29571, y la Ley 29733 para el
tratamiento de datos. Hoy el sitio promete esos documentos en cada página y no los entrega.

## Criterios de aceptación

### AC-005-01 · Todo enlace del pie de página lleva a una página real
Dado cualquier pantalla pública
cuando sigo un enlace del pie de página
entonces llego a una página que existe, no a un error.

- **Aplicada en:** servidor · es el servidor quien responde 200 o 404
- **Notas:** el criterio se escribe sobre **todos** los enlaces del pie y no sobre los dos que hoy
  fallan, porque lo que hay que impedir es que vuelva a añadirse uno roto.

### AC-005-02 · Las condiciones identifican quién vende
Dado que abro las condiciones de venta
cuando busco quién está detrás de la tienda
entonces encuentro el nombre o razón social del proveedor, su RUC y su domicilio fiscal.

- **Aplicada en:** servidor
- **Notas:** el negocio pidió que esos datos vayan en letra pequeña, como en los contratos. Se
  cumple con tipografía menor y atenuada, pero **legible**: la ley pide que el proveedor sea
  identificable, no que el dato esté escondido. Por eso el criterio exige que esté presente y no
  fija su tamaño.

### AC-005-03 · Las condiciones dicen cuándo se actualizaron
Dado que abro las condiciones de venta o la política de privacidad
cuando las leo
entonces veo la fecha de la versión vigente.

- **Aplicada en:** servidor
- **Notas:** lo promete el propio texto («La versión vigente siempre estará en liora.pe/terminos con
  su fecha de actualización»), así que es una regla, no un adorno.

### AC-005-04 · La política de privacidad es alcanzable desde las condiciones
Dado que estoy leyendo las condiciones de venta
cuando busco cómo se tratan mis datos
entonces puedo llegar a la política de privacidad y a la de cookies.

- **Aplicada en:** servidor
- **Notas:** son tres documentos y no uno, como dice la propia sección 1 del texto. Cada dato tiene
  un solo dueño: las condiciones no repiten la política, la enlazan.

### AC-005-05 · Los canales de atención están publicados y son los mismos en todo el sitio
Dado que quiero contactar con la tienda
cuando abro la página de contacto
entonces encuentro el correo y el WhatsApp del negocio, y son los mismos que ya usa el resto del
sitio.

- **Aplicada en:** servidor+cliente · el número de WhatsApp sale de `store_settings`, no del código
- **Notas:** hoy el número está en `store_settings.whatsapp_number` y se edita desde el panel.
  Escribirlo a mano en una página nueva crearía un segundo dueño del mismo dato, que es justo lo que
  el método prohíbe.

## Fuera del alcance de esta historia

- **El Libro de Reclamaciones Virtual.** Es una obligación legal aparte (Indecopi) y no es una
  página de texto: necesita formulario, almacenamiento, copia al consumidor y respuesta en 15 días
  hábiles. Tendrá su propia historia ([B-013](../../BACKLOG.md)). Mientras no exista, las
  condiciones **no** lo enlazan: prometer un enlace que devuelve 404 es el defecto que esta
  historia corrige, no uno que deba repetir.
- **El código de inscripción del banco de datos ante la Autoridad Nacional de Protección de Datos.**
  No lo tenemos; la cláusula que lo citaría se omite en vez de publicarse con un hueco.
- **Que el texto legal sea correcto.** Lo redactó el negocio. Esta historia lo publica y garantiza
  que sea alcanzable, no lo valida jurídicamente.
