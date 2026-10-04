/**
 * Guardián SDD v2 — la cadena historia → criterio → test → **veredicto**.
 *
 * Un criterio solo cuenta como demostrado si un test que lo nombra **se ejecutó y pasó**: el
 * veredicto se lee de los JUnit XML que emiten las suites, no se deduce de que exista un fichero.
 *
 * Falla (código 1) si:
 *   1. un criterio incumple lo que exige el estado de su historia (`exigencia` en la config):
 *      por defecto, en IMPLEMENTING rompe un test que falla; en TESTING y DONE, cualquier cosa que
 *      no sea verde,
 *   2. un test nombra un criterio que ninguna historia declara (huérfano),
 *   3. un test etiquetado no contiene ninguna aserción,
 *   4. un fichero de test nombra —aunque sea en un comentario— un criterio RETIRADO (lápida),
 *   5. una historia en DONE declara una plataforma con runner que no aporta ningún test verde,
 *   6. hay ids de historia o de criterio duplicados, estados o plataformas desconocidos.
 * En los demás estados, lo que falta es un aviso.
 *
 * Lo que NO puede garantizar: que el test pruebe de verdad su criterio (eso exige mutación).
 *
 * Cambios respecto a la v1 (ver la guía, capítulo «Lecciones»):
 *   - Todo lo propio del proyecto sale de `sdd.config.json`: rutas, plataformas, tokens, estados.
 *   - La matriz commiteada no lleva contadores: los totales cambian con cualquier test y hacían
 *     chocar cada merge. Van a la consola y al resumen del job de CI.
 *   - Orden determinista (comparación binaria, rutas con `/`): Windows y Linux generan lo mismo.
 *   - Fuera de CI la matriz no se escribe salvo `--escribir`: CI es la única fuente de veredictos.
 *   - `<skipped/>` es «sin ejecutar», nunca «pasó».
 *   - La etiqueta cuenta solo en el NOMBRE del test (o en la cabecera de un .sql), no en un
 *     comentario cualquiera; un `describe('AC-…')` etiqueta a sus `it`.
 *   - Una plataforma sin runner (`runner: false`) no puede aportar veredictos: DONE no se la exige
 *     y lo avisa, en vez de fallar para siempre.
 *   - Fallos conocidos por sistema operativo en `fallos-conocidos.json`, legibles por máquina; una
 *     entrada que ya pasa se avisa para que se borre.
 *   - Exigencia gradual por estado: en v1 IMPLEMENTING ya lo exigía todo, así que promover una
 *     historia a medio implementar rompía el guardián y todo se quedaba en SPECIFIED —incluso lo
 *     que estaba en producción—. Ahora IMPLEMENTING solo exige que nada falle.
 *   - El estado dice la verdad: avisa de una historia «sin código» con criterios demostrados y
 *     sugiere la promoción cuando una historia ya cumple el estado siguiente.
 *
 * Uso:  node herramientas/trazabilidad.ts [--config sdd.config.json] [--escribir | --no-escribir]
 *                                         [--salida ruta.md] [--detalle]
 * Requiere Node ≥ 22.18 (ejecuta TypeScript sin compilar). Sin dependencias.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// ---------------------------------------------------------------------------
// Tipos y configuración
// ---------------------------------------------------------------------------

export type Veredicto = 'paso' | 'fallo' | 'sin-ejecutar' | 'sin-test'
type Lenguaje = 'kotlin' | 'js' | 'sql'
export type Exigencia = 'avisa' | 'sin-fallos' | 'todo-verde'

export interface ConfigPlataforma {
  /** Carpetas (relativas a la raíz) con las fuentes de test. */
  tests: string[]
  /** Regex sobre el NOMBRE de archivo que identifica un fichero de test. */
  archivos: string
  /** Cómo se extraen los nombres de test: `kotlin`, `js` (vitest/jest/playwright) o `sql`. */
  lenguaje: Lenguaje
  /** Carpetas con los JUnit XML que produce su runner. */
  resultados: string[]
  /** `false` si nada ejecuta esos tests en CI: no puede aportar veredictos. */
  runner: boolean
  /** `true` si es la plataforma que impone las reglas «servidor». */
  servidor?: boolean
}

export interface Config {
  specs: string
  matriz: string
  /** Comando que se cita en la cabecera de la matriz. */
  comando: string
  historia: string
  etiqueta: string
  /** Si `AC-NNN-MM` debe pertenecer a `US-NNN`. */
  acDeLaHistoria: boolean
  asercion: string
  estados: string[]
  /**
   * Qué exige el guardián en cada estado: `avisa` (nada rompe), `sin-fallos` (rompe un test que
   * falla; lo que falta avisa) o `todo-verde` (todo criterio activo tiene que haber pasado).
   */
  exigencia: Record<string, Exigencia>
  /** El estado que además exige un test verde de cada plataforma declarada con runner. */
  estadoFinal: string
  frontmatter: { id: string; titulo: string; estado: string; plataformas: string }
  campos: { aplicadaEn: string; retirado: string }
  aplicacion: { servidorCliente: string; servidor: string; soloCliente: string }
  excluirSpecs: string
  ignorarCarpetas: string[]
  plataformas: Record<string, ConfigPlataforma>
  fallosConocidos?: string
  notas?: string[]
}

