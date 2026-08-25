import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import dotenv from 'dotenv'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE_PATH = process.env.ARUMA_SOURCE_PATH || '/tmp/aruma-shampoo-raw.json'
const OUTPUT_DIR = resolve(ROOT, 'imports', 'aruma-shampoo-2026-08-20')
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json')
const MODE = process.argv.includes('--prepare')
  ? 'prepare'
  : process.argv.includes('--apply-drafts')
    ? 'apply-drafts'
    : 'dry-run'
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity
const CONCURRENCY = 5
const BUCKET = 'product-images'

dotenv.config({ path: join(ROOT, '.env.local'), quiet: true })

function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function list(specifications, key) {
  return [...new Set((specifications?.[key] || []).map(cleanText).filter(Boolean))]
}

function sentenceList(values) {
  const clean = [...new Set(values.map(cleanText).filter(Boolean))]
  if (clean.length <= 1) return clean[0] || ''
  return `${clean.slice(0, -1).join(', ')} y ${clean.at(-1)}`
}

function presentationOf(product) {
  const content = list(product.specifications, 'CONTENIDO')[0]
  if (content) return content
  const match = cleanText(product.name).match(/\b\d+(?:[.,]\d+)?\s*(?:ml|g|gr|kg|l|oz)\b/i)
  return match?.[0] || 'Unidad'
}

function frequencyOf(product) {
  const explicit = list(product.specifications, 'FRECUENCIA DE USO')
  if (explicit.length) return explicit
  return /\b(diario|diaria|daily)\b/i.test(product.name) ? ['Diaria'] : []
}

function isDryShampoo(product) {
  return /shampoo en seco|dry shampoo/i.test(`${product.name} ${list(product.specifications, 'TIPO DE PRODUCTO').join(' ')}`)
}

function buildDescription(product) {
  const benefits = list(product.specifications, 'BENEFICIO')
  const needs = list(product.specifications, 'NECESIDAD')
  const hairTypes = list(product.specifications, 'TIPO DE CABELLO')
  const frequency = frequencyOf(product)
  const parts = [
    `${cleanText(product.name)} de ${cleanText(product.brand)} es ${isDryShampoo(product) ? 'un shampoo en seco para refrescar el cabello y las raíces sin agua' : 'un shampoo para la limpieza del cabello y el cuero cabelludo'}.`,
  ]
  if (benefits.length) parts.push(`Está orientado a ${sentenceList(benefits).toLowerCase()}.`)
  if (needs.length) parts.push(`Puede incorporarse en rutinas enfocadas en ${sentenceList(needs).toLowerCase()}.`)
  if (hairTypes.length) parts.push(`Recomendado por el fabricante para ${sentenceList(hairTypes).toLowerCase()}.`)
  if (frequency.length) parts.push(`Frecuencia sugerida: ${sentenceList(frequency).toLowerCase()}.`)
  return parts.join(' ')
}

function buildIndications(product) {
  const targets = [
    ...list(product.specifications, 'BENEFICIO'),
    ...list(product.specifications, 'NECESIDAD'),
    ...list(product.specifications, 'TIPO DE CABELLO'),
  ]
  return targets.length
    ? `Personas que buscan una rutina de limpieza capilar enfocada en ${sentenceList(targets).toLowerCase()}.`
    : 'Personas que buscan mantener una rutina regular de limpieza y cuidado del cabello.'
}

function buildUsage(product) {
  const frequency = sentenceList(frequencyOf(product)).toLowerCase()
  if (isDryShampoo(product)) {
    return 'Agitar antes de usar. Aplicar sobre las raíces secas manteniendo el envase a la distancia indicada por el fabricante. Dejar actuar unos minutos, masajear y cepillar hasta retirar los residuos. No aplicar sobre piel irritada.'
  }
  return `Humedecer completamente el cabello. Aplicar una pequeña cantidad sobre el cuero cabelludo, masajear suavemente hasta formar espuma y enjuagar con abundante agua. Repetir solo si es necesario.${frequency ? ` Uso sugerido: ${frequency}.` : ''}`
}

function buildContraindications() {
  return 'Uso externo. Evitar el contacto directo con los ojos; si ocurre, enjuagar con abundante agua. Suspender el uso ante irritación persistente. Mantener fuera del alcance de los niños y revisar la lista de ingredientes en caso de sensibilidad conocida.'
}

