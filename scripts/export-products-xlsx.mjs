// Exporta el catálogo de productos (foto, nombre, marca, precio) a un Excel.
// Uso: node scripts/export-products-xlsx.mjs [--all]
//   por defecto exporta solo productos activos; --all incluye los inactivos.
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const INCLUDE_INACTIVE = process.argv.includes('--all')
const THUMB_PX = 96

function loadEnv() {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const i = line.indexOf('=')
    if (i < 1 || line.trimStart().startsWith('#')) continue
    const key = line.slice(0, i).trim()
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim()
  }
}

loadEnv()
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Faltan credenciales de Supabase en .env.local')

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function fetchProducts() {
  const rows = []
  const PAGE = 200
  for (let from = 0; ; from += PAGE) {
    let query = db
      .from('products')
      .select('name, brand, cover_image_url, product_variants(is_active, product_prices(amount_cents, effective_to))')
      .order('brand', { ascending: true })
      .order('name', { ascending: true })
      .range(from, from + PAGE - 1)
    if (!INCLUDE_INACTIVE) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

function flatten(product) {
  const variant = product.product_variants?.find(v => v.is_active) ?? product.product_variants?.[0] ?? null
  const price = variant?.product_prices?.find(p => !p.effective_to) ?? variant?.product_prices?.[0] ?? null
  return {
    nombre: product.name,
    marca: product.brand ?? '',
    precio: price ? price.amount_cents / 100 : null,
    imageUrl: product.cover_image_url ?? '',
  }
}

async function thumbnail(imageUrl) {
  if (!imageUrl) return null
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return await sharp(buf)
      .resize(THUMB_PX, THUMB_PX, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer()
  } catch {
    return null
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++
        out[i] = await fn(items[i], i)
      }
    })
  )
  return out
}

const products = await fetchProducts()
const rows = products.map(flatten)
console.log(`Productos: ${rows.length}${INCLUDE_INACTIVE ? ' (activos + inactivos)' : ' (solo activos)'}`)

process.stdout.write('Descargando fotos... ')
let done = 0
const thumbs = await mapLimit(rows, 12, async row => {
  const buf = await thumbnail(row.imageUrl)
  if (++done % 50 === 0) process.stdout.write(`${done} `)
  return buf
})
console.log(`listo (${thumbs.filter(Boolean).length}/${rows.length})`)

const wb = new ExcelJS.Workbook()
wb.creator = 'Liora'
wb.created = new Date()
const ws = wb.addWorksheet('Productos', { views: [{ state: 'frozen', ySplit: 1 }] })

ws.columns = [
  { header: 'Foto', key: 'img', width: 15 },
  { header: 'Nombre', key: 'nombre', width: 58 },
  { header: 'Marca', key: 'marca', width: 28 },
  { header: 'Precio', key: 'precio', width: 12 },
]

const header = ws.getRow(1)
header.height = 22
header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
header.alignment = { vertical: 'middle', horizontal: 'left' }
header.eachCell(cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E2A27' } }
})

rows.forEach((row, i) => {
  const excelRow = ws.addRow({ img: '', nombre: row.nombre, marca: row.marca, precio: row.precio })
  excelRow.height = 74
  excelRow.alignment = { vertical: 'middle', wrapText: true }
  const precio = excelRow.getCell('precio')
  precio.numFmt = '"S/" #,##0.00'
  precio.alignment = { vertical: 'middle', horizontal: 'right' }

  const thumb = thumbs[i]
  if (thumb) {
    const imageId = wb.addImage({ buffer: thumb, extension: 'png' })
    ws.addImage(imageId, {
      tl: { col: 0.15, row: excelRow.number - 1 + 0.08 },
      ext: { width: THUMB_PX, height: THUMB_PX * 0.92 },
      editAs: 'oneCell',
    })
  }
})

ws.autoFilter = { from: 'A1', to: { row: 1, column: ws.columnCount } }

const stamp = new Date().toISOString().slice(0, 10)
const outDir = join(ROOT, 'exports')
await mkdir(outDir, { recursive: true })
const outPath = join(outDir, `productos-liora-${stamp}${INCLUDE_INACTIVE ? '-todos' : ''}.xlsx`)
await wb.xlsx.writeFile(outPath)
console.log(`Excel generado: ${outPath}`)
