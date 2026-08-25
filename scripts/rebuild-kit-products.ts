import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

type Step = {
  variantId: string
  label: string
  when: string
  instruction: string
}

type KitPlan = {
  name: string
  slug: string
  expectedCover: string
  beforeCents: number
  steps: Step[]
}

const PLANS: KitPlan[] = [
  {
    name: 'Kit Dolor Muscular Leve',
    slug: 'kit-dolor-muscular-leve',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/kit-dolor-muscular-leve/cover-1784166526036.png',
    beforeCents: 28890,
    steps: [
      {
        variantId: '91bb1f47-345a-48ad-9dfb-88fa54139573',
        label: 'Baño de recuperación',
        when: '🌙 Al terminar la jornada',
        instruction: 'Disuelve la cantidad indicada en el envase en agua tibia y úsala como remojo. No aplicar sobre heridas ni sustituir la evaluación de una lesión.',
      },
      {
        variantId: '98a8fb59-2f27-4f2f-9ed1-2671e0ba9be2',
        label: 'Masaje suave',
        when: '💆 Después del baño',
        instruction: 'Aplica sobre piel intacta con un masaje suave, sin presionar una zona lesionada, inflamada o con dolor intenso.',
      },
      {
        variantId: '076dfb77-1ad6-4e9b-9762-d49549ee8dce',
        label: 'Soporte complementario',
        when: '🍽️ Según la etiqueta',
        instruction: 'Usa únicamente la porción indicada por el fabricante. Consulta antes si tomas anticoagulantes, tienes cálculos biliares, estás embarazada o en lactancia.',
      },
    ],
  },
  {
    name: 'Kit Protector Solar Playa y Outdoor',
    slug: 'kit-protector-solar-playa-y-outdoor',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/kit-protector-solar-playa-y-outdoor/cover-1784167135958.png',
    beforeCents: 68580,
    steps: [
      {
        variantId: '416f7f91-162c-4143-bcbd-f8bbb3f0ddbd',
        label: 'Protección facial',
        when: '☀️ Antes de exponerte',
        instruction: 'Aplica una cantidad generosa y uniforme en rostro y cuello antes de salir. Reaplica tras nadar, sudar o secarte y según la etiqueta.',
      },
      {
        variantId: '7a68ad44-7387-4736-a684-43b95abec3c9',
        label: 'Protección corporal',
        when: '🏖️ Antes de exponerte',
        instruction: 'Cubre brazos, piernas, hombros y demás zonas expuestas. Reaplica con frecuencia y después del agua, sudor o uso de toalla.',
      },
      {
        variantId: '0622b2ba-d0b2-46d7-a646-ab68aec68e0c',
        label: 'Protección de labios',
        when: '👄 Durante la exposición',
        instruction: 'Desliza sobre los labios antes de salir y reaplica durante el día, especialmente después de comer, beber o entrar al agua.',
      },
    ],
  },
  {
    name: 'Kit Viaje Esencial',
    slug: 'kit-viaje-esencial',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/kit-viaje-esencial/cover.png',
    beforeCents: 20770,
    steps: [
      {
        variantId: 'e53dd0d5-31ae-493b-a1c9-50dcb3e81a1b',
        label: 'Higiene portátil',
        when: '✈️ Durante traslados',
        instruction: 'Aplica en las manos cuando no dispongas de agua y jabón. Deja secar por completo y mantenlo alejado de fuego y ojos.',
      },
      {
        variantId: '845627b6-498d-40c8-9d5d-0e8165c00b22',
        label: 'Hidratación de manos',
        when: '🧴 Después de higienizar',
        instruction: 'Aplica una pequeña cantidad sobre manos limpias y masajea hasta absorber. Suspende si aparece irritación.',
      },
      {
        variantId: '11abf17a-f19d-41b7-b553-56140acc67f8',
        label: 'Cuidado labial',
        when: '👄 En ruta',
        instruction: 'Aplica sobre los labios y reaplica según necesidad ante aire acondicionado, frío o viento.',
      },
      {
        variantId: '5521e94a-d875-4027-92ce-ab050ed41598',
        label: 'Roce y cortes menores',
        when: '🥾 Caminatas',
        instruction: 'Limpia y seca la piel antes de colocar. Úsala solo en lesiones menores; busca atención ante heridas profundas, sucias o infectadas.',
      },
      {
        variantId: '0b72c7ce-ef1f-4710-81f9-77f354613a0c',
        label: 'Limpieza express',
        when: '🌙 Al final del día',
        instruction: 'Pasa suavemente por el rostro evitando el contacto directo con los ojos. No frotes la piel irritada.',
      },
      {
        variantId: 'ec92320d-27c3-480e-987d-ae90860a4d7f',
        label: 'Ajuste puntual del sueño',
        when: '😴 Según etiqueta y horario de destino',
        instruction: 'Usa solo la dosis indicada por el fabricante. No combines con alcohol o sedantes ni conduzcas después; consulta si tomas medicamentos, estás embarazada o lactando.',
      },
    ],
  },
  {
    name: 'Rutina Acidez y Pesadez Estomacal',
    slug: 'rutina-acidez-y-pesadez-estomacal',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-acidez-y-pesadez-estomacal/cover-1784166160381.png',
    beforeCents: 17360,
    steps: [
      {
        variantId: 'abbbd267-f36f-40c5-b41f-0a7da90457a9',
        label: 'Alimento fermentado',
        when: '🥣 Desayuno o merienda',
        instruction: 'Consume frío en la porción indicada y mantén siempre la cadena de frío. Evítalo si tienes alergia a la leche y revisa tu tolerancia a la lactosa.',
      },
      {
        variantId: 'eee4a498-5dab-453d-8471-b9f61cec3b9b',
        label: 'Alternativa probiótica',
        when: '🌅 Según la etiqueta',
        instruction: 'Disuelve un sobre en líquido a temperatura ambiente y respeta la frecuencia del envase. No es obligatorio tomarlo junto con el yogurt; consulta si existe inmunosupresión o tratamiento médico.',
      },
      {
        variantId: 'e6e9e3c2-4ffa-4113-8504-163a740465fd',
        label: 'Fibra soluble gradual',
        when: '🥤 Una vez al día',
        instruction: 'Empieza con poca cantidad, mézclala completamente con abundante agua y aumenta gradualmente. Nunca la tomes en seco y sepárala al menos 2 horas de medicamentos.',
      },
    ],
  },
  {
    name: 'Rutina Cuidado Piel Corporal',
    slug: 'rutina-cuidado-piel-corporal',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-cuidado-piel-corporal/cover.png',
    beforeCents: 46850,
    steps: [
      {
        variantId: '6e86b925-aca5-41ee-a854-0884154421d5',
        label: 'Limpieza corporal',
        when: '🚿 En la ducha',
        instruction: 'Aplica sobre piel húmeda, masajea suavemente y enjuaga. Evita ojos y piel lesionada.',
      },
      {
        variantId: 'd125c4be-7ff7-4fe5-8d7d-c3054983b80d',
        label: 'Exfoliación suave',
        when: '✨ 1–2 veces por semana',
        instruction: 'Masajea sin presión sobre piel húmeda y enjuaga. No uses sobre irritación, heridas ni inmediatamente después de depilarte.',
      },
      {
        variantId: '98a8fb59-2f27-4f2f-9ed1-2671e0ba9be2',
        label: 'Hidratación diaria',
        when: '💧 Después de la ducha',
        instruction: 'Extiende sobre la piel ligeramente húmeda y masajea hasta absorber. Suspende si aparece irritación.',
      },
      {
        variantId: 'f39ae0fb-4424-4703-873b-e505d346daf8',
        label: 'Rescate localizado',
        when: '🆘 Zonas secas o sensibles',
        instruction: 'Aplica una capa fina solo donde se necesite, sobre piel limpia. Consulta si la irritación es intensa, extensa o persistente.',
      },
    ],
  },
  {
    name: 'Rutina Estrés y Calma Diaria',
    slug: 'rutina-estres-y-calma-diaria',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-estres-y-calma-diaria/cover.png',
    beforeCents: 40000,
    steps: [
      {
        variantId: 'a07bd2df-76a0-4351-9a59-a464b7d87594',
        label: 'Soporte diurno',
        when: '☀️ Según la etiqueta',
        instruction: 'Usa únicamente la dosis indicada. Consulta si tomas medicamentos, tienes una condición tiroidea, estás embarazada o en lactancia; suspende ante somnolencia o malestar.',
      },
      {
        variantId: '91bb1f47-345a-48ad-9dfb-88fa54139573',
        label: 'Transición al descanso',
        when: '🌙 Al terminar la jornada',
        instruction: 'Disuelve la cantidad indicada en agua tibia y úsala como baño o remojo. No apliques sobre heridas ni piel irritada.',
      },
      {
        variantId: '98a8fb59-2f27-4f2f-9ed1-2671e0ba9be2',
        label: 'Masaje de cierre',
        when: '💆 Después del baño',
        instruction: 'Aplica con masaje suave en brazos, hombros o piernas sobre piel intacta. Evita ojos y suspende ante irritación.',
      },
    ],
  },
  {
    name: 'Rutina Gym y Recuperación',
    slug: 'rutina-gym-y-recuperacion',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-gym-y-recuperacion/cover.png',
    beforeCents: 63380,
    steps: [
      {
        variantId: '8e18065a-c8f1-4306-86d6-23571a176e57',
        label: 'Alimento previo',
        when: '🥣 Desayuno o antes de entrenar',
        instruction: 'Prepara la porción indicada en el envase como parte de una comida o batido. Ajusta cantidad y horario a tu tolerancia digestiva.',
      },
      {
        variantId: '8a9feb0b-615b-4717-819d-90ecb16afc4d',
        label: 'Proteína principal',
        when: '💪 Después de entrenar',
        instruction: 'Mezcla la porción indicada con agua. No excedas tu requerimiento diario y evita si tienes alergia a lácteos; consulta ante enfermedad renal o hepática.',
      },
      {
        variantId: '5a64f172-d43c-49f2-b225-0125091a79fa',
        label: 'Alternativa portátil',
        when: '🎒 Cuando no puedas preparar el batido',
        instruction: 'Úsala como alternativa práctica, no como una dosis adicional obligatoria. Revisa alérgenos e información nutricional del envase.',
      },
      {
        variantId: '076dfb77-1ad6-4e9b-9762-d49549ee8dce',
        label: 'Soporte opcional',
        when: '🍽️ Según la etiqueta',
        instruction: 'Usa solo la porción indicada. Consulta antes si tomas anticoagulantes, tienes cálculos biliares, estás embarazada o en lactancia.',
      },
    ],
  },
  {
    name: 'Rutina Oficina y Pantallas',
    slug: 'rutina-oficina-y-pantallas',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-oficina-y-pantallas/cover.png',
    beforeCents: 53680,
    steps: [
      {
        variantId: 'f3ca9921-f0d5-49a7-b6a7-56c811f9abbd',
        label: 'Enfoque consciente',
        when: '🌅 Al inicio de la jornada',
        instruction: 'Usa solo la dosis indicada y evita otras fuentes altas de cafeína. No usar si eres menor, estás embarazada o lactando, o eres sensible a estimulantes; consulta si tomas medicación.',
      },
      {
        variantId: '4bc150b6-3e3a-4184-902a-9ae23e01dc45',
        label: 'Pausa ocular',
        when: '👁️ Cuando exista sequedad',
        instruction: 'Aplica según el envase con manos limpias y sin tocar el ojo con el gotero. Consulta si hay dolor, secreción, lesión o síntomas persistentes.',
      },
      {
        variantId: 'f8f41b05-a299-473f-bc58-2f708c0fd664',
        label: 'Cierre de jornada',
        when: '🌆 Después de trabajar',
        instruction: 'Respeta la porción del envase. No combines con alcohol, sedantes u otros productos calmantes y evita conducir si produce somnolencia.',
      },
    ],
  },
  {
    name: 'Rutina Pies Perfectos',
    slug: 'rutina-pies-perfectos',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-pies-perfectos/cover-1784165867028.png',
    beforeCents: 10060,
    steps: [
      {
        variantId: '91bb1f47-345a-48ad-9dfb-88fa54139573',
        label: 'Remojo de preparación',
        when: '🛁 Antes del cuidado',
        instruction: 'Disuelve la cantidad indicada en agua tibia y remoja los pies. No usar sobre heridas, infección activa ni si un profesional te indicó evitar remojos.',
      },
      {
        variantId: '24a05620-31e5-4c92-a38a-107cf8384eb7',
        label: 'Pulido suave',
        when: '🦶 Después del remojo',
        instruction: 'Frota suavemente solo las durezas y detente si duele. No usar en piel abierta ni si tienes diabetes o mala circulación sin indicación profesional.',
      },
      {
        variantId: 'f79eaf1b-ab01-4579-ba5b-79bc39565a4e',
        label: 'Corte seguro',
        when: '✂️ Con uñas limpias y secas',
        instruction: 'Corta las uñas rectas sin llegar demasiado a las esquinas. Consulta ante dolor, inflamación o uña encarnada.',
      },
      {
        variantId: 'cc3b0c25-5a99-48f2-bda2-df0a1809d1fe',
        label: 'Hidratación específica',
        when: '🧴 Por la noche',
        instruction: 'Aplica en talones y zonas secas, evitando el espacio entre los dedos. No usar sobre grietas sangrantes o infectadas.',
      },
      {
        variantId: '84d6d4eb-3233-4aa6-a143-6c4b10ea8e25',
        label: 'Control de humedad',
        when: '👟 Antes del calzado',
        instruction: 'Aplica una cantidad ligera sobre pies secos o dentro del calzado, evitando inhalarlo. Suspende ante irritación.',
      },
    ],
  },
  {
    name: 'Rutina Protector Solar Diario',
    slug: 'rutina-protector-solar-diario',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-protector-solar-diario/cover.png',
    beforeCents: 51170,
    steps: [
      {
        variantId: '894405ce-5087-4fff-a3c5-cc08244788df',
        label: 'Hidratación ligera',
        when: '☀️ Mañana',
        instruction: 'Aplica sobre el rostro limpio y deja absorber antes del protector solar. Usa menos cantidad si tu piel es muy grasa.',
      },
      {
        variantId: '416f7f91-162c-4143-bcbd-f8bbb3f0ddbd',
        label: 'Protección facial',
        when: '☀️ Antes de salir',
        instruction: 'Aplica una cantidad generosa y uniforme en rostro y cuello. Reaplica durante el día, especialmente tras sudar o secarte.',
      },
      {
        variantId: '0622b2ba-d0b2-46d7-a646-ab68aec68e0c',
        label: 'Protección de labios',
        when: '👄 Durante el día',
        instruction: 'Desliza sobre los labios y reaplica después de comer, beber o según necesidad.',
      },
      {
        variantId: '2fa40ac2-d2db-4c7c-a261-e9a06ea16556',
        label: 'Reaplicación práctica',
        when: '⏰ Durante el día',
        instruction: 'Usa según las instrucciones del envase, con ojos y boca cerrados. La bruma complementa la reaplicación; asegúrate de lograr cobertura uniforme.',
      },
    ],
  },
  {
    name: 'Rutina Skin Care Piel Grasa',
    slug: 'rutina-skin-care-piel-grasa',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-skin-care-piel-grasa/cover-1784165668362.png',
    beforeCents: 77470,
    steps: [
      {
        variantId: '61bf6064-3a40-4235-a32e-84eb8f028c8d',
        label: 'Limpieza para imperfecciones',
        when: '☀️🌙 Según tolerancia',
        instruction: 'Masajea una pequeña cantidad sobre piel húmeda y enjuaga. Empieza una vez al día si tu piel es sensible y reduce la frecuencia ante resequedad.',
      },
      {
        variantId: '34187378-bf18-428f-ba32-5614c811ea1d',
        label: 'Hidratación sin brillo',
        when: '☀️🌙 Después de limpiar',
        instruction: 'Aplica una capa fina en rostro y cuello. No es necesario añadir varios sérums seborreguladores en la misma rutina.',
      },
      {
        variantId: '416f7f91-162c-4143-bcbd-f8bbb3f0ddbd',
        label: 'Protección toque seco',
        when: '☀️ Mañana',
        instruction: 'Aplica una cantidad generosa y uniforme en rostro y cuello y reaplica durante el día, especialmente tras sudar.',
      },
      {
        variantId: 'deedc745-919c-4e9b-bd8a-966dec6cff0f',
        label: 'Cuidado localizado',
        when: '🌙 Sobre un granito limpio',
        instruction: 'Coloca un parche sobre piel limpia y seca siguiendo el tiempo del envase. No usar sobre heridas abiertas o infección extensa.',
      },
    ],
  },
  {
    name: 'Rutina Skin Care Piel Sensible',
    slug: 'rutina-skin-care-piel-sensible',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-skin-care-piel-sensible/cover-1784166880754.png',
    beforeCents: 62760,
    steps: [
      {
        variantId: 'ca24c2c8-642b-4177-9c9d-62bef52386de',
        label: 'Limpieza suave',
        when: '☀️🌙 Mañana y noche',
        instruction: 'Masajea suavemente sobre piel húmeda y enjuaga con agua tibia. Evita fricción y suspende si produce ardor persistente.',
      },
      {
        variantId: 'b974ec4e-16d0-488e-bb4b-c9dd159f4d86',
        label: 'Hidratación de barrera',
        when: '🌙 Después de limpiar',
        instruction: 'Aplica una capa fina sobre rostro y cuello. Realiza una prueba localizada si tu piel reacciona con facilidad.',
      },
      {
        variantId: 'f39ae0fb-4424-4703-873b-e505d346daf8',
        label: 'Rescate localizado',
        when: '🆘 Zonas irritadas o secas',
        instruction: 'Aplica una capa fina solo donde se necesite. Consulta si la reacción es intensa, extensa, dolorosa o persistente.',
      },
      {
        variantId: 'a2284f90-8534-448b-8214-f6030df9a1e6',
        label: 'Protección mineral',
        when: '☀️ Mañana',
        instruction: 'Agita y aplica una cantidad generosa y uniforme en rostro y cuello. Reaplica durante el día y tras sudar o secarte.',
      },
    ],
  },
  {
    name: 'Rutina Sueño y Descanso',
    slug: 'rutina-sueno-y-descanso',
    expectedCover: 'https://skcfrccoexscaiayzjzd.supabase.co/storage/v1/object/public/product-images/kits/rutina-sueno-y-descanso/cover.png',
    beforeCents: 43840,
    steps: [
      {
        variantId: '91bb1f47-345a-48ad-9dfb-88fa54139573',
        label: 'Baño de transición',
        when: '🌙 60 minutos antes',
        instruction: 'Disuelve la cantidad indicada en agua tibia y úsala como baño o remojo. Evita piel lesionada y seca bien la zona al terminar.',
      },
      {
        variantId: '98a8fb59-2f27-4f2f-9ed1-2671e0ba9be2',
        label: 'Masaje nocturno',
        when: '🌙 Después del baño',
        instruction: 'Aplica sobre piel intacta con masaje suave. Evita ojos y suspende si aparece irritación.',
      },
      {
        variantId: 'ec92320d-27c3-480e-987d-ae90860a4d7f',
        label: 'Único apoyo para dormir',
        when: '😴 Según la etiqueta',
        instruction: 'Usa únicamente la dosis indicada. No combines con alcohol, sedantes ni otras fórmulas de melatonina; no conduzcas después y consulta si tomas medicamentos, estás embarazada o lactando.',
      },
    ],
  },
]

