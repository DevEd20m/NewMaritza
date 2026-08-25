import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import sharp from 'sharp'

import { generateSkuBase } from '../src/lib/utils/generate-sku'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_DIR = join(ROOT, 'imports', 'aruma-body-2026-08-20')
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json')
const BUCKET = 'product-images'
const CATEGORY_SLUG = 'pies-cuerpo'
const SOURCE_CATEGORY_URL = 'https://www.aruma.pe/corporal-y-spa'
const API_URL = 'https://www.aruma.pe/api/catalog_system/pub/products/search/corporal-y-spa'
const SELECTED_IDS = [
  '1027183', '5621', '1026864', '892', '906', '1025825', '8072', '109',
  '1019224', '1022485', '2557', '1027080', '1020554', '1026574', '2638',
  '1018778', '1024963', '1022915', '1020055', '4770', '1599', '7424', '573',
  '1020511',
] as const

type Tier = 'económica' | 'media' | 'premium'

type Curation = {
  tier: Tier
  displayName: string
  presentation: string
  description: string
  indications: string
  usageInstructions: string
  contraindications: string
  tagSlugs: string[]
}

type VtexOffer = {
  Price?: number
  ListPrice?: number
  IsAvailable?: boolean
  AvailableQuantity?: number
}

type VtexProduct = {
  productId: string
  productName: string
  brand: string
  productReference?: string
  link?: string
  linkText?: string
  description?: string
  items?: Array<{
    itemId?: string
    ean?: string
    isKit?: boolean
    images?: Array<{ imageUrl?: string }>
    sellers?: Array<{ sellerDefault?: boolean; commertialOffer?: VtexOffer }>
  }>
  [key: string]: unknown
}

type ManifestProduct = {
  sourceProductId: string
  sourceItemId: string | null
  sourceReference: string | null
  sourceUrl: string
  sourceName: string
  name: string
  slug: string
  brand: string
  categorySlug: string
  tier: Tier
  description: string
  indications: string
  usageInstructions: string
  contraindications: string
  presentation: string
  priceCents: number
  compareAtCents: number | null
  sourceImageUrls: string[]
  localImages: string[]
  tagSlugs: string[]
}

type Manifest = {
  generatedAt: string
  sourceCategoryUrl: string
  categorySlug: string
  products: ManifestProduct[]
}

const DAILY_EXTERNAL = 'Uso externo. Evitar el contacto con ojos y mucosas; si ocurre, enjuagar con abundante agua. Suspender si aparece irritación persistente. Mantener fuera del alcance de los niños y revisar los ingredientes si existe alguna sensibilidad conocida.'
const EXFOLIANT_EXTERNAL = 'Uso externo. No aplicar sobre heridas, piel irritada o recién depilada. Evitar combinar el mismo día con otros exfoliantes corporales. Suspender ante irritación y usar protección solar en las zonas expuestas.'