function buildTagSlugs(product) {
  const seals = list(product.specifications, 'SELLOS').join(' ').toLowerCase()
  const format = list(product.specifications, 'FORMATO').join(' ').toLowerCase()
  const frequency = frequencyOf(product).join(' ').toLowerCase()
  const vegan = list(product.specifications, 'VEGANO').join(' ').toLowerCase()
  const tags = new Set([
    'objetivo-belleza-cabello',
    'uso-rutina-dia',
    'nivel-principiante',
    'intensidad-ligero',
  ])
  if (/diaria/.test(frequency) && !/interdiaria/.test(frequency)) tags.add('momento-uso-diario')
  else tags.add('momento-uso-ocasional')
  if (/cruelty free/.test(seals)) tags.add('pref-cruelty-free')
  if (/vegano|si|sí/.test(vegan)) tags.add('pref-vegano')
  if (/sin fragancia/.test(seals)) tags.add('pref-sin-fragancia')
  if (/mini/.test(format) || /\b(?:89|90|100)\s*(?:ml|g|gr)\b/i.test(presentationOf(product))) {
    tags.add('pref-travel-size')
    tags.add('uso-viaje')
    tags.add('momento-viaje')
  }
  return [...tags]
}

function normalizeProduct(product) {
  const name = cleanText(product.name)
  const slug = `${slugify(name)}-${product.sourceProductId}`
  const images = [...new Set((product.images || []).filter(Boolean))]
  return {
    sourceProductId: product.sourceProductId,
    sourceUrl: product.sourceUrl,
    name,
    slug,
    brand: cleanText(product.brand),
    categorySlug: 'cabello',
    description: buildDescription(product),
    indications: buildIndications(product),
    usageInstructions: buildUsage(product),
    contraindications: buildContraindications(),
    presentation: presentationOf(product),
    sku: cleanText(product.ean) || `ARU-${product.sourceReference || product.sourceProductId}`,
    priceCents: Math.round(Number(product.price) * 100),
    compareAtCents: Number(product.listPrice) > Number(product.price)
      ? Math.round(Number(product.listPrice) * 100)
      : null,
    sourceImageUrls: images,
    localImages: [],
    tagSlugs: buildTagSlugs(product),
    sourceFacts: {
      benefit: list(product.specifications, 'BENEFICIO'),
      need: list(product.specifications, 'NECESIDAD'),
      hairType: list(product.specifications, 'TIPO DE CABELLO'),
      frequency: frequencyOf(product),
      seals: list(product.specifications, 'SELLOS'),
      ingredients: list(product.specifications, 'INGREDIENTES'),
    },
  }
}

async function mapLimit(items, concurrency, fn) {
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      await fn(items[index], index)
    }
  })
  await Promise.all(workers)
}

async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function prepare() {
  const source = JSON.parse(await readFile(SOURCE_PATH, 'utf8'))
  const products = source
    .filter((product) => product.availableQuantity > 0 && !product.isKit)
    .filter((product) => /shampoo|champu/i.test(product.name) || /shampoo|champu/i.test(list(product.specifications, 'TIPO DE PRODUCTO').join(' ')))
    .map(normalizeProduct)

  await mkdir(OUTPUT_DIR, { recursive: true })
  let completed = 0
  await mapLimit(products.slice(0, LIMIT), CONCURRENCY, async (product) => {
    const imageDir = join(OUTPUT_DIR, 'images', product.slug)
    await mkdir(imageDir, { recursive: true })
    for (let index = 0; index < product.sourceImageUrls.length; index++) {
      const destination = join(imageDir, `${String(index + 1).padStart(2, '0')}.webp`)
      if (!(await fileExists(destination))) {
        const response = await fetch(product.sourceImageUrls[index])
        if (!response.ok) throw new Error(`Imagen ${response.status}: ${product.sourceImageUrls[index]}`)
        const sourceBuffer = Buffer.from(await response.arrayBuffer())
        await sharp(sourceBuffer)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90, effort: 4 })
          .toFile(destination)
      }
      product.localImages.push(destination)
    }
    completed++
    if (completed % 10 === 0 || completed === products.length) {
      console.log(`Preparados ${completed}/${Math.min(products.length, LIMIT)}`)
    }
  })

  const selected = products.slice(0, LIMIT)
  await writeFile(MANIFEST_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceCategoryUrl: 'https://www.aruma.pe/cuidado-del-cabello/limpieza-y-tratamiento/shampoo',
    status: 'draft-ready',
    products: selected,
  }, null, 2))
  console.log(JSON.stringify({ manifest: MANIFEST_PATH, products: selected.length, images: selected.reduce((sum, product) => sum + product.localImages.length, 0) }, null, 2))
}

