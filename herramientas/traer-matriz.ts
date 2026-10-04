/**
 * Trae de CI la matriz de trazabilidad del commit actual y la deja en su sitio.
 *
 * Por qué existe: la matriz lleva VEREDICTOS, y los veredictos solo son fiables donde corren todas
 * las suites en el sistema de referencia (CI). Regenerarla en otra máquina produce ❌ falsos
 * (fallos propios de la plataforma) y otro orden. Así que, cuando CI dice «la matriz commiteada no
 * coincide» —típicamente tras un merge—, no se resuelve a mano ni se regenera en local: se trae.
 *
 * Flujo tras un merge con conflicto en la matriz:
 *   1. `git checkout --theirs <matriz>` (o `merge=ours` en .gitattributes lo hace solo) y termina el merge.
 *   2. Empuja. El workflow falla en «la matriz generada tiene que estar commiteada» y sube el artefacto.
 *   3. `node herramientas/traer-matriz.ts` → commit «Matriz regenerada por CI» → empuja.
 *
 * Uso:  node herramientas/traer-matriz.ts [--config sdd.config.json] [--workflow especificaciones.yml]
 *                                         [--artefacto trazabilidad] [--commit <sha>]
 * Requiere la CLI `gh` autenticada (`gh auth login`).
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { cargarConfig } from './trazabilidad.ts'

const argv = process.argv.slice(2)
const arg = (k: string, defecto: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : defecto }
const ejecutar = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: 'utf8' }).trim()

function fallar(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

const rutaConfig = resolve(arg('--config', 'sdd.config.json'))
if (!existsSync(rutaConfig)) fallar(`No encuentro ${rutaConfig}.`)
const config = cargarConfig(rutaConfig)
const workflow = arg('--workflow', 'especificaciones.yml')
const artefacto = arg('--artefacto', 'trazabilidad')

try { ejecutar('gh', ['--version']) } catch { fallar('Hace falta la CLI de GitHub (`gh`), autenticada con `gh auth login`.') }

const sha = arg('--commit', ejecutar('git', ['rev-parse', 'HEAD']))
const ejecuciones = JSON.parse(ejecutar('gh', [
  'run', 'list', '--workflow', workflow, '--commit', sha, '--limit', '1',
  '--json', 'databaseId,status,conclusion,headSha,url',
])) as { databaseId: number; status: string; conclusion: string; headSha: string; url: string }[]

const run = ejecuciones[0]
if (!run) fallar(`No hay ninguna ejecución de ${workflow} para ${sha.slice(0, 7)}. ¿Has empujado el commit?`)
if (run.status !== 'completed') fallar(`La ejecución de ${sha.slice(0, 7)} aún no ha terminado (${run.status}): ${run.url}`)

// El artefacto se sube siempre (`if: always()`), también cuando el job falla por la matriz: es
// justo el caso que este script resuelve.
const temporal = mkdtempSync(join(tmpdir(), 'sdd-matriz-'))
try {
  ejecutar('gh', ['run', 'download', String(run.databaseId), '--name', artefacto, '--dir', temporal])
} catch {
  fallar(`La ejecución ${run.url} no tiene el artefacto "${artefacto}".`)
}
const bajado = readdirSync(temporal).find((f) => f.endsWith('.md'))
if (!bajado) fallar(`El artefacto "${artefacto}" no contiene ningún .md.`)

const destino = join(dirname(rutaConfig), config.matriz)
copyFileSync(join(temporal, bajado), destino)
console.log(`✓ Matriz de CI (${sha.slice(0, 7)}, ${run.conclusion}) copiada en ${config.matriz}.`)
console.log('  Revísala con `git diff` y commitéala: «Matriz regenerada por CI».')
