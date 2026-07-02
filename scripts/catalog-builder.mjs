// ══════════════════════════════════════════════════════════════════════
// LIORA — Catalog Builder  |  scripts/catalog-builder.mjs
//
// Genera catalog_productos_LIORA.xlsx desde /productos_all
// Uso:
//   node scripts/catalog-builder.mjs           → proceso completo
//   node scripts/catalog-builder.mjs --test-one → solo 1 producto
//
// Prerrequisitos:
//   npm install --save-dev sharp exceljs
//   Añadir OPENAI_API_KEY en .env.local
// ══════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, extname, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import sharp from 'sharp'
import ExcelJS from 'exceljs'

// ── Paths & config ─────────────────────────────────────────────────────
const __dirname   = dirname(fileURLToPath(import.meta.url))
const ROOT        = resolve(__dirname, '..')
const PRODUCTS_DIR = '/Users/prado/Documents/productos_all'
const CHECKPOINT  = join(__dirname, 'catalog-progress.json')
const OUTPUT_XLSX = join(ROOT, 'catalog_productos_LIORA.xlsx')
const TEST_MODE   = process.argv.includes('--test-one')
const BUCKET      = 'product-images'
const IMAGE_EXTS  = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const INFO_VARIANTS = ['info.txt', 'inf.txt', 'información.txt', 'informacion.txt', 'info.txr']

// ── Load .env.local ────────────────────────────────────────────────────
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
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || 'https://skcfrccoexscaiayzjzd.supabase.co'
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2ZyY2NvZXhzY2FpYXl6anpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwNTQzNSwiZXhwIjoyMDk0NjgxNDM1fQ.ICG7QSsCtewwm9QvfeLdTfaMuJFs7H-sPSt5AQg5n_E'
const OPENAI_KEY   = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
const PUBLIC_BASE  = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

if (!OPENAI_KEY) {
  console.error('❌  Falta OPENAI_API_KEY')
  console.error('   Añade a .env.local:  OPENAI_API_KEY=sk-proj-...')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)
const ai = new OpenAI({ apiKey: OPENAI_KEY })

// ── Utilities ──────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function colLetter(n) {
  let s = ''
  while (n > 0) { n--; s = String.fromCharCode(65 + n % 26) + s; n = Math.floor(n / 26) }
  return s
}

function loadCheckpoint() {
  if (!existsSync(CHECKPOINT)) return {}
  try { return JSON.parse(readFileSync(CHECKPOINT, 'utf8')) } catch { return {} }
}

function saveCheckpoint(cp) {
  writeFileSync(CHECKPOINT, JSON.stringify(cp, null, 2))
}

function extractJson(text, fallback = null) {
  if (!text) return fallback
  // Try fenced code block first
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) {
    try { return JSON.parse(fence[1].trim()) } catch { /* fall through */ }
  }
  // Try to find first complete JSON object or array
  const starts = [text.indexOf('{'), text.indexOf('[')].filter(i => i >= 0)
  if (!starts.length) return fallback
  const start = Math.min(...starts)
  try { return JSON.parse(text.slice(start)) } catch { /* fall through */ }
  // Last resort: grab from first { to last }
  const ob = text.lastIndexOf('}'), ab = text.lastIndexOf(']')
  const end = Math.max(ob, ab)
  if (end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch { /* fall through */ }
  }
  return fallback
}

// ── Price URL Verification ────────────────────────────────────────────
async function fetchAndVerifyPrice(url) {
  if (!url || !url.startsWith('http')) return null
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-PE,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(9000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()

    // 1. JSON-LD Product schema (Falabella, Inkafarma, Plaza Vea, Mifarma)
    const ldBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    for (const [, json] of ldBlocks) {
      try {
        const obj = JSON.parse(json.trim())
        const checkOffers = o => {
          if (!o) return null
          if (o['@type'] === 'Offer' && o.price)          return parseFloat(o.price)
          if (o['@type'] === 'AggregateOffer' && o.lowPrice) return parseFloat(o.lowPrice)
          if (Array.isArray(o.offers)) { for (const x of o.offers) { const v = checkOffers(x); if (v) return v } }
          if (o.offers && !Array.isArray(o.offers)) return checkOffers(o.offers)
          return null
        }
        const price = checkOffers(obj)
        if (price && price > 3) return price
      } catch { /* invalid JSON-LD */ }
    }

    // 2. data-price attribute (MercadoLibre, Ripley)
    const dataPrice = html.match(/data-price="([\d]+\.[\d]{1,2})"/)?.[1]
    if (dataPrice) { const p = parseFloat(dataPrice); if (p > 3) return p }

    // 3. S/ price text in HTML (fallback)
    const soles = html.match(/S\/\s*([\d]{2,5}[.,][\d]{2})/)?.[1]
    if (soles) { const p = parseFloat(soles.replace(',', '.')); if (p > 3 && p < 20000) return p }

    return null
  } catch { return null }
}

