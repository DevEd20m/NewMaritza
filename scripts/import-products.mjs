// ══════════════════════════════════════════════════════════════════════
// LIORA — Import Products from Excel → Supabase
// scripts/import-products.mjs
//
// Uso:
//   node scripts/import-products.mjs           → importar todos
//   node scripts/import-products.mjs --dry-run → mostrar sin insertar
// ══════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const DRY_RUN   = process.argv.includes('--dry-run')

// ── Env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return {}
  const obj = {}
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    obj[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return obj
}
const env         = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY
const sb           = createClient(SUPABASE_URL, SERVICE_KEY)

const EXCEL_PATH = '/Users/prado/Documents/Maritza-New/productos_finales.xlsx'

// ── Category mapping Excel → LIORA DB ─────────────────────────────────
// Columna "Categoría Correcta" del Excel → slug de categoria en LIORA
const CAT_MAP = {
  'proteínas y fitness':            'gym',
  'proteinas y fitness':            'gym',
  'energía y rendimiento':          'gym',
  'energia y rendimiento':          'gym',
  'alimentos naturales y orgánicos':'gym',
  'alimentos naturales y organicos':'gym',
  'suplementos y vitaminas':        'bienestar',
  'salud y bienestar':              'bienestar',
  'hierbas y plantas medicinales':  'bienestar',
  'cuidado de la piel':             'piel',
  'belleza y cuidado personal':     'piel',
  'cuidado del cabello':            'piel',
  'digestivo y probióticos':        'digestivo',
  'digestivo y probioticos':        'digestivo',
  'hogar y primeros auxilios':      'hogar',
  'pies y cuerpo':                  'pies-cuerpo',
  'protección solar':               'solar',
  'proteccion solar':               'solar',
  'viaje y exteriores':             'viaje',
  'otro':                           'bienestar',
}

// ── Helpers ────────────────────────────────────────────────────────────
function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function parsePrice(val) {
  if (val == null || val === '') return null
  if (typeof val === 'number') return Math.round(val * 100)
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  if (isNaN(n) || n <= 0) return null
  return Math.round(n * 100)
}

