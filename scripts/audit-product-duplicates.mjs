import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const ROOT = resolve(import.meta.dirname, '..')
const ENV_PATH = process.env.AUDIT_ENV_PATH || '/tmp/liora-production.env'
const SELECTION_PATH = join(ROOT, 'imports', 'aruma-shampoo-2026-08-20', 'curated-selection.json')

dotenv.config({ path: ENV_PATH, quiet: true })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Faltan credenciales de lectura de Supabase')

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const selection = JSON.parse(await readFile(SELECTION_PATH, 'utf8')).products
const selectedSlugs = new Set(selection.map((product) => product.slug))

const bodyCandidates = [
  ['Gel De Ducha Dr Teals Vit C', "DR TEAL'S"],
  ['Loción Corporal Lavanda Relajante 532ml Dr Teals', "DR TEAL'S"],
  ['Body wash Vainilla Daise Beauty', 'DAISE BEAUTY'],
  ["Exfoliante Lavanda 454gr Dr Teal's", "DR TEAL'S"],
  ["Sal de Baño Lavanda Relajante 450gr Dr Teal's", "DR TEAL'S"],
  ['Crema Corporal Vitamina C Babaria', 'BABARIA'],
  ['Crema de Manos Scent Of The Day So Fresh 30 ml Tony Moly', 'TONY MOLY'],
  ['Crema Pies Secos y Agrietados 150ml Babaria', 'BABARIA'],
  ['Bálsamo Reparador Cicaplast Balm B5 La Roche Posay 40 ml', 'LA ROCHE POSAY'],
  ['TREE HUT Exfoliante Watermelon 510g', 'TREE HUT'],
  ['Crema Corporal Hydroboost Body x 400 ml Neutrogena', 'NEUTROGENA'],
  ['Exfoliante Piña Daise Beauty', 'DAISE BEAUTY'],
  ['Manteca Corporal Coco Colada 240 g Tree Hut', 'TREE HUT'],
  ['Aceite Corporal Beauty Creations x Barbie Gotta Glow Body Oil', 'BEAUTY CREATIONS'],
  ['Crema Corporal NIVEA Milk Nutritiva (Piel Extra Seca) - Frasco 400ml', 'NIVEA'],
  ['ISDIN Woman Reafirmante 200 ml', 'ISDIN'],
  ['EUCERIN Antipigment Crema Corporal 200ml', 'EUCERIN'],
  ['Crema Hidratante Bioderma Atoderm Creme Ultra 500ml', 'BIODERMA'],
  ['Jabon Bioderma Atoderm Huile De Douche Fp1L', 'BIODERMA'],
  ['ISDIN Acniben Body 150 ml', 'ISDIN'],
  ['Limpiador Lipkar Syndet AP para Piel Seca 400ml La Roche Posay', 'LA ROCHE POSAY'],
  ['Loción Hidratante Ureadin Ultra10 Plus Reparadora 200ml Isdin', 'ISDIN'],
  ['Crema Hidratante 453gr Cetaphil', 'CETAPHIL'],
  ['Eucerin Ungüento Reparador Aquaphor 55ml', 'EUCERIN'],
].map(([name, brand]) => ({ name, brand }))

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function groupDuplicates(rows, keyFor) {
  const groups = new Map()
  for (const row of rows) {
    const key = keyFor(row)
    if (!key) continue
    const values = groups.get(key) || []
    values.push(row)
    groups.set(key, values)
  }
  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([key, values]) => ({ key, values }))
}

function tokenSimilarity(left, right) {
  const leftTokens = new Set(normalize(left).split(' ').filter(Boolean))
  const rightTokens = new Set(normalize(right).split(' ').filter(Boolean))
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size
  return union ? intersection / union : 0
}

const [{ data: categories, error: categoryError }, { data: products, error: productError }] = await Promise.all([
  admin.from('categories').select('id,name,slug').range(0, 999),
  admin.from('products').select('id,name,slug,brand,category_id,is_active,created_at').range(0, 999),
])
if (categoryError) throw categoryError
if (productError) throw productError

const productIds = products.map((product) => product.id)
const { data: variants, error: variantError } = await admin
  .from('product_variants')
  .select('id,product_id,sku,name,is_active,stock_quantity')
  .in('product_id', productIds)
  .range(0, 1999)
if (variantError) throw variantError

