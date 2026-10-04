/**
 * Puerta de la documentación: ningún enlace interno roto, ningún ancla inexistente y, si hay
 * Mermaid instalado, ningún diagrama que no parsee.
 *
 * Es una PUERTA, así que corre en CI (ci/especificaciones.yml). En la v1 del método esta
 * comprobación vivía dentro del generador del sitio de documentación y nadie la ejecutaba en CI.
 *
 * Corpus: todos los .md bajo `docs/` (menos carpetas que empiezan por punto) más los .md sueltos de
 * la raíz (README.md, CLAUDE.md…).
 *
 * Uso:  node herramientas/verificar-docs.ts [--raiz .] [--docs docs] [--modulos .] [--exigir-mermaid]
 *   --modulos: carpeta cuyo node_modules tiene mermaid y jsdom (por defecto, la raíz).
 *   Mermaid es opcional: con `npm i -D mermaid jsdom` se validan los diagramas; sin ellos se avisa y
 *   se sigue, salvo con --exigir-mermaid.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const argv = process.argv.slice(2)
const arg = (k: string, defecto: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : defecto }
const RAIZ = resolve(arg('--raiz', '.'))
const DOCS = join(RAIZ, arg('--docs', 'docs'))
const aPosix = (r: string) => r.split(sep).join('/')

function mdBajo(dir: string): string[] {
  let entradas: string[]
  try { entradas = readdirSync(dir) } catch { return [] }
  return entradas.sort().flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return e.startsWith('.') || e === 'node_modules' ? [] : mdBajo(ruta)
    return e.endsWith('.md') ? [ruta] : []
  })
}

const corpus = [
  ...readdirSync(RAIZ).filter((f) => f.endsWith('.md')).map((f) => join(RAIZ, f)),
  ...mdBajo(DOCS),
]

/**
 * Quita lo que no se publica —bloques ``` , código en línea `…` y comentarios <!-- … -->—: un
 * enlace o un encabezado escrito como ejemplo no cuenta. Se sustituye por espacios para conservar
 * los números de línea.
 */
const blanquear = (b: string) => b.replace(/[^\n]/g, ' ')
const sinCodigo = (texto: string) => texto
  .replace(/^(```|~~~)[\s\S]*?^\1/gm, blanquear)
  .replace(/<!--[\s\S]*?-->/g, blanquear)
  .replace(/``[^\n]*?``|`[^`\n]*`/g, blanquear)

/** Anclas al estilo de GitHub: minúsculas, sin puntuación, espacios → guiones, repetidas con -1, -2… */
function anclas(texto: string): Set<string> {
  const vistas = new Map<string, number>()
  const resultado = new Set<string>()
  // Solo se quitan los bloques ``` y los comentarios: el código en línea de un encabezado sí forma
  // parte de su ancla («## Referencia de `sdd.config.json`» → #referencia-de-sddconfigjson).
  const sinBloques = texto.replace(/^(```|~~~)[\s\S]*?^\1/gm, blanquear).replace(/<!--[\s\S]*?-->/g, blanquear)
  for (const m of sinBloques.matchAll(/^#{1,6}[ \t]+(.+?)[ \t]*#*$/gm)) {
    const limpio = m[1]
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // enlaces e imágenes → su texto
      .replace(/<[^>]+>/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-')
    const n = vistas.get(limpio) ?? 0
    resultado.add(n === 0 ? limpio : `${limpio}-${n}`)
    vistas.set(limpio, n + 1)
  }
  for (const m of texto.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) resultado.add(m[1])
  return resultado
}

const problemas: string[] = []
const cacheAnclas = new Map<string, Set<string>>()
const anclasDe = (ruta: string) => {
  if (!cacheAnclas.has(ruta)) cacheAnclas.set(ruta, anclas(readFileSync(ruta, 'utf8')))
  return cacheAnclas.get(ruta)!
}

let enlaces = 0
for (const archivo of corpus) {
  const texto = readFileSync(archivo, 'utf8')
  const rel = aPosix(relative(RAIZ, archivo))
  for (const m of sinCodigo(texto).matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const href = m[1]
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue // http:, mailto:…
    enlaces++
    const linea = texto.slice(0, m.index).split('\n').length
    const [ruta, ancla] = href.split('#') as [string, string | undefined]
    const destino = ruta ? resolve(dirname(archivo), decodeURIComponent(ruta)) : archivo
    if (!existsSync(destino)) {
      problemas.push(`${rel}:${linea} · enlace roto: ${href}`)
      continue
    }
    if (ancla && destino.endsWith('.md') && !anclasDe(destino).has(decodeURIComponent(ancla).toLowerCase())) {
      problemas.push(`${rel}:${linea} · ancla inexistente: ${href}`)
    }
  }
}

// Mermaid, si está instalado en el proyecto.
let diagramas = 0
let mermaidDisponible = false
try {
  const requerir = createRequire(pathToFileURL(join(resolve(arg('--modulos', RAIZ)), 'package.json')).href)
  const { JSDOM } = await import(pathToFileURL(requerir.resolve('jsdom')).href)
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true })
  const g = globalThis as Record<string, unknown>
  g.window = dom.window
  g.document = dom.window.document
  g.DOMPurify = { sanitize: (s: string) => s, addHook: () => {}, setConfig: () => {} }
  const { default: mermaid } = await import(pathToFileURL(requerir.resolve('mermaid')).href)
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
  mermaidDisponible = true
  for (const archivo of corpus) {
    const texto = readFileSync(archivo, 'utf8')
    for (const b of texto.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)) {
      diagramas++
      try { await mermaid.parse(b[1]) } catch (e) {
        const linea = texto.slice(0, b.index).split('\n').length
        problemas.push(`${aPosix(relative(RAIZ, archivo))}:${linea} · diagrama inválido: ${String((e as Error).message ?? e).split('\n')[0]}`)
      }
    }
  }
} catch {
  const msg = 'Mermaid no está instalado (npm i -D mermaid jsdom): los diagramas no se han validado.'
  if (argv.includes('--exigir-mermaid')) problemas.push(msg)
  else console.log(`  aviso · ${msg}`)
}

console.log(`Documentos: ${corpus.length} · enlaces internos: ${enlaces}` + (mermaidDisponible ? ` · diagramas: ${diagramas}` : ''))
if (problemas.length) {
  console.error(`\n✗ ${problemas.length} problema(s) en la documentación:`)
  for (const p of problemas) console.error(`  · ${p}`)
  process.exit(1)
}
console.log('✓ Documentación sin enlaces rotos' + (mermaidDisponible ? ' ni diagramas inválidos.' : '.'))
