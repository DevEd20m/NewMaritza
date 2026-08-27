import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import sharp from 'sharp'

import { generateSkuBase } from '../src/lib/utils/generate-sku.ts'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE_PATH = process.env.ARUMA_SKIN_SOURCE_PATH || '/tmp/aruma-skin-raw.json'
const OUTPUT_DIR = join(ROOT, 'imports', 'aruma-skin-2026-08-27')
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json')
const BUCKET = 'product-images'
const SOURCE_CATEGORY_URL = 'https://www.aruma.pe/cuidado-de-la-piel'
const MAX_IMAGES = 5
const KNOWN_EXISTING_SOURCE_IDS = new Set(['7013', '1019612', '5004', '4466'])

dotenv.config({ path: process.env.IMPORT_ENV_PATH || join(ROOT, '.env.local'), quiet: true })

const RESEARCHED_DESCRIPTIONS = {
  '1027045': 'Exfoliante líquido facial sin enjuague con 4% de AHA, 1% de PHA y aloe vera. Ayuda a refinar la apariencia de los poros, suavizar la textura y aportar luminosidad a la piel.',
  '1027044': 'Sérum facial con Thiamidol, niacinamida y aloe vera que ayuda a unificar el tono, refinar la apariencia de los poros e hidratar con una textura ligera.',
  '1026889': 'Sérum facial calmante de textura ligera, formulado para aportar hidratación y confort a la piel sensible o sensibilizada.',
  '1026887': 'Protector solar facial en barra SPF 50+ PA++++ de acabado refrescante y práctico para reaplicar durante el día.',
  '1025810': 'Rutina facial CeraVe orientada al control del exceso de grasa. Combina limpieza e hidratación ligera para ayudar a mantener la barrera cutánea sin sensación pesada.',
  '1028078': 'Parches hidrocoloides para imperfecciones con ceramidas esenciales y niacinamida. Ayudan a proteger la zona y reducir visiblemente la apariencia de granos y rojeces.',
  '1027838': 'Sérum reafirmante con ácido hialurónico y provitamina B5 que aporta hidratación intensa, ayuda a suavizar líneas de expresión y refuerza la barrera cutánea.',
  '1027221': 'Protector solar facial fluido con color bronze y alta protección UVA/UVB. Su textura ligera ayuda a unificar el tono y deja un acabado natural.',
  '1027046': 'Protector solar facial ultraligero con tono medio y alta protección UVA/UVB. Ayuda a unificar el tono y ofrece un acabado ligero para uso diario.',
  '1026890': 'Limpiador facial en polvo que se activa con agua y produce una espuma suave. Diseñado para retirar impurezas con una experiencia de limpieza delicada.',
  '1026886': 'Gel crema facial calmante de textura fresca y ligera que ayuda a hidratar y aportar confort sin una sensación pesada.',
  '1026406': 'Pack de cuidado facial Revitalift que combina un sérum de ácido hialurónico con una crema gel hidratante para una rutina enfocada en hidratación y apariencia tersa.',
  '1025811': 'Rutina CeraVe para piel con tendencia a imperfecciones. Reúne productos de limpieza y tratamiento que ayudan a mantener los poros limpios y cuidar la barrera cutánea.',
  '1025808': 'Dúo de limpiadores espumosos CeraVe para retirar impurezas y exceso de grasa sin alterar la barrera protectora de la piel.',
}

function clean(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalize(value) {
  return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, ' ').trim()
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-').slice(0, 88).replace(/-+$/g, '')
}

function values(product, key) {
  const raw = product?.[key]
  return [...new Set((Array.isArray(raw) ? raw : raw ? [raw] : []).map(clean).filter(Boolean))]
}

function bestOffer(product) {
  const offers = []
  for (const item of product.items ?? []) {
    for (const seller of item.sellers ?? []) {
      const offer = seller.commertialOffer
      if (offer?.IsAvailable && Number(offer.Price) > 0) offers.push({ item, offer, preferred: Boolean(seller.sellerDefault) })
    }
  }
  return offers.sort((a, b) => Number(b.preferred) - Number(a.preferred) || Number(a.offer.Price) - Number(b.offer.Price))[0] ?? null
}