const CURATION: Record<string, Curation> = {
  '1027183': {
    tier: 'económica', displayName: "Gel de Ducha con Vitamina C Dr Teal's", presentation: '473 ml',
    description: "Gel corporal de Dr Teal's para una limpieza diaria con una experiencia fresca y revitalizante. Su formato generoso permite incorporarlo fácilmente a la ducha de todos los días.",
    indications: 'Personas que buscan una limpieza corporal diaria, agradable y de precio accesible.',
    usageInstructions: 'Aplicar sobre la piel húmeda con las manos o una esponja, masajear hasta formar espuma y enjuagar completamente. Puede usarse a diario.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-cuerpo', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'momento-uso-diario'],
  },
  '5621': {
    tier: 'económica', displayName: "Loción Corporal de Lavanda Dr Teal's", presentation: '532 ml',
    description: "Loción corporal de rápida incorporación a la rutina nocturna. Combina el aroma relajante de lavanda con manteca de cacao, manteca de karité y vitamina E para dejar la piel confortable.",
    indications: 'Personas que buscan hidratación corporal y un momento de calma al final del día.',
    usageInstructions: 'Aplicar sobre la piel limpia y seca con masajes suaves hasta su absorción. Usar diariamente, especialmente después de la ducha o antes de dormir.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'objetivo-calma', 'uso-rutina-noche', 'nivel-principiante', 'intensidad-ligero', 'piel-seca', 'momento-antes-dormir', 'momento-uso-diario'],
  },
  '1026864': {
    tier: 'económica', displayName: 'Body Wash de Vainilla Daise Beauty', presentation: '500 ml',
    description: 'Limpiador corporal con aroma a vainilla pensado para transformar la ducha diaria en un momento cálido y agradable. Limpia la piel y deja una sensación perfumada.',
    indications: 'Personas que disfrutan los aromas dulces y buscan un gel corporal para uso cotidiano.',
    usageInstructions: 'Distribuir sobre la piel húmeda, masajear suavemente hasta generar espuma y enjuagar con abundante agua. Uso diario.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-cuerpo', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'momento-uso-diario'],
  },
  '892': {
    tier: 'económica', displayName: "Exfoliante Corporal de Lavanda Dr Teal's", presentation: '454 g',
    description: "Exfoliante corporal de Dr Teal's con sales de Epsom y aroma a lavanda. Ayuda a retirar células muertas mientras aporta una experiencia de spa en casa.",
    indications: 'Personas que buscan suavizar zonas ásperas y complementar su cuidado corporal semanal.',
    usageInstructions: 'Con la piel húmeda, masajear una cantidad moderada mediante movimientos circulares suaves y enjuagar. Usar una o dos veces por semana, sin frotar en exceso.',
    contraindications: EXFOLIANT_EXTERNAL,
    tagSlugs: ['objetivo-cuerpo', 'objetivo-calma', 'uso-hogar', 'uso-rutina-noche', 'nivel-intermedio', 'intensidad-completo', 'momento-noche', 'momento-uso-ocasional', 'alerta-piel-sensible', 'alerta-advertencia'],
  },
  '906': {
    tier: 'económica', displayName: "Sales de Baño de Lavanda Dr Teal's", presentation: '450 g',
    description: "Sales de baño con aroma a lavanda para crear un momento de descanso y bienestar en casa. Una opción accesible para acompañar baños relajantes o remojos de pies.",
    indications: 'Personas que buscan una experiencia de relajación en el baño o un remojo reconfortante para los pies.',
    usageInstructions: 'Disolver una cantidad moderada en agua tibia y disfrutar el baño o remojo. Enjuagar la piel al terminar y secar bien. Seguir la cantidad indicada en el envase.',
    contraindications: 'Uso externo; no ingerir. No usar sobre heridas abiertas o piel muy irritada. Tener cuidado con superficies resbalosas y consultar antes de usar si existe una condición cutánea activa.',
    tagSlugs: ['objetivo-calma', 'objetivo-pies', 'uso-hogar', 'uso-rutina-noche', 'nivel-principiante', 'intensidad-ligero', 'momento-antes-dormir', 'momento-uso-ocasional', 'alerta-advertencia'],
  },
  '1025825': {
    tier: 'económica', displayName: 'Crema Corporal con Vitamina C Babaria', presentation: '400 ml',
    description: 'Crema corporal con vitamina C y textura ligera para hidratar la piel sin una sensación pesada. Adecuada para una rutina diaria sencilla y luminosa.',
    indications: 'Personas que buscan hidratación cotidiana con una textura cómoda y de rápida absorción.',
    usageInstructions: 'Aplicar sobre la piel limpia y seca, extendiendo con masajes suaves hasta su absorción. Usar una o dos veces al día según necesidad.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'objetivo-cuerpo', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'piel-normal', 'piel-deshidratada', 'pref-textura-ligera', 'momento-uso-diario'],
  },
  '8072': {
    tier: 'económica', displayName: 'Crema de Manos So Fresh Tony Moly', presentation: '30 ml',
    description: 'Crema de manos compacta de Tony Moly, ideal para llevar en la cartera o mochila. Aporta suavidad en cualquier momento sin ocupar demasiado espacio.',
    indications: 'Personas que necesitan hidratar las manos durante el día y prefieren un formato portátil.',
    usageInstructions: 'Aplicar una pequeña cantidad sobre manos limpias y masajear hasta su absorción. Reaplicar después del lavado o cuando sea necesario.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'objetivo-cuerpo', 'uso-viaje', 'nivel-principiante', 'intensidad-ligero', 'piel-seca', 'pref-travel-size', 'momento-viaje', 'momento-uso-diario'],
  },
  '109': {
    tier: 'económica', displayName: 'Crema para Pies Secos y Agrietados Babaria', presentation: '150 ml',
    description: 'Crema específica para pies secos y zonas ásperas, formulada con urea, aloe vera y aceite de almendras. Ayuda a mejorar la sensación de suavidad con el uso constante.',
    indications: 'Personas con pies secos, talones ásperos o sensación de tirantez que buscan cuidado diario.',
    usageInstructions: 'Aplicar sobre pies limpios y completamente secos, insistiendo en talones y zonas ásperas. Masajear hasta su absorción, preferentemente por la noche.',
    contraindications: 'Uso externo. No aplicar sobre grietas sangrantes, heridas o signos de infección. Suspender ante irritación. Las personas con diabetes o problemas circulatorios deben consultar antes de tratar lesiones en los pies.',
    tagSlugs: ['objetivo-pies', 'objetivo-hidratacion', 'uso-rutina-noche', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'momento-noche', 'momento-uso-diario', 'alerta-consulta'],
  },
  '1019224': {
    tier: 'media', displayName: 'Bálsamo Reparador Cicaplast Baume B5 La Roche-Posay', presentation: '40 ml',
    description: 'Bálsamo multipropósito para calmar y acompañar la reparación de piel sensibilizada o con la barrera alterada. Su formato de 40 ml resulta práctico para llevar y usar en zonas puntuales.',
    indications: 'Adultos y familias que buscan proteger zonas resecas, irritadas o sensibilizadas del rostro y cuerpo.',
    usageInstructions: 'Aplicar una capa fina sobre la piel limpia y seca una o dos veces al día. No colocar directamente sobre heridas abiertas. Seguir las indicaciones del envase para cada zona.',
    contraindications: 'Uso externo. Evitar el contorno inmediato de los ojos y heridas abiertas. Suspender ante una reacción inesperada. Consultar si la irritación es extensa, dolorosa o persistente.',
    tagSlugs: ['objetivo-barrera', 'objetivo-piel', 'uso-familia', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-completo', 'piel-barrera-alterada', 'piel-seca', 'piel-sensible', 'pref-travel-size', 'momento-uso-diario', 'alerta-consulta'],
  },
  '1022485': {
    tier: 'media', displayName: 'Exfoliante Corporal Watermelon Tree Hut', presentation: '510 g',
    description: 'Exfoliante corporal de textura granulada y aroma a sandía para pulir la piel y dejarla suave. Su presentación grande funciona bien en una rutina de spa en casa.',
    indications: 'Personas que buscan mejorar la textura de zonas ásperas y disfrutan aromas frutales.',
    usageInstructions: 'Aplicar sobre piel húmeda con movimientos circulares suaves y enjuagar bien. Usar una o dos veces por semana y complementar con hidratante corporal.',
    contraindications: EXFOLIANT_EXTERNAL,
    tagSlugs: ['objetivo-cuerpo', 'objetivo-piel', 'uso-hogar', 'nivel-intermedio', 'intensidad-completo', 'momento-uso-ocasional', 'alerta-piel-sensible', 'alerta-advertencia'],
  },
  '2557': {
    tier: 'media', displayName: 'Crema Corporal Hydro Boost Neutrogena', presentation: '400 ml',
    description: 'Hidratante corporal de Neutrogena con una textura fresca y ligera, diseñada para aportar confort sin dejar una sensación pesada. Ideal para quienes quieren vestirse poco después de aplicarla.',
    indications: 'Personas con piel normal o deshidratada que prefieren hidratantes corporales livianos.',
    usageInstructions: 'Aplicar diariamente sobre la piel limpia, especialmente después de la ducha. Masajear hasta su absorción y reaplicar en zonas que lo necesiten.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'piel-normal', 'piel-deshidratada', 'pref-textura-ligera', 'momento-uso-diario'],
  },
  '1027080': {
    tier: 'media', displayName: 'Exfoliante Corporal de Piña Daise Beauty', presentation: '500 g',
    description: 'Exfoliante corporal con aroma tropical a piña para retirar células muertas y aportar una sensación de piel renovada. Una alternativa divertida para el spa semanal en casa.',
    indications: 'Personas que buscan suavizar la textura corporal con una experiencia aromática frutal.',
    usageInstructions: 'Masajear suavemente sobre piel húmeda mediante movimientos circulares y enjuagar. Usar una o dos veces por semana, evitando zonas sensibles.',
    contraindications: EXFOLIANT_EXTERNAL,
    tagSlugs: ['objetivo-cuerpo', 'objetivo-piel', 'uso-hogar', 'nivel-intermedio', 'intensidad-completo', 'momento-uso-ocasional', 'alerta-piel-sensible', 'alerta-advertencia'],
  },
  '1020554': {
    tier: 'media', displayName: 'Manteca Corporal Coco Colada Tree Hut', presentation: '240 g',
    description: 'Manteca corporal de textura rica y aroma tropical a coco para envolver la piel en hidratación. Recomendada para zonas secas o para quienes prefieren acabados más nutritivos.',
    indications: 'Personas con piel seca o zonas ásperas que buscan una hidratación corporal de mayor intensidad.',
    usageInstructions: 'Aplicar sobre la piel limpia y seca, concentrándose en codos, rodillas y otras zonas resecas. Masajear hasta su absorción; usar diariamente según necesidad.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'uso-rutina-noche', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'momento-noche', 'momento-uso-diario'],
  },
  '1026574': {
    tier: 'media', displayName: 'Aceite Corporal Gotta Glow Beauty Creations x Barbie', presentation: '100 ml',
    description: 'Aceite corporal de edición Beauty Creations x Barbie para aportar brillo y una apariencia luminosa a la piel. Se puede usar solo o como último paso sobre una crema corporal.',
    indications: 'Personas que buscan un acabado luminoso y un producto corporal con estética de tendencia.',
    usageInstructions: 'Aplicar pocas gotas sobre la piel limpia, preferentemente ligeramente húmeda, y masajear. Dejar absorber antes de vestirse. Usar según la intensidad de brillo deseada.',
    contraindications: 'Uso externo. Evitar ojos, mucosas y piel irritada. Puede dejar superficies resbalosas; lavar las manos después de aplicar. Suspender ante irritación.',
    tagSlugs: ['objetivo-hidratacion', 'objetivo-cuerpo', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-ligero', 'pref-cruelty-free', 'pref-textura-ligera', 'momento-uso-ocasional'],
  },
  '2638': {
    tier: 'media', displayName: 'Crema Corporal Milk Nutritiva Nivea', presentation: '400 ml',
    description: 'Loción corporal nutritiva de Nivea para piel extra seca. Su formato familiar ofrece una opción rendidora para recuperar confort en brazos, piernas y zonas con tirantez.',
    indications: 'Personas con piel seca o extra seca que necesitan hidratación corporal diaria.',
    usageInstructions: 'Aplicar generosamente sobre la piel limpia y masajear hasta su absorción. Repetir a diario, en especial después de la ducha.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'uso-familia', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'momento-uso-diario'],
  },
  '1018778': {
    tier: 'media', displayName: 'Crema Corporal Reafirmante ISDIN Woman', presentation: '200 ml',
    description: 'Crema corporal de ISDIN orientada al cuidado de la firmeza y elasticidad de la piel. Se integra a una rutina diaria mediante masaje, especialmente en zonas que necesitan atención localizada.',
    indications: 'Personas adultas que buscan acompañar el cuidado de la firmeza y elasticidad corporal.',
    usageInstructions: 'Aplicar una o dos veces al día sobre la piel limpia y seca mediante masajes ascendentes hasta su absorción. La constancia es clave en este tipo de rutina.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-cuerpo', 'objetivo-piel', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'piel-normal', 'momento-uso-diario'],
  },
  '1024963': {
    tier: 'premium', displayName: 'Crema Corporal Anti-Pigment Eucerin', presentation: '200 ml',
    description: 'Tratamiento corporal de Eucerin enfocado en manchas y tono desigual. Una opción dermocosmética para zonas corporales que requieren cuidado constante y protección frente al sol.',
    indications: 'Personas adultas que buscan mejorar la apariencia de manchas corporales y unificar visualmente el tono.',
    usageInstructions: 'Aplicar sobre las zonas corporales indicadas, respetando la frecuencia y el límite de aplicaciones señalado en el envase. Durante el día, proteger del sol las áreas expuestas.',
    contraindications: 'Uso externo. Evitar ojos, mucosas, heridas y piel irritada. No combinar sin orientación con otros tratamientos despigmentantes en la misma zona. Suspender ante irritación y consultar si existe una condición dermatológica activa.',
    tagSlugs: ['objetivo-piel', 'objetivo-cuerpo', 'uso-rutina-dia', 'nivel-intermedio', 'intensidad-completo', 'piel-normal', 'momento-uso-diario', 'alerta-piel-sensible', 'alerta-advertencia', 'alerta-consulta'],
  },
  '1022915': {
    tier: 'premium', displayName: 'Crema Hidratante Atoderm Creme Ultra Bioderma', presentation: '500 ml',
    description: 'Crema hidratante de Bioderma para el cuidado diario de piel normal a seca y sensible. Su envase de 500 ml es práctico para el uso corporal frecuente o familiar.',
    indications: 'Personas y familias con piel seca o sensible que necesitan hidratación corporal cotidiana.',
    usageInstructions: 'Aplicar una o dos veces al día sobre piel limpia y seca. Masajear hasta su absorción, especialmente en las zonas con mayor sequedad.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'objetivo-barrera', 'uso-familia', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'piel-sensible', 'piel-barrera-alterada', 'momento-uso-diario'],
  },
  '1020055': {
    tier: 'premium', displayName: 'Aceite de Ducha Atoderm Bioderma', presentation: '1 L',
    description: 'Aceite limpiador corporal de Bioderma en formato de un litro, pensado para limpiar con suavidad y reducir la sensación de tirantez en piel seca o sensible.',
    indications: 'Personas y familias con piel seca, muy seca o sensible que buscan una limpieza corporal suave.',
    usageInstructions: 'Aplicar sobre la piel húmeda, masajear suavemente y enjuagar. Secar sin frotar. Puede incorporarse a la ducha diaria.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-barrera', 'objetivo-hidratacion', 'objetivo-cuerpo', 'uso-familia', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'piel-sensible', 'piel-barrera-alterada', 'momento-uso-diario'],
  },
  '4770': {
    tier: 'premium', displayName: 'Spray Corporal Acniben Body ISDIN', presentation: '150 ml',
    description: 'Spray corporal de ISDIN diseñado para piel con tendencia a imperfecciones en espalda, pecho u otras zonas de difícil acceso. El formato permite una aplicación práctica y uniforme.',
    indications: 'Personas con piel grasa o tendencia a brotes corporales que buscan un tratamiento específico para espalda y pecho.',
    usageInstructions: 'Agitar y pulverizar sobre la piel limpia y seca a la distancia indicada en el envase. Dejar secar antes de vestirse. No aplicar en el rostro ni exceder la frecuencia recomendada.',
    contraindications: 'Uso externo. No aplicar sobre rostro, mucosas, heridas o piel irritada. Puede aumentar la sensibilidad; evitar otros exfoliantes en la misma zona y usar protección solar cuando quede expuesta. Suspender y consultar ante irritación intensa.',
    tagSlugs: ['objetivo-piel', 'objetivo-cuerpo', 'uso-rutina-noche', 'nivel-intermedio', 'intensidad-completo', 'piel-grasa', 'piel-brotes', 'momento-noche', 'momento-uso-diario', 'alerta-piel-sensible', 'alerta-advertencia', 'alerta-consulta'],
  },
  '1599': {
    tier: 'premium', displayName: 'Limpiador Lipikar Syndet AP+ La Roche-Posay', presentation: '400 ml',
    description: 'Crema limpiadora corporal suave de La Roche-Posay para piel seca, muy seca o sensible. Ayuda a limpiar sin acentuar la sensación de tirantez y encaja en rutinas familiares.',
    indications: 'Personas y familias con piel seca, sensible o con barrera alterada que necesitan una limpieza gentil.',
    usageInstructions: 'Aplicar una pequeña cantidad sobre piel húmeda, masajear con suavidad y enjuagar. Secar con toques, sin frotar. Usar en la ducha diaria.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-barrera', 'objetivo-cuerpo', 'uso-familia', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'piel-sensible', 'piel-barrera-alterada', 'momento-uso-diario'],
  },
  '7424': {
    tier: 'premium', displayName: 'Loción Reparadora Ureadin Ultra 10 ISDIN', presentation: '200 ml',
    description: 'Loción corporal de ISDIN con urea y dexpantenol para suavizar piel áspera, engrosada o muy seca. Ofrece un cuidado intensivo para zonas que necesitan más que una hidratante ligera.',
    indications: 'Personas con piel muy seca, descamación o zonas corporales ásperas que buscan cuidado intensivo.',
    usageInstructions: 'Aplicar una o dos veces al día sobre piel limpia y seca, insistiendo en las zonas ásperas. Lavar las manos después y respetar las indicaciones del envase.',
    contraindications: 'Uso externo. Puede producir escozor en piel agrietada o muy irritada. No aplicar sobre heridas, mucosas ni contorno de ojos. Suspender ante irritación persistente y consultar si la descamación es extensa.',
    tagSlugs: ['objetivo-barrera', 'objetivo-hidratacion', 'uso-rutina-noche', 'nivel-intermedio', 'intensidad-completo', 'piel-seca', 'piel-barrera-alterada', 'momento-noche', 'momento-uso-diario', 'alerta-piel-sensible', 'alerta-advertencia'],
  },
  '573': {
    tier: 'premium', displayName: 'Crema Hidratante Cetaphil', presentation: '453 g',
    description: 'Crema hidratante de Cetaphil con textura rica para piel seca y sensible. Su presentación grande permite atender rostro, manos y zonas corporales que necesitan confort duradero.',
    indications: 'Personas y familias con piel seca o sensible que prefieren una crema nutritiva y versátil.',
    usageInstructions: 'Aplicar sobre la piel limpia tantas veces como sea necesario, especialmente después del baño y en zonas resecas. Masajear hasta su absorción.',
    contraindications: DAILY_EXTERNAL,
    tagSlugs: ['objetivo-hidratacion', 'objetivo-barrera', 'uso-familia', 'uso-rutina-dia', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'piel-sensible', 'momento-uso-diario'],
  },
  '1020511': {
    tier: 'premium', displayName: 'Ungüento Reparador Aquaphor Eucerin', presentation: '55 ml',
    description: 'Ungüento reparador multipropósito para proteger zonas muy secas, agrietadas o sensibilizadas. Su formato compacto es útil para labios, manos, cutículas y puntos localizados del cuerpo.',
    indications: 'Personas con zonas de piel muy seca o agrietada que buscan una barrera protectora sin fragancia.',
    usageInstructions: 'Aplicar una capa fina sobre la zona limpia y seca tantas veces como sea necesario. Usar solo en piel ya cerrada, no sobre heridas abiertas o húmedas.',
    contraindications: 'Uso externo. No aplicar sobre heridas abiertas, infectadas o con secreción. Evitar ojos y mucosas. Consultar si la lesión no mejora o presenta dolor, calor o inflamación.',
    tagSlugs: ['objetivo-barrera', 'objetivo-hidratacion', 'uso-viaje', 'nivel-principiante', 'intensidad-completo', 'piel-seca', 'piel-barrera-alterada', 'piel-sensible', 'pref-sin-fragancia', 'pref-travel-size', 'momento-viaje', 'momento-uso-diario', 'alerta-consulta'],
  },
}

