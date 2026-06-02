/**
 * Remueve el fondo de todas las imágenes de productos usando remove.bg API
 * y las re-sube a Supabase Storage como PNG con fondo transparente.
 *
 * Uso:
 *   REMOVE_BG_KEY=tu_api_key node scripts/remove-backgrounds.mjs
 *
 * API gratuita: 50 imágenes/mes en https://www.remove.bg/api
 * Tenemos 40 productos → entra perfectamente en el plan free.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ─── Config ────────────────────────────────────────────────────────────────

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const REMOVE_BG_KEY    = process.env.REMOVE_BG_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE) {
  console.error('❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  console.error('   Corre: source .env.local && node scripts/remove-backgrounds.mjs')
  process.exit(1)
}
if (!REMOVE_BG_KEY) {
  console.error('❌  Falta REMOVE_BG_KEY')
  console.error('   Obtén tu API key gratis en https://www.remove.bg/api')
  console.error('   Luego: REMOVE_BG_KEY=tu_key node scripts/remove-backgrounds.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
const BUCKET   = 'product-images'
const DELAY_MS = 1200   // remove.bg free tier: ~50 req/min

// ─── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function removeBg(imageUrl) {
  const form = new FormData()
  form.append('image_url', imageUrl)
  form.append('size', 'auto')
  form.append('format', 'png')  // siempre PNG para transparencia

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': REMOVE_BG_KEY },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`remove.bg ${res.status}: ${err}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

// ─── Main ──────────────────────────────────────────────────────────────────

const { data: products, error } = await supabase
  .from('products')
  .select('id, name, slug, cover_image_url')
  .not('cover_image_url', 'is', null)
  .order('id')

if (error) { console.error('❌  Error al leer productos:', error.message); process.exit(1) }

const targets = products.filter(p => p.cover_image_url.includes('supabase'))
console.log(`\n🖼  Procesando ${targets.length} imágenes...\n`)

let ok = 0, fail = 0

for (const product of targets) {
  const storagePath = `products/${product.slug}/cover.png`
  process.stdout.write(`  ${product.name.slice(0, 50).padEnd(50)} … `)

  try {
    // 1. Remover fondo
    const pngBuffer = await removeBg(product.cover_image_url)

    // 2. Subir el PNG sin fondo a Supabase Storage (reemplaza el anterior)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, pngBuffer, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000',
      })

    if (uploadError) throw uploadError

    // 3. Obtener la URL pública nueva (siempre .png ahora)
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    // 4. Actualizar cover_image_url en la DB si cambió extensión (ej: .jpg → .png)
    if (product.cover_image_url !== publicUrl) {
      await supabase
        .from('products')
        .update({ cover_image_url: publicUrl })
        .eq('id', product.id)
    }

    console.log('✓')
    ok++
  } catch (err) {
    console.log(`✗  ${err.message}`)
    fail++
  }

  await sleep(DELAY_MS)
}

console.log(`\n✅  Completado: ${ok} OK, ${fail} errores`)
if (fail > 0) console.log('   Los errores se pueden reintentar corriendo el script de nuevo.')