// ── Phase 1: Discovery ─────────────────────────────────────────────────
function scanProducts() {
  const products = []

  const topEntries = readdirSync(PRODUCTS_DIR).filter(n => {
    const p = join(PRODUCTS_DIR, n)
    return statSync(p).isDirectory() && !n.startsWith('.')
  })

  for (const cat of topEntries) {
    const catPath = join(PRODUCTS_DIR, cat)

    for (const entry of readdirSync(catPath)) {
      const entryPath = join(catPath, entry)
      if (!statSync(entryPath).isDirectory()) continue

      const files = readdirSync(entryPath)
      const hasImages  = files.some(f => !statSync(join(entryPath, f)).isDirectory() && IMAGE_EXTS.has(extname(f).toLowerCase()))
      const hasInfo    = files.some(f => INFO_VARIANTS.includes(f.toLowerCase()))
      const subDirs    = files.filter(f => statSync(join(entryPath, f)).isDirectory())

      if (hasImages || hasInfo || subDirs.length === 0) {
        // This is a leaf product folder
        products.push(makeProduct(cat, entry, entryPath, files))
      } else {
        // One extra nesting level (e.g. vitaminas/bandita/<product>)
        for (const sub of subDirs) {
          const subPath = join(entryPath, sub)
          if (!statSync(subPath).isDirectory()) continue
          const subFiles = readdirSync(subPath)
          products.push(makeProduct(cat, sub, subPath, subFiles))
        }
      }
    }
  }

  return products
}

function makeProduct(category, folderName, folderPath, entries) {
  const imagePaths = entries
    .filter(f => {
      const full = join(folderPath, f)
      return !statSync(full).isDirectory() && IMAGE_EXTS.has(extname(f).toLowerCase())
    })
    .map(f => join(folderPath, f))

  let infoTxtPath = null
  for (const variant of INFO_VARIANTS) {
    // exact match
    const exact = join(folderPath, variant)
    if (existsSync(exact)) { infoTxtPath = exact; break }
    // case-insensitive
    const found = entries.find(f => f.toLowerCase() === variant)
    if (found) { infoTxtPath = join(folderPath, found); break }
  }

  return {
    id:               slugify(folderName),
    folderName,
    folderPath,
    categoryOriginal: category,
    imagePaths,
    infoTxtPath,
    rawInfoText:      '',
    status:           'pending',
    duplicateDe:      null,
    coverImageUrl:    '',
    data:             {},
  }
}

// ── Phase 2: Image Processing ──────────────────────────────────────────
async function processImage(product) {
  if (!product.imagePaths.length) {
    console.log(`  ⚠  ${product.folderName}: sin imágenes`)
    product.status = 'images_done'
    return product
  }

  // Prefer jpg/png for quality; take first one found
  const preferredOrder = ['.jpg', '.jpeg', '.png', '.webp', '.avif']
  const sorted = [...product.imagePaths].sort((a, b) => {
    const ai = preferredOrder.indexOf(extname(a).toLowerCase())
    const bi = preferredOrder.indexOf(extname(b).toLowerCase())
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
  })
  const src = sorted[0]

  try {
    const pngBuf = await sharp(src)
      .png({ quality: 100, compressionLevel: 1 })
      .toBuffer()

    const storagePath = `catalog/${product.id}/cover.png`
    const { error } = await sb.storage.from(BUCKET).upload(storagePath, pngBuf, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '31536000',
    })
    if (error) throw new Error(error.message)

    product.coverImageUrl = `${PUBLIC_BASE}/${storagePath}`
    console.log(`  ✓  imagen: ${product.folderName}`)
  } catch (err) {
    console.error(`  ✗  imagen ${product.folderName}: ${err.message}`)
  }

  product.status = 'images_done'
  return product
}