dotenv.config({ path: process.env.IMPORT_ENV_PATH || join(ROOT, '.env.local'), quiet: true })

function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 88)
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

function tokenSimilarity(left: string, right: string): number {
  const a = new Set(normalize(left).split(' ').filter(Boolean))
  const b = new Set(normalize(right).split(' ').filter(Boolean))
  const intersection = [...a].filter((token) => b.has(token)).length
  const union = new Set([...a, ...b]).size
  return union ? intersection / union : 0
}

function pickOffer(product: VtexProduct) {
  for (const item of product.items ?? []) {
    if (item.isKit) continue
    const seller = item.sellers?.find((candidate) => candidate.sellerDefault && candidate.commertialOffer?.IsAvailable)
      ?? item.sellers?.find((candidate) => candidate.commertialOffer?.IsAvailable)
    if (seller?.commertialOffer?.Price && seller.commertialOffer.Price > 0) {
      return { item, offer: seller.commertialOffer }
    }
  }
  return null
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function fetchCatalog(): Promise<VtexProduct[]> {
  const ranges: Array<[number, number]> = [[0, 49], [50, 99], [100, 149]]
  const pages = []
  for (const [from, to] of ranges) {
    const response = await fetch(`${API_URL}?O=OrderByTopSaleDESC&_from=${from}&_to=${to}`, {
      headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 LIORA catalog curation' },
    })
    if (!response.ok) throw new Error(`Aruma respondió ${response.status} para el rango ${from}-${to}`)
    const rows = await response.json() as VtexProduct[]
    pages.push(...rows)
    if (rows.length < to - from + 1) break
  }
  return pages
}

async function prepare() {
  const catalog = await fetchCatalog()
  const byId = new Map(catalog.map((product) => [String(product.productId), product]))
  const missing = SELECTED_IDS.filter((id) => !byId.has(id))
  if (missing.length) throw new Error(`No se encontraron ${missing.length} productos seleccionados en Aruma: ${missing.join(', ')}`)

  await mkdir(OUTPUT_DIR, { recursive: true })
  const products: ManifestProduct[] = []

  for (const [position, sourceId] of SELECTED_IDS.entries()) {
    const source = byId.get(sourceId)!
    const curation = CURATION[sourceId]
    if (!curation) throw new Error(`Falta curaduría para ${sourceId}`)
    const chosen = pickOffer(source)
    if (!chosen) throw new Error(`Producto sin oferta disponible: ${source.productName} (${sourceId})`)

    const priceCents = Math.round(Number(chosen.offer.Price) * 100)
    const listCents = Math.round(Number(chosen.offer.ListPrice ?? chosen.offer.Price) * 100)
    const imageUrls = [...new Set((chosen.item.images ?? []).map((image) => image.imageUrl).filter((url): url is string => Boolean(url)))].slice(0, 5)
    if (!imageUrls.length) throw new Error(`Producto sin imágenes: ${source.productName} (${sourceId})`)

    const slug = `${slugify(curation.displayName)}-${sourceId}`
    const imageDir = join(OUTPUT_DIR, 'images', slug)
    await mkdir(imageDir, { recursive: true })
    const localImages: string[] = []

    for (const [index, imageUrl] of imageUrls.entries()) {
      const destination = join(imageDir, `${String(index + 1).padStart(2, '0')}.webp`)
      if (!(await exists(destination))) {
        const response = await fetch(imageUrl, { headers: { 'user-agent': 'Mozilla/5.0 LIORA catalog curation' } })
        if (!response.ok) throw new Error(`Imagen ${response.status}: ${imageUrl}`)
        const sourceBuffer = Buffer.from(await response.arrayBuffer())
        await sharp(sourceBuffer)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90, effort: 4 })
          .toFile(destination)
      }
      localImages.push(relative(ROOT, destination))
    }

    products.push({
      sourceProductId: sourceId,
      sourceItemId: cleanText(chosen.item.itemId) || null,
      sourceReference: cleanText(source.productReference) || null,
      sourceUrl: cleanText(source.link) || `${SOURCE_CATEGORY_URL}/${cleanText(source.linkText)}`,
      sourceName: cleanText(source.productName),
      name: curation.displayName,
      slug,
      brand: cleanText(source.brand),
      categorySlug: CATEGORY_SLUG,
      tier: curation.tier,
      description: curation.description,
      indications: curation.indications,
      usageInstructions: curation.usageInstructions,
      contraindications: curation.contraindications,
      presentation: curation.presentation,
      priceCents,
      compareAtCents: listCents > priceCents ? listCents : null,
      sourceImageUrls: imageUrls,
      localImages,
      tagSlugs: [...new Set(curation.tagSlugs)],
    })
    console.log(`Preparado ${position + 1}/${SELECTED_IDS.length}: ${curation.displayName} — S/${(priceCents / 100).toFixed(2)}`)
  }

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    sourceCategoryUrl: SOURCE_CATEGORY_URL,
    categorySlug: CATEGORY_SLUG,
    products,
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(JSON.stringify({
    manifest: relative(ROOT, MANIFEST_PATH),
    products: products.length,
    images: products.reduce((sum, product) => sum + product.localImages.length, 0),
    tiers: Object.fromEntries(['económica', 'media', 'premium'].map((tier) => [tier, products.filter((product) => product.tier === tier).length])),
    prices: products.map((product) => ({ name: product.name, price: product.priceCents / 100, compareAt: product.compareAtCents ? product.compareAtCents / 100 : null })),
  }, null, 2))
}

