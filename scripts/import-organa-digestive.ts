import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import sharp from 'sharp'

import { generateSkuBase } from '../src/lib/utils/generate-sku'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_DIR = join(ROOT, 'imports', 'organa-digestive-2026-08-21')
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json')
const BUCKET = 'product-images'
const CATEGORY_SLUG = 'digestivo'
const SOURCE_ORIGIN = 'https://www.organa.com.pe'

type Tier = 'económica' | 'media' | 'premium'

type SourceProduct = {
  sourcePath: string
  sourceRank: number
  sourceCatalog: string
  sourceImageUrl: string
  tier: Tier
  name: string
  brand: string
  presentation: string
  priceCents: number
  compareAtCents: number | null
  description: string
  indications: string
  usageInstructions: string
  contraindications: string
  tagSlugs: string[]
}

type ManifestProduct = SourceProduct & {
  sourceUrl: string
  slug: string
  categorySlug: string
  localImages: string[]
}

type Manifest = {
  generatedAt: string
  source: string
  categorySlug: string
  products: ManifestProduct[]
}

const INULIN_WARNING = 'Puede producir gases, distensión o cólicos, especialmente al inicio. No usar ante obstrucción intestinal o dolor abdominal sin diagnóstico. Separar de medicamentos orales y consultar durante embarazo, lactancia, enfermedad digestiva activa o tratamiento médico.'
const PSYLLIUM_WARNING = 'No tomar en seco. No usar si existe dificultad para tragar, obstrucción intestinal, dolor abdominal intenso o cambios intestinales sin diagnóstico. Separar al menos 2 horas de medicamentos orales. Consultar durante embarazo, lactancia o enfermedad digestiva activa.'
const PROBIOTIC_WARNING = 'No sustituye una alimentación equilibrada ni un tratamiento médico. Consultar antes de usar durante embarazo o lactancia, en menores, inmunosupresión, enfermedad grave o tratamiento con antibióticos u otros medicamentos. Suspender ante una reacción inesperada.'

