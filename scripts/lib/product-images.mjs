/**
 * Utilidades compartidas del pipeline de limpieza de imágenes de producto.
 *
 * Reglas duras que este módulo hace cumplir:
 *  - Solo se tocan portadas de la tabla `products`. Cualquier ruta bajo `kits/`
 *    se rechaza: los kits quedan intactos.
 *  - La ruta de salida se deriva de la URL existente, NUNCA del slug. 114 de las
 *    252 portadas activas viven en un directorio que no coincide con su slug.
 */

import { createClient } from '@supabase/supabase-js'
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export const ROOT = path.resolve(import.meta.dirname, '..', '..')
export const BUCKET = 'product-images'
export const MANIFEST_PATH = path.join(ROOT, 'scripts', 'product-images-progress.json')
export const REMBG_BIN = path.join(ROOT, '.venv-rembg', 'bin', 'rembg')
// isnet-general-use es el caballo de batalla: ~7 s por imagen en modo batch y
// buen recorte en la gran mayoría del catálogo. birefnet-general recorta mucho
// mejor (y a veces se lleva el sello de propina) pero tarda minutos por imagen,
// así que se reserva para los casos donde isnet falla. REMBG_MODEL lo cambia.
export const REMBG_MODEL = process.env.REMBG_MODEL || 'isnet-general-use'

/** Lienzo final y proporción que ocupa el producto dentro de él. */
export const CANVAS = 1600
export const PRODUCT_RATIO = 0.85

// ─── Supabase ──────────────────────────────────────────────────────────────

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Corre el script con: node --env-file=.env.local scripts/<script>.mjs'
    )
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Trae TODOS los productos activos con portada, paginando (Supabase corta en 1000). */
export async function fetchActiveProducts(sb) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('products')
      .select('id, slug, name, cover_image_url, is_active')
      .eq('is_active', true)
      .order('id')
      .range(from, from + 999)
    if (error) throw new Error(`Error leyendo products: ${error.message}`)
    rows.push(...data)
    if (data.length < 1000) break
  }
  return rows.filter((p) => p.cover_image_url)
}

// ─── Rutas de storage ──────────────────────────────────────────────────────