function presentation(product, item) {
  return values(product, 'CONTENIDO')[0]
    || clean(item.nameComplete).match(/\b\d+(?:[.,]\d+)?\s*(?:ml|g|gr|kg|l|oz|un|und|unidades|p)\b/i)?.[0]
    || clean(product.productName).match(/\b\d+(?:[.,]\d+)?\s*(?:ml|g|gr|kg|l|oz|un|und|unidades|p)\b/i)?.[0]
    || 'Unidad'
}

function categorySlug(product) {
  const text = normalize([product.productName, ...(product.categories ?? []), ...values(product, 'TIPO DE PRODUCTO'), ...values(product, 'BENEFICIO')].join(' '))
  return /protector solar|bloqueador|fotoprotector|after sun|spf|fps|bronceador|solar/.test(text) ? 'solar' : 'piel'
}

function description(product) {
  const direct = clean(product.description || product.metaTagDescription)
  if (direct) return direct
  if (RESEARCHED_DESCRIPTIONS[product.productId]) return RESEARCHED_DESCRIPTIONS[product.productId]
  const benefits = values(product, 'BENEFICIO').join(', ').toLowerCase()
  return `${clean(product.productName)} de ${clean(product.brand)} es un producto de cuidado facial${benefits ? ` orientado a ${benefits}` : ''}. Consulta el envase para conocer la fórmula, frecuencia y precauciones específicas del fabricante.`
}

function usage(product) {
  const direct = clean(values(product, 'Como Usarlo')[0] || values(product, 'como-usarlo')[0] || values(product, 'USO')[0])
  if (direct) return direct
  const text = normalize(`${product.productName} ${values(product, 'TIPO DE PRODUCTO').join(' ')}`)
  if (/protector|bloqueador|fotoprotector/.test(text)) return 'Aplicar generosamente sobre la piel seca antes de la exposición solar. Reaplicar cada dos horas y después de nadar, sudar o secarse con una toalla.'
  if (/limpiador|agua micelar|desmaquillante|jabon|gel de limpieza/.test(text)) return 'Aplicar sobre el rostro según el formato del producto, masajear suavemente y retirar o enjuagar conforme a las indicaciones del envase.'
  if (/mascarilla|parche/.test(text)) return 'Aplicar sobre la piel limpia y seca durante el tiempo indicado en el envase. Retirar y continuar con la rutina habitual.'
  return 'Aplicar sobre la piel limpia siguiendo la cantidad, frecuencia y orden de uso indicados por el fabricante en el envase.'
}

function tags(product, category) {
  const text = normalize([product.productName, product.description, ...values(product, 'TIPO DE PIEL'), ...values(product, 'BENEFICIO'), ...values(product, 'FORMATO')].join(' '))
  const result = new Set(['nivel-principiante', 'momento-uso-diario', 'intensidad-ligero'])
  result.add(category === 'solar' ? 'objetivo-proteccion-solar' : 'objetivo-piel')
  result.add(/noche|retinol/.test(text) ? 'uso-rutina-noche' : 'uso-rutina-dia')
  if (/seca|hidrat/.test(text)) result.add('piel-seca')
  if (/sensible|calm/.test(text)) result.add('piel-sensible')
  if (/grasa|acne|imperfeccion|sebo/.test(text)) result.add('piel-grasa')
  if (/mini|viaje/.test(text)) result.add('pref-travel-size')
  return [...result]
}

function contraindications(product, category) {
  if (category === 'solar') return 'Uso externo. Evitar el contacto con los ojos. La exposición excesiva al sol representa un riesgo para la salud; el protector solar no ofrece protección total. Suspender ante irritación y mantener fuera del alcance de los niños.'
  const text = normalize(`${product.productName} ${product.description}`)
  const activeWarning = /retinol|aha|bha|pha|glicol|salicil|exfol/.test(text) ? ' Introducir gradualmente si contiene activos exfoliantes o retinoides y usar protección solar durante el día.' : ''
  return `Uso externo. Evitar ojos, mucosas y piel lesionada. Suspender el uso ante irritación persistente y revisar los ingredientes si existe sensibilidad conocida.${activeWarning}`
}

function tokenSimilarity(left, right) {
  const a = new Set(normalize(left).split(' ').filter((token) => token.length > 1))
  const b = new Set(normalize(right).split(' ').filter((token) => token.length > 1))
  const intersection = [...a].filter((token) => b.has(token)).length
  return intersection / Math.max(a.size, b.size, 1)
}