export interface FalloConocido {
  /** `win32`, `linux`, `darwin` o `*`. */
  so: string
  /** Nombre simple o cualificado de la clase / fichero del test. */
  clase: string
  /** Subcadena del nombre del caso; si falta, vale para toda la clase. */
  caso?: string
  /** Por qué se tolera: el hallazgo (AUD-NNN) que lo explica. */
  motivo: string
}

export const DEFECTO: Config = {
  specs: 'docs/specs',
  matriz: 'docs/specs/TRAZABILIDAD.md',
  comando: 'node herramientas/trazabilidad.ts',
  historia: 'US-\\d{3}',
  etiqueta: 'AC-\\d{3}-\\d{2}',
  acDeLaHistoria: true,
  // `assertEquals(`, `assertFailsWith<X> {`, `expect(`, `verify {`, `x shouldBe y`, `raise exception`.
  asercion: '\\b(assert\\w*|expect|verify)(<[^>]*>)?\\s*[({]|\\bshould[A-Z]\\w*\\b|\\braise\\s+exception\\b',
  estados: ['DRAFT', 'SPECIFIED', 'IMPLEMENTING', 'TESTING', 'DONE'],
  exigencia: { DRAFT: 'avisa', SPECIFIED: 'avisa', IMPLEMENTING: 'sin-fallos', TESTING: 'todo-verde', DONE: 'todo-verde' },
  estadoFinal: 'DONE',
  frontmatter: { id: 'id', titulo: 'titulo', estado: 'estado', plataformas: 'plataformas' },
  campos: { aplicadaEn: 'Aplicada en', retirado: 'Retirado' },
  aplicacion: {
    servidorCliente: '^servidor\\s*\\+\\s*cliente',
    servidor: '^servidor',
    soloCliente: '^solo cliente',
  },
  excluirSpecs: '(^|/)(README|TRAZABILIDAD|REGLAS-SIN-HISTORIA)\\.md$',
  ignorarCarpetas: ['node_modules', '.git', 'build', 'dist', '.gradle'],
  plataformas: {},
}

export function cargarConfig(ruta: string): Config {
  const leida = JSON.parse(readFileSync(ruta, 'utf8')) as Partial<Config> & { exigeVerde?: string[] }
  // Compatibilidad con la v1: `exigeVerde: [...]` equivale a `todo-verde` en esos estados.
  const heredada = leida.exigeVerde ? Object.fromEntries(leida.exigeVerde.map((e) => [e, 'todo-verde' as Exigencia])) : {}
  const c: Config = {
    ...DEFECTO,
    ...leida,
    exigencia: { ...DEFECTO.exigencia, ...heredada, ...leida.exigencia },
    frontmatter: { ...DEFECTO.frontmatter, ...leida.frontmatter },
    campos: { ...DEFECTO.campos, ...leida.campos },
    aplicacion: { ...DEFECTO.aplicacion, ...leida.aplicacion },
  }
  if (Object.keys(c.plataformas).length === 0) throw new Error(`${ruta}: no declara ninguna plataforma`)
  for (const [nombre, p] of Object.entries(c.plataformas)) {
    if (!['kotlin', 'js', 'sql'].includes(p.lenguaje)) {
      throw new Error(`${ruta}: la plataforma "${nombre}" tiene un lenguaje desconocido: ${p.lenguaje}`)
    }
  }
  return c
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Comparación binaria: el mismo orden en cualquier sistema operativo y locale. */
const binario = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const aPosix = (ruta: string) => ruta.split(sep).join('/')
const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const celdaSegura = (s: string) => s.replace(/\|/g, '\\|')

function archivosBajo(dir: string, filtro: (nombre: string) => boolean, ignorar: string[]): string[] {
  let entradas: string[]
  try { entradas = readdirSync(dir) } catch { return [] }
  return entradas.sort(binario).flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return ignorar.includes(e) ? [] : archivosBajo(ruta, filtro, ignorar)
    return filtro(e) ? [ruta] : []
  })
}

function decodificarXml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

// ---------------------------------------------------------------------------
// Historias
// ---------------------------------------------------------------------------

export interface Criterio { id: string; titulo: string; aplicadaEn: string; retirado: boolean }
export interface Historia {
  id: string; titulo: string; estado: string; plataformas: string[]; archivo: string; criterios: Criterio[]
}

