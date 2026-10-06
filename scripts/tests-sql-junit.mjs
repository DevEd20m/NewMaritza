#!/usr/bin/env node
// B-002 · Ejecuta los tests pgTAP de supabase/tests/ y escribe su resultado como JUnit XML.
//
// `supabase test db` usa pg_prove, que consume el TAP y solo imprime un resumen: el guardián de
// trazabilidad se queda sin veredictos y los criterios demostrados en SQL salen ⚠️. Esto ejecuta
// los mismos ficheros con psql en crudo, que sí imprime cada línea TAP, y la traduce.
//
//   node scripts/tests-sql-junit.mjs [--salida build/test-results/sql]
//
// Sale con 1 si algún test falla, igual que `supabase test db`.
// No sustituye a `supabase test db` en CI: se ejecuta además, por los veredictos.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR_TESTS = 'supabase/tests'
const salidaIdx = process.argv.indexOf('--salida')
const DIR_SALIDA = salidaIdx !== -1 ? process.argv[salidaIdx + 1] : 'build/test-results/sql'

function contenedorDb() {
  // El contenedor se resuelve por el `project_id` de supabase/config.toml, NO por «el primero
  // que aparezca». En una máquina con varios proyectos de Supabase levantados a la vez, coger
  // `docker ps -q | head -1` ejecuta los tests de este repositorio contra la base de otro
  // proyecto: pasó el 2026-10-05 y dejó una extensión instalada donde no tocaba.
  const config = readFileSync('supabase/config.toml', 'utf-8')
  const projectId = config.match(/^\s*project_id\s*=\s*"([^"]+)"/m)?.[1]
  if (!projectId) {
    console.error('No se pudo leer project_id de supabase/config.toml.')
    process.exit(2)
  }

  const nombre = `supabase_db_${projectId}`
  const vivos = execFileSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf-8' })
    .split(/\r?\n/)
    .map((n) => n.trim())
    .filter(Boolean)

  if (!vivos.includes(nombre)) {
    const otros = vivos.filter((n) => n.startsWith('supabase_db_'))
    console.error(`No está corriendo el contenedor ${nombre}. Levanta el stack con \`supabase start\`.`)
    if (otros.length) console.error(`Hay otros proyectos de Supabase levantados: ${otros.join(', ')} — no se usan.`)
    // Código 2: «no se pudo ejecutar», distinto de 1, que es «hay tests en rojo». Confundirlos
    // hace que un problema de entorno se lea como un fallo de producto.
    process.exit(2)
  }
  return nombre
}

/** Ejecuta un fichero con psql en crudo (-At) y devuelve sus líneas TAP. */
function ejecutar(contenedor, ruta) {
  const sql = readFileSync(ruta, 'utf-8')
  let salida
  try {
    salida = execFileSync(
      'docker',
      ['exec', '-i', contenedor, 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-q', '-f', '-'],
      { input: sql, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } catch (error) {
    // psql sale con código != 0 si el script lanza un error de SQL. El TAP que llegó a emitir
    // sigue siendo útil, y lo que falte se refleja como plan incumplido.
    salida = (error.stdout ?? '') + (error.stderr ?? '')
  }
  return salida.split('\n')
}

/** TAP → casos. `ok N - desc`, `not ok N - desc`, `ok N # SKIP motivo`. */
function parsearTap(lineas) {
  const casos = []
  let plan = null
  let diagnosticoPendiente = []

  for (const cruda of lineas) {
    const linea = cruda.trim()
    const mPlan = linea.match(/^1\.\.(\d+)$/)
    if (mPlan) { plan = Number(mPlan[1]); continue }

    const mCaso = linea.match(/^(not ok|ok)\s+(\d+)\s*-?\s*(.*)$/)
    if (mCaso) {
      const [, veredicto, numero, resto] = mCaso
      const saltado = /#\s*(SKIP|skip)/.test(resto)
      casos.push({
        numero: Number(numero),
        nombre: resto.replace(/#.*$/, '').trim() || `test ${numero}`,
        ok: veredicto === 'ok',
        saltado,
        diagnostico: diagnosticoPendiente.join('\n'),
      })
      diagnosticoPendiente = []
      continue
    }

    // Las líneas `#` que siguen a un fallo explican por qué (have/want).
    if (linea.startsWith('#')) {
      const texto = linea.replace(/^#\s?/, '')
      if (casos.length && !casos[casos.length - 1].ok) {
        casos[casos.length - 1].diagnostico = [casos[casos.length - 1].diagnostico, texto].filter(Boolean).join('\n')
      } else {
        diagnosticoPendiente.push(texto)
      }
    }
  }
  return { plan, casos }
}

const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const contenedor = contenedorDb()
const ficheros = readdirSync(DIR_TESTS).filter((f) => f.endsWith('.sql')).sort()
if (!ficheros.length) {
  console.error(`No hay ficheros .sql en ${DIR_TESTS}`)
  process.exit(1)
}

const suites = []
let totalFallos = 0
let totalCasos = 0

for (const fichero of ficheros) {
  const inicio = Date.now()
  const { plan, casos } = parsearTap(ejecutar(contenedor, join(DIR_TESTS, fichero)))
  const segundos = ((Date.now() - inicio) / 1000).toFixed(3)

  // Un plan incumplido es un fallo aunque todos los casos emitidos dijeran «ok»: significa que
  // el script murió a medias.
  const incompleto = plan !== null && casos.length !== plan
  const fallos = casos.filter((c) => !c.ok && !c.saltado).length + (incompleto ? 1 : 0)
  totalFallos += fallos
  totalCasos += casos.length

  suites.push({ fichero, casos, segundos, incompleto, plan, fallos })
  const estado = fallos === 0 ? 'ok' : `FALLO (${fallos})`
  console.log(`${fichero} .. ${estado}  ${casos.length}${plan !== null ? `/${plan}` : ''} casos`)
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<testsuites name="pgtap" tests="${totalCasos}" failures="${totalFallos}">`,
]
for (const s of suites) {
  const nombreSuite = s.fichero.replace(/\.sql$/, '')
  xml.push(`  <testsuite name="${escapar(nombreSuite)}" tests="${s.casos.length}" failures="${s.casos.filter((c) => !c.ok && !c.saltado).length}" time="${s.segundos}">`)
  for (const c of s.casos) {
    xml.push(`    <testcase classname="${escapar(nombreSuite)}" name="${escapar(c.nombre)}" time="0">`)
    if (c.saltado) xml.push(`      <skipped/>`)
    else if (!c.ok) xml.push(`      <failure message="${escapar(c.nombre)}">${escapar(c.diagnostico || 'sin diagnóstico')}</failure>`)
    xml.push('    </testcase>')
  }
  if (s.incompleto) {
    xml.push(`    <testcase classname="${escapar(nombreSuite)}" name="plan incumplido" time="0">`)
    xml.push(`      <failure message="plan incumplido">el plan declaraba ${s.plan} tests y se emitieron ${s.casos.length}</failure>`)
    xml.push('    </testcase>')
  }
  xml.push('  </testsuite>')
}
xml.push('</testsuites>')

mkdirSync(DIR_SALIDA, { recursive: true })
const destino = join(DIR_SALIDA, 'pgtap.xml')
writeFileSync(destino, xml.join('\n') + '\n', 'utf-8')
console.log(`\nJUnit escrito en ${destino} · ${totalCasos} casos, ${totalFallos} fallos`)

process.exit(totalFallos === 0 ? 0 : 1)
