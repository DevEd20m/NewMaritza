import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const ROOT = resolve(import.meta.dirname, '..')
const IMPORT_DIR = join(ROOT, 'imports', 'aruma-shampoo-2026-08-20')
const MANIFEST_PATH = join(IMPORT_DIR, 'manifest.json')
const SELECTION_PATH = join(IMPORT_DIR, 'curated-selection.json')
const SHOULD_APPLY = process.argv.includes('--apply')

dotenv.config({ path: join(ROOT, '.env.local'), quiet: true })

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function buildDescription(product, selection) {
  return `${selection.displayName || product.name} de ${product.brand} es un shampoo enfocado en ${selection.benefit}. Forma parte de la selección curada de Cabello de LIORA por su demanda, posicionamiento de mercado y utilidad dentro de una rutina capilar específica.`
}

function buildIndications(selection) {
  return `Indicado para ${selection.audience}.`
}

function buildUsage(selection) {
  if (selection.dryShampoo) {
    return 'Agitar antes de usar. Aplicar sobre el cabello seco a una distancia de 20 a 25 cm, concentrándose en las raíces. Dejar actuar unos minutos, masajear con los dedos y cepillar. No usar agua ni aplicar sobre piel irritada.'
  }
  if (/4p-blonde-enhancer/.test(selection.slug)) {
    return 'Aplicar sobre el cabello mojado, masajear hasta formar espuma y dejar actuar de 1 a 3 minutos según el nivel de matización deseado. Enjuagar completamente. Alternar con un shampoo no matizante y usar guantes si se desea evitar pigmentación temporal en las manos.'
  }
  return 'Humedecer completamente el cabello. Aplicar una pequeña cantidad sobre el cuero cabelludo, masajear suavemente hasta formar espuma y distribuir hacia los largos. Enjuagar con abundante agua. Repetir solo si es necesario y seguir con acondicionador.'
}

function buildContraindications(selection) {
  const specialized = /anticaida|anticaspa|anti-dandruff|nutradeica|lambdapil/.test(selection.slug)
  return `Uso externo. Evitar el contacto con los ojos; si ocurre, enjuagar con abundante agua. Suspender el uso ante irritación persistente y revisar los ingredientes si existe sensibilidad conocida.${specialized ? ' Si la caída, picazón o descamación es intensa o persistente, consultar con un profesional de salud.' : ''} Mantener fuera del alcance de los niños.`
}

async function loadData() {
  const [manifest, selection] = await Promise.all([
    readFile(MANIFEST_PATH, 'utf8').then(JSON.parse),
    readFile(SELECTION_PATH, 'utf8').then(JSON.parse),
  ])
  const manifestBySlug = new Map(manifest.products.map((product) => [product.slug, product]))
  const duplicates = selection.products.filter((item, index, items) => items.findIndex((candidate) => candidate.slug === item.slug) !== index)
  if (duplicates.length) throw new Error(`Slugs duplicados: ${duplicates.map((item) => item.slug).join(', ')}`)
  const missing = selection.products.filter((item) => !manifestBySlug.has(item.slug))
  if (missing.length) throw new Error(`No están en el manifiesto: ${missing.map((item) => item.slug).join(', ')}`)
  return { manifestBySlug, selection: selection.products }
}

async function fetchDatabaseState(admin, slugs) {
  const { data: category, error: categoryError } = await admin.from('categories').select('id,name,slug').eq('slug', 'cabello').single()
  if (categoryError) throw categoryError

  const { data: products, error: productError } = await admin
    .from('products')
    .select('id,name,slug,brand,category_id,description,cover_image_url,gallery_urls,usage_instructions,indications,contraindications,is_active')
    .in('slug', slugs)
  if (productError) throw productError

  const productIds = products.map((product) => product.id)
  const { data: variants, error: variantError } = await admin
    .from('product_variants')
    .select('id,product_id,sku,name,is_active,stock_quantity')
    .in('product_id', productIds)
  if (variantError) throw variantError

  const variantIds = variants.map((variant) => variant.id)
  const { data: prices, error: priceError } = await admin
    .from('product_prices')
    .select('id,variant_id,currency,amount_cents,compare_at_cents,effective_to')
    .in('variant_id', variantIds)
    .is('effective_to', null)
  if (priceError) throw priceError

  const { data: productTags, error: tagError } = await admin
    .from('product_tags')
    .select('product_id,tag_id')
    .in('product_id', productIds)
  if (tagError) throw tagError

  return { category, products, variants, prices, productTags }
}