const UNCHANGED_KITS = [
  { slug: 'kit-botiquin-compacto', totalCents: 7287 },
  { slug: 'kit-primeros-auxilios-familiar', totalCents: 10610 },
]

function getAdmin(): SupabaseClient {
  dotenv.config({ path: '/tmp/liora-production.env', quiet: true })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function currentPrice(variant: any): number | null {
  return variant.product_prices?.find((price: any) => price.effective_to === null)?.amount_cents ?? null
}

function rowsFor(kitId: string, steps: Step[]) {
  return steps.map((step, index) => ({
    kit_id: kitId,
    variant_id: step.variantId,
    quantity: 1,
    sort_order: index,
    is_required: true,
    step_label: step.label,
    step_when: step.when,
    step_instruction: step.instruction,
  }))
}

async function loadContext(admin: SupabaseClient) {
  const variantIds = [...new Set(PLANS.flatMap((plan) => plan.steps.map((step) => step.variantId)))]
  const { data: kits, error: kitsError } = await admin
    .from('kits')
    .select('id,name,slug,cover_image_url,is_active,kit_products(*)')
    .in('slug', [...PLANS.map((plan) => plan.slug), ...UNCHANGED_KITS.map((kit) => kit.slug)])
  if (kitsError) throw kitsError
  const lookupVariantIds = [...new Set([
    ...variantIds,
    ...(kits ?? []).flatMap((kit: any) => (kit.kit_products ?? []).map((row: any) => row.variant_id)),
  ])]
  const { data: variants, error: variantsError } = await admin
    .from('product_variants')
    .select('id,name,sku,is_active,stock_quantity,products(name,slug,is_active),product_prices(amount_cents,compare_at_cents,effective_to)')
    .in('id', lookupVariantIds)
  if (variantsError) throw variantsError
  return { kits: kits ?? [], variants: variants ?? [], variantIds }
}

function validate(context: Awaited<ReturnType<typeof loadContext>>) {
  const errors: string[] = []
  const kitBySlug = new Map(context.kits.map((kit: any) => [kit.slug, kit]))
  const variantById = new Map(context.variants.map((variant: any) => [variant.id, variant]))
  if (context.kits.length !== PLANS.length + UNCHANGED_KITS.length) errors.push(`kits encontrados ${context.kits.length}/${PLANS.length + UNCHANGED_KITS.length}`)
  const selectedVariantsFound = context.variantIds.filter((variantId) => variantById.has(variantId)).length
  if (selectedVariantsFound !== context.variantIds.length) errors.push(`variantes seleccionadas encontradas ${selectedVariantsFound}/${context.variantIds.length}`)

  for (const plan of PLANS) {
    const kit: any = kitBySlug.get(plan.slug)
    if (!kit) {
      errors.push(`${plan.slug}: kit ausente`)
      continue
    }
    if (!kit.is_active) errors.push(`${plan.slug}: kit inactivo`)
    if (kit.name !== plan.name) errors.push(`${plan.slug}: nombre inesperado (${kit.name})`)
    if (kit.cover_image_url !== plan.expectedCover) errors.push(`${plan.slug}: portada cambió desde la auditoría`)
    if (new Set(plan.steps.map((step) => step.variantId)).size !== plan.steps.length) errors.push(`${plan.slug}: producto duplicado dentro del plan`)
  }

  for (const variantId of context.variantIds) {
    const variant: any = variantById.get(variantId)
    if (!variant) {
      errors.push(`${variantId}: variante ausente`)
      continue
    }
    if (!variant.is_active || !variant.products?.is_active) errors.push(`${variantId}: producto o variante inactiva`)
    if (variant.stock_quantity !== null) errors.push(`${variantId}: stock no ilimitado`)
    if (currentPrice(variant) === null) errors.push(`${variantId}: sin precio vigente`)
  }

  return { errors, kitBySlug, variantById }
}

function summary(context: Awaited<ReturnType<typeof loadContext>>, check: ReturnType<typeof validate>) {
  return PLANS.map((plan) => {
    const kit: any = check.kitBySlug.get(plan.slug)
    const afterCents = plan.steps.reduce((sum, step) => sum + (currentPrice(check.variantById.get(step.variantId)) ?? 0), 0)
    const currentRows = [...(kit?.kit_products ?? [])].sort((left: any, right: any) => left.sort_order - right.sort_order)
    const currentCents = currentRows.reduce((sum: number, row: any) => sum + (currentPrice(check.variantById.get(row.variant_id)) ?? 0), 0)
    return {
      kit: plan.name,
      slug: plan.slug,
      auditedBefore: plan.beforeCents / 100,
      current: currentCents / 100,
      proposed: afterCents / 100,
      products: plan.steps.length,
      savingsPercent: Number((((plan.beforeCents - afterCents) / plan.beforeCents) * 100).toFixed(1)),
      coverPreserved: kit?.cover_image_url === plan.expectedCover,
    }
  })
}

async function preflight() {
  const admin = getAdmin()
  const context = await loadContext(admin)
  const check = validate(context)
  console.log(JSON.stringify({ mode: 'preflight', changedKits: PLANS.length, unchangedKits: UNCHANGED_KITS.length, errors: check.errors, plans: summary(context, check) }, null, 2))
  if (check.errors.length) process.exitCode = 1
}

async function apply() {
  const admin = getAdmin()
  const context = await loadContext(admin)
  const check = validate(context)
  if (check.errors.length) {
    console.error(JSON.stringify({ mode: 'apply', status: 'blocked-by-preflight', errors: check.errors }, null, 2))
    process.exitCode = 1
    return
  }

  const updated: string[] = []
  const skipped: string[] = []
  for (const plan of PLANS) {
    const kit: any = check.kitBySlug.get(plan.slug)
    const previousRows = [...(kit.kit_products ?? [])]
    const expectedRows = rowsFor(kit.id, plan.steps)
    const currentNormalized = [...previousRows]
      .sort((left: any, right: any) => left.sort_order - right.sort_order)
      .map((row: any) => ({ variant_id: row.variant_id, quantity: row.quantity, sort_order: row.sort_order, is_required: row.is_required, step_label: row.step_label, step_when: row.step_when, step_instruction: row.step_instruction }))
    const expectedNormalized = expectedRows.map((row) => ({
      variant_id: row.variant_id,
      quantity: row.quantity,
      sort_order: row.sort_order,
      is_required: row.is_required,
      step_label: row.step_label,
      step_when: row.step_when,
      step_instruction: row.step_instruction,
    }))
    if (JSON.stringify(currentNormalized) === JSON.stringify(expectedNormalized)) {
      skipped.push(plan.slug)
      continue
    }

    const { error: deleteError } = await admin.from('kit_products').delete().eq('kit_id', kit.id)
    if (deleteError) throw new Error(`${plan.slug}: no se pudo retirar la composición anterior: ${deleteError.message}`)
    const { error: insertError } = await admin.from('kit_products').insert(expectedRows)
    if (insertError) {
      const { error: rollbackError } = await admin.from('kit_products').insert(previousRows)
      const rollback = rollbackError ? `; además falló la restauración: ${rollbackError.message}` : '; composición anterior restaurada'
      throw new Error(`${plan.slug}: falló la nueva composición: ${insertError.message}${rollback}`)
    }

    const { data: coverCheck, error: coverError } = await admin.from('kits').select('cover_image_url').eq('id', kit.id).single()
    if (coverError || coverCheck.cover_image_url !== plan.expectedCover) throw new Error(`${plan.slug}: control de portada falló después de publicar`)
    updated.push(plan.slug)
    console.log(`Actualizado ${updated.length}/${PLANS.length}: ${plan.name}`)
  }

  console.log(JSON.stringify({ mode: 'apply', status: 'published', updated, skipped, kitsTableTouched: false, coversChanged: 0 }, null, 2))
}

async function audit() {
  const admin = getAdmin()
  const context = await loadContext(admin)
  const check = validate(context)
  const errors = [...check.errors]
  const products: Array<Record<string, unknown>> = []

  for (const plan of PLANS) {
    const kit: any = check.kitBySlug.get(plan.slug)
    const actualRows = [...(kit?.kit_products ?? [])].sort((left: any, right: any) => left.sort_order - right.sort_order)
    const expectedRows = rowsFor(kit?.id, plan.steps)
    if (actualRows.length !== expectedRows.length) errors.push(`${plan.slug}: productos ${actualRows.length}/${expectedRows.length}`)
    expectedRows.forEach((expected, index) => {
      const actual = actualRows[index]
      const fields = ['variant_id', 'quantity', 'sort_order', 'is_required', 'step_label', 'step_when', 'step_instruction'] as const
      for (const field of fields) if (actual?.[field] !== expected[field]) errors.push(`${plan.slug}: paso ${index + 1}, campo ${field} no coincide`)
      const variant: any = check.variantById.get(expected.variant_id)
      products.push({ kit: plan.slug, order: index + 1, product: variant?.products?.name ?? null, price: (currentPrice(variant) ?? 0) / 100 })
    })
  }

  for (const unchanged of UNCHANGED_KITS) {
    const kit: any = check.kitBySlug.get(unchanged.slug)
    if (!kit?.is_active) errors.push(`${unchanged.slug}: kit de control ausente o inactivo`)
  }

  console.log(JSON.stringify({ mode: 'audit', status: errors.length ? 'errors' : 'verified', changedKits: PLANS.length, unchangedKits: UNCHANGED_KITS.length, coversPreserved: PLANS.filter((plan) => (check.kitBySlug.get(plan.slug) as any)?.cover_image_url === plan.expectedCover).length, kitsTableTouched: false, errors, totals: summary(context, check), products }, null, 2))
  if (errors.length) process.exitCode = 1
}

async function main() {
  if (process.argv.includes('--apply')) await apply()
  else if (process.argv.includes('--audit')) await audit()
  else await preflight()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : JSON.stringify(error, null, 2))
  process.exitCode = 1
})
