/**
 * FASE 3 — Recorte de fondo, encuadre al 85% y sombra de contacto.
 *
 * Por cada producto activo del manifiesto:
 *   1. Toma la versión retocada (.image-cache/cleaned/<id>.png) si la fase 2 la
 *      produjo; si no, la original cacheada.
 *   2. rembg en modo batch → PNG con fondo transparente.
 *   3. trim sobre alfa → escala al 85% del lienzo → sombra de contacto → 1600x1600.
 *   4. Sube a <storageDir>/cover-clean.png y apunta products.cover_image_url ahí.
 *
 * El archivo original NO se toca ni se sobrescribe: sigue en su ruta, y el
 * rollback es devolver cover_image_url al valor guardado en el manifiesto.
 *
 * Uso:
 *   node --env-file=.env.local scripts/product-images-process.mjs [--limit N] [--dry-run] [--force]
 */

import { readFile, writeFile, copyFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import {
  ROOT,
  BUCKET,
  getSupabase,
  loadManifest,
  saveManifest,
  assertRembgInstalled,
  removeBackgroundBatch,
  REMBG_MODEL,
  composeProductCanvas,
  hasRealTransparency,
  publicUrlFor,
  ensureDir,
  sleep,
} from './lib/product-images.mjs'

const args = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity
const DRY_RUN = args.includes('--dry-run')
const FORCE = args.includes('--force')
// --only reprocesa solo esos slugs (separados por coma). Sirve para rehacer los
// casos que fallaron con otro modelo: REMBG_MODEL=birefnet-general ... --only a,b
const ONLY = args.includes('--only')
  ? new Set(args[args.indexOf('--only') + 1].split(',').map((s) => s.trim()).filter(Boolean))
  : null

const CACHE = path.join(ROOT, '.image-cache')
const CLEANED_DIR = path.join(CACHE, 'cleaned')   // salida de la fase 2 (retoque generativo)
const BATCH_IN = path.join(CACHE, 'batch-in')     // staging para rembg
const CUTOUT_DIR = path.join(CACHE, 'cutout')     // salida de rembg
const FINAL_DIR = path.join(CACHE, 'final')       // PNG final, para la hoja de contacto

const OUTPUT_NAME = 'cover-clean.png'

// ─── Preparación ───────────────────────────────────────────────────────────

assertRembgInstalled()
await Promise.all([ensureDir(CUTOUT_DIR), ensureDir(FINAL_DIR), ensureDir(CLEANED_DIR)])

const sb = getSupabase()
const manifest = await loadManifest()

const all = Object.values(manifest.items).filter(
  (i) => i.storageDir && i.status !== 'skipped-external'
)
if (all.length === 0) {
  console.error('❌  El manifiesto está vacío. Corre primero scripts/product-images-detect.mjs')
  process.exit(1)
}

// Salvaguarda global: si alguna ruta del manifiesto apunta a un kit, no se corre nada.
const kitPaths = all.filter((i) => /(^|\/)kits(\/|$)/.test(i.storageDir))
if (kitPaths.length > 0) {
  console.error(`🛑  ${kitPaths.length} rutas del manifiesto apuntan a kits. Abortando.`)
  kitPaths.forEach((i) => console.error(`    ${i.slug} → ${i.storageDir}`))
  process.exit(1)
}

const pending = all
  .filter((i) => (ONLY ? ONLY.has(i.slug) : FORCE || i.status !== 'processed'))
  .slice(0, LIMIT === Infinity ? undefined : LIMIT)

if (ONLY) {
  const missing = [...ONLY].filter((s) => !pending.some((i) => i.slug === s))
  if (missing.length) console.log(`⚠️   No están en el manifiesto: ${missing.join(', ')}`)
}

console.log(`\n🎨  Fase 3 — recorte, encuadre 85% y sombra de contacto`)
console.log(`    ${all.length} en el manifiesto · ${pending.length} por procesar${DRY_RUN ? '  (DRY RUN, no sube nada)' : ''}`)

if (pending.length === 0) {
  console.log('\n✅  Nada pendiente.')
  process.exit(0)
}

// ─── 1 + 2. Staging y recorte de fondo en una sola pasada ──────────────────

await rm(BATCH_IN, { recursive: true, force: true })
await ensureDir(BATCH_IN)

const staged = []
for (const item of pending) {
  const cleanedPath = path.join(CLEANED_DIR, `${item.id}.png`)
  const usedCleaned = existsSync(cleanedPath)
  const sourcePath = usedCleaned ? cleanedPath : path.join(ROOT, item.cachePath ?? '')

  if (!item.cachePath || !existsSync(sourcePath)) {
    item.status = 'error'
    item.error = 'falta el archivo de origen en el caché local'
    continue
  }

  // rembg conserva el nombre base y escribe .png, así que la clave es el id.
  const ext = path.extname(sourcePath) || '.png'
  await copyFile(sourcePath, path.join(BATCH_IN, `${item.id}${ext}`))
  // `rembg p` OMITE los archivos que ya existen en el directorio de salida, así
  // que sin este borrado un reproceso (otro modelo, otra fuente) reutilizaría en
  // silencio el recorte viejo y no cambiaría nada.
  await rm(path.join(CUTOUT_DIR, `${item.id}.png`), { force: true })
  staged.push({ item, usedCleaned })
}

console.log(`\n✂️   Recortando fondo de ${staged.length} imágenes (rembg ${REMBG_MODEL}, una sola carga del modelo)...`)
const t0 = Date.now()
let lastPct = ''
await removeBackgroundBatch(BATCH_IN, CUTOUT_DIR, (chunk) => {
  const m = chunk.match(/(\d+)%/g)
  if (m && m[m.length - 1] !== lastPct) {
    lastPct = m[m.length - 1]
    process.stdout.write(`\r    ${lastPct}`)
  }
})
console.log(`\r    listo en ${((Date.now() - t0) / 1000).toFixed(0)}s`)

// ─── 3 + 4. Composición, subida y actualización ────────────────────────────

console.log('')
let done = 0, errors = 0

for (const { item, usedCleaned } of staged) {
  const label = item.name.slice(0, 44).padEnd(44)
  process.stdout.write(`  ${label} … `)

  try {
    const cutoutPath = path.join(CUTOUT_DIR, `${item.id}.png`)
    if (!existsSync(cutoutPath)) throw new Error('rembg no generó salida')
    const cutout = await readFile(cutoutPath)

    if (!(await hasRealTransparency(cutout))) {
      throw new Error('rembg no produjo transparencia real')
    }

    const finalPng = await composeProductCanvas(cutout)
    await writeFile(path.join(FINAL_DIR, `${item.id}.png`), finalPng)

    if (DRY_RUN) {
      console.log(`✓ ${(finalPng.length / 1024).toFixed(0)}KB (dry run)`)
      done++
      continue
    }

    // Nombre nuevo junto al original: rompe la caché de 1 año y deja intacto el archivo previo.
    const objectPath = `${item.storageDir}/${OUTPUT_NAME}`
    const { error: upErr } = await sb.storage.from(BUCKET).upload(objectPath, finalPng, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '31536000',
    })
    if (upErr) throw new Error(`upload: ${upErr.message}`)

    const newUrl = publicUrlFor(objectPath)
    const { error: dbErr } = await sb
      .from('products')
      .update({ cover_image_url: newUrl })
      .eq('id', item.id)
    if (dbErr) throw new Error(`update: ${dbErr.message}`)

    item.newUrl = newUrl
    item.usedCleaned = usedCleaned
    item.status = 'processed'
    item.processedAt = new Date().toISOString()
    delete item.error

    console.log(`✓ ${(finalPng.length / 1024).toFixed(0)}KB${usedCleaned ? ' (retocada)' : ''}`)
    done++

    if (done % 10 === 0) await saveManifest(manifest)
    await sleep(100)
  } catch (err) {
    errors++
    item.status = 'error'
    item.error = err.message
    console.log(`✗ ${err.message.slice(0, 70)}`)
  }
}

await saveManifest(manifest)
console.log(`\n✅  Procesadas ${done} · errores ${errors}`)
if (errors > 0) console.log('    El script es reanudable: vuelve a correrlo para reintentar.')