function leerHistoria(ruta: string, raiz: string, c: Config, problemas: string[]): Historia | null {
  const texto = readFileSync(ruta, 'utf8')
  const encabezado = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto)
  if (!encabezado) return null
  const campo = (k: string) => new RegExp(`^${escaparRegex(k)}:\\s*(.+)$`, 'm').exec(encabezado[1])?.[1].trim() ?? ''
  const archivo = aPosix(relative(raiz, ruta))

  const id = campo(c.frontmatter.id)
  if (!id) return null
  if (!new RegExp(`^${c.historia}$`).test(id)) {
    problemas.push(`${archivo}: el id "${id}" no tiene la forma ${c.historia}`)
  }
  const estado = campo(c.frontmatter.estado).toUpperCase()
  if (!c.estados.includes(estado)) {
    problemas.push(`${archivo}: estado "${estado}" no es uno de ${c.estados.join(', ')}`)
  }
  const plataformas = campo(c.frontmatter.plataformas).replace(/[[\]]/g, '').split(',')
    .map((p) => p.trim()).filter(Boolean)
  for (const p of plataformas) {
    if (!(p in c.plataformas)) problemas.push(`${id}: plataforma desconocida "${p}"`)
  }

  const reCabecera = new RegExp(`^(${c.etiqueta})\\s*·?\\s*(.*)$`, 'm')
  const reRetirado = new RegExp(`^-\\s+\\*\\*${escaparRegex(c.campos.retirado)}:\\*\\*\\s*(.*)$`, 'm')
  const reAplicada = new RegExp(`\\*\\*${escaparRegex(c.campos.aplicadaEn)}:\\*\\*\\s*(.+)$`, 'm')
  const criterios: Criterio[] = []
  for (const bloque of texto.split(/^### /m).slice(1)) {
    const cab = reCabecera.exec(bloque)
    if (!cab || cab.index !== 0) continue
    const retirado = reRetirado.exec(bloque)
    criterios.push({
      id: cab[1],
      titulo: cab[2].trim().replace(/^~~|~~$/g, ''),
      aplicadaEn: retirado ? `retirado · ${retirado[1].trim()}` : reAplicada.exec(bloque)?.[1].trim() ?? '(sin declarar)',
      retirado: retirado !== null,
    })
  }
  return { id, titulo: campo(c.frontmatter.titulo), estado, plataformas, archivo, criterios }
}

// ---------------------------------------------------------------------------
// Fuentes de test: qué nombres de test hay y qué criterios nombran
// ---------------------------------------------------------------------------

/** Un test concreto: su nombre (con el contexto de su `describe`), su cuerpo y sus criterios. */
interface Unidad { nombre: string; cuerpo: string; acs: string[] }

function unidadesKotlin(texto: string, reAc: RegExp): Unidad[] {
  const decl = [...texto.matchAll(/\bfun\s+`([^`]+)`/g)]
  return decl.map((m, i) => ({
    nombre: m[1],
    cuerpo: texto.slice(m.index, decl[i + 1]?.index ?? texto.length),
    acs: [...new Set([...m[1].matchAll(reAc)].map((x) => x[0]))],
  }))
}

function unidadesJs(texto: string, reAc: RegExp): Unidad[] {
  // `describe|it|test`, con modificadores (`.only`, `.skip`, `.each(...)`), y su título literal.
  const re = /\b(describe|it|test)((?:\.\w+)*(?:\([^)]*\))?)\s*\(\s*(['"`])((?:\\.|(?!\3)[^\\])*)\3/g
  const decl = [...texto.matchAll(re)]
  const unidades: Unidad[] = []
  // Aproximación plana y documentada: un `describe` etiqueta a todos los `it`/`test` que le siguen
  // hasta el siguiente `describe`. Coincide con cómo el JUnit de vitest nombra los casos
  // («describe > it»), que es de donde sale el veredicto.
  let contexto = ''
  for (const [i, m] of decl.entries()) {
    if (m[1] === 'describe') { contexto = m[4]; continue }
    const nombre = contexto ? `${contexto} > ${m[4]}` : m[4]
    unidades.push({
      nombre,
      cuerpo: texto.slice(m.index, decl[i + 1]?.index ?? texto.length),
      acs: [...new Set([...nombre.matchAll(reAc)].map((x) => x[0]))],
    })
  }
  return unidades
}

function unidadesSql(texto: string, reAc: RegExp, etiqueta: string, archivo: string): Unidad[] {
  const acsDe = (s: string) => [...new Set([...s.matchAll(reAc)].map((x) => x[0]))]
  // La cabecera de comentarios declara lo que prueba el fichero entero (un único bloque `do`).
  const cabecera = /^(?:[ \t]*(?:--[^\n]*)?\r?\n)*/.exec(texto)?.[0] ?? ''
  const unidades: Unidad[] = [{ nombre: posix.basename(archivo), cuerpo: texto, acs: acsDe(cabecera) }]
  // Y una sección cuyo comentario EMPIEZA por el criterio lo prueba de ahí a la siguiente sección:
  //   -- ── AC-030-06 · un bloque nocturno cierra en su propia fecha ──
  // Un criterio citado a mitad de una frase («… lo exige el servidor (AC-060-08)») no cuenta.
  const secciones = [...texto.matchAll(new RegExp(`^[ \\t]*--[\\s\\-─—=#*·:]*(${etiqueta})[^\\n]*`, 'gm'))]
  for (const [i, m] of secciones.entries()) {
    if (m.index < cabecera.length) continue
    unidades.push({
      nombre: `${posix.basename(archivo)} › ${m[1]}`,
      cuerpo: texto.slice(m.index, secciones[i + 1]?.index ?? texto.length),
      acs: acsDe(m[0]),
    })
  }
  return unidades
}