// ── Phase 3: Info Extraction ───────────────────────────────────────────
function extractInfo(product) {
  if (product.infoTxtPath) {
    try {
      let text = readFileSync(product.infoTxtPath, 'utf8')
      // Handle BOM and encoding issues
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
      product.rawInfoText = text

      // Try to extract a price from info.txt
      const priceMatch = text.match(/S\/[\s]*([\d]+[.,][\d]{1,2})|(?:precio|price)\s*:?\s*S\/[\s]*([\d]+[.,][\d]{1,2})/i)
      if (priceMatch) {
        const val = (priceMatch[1] || priceMatch[2] || '').replace(',', '.')
        if (val) product.data.precioFicha = `S/ ${val}`
      }
    } catch (e) {
      console.warn(`  ⚠  info.txt ilegible: ${product.folderName}`)
    }
  }
  product.status = 'info_extracted'
  return product
}

// ── Phase 3.5: Deduplication ───────────────────────────────────────────
function ngrams(str, n = 3) {
  const s = str.toLowerCase().replace(/\s+/g, ' ').trim()
  const out = new Set()
  for (let i = 0; i <= s.length - n; i++) out.add(s.slice(i, i + n))
  return out
}

function jaccardSim(a, b) {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter)
}

const FLAVOR_WORDS = [
  'vainilla','vanilla','chocolate','cacao','coco','fresa','naranja','limon','limón',
  'natural','original','cafe','maca','negro','blanca','blanco','mora','mango',
  'lucuma','lúcuma','sport','colageno','colágeno','capuccino','cappuccino','fruit',
  'berry','mint','menta','arandano','arándano'
]

function extractProductMeta(folderName) {
  const sku    = folderName.match(/sku[-\s]+(\d{6,20})/i)?.[1] ?? null
  const sizes  = (folderName.match(/\b\d+\s*(?:gr|g\b|kg|ml|l\b|lb|oz|un\b|caps?|comp|tab)\b/gi) ?? [])
                  .map(s => s.toLowerCase().replace(/\s/g, ''))
  const lower  = folderName.toLowerCase()
  const flavors = FLAVOR_WORDS.filter(w => lower.includes(w)).sort().join(',')
  return { sku, sizes, flavors }
}

function deduplicateProducts(products) {
  const THRESHOLD = 0.88
  const eliminated = new Set()

  for (let i = 0; i < products.length; i++) {
    if (eliminated.has(i)) continue
    const a    = products[i]
    const metA = extractProductMeta(a.folderName)
    const aN   = ngrams(`${a.folderName} ${a.rawInfoText.slice(0, 300)}`)

    for (let j = i + 1; j < products.length; j++) {
      if (eliminated.has(j)) continue
      const b    = products[j]
      const metB = extractProductMeta(b.folderName)

      // Guarda 1: SKUs distintos → definitivamente no es duplicado
      if (metA.sku && metB.sku && metA.sku !== metB.sku) continue

      // Guarda 2: tamaños distintos → presentación diferente
      if (metA.sizes.length && metB.sizes.length) {
        if (!metA.sizes.some(s => metB.sizes.includes(s))) continue
      }

      // Guarda 3: sabores/variantes distintos → producto diferente
      if (metA.flavors && metB.flavors && metA.flavors !== metB.flavors) continue

      // Similitud textual general
      const bN = ngrams(`${b.folderName} ${b.rawInfoText.slice(0, 300)}`)
      if (jaccardSim(aN, bN) < THRESHOLD) continue

      // Es duplicado real
      const keepA  = a.rawInfoText.length >= b.rawInfoText.length
      const winner = keepA ? a : b
      const loser  = keepA ? b : a
      const li     = keepA ? j : i
      loser.status      = 'duplicate'
      loser.duplicateDe = winner.folderName
      eliminated.add(li)
      console.log(`  ♻  Dup: "${loser.folderName}" ← "${winner.folderName}"`)
    }
  }
}