const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`

/**
 * Extrae el directorio dentro del bucket a partir de la URL pública actual.
 * Devuelve null si la URL no es del bucket (p.ej. una CDN externa heredada).
 * Lanza si la ruta pertenece a un kit: es la salvaguarda de "no tocar kits".
 */
export function storageDirFromUrl(url) {
  const idx = url.indexOf(PUBLIC_MARKER)
  if (idx === -1) return null
  const objectPath = decodeURIComponent(url.slice(idx + PUBLIC_MARKER.length).split('?')[0])
  const dir = path.posix.dirname(objectPath)
  if (dir === '.' || dir === '/') return null
  if (/(^|\/)kits(\/|$)/.test(dir)) {
    throw new Error(`RUTA DE KIT detectada, abortando por seguridad: ${objectPath}`)
  }
  return dir
}

export function publicUrlFor(objectPath) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
  return `${base}${PUBLIC_MARKER}${objectPath}`
}

// ─── Descarga ──────────────────────────────────────────────────────────────

export async function downloadImage(url) {
  const res = await fetch(url.replace(/ /g, '%20'), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LIORA-image-cleanup/1.0)' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// ─── Manifiesto ────────────────────────────────────────────────────────────

export async function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return { version: 1, updatedAt: null, items: {} }
  }
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
}

export async function saveManifest(manifest) {
  manifest.updatedAt = new Date().toISOString()
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
}

// ─── rembg ─────────────────────────────────────────────────────────────────

export function assertRembgInstalled() {
  if (!existsSync(REMBG_BIN)) {
    throw new Error(
      `No encuentro rembg en ${REMBG_BIN}.\n` +
      'Instálalo con:\n' +
      '  python3.12 -m venv .venv-rembg\n' +
      '  .venv-rembg/bin/pip install "rembg[cli]" onnxruntime'
    )
  }
}

/**
 * Recorta el fondo de un directorio completo de una sola pasada.
 *
 * Se usa el modo batch (`rembg p`) y no el individual (`rembg i`) a propósito:
 * `i` recarga el modelo ONNX en cada invocación y tarda ~24 s por imagen,
 * mientras que `p` lo carga una vez y baja a ~7 s. Con 252 portadas la
 * diferencia es 100 minutos contra 28.
 *
 * rembg escribe siempre PNG, conservando el nombre base del archivo de entrada.
 */
export async function removeBackgroundBatch(inputDir, outputDir, onProgress) {
  const child = execFile(
    REMBG_BIN,
    ['p', '-m', REMBG_MODEL, inputDir, outputDir],
    { maxBuffer: 256 * 1024 * 1024 }
  )
  if (onProgress) {
    child.stderr?.on('data', (chunk) => onProgress(String(chunk)))
  }
  await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`rembg terminó con código ${code}`))
    )
  })
  return outputDir
}

// ─── Filtro de elementos sueltos (banners del retailer) ────────────────────

const CC_WORK_WIDTH = 320
// Umbral alto a propósito: rembg deja un "fantasma" muy tenue donde había un
// sello o una franja. Con un umbral bajo esos píxeles hacen de puente y todo
// queda como una sola componente, además de inflar el bounding box y arruinar
// el encuadre. Ver hardenAlpha().
const CC_ALPHA_THRESHOLD = 128

/**
 * Elimina los restos semitransparentes que deja el recorte: el halo blanco del
 * borde y, sobre todo, el fantasma de los sellos y franjas que rembg no borra
 * del todo. Todo lo que esté por debajo de `floor` pasa a alfa 0.
 *
 * Sin esto, un fantasma invisible a simple vista sigue contando para el trim y
 * el producto acaba pequeño y descentrado dentro del lienzo.
 *
 * El umbral por defecto (140) se calibró comparando 48/96/140 sobre los casos
 * peores del catálogo: por debajo quedaban manchas visibles del sello. Los
 * envases translúcidos (geles, frascos de vidrio) salen de rembg con alfa alto
 * y no se ven afectados.
 */
export async function hardenAlpha(buffer, { floor = 140 } = {}) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let p = 3; p < data.length; p += info.channels) {
    if (data[p] < floor) data[p] = 0
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  }).png().toBuffer()
}

/**
 * Etiqueta las componentes conexas del canal alfa de un recorte.
 *
 * Muchas portadas traen una franja o insignia promocional AL LADO del producto.
 * rembg la conserva porque es un objeto sólido en primer plano, pero es un
 * bloque completamente separado. Un umbral por área no distingue: en un caso
 * real la franja medía el 55% del envase. Quién es producto y quién es adorno
 * del retailer lo decide la pasada de visión; aquí solo se enumeran candidatos.
 *
 * Devuelve las componentes ordenadas de mayor a menor, con su bbox en
 * coordenadas de la imagen original y su fracción de área.
 */
export async function listComponents(cutoutBuffer) {
  const meta = await sharp(cutoutBuffer).metadata()
  const w = Math.min(CC_WORK_WIDTH, meta.width)
  const h = Math.max(1, Math.round((meta.height / meta.width) * w))
  const scaleX = meta.width / w
  const scaleY = meta.height / h

  const mask = await sharp(cutoutBuffer)
    .ensureAlpha()
    .extractChannel('alpha')
    .resize(w, h, { fit: 'fill' })
    .raw()
    .toBuffer()

  // BFS iterativo, 8-conectividad.
  const labels = new Int32Array(w * h).fill(-1)
  const queue = new Int32Array(w * h)
  const comps = []

  for (let start = 0; start < w * h; start++) {
    if (mask[start] < CC_ALPHA_THRESHOLD || labels[start] !== -1) continue
    const label = comps.length
    let area = 0, head = 0, tail = 0
    let x0 = w, x1 = 0, y0 = h, y1 = 0
    queue[tail++] = start
    labels[start] = label

    while (head < tail) {
      const px = queue[head++]
      area++
      const x = px % w
      const y = (px / w) | 0
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          const np = ny * w + nx
          if (labels[np] !== -1 || mask[np] < CC_ALPHA_THRESHOLD) continue
          labels[np] = label
          queue[tail++] = np
        }
      }
    }
    comps.push({ label, area, box: [x0, y0, x1, y1] })
  }

  const total = comps.reduce((s, c) => s + c.area, 0) || 1
  return {
    grid: { w, h, labels },
    meta: { width: meta.width, height: meta.height },
    components: comps
      .sort((a, b) => b.area - a.area)
      .map((c) => ({
        label: c.label,
        areaFraction: c.area / total,
        // bbox en píxeles de la imagen original
        box: {
          left: Math.round(c.box[0] * scaleX),
          top: Math.round(c.box[1] * scaleY),
          right: Math.round((c.box[2] + 1) * scaleX),
          bottom: Math.round((c.box[3] + 1) * scaleY),
        },
      })),
  }
}

/**
 * Borra del recorte las componentes cuyo label NO esté en `keepLabels`.
 * No inventa píxeles: solo pone a cero el alfa de bloques ya separados.
 */
export async function applyComponentMask(cutoutBuffer, analysis, keepLabels) {
  const keep = new Set(keepLabels)
  const { grid, meta } = analysis
  const { w, h, labels } = grid

  const keepMask = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) {
    keepMask[i] = labels[i] >= 0 && keep.has(labels[i]) ? 255 : 0
  }

  // Escalar de vuelta y suavizar apenas para que el borde no quede aserrado.
  // toColourspace('b-w') es obligatorio: blur() promueve el raw de 1 canal a
  // sRGB de 3, y sin esto el índice de la máscara se desalinea con el alfa.
  const fullMask = await sharp(keepMask, { raw: { width: w, height: h, channels: 1 } })
    .resize(meta.width, meta.height, { fit: 'fill', kernel: 'nearest' })
    .blur(1.2)
    .toColourspace('b-w')
    .raw()
    .toBuffer()

  const { data, info } = await sharp(cutoutBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0, p = 3; p < data.length; i++, p += info.channels) {
    data[p] = (data[p] * fullMask[i]) / 255
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  }).png().toBuffer()
}

/**
 * Descarta las componentes minúsculas (motas del recorte, restos de un sello ya
 * saneado). No toca nada si todo el primer plano es una sola pieza.
 */
export async function despeckle(cutoutBuffer, { minAreaFraction = 0.005 } = {}) {
  const analysis = await listComponents(cutoutBuffer)
  const keep = analysis.components.filter((c) => c.areaFraction >= minAreaFraction)
  if (keep.length === analysis.components.length) return cutoutBuffer
  if (keep.length === 0) return cutoutBuffer
  return applyComponentMask(cutoutBuffer, analysis, keep.map((c) => c.label))
}

/** Dibuja las componentes numeradas sobre el recorte, para que la visión las señale. */
export async function annotateComponents(cutoutBuffer, analysis) {
  const { width, height } = analysis.meta
  const stroke = Math.max(3, Math.round(width / 250))
  const font = Math.max(28, Math.round(width / 18))
  const boxes = analysis.components.map((c, i) => {
    const { left, top, right, bottom } = c.box
    return (
      `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" ` +
      `fill="none" stroke="#ff0090" stroke-width="${stroke}"/>` +
      `<rect x="${left}" y="${top}" width="${font * 1.6}" height="${font * 1.3}" fill="#ff0090"/>` +
      `<text x="${left + font * 0.35}" y="${top + font}" font-family="sans-serif" ` +
      `font-size="${font}" font-weight="bold" fill="#ffffff">${i + 1}</text>`
    )
  }).join('')

  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${boxes}</svg>`
  )

  // Sobre blanco, para que la visión lea bien el recorte y los números.
  return sharp({ create: { width, height, channels: 4, background: '#ffffff' } })
    .composite([{ input: cutoutBuffer }, { input: overlay }])
    .png()
    .toBuffer()
}

// ─── Composición: encuadre 85% + sombra de contacto ────────────────────────

/**
 * Recorta al bounding box real del producto, lo escala al 85% del lienzo, lo
 * centra y le compone debajo una sombra de contacto elíptica y difuminada.
 *
 * El 85% se mide sobre el PRODUCTO, no sobre producto+sombra: la sombra vive
 * dentro del 15% de margen inferior.
 */
export async function composeProductCanvas(cutoutBuffer, opts = {}) {
  const {
    canvas = CANVAS,
    ratio = PRODUCT_RATIO,
    // Calibrado visualmente contra el tinte real de las tarjetas. Una elipse
    // más estrecha que el producto queda escondida detrás de él y no se ve:
    // tiene que asomar ligeramente por los lados (ancho ≥ 100%) y caer por
    // debajo de la base para leerse como contacto y no como flotación.
    shadowOpacity = 0.48,
    shadowBlur = 22,
    shadowWidthRatio = 1.02,
    shadowHeightRatio = 0.095,
    shadowDropRatio = 0.22,
  } = opts

  // 1. Matar fantasmas y halo, quitar motas y recortar al bounding box real.
  //    El orden importa: cualquier resto invisible que sobreviva al saneado
  //    sigue contando para el trim y deja el producto pequeño y descentrado.
  const hardened = await hardenAlpha(cutoutBuffer)
  const despeckled = await despeckle(hardened)
  const trimmed = await sharp(despeckled)
    .trim({ threshold: 1 })
    .png()
    .toBuffer()

  // 2. Escalar el lado mayor al 85% del lienzo.
  const target = Math.round(canvas * ratio)
  const product = await sharp(trimmed)
    .resize({ width: target, height: target, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()
  const { width: pw, height: ph } = await sharp(product).metadata()

  // 3. Geometría: el conjunto producto+sombra se centra verticalmente.
  const shadowW = Math.max(8, Math.round(pw * shadowWidthRatio))
  const shadowH = Math.max(6, Math.round(ph * shadowHeightRatio))
  // Lienzo de la sombra con margen para que el blur no se corte.
  const pad = shadowBlur * 3
  const shW = shadowW + pad * 2
  const shH = shadowH + pad * 2

  const shadowSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${shW}" height="${shH}">` +
      `<ellipse cx="${shW / 2}" cy="${shH / 2}" rx="${shadowW / 2}" ry="${shadowH / 2}" ` +
      `fill="rgb(61,26,58)" fill-opacity="${shadowOpacity}"/>` +
    `</svg>`
  )
  const shadow = await sharp(shadowSvg).blur(shadowBlur).png().toBuffer()

  // El centro de la elipse cae justo por debajo de la base del producto: parte
  // queda oculta tras él (contacto) y parte asoma (sombra proyectada).
  const shadowCenterFromProductTop = ph + shadowH * shadowDropRatio
  const totalHeight = shadowCenterFromProductTop + shH / 2
  const productTop = Math.round((canvas - totalHeight) / 2)
  const productLeft = Math.round((canvas - pw) / 2)

  const shadowTop = Math.round(productTop + shadowCenterFromProductTop - shH / 2)
  const shadowLeft = Math.round((canvas - shW) / 2)

  // 4. Componer: sombra primero (debajo), producto encima.
  //    palette:true recorta el PNG de ~1.5 MB a ~300 KB conservando el alfa;
  //    las tarjetas cargan estas imágenes con <img> crudo, sin optimizador.
  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shadow, top: shadowTop, left: shadowLeft },
      { input: product, top: productTop, left: productLeft },
    ])
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer()
}