/**
 * Una aserción que se etiqueta en su propio mensaje también es un test del criterio:
 *   exigir(!acciones.includes('aprobar'), 'AC-060-05 el solicitante no puede aprobarse')
 *   raise exception 'AC-031-02: con ausencia vigente no se exige el ingreso';
 * El criterio tiene que ABRIR el literal, y la línea, casar con el patrón de aserción.
 */
function unidadesAsercion(texto: string, reAsercion: RegExp, etiqueta: string): Unidad[] {
  const reApertura = new RegExp(`(['"\`])\\s*(${etiqueta})`, 'g')
  return texto.split(/\r?\n/).flatMap((linea) => {
    if (!reAsercion.test(linea)) return []
    const acs = [...new Set([...linea.matchAll(reApertura)].map((m) => m[2]))]
    return acs.length ? [{ nombre: linea.trim(), cuerpo: linea, acs }] : []
  })
}

// ---------------------------------------------------------------------------
// El guardián
// ---------------------------------------------------------------------------

export interface Resultado {
  historias: Historia[]
  problemas: string[]
  avisos: string[]
  cuenta: Record<Veredicto | 'retirado', number>
  matriz: string
  menciones: string[]
  ficherosTest: number
  informes: number
}

export function ejecutar(c: Config, raiz: string, opciones: { so?: string } = {}): Resultado {
  const so = opciones.so ?? process.platform
  const problemas: string[] = []
  const avisos: string[] = []
  const reAc = new RegExp(`\\b${c.etiqueta}\\b`, 'g')
  const reAsercion = new RegExp(c.asercion, 'i')
  const nombresPlataforma = Object.keys(c.plataformas)
  const servidores = nombresPlataforma.filter((p) => c.plataformas[p].servidor)

  // 1) Historias -----------------------------------------------------------
  const reExcluir = new RegExp(c.excluirSpecs)
  const historias = archivosBajo(join(raiz, c.specs), (n) => n.endsWith('.md'), c.ignorarCarpetas)
    .filter((f) => !reExcluir.test(aPosix(relative(raiz, f))))
    .map((f) => leerHistoria(f, raiz, c, problemas))
    .filter((h): h is Historia => h !== null)
    .sort((a, b) => binario(a.id, b.id))

  const vistasHistoria = new Map<string, string>()
  const vistosCriterio = new Map<string, string>()
  for (const h of historias) {
    if (vistasHistoria.has(h.id)) problemas.push(`${h.id} está declarada dos veces: ${vistasHistoria.get(h.id)} y ${h.archivo}`)
    vistasHistoria.set(h.id, h.archivo)
    const numero = /\d+/.exec(h.id)?.[0]
    for (const cr of h.criterios) {
      if (vistosCriterio.has(cr.id)) problemas.push(`${cr.id} está declarado dos veces: ${vistosCriterio.get(cr.id)} y ${h.id}`)
      vistosCriterio.set(cr.id, h.id)
      if (c.acDeLaHistoria && numero && /\d+/.exec(cr.id)?.[0] !== numero) {
        problemas.push(`${cr.id} está en ${h.id}: su número no corresponde a la historia`)
      }
    }
  }

  // 2) Fuentes de test -----------------------------------------------------
  /** criterio → plataforma → ficheros que lo nombran en el NOMBRE de un test. */
  const cobertura = new Map<string, Map<string, string[]>>()
  /** criterio → ficheros que lo mencionan en cualquier sitio (para la lápida). */
  const mencionAlguna = new Map<string, Set<string>>()
  const menciones: string[] = []
  let ficherosTest = 0

  for (const [plataforma, p] of Object.entries(c.plataformas)) {
    const reArchivo = new RegExp(p.archivos)
    for (const dir of p.tests) {
      for (const ruta of archivosBajo(join(raiz, dir), (n) => reArchivo.test(n), c.ignorarCarpetas)) {
        ficherosTest++
        const texto = readFileSync(ruta, 'utf8')
        const rel = aPosix(relative(raiz, ruta))
        for (const m of texto.matchAll(reAc)) {
          const s = mencionAlguna.get(m[0]) ?? new Set<string>()
          s.add(rel)
          mencionAlguna.set(m[0], s)
        }
        const declaradas = p.lenguaje === 'kotlin' ? unidadesKotlin(texto, reAc)
          : p.lenguaje === 'js' ? unidadesJs(texto, reAc)
            : unidadesSql(texto, reAc, c.etiqueta, rel)
        // La etiqueta en el mensaje de una aserción solo vale donde no hay nombres de test que la
        // lleven: en un .sql y en un script de comprobación. Dentro de un `it`/`@Test` el veredicto
        // llega por el nombre del test, así que es ahí donde tiene que estar el criterio.
        const sinNombres = p.lenguaje === 'sql' || declaradas.length === 0
        const unidades = [...declaradas, ...(sinNombres ? unidadesAsercion(texto, reAsercion, c.etiqueta) : [])]
        const nombrados = new Set<string>()
        for (const u of unidades) {
          if (u.acs.length === 0) continue
          // Un test etiquetado sin ninguna aserción es el `assertTrue(true)`: pasa siempre y no
          // demuestra nada.
          if (!reAsercion.test(u.cuerpo)) {
            problemas.push(`${u.acs.join(', ')}: el test «${u.nombre}» de ${rel} no contiene ninguna aserción`)
          }
          for (const ac of u.acs) {
            nombrados.add(ac)
            const porPlataforma = cobertura.get(ac) ?? new Map<string, string[]>()
            const previas = porPlataforma.get(plataforma) ?? []
            if (!previas.includes(rel)) porPlataforma.set(plataforma, [...previas, rel].sort(binario))
            cobertura.set(ac, porPlataforma)
          }
        }
        const sueltas = [...new Set([...texto.matchAll(reAc)].map((m) => m[0]))].filter((ac) => !nombrados.has(ac))
        for (const ac of sueltas) menciones.push(`${rel} menciona ${ac} fuera del nombre de un test: no cuenta como cobertura`)
      }
    }
  }

  // 3) Veredictos de los JUnit XML ------------------------------------------
  let conocidos: FalloConocido[] = []
  if (c.fallosConocidos) {
    const ruta = resolve(raiz, c.fallosConocidos)
    if (existsSync(ruta)) conocidos = JSON.parse(readFileSync(ruta, 'utf8')) as FalloConocido[]
    else avisos.push(`${c.fallosConocidos} no existe: no se tolera ningún fallo conocido`)
  }
  const aplicables = conocidos.filter((k) => k.so === '*' || k.so === so)
  const conocidoUsado = new Set<FalloConocido>()
  /** Criterios con algún caso cuyo fallo se toleró por conocido en este sistema operativo. */
  const tolerados = new Set<string>()
  const esConocido = (clase: string, caso: string) => aplicables.find((k) =>
    (clase === k.clase || clase.endsWith(`.${k.clase}`) || clase.endsWith(`/${k.clase}`)) &&
    (!k.caso || caso.includes(k.caso)))

  /** criterio → plataforma → estados de sus casos ejecutados. */
  const estados = new Map<string, Map<string, Set<'paso' | 'fallo'>>>()
  let informes = 0
  for (const [plataforma, p] of Object.entries(c.plataformas)) {
    for (const dir of p.resultados) {
      for (const xml of archivosBajo(join(raiz, dir), (n) => n.endsWith('.xml'), [])) {
        informes++
        const contenido = readFileSync(xml, 'utf8')
        for (const caso of contenido.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
          const atributo = (k: string) => decodificarXml(new RegExp(`\\b${k}="([^"]*)"`).exec(caso[1])?.[1] ?? '')
          const nombre = atributo('name')
          const clase = atributo('classname')
          const cuerpo = caso[3] ?? ''
          if (/<skipped\b/.test(cuerpo)) continue // omitido = sin ejecutar, nunca verde
          let estado: 'paso' | 'fallo' = /<(failure|error)\b/.test(cuerpo) ? 'fallo' : 'paso'
          if (estado === 'fallo') {
            const k = esConocido(clase, nombre)
            if (k) {
              conocidoUsado.add(k)
              for (const ac of nombre.matchAll(reAc)) tolerados.add(ac[0])
              avisos.push(`fallo conocido tolerado en ${so}: ${clase} › ${nombre} (${k.motivo})`)
              continue // tolerado = no cuenta ni como verde ni como rojo
            }
          }
          for (const ac of new Set([...nombre.matchAll(reAc)].map((x) => x[0]))) {
            const porPlataforma = estados.get(ac) ?? new Map<string, Set<'paso' | 'fallo'>>()
            const s = porPlataforma.get(plataforma) ?? new Set<'paso' | 'fallo'>()
            s.add(estado)
            porPlataforma.set(plataforma, s)
            estados.set(ac, porPlataforma)
          }
        }
      }
    }
  }
  if (informes > 0) {
    for (const k of aplicables) {
      if (!conocidoUsado.has(k)) {
        avisos.push(`fallos-conocidos: «${k.clase}${k.caso ? ` › ${k.caso}` : ''}» ya no falla en ${so}; borra la entrada`)
      }
    }
  }

  const veredicto = (ac: string, p: string): Veredicto => {
    if (!cobertura.get(ac)?.has(p)) return 'sin-test'
    if (!c.plataformas[p].runner) return 'sin-ejecutar'
    const s = estados.get(ac)?.get(p)
    if (!s || s.size === 0) return 'sin-ejecutar'
    return s.has('fallo') ? 'fallo' : 'paso'
  }

  /**
   * Veredicto del criterio en conjunto. «Aplicada en» dice QUIÉN impone la regla, no qué suite
   * debe demostrarla: un e2e demuestra igual de bien una regla del servidor. La puerta es: hay al
   * menos un test, ninguno de los suyos falló y al menos uno se ejecutó de verdad.
   */
  const veredictoGlobal = (ac: string): Veredicto => {
    const ps = [...(cobertura.get(ac)?.keys() ?? [])]
    if (ps.length === 0) return 'sin-test'
    const vs = ps.map((p) => veredicto(ac, p))
    if (vs.includes('fallo')) return 'fallo'
    if (vs.includes('paso')) return 'paso'
    return 'sin-ejecutar'
  }

  const esperadas = (cr: Criterio, declaradas: string[]): string[] => {
    const sinServidor = declaradas.filter((p) => !servidores.includes(p))
    const conServidor = declaradas.filter((p) => servidores.includes(p))
    if (new RegExp(c.aplicacion.servidorCliente, 'i').test(cr.aplicadaEn)) return declaradas
    if (new RegExp(c.aplicacion.servidor, 'i').test(cr.aplicadaEn)) return conServidor.length ? conServidor : declaradas
    if (new RegExp(c.aplicacion.soloCliente, 'i').test(cr.aplicadaEn)) return sinServidor
    return declaradas
  }

  // 4) Comprobaciones ------------------------------------------------------
  const EXPLICACION: Record<Veredicto, string> = {
    paso: 'pasó',
    fallo: 'su test FALLÓ',
    'sin-ejecutar': 'tiene test pero ninguna suite lo ejecutó',
    'sin-test': 'no lo demuestra ningún test',
  }
  const declarados = new Set(historias.flatMap((h) => h.criterios.map((cr) => cr.id)))

  // La lápida: a un criterio retirado no puede quedarle ninguna mención en un fichero de test.
  for (const h of historias) {
    for (const cr of h.criterios.filter((x) => x.retirado)) {
      const donde = [...(mencionAlguna.get(cr.id) ?? [])].sort(binario)
      if (donde.length) problemas.push(`${cr.id} está RETIRADO y todavía lo nombran: ${donde.join(', ')}`)
    }
  }

  for (const h of historias) {
    const exigencia = c.exigencia[h.estado] ?? 'avisa'
    const activos = h.criterios.filter((x) => !x.retirado)
    for (const cr of activos) {
      const v = veredictoGlobal(cr.id)
      if (v === 'paso') continue
      const msg = `${cr.id} (${h.id}, ${h.estado}): ${EXPLICACION[v]}`
      const duro = exigencia === 'todo-verde' || (exigencia === 'sin-fallos' && v === 'fallo')
      // Si lo único que falta es un veredicto que se perdió por un fallo conocido de esta
      // plataforma, aquí no se puede saber: lo decide CI. Se avisa, no se rompe.
      if (v === 'sin-ejecutar' && tolerados.has(cr.id)) {
        avisos.push(`${msg}: solo tiene fallos conocidos en ${so}; lo comprueba CI`)
      } else if (duro) problemas.push(msg); else avisos.push(msg)
    }
    // El estado final: cada plataforma declarada aporta al menos un test verde. Una plataforma sin
    // runner no puede aportar nada: se avisa en vez de fallar para siempre.
    const plataformasSinVerde = h.plataformas.filter((p) => c.plataformas[p]?.runner &&
      !activos.some((cr) => veredicto(cr.id, p) === 'paso'))
    const todoVerde = activos.length > 0 && activos.every((cr) => veredictoGlobal(cr.id) === 'paso')
    // El estado dice la verdad: una historia «sin código» con criterios demostrados miente.
    if (exigencia === 'avisa' && activos.some((cr) => veredictoGlobal(cr.id) === 'paso') && !todoVerde) {
      const implementando = c.estados.find((e) => (c.exigencia[e] ?? 'avisa') !== 'avisa') ?? 'un estado de implementación'
      avisos.push(h.estado === c.estados[0]
        ? `${h.id} está en ${h.estado} pero ya tiene criterios demostrados: hay código sobre criterios que producto no validó`
        : `${h.id} está en ${h.estado} pero ya tiene criterios demostrados: hay implementación, pásala a ${implementando}`)
    }
    if (h.estado === c.estadoFinal) {
      for (const p of plataformasSinVerde) {
        if (activos.some((cr) => tolerados.has(cr.id))) {
          avisos.push(`${h.id} está en DONE y "${p}" no aporta verde aquí por fallos conocidos en ${so}; lo comprueba CI`)
          continue
        }
        problemas.push(`${h.id} está en ${c.estadoFinal} y declara "${p}", pero ningún test verde de esa plataforma nombra sus criterios`)
      }
      for (const p of h.plataformas.filter((x) => c.plataformas[x] && !c.plataformas[x].runner)) {
        avisos.push(`${h.id} declara "${p}", que no tiene runner en CI: esa plataforma no puede demostrar nada`)
      }
    } else if (todoVerde && plataformasSinVerde.length === 0) {
      // El primer estado es el borrador: producto aún no validó los criterios, y un borrador no
      // salta a terminado por mucho que sus tests pasen.
      avisos.push(h.estado === c.estados[0]
        ? `${h.id} está en ${h.estado} y sus tests ya cumplen ${c.estadoFinal}: falta que producto valide sus criterios`
        : `${h.id} está en ${h.estado} y ya cumple las condiciones de ${c.estadoFinal}: promuévela`)
    } else if (todoVerde && (c.exigencia[h.estado] ?? 'avisa') !== 'todo-verde') {
      const siguiente = c.estados.find((e) => c.exigencia[e] === 'todo-verde' && e !== c.estadoFinal)
      if (siguiente) avisos.push(`${h.id} está en ${h.estado} y todos sus criterios pasan; falta ${plataformasSinVerde.join(', ')}: pásala a ${siguiente}`)
    }
  }

  for (const [ac, porPlataforma] of [...cobertura].sort((a, b) => binario(a[0], b[0]))) {
    if (declarados.has(ac)) continue
    const donde = [...porPlataforma.values()].flat()
    problemas.push(`${ac} lo nombran ${donde.length} test(s) pero ninguna historia lo declara: ${donde.join(', ')}`)
  }

  for (const h of historias) {
    for (const cr of h.criterios) {
      if (cr.retirado) continue
      if (cr.aplicadaEn === '(sin declarar)') { avisos.push(`${cr.id} no declara "${c.campos.aplicadaEn}:"`); continue }
      if (new RegExp(`${c.aplicacion.soloCliente}\\s*$`, 'i').test(cr.aplicadaEn)) {
        avisos.push(`${cr.id} dice "solo cliente" sin justificar: añade "· <motivo>" o el AUD-NNN que lo recoge`)
      }
    }
  }

  // 5) La matriz -----------------------------------------------------------
  const ICONO: Record<Veredicto, string> = { paso: '✅', fallo: '❌', 'sin-ejecutar': '⚠️', 'sin-test': '○' }
  const cuenta: Record<Veredicto | 'retirado', number> = { paso: 0, fallo: 0, 'sin-ejecutar': 0, 'sin-test': 0, retirado: 0 }
  for (const h of historias) {
    for (const cr of h.criterios) cuenta[cr.retirado ? 'retirado' : veredictoGlobal(cr.id)]++
  }

  const dirMatriz = posix.dirname(aPosix(c.matriz))
  const desdeMatriz = (archivoHistoria: string) => posix.relative(dirMatriz, archivoHistoria)
  /** Los enlaces relativos de una historia apuntan desde su carpeta: se recalculan desde la matriz. */
  const reenlazar = (texto: string, archivoHistoria: string) =>
    texto.replace(/\]\(([^)#\s]+)(#[^)]*)?\)/g, (todo, destino: string, ancla = '') => {
      if (/^[a-z]+:/i.test(destino) || destino.startsWith('/')) return todo
      const absoluto = posix.normalize(posix.join(posix.dirname(archivoHistoria), destino))
      return `](${posix.relative(dirMatriz, absoluto)}${ancla})`
    })

  const celda = (cr: Criterio, p: string, declaradas: string[]) =>
    cr.retirado ? '·'
      : esperadas(cr, declaradas).includes(p) || cobertura.get(cr.id)?.has(p) ? ICONO[veredicto(cr.id, p)] : '·'

  const cabeceraPlataformas = nombresPlataforma.map((p) => p[0].toUpperCase() + p.slice(1))
  const lineas: string[] = [
    '# Trazabilidad',
    '',
    `**Generado por \`${c.comando}\` en CI. No editar a mano.** Tras un merge no se resuelve el`,
    'conflicto a mano: se regenera o se trae el artefacto de CI.',
    '',
    'Leyenda: ✅ el test se ejecutó y pasó · ❌ falló · ⚠️ hay test pero ninguna suite lo ejecutó ·',
    '○ sin ningún test · 🪦 retirado: se comprueba que **no** le quede ningún test · `·` la',
    'plataforma no aplica al criterio, según su campo «' + c.campos.aplicadaEn + '».',
    '',
    ...(c.notas?.length ? [...c.notas.map((n) => `> ${n}`), ''] : []),
    `| Historia | Estado | Criterio | ${cabeceraPlataformas.join(' | ')} | Se hace cumplir en | Tests |`,
    `|---|---|---|${nombresPlataforma.map(() => '---').join('|')}|---|---|`,
  ]
  for (const h of historias) {
    const enlace = `[${h.id}](${desdeMatriz(h.archivo)})`
    if (h.criterios.length === 0) {
      lineas.push(`| ${enlace} ${celdaSegura(h.titulo)} | ${h.estado} | *(sin criterios)* | ${nombresPlataforma.map(() => '·').join(' | ')} | · | |`)
      continue
    }
    for (const [i, cr] of h.criterios.entries()) {
      const rutas = [...new Set([...(cobertura.get(cr.id)?.values() ?? [])].flat())].sort(binario)
      const tests = rutas.map((t) => `\`${t}\``).join('<br>') || '—'
      lineas.push(
        `| ${i === 0 ? `${enlace} ${celdaSegura(h.titulo)}` : ''} | ${i === 0 ? h.estado : ''} | ` +
        `**${cr.id}** ${cr.retirado ? `🪦 ~~${celdaSegura(cr.titulo)}~~` : celdaSegura(cr.titulo)} | ` +
        `${nombresPlataforma.map((p) => celda(cr, p, h.plataformas)).join(' | ')} | ` +
        `${celdaSegura(reenlazar(cr.aplicadaEn, h.archivo))} | ${tests} |`,
      )
    }
  }

  return { historias, problemas, avisos, cuenta, matriz: lineas.join('\n') + '\n', menciones, ficherosTest, informes }
}

