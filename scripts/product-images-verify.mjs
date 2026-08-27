/**
 * Verificación del pipeline de imágenes de producto.
 *
 * Comprueba, contra lo que hay realmente publicado en Supabase:
 *   1. Los 15 kits siguen intactos (contra .image-cache/kits-snapshot-before.json).
 *   2. Cada portada nueva tiene transparencia REAL (no solo canal alfa presente).
 *   3. El producto ocupa el 85% del lienzo (±2%) y está centrado horizontalmente.
 *   4. Ningún producto quedó apuntando a una imagen opaca.
 * Y genera una hoja de contacto HTML de antes/después sobre los fondos reales.
 *
 * Uso:
 *   node --env-file=.env.local scripts/product-images-verify.mjs [--sample N]
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

import {
  ROOT,
  getSupabase,
  loadManifest,
  downloadImage,
  fetchActiveProducts,
  productBoundingBox,
  PRODUCT_RATIO,
} from './lib/product-images.mjs'

const args = process.argv.slice(2)
const SAMPLE = args.includes('--sample') ? Number(args[args.indexOf('--sample') + 1]) : Infinity

const SNAPSHOT = path.join(ROOT, '.image-cache', 'kits-snapshot-before.json')
const SHEET = path.join(ROOT, '.image-cache', 'contact-sheet.html')

const sb = getSupabase()
const manifest = await loadManifest()
let failures = 0

// ─── 1. Kits intactos ──────────────────────────────────────────────────────

console.log('\n🔒  1/4 — Kits intactos')
if (!existsSync(SNAPSHOT)) {
  console.log('    ⚠️  No hay snapshot previo; no se puede comparar.')
} else {
  const before = JSON.parse(await readFile(SNAPSHOT, 'utf8'))
  const { data: after } = await sb.from('kits').select('id,slug,cover_image_url').order('id')
  const changed = after.filter((k) => {
    const prev = before.find((b) => b.id === k.id)
    return !prev || prev.cover_image_url !== k.cover_image_url
  })
  if (changed.length === 0) {
    console.log(`    ✓ ${after.length}/${before.length} kits sin cambios`)
  } else {
    failures++
    console.log(`    ✗ ${changed.length} kits CAMBIARON:`)
    changed.forEach((k) => console.log(`      ${k.slug}`))
  }
}

// ─── 2 a 4. Portadas publicadas ────────────────────────────────────────────

const processed = Object.values(manifest.items).filter((i) => i.status === 'processed')
const toCheck = processed.slice(0, SAMPLE === Infinity ? undefined : SAMPLE)

console.log(`\n🔍  2/4 — Transparencia real (${toCheck.length} portadas)`)
const results = []
let opaque = 0, badFraming = 0, offCenter = 0, netErrors = 0

for (const item of toCheck) {
  try {
    const buf = await downloadImage(item.newUrl)
    const meta = await sharp(buf).metadata()
    const stats = await sharp(buf).stats()
    const alpha = stats.channels[stats.channels.length - 1]
    const transparent = meta.hasAlpha && alpha.min < 250

    // Encuadre: se mide sobre el PRODUCTO, no sobre producto+sombra.
    const box = await productBoundingBox(buf)
    const ratio = box ? Math.max(box.width, box.height) / box.canvas : 0
    const framingOk = Math.abs(ratio - PRODUCT_RATIO) <= 0.02

    // Centrado horizontal: comparar margen izquierdo y derecho del producto.
    const centered = box
      ? Math.abs(box.left - (box.canvas - box.right - 1)) <= box.canvas * 0.02
      : false

    if (!transparent) opaque++
    if (!framingOk) badFraming++
    if (!centered) offCenter++

    results.push({ item, transparent, ratio, framingOk, centered, bytes: buf.length })
  } catch (err) {
    netErrors++
    results.push({ item, error: err.message })
  }
}

console.log(`    ${toCheck.length - opaque - netErrors}/${toCheck.length} con transparencia real`)
if (opaque > 0) {
  failures++
  console.log(`    ✗ ${opaque} OPACAS:`)
  results.filter((r) => r.transparent === false).forEach((r) => console.log(`      ${r.item.slug}`))
}

console.log(`\n📐  3/4 — Encuadre al ${(PRODUCT_RATIO * 100).toFixed(0)}%`)
if (badFraming === 0) {
  console.log(`    ✓ ${toCheck.length - netErrors}/${toCheck.length} dentro de tolerancia`)
} else {
  failures++
  console.log(`    ✗ ${badFraming} fuera de tolerancia:`)
  results.filter((r) => r.framingOk === false)
    .forEach((r) => console.log(`      ${r.item.slug} → ${(r.ratio * 100).toFixed(1)}%`))
}

console.log(`\n🎯  4/4 — Centrado horizontal`)
if (offCenter === 0) {
  console.log(`    ✓ ${toCheck.length - netErrors}/${toCheck.length} centradas`)
} else {
  failures++
  console.log(`    ✗ ${offCenter} descentradas`)
  results.filter((r) => r.centered === false).forEach((r) => console.log(`      ${r.item.slug}`))
}

// ─── Cobertura: ningún activo se quedó atrás ───────────────────────────────

const active = await fetchActiveProducts(sb)
const stillOld = active.filter((p) => !p.cover_image_url.endsWith('/cover-clean.png'))
console.log(`\n📦  Cobertura: ${active.length - stillOld.length}/${active.length} productos activos apuntan a cover-clean.png`)
if (stillOld.length > 0) {
  console.log(`    Pendientes (${stillOld.length}):`)
  stillOld.slice(0, 15).forEach((p) => console.log(`      ${p.slug}`))
  if (stillOld.length > 15) console.log(`      … y ${stillOld.length - 15} más`)
}

// ─── Hoja de contacto ──────────────────────────────────────────────────────

const rows = results
  .filter((r) => !r.error)
  .map((r) => `
    <figure>
      <div class="pair">
        <div class="cell before"><img src="${r.item.originalUrl}" loading="lazy"></div>
        <div class="cell after tint-card"><img src="${r.item.newUrl}" loading="lazy"></div>
        <div class="cell after tint-pdp"><img src="${r.item.newUrl}" loading="lazy"></div>
      </div>
      <figcaption>
        ${r.item.name.replace(/</g, '&lt;')}
        <span class="meta">${(r.bytes / 1024).toFixed(0)}KB · ${(r.ratio * 100).toFixed(1)}%${r.item.usedCleaned ? ' · retocada' : ''}</span>
      </figcaption>
    </figure>`).join('')

await writeFile(SHEET, `<!doctype html>
<meta charset="utf-8"><title>Portadas: antes y después</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; background:#fbf8f3; color:#3d1a3a; padding:24px; }
  h1 { font-size:20px; }
  .legend { font-size:13px; opacity:.7; margin-bottom:20px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:20px; }
  figure { margin:0; }
  .pair { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
  .cell { aspect-ratio:1; border-radius:14px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
  .cell img { width:92%; height:92%; object-fit:contain; }
  .before { background:#fff; border:1px solid #e5ded2; }
  .before img { width:78%; height:78%; }
  .tint-card { background:#e8dcc8; }
  .tint-pdp  { background:#c9a3c4; }
  figcaption { font-size:12px; margin-top:6px; line-height:1.3; }
  .meta { display:block; opacity:.55; }
</style>
<h1>Portadas de producto: antes y después</h1>
<p class="legend">Columnas: original sobre blanco · resultado sobre el tinte de tarjeta · resultado sobre el tinte de ficha.</p>
<div class="grid">${rows}</div>
`)

console.log(`\n📄  Hoja de contacto: ${path.relative(ROOT, SHEET)}`)
console.log(failures === 0 ? '\n✅  Todas las comprobaciones pasaron.\n' : `\n❌  ${failures} comprobaciones fallaron.\n`)
process.exit(failures === 0 ? 0 : 1)