function audit({ manifestBySlug, selection, state }) {
  const productBySlug = new Map(state.products.map((product) => [product.slug, product]))
  const variantByProduct = new Map(state.variants.map((variant) => [variant.product_id, variant]))
  const priceByVariant = new Map(state.prices.map((price) => [price.variant_id, price]))
  const tagCounts = new Map()
  for (const link of state.productTags) tagCounts.set(link.product_id, (tagCounts.get(link.product_id) || 0) + 1)

  const errors = []
  for (const item of selection) {
    const manifestProduct = manifestBySlug.get(item.slug)
    const product = productBySlug.get(item.slug)
    if (!product) {
      errors.push(`${item.slug}: producto ausente en Supabase`)
      continue
    }
    const variant = variantByProduct.get(product.id)
    const price = variant && priceByVariant.get(variant.id)
    const required = {
      nombre: product.name,
      marca: product.brand,
      categoria: product.category_id === state.category.id,
      descripcion: product.description,
      portada: product.cover_image_url,
      galeria: Array.isArray(product.gallery_urls),
      indicadoPara: product.indications,
      modoUso: product.usage_instructions,
      contraindicaciones: product.contraindications,
      presentacion: variant?.name,
      sku: variant?.sku,
      precio: price?.amount_cents === manifestProduct.priceCents,
      moneda: price?.currency === 'PEN',
      tags: (tagCounts.get(product.id) || 0) > 0,
    }
    const missing = Object.entries(required).filter(([, value]) => !value).map(([field]) => field)
    if (missing.length) errors.push(`${item.slug}: ${missing.join(', ')}`)
  }
  return errors
}

async function applySelection(admin, { manifestBySlug, selection }, state) {
  const productBySlug = new Map(state.products.map((product) => [product.slug, product]))
  const variantByProduct = new Map(state.variants.map((variant) => [variant.product_id, variant]))

  for (const item of selection) {
    const manifestProduct = manifestBySlug.get(item.slug)
    const product = productBySlug.get(item.slug)
    const variant = variantByProduct.get(product.id)
    const { error: productError } = await admin.from('products').update({
      name: item.displayName || manifestProduct.name,
      description: buildDescription(manifestProduct, item),
      indications: buildIndications(item),
      usage_instructions: buildUsage(item),
      contraindications: buildContraindications(item),
      is_active: true,
    }).eq('id', product.id)
    if (productError) throw productError

    const { error: variantError } = await admin.from('product_variants').update({
      name: item.presentation || manifestProduct.presentation,
      stock_quantity: null,
      is_active: true,
    }).eq('id', variant.id)
    if (variantError) throw variantError
  }
}

const data = await loadData()
const admin = getAdminClient()
let state = await fetchDatabaseState(admin, data.selection.map((item) => item.slug))
const beforeErrors = audit({ ...data, state })

if (!SHOULD_APPLY) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    category: state.category,
    selected: data.selection.length,
    present: state.products.length,
    priceRange: [
      Math.min(...data.selection.map((item) => data.manifestBySlug.get(item.slug).priceCents)) / 100,
      Math.max(...data.selection.map((item) => data.manifestBySlug.get(item.slug).priceCents)) / 100,
    ],
    auditErrors: beforeErrors,
  }, null, 2))
  if (beforeErrors.length) process.exitCode = 1
} else {
  if (beforeErrors.length) throw new Error(`Auditoría previa falló:\n${beforeErrors.join('\n')}`)
  await applySelection(admin, data, state)
  state = await fetchDatabaseState(admin, data.selection.map((item) => item.slug))
  const afterErrors = audit({ ...data, state })
  const activeCount = state.products.filter((product) => product.is_active).length
  const unlimitedCount = state.variants.filter((variant) => variant.stock_quantity === null).length
  console.log(JSON.stringify({
    mode: 'applied',
    category: state.category,
    selected: data.selection.length,
    active: activeCount,
    unlimitedStock: unlimitedCount,
    exactPrices: state.prices.filter((price) => {
      const variant = state.variants.find((candidate) => candidate.id === price.variant_id)
      const product = state.products.find((candidate) => candidate.id === variant?.product_id)
      return product && price.amount_cents === data.manifestBySlug.get(product.slug).priceCents
    }).length,
    auditErrors: afterErrors,
  }, null, 2))
  if (afterErrors.length || activeCount !== data.selection.length || unlimitedCount !== data.selection.length) process.exitCode = 1
}