// ─── Misc ──────────────────────────────────────────────────────────────────

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
  return dir
}

/**
 * Bounding box del PRODUCTO dentro del lienzo final, excluyendo la sombra.
 *
 * El umbral 185 se calibró midiendo el catálogo real, no de la geometría: el
 * pico de alfa de la sombra difuminada cae entre 150 y 180, y los envases
 * translúcidos (frascos esmerilados, geles) tienen bordes que un umbral de 200
 * deja fuera y hace que se midan un 15% más pequeños de lo que son. 185 separa
 * limpiamente las dos cosas en todo el catálogo.
 */
export async function productBoundingBox(buffer, { threshold = 185 } = {}) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .extractChannel('alpha')
    .raw()
    .toBuffer({ resolveWithObject: true })

  let left = info.width, right = -1, top = info.height, bottom = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] < threshold) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (right < 0) return null
  return {
    left, top, right, bottom,
    width: right - left + 1,
    height: bottom - top + 1,
    canvas: info.width,
  }
}

/** Comprueba que un PNG tiene transparencia REAL, no solo canal alfa presente. */
export async function hasRealTransparency(buffer) {
  const meta = await sharp(buffer).metadata()
  if (!meta.hasAlpha) return false
  const stats = await sharp(buffer).stats()
  const alpha = stats.channels[stats.channels.length - 1]
  return alpha.min < 250
}