// ── Phase 4: AI Enrichment ─────────────────────────────────────────────
const VALID_CATS = [
  'Suplementos y Vitaminas',
  'Proteínas y Fitness',
  'Belleza y Cuidado Personal',
  'Salud y Bienestar',
  'Hierbas y Plantas Medicinales',
  'Alimentos Naturales y Orgánicos',
  'Cuidado del Cabello',
  'Cuidado de la Piel',
  'Digestivo y Probióticos',
  'Energía y Rendimiento',
  'Otro',
]

async function enrichWithAI(product) {
  const info = product.rawInfoText
    ? `\n\nARCHIVO INFO.TXT (fuente primaria — copiar literalmente si disponible):\n${product.rawInfoText.slice(0, 2500)}`
    : ''

  const prompt = `Analiza este producto de salud/bienestar/nutrición. Responde SOLO con JSON válido, sin texto adicional.

NOMBRE CARPETA: ${product.folderName}
CATEGORÍA CARPETA (referencia, no definitiva): ${product.categoryOriginal}${info}

REGLAS:
- Si info.txt tiene el campo → copiarlo LITERALMENTE, no inventar
- Si falta → inferir con conocimiento del producto
- Categorías válidas: ${VALID_CATS.join(' | ')}
- es_organico: exactamente "Sí" o "No"
- nombres_comerciales: 3 nombres que la gente busca en Google Perú
- Responder en español

JSON a retornar (sin código extra):
{
  "nombre": "nombre completo del producto",
  "marca": "nombre de la marca",
  "categoria_correcta": "una de las categorías válidas",
  "nombres_comerciales": ["nombre1", "nombre2", "nombre3"],
  "tipo_envase": "frasco|caja|sobre|tubo|spray|ampolla|bolsa|blister|otro",
  "cantidad": "ej: 500ml, 100g, 60 cápsulas",
  "descripcion": "2-3 oraciones de marketing para el cliente",
  "ingredientes": "lista completa de ingredientes",
  "beneficios_producto": "beneficios técnicos del producto",
  "beneficios_cliente": "cómo mejora la vida del cliente, lenguaje emocional",
  "precauciones": "precauciones y advertencias importantes",
  "modo_de_uso": "instrucciones de uso detalladas",
  "es_organico": "Sí o No"
}`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await ai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      })
      const text   = resp.choices[0]?.message?.content || ''
      const parsed = extractJson(text)
      if (parsed && parsed.nombre) {
        product.data = { ...product.data, ...parsed }
        product.status = 'enriched'
        return product
      }
      throw new Error('JSON inválido o campo "nombre" faltante')
    } catch (e) {
      if (attempt < 2) {
        await sleep(2500 * (attempt + 1))
      } else {
        console.error(`  ✗  AI enrichment ${product.folderName}: ${e.message}`)
        product.status = 'enriched'  // mark done even if partial
      }
    }
  }
  return product
}

