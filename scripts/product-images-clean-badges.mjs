/**
 * FASE 2 — Eliminación de sellos, insignias y franjas promocionales.
 *
 * Trabaja solo sobre las portadas que la fase 1 marcó, y separa dos casos:
 *
 *   a) El elemento promocional es un bloque SUELTO, al lado del producto
 *      (la franja del retailer, un sello flotante). Tras el recorte queda como
 *      una componente conexa aparte. La visión señala cuáles de las componentes
 *      son producto y cuáles adorno, y se borran las de adorno poniendo su alfa
 *      a cero. Determinista: no se inventa ni un píxel del envase.
 *
 *   b) El elemento está SUPERPUESTO sobre el propio envase. No hay forma de
 *      separarlo por geometría; requiere retoque generativo. Estos casos se
 *      dejan listados para tratarlos aparte, no se tocan aquí.
 *
 * Escribe los resultados del caso (a) en .image-cache/cleaned/<id>.png, que es
 * de donde los toma la fase 3.
 *
 * Uso:
 *   node --env-file=.env.local scripts/product-images-clean-badges.mjs [--limit N] [--force]
 */

import OpenAI from 'openai'
import { readFile, writeFile, copyFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import {
  ROOT,
  loadManifest,
  saveManifest,
  assertRembgInstalled,
  removeBackgroundBatch,
  hardenAlpha,
  listComponents,
  applyComponentMask,
  annotateComponents,
  ensureDir,
  sleep,
} from './lib/product-images.mjs'

const args = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity
const FORCE = args.includes('--force')
// --all revisa TODAS las portadas, no solo las que marcó la fase 1. La detección
// por visión se le pasa por alto algún banner, pero la geometría no miente: si
// tras el recorte quedan dos bloques separados, hay algo que decidir.
const ALL = args.includes('--all')

const CACHE = path.join(ROOT, '.image-cache')
const BADGE_IN = path.join(CACHE, 'badge-in')
const BADGE_CUT = path.join(CACHE, 'badge-cut')
const ANNOT_DIR = path.join(CACHE, 'badge-annot')
const CLEANED_DIR = path.join(CACHE, 'cleaned')

const VISION_MODEL = 'gpt-4o'

const SELECT_PROMPT = (n, elements) => `Esta imagen es un recorte con fondo blanco donde he marcado con recuadros rosados y numerados del 1 al ${n} los bloques separados que quedaron tras eliminar el fondo.
${elements.length ? `\nUn revisor detectó antes en esta foto: ${elements.join('; ')}.\n` : ''}
Dime qué números corresponden al PRODUCTO REAL (el envase, frasco, caja, tubo o sus partes legítimas: tapa, aplicador, la caja junto al tubo) y qué números son ADORNO DEL RETAILER que hay que borrar (franjas promocionales, sellos, insignias, precios, logos de tienda, banners de color con texto).

Criterios:
- Si el número encierra parte del envase o de su etiqueta, es producto.
- Si el número encierra una franja o rectángulo de color plano con texto publicitario, es adorno.
- Un envase puede estar partido en varios números por reflejos: todos esos son producto.
- Ante la duda, clasifícalo como producto. Borrar parte del envase es mucho peor que dejar un sello.

Responde SOLO con este JSON:
{"product": [1,2], "decoration": [3], "reasoning": "una frase"}`

// ─── Main ──────────────────────────────────────────────────────────────────

if (!process.env.OPENAI_API_KEY) {
  console.error('❌  Falta OPENAI_API_KEY. Corre con: node --env-file=.env.local ...')
  process.exit(1)
}

assertRembgInstalled()
await Promise.all([ensureDir(ANNOT_DIR), ensureDir(CLEANED_DIR), ensureDir(BADGE_CUT)])

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const manifest = await loadManifest()

const flagged = Object.values(manifest.items)
  .filter((i) => (ALL || i.detection?.needsCleanup) && i.storageDir && i.cachePath)
  .filter((i) => FORCE || !i.badgeCleanup)
  .slice(0, LIMIT === Infinity ? undefined : LIMIT)

console.log(`\n🧽  Fase 2 — limpieza de sellos e insignias`)
console.log(`    ${flagged.length} portadas a revisar${ALL ? ' (todas)' : ' (marcadas por la fase 1)'}\n`)

if (flagged.length === 0) {
  console.log('✅  Nada pendiente.\n')
  process.exit(0)
}

// 1. Recortar el fondo de todas de una pasada.
await rm(BADGE_IN, { recursive: true, force: true })
await ensureDir(BADGE_IN)

const staged = []
for (const item of flagged) {
  const src = path.join(ROOT, item.cachePath)
  if (!existsSync(src)) continue
  await copyFile(src, path.join(BADGE_IN, `${item.id}${path.extname(src)}`))
  staged.push(item)
}

console.log(`✂️   Recortando ${staged.length} imágenes...`)
await removeBackgroundBatch(BADGE_IN, BADGE_CUT)

// 2. Analizar componentes y decidir.
console.log('')
let cleaned = 0, kept = 0, errors = 0
const needsGenerative = []

for (const item of staged) {
  const label = item.name.slice(0, 42).padEnd(42)
  process.stdout.write(`  ${label} … `)

  try {
    const cutPath = path.join(BADGE_CUT, `${item.id}.png`)
    if (!existsSync(cutPath)) throw new Error('rembg no generó salida')
    // Sanear antes de analizar: los restos tenues del sello unen componentes
    // que en realidad están separadas.
    const cutout = await hardenAlpha(await readFile(cutPath))

    const analysis = await listComponents(cutout)
    // Ignorar motas: componentes por debajo del 1% del área total.
    const significant = analysis.components.filter((c) => c.areaFraction >= 0.01)

    if (significant.length < 2) {
      if (item.detection?.needsCleanup) {
        // La fase 1 vio un sello y no hay dos bloques que separar: está encima
        // del envase y solo se puede quitar con retoque generativo.
        item.badgeCleanup = { method: 'needs-generative', components: significant.length }
        needsGenerative.push(item)
        console.log('◻  superpuesto → requiere retoque generativo')
      } else {
        item.badgeCleanup = { method: 'single-component' }
        console.log('✓ una sola pieza, nada que separar')
      }
      continue
    }

    const annotated = await annotateComponents(cutout, {
      ...analysis,
      components: significant,
    })
    await writeFile(path.join(ANNOT_DIR, `${item.id}.png`), annotated)

    const resp = await ai.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: SELECT_PROMPT(significant.length, item.detection.elements) },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${annotated.toString('base64')}`, detail: 'high' },
          },
        ],
      }],
    })

    const verdict = JSON.parse(resp.choices[0].message.content)
    const decoIdx = Array.isArray(verdict.decoration) ? verdict.decoration : []
    const keepLabels = significant
      .filter((_, i) => !decoIdx.includes(i + 1))
      .map((c) => c.label)

    if (decoIdx.length === 0) {
      kept++
      item.badgeCleanup = { method: 'none', reasoning: verdict.reasoning }
      console.log('✓ todo es producto, sin cambios')
      continue
    }
    if (keepLabels.length === 0) {
      throw new Error('la visión marcó todo como adorno, se descarta')
    }

    // Salvaguarda: nunca borrar la componente más grande.
    if (!keepLabels.includes(significant[0].label)) {
      throw new Error('la visión quiso borrar la componente principal, se descarta')
    }

    const masked = await applyComponentMask(cutout, analysis, keepLabels)
    await writeFile(path.join(CLEANED_DIR, `${item.id}.png`), masked)

    item.badgeCleanup = {
      method: 'component-mask',
      removed: decoIdx.length,
      reasoning: verdict.reasoning,
    }
    cleaned++
    console.log(`✓ ${decoIdx.length} bloque(s) promocional(es) eliminado(s)`)

    await sleep(150)
  } catch (err) {
    errors++
    item.badgeCleanup = { method: 'error', error: err.message }
    console.log(`✗ ${err.message.slice(0, 60)}`)
  }
}

await saveManifest(manifest)

console.log(`\n📊  Limpiadas por máscara: ${cleaned} · sin cambios: ${kept} · errores: ${errors}`)
console.log(`🎨  Requieren retoque generativo (sello encima del envase): ${needsGenerative.length}`)
needsGenerative.forEach((i) => {
  console.log(`    - ${i.slug}`)
  console.log(`      ${i.detection.elements.join(' | ')}`)
})
console.log(`\n🖼   Recortes anotados para revisar: .image-cache/badge-annot/`)
console.log(`🖼   Resultados limpios: .image-cache/cleaned/\n`)