async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function ensureCategory(admin) {
  const { data: existing, error } = await admin.from('categories').select('id').eq('slug', 'cabello').maybeSingle()
  if (error) throw error
  if (existing) return existing.id
  const { data, error: insertError } = await admin.from('categories').insert({
    name: 'Cabello',
    slug: 'cabello',
    parent_id: null,
    sort_order: 9,
  }).select('id').single()
  if (insertError) throw insertError
  return data.id
}

async function applyDrafts() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const products = manifest.products.slice(0, LIMIT)
  const admin = await getAdminClient()
  const categoryId = await ensureCategory(admin)
  const { data: tagRows, error: tagError } = await admin.from('tags').select('id,slug')
  if (tagError) throw tagError
  const tagBySlug = new Map(tagRows.map((tag) => [tag.slug, tag.id]))
  const { data: existingRows, error: existingError } = await admin.from('products').select('slug')
  if (existingError) throw existingError
  const existing = new Set(existingRows.map((product) => product.slug))

  let inserted = 0
  let skipped = 0
  let errors = 0
  for (const product of products) {
    if (existing.has(product.slug)) {
      skipped++
      continue
    }
    try {
      const publicUrls = []
      for (let index = 0; index < Math.min(5, product.localImages.length); index++) {
        const storagePath = `products/${product.slug}/${index === 0 ? 'cover' : `gallery-${index}`}.webp`
        const imageBuffer = await readFile(product.localImages[index])
        const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, imageBuffer, {
          upsert: true,
          contentType: 'image/webp',
          cacheControl: '31536000',
        })
        if (uploadError) throw uploadError
        const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(storagePath)
        publicUrls.push(publicData.publicUrl)
      }

      const { data: productRow, error: productError } = await admin.from('products').insert({
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand || null,
        category_id: categoryId,
        cover_image_url: publicUrls[0] || null,
        gallery_urls: publicUrls.slice(1, 5),
        usage_instructions: product.usageInstructions,
        indications: product.indications,
        contraindications: product.contraindications,
        is_active: false,
      }).select('id').single()
      if (productError) throw productError

      const { data: variantRow, error: variantError } = await admin.from('product_variants').insert({
        product_id: productRow.id,
        sku: product.sku,
        name: product.presentation,
        is_active: true,
        stock_quantity: 0,
      }).select('id').single()
      if (variantError) throw variantError

      const { error: priceError } = await admin.from('product_prices').insert({
        variant_id: variantRow.id,
        currency: 'PEN',
        amount_cents: product.priceCents,
        compare_at_cents: product.compareAtCents,
        effective_from: new Date().toISOString(),
        effective_to: null,
      })
      if (priceError) throw priceError

      const tagIds = product.tagSlugs.map((slug) => tagBySlug.get(slug)).filter(Boolean)
      if (tagIds.length) {
        const { error: productTagError } = await admin.from('product_tags').insert(
          tagIds.map((tagId) => ({ product_id: productRow.id, tag_id: tagId })),
        )
        if (productTagError) throw productTagError
      }
      existing.add(product.slug)
      inserted++
      console.log(`Borrador ${inserted}/${products.length}: ${product.name}`)
    } catch (error) {
      errors++
      console.error(`ERROR ${product.name}: ${error.message}`)
    }
  }
  console.log(JSON.stringify({ products: products.length, inserted, skipped, errors, active: false, stockQuantity: 0 }, null, 2))
  if (errors) process.exitCode = 1
}

async function dryRun() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const products = manifest.products.slice(0, LIMIT)
  const invalid = products.filter((product) => !product.name || !product.brand || !product.presentation || !product.priceCents || !product.localImages.length)
  console.log(JSON.stringify({
    mode: 'dry-run',
    products: products.length,
    images: products.reduce((sum, product) => sum + product.localImages.length, 0),
    uploadImages: products.reduce((sum, product) => sum + Math.min(5, product.localImages.length), 0),
    invalid: invalid.map((product) => product.name),
    minPrice: Math.min(...products.map((product) => product.priceCents)) / 100,
    maxPrice: Math.max(...products.map((product) => product.priceCents)) / 100,
  }, null, 2))
  if (invalid.length) process.exitCode = 1
}

if (MODE === 'prepare') await prepare()
else if (MODE === 'apply-drafts') await applyDrafts()
else await dryRun()