function cellText(cell) {
  if (!cell) return ''
  let v = cell.value
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v)
  // Hyperlink object
  if (v.hyperlink) return v.hyperlink.trim()
  // Rich text
  if (v.richText) return v.richText.map(x => x.text || '').join('').trim()
  if (v.text) {
    if (typeof v.text === 'string') return v.text.trim()
    if (v.text.richText) return v.text.richText.map(x => x.text || '').join('').trim()
  }
  return String(v).trim()
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════')
  console.log('  LIORA — Importación de productos desde Excel')
  console.log(`  Modo: ${DRY_RUN ? 'DRY RUN (sin cambios)' : 'REAL'}`)
  console.log(`  Archivo: ${EXCEL_PATH}`)
  console.log('══════════════════════════════════════════════\n')

  // ── 1. Load categories from DB ──────────────────────────────────────
  const { data: catRows, error: catErr } = await sb.from('categories').select('id, name, slug')
  if (catErr) throw new Error('No se pudieron cargar categorías: ' + catErr.message)
  const catBySlug = Object.fromEntries(catRows.map(c => [c.slug, c.id]))
  console.log(`✓  ${catRows.length} categorías cargadas desde DB`)

  // ── 2. Load existing tags ───────────────────────────────────────────
  const { data: tagRows } = await sb.from('tags').select('id, name, group')
  const tagByName = {}
  for (const t of (tagRows || [])) tagByName[t.name.toLowerCase()] = t.id
  console.log(`✓  ${tagRows?.length || 0} tags cargados desde DB`)

  // ── 3. Load existing product slugs (resume support) ─────────────────
  const { data: existingProds } = await sb.from('products').select('slug')
  const existingSlugs = new Set((existingProds || []).map(p => p.slug))
  console.log(`✓  ${existingSlugs.size} productos ya existentes en DB\n`)

  // ── 4. Read Excel ───────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(EXCEL_PATH)
  const ws = wb.getWorksheet(1)

  // Parse headers from row 1
  const headers = []
  ws.getRow(1).eachCell((cell, col) => { headers[col - 1] = cellText(cell) })

  const H = {}
  headers.forEach((h, i) => { H[h] = i + 1 }) // col number by header name

  console.log(`📊  ${ws.rowCount - 1} productos en el Excel\n`)

  // ── 5. Process each product row ─────────────────────────────────────
  let inserted = 0, skipped = 0, errors = 0

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const get = header => cellText(row.getCell(H[header]))

    const name      = get('Nombre del Producto')
    if (!name) continue

    const slug = slugify(name)

    if (existingSlugs.has(slug)) {
      console.log(`  ⏭  [${r - 1}] SKIP (ya existe): ${name.slice(0, 60)}`)
      skipped++
      continue
    }

    const catCorrectaRaw = get('Categoría Correcta')
    const catKey         = catCorrectaRaw.toLowerCase().trim()
    const catSlug        = CAT_MAP[catKey] ?? 'bienestar'
    const categoryId     = catBySlug[catSlug] ?? null

    const imageUrl  = get('Imagen Limpia PNG (URL)')
    const marca     = get('Marca')
    const envase    = get('Tipo de Envase')
    const cantidad  = get('Cantidad / Tamaño')
    const organico  = get('Orgánico').toLowerCase() === 'sí'

    // description = Descripción + Beneficios para el Cliente + Beneficios del Producto
    const descParts = [get('Descripción'), get('Beneficios para el Cliente'), get('Beneficios del Producto')].filter(Boolean)
    const description = descParts.join('\n\n') || null

    // indications = Ingredientes (composición del producto)
    const indications = get('Ingredientes') || null

    const contraindications  = get('Precauciones') || null
    const usage_instructions = get('Modo de Uso') || null

    const variantName = [envase, cantidad].filter(Boolean).join(' ') || 'Unidad'
    const sku         = slug.slice(0, 40).replace(/-+$/, '') + '-v1'

    const priceCents  = parsePrice(row.getCell(H['Precio En internet']).value)

    const nc1 = get('Nombre Comercial 1')
    const nc2 = get('Nombre Comercial 2')
    const nc3 = get('Nombre Comercial 3')
    const aliases = [nc1, nc2, nc3].filter(Boolean)

    console.log(`  [${r - 1}] ${name.slice(0, 60)}`)
    console.log(`       cat: ${catCorrectaRaw} → ${catSlug} | precio: ${priceCents ? `S/ ${(priceCents / 100).toFixed(2)}` : '—'}`)

    if (DRY_RUN) { inserted++; continue }

    try {
      // ── Insert product ─────────────────────────────────────────────
      const { data: prod, error: prodErr } = await sb.from('products').insert({
        name,
        slug,
        description,
        brand:              marca || null,
        category_id:        categoryId,
        cover_image_url:    imageUrl || null,
        gallery_urls:       imageUrl ? [imageUrl] : [],
        indications,
        contraindications,
        usage_instructions,
        is_active:          true,
      }).select('id').single()

      if (prodErr) throw new Error('product: ' + prodErr.message)
      const productId = prod.id

      // ── Insert variant ─────────────────────────────────────────────
      const { data: variant, error: varErr } = await sb.from('product_variants').insert({
        product_id: productId,
        sku,
        name:       variantName,
        is_active:  true,
      }).select('id').single()

      if (varErr) throw new Error('variant: ' + varErr.message)
      const variantId = variant.id

      // ── Insert price ───────────────────────────────────────────────
      if (priceCents) {
        const { error: priceErr } = await sb.from('product_prices').insert({
          variant_id:     variantId,
          currency:       'PEN',
          amount_cents:   priceCents,
          effective_from: new Date().toISOString(),
        })
        if (priceErr) console.warn(`       ⚠ precio: ${priceErr.message}`)
      }

      // ── Create/link tags (aliases + organico) ──────────────────────
      const allTags = [...aliases]
      if (organico) allTags.push('Orgánico')

      const tagIds = []
      for (const tagName of allTags) {
        const key = tagName.toLowerCase()
        if (tagByName[key]) {
          tagIds.push(tagByName[key])
        } else {
          // Create new tag
          const { data: newTag, error: tagErr } = await sb.from('tags').insert({
            name:  tagName,
            slug:  slugify(tagName),
            group: 'alias',
          }).select('id').single()

          if (tagErr) {
            console.warn(`       ⚠ tag "${tagName}": ${tagErr.message}`)
          } else {
            tagByName[key] = newTag.id
            tagIds.push(newTag.id)
          }
        }
      }

      if (tagIds.length) {
        const pivots = tagIds.map(tag_id => ({ product_id: productId, tag_id }))
        const { error: ptErr } = await sb.from('product_tags').insert(pivots)
        if (ptErr) console.warn(`       ⚠ product_tags: ${ptErr.message}`)
      }

      existingSlugs.add(slug)
      inserted++
      console.log(`       ✓ insertado (${productId.slice(0, 8)}…)`)

    } catch (err) {
      console.error(`       ✗ ERROR: ${err.message}`)
      errors++
    }

    await sleep(80) // gentle rate limit
  }

  console.log('\n══════════════════════════════════════════════')
  console.log(`✅  Importación completada`)
  console.log(`   Insertados: ${inserted}`)
  console.log(`   Omitidos (ya existían): ${skipped}`)
  console.log(`   Errores: ${errors}`)
  console.log('══════════════════════════════════════════════')
}

main().catch(err => { console.error('\n💥 Error fatal:', err); process.exit(1) })