// ── Phase 5: Price Research ────────────────────────────────────────────
async function researchPrices(product) {
  const d          = product.data || {}
  const searchName = d.nombres_comerciales?.[0] || d.nombre || product.folderName
  const marca      = d.marca ? `de ${d.marca}` : ''
  const cantidad   = d.cantidad || ''

  const searchPrompt = `Busca en internet el precio actual de "${searchName}" ${marca} ${cantidad} en estas tiendas peruanas: Inkafarma (inkafarma.pe), Mifarma (mifarma.pe), Falabella Perú (falabella.com.pe), MercadoLibre Perú (mercadolibre.com.pe), Plaza Vea (plazavea.com.pe), Ripley (ripley.com.pe).

INSTRUCCIONES ESTRICTAS:
- Usa la herramienta de búsqueda web para encontrar el producto. NO uses tu memoria de entrenamiento.
- Solo incluye una tienda si encontraste el producto EXACTO (mismo nombre y tamaño) en esa tienda.
- El link DEBE ser la URL directa de la página del producto (no página de búsqueda).
- Si no encuentras el producto en una tienda, NO la incluyas. Prefiere 0 resultados a datos incorrectos.
- Busca también en iHerb o Amazon.com el precio en USD.

Responde SOLO con este JSON (sin texto adicional):
{
  "peruana": [
    {"tienda": "Inkafarma", "link": "URL-directa-del-producto", "precio_soles": 133.90},
    {"tienda": "Mifarma", "link": "URL-directa-del-producto", "precio_soles": 129.00}
  ],
  "internacional": {"tienda": "iHerb", "link": "URL-directa", "precio_usd": 24.99}
}
Si no encuentras precios reales devuelve: {"peruana": [], "internacional": null}`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await ai.responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        tool_choice: 'required',
        input: searchPrompt,
      })
      const responseText = resp.output_text || ''
      const parsed = extractJson(responseText)
      if (!parsed) throw new Error('Sin JSON de precios')

      const peruanas = Array.isArray(parsed.peruana) ? parsed.peruana : []
      const intl     = parsed.internacional

      // Verify each URL by fetching the real page
      const verified = []
      for (const entry of peruanas.slice(0, 4)) {
        if (!entry.link || !entry.tienda) continue
        const aiPrice   = Number(entry.precio_soles)
        const realPrice = await fetchAndVerifyPrice(entry.link)
        const price     = realPrice ?? (aiPrice > 3 ? aiPrice : null)
        if (!price) continue
        verified.push({ tienda: entry.tienda, link: entry.link, precio: price })
        await sleep(400)
      }

      if (verified[0]) {
        product.data.tienda1       = verified[0].tienda
        product.data.linkTienda1   = verified[0].link
        product.data.precioTienda1 = `S/ ${verified[0].precio.toFixed(2)}`
      }
      if (verified[1]) {
        product.data.tienda2       = verified[1].tienda
        product.data.linkTienda2   = verified[1].link
        product.data.precioTienda2 = `S/ ${verified[1].precio.toFixed(2)}`
      }
      if (verified[2]) {
        product.data.tienda3       = verified[2].tienda
        product.data.linkTienda3   = verified[2].link
        product.data.precioTienda3 = `S/ ${verified[2].precio.toFixed(2)}`
      }

      // Internacional
      if (intl?.link && intl?.tienda) {
        const realIntl  = await fetchAndVerifyPrice(intl.link)
        const intlPrice = realIntl ?? (Number(intl.precio_usd) > 0 ? Number(intl.precio_usd) : null)
        if (intlPrice) {
          product.data.tiendaInternacional    = intl.tienda
          product.data.linkInternacional      = intl.link
          product.data.precioInternacionalUSD = `$ ${intlPrice.toFixed(2)}`
        }
      }

      // Derived price calculations
      const nums = verified.map(v => v.precio).filter(n => n > 0)
      if (nums.length) {
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length
        const min = Math.min(...nums)
        product.data.precioReferencial   = `S/ ${avg.toFixed(2)}`
        product.data.precioInternet      = `S/ ${min.toFixed(2)}`
        product.data.precioEstimadoVenta = `S/ ${(avg * 1.30).toFixed(2)}`
      } else {
        delete product.data.precioReferencial
        delete product.data.precioInternet
        delete product.data.precioEstimadoVenta
      }

      break
    } catch (e) {
      if (attempt < 2) {
        await sleep(4000 * (attempt + 1))
      } else {
        console.error(`  ✗  precios ${product.folderName}: ${e.message}`)
      }
    }
  }

  product.status = 'prices_done'
  return product
}