const PRODUCTS: SourceProduct[] = [
  {
    sourcePath: '/conga-yogurt-probiotico-de-fresas--1lt/p',
    sourceRank: 3,
    sourceCatalog: 'Yogurt Probiótico',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/158288-500-auto?v=637697403542200000&width=500&height=auto&aspect=true',
    tier: 'económica',
    name: 'Yogurt Probiótico de Fresa Conga',
    brand: 'Conga',
    presentation: '1 L',
    priceCents: 1490,
    compareAtCents: null,
    description: 'Yogurt refrigerado de fresa identificado por Conga como probiótico. Es una alternativa familiar y accesible para incorporar un alimento fermentado a desayunos o meriendas.',
    indications: 'Personas y familias que toleran los lácteos y buscan una opción fermentada de sabor frutal para su alimentación cotidiana.',
    usageInstructions: 'Consumir frío en la porción indicada en el envase. Mantener siempre refrigerado, respetar la fecha de vencimiento y, una vez abierto, conservar bien cerrado y consumir dentro del plazo señalado por el fabricante.',
    contraindications: 'Contiene leche. No consumir en caso de alergia a la proteína de la leche; las personas con intolerancia a la lactosa deben revisar su tolerancia y la etiqueta. Desechar si se rompió la cadena de frío, el envase está alterado o cambió el olor o aspecto.',
    tagSlugs: ['objetivo-digestivo', 'uso-familia', 'uso-hogar', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'momento-manana', 'momento-uso-diario', 'alerta-lacteos', 'alerta-advertencia'],
  },
  {
    sourcePath: '/conga-yogurt-probiotico-natural--1lt/p',
    sourceRank: 6,
    sourceCatalog: 'Yogurt Probiótico',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/158289-500-auto?v=637697405962400000&width=500&height=auto&aspect=true',
    tier: 'económica',
    name: 'Yogurt Probiótico Natural Conga',
    brand: 'Conga',
    presentation: '1 L',
    priceCents: 1490,
    compareAtCents: null,
    description: 'Yogurt refrigerado natural identificado por Conga como probiótico. Su sabor neutro permite combinarlo con fruta, avena o granola y ofrece una entrada económica a los alimentos fermentados.',
    indications: 'Personas y familias que toleran los lácteos y prefieren un yogurt probiótico de sabor natural.',
    usageInstructions: 'Consumir frío en la porción indicada en el envase, solo o acompañado. Mantener siempre refrigerado, respetar la fecha de vencimiento y conservar bien cerrado después de abrir.',
    contraindications: 'Contiene leche. No consumir en caso de alergia a la proteína de la leche; las personas con intolerancia a la lactosa deben revisar su tolerancia y la etiqueta. Desechar si se rompió la cadena de frío, el envase está alterado o cambió el olor o aspecto.',
    tagSlugs: ['objetivo-digestivo', 'uso-familia', 'uso-hogar', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'momento-manana', 'momento-uso-diario', 'alerta-lacteos', 'alerta-advertencia'],
  },
  {
    sourcePath: '/inulina-vivir-power-snacks-250gr/p',
    sourceRank: 2,
    sourceCatalog: 'Fibras Digestivas',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/162510-500-auto?v=638761872120200000&width=500&height=auto&aspect=true',
    tier: 'económica',
    name: 'Inulina Prebiótica Vivir Power Snacks',
    brand: 'Vivir Power Snacks',
    presentation: '250 g',
    priceCents: 3590,
    compareAtCents: null,
    description: 'Fibra soluble de origen vegetal que funciona como prebiótico y puede mezclarse con bebidas, yogurt o preparaciones. Es la alternativa de inulina más accesible de la selección.',
    indications: 'Adultos que desean aumentar gradualmente su consumo de fibra prebiótica y complementar una alimentación variada.',
    usageInstructions: 'Comenzar con una cantidad pequeña una vez al día y mezclarla completamente con agua, batido o alimento. Aumentar solo de forma gradual y sin superar la porción indicada en el envase. Mantener una hidratación adecuada.',
    contraindications: INULIN_WARNING,
    tagSlugs: ['objetivo-digestivo', 'uso-hogar', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-ligero', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/probiotico-11-cepas-flora-interior-x12sobres/p',
    sourceRank: 3,
    sourceCatalog: 'Probióticos',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/163905-500-auto?v=638968487774300000&width=500&height=auto&aspect=true',
    tier: 'económica',
    name: 'Probiótico 11 Cepas Flora Interior',
    brand: 'Flora Interior',
    presentation: '12 sobres',
    priceCents: 4490,
    compareAtCents: null,
    description: 'Suplemento en sobres con 11 variedades declaradas de Lactobacillus, Bifidobacterium y cultivos lácticos. La fórmula es sin gluten, sin lactosa, sin azúcar añadida y apta para veganos.',
    indications: 'Adultos que buscan una presentación en sobres para complementar el equilibrio de su microbiota dentro de una rutina digestiva.',
    usageInstructions: 'Para consumo directo, disolver un sobre en agua, jugo o batido a temperatura ambiente y beber inmediatamente. No mezclar con líquidos calientes. Respetar la frecuencia y duración indicadas en el envase.',
    contraindications: PROBIOTIC_WARNING,
    tagSlugs: ['objetivo-digestivo', 'objetivo-inmune', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-sin-gluten', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-menores', 'alerta-medicamentos', 'alerta-consulta'],
  },
  {
    sourcePath: '/fluye-mezcla-de-frutas-y-vegetales-deshidratado-150g/p',
    sourceRank: 8,
    sourceCatalog: 'Fibras Digestivas',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/162497-500-auto?v=638761166339930000&width=500&height=auto&aspect=true',
    tier: 'económica',
    name: 'Mezcla de Fibras Fluye',
    brand: 'Fluye',
    presentation: '150 g',
    priceCents: 4900,
    compareAtCents: null,
    description: 'Mezcla vegetal con salvado de trigo, ciruela, nopal, psyllium, beterraga, higo, tamarindo y noni. Combina fibra soluble, insoluble y prebiótica en un formato fácil de añadir a alimentos.',
    indications: 'Adultos que buscan aumentar la variedad de fibras de su alimentación con una mezcla de frutas y vegetales.',
    usageInstructions: 'Agitar el envase antes de servir. En adultos, mezclar inicialmente una cucharada al ras (5 g) con una preparación o bebida y acompañar con suficiente agua. No licuar ni exceder la porción del envase.',
    contraindications: 'Contiene trigo y gluten; no es apto para enfermedad celíaca ni alergia al trigo. Por contener psyllium, no tomar en seco y separar de medicamentos orales. El uso en niños, embarazo, lactancia o enfermedad digestiva debe consultarse previamente.',
    tagSlugs: ['objetivo-digestivo', 'uso-hogar', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-menores', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/probioticos-masticables-para-ni%C3%B1os-natures-truth-x30tabletas/p',
    sourceRank: 5,
    sourceCatalog: 'Probióticos',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/164010-500-auto?v=638992523567730000&width=500&height=auto&aspect=true',
    tier: 'económica',
    name: "Probiótico Masticable Infantil Nature's Truth",
    brand: "Nature's Truth",
    presentation: '30 tabletas masticables',
    priceCents: 4990,
    compareAtCents: null,
    description: 'Probiótico infantil masticable con sabor a bayas, 14 cepas declaradas y 3 mil millones de UFC al momento de fabricación. No requiere refrigeración y está libre de gluten y soya.',
    indications: 'Niños desde los 4 años cuyos padres buscan una presentación masticable y cuentan con la aprobación de su pediatra.',
    usageInstructions: 'Niños desde 4 años: masticar una tableta al día, preferentemente con una comida. No tragar entera, no exceder la dosis y confirmar siempre las indicaciones de edad del envase recibido.',
    contraindications: 'No administrar a menores de 4 años ni sin conocimiento del pediatra. Consultar si el niño usa medicamentos, tiene una enfermedad, inmunosupresión o alergias. Mantener fuera del alcance de niños pequeños por riesgo de ingesta accidental.',
    tagSlugs: ['objetivo-digestivo', 'objetivo-inmune', 'uso-familia', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'pref-sin-gluten', 'momento-manana', 'momento-uso-diario', 'alerta-menores', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/psyllium-vivir-power-snacks-250gr/p',
    sourceRank: 1,
    sourceCatalog: 'Fibras Digestivas',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/164475-500-auto?v=639171561627430000&width=500&height=auto&aspect=true',
    tier: 'media',
    name: 'Psyllium Husk Vivir Power Snacks',
    brand: 'Vivir Power Snacks',
    presentation: '284 g',
    priceCents: 4990,
    compareAtCents: null,
    description: 'Cáscara de Plantago ovata en polvo, rica en fibra soluble y sin gluten. Al contacto con agua forma un gel y puede incorporarse a bebidas, batidos o preparaciones.',
    indications: 'Adultos que buscan una fibra soluble simple para complementar el tránsito intestinal y su consumo diario de fibra.',
    usageInstructions: 'Comenzar con una cucharadita aproximada (5 g) en al menos 250 ml de agua o jugo. Mezclar, beber inmediatamente antes de que espese y tomar otro vaso de agua. Aumentar solo según tolerancia y etiqueta.',
    contraindications: PSYLLIUM_WARNING,
    tagSlugs: ['objetivo-digestivo', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-sin-gluten', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/amazonia-inulina-from-blue-agave-x-250g/p',
    sourceRank: 4,
    sourceCatalog: 'Fibras Digestivas',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/164561-500-auto?v=639200073777070000&width=500&height=auto&aspect=true',
    tier: 'media',
    name: 'Inulina de Agave Amazonia',
    brand: 'Amazonia',
    presentation: '250 g',
    priceCents: 5590,
    compareAtCents: null,
    description: 'Inulina en polvo obtenida de agave azul. Aporta fibra soluble prebiótica y se integra con facilidad a bebidas o alimentos dentro de una rutina digestiva gradual.',
    indications: 'Adultos que buscan una fibra prebiótica de agave y prefieren una alternativa de gama media.',
    usageInstructions: 'Mezclar una porción pequeña con agua, batido o alimento una vez al día. Empezar gradualmente para evaluar tolerancia y no superar la cantidad indicada en el envase.',
    contraindications: INULIN_WARNING,
    tagSlugs: ['objetivo-digestivo', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-ligero', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/-probiotic-acidophilus---bifidus-mason-x30-caps/p',
    sourceRank: 1,
    sourceCatalog: 'Probióticos',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/164102-500-auto?v=639020358670730000&width=500&height=auto&aspect=true',
    tier: 'media',
    name: 'Probiotic Acidophilus & Bifidus Mason Naturals',
    brand: 'Mason Naturals',
    presentation: '30 cápsulas',
    priceCents: 6021,
    compareAtCents: 6690,
    description: 'Suplemento de Mason Naturals que combina cultivos de acidophilus y bifidus en cápsulas vegetales. Es la opción con descuento real y ocupa el primer lugar del catálogo de probióticos revisado.',
    indications: 'Adultos que buscan una fórmula probiótica sencilla en cápsulas para acompañar su rutina digestiva.',
    usageInstructions: 'Tomar una cápsula al día, preferentemente con una comida y agua, o según la indicación actual del envase. No exceder la dosis recomendada.',
    contraindications: PROBIOTIC_WARNING,
    tagSlugs: ['objetivo-digestivo', 'objetivo-inmune', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-ligero', 'pref-sin-gluten', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-menores', 'alerta-medicamentos', 'alerta-consulta'],
  },
  {
    sourcePath: '/probioticos-para-mujeres-con-arandanos-rojos-natures-truth-x40capsulas/p',
    sourceRank: 2,
    sourceCatalog: 'Probióticos',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/164011-500-auto?v=638992524482500000&width=500&height=auto&aspect=true',
    tier: 'media',
    name: "Probióticos para Mujeres con Arándano Nature's Truth",
    brand: "Nature's Truth",
    presentation: '40 cápsulas',
    priceCents: 6990,
    compareAtCents: null,
    description: 'Fórmula vegetariana para mujeres con 14 cepas probióticas, 5 mil millones de UFC declaradas y concentrado de arándano rojo. Está orientada al equilibrio digestivo y al cuidado íntimo.',
    indications: 'Mujeres adultas que buscan una fórmula probiótica específica con arándano rojo y libre de gluten.',
    usageInstructions: 'Tomar una cápsula al día, preferentemente con una comida y agua. Respetar la dosis y las instrucciones de conservación del envase.',
    contraindications: 'Consultar antes de usar durante embarazo o lactancia, inmunosupresión, enfermedad grave o tratamiento con antibióticos, anticoagulantes u otros medicamentos. El arándano puede no ser apropiado con ciertos tratamientos. Suspender ante una reacción inesperada.',
    tagSlugs: ['objetivo-digestivo', 'objetivo-inmune', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-sin-gluten', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/psyllium-husk-amazonia-powder-x-250gr/p',
    sourceRank: 6,
    sourceCatalog: 'Fibras Digestivas',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/164562-500-auto?v=639200078338770000&width=500&height=auto&aspect=true',
    tier: 'media',
    name: 'Psyllium Husk Amazonia',
    brand: 'Amazonia',
    presentation: '250 g',
    priceCents: 7290,
    compareAtCents: null,
    description: 'Psyllium en polvo de Plantago ovata con alto contenido de fibra soluble. Es una alternativa de marca para quienes desean complementar el tránsito intestinal con un ingrediente simple.',
    indications: 'Adultos que buscan una opción de psyllium de gama media para aumentar su consumo de fibra soluble.',
    usageInstructions: 'Mezclar la porción indicada en el envase con al menos 250 ml de agua, beber inmediatamente y tomar otro vaso de líquido. Empezar con la menor porción y aumentar solo según tolerancia.',
    contraindications: PSYLLIUM_WARNING,
    tagSlugs: ['objetivo-digestivo', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/fibramax-con-psyllium-drasanvi-400gr/p',
    sourceRank: 7,
    sourceCatalog: 'Fibras Digestivas',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/161343-500-auto?v=638416294753570000&width=500&height=auto&aspect=true',
    tier: 'premium',
    name: 'Fibramax con Psyllium Drasanvi',
    brand: 'Drasanvi',
    presentation: '400 g',
    priceCents: 8200,
    compareAtCents: null,
    description: 'Complemento alimenticio de Drasanvi que combina fibra soluble e insoluble con psyllium. Es vegano, libre de gluten y ofrece una presentación grande para rutinas constantes.',
    indications: 'Adultos que buscan una mezcla completa de fibras y una presentación premium de mayor tamaño.',
    usageInstructions: 'Añadir una cucharada sopera colmada a 250 ml de agua o jugo, remover enérgicamente y consumir de inmediato. Puede tomarse en ayunas o con alimentos, respetando la frecuencia del envase y bebiendo agua adicional.',
    contraindications: PSYLLIUM_WARNING,
    tagSlugs: ['objetivo-digestivo', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-sin-gluten', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/bebida-con-cultivos-probioticos-proem-1-500ml/p',
    sourceRank: 4,
    sourceCatalog: 'Probióticos',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/163089-500-auto?v=638796414454230000&width=500&height=auto&aspect=true',
    tier: 'premium',
    name: 'Bebida Probiótica PROEM-1',
    brand: 'PROEM-1',
    presentation: '500 ml',
    priceCents: 9490,
    compareAtCents: null,
    description: 'Bebida probiótica estable a temperatura ambiente con cinco cultivos declarados, aloe, miel y panela. Su formato líquido ofrece una alternativa premium a cápsulas y polvos y no requiere refrigeración antes de abrir.',
    indications: 'Adultos que prefieren una presentación líquida y buscan incorporar cultivos probióticos a su rutina digestiva.',
    usageInstructions: 'Agitar antes de usar. Tomar una cucharada después de las comidas o según la indicación vigente del envase. Usar el dosificador limpio y respetar las instrucciones de conservación después de abrir.',
    contraindications: 'Contiene miel y panela. Consultar si existe diabetes, alergia a productos de abeja, embarazo, lactancia, inmunosupresión o tratamiento con antibióticos u otros medicamentos. No exceder la porción del envase.',
    tagSlugs: ['objetivo-digestivo', 'objetivo-inmune', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-organico', 'pref-sin-gluten', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
  {
    sourcePath: '/inulin-prebiotic-now-227gr/p',
    sourceRank: 7,
    sourceCatalog: 'Digestión y Salud · página 2',
    sourceImageUrl: 'https://organaperu.vtexassets.com/arquivos/ids/162804-500-auto?v=638780783609530000&width=500&height=auto&aspect=true',
    tier: 'premium',
    name: 'Inulin Prebiotic NOW',
    brand: 'NOW',
    presentation: '227 g',
    priceCents: 11490,
    compareAtCents: null,
    description: 'Fibra prebiótica de NOW en polvo, ligeramente dulce y fácil de incorporar a bebidas o alimentos. Es la alternativa premium de inulina dentro de la selección.',
    indications: 'Adultos que buscan una inulina de marca internacional y prefieren ajustar gradualmente la porción según tolerancia.',
    usageInstructions: 'Comenzar con una cucharadita al ras una vez al día, mezclada con bebida o comida. Si se tolera, aumentar gradualmente sin superar la pauta del envase, que permite hasta tres tomas diarias.',
    contraindications: INULIN_WARNING,
    tagSlugs: ['objetivo-digestivo', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'pref-vegano', 'momento-manana', 'momento-uso-diario', 'alerta-embarazo', 'alerta-medicamentos', 'alerta-advertencia', 'alerta-consulta'],
  },
]

dotenv.config({ path: process.env.IMPORT_ENV_PATH || join(ROOT, '.env.local'), quiet: true })

function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalize(value: unknown): string {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function slugify(value: string): string {
  return normalize(value).replace(/\s+/g, '-').slice(0, 96)
}

function tokenSimilarity(left: string, right: string): number {
  const a = new Set(normalize(left).split(' ').filter(Boolean))
  const b = new Set(normalize(right).split(' ').filter(Boolean))
  const intersection = [...a].filter((token) => b.has(token)).length
  const union = new Set([...a, ...b]).size
  return union ? intersection / union : 0
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function prepare() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  const products: ManifestProduct[] = []

  for (const [index, source] of PRODUCTS.entries()) {
    const slug = slugify(`${source.name} ${source.presentation}`)
    const imageDir = join(OUTPUT_DIR, 'images', slug)
    const destination = join(imageDir, '01.webp')
    await mkdir(imageDir, { recursive: true })
    if (!(await exists(destination))) {
      const response = await fetch(source.sourceImageUrl, { headers: { 'user-agent': 'Mozilla/5.0 LIORA catalog curation' } })
      if (!response.ok) throw new Error(`Imagen ${response.status}: ${source.sourceImageUrl}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      await sharp(buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90, effort: 4 })
        .toFile(destination)
    }

    products.push({
      ...source,
      sourceUrl: `${SOURCE_ORIGIN}${source.sourcePath}`,
      slug,
      categorySlug: CATEGORY_SLUG,
      localImages: [relative(ROOT, destination)],
    })
    console.log(`Preparado ${index + 1}/${PRODUCTS.length}: ${source.name} — S/${(source.priceCents / 100).toFixed(2)}`)
  }

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    source: SOURCE_ORIGIN,
    categorySlug: CATEGORY_SLUG,
    products,
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(JSON.stringify({
    manifest: relative(ROOT, MANIFEST_PATH),
    products: products.length,
    images: products.length,
    tiers: Object.fromEntries(['económica', 'media', 'premium'].map((tier) => [tier, products.filter((product) => product.tier === tier).length])),
    minPrice: Math.min(...products.map((product) => product.priceCents)) / 100,
    maxPrice: Math.max(...products.map((product) => product.priceCents)) / 100,
  }, null, 2))
}

async function readManifest(): Promise<Manifest> {
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as Manifest
}

function validateManifest(manifest: Manifest) {
  const errors: string[] = []
  if (manifest.categorySlug !== CATEGORY_SLUG) errors.push(`Categoría inesperada: ${manifest.categorySlug}`)
  if (manifest.products.length !== PRODUCTS.length) errors.push(`Se esperaban ${PRODUCTS.length} productos y hay ${manifest.products.length}`)
  const slugs = new Set<string>()
  const sourcePaths = new Set<string>()
  for (const product of manifest.products) {
    if (slugs.has(product.slug)) errors.push(`Slug duplicado: ${product.slug}`)
    if (sourcePaths.has(product.sourcePath)) errors.push(`Fuente duplicada: ${product.sourcePath}`)
    slugs.add(product.slug)
    sourcePaths.add(product.sourcePath)
    for (const field of ['name', 'brand', 'description', 'indications', 'usageInstructions', 'contraindications', 'presentation'] as const) {
      if (!cleanText(product[field])) errors.push(`${product.slug}: falta ${field}`)
    }
    if (!Number.isInteger(product.priceCents) || product.priceCents <= 0) errors.push(`${product.slug}: precio inválido`)
    if (product.compareAtCents !== null && product.compareAtCents <= product.priceCents) errors.push(`${product.slug}: precio tachado inválido`)
    if (product.localImages.length !== 1) errors.push(`${product.slug}: se esperaba una imagen de portada`)
    if (product.tagSlugs.length < 5) errors.push(`${product.slug}: faltan tags de recomendación`)
  }
  return errors
}

async function dryRun() {
  const manifest = await readManifest()
  const errors = validateManifest(manifest)
  for (const product of manifest.products) {
    for (const image of product.localImages) if (!(await exists(resolve(ROOT, image)))) errors.push(`${product.slug}: imagen ausente`)
  }
  console.log(JSON.stringify({
    mode: 'dry-run',
    products: manifest.products.length,
    tiers: Object.fromEntries(['económica', 'media', 'premium'].map((tier) => [tier, manifest.products.filter((product) => product.tier === tier).length])),
    prices: manifest.products.map((product) => ({ name: product.name, price: product.priceCents / 100, compareAt: product.compareAtCents ? product.compareAtCents / 100 : null })),
    skuBases: manifest.products.map((product) => generateSkuBase(CATEGORY_SLUG, product.name, product.presentation)),
    errors,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

function getAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function uniqueSku(base: string, used: Set<string>): string {
  if (!used.has(normalize(base))) return base
  for (let suffix = 2; suffix <= 99; suffix++) {
    const candidate = `${base}-${suffix}`
    if (!used.has(normalize(candidate))) return candidate
  }
  throw new Error(`No se pudo generar un SKU libre para ${base}`)
}

async function preflight(admin: SupabaseClient, manifest: Manifest) {
  const errors = validateManifest(manifest)
  const [{ data: category, error: categoryError }, { data: products, error: productsError }, { data: variants, error: variantsError }, { data: tags, error: tagsError }] = await Promise.all([
    admin.from('categories').select('id,name,slug').eq('slug', CATEGORY_SLUG).maybeSingle(),
    admin.from('products').select('id,name,slug,brand,is_active').range(0, 1999),
    admin.from('product_variants').select('sku').range(0, 3999),
    admin.from('tags').select('id,slug').range(0, 999),
  ])
  if (categoryError) throw categoryError
  if (productsError) throw productsError
  if (variantsError) throw variantsError
  if (tagsError) throw tagsError
  if (!category) errors.push(`La categoría ${CATEGORY_SLUG} no existe; el importador no la creará`)

  for (const candidate of manifest.products) {
    const exact = (products ?? []).find((product) => product.slug === candidate.slug || (
      normalize(product.brand) === normalize(candidate.brand) && normalize(product.name) === normalize(candidate.name)
    ))
    if (exact) errors.push(`${candidate.name}: ya existe ${exact.name} (${exact.slug})`)
    const fuzzy = (products ?? [])
      .filter((product) => normalize(product.brand) === normalize(candidate.brand))
      .map((product) => ({ product, score: tokenSimilarity(candidate.name, product.name) }))
      .filter((match) => match.score >= 0.72)
      .sort((left, right) => right.score - left.score)[0]
    if (fuzzy && fuzzy.product.slug !== exact?.slug) errors.push(`${candidate.name}: posible duplicado ${fuzzy.product.name} (${fuzzy.score.toFixed(2)})`)
  }

  const tagBySlug = new Map((tags ?? []).map((tag) => [tag.slug, tag.id]))
  for (const slug of new Set(manifest.products.flatMap((product) => product.tagSlugs))) {
    if (!tagBySlug.has(slug)) errors.push(`Tag inexistente: ${slug}`)
  }
  return {
    errors,
    category,
    tagBySlug,
    usedSkus: new Set((variants ?? []).map((variant) => normalize(variant.sku))),
  }
}

async function applyProduction() {
  const manifest = await readManifest()
  const admin = getAdmin()
  const check = await preflight(admin, manifest)
  if (check.errors.length || !check.category) {
    console.error(JSON.stringify({ mode: 'apply', status: 'blocked-by-preflight', errors: check.errors }, null, 2))
    process.exitCode = 1
    return
  }

  const created: Array<{ slug: string; sku: string; price: number }> = []
  for (const [index, product] of manifest.products.entries()) {
    const storagePaths: string[] = []
    let productId: string | null = null
    try {
      const storagePath = `products/${product.slug}/cover.webp`
      const image = await readFile(resolve(ROOT, product.localImages[0]))
      const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, image, {
        upsert: false,
        contentType: 'image/webp',
        cacheControl: '31536000',
      })
      if (uploadError) throw uploadError
      storagePaths.push(storagePath)
      const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

      const { data: productRow, error: productError } = await admin.from('products').insert({
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        category_id: check.category.id,
        cover_image_url: publicData.publicUrl,
        gallery_urls: [],
        usage_instructions: product.usageInstructions,
        indications: product.indications,
        contraindications: product.contraindications,
        is_active: true,
      }).select('id').single()
      if (productError) throw productError
      productId = productRow.id

      const sku = uniqueSku(generateSkuBase(CATEGORY_SLUG, product.name, product.presentation), check.usedSkus)
      const { data: variant, error: variantError } = await admin.from('product_variants').insert({
        product_id: productId,
        sku,
        name: product.presentation,
        is_active: true,
        stock_quantity: null,
      }).select('id').single()
      if (variantError) throw variantError

      const { error: priceError } = await admin.from('product_prices').insert({
        variant_id: variant.id,
        currency: 'PEN',
        amount_cents: product.priceCents,
        compare_at_cents: product.compareAtCents,
        effective_from: new Date().toISOString(),
        effective_to: null,
      })
      if (priceError) throw priceError

      const { error: tagError } = await admin.from('product_tags').insert(
        product.tagSlugs.map((slug) => ({ product_id: productId!, tag_id: check.tagBySlug.get(slug)! })),
      )
      if (tagError) throw tagError

      check.usedSkus.add(normalize(sku))
      created.push({ slug: product.slug, sku, price: product.priceCents / 100 })
      console.log(`Publicado ${index + 1}/${manifest.products.length}: ${product.name} — ${sku}`)
    } catch (error) {
      if (productId) await admin.from('products').delete().eq('id', productId)
      if (storagePaths.length) await admin.storage.from(BUCKET).remove(storagePaths)
      throw new Error(`Falló ${product.name}; se revirtió su carga: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  console.log(JSON.stringify({ mode: 'apply', status: 'published', category: check.category, products: created.length, active: true, stock: 'unlimited', created }, null, 2))
}

async function preflightProduction() {
  const manifest = await readManifest()
  const check = await preflight(getAdmin(), manifest)
  console.log(JSON.stringify({
    mode: 'preflight-production',
    category: check.category,
    products: manifest.products.length,
    errors: check.errors,
  }, null, 2))
  if (check.errors.length) process.exitCode = 1
}

async function auditProduction() {
  const manifest = await readManifest()
  const admin = getAdmin()
  const { data: category, error: categoryError } = await admin.from('categories').select('id,name,slug').eq('slug', CATEGORY_SLUG).single()
  if (categoryError) throw categoryError
  const { data: products, error: productsError } = await admin
    .from('products')
    .select('id,name,slug,brand,category_id,is_active,cover_image_url,gallery_urls,description,usage_instructions,indications,contraindications')
    .in('slug', manifest.products.map((product) => product.slug))
    .range(0, 99)
  if (productsError) throw productsError
  const productIds = (products ?? []).map((product) => product.id)
  const [{ data: variants, error: variantsError }, { data: pivots, error: pivotsError }] = await Promise.all([
    admin.from('product_variants').select('id,product_id,sku,name,is_active,stock_quantity').in('product_id', productIds).range(0, 99),
    admin.from('product_tags').select('product_id,tag_id').in('product_id', productIds).range(0, 999),
  ])
  if (variantsError) throw variantsError
  if (pivotsError) throw pivotsError
  const { data: prices, error: pricesError } = await admin.from('product_prices').select('variant_id,currency,amount_cents,compare_at_cents,effective_to').in('variant_id', (variants ?? []).map((variant) => variant.id)).range(0, 99)
  if (pricesError) throw pricesError

  const errors = validateManifest(manifest)
  const rows = manifest.products.map((expected) => {
    const product = (products ?? []).find((candidate) => candidate.slug === expected.slug)
    const variant = (variants ?? []).find((candidate) => candidate.product_id === product?.id)
    const price = (prices ?? []).find((candidate) => candidate.variant_id === variant?.id && candidate.effective_to === null)
    const tagCount = (pivots ?? []).filter((pivot) => pivot.product_id === product?.id).length
    const rowErrors: string[] = []
    if (!product) rowErrors.push('ausente')
    if (product && !product.is_active) rowErrors.push('producto inactivo')
    if (product && product.category_id !== category.id) rowErrors.push('categoría incorrecta')
    if (product && !product.cover_image_url) rowErrors.push('sin imagen')
    if (product && [product.description, product.indications, product.usage_instructions, product.contraindications].some((value) => !cleanText(value))) rowErrors.push('textos incompletos')
    if (!variant?.is_active) rowErrors.push('variante inactiva o ausente')
    if (variant && variant.stock_quantity !== null) rowErrors.push('stock no ilimitado')
    if (variant && !variant.sku.startsWith('LIO-DIGE-')) rowErrors.push('SKU no autogenerado por LIORA')
    if (!price || price.amount_cents !== expected.priceCents || price.compare_at_cents !== expected.compareAtCents || price.currency !== 'PEN') rowErrors.push('precio incorrecto')
    if (tagCount !== expected.tagSlugs.length) rowErrors.push(`tags ${tagCount}/${expected.tagSlugs.length}`)
    errors.push(...rowErrors.map((error) => `${expected.slug}: ${error}`))
    return { name: expected.name, slug: expected.slug, sku: variant?.sku ?? null, price: price ? price.amount_cents / 100 : null, active: product?.is_active ?? false, unlimited: variant?.stock_quantity === null, tags: tagCount, errors: rowErrors }
  })

  console.log(JSON.stringify({
    mode: 'audit-production',
    category,
    expected: manifest.products.length,
    present: products?.length ?? 0,
    activeUnlimited: rows.filter((row) => row.active && row.unlimited).length,
    autoGeneratedSkus: rows.filter((row) => row.sku?.startsWith('LIO-DIGE-')).length,
    exactPrices: rows.filter((row) => !row.errors.includes('precio incorrecto')).length,
    errors,
    products: rows,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

async function main() {
  if (process.argv.includes('--prepare')) await prepare()
  else if (process.argv.includes('--apply')) await applyProduction()
  else if (process.argv.includes('--preflight-production')) await preflightProduction()
  else if (process.argv.includes('--audit-production')) await auditProduction()
  else await dryRun()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