const productById = new Map(products.map((product) => [product.id, product]))
const selectedProducts = products.filter((product) => selectedSlugs.has(product.slug))
const selectedProductIds = new Set(selectedProducts.map((product) => product.id))
const selectedVariants = variants.filter((variant) => selectedProductIds.has(variant.product_id))

const skuGroups = groupDuplicates(variants, (variant) => normalize(variant.sku))
const crossImportSkuDuplicates = skuGroups.filter((group) => {
  const ids = new Set(group.values.map((variant) => variant.product_id))
  return group.values.some((variant) => selectedProductIds.has(variant.product_id)) &&
    [...ids].some((id) => !selectedProductIds.has(id))
})

const nameGroups = groupDuplicates(products, (product) => `${normalize(product.brand)}|${normalize(product.name)}`)
const crossImportNameDuplicates = nameGroups.filter((group) =>
  group.values.some((product) => selectedProductIds.has(product.id)) &&
  group.values.some((product) => !selectedProductIds.has(product.id)),
)

function describeSkuGroup(group) {
  return {
    sku: group.values[0].sku,
    products: group.values.map((variant) => {
      const product = productById.get(variant.product_id)
      return {
        name: product?.name,
        slug: product?.slug,
        importedSelection: selectedProductIds.has(variant.product_id),
        active: Boolean(product?.is_active && variant.is_active),
      }
    }),
  }
}

const hairCategory = categories.find((category) => category.slug === 'cabello')
const bodyCategories = categories.filter((category) => /corporal|spa|cuerpo/i.test(`${category.name} ${category.slug}`))
const selectedMissing = selection.filter((item) => !selectedProducts.some((product) => product.slug === item.slug))
const bodyCategoryIds = new Set(bodyCategories.map((category) => category.id))
const previousBodyProducts = products.filter((product) => bodyCategoryIds.has(product.category_id))
const relevantPremiumBrands = new Set(['bioderma', 'eucerin', 'isdin', 'la roche posay', 'frezyderm', 'cetaphil'])
const previousRelevantPremiumProducts = products.filter((product) => relevantPremiumBrands.has(normalize(product.brand)))
const bodyCandidateMatches = bodyCandidates.flatMap((candidate) => products
  .filter((product) => normalize(product.brand) === normalize(candidate.brand))
  .map((product) => ({ candidate, product, similarity: tokenSimilarity(candidate.name, product.name) }))
  .filter((match) => match.similarity >= 0.55 ||
    normalize(match.candidate.name).includes(normalize(match.product.name)) ||
    normalize(match.product.name).includes(normalize(match.candidate.name))))

console.log(JSON.stringify({
  source: ENV_PATH,
  catalog: {
    products: products.length,
    activeProducts: products.filter((product) => product.is_active).length,
    variants: variants.length,
  },
  hairImport: {
    expected: selection.length,
    present: selectedProducts.length,
    activeProducts: selectedProducts.filter((product) => product.is_active).length,
    activeUnlimitedVariants: selectedVariants.filter((variant) => variant.is_active && variant.stock_quantity === null).length,
    category: hairCategory || null,
    missingSlugs: selectedMissing.map((product) => product.slug),
  },
  duplicateAudit: {
    sameSkuBetweenImportedAndPrevious: crossImportSkuDuplicates.map(describeSkuGroup),
    sameNormalizedNameAndBrandBetweenImportedAndPrevious: crossImportNameDuplicates.map((group) => ({
      key: group.key,
      products: group.values.map((product) => ({
        name: product.name,
        slug: product.slug,
        importedSelection: selectedProductIds.has(product.id),
        active: product.is_active,
      })),
    })),
    duplicateSlugsInDatabase: groupDuplicates(products, (product) => product.slug).map((group) => group.key),
  },
  bodyCategoryCandidatesAlreadyPresent: bodyCategories,
  previousBodyProducts: previousBodyProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    slug: product.slug,
    active: product.is_active,
  })),
  previousRelevantPremiumProducts: previousRelevantPremiumProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    slug: product.slug,
    active: product.is_active,
  })),
  proposedBodyCandidateMatches: bodyCandidateMatches.map((match) => ({
    candidate: match.candidate,
    existing: {
      name: match.product.name,
      brand: match.product.brand,
      slug: match.product.slug,
      active: match.product.is_active,
    },
    similarity: Number(match.similarity.toFixed(2)),
  })),
}, null, 2))