// ── Phase 6: Excel Export ──────────────────────────────────────────────
const COLUMNS = [
  { header: 'Categoría Original',          key: 'catOriginal',    width: 20 },
  { header: 'Categoría Correcta',          key: 'catCorrecta',    width: 26 },
  { header: 'Duplicado De',                key: 'duplicadoDe',    width: 32 },
  { header: 'Nombre del Producto',         key: 'nombre',         width: 44 },
  { header: 'SKU / Barcode',               key: 'sku',            width: 18 },
  { header: 'Marca',                       key: 'marca',          width: 20 },
  { header: 'Nombre Comercial 1',          key: 'nc1',            width: 34 },
  { header: 'Nombre Comercial 2',          key: 'nc2',            width: 34 },
  { header: 'Nombre Comercial 3',          key: 'nc3',            width: 34 },
  { header: 'Tipo de Envase',              key: 'envase',         width: 16 },
  { header: 'Cantidad / Tamaño',           key: 'cantidad',       width: 16 },
  { header: 'Descripción',                 key: 'descripcion',    width: 55 },
  { header: 'Ingredientes',                key: 'ingredientes',   width: 45 },
  { header: 'Beneficios del Producto',     key: 'benefProd',      width: 45 },
  { header: 'Beneficios para el Cliente',  key: 'benefCliente',   width: 45 },
  { header: 'Precauciones',                key: 'precauciones',   width: 40 },
  { header: 'Modo de Uso',                 key: 'modoUso',        width: 40 },
  { header: 'Orgánico',                    key: 'organico',       width: 12 },
  { header: 'Imagen Original (path)',      key: 'imgOriginal',    width: 44 },
  { header: 'Imagen Limpia PNG (URL)',     key: 'imgLimpia',      width: 55 },
  { header: 'Precio en Ficha',             key: 'precioFicha',    width: 16 },
  { header: 'Tienda 1 (Perú)',             key: 'tienda1',        width: 22 },
  { header: 'Link Tienda 1',               key: 'link1',          width: 48 },
  { header: 'Precio Tienda 1 (S/)',        key: 'precio1',        width: 18 },
  { header: 'Tienda 2 (Perú)',             key: 'tienda2',        width: 22 },
  { header: 'Link Tienda 2',               key: 'link2',          width: 48 },
  { header: 'Precio Tienda 2 (S/)',        key: 'precio2',        width: 18 },
  { header: 'Tienda 3 (Perú)',             key: 'tienda3',        width: 22 },
  { header: 'Link Tienda 3',               key: 'link3',          width: 48 },
  { header: 'Precio Tienda 3 (S/)',        key: 'precio3',        width: 18 },
  { header: 'Tienda Internacional',        key: 'tiendaIntl',     width: 24 },
  { header: 'Link Internacional',          key: 'linkIntl',       width: 48 },
  { header: 'Precio Internacional (USD)',  key: 'precioIntlUSD',  width: 24 },
  { header: 'Precio Referencial (S/)',     key: 'precioRef',      width: 22 },
  { header: 'Precio de Internet (S/)',     key: 'precioNet',      width: 22 },
  { header: 'Precio Est. Venta (S/)',      key: 'precioVenta',    width: 22 },
]

const LINK_KEYS = new Set(['imgLimpia', 'link1', 'link2', 'link3', 'linkIntl'])
const HDR_BG    = 'FF1B3A5C'
const HDR_FG    = 'FFFFFFFF'
const ZEBRA_BG  = 'FFF0F5FA'
const DUPE_BG   = 'FFE2E2E2'
const LINK_FG   = 'FF0563C1'

function buildRow(p) {
  const d  = p.data || {}
  const nc = d.nombres_comerciales || []
  return {
    catOriginal:   p.categoryOriginal || '',
    catCorrecta:   d.categoria_correcta || '',
    duplicadoDe:   p.duplicateDe || '',
    nombre:        d.nombre || p.folderName,
    sku:           d.sku || '',
    marca:         d.marca || '',
    nc1:           nc[0] || '',
    nc2:           nc[1] || '',
    nc3:           nc[2] || '',
    envase:        d.tipo_envase || '',
    cantidad:      d.cantidad || '',
    descripcion:   d.descripcion || '',
    ingredientes:  d.ingredientes || '',
    benefProd:     d.beneficios_producto || '',
    benefCliente:  d.beneficios_cliente || '',
    precauciones:  d.precauciones || '',
    modoUso:       d.modo_de_uso || '',
    organico:      d.es_organico || '',
    imgOriginal:   p.imagePaths?.[0] || '',
    imgLimpia:     p.coverImageUrl || '',
    precioFicha:   d.precioFicha || '',
    tienda1:       d.tienda1 || '',
    link1:         d.linkTienda1 || '',
    precio1:       d.precioTienda1 || '',
    tienda2:       d.tienda2 || '',
    link2:         d.linkTienda2 || '',
    precio2:       d.precioTienda2 || '',
    tienda3:       d.tienda3 || '',
    link3:         d.linkTienda3 || '',
    precio3:       d.precioTienda3 || '',
    tiendaIntl:    d.tiendaInternacional || '',
    linkIntl:      d.linkInternacional || '',
    precioIntlUSD: d.precioInternacionalUSD || '',
    precioRef:     d.precioReferencial || '',
    precioNet:     d.precioInternet || '',
    precioVenta:   d.precioEstimadoVenta || '',
  }
}