// ---------------------------------------------------------------------------
// Línea de comandos
// ---------------------------------------------------------------------------

function principal(argv: string[]): number {
  const arg = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined }
  const rutaConfig = resolve(arg('--config') ?? 'sdd.config.json')
  if (!existsSync(rutaConfig)) {
    console.error(`✗ No encuentro ${rutaConfig}. Copia herramientas/sdd.config.json a la raíz del repo o usa --config.`)
    return 2
  }
  const c = cargarConfig(rutaConfig)
  const raiz = dirname(rutaConfig)
  const enCi = Boolean(process.env.CI)
  const escribir = argv.includes('--escribir') || (enCi && !argv.includes('--no-escribir'))
  const salida = arg('--salida')

  const r = ejecutar(c, raiz)
  const resumen = [
    `Historias: ${r.historias.length} · criterios: ${Object.values(r.cuenta).reduce((a, b) => a + b, 0)}` +
      ` · ficheros de test: ${r.ficherosTest} · informes JUnit: ${r.informes}`,
    `  ✅ ${r.cuenta.paso}  ❌ ${r.cuenta.fallo}  ⚠️ ${r.cuenta['sin-ejecutar']}  ○ ${r.cuenta['sin-test']}  🪦 ${r.cuenta.retirado}`,
  ]
  for (const l of resumen) console.log(l)
  if (r.informes === 0) console.log('  · No hay informes JUnit: ejecuta las suites antes, o todo saldrá ⚠️.')
  for (const a of r.avisos) console.log(`  aviso · ${a}`)
  if (r.menciones.length) {
    if (argv.includes('--detalle')) for (const m of r.menciones) console.log(`  mención · ${m}`)
    else console.log(`  · ${r.menciones.length} mención(es) de criterios fuera del nombre de un test (no cuentan). --detalle para verlas.`)
  }

  const destino = salida ? resolve(salida) : join(raiz, c.matriz)
  if (escribir || salida) {
    writeFileSync(destino, r.matriz)
    console.log(`  · Matriz escrita en ${aPosix(relative(raiz, destino))}`)
  } else {
    console.log('  · Fuera de CI la matriz no se escribe: la genera CI, que es la única fuente de veredictos.')
    console.log('    Tráela con `node herramientas/traer-matriz.ts`, o fuerza con --escribir si sabes lo que haces.')
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
      '## Trazabilidad', '',
      '| Veredicto | Criterios |', '|---|---|',
      `| ✅ demostrado | **${r.cuenta.paso}** |`, `| ❌ falló | ${r.cuenta.fallo} |`,
      `| ⚠️ sin ejecutar | ${r.cuenta['sin-ejecutar']} |`, `| ○ sin test | ${r.cuenta['sin-test']} |`,
      `| 🪦 retirado | ${r.cuenta.retirado} |`, '',
      r.problemas.length ? `**✗ ${r.problemas.length} problema(s):**\n\n${r.problemas.map((p) => `- ${p}`).join('\n')}\n` : '**✓ Todo criterio exigible está demostrado.**\n',
    ].join('\n'))
  }

  if (r.problemas.length) {
    console.error(`\n✗ La cadena historia → criterio → test está rota en ${r.problemas.length} punto(s):`)
    for (const p of r.problemas) console.error(`  · ${p}`)
    return 1
  }
  console.log('\n✓ Todo criterio exigible está demostrado.')
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = principal(process.argv.slice(2))
}