async function exists(path) {
  try { await access(path); return true } catch { return false }
}

async function mapLimit(items, limit, fn) {
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) { const index = cursor++; await fn(items[index], index) }
  }))
}

async function fetchWithRetry(url, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 LIORA catalog import' } })
      if (response.ok || response.status < 500) return response
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 500))
  }
  throw lastError
}

async function prepare() {
  const source = JSON.parse(await readFile(SOURCE_PATH, 'utf8')).filter((row) => row?.productId)
  const selected = source.map((product) => ({ product, chosen: bestOffer(product) })).filter((row) => row.chosen)
  await mkdir(OUTPUT_DIR, { recursive: true })
  const products = []
  await mapLimit(selected, 6, async ({ product, chosen }, index) => {
    const category = categorySlug(product)
    const itemName = clean(chosen.item.nameComplete || product.productName)
    const name = clean(product.productName || itemName)
    const slug = `${slugify(name)}-${product.productId}`
    const imageUrls = [...new Set((chosen.item.images ?? []).map((image) => image.imageUrl).filter(Boolean))].slice(0, MAX_IMAGES)
    const imageDir = join(OUTPUT_DIR, 'images', slug)
    await mkdir(imageDir, { recursive: true })
    const localImages = []
    for (const [imageIndex, imageUrl] of imageUrls.entries()) {
      const destination = join(imageDir, `${String(imageIndex + 1).padStart(2, '0')}.webp`)
      if (!(await exists(destination))) {
        let response
        try {
          response = await fetchWithRetry(imageUrl)
        } catch (error) {
          console.warn(`Imagen omitida (red): ${imageUrl} — ${error instanceof Error ? error.message : String(error)}`)
          continue
        }
        if (!response.ok) {
          console.warn(`Imagen omitida (${response.status}): ${imageUrl}`)
          continue
        }
        await sharp(Buffer.from(await response.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, effort: 4 }).toFile(destination)
      }
      localImages.push(relative(ROOT, destination))
    }
    if (!localImages.length) throw new Error(`Producto sin imágenes descargables: ${name} (${product.productId})`)
    const priceCents = Math.round(Number(chosen.offer.Price) * 100)
    const listCents = Math.round(Number(chosen.offer.ListPrice ?? chosen.offer.Price) * 100)
    products.push({
      sourceProductId: String(product.productId), sourceItemId: clean(chosen.item.itemId), sourceUrl: clean(product.link),
      name, slug, brand: clean(product.brand), categorySlug: category, description: description(product),
      indications: `Personas que buscan ${values(product, 'BENEFICIO').join(', ').toLowerCase() || 'incorporar este tipo de producto a su rutina de cuidado de la piel'}.`,
      usageInstructions: usage(product), contraindications: contraindications(product, category), presentation: presentation(product, chosen.item),
      priceCents, compareAtCents: listCents > priceCents ? listCents : null, sourceImageUrls: imageUrls, localImages,
      tagSlugs: tags(product, category), researchedDescription: Boolean(RESEARCHED_DESCRIPTIONS[product.productId]),
    })
    if ((index + 1) % 25 === 0) console.log(`Preparados ${index + 1}/${selected.length}`)
  })
  products.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  await writeFile(MANIFEST_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceCategoryUrl: SOURCE_CATEGORY_URL, products }, null, 2)}\n`)
  console.log(JSON.stringify({ manifest: relative(ROOT, MANIFEST_PATH), products: products.length, images: products.reduce((sum, product) => sum + product.localImages.length, 0), researchedDescriptions: products.filter((product) => product.researchedDescription).length }, null, 2))
}

function adminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Faltan credenciales de Supabase')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}

function uniqueSku(base, used) {
  let candidate = base
  for (let suffix = 2; used.has(normalize(candidate)); suffix++) candidate = `${base}-${suffix}`
  used.add(normalize(candidate))
  return candidate
}

async function context(admin) {
  const [categories, products, variants, tagRows] = await Promise.all([
    admin.from('categories').select('id,slug').in('slug', ['piel', 'solar']),
    admin.from('products').select('id,name,slug,brand').range(0, 1999),
    admin.from('product_variants').select('sku').range(0, 3999),
    admin.from('tags').select('id,slug').range(0, 999),
  ])
  for (const result of [categories, products, variants, tagRows]) if (result.error) throw result.error
  return {
    categoryBySlug: new Map(categories.data.map((row) => [row.slug, row.id])), existing: products.data,
    usedSkus: new Set(variants.data.map((row) => normalize(row.sku))), tagBySlug: new Map(tagRows.data.map((row) => [row.slug, row.id])),
  }
}

function duplicateOf(product, existing) {
  const exact = existing.find((row) => row.slug === product.slug || (
    normalize(row.brand) === normalize(product.brand) && normalize(row.name) === normalize(product.name)
  ))
  if (exact) return exact
  if (!KNOWN_EXISTING_SOURCE_IDS.has(product.sourceProductId)) return null
  return existing
    .filter((row) => normalize(row.brand) === normalize(product.brand))
    .map((row) => ({ row, score: tokenSimilarity(row.name, product.name) }))
    .sort((left, right) => right.score - left.score)[0]?.row ?? null
}

async function syncExistingPrice(admin, product, existingProduct) {
  if (!KNOWN_EXISTING_SOURCE_IDS.has(product.sourceProductId)) return false
  const variants = await admin.from('product_variants').select('id,product_prices(id,amount_cents,compare_at_cents,effective_to)').eq('product_id', existingProduct.id).eq('is_active', true).limit(1)
  if (variants.error) throw variants.error
  const variant = variants.data[0]
  if (!variant) throw new Error(`Producto existente sin variante: ${existingProduct.slug}`)
  const current = variant.product_prices?.find((price) => price.effective_to === null)
  if (current?.amount_cents === product.priceCents && current?.compare_at_cents === product.compareAtCents) return false
  const now = new Date().toISOString()
  if (current) {
    const close = await admin.from('product_prices').update({ effective_to: now }).eq('id', current.id)
    if (close.error) throw close.error
  }
  const insert = await admin.from('product_prices').insert({ variant_id: variant.id, currency: 'PEN', amount_cents: product.priceCents, compare_at_cents: product.compareAtCents, effective_from: now, effective_to: null })
  if (insert.error) throw insert.error
  return true
}

async function apply() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const admin = adminClient()
  const ctx = await context(admin)
  const created = []; const skipped = []; const errors = []
  await mapLimit(manifest.products, 4, async (product, index) => {
    const duplicate = duplicateOf(product, ctx.existing)
    if (duplicate) {
      try {
        const priceUpdated = await syncExistingPrice(admin, product, duplicate)
        skipped.push({ source: product.name, existing: duplicate.name, slug: duplicate.slug, priceUpdated })
      } catch (error) {
        errors.push({ name: product.name, error: error instanceof Error ? error.message : String(error) })
      }
      return
    }
    const categoryId = ctx.categoryBySlug.get(product.categorySlug)
    if (!categoryId) throw new Error(`Categoría ausente: ${product.categorySlug}`)
    let productId = null; const uploaded = []
    try {
      const publicUrls = []
      for (const [imageIndex, localImage] of product.localImages.entries()) {
        const storagePath = `products/${product.slug}/${imageIndex === 0 ? 'cover' : `gallery-${imageIndex}`}.webp`
        const { error } = await admin.storage.from(BUCKET).upload(storagePath, await readFile(resolve(ROOT, localImage)), { upsert: false, contentType: 'image/webp', cacheControl: '31536000' })
        if (error) throw error
        uploaded.push(storagePath)
        publicUrls.push(admin.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl)
      }
      const productResult = await admin.from('products').insert({ name: product.name, slug: product.slug, brand: product.brand, category_id: categoryId, description: product.description, indications: product.indications, usage_instructions: product.usageInstructions, contraindications: product.contraindications, cover_image_url: publicUrls[0], gallery_urls: publicUrls.slice(1), is_active: true }).select('id,name,slug,brand').single()
      if (productResult.error) throw productResult.error
      productId = productResult.data.id
      const sku = uniqueSku(generateSkuBase(product.categorySlug, product.name, product.presentation), ctx.usedSkus)
      const variantResult = await admin.from('product_variants').insert({ product_id: productId, sku, name: product.presentation, is_active: true, stock_quantity: null }).select('id').single()
      if (variantResult.error) throw variantResult.error
      const priceResult = await admin.from('product_prices').insert({ variant_id: variantResult.data.id, currency: 'PEN', amount_cents: product.priceCents, compare_at_cents: product.compareAtCents, effective_from: new Date().toISOString(), effective_to: null })
      if (priceResult.error) throw priceResult.error
      const tagIds = product.tagSlugs.map((slug) => ctx.tagBySlug.get(slug)).filter(Boolean)
      if (tagIds.length) { const tagResult = await admin.from('product_tags').insert(tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId }))); if (tagResult.error) throw tagResult.error }
      ctx.existing.push(productResult.data)
      created.push({ name: product.name, slug: product.slug, sku, price: product.priceCents / 100 })
      console.log(`Publicado ${index + 1}/${manifest.products.length}: ${product.name}`)
    } catch (error) {
      if (productId) await admin.from('products').delete().eq('id', productId)
      if (uploaded.length) await admin.storage.from(BUCKET).remove(uploaded)
      errors.push({ name: product.name, error: error instanceof Error ? error.message : String(error) })
      console.error(`ERROR ${product.name}: ${errors.at(-1).error}`)
    }
  })
  const report = { mode: 'apply', expected: manifest.products.length, created: created.length, skipped: skipped.length, errors, createdProducts: created, skippedProducts: skipped }
  await writeFile(join(OUTPUT_DIR, 'apply-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ ...report, createdProducts: undefined, skippedProducts: undefined }, null, 2))
  if (errors.length) process.exitCode = 1
}

async function audit() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const admin = adminClient()
  const ctx = await context(admin)
  const matched = manifest.products.map((product) => ({ product, row: duplicateOf(product, ctx.existing) })).filter((entry) => entry.row)
  const ids = matched.map((entry) => entry.row.id)
  const variantRows = []
  for (let start = 0; start < ids.length; start += 100) {
    const variants = await admin.from('product_variants').select('id,product_id,sku,is_active,stock_quantity,product_prices(amount_cents,compare_at_cents,currency,effective_to)').in('product_id', ids.slice(start, start + 100)).range(0, 499)
    if (variants.error) throw variants.error
    variantRows.push(...variants.data)
  }
  const errors = []
  for (const { product, row } of matched) {
    const variant = variantRows.find((candidate) => candidate.product_id === row.id)
    const price = variant?.product_prices?.find((candidate) => candidate.effective_to === null)
    if (!variant?.sku?.startsWith('LIO-')) errors.push(`${row.slug}: SKU inválido`)
    if (!variant?.is_active || variant.stock_quantity !== null) errors.push(`${row.slug}: variante o stock inválido`)
    if (price?.amount_cents !== product.priceCents || price?.currency !== 'PEN') errors.push(`${row.slug}: precio incorrecto`)
  }
  console.log(JSON.stringify({ mode: 'audit', expected: manifest.products.length, matched: matched.length, variants: variantRows.length, errors }, null, 2))
  if (errors.length || matched.length !== manifest.products.length) process.exitCode = 1
}

async function dryRun() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const errors = []
  const slugs = new Set()
  for (const product of manifest.products) {
    if (slugs.has(product.slug)) errors.push(`Slug duplicado: ${product.slug}`); slugs.add(product.slug)
    for (const key of ['name', 'brand', 'description', 'indications', 'usageInstructions', 'contraindications', 'presentation']) if (!clean(product[key])) errors.push(`${product.slug}: falta ${key}`)
    if (!product.priceCents || !product.localImages.length) errors.push(`${product.slug}: precio o imágenes faltantes`)
    for (const image of product.localImages) if (!(await exists(resolve(ROOT, image)))) errors.push(`${product.slug}: no existe ${image}`)
  }
  console.log(JSON.stringify({ mode: 'dry-run', products: manifest.products.length, images: manifest.products.reduce((sum, product) => sum + product.localImages.length, 0), researchedDescriptions: manifest.products.filter((product) => product.researchedDescription).length, minPrice: Math.min(...manifest.products.map((product) => product.priceCents)) / 100, maxPrice: Math.max(...manifest.products.map((product) => product.priceCents)) / 100, errors }, null, 2))
  if (errors.length) process.exitCode = 1
}

const mode = process.argv.includes('--prepare') ? 'prepare' : process.argv.includes('--apply') ? 'apply' : process.argv.includes('--audit') ? 'audit' : 'dry-run'
if (mode === 'prepare') await prepare()
else if (mode === 'apply') await apply()
else if (mode === 'audit') await audit()
else await dryRun()