function populateSheet(ws, products) {
  ws.columns = COLUMNS

  // Header row
  const hRow = ws.getRow(1)
  hRow.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: HDR_FG }, size: 11 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HDR_BG } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FF0F2952' } } }
  })
  hRow.height = 30

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }]
  ws.autoFilter = { from: 'A1', to: `${colLetter(COLUMNS.length)}1` }

  let rowNum = 2
  for (const product of products) {
    const rowData = buildRow(product)
    const isDupe  = !!product.duplicateDe
    const isEven  = rowNum % 2 === 0

    const row = ws.addRow(rowData)
    row.height = 65

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const key = COLUMNS[colNum - 1]?.key
      const val = rowData[key] || ''

      if (LINK_KEYS.has(key) && typeof val === 'string' && val.startsWith('http')) {
        cell.value = { text: val.length > 55 ? val.slice(0, 52) + '…' : val, hyperlink: val }
        cell.font  = { color: { argb: LINK_FG }, underline: true, size: 10 }
      } else {
        cell.font = { size: 10, color: { argb: isDupe ? 'FF666666' : 'FF111111' } }
      }

      cell.alignment = { vertical: 'top', wrapText: true }

      const bg = isDupe ? DUPE_BG : isEven ? ZEBRA_BG : null
      if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    })

    rowNum++
  }
}

async function exportExcel(products) {
  const wb    = new ExcelJS.Workbook()
  wb.creator  = 'LIORA Catalog Builder'
  wb.created  = new Date()

  // Build category map — TODOS first
  const byCategory = new Map([['TODOS', products]])
  for (const p of products) {
    const cat = p.data?.categoria_correcta || p.categoryOriginal || 'Sin Categoría'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat).push(p)
  }

  const usedNames = new Set()
  for (const [name, prods] of byCategory) {
    let safeName = name.slice(0, 31).replace(/[\\/:*?[\]]/g, '_')
    let candidate = safeName
    let n = 2
    while (usedNames.has(candidate.toLowerCase())) {
      candidate = safeName.slice(0, 28) + `_${n++}`
    }
    safeName = candidate
    usedNames.add(safeName.toLowerCase())

    const ws = wb.addWorksheet(safeName, {
      pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape', paperSize: 9 }
    })
    populateSheet(ws, prods)
  }

  await wb.xlsx.writeFile(OUTPUT_XLSX)
}