async function readManifest(): Promise<Manifest> {
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as Manifest
}

function validateManifest(manifest: Manifest) {
  const errors: string[] = []
  if (manifest.categorySlug !== CATEGORY_SLUG) errors.push(`Categoría inesperada: ${manifest.categorySlug}`)
  if (manifest.products.length !== SELECTED_IDS.length) errors.push(`Se esperaban ${SELECTED_IDS.length} productos y hay ${manifest.products.length}`)
  const ids = new Set<string>()
  const slugs = new Set<string>()
  for (const product of manifest.products) {
    if (ids.has(product.sourceProductId)) errors.push(`ID de origen duplicado: ${product.sourceProductId}`)
    if (slugs.has(product.slug)) errors.push(`Slug duplicado: ${product.slug}`)
    ids.add(product.sourceProductId)
    slugs.add(product.slug)
    if (!SELECTED_IDS.includes(product.sourceProductId as typeof SELECTED_IDS[number])) errors.push(`Producto no seleccionado: ${product.sourceProductId}`)
    for (const field of ['name', 'brand', 'description', 'indications', 'usageInstructions', 'contraindications', 'presentation'] as const) {
      if (!cleanText(product[field])) errors.push(`${product.slug}: falta ${field}`)
    }
    if (!Number.isInteger(product.priceCents) || product.priceCents <= 0) errors.push(`${product.slug}: precio inválido`)
    if (!product.localImages.length || product.localImages.length > 5) errors.push(`${product.slug}: cantidad de imágenes inválida`)
    if (product.tagSlugs.length < 4) errors.push(`${product.slug}: faltan tags de recomendación`)
    for (const localImage of product.localImages) {
      if (!resolve(ROOT, localImage).startsWith(OUTPUT_DIR)) errors.push(`${product.slug}: ruta de imagen fuera de la importación`)
    }
  }
  for (const id of SELECTED_IDS) if (!ids.has(id)) errors.push(`Falta el producto seleccionado ${id}`)
  return errors
}

