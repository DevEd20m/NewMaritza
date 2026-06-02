/**
 * migrate-images.mjs
 * Descarga imágenes de organa CDN → sube a Supabase Storage → actualiza DB
 *
 * Uso: node scripts/migrate-images.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL    = 'https://skcfrccoexscaiayzjzd.supabase.co'
const SERVICE_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2ZyY2NvZXhzY2FpYXl6anpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwNTQzNSwiZXhwIjoyMDk0NjgxNDM1fQ.ICG7QSsCtewwm9QvfeLdTfaMuJFs7H-sPSt5AQg5n_E'
const BUCKET          = 'product-images'
const PUBLIC_BASE     = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── helpers ──────────────────────────────────────────────────────────────────

function extFromContentType(ct) {
  if (!ct) return 'jpg'
  if (ct.includes('png'))  return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif'))  return 'gif'
  return 'jpg'
}

async function downloadImage(url) {
  const encoded = url.replace(/ /g, '%20')      // spaces in filenames
  const res = await fetch(encoded, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LIORA-migration/1.0)' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const ct  = res.headers.get('content-type') ?? ''
  const buf = await res.arrayBuffer()
  return { buffer: Buffer.from(buf), contentType: ct.split(';')[0].trim() || 'image/jpeg', ext: extFromContentType(ct) }
}

async function uploadToStorage(path, buffer, contentType) {
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000',   // 1 year
    })
  if (error) throw new Error(`Upload failed for ${path}: ${error.message}`)
  return `${PUBLIC_BASE}/${path}`
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── step 1: create bucket if it doesn't exist ───────────────────────────────

async function ensureBucket() {
  const { data: buckets } = await sb.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Cannot create bucket: ${error.message}`)
    console.log(`✓ Bucket "${BUCKET}" creado (público)`)
  } else {
    console.log(`✓ Bucket "${BUCKET}" ya existe`)
  }
}

// ─── step 2: migrate product images ──────────────────────────────────────────

async function migrateProducts() {
  const { data: allProducts, error } = await sb
    .from('products')
    .select('id, slug, cover_image_url, gallery_urls')
    .order('id')

  const products = (allProducts ?? []).filter(p => p.id.startsWith('da'))

  if (error) throw error
  console.log(`\n→ Migrando imágenes de ${products.length} productos...\n`)

  for (const product of products) {
    try {
      // ── cover image ──────────────────────────────────────────────────────
      const { buffer, contentType, ext } = await downloadImage(product.cover_image_url)
      const coverPath = `products/${product.slug}/cover.${ext}`
      const newCoverUrl = await uploadToStorage(coverPath, buffer, contentType)

      // ── gallery images ───────────────────────────────────────────────────
      const newGallery = []
      for (let i = 0; i < (product.gallery_urls ?? []).length; i++) {
        const galUrl = product.gallery_urls[i]

        // si es la misma que la cover, reusar ya subida
        if (galUrl === product.cover_image_url) {
          newGallery.push(newCoverUrl)
          continue
        }

        try {
          const { buffer: gb, contentType: gct, ext: ge } = await downloadImage(galUrl)
          const galPath = `products/${product.slug}/gallery-${i + 1}.${ge}`
          const newGalUrl = await uploadToStorage(galPath, gb, gct)
          newGallery.push(newGalUrl)
        } catch (galErr) {
          console.warn(`  ⚠ gallery[${i}] falló: ${galErr.message} — usando original`)
          newGallery.push(galUrl)
        }
      }

      // ── update DB ────────────────────────────────────────────────────────
      const { error: upErr } = await sb
        .from('products')
        .update({ cover_image_url: newCoverUrl, gallery_urls: newGallery, updated_at: new Date().toISOString() })
        .eq('id', product.id)

      if (upErr) throw upErr

      console.log(`  ✓ ${product.slug}`)
      await sleep(150)   // respetar rate-limit del CDN externo

    } catch (err) {
      console.error(`  ✗ ${product.slug}: ${err.message}`)
    }
  }
}

// ─── step 3: migrate kit cover images ────────────────────────────────────────

async function migrateKits() {
  const { data: allKits, error } = await sb
    .from('kits')
    .select('id, slug, cover_image_url')
    .order('id')

  const kits = (allKits ?? []).filter(k => k.id.startsWith('dc'))

  if (error) throw error
  console.log(`\n→ Migrando portadas de ${kits.length} kits...\n`)

  for (const kit of kits) {
    if (!kit.cover_image_url) continue
    try {
      const { buffer, contentType, ext } = await downloadImage(kit.cover_image_url)
      const coverPath = `kits/${kit.slug}/cover.${ext}`
      const newUrl = await uploadToStorage(coverPath, buffer, contentType)

      const { error: upErr } = await sb
        .from('kits')
        .update({ cover_image_url: newUrl })
        .eq('id', kit.id)

      if (upErr) throw upErr

      console.log(`  ✓ ${kit.slug}`)
      await sleep(150)

    } catch (err) {
      console.error(`  ✗ ${kit.slug}: ${err.message}`)
    }
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  LIORA — Migración de imágenes → Supabase Storage')
  console.log('═══════════════════════════════════════════════\n')

  await ensureBucket()
  await migrateProducts()
  await migrateKits()

  console.log('\n✅  Migración completada.')
  console.log(`   Todas las imágenes ahora en: ${PUBLIC_BASE}/`)
}

main().catch(err => { console.error('\n💥 Error fatal:', err); process.exit(1) })