// ── Ensure bucket exists ───────────────────────────────────────────────
async function ensureBucket() {
  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`No se pudo crear bucket: ${error.message}`)
    console.log(`✓  Bucket "${BUCKET}" creado`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════')
  console.log('  LIORA — Catalog Builder')
  console.log(`  Modo: ${TEST_MODE ? 'TEST (1 producto)' : 'Completo'}`)
  console.log('══════════════════════════════════════════════\n')

  await ensureBucket()

  // ── Phase 1: Discovery
  console.log('📂  Fase 1: Descubriendo productos...')
  let discovered = scanProducts()
  console.log(`    ${discovered.length} productos encontrados en ${PRODUCTS_DIR}\n`)

  if (TEST_MODE) {
    discovered = discovered.slice(0, 1)
    console.log(`    [TEST] Solo procesando: "${discovered[0]?.folderName}"\n`)
  }

  // Merge with checkpoint (resume support)
  const cp = loadCheckpoint()
  const products = discovered.map(p => {
    const saved = cp[p.id]
    if (!saved) return p
    // Restore computed fields from checkpoint; keep fresh filesystem paths
    return {
      ...p,
      ...saved,
      imagePaths:  p.imagePaths,
      folderPath:  p.folderPath,
      infoTxtPath: p.infoTxtPath,
      categoryOriginal: p.categoryOriginal,
    }
  })

  const pending       = products.filter(p => p.status === 'pending')
  const imagesDone    = products.filter(p => p.status === 'images_done')
  const infoExtracted = products.filter(p => p.status === 'info_extracted')
  const enriched      = products.filter(p => p.status === 'enriched' && !p.duplicateDe)
  console.log(`    Checkpoint: ${Object.keys(cp).length} guardados | pendientes=${pending.length} images=${imagesDone.length} info=${infoExtracted.length} enriched=${enriched.length}\n`)

  // ── Phase 2: Image Processing
  const needsImages = products.filter(p => p.status === 'pending')
  if (needsImages.length) {
    console.log(`🖼   Fase 2: Procesando imágenes (${needsImages.length} productos)...`)
    let n = 0
    for (const p of needsImages) {
      await processImage(p)
      cp[p.id] = p
      n++
      if (n % 10 === 0) { saveCheckpoint(cp); process.stdout.write(`    ${n}/${needsImages.length}\r`) }
      await sleep(150)
    }
    saveCheckpoint(cp)
    console.log(`    ✓ ${n} imágenes procesadas\n`)
  }

  // ── Phase 3: Info Extraction
  const needsInfo = products.filter(p => p.status === 'images_done')
  if (needsInfo.length) {
    console.log(`📄  Fase 3: Extrayendo info.txt (${needsInfo.length} productos)...`)
    for (const p of needsInfo) {
      extractInfo(p)
      cp[p.id] = p
    }
    saveCheckpoint(cp)
    console.log('    ✓ Información extraída\n')
  }

  // ── Phase 3.5: Deduplication
  if (!TEST_MODE) {
    // Reset any previously-marked duplicates so they get re-evaluated with the new logic
    let resetCount = 0
    for (const p of products) {
      if (p.status === 'duplicate') {
        p.status = 'info_extracted'
        p.duplicateDe = null
        cp[p.id] = p
        resetCount++
      }
    }
    if (resetCount) {
      saveCheckpoint(cp)
      console.log(`    ↩  ${resetCount} duplicados reseteados para re-evaluación\n`)
    }

    const toDedup = products.filter(p => p.status === 'info_extracted')
    if (toDedup.length) {
      console.log(`♻   Fase 3.5: Detectando duplicados (${toDedup.length} productos)...`)
      deduplicateProducts(toDedup)
      for (const p of toDedup) cp[p.id] = p
      saveCheckpoint(cp)
      const dupes = toDedup.filter(p => p.duplicateDe).length
      console.log(`    ✓ ${dupes} duplicados detectados\n`)
    }
  }

  // ── Phase 4: AI Enrichment
  const needsAI = products.filter(p => p.status === 'info_extracted' && !p.duplicateDe)
  if (needsAI.length) {
    console.log(`🤖  Fase 4: Enriquecimiento IA — gpt-4o-mini (${needsAI.length} productos)...`)
    for (let i = 0; i < needsAI.length; i++) {
      const p = needsAI[i]
      await enrichWithAI(p)
      cp[p.id] = p
      console.log(`  [${i + 1}/${needsAI.length}] ${p.folderName} → ${p.data.nombre || '?'}`)
      if ((i + 1) % 5 === 0) saveCheckpoint(cp)
      await sleep(500)
    }
    saveCheckpoint(cp)
    console.log(`    ✓ ${needsAI.length} productos enriquecidos\n`)
  }

  // ── Phase 5: Price Research
  const needsPrices = products.filter(p => p.status === 'enriched' && !p.duplicateDe)
  if (needsPrices.length) {
    console.log(`💰  Fase 5: Precios — gpt-4o-mini-search-preview (${needsPrices.length} productos)...`)
    for (let i = 0; i < needsPrices.length; i++) {
      const p = needsPrices[i]
      await researchPrices(p)
      cp[p.id] = p
      const t1 = p.data.tienda1 || '—'
      const pr = p.data.precioTienda1 || p.data.precioReferencial || '—'
      console.log(`  [${i + 1}/${needsPrices.length}] ${p.folderName}: ${t1} ${pr}`)
      if ((i + 1) % 5 === 0) saveCheckpoint(cp)
      await sleep(1500)  // respect rate limits for web search
    }
    saveCheckpoint(cp)
    console.log(`    ✓ ${needsPrices.length} productos con precios\n`)
  }

  // ── Phase 6: Excel Export
  console.log('📊  Fase 6: Generando Excel...')
  await exportExcel(products)

  const dupeCount = products.filter(p => p.duplicateDe).length
  const noPrice   = products.filter(p => !p.duplicateDe && !p.data.tienda1).length
  console.log(`\n✅  ¡Catálogo completado!`)
  console.log(`   Archivo : ${OUTPUT_XLSX}`)
  console.log(`   Productos: ${products.length} total (${dupeCount} duplicados, ${noPrice} sin precio)`)
  console.log(`   Sheets  : TODOS + 1 por categoría`)
}

main().catch(err => {
  console.error('\n💥  Error fatal:', err)
  process.exit(1)
})
