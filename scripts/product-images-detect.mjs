/**
 * FASE 1 — Inventario y detección de sellos superpuestos.
 *
 * Recorre las portadas de los productos ACTIVOS, las descarga a un caché local
 * y le pregunta a un modelo de visión si la imagen tiene elementos superpuestos
 * por el retailer (sellos, insignias, precios, watermarks) que haya que borrar.
 *
 * No modifica nada en Supabase. Solo escribe el manifiesto local.
 *
 * Uso:
 *   node --env-file=.env.local scripts/product-images-detect.mjs [--limit N] [--force]
 */

import OpenAI from 'openai'
import { writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import {
  ROOT,
  getSupabase,
  fetchActiveProducts,
  storageDirFromUrl,
  downloadImage,
  loadManifest,
  saveManifest,
  ensureDir,
  sleep,
} from './lib/product-images.mjs'

const args = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity
const FORCE = args.includes('--force')

const CACHE_DIR = path.join(ROOT, '.image-cache', 'original')
const VISION_MODEL = 'gpt-4o'

const DETECTION_PROMPT = `Eres un retocador fotográfico de e-commerce revisando la foto de un producto.

Tu única tarea: decidir si la imagen tiene elementos SUPERPUESTOS que un retocador debería borrar.

CUENTA como superpuesto (hay que borrarlo):
- Sellos, insignias o badges añadidos encima de la foto ("NUEVO", "OFERTA", "-30%", "2x1", "ENVÍO GRATIS")
- Precios, etiquetas de descuento o cintas promocionales pegadas sobre la imagen
- Logos de tiendas o marcas de agua (watermarks) ajenos al producto
- Texto promocional flotante que no forma parte del envase
- Recuadros, banners o franjas de color añadidos sobre la foto

NO cuenta (hay que CONSERVARLO siempre):
- Cualquier texto, logo, marca, número o sello IMPRESO en el envase, etiqueta o caja del producto
- Certificaciones impresas en el empaque (vegano, sin gluten, FPS 50, dermatológicamente testado)
- El contenido neto, el código de barras o la información legal del envase
- Reflejos, sombras o el fondo de la foto

En la duda, responde needsCleanup=false. Un falso positivo haría que se regenere
un empaque que estaba bien, y eso es peor que dejar un sello sin borrar.

Responde SOLO con este JSON, sin texto alrededor:
{"needsCleanup": true|false, "elements": ["descripción breve y su ubicación"], "confidence": 0.0-1.0}`

async function detect(ai, buffer, mime) {
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
  const resp = await ai.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: DETECTION_PROMPT },
        { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
      ],
    }],
  })
  const parsed = JSON.parse(resp.choices[0].message.content)
  return {
    needsCleanup: Boolean(parsed.needsCleanup),
    elements: Array.isArray(parsed.elements) ? parsed.elements : [],
    confidence: Number(parsed.confidence) || 0,
  }
}

function mimeFromUrl(url) {
  const ext = (url.split('?')[0].match(/\.(\w+)$/)?.[1] || 'jpg').toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

// ─── Main ──────────────────────────────────────────────────────────────────

if (!process.env.OPENAI_API_KEY) {
  console.error('❌  Falta OPENAI_API_KEY. Corre con: node --env-file=.env.local ...')
  process.exit(1)
}

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const sb = getSupabase()
await ensureDir(CACHE_DIR)

const products = await fetchActiveProducts(sb)
const manifest = await loadManifest()

console.log(`\n🔍  Fase 1 — detección de sellos superpuestos`)
console.log(`    ${products.length} productos activos con portada\n`)

let processed = 0, skipped = 0, errors = 0

for (const product of products) {
  if (processed >= LIMIT) break

  const existing = manifest.items[product.id]
  if (existing?.detection && !FORCE) { skipped++; continue }

  const label = product.name.slice(0, 46).padEnd(46)
  process.stdout.write(`  ${label} … `)

  try {
    const storageDir = storageDirFromUrl(product.cover_image_url)
    if (!storageDir) {
      console.log('⏭  fuera del bucket (CDN externa), se omite')
      manifest.items[product.id] = {
        ...(existing || {}),
        id: product.id,
        slug: product.slug,
        name: product.name,
        originalUrl: product.cover_image_url,
        storageDir: null,
        status: 'skipped-external',
      }
      skipped++
      continue
    }

    const ext = product.cover_image_url.split('?')[0].match(/\.(\w+)$/)?.[1] || 'jpg'
    const cachePath = path.join(CACHE_DIR, `${product.id}.${ext}`)

    let buffer
    if (existsSync(cachePath) && !FORCE) {
      buffer = await import('node:fs/promises').then((fs) => fs.readFile(cachePath))
    } else {
      buffer = await downloadImage(product.cover_image_url)
      await writeFile(cachePath, buffer)
    }

    const detection = await detect(ai, buffer, mimeFromUrl(product.cover_image_url))

    manifest.items[product.id] = {
      ...(existing || {}),
      id: product.id,
      slug: product.slug,
      name: product.name,
      originalUrl: product.cover_image_url,
      storageDir,
      cachePath: path.relative(ROOT, cachePath),
      detection,
      status: 'detected',
    }

    if (detection.needsCleanup) {
      console.log(`🚩 ${detection.elements.join('; ').slice(0, 60)}`)
    } else {
      console.log('✓ limpia')
    }
    processed++

    if (processed % 10 === 0) await saveManifest(manifest)
    await sleep(150)
  } catch (err) {
    errors++
    console.log(`✗ ${err.message.slice(0, 70)}`)
    if (/RUTA DE KIT/.test(err.message)) {
      console.error('\n🛑  Abortando: se detectó una ruta de kit donde no debería haberla.')
      await saveManifest(manifest)
      process.exit(1)
    }
  }
}

await saveManifest(manifest)

const needing = Object.values(manifest.items).filter((i) => i.detection?.needsCleanup)
console.log(`\n📊  Analizadas ${processed} · ya estaban ${skipped} · errores ${errors}`)
console.log(`🚩  Con sellos superpuestos: ${needing.length}`)
for (const item of needing) {
  console.log(`    - ${item.slug}`)
  console.log(`      ${item.detection.elements.join(' | ')}`)
}
console.log(`\n📄  Manifiesto: scripts/product-images-progress.json`)