async function dryRun() {
  const manifest = await readManifest()
  const errors = validateManifest(manifest)
  for (const product of manifest.products) {
    for (const image of product.localImages) if (!(await exists(resolve(ROOT, image)))) errors.push(`${product.slug}: imagen local ausente ${image}`)
  }
  const skuBases = manifest.products.map((product) => ({
    name: product.name,
    skuBase: generateSkuBase(CATEGORY_SLUG, product.name, product.presentation),
  }))
  console.log(JSON.stringify({
    mode: 'dry-run',
    products: manifest.products.length,
    images: manifest.products.reduce((sum, product) => sum + product.localImages.length, 0),
    tiers: Object.fromEntries(['económica', 'media', 'premium'].map((tier) => [tier, manifest.products.filter((product) => product.tier === tier).length])),
    minPrice: Math.min(...manifest.products.map((product) => product.priceCents)) / 100,
    maxPrice: Math.max(...manifest.products.map((product) => product.priceCents)) / 100,
    errors,
    skuBases,
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

async function preflightProduction(admin: SupabaseClient, manifest: Manifest) {
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
  if (!category) errors.push(`La categoría existente ${CATEGORY_SLUG} no existe; el importador no la creará`)

  const existingProducts = products ?? []
  for (const candidate of manifest.products) {
    const exact = existingProducts.find((product) => product.slug === candidate.slug || (
      normalize(product.brand) === normalize(candidate.brand) && normalize(product.name) === normalize(candidate.name)
    ))
    if (exact) errors.push(`${candidate.name}: ya existe ${exact.name} (${exact.slug})`)
    const fuzzy = existingProducts
      .filter((product) => normalize(product.brand) === normalize(candidate.brand))
      .map((product) => ({ product, score: tokenSimilarity(candidate.name, product.name) }))
      .filter((match) => match.score >= 0.72)
      .sort((left, right) => right.score - left.score)[0]
    if (fuzzy && fuzzy.product.slug !== exact?.slug) errors.push(`${candidate.name}: posible duplicado ${fuzzy.product.name} (${fuzzy.score.toFixed(2)})`)
  }

  const tagBySlug = new Map((tags ?? []).map((tag) => [tag.slug, tag.id]))
  for (const tag of new Set(manifest.products.flatMap((product) => product.tagSlugs))) {
    if (!tagBySlug.has(tag)) errors.push(`Tag inexistente: ${tag}`)
  }

  return {
    errors,
    category,
    products: existingProducts,
    usedSkus: new Set((variants ?? []).map((variant) => normalize(variant.sku))),
    tagBySlug,
  }
}

async function applyProduction() {
  const manifest = await readManifest()
  const admin = getAdmin()
  const preflight = await preflightProduction(admin, manifest)
  if (preflight.errors.length || !preflight.category) {
    console.error(JSON.stringify({ mode: 'apply', status: 'blocked-by-preflight', errors: preflight.errors }, null, 2))
    process.exitCode = 1
    return
  }

  const created: Array<{ id: string; slug: string; sku: string; price: number }> = []
  for (const [position, product] of manifest.products.entries()) {
    const uploadedPaths: string[] = []
    let productId: string | null = null
    try {
      const publicUrls: string[] = []
      for (const [index, localImage] of product.localImages.slice(0, 5).entries()) {
        const storagePath = `products/${product.slug}/${index === 0 ? 'cover' : `gallery-${index}`}.webp`
        const imageBuffer = await readFile(resolve(ROOT, localImage))
        const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, imageBuffer, {
          upsert: false,
          contentType: 'image/webp',
          cacheControl: '31536000',
        })
        if (uploadError) throw uploadError
        uploadedPaths.push(storagePath)
        const { data } = admin.storage.from(BUCKET).getPublicUrl(storagePath)
        publicUrls.push(data.publicUrl)
      }

      const { data: productRow, error: productError } = await admin.from('products').insert({
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        category_id: preflight.category.id,
        cover_image_url: publicUrls[0],
        gallery_urls: publicUrls.slice(1, 5),
        usage_instructions: product.usageInstructions,
        indications: product.indications,
        contraindications: product.contraindications,
        is_active: true,
      }).select('id').single()
      if (productError) throw productError
      productId = productRow.id

      const skuBase = generateSkuBase(CATEGORY_SLUG, product.name, product.presentation)
      const sku = uniqueSku(skuBase, preflight.usedSkus)
      const { data: variantRow, error: variantError } = await admin.from('product_variants').insert({
        product_id: productId,
        sku,
        name: product.presentation,
        is_active: true,
        stock_quantity: null,
      }).select('id').single()
      if (variantError) throw variantError

      const { error: priceError } = await admin.from('product_prices').insert({
        variant_id: variantRow.id,
        currency: 'PEN',
        amount_cents: product.priceCents,
        compare_at_cents: product.compareAtCents,
        effective_from: new Date().toISOString(),
        effective_to: null,
      })
      if (priceError) throw priceError

      const tagRows = product.tagSlugs.map((slug) => ({ product_id: productId!, tag_id: preflight.tagBySlug.get(slug)! }))
      const { error: tagError } = await admin.from('product_tags').insert(tagRows)
      if (tagError) throw tagError

      preflight.usedSkus.add(normalize(sku))
      created.push({ id: productId, slug: product.slug, sku, price: product.priceCents / 100 })
      console.log(`Publicado ${position + 1}/${manifest.products.length}: ${product.name} — ${sku}`)
    } catch (error) {
      if (productId) await admin.from('products').delete().eq('id', productId)
      if (uploadedPaths.length) await admin.storage.from(BUCKET).remove(uploadedPaths)
      throw new Error(`Falló ${product.name}; se revirtió su carga: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log(JSON.stringify({ mode: 'apply', status: 'published', category: preflight.category, products: created.length, active: true, stock: 'unlimited', created }, null, 2))
}

async function auditProduction() {
  const manifest = await readManifest()
  const admin = getAdmin()
  const slugs = manifest.products.map((product) => product.slug)
  const { data: category, error: categoryError } = await admin.from('categories').select('id,name,slug').eq('slug', CATEGORY_SLUG).single()
  if (categoryError) throw categoryError
  const { data: products, error: productsError } = await admin
    .from('products')
    .select('id,name,slug,brand,category_id,is_active,cover_image_url,gallery_urls,description,usage_instructions,indications,contraindications')
    .in('slug', slugs)
    .range(0, 99)
  if (productsError) throw productsError
  const productIds = (products ?? []).map((product) => product.id)
  const [{ data: variants, error: variantsError }, { data: pivots, error: pivotsError }] = await Promise.all([
    admin.from('product_variants').select('id,product_id,sku,name,is_active,stock_quantity').in('product_id', productIds).range(0, 99),
    admin.from('product_tags').select('product_id,tag_id').in('product_id', productIds).range(0, 999),
  ])
  if (variantsError) throw variantsError
  if (pivotsError) throw pivotsError
  const variantIds = (variants ?? []).map((variant) => variant.id)
  const { data: prices, error: pricesError } = await admin.from('product_prices').select('variant_id,currency,amount_cents,compare_at_cents,effective_to').in('variant_id', variantIds).range(0, 99)
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
    if (product && (!product.cover_image_url || (product.gallery_urls ?? []).length !== Math.max(0, expected.localImages.length - 1))) rowErrors.push('imágenes incompletas')
    if (product && [product.description, product.indications, product.usage_instructions, product.contraindications].some((value) => !cleanText(value))) rowErrors.push('textos incompletos')
    if (!variant?.is_active) rowErrors.push('variante inactiva o ausente')
    if (variant && variant.stock_quantity !== null) rowErrors.push('stock no ilimitado')
    if (variant && !variant.sku.startsWith('LIO-PIES-')) rowErrors.push('SKU no autogenerado por LIORA')
    if (variant && (/^\d+$/.test(variant.sku) || variant.sku === expected.sourceReference)) rowErrors.push('SKU heredado del proveedor')
    if (!price || price.amount_cents !== expected.priceCents || price.compare_at_cents !== expected.compareAtCents || price.currency !== 'PEN') rowErrors.push('precio incorrecto')
    if (tagCount !== expected.tagSlugs.length) rowErrors.push(`tags ${tagCount}/${expected.tagSlugs.length}`)
    errors.push(...rowErrors.map((error) => `${expected.slug}: ${error}`))
    return { name: expected.name, slug: expected.slug, sku: variant?.sku ?? null, price: price?.amount_cents ? price.amount_cents / 100 : null, active: product?.is_active ?? false, unlimited: variant?.stock_quantity === null, images: product ? 1 + (product.gallery_urls ?? []).length : 0, tags: tagCount, errors: rowErrors }
  })

  const allProductsResult = await admin.from('products').select('id,name,slug,brand').range(0, 1999)
  if (allProductsResult.error) throw allProductsResult.error
  for (const expected of manifest.products) {
    const imported = rows.find((row) => row.slug === expected.slug)
    const matches = (allProductsResult.data ?? []).filter((candidate) =>
      candidate.slug !== imported?.slug && normalize(candidate.brand) === normalize(expected.brand) && normalize(candidate.name) === normalize(expected.name),
    )
    if (matches.length) errors.push(`${expected.slug}: duplicado exacto externo ${matches.map((match) => match.slug).join(', ')}`)
  }

  console.log(JSON.stringify({
    mode: 'audit-production',
    category,
    expected: manifest.products.length,
    present: products?.length ?? 0,
    activeUnlimited: rows.filter((row) => row.active && row.unlimited).length,
    autoGeneratedSkus: rows.filter((row) => row.sku?.startsWith('LIO-PIES-')).length,
    exactPrices: rows.filter((row) => !row.errors.includes('precio incorrecto')).length,
    errors,
    products: rows,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

async function main() {
  const mode = process.argv.includes('--prepare')
    ? 'prepare'
    : process.argv.includes('--apply')
      ? 'apply'
      : process.argv.includes('--audit-production')
        ? 'audit-production'
        : 'dry-run'

  if (mode === 'prepare') await prepare()
  else if (mode === 'apply') await applyProduction()
  else if (mode === 'audit-production') await auditProduction()
  else await dryRun()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
