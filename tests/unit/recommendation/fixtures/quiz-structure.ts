export interface QuizOption {
  id: string
  slug: string
  text: string
}

export interface QuizQuestion {
  id: string
  text: string
  type: 'single' | 'multi'
  sort_order: number
  conditions?: { if_any_slug: string[] }
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── S1: Objetivo principal ─────────────────────────────────────────────────
  {
    id: 'q-01-objetivo',
    text: '¿Cuál es tu objetivo principal?',
    type: 'single',
    sort_order: 1,
    options: [
      { id: 'o-obj-rendimiento',  slug: 'obj-rendimiento',  text: 'Mejorar mi rendimiento físico' },
      { id: 'o-obj-belleza',      slug: 'obj-belleza',      text: 'Cuidar mi piel y cabello' },
      { id: 'o-obj-bienestar',    slug: 'obj-bienestar',    text: 'Gestionar el estrés o el sueño' },
      { id: 'o-obj-digestivo',    slug: 'obj-digestivo',    text: 'Mejorar mi digestión' },
      { id: 'o-obj-nutricion',    slug: 'obj-nutricion',    text: 'Nutrición general y vitaminas' },
      { id: 'o-obj-solar',        slug: 'obj-solar',        text: 'Protección solar' },
      { id: 'o-obj-viaje',        slug: 'obj-viaje',        text: 'Kit de viaje' },
      { id: 'o-obj-hogar',        slug: 'obj-hogar',        text: 'Botiquín en casa' },
      { id: 'o-obj-pies-cuerpo',  slug: 'obj-pies-cuerpo',  text: 'Cuidado de pies y cuerpo' },
      { id: 'o-obj-guia',         slug: 'obj-guia',         text: 'No estoy seguro/a' },
    ],
  },
  // ── S2: Ramificaciones ────────────────────────────────────────────────────
  {
    id: 'q-02-tipo-entreno',
    text: '¿Qué tipo de entrenamiento haces?',
    type: 'multi',
    sort_order: 2,
    conditions: { if_any_slug: ['obj-rendimiento'] },
    options: [
      { id: 'o-tipo-fuerza', slug: 'tipo-fuerza', text: 'Fuerza / musculación' },
      { id: 'o-tipo-cardio', slug: 'tipo-cardio', text: 'Cardio (correr, ciclismo)' },
      { id: 'o-tipo-hiit',   slug: 'tipo-hiit',   text: 'HIIT / funcional' },
      { id: 'o-tipo-yoga',   slug: 'tipo-yoga',   text: 'Yoga / pilates' },
    ],
  },
  {
    id: 'q-03-nivel',
    text: '¿Cuál es tu nivel de actividad?',
    type: 'single',
    sort_order: 3,
    conditions: { if_any_slug: ['obj-rendimiento'] },
    options: [
      { id: 'o-nivel-principiante', slug: 'nivel-principiante', text: 'Principiante (1-2×/sem)' },
      { id: 'o-nivel-activo',       slug: 'nivel-activo',       text: 'Activo (3-4×/sem)' },
      { id: 'o-nivel-alto',         slug: 'nivel-alto',         text: 'Alto (5+/sem)' },
      { id: 'o-nivel-elite',        slug: 'nivel-elite',        text: 'Élite / competición' },
    ],
  },
  {
    id: 'q-04-gym-foco',
    text: '¿En qué quieres enfocarte?',
    type: 'multi',
    sort_order: 4,
    conditions: { if_any_slug: ['obj-rendimiento'] },
    options: [
      { id: 'o-gym-fuerza',         slug: 'gym-fuerza',         text: 'Fuerza y masa muscular' },
      { id: 'o-gym-energia',        slug: 'gym-energia',        text: 'Energía y resistencia' },
      { id: 'o-gym-recuperacion',   slug: 'gym-recuperacion',   text: 'Recuperación muscular' },
      { id: 'o-gym-articulaciones', slug: 'gym-articulaciones', text: 'Articulaciones y movilidad' },
      { id: 'o-gym-hidratacion',    slug: 'gym-hidratacion',    text: 'Hidratación' },
    ],
  },
  {
    id: 'q-05-dolor',
    text: '¿Tienes dolor articular o muscular?',
    type: 'single',
    sort_order: 5,
    conditions: { if_any_slug: ['obj-rendimiento'] },
    options: [
      { id: 'o-sin-dolor',      slug: 'sin-dolor',      text: 'No, estoy bien' },
      { id: 'o-dolor-leve',     slug: 'dolor-leve',     text: 'Leve y ocasional' },
      { id: 'o-dolor-frecuente',slug: 'dolor-frecuente',text: 'Frecuente o intenso' },
    ],
  },
  // ── Rama belleza ──────────────────────────────────────────────────────────
  {
    id: 'q-06-foco-belleza',
    text: '¿Qué quieres mejorar en piel o cabello?',
    type: 'single',
    sort_order: 6,
    conditions: { if_any_slug: ['obj-belleza'] },
    options: [
      { id: 'o-foco-piel',     slug: 'foco-piel',     text: 'Piel del rostro' },
      { id: 'o-foco-cabello',  slug: 'foco-cabello',  text: 'Cabello' },
      { id: 'o-foco-colageno', slug: 'foco-colageno', text: 'Colágeno y elasticidad' },
      { id: 'o-foco-antiedad', slug: 'foco-antiedad', text: 'Antienvejecimiento' },
    ],
  },
  {
    id: 'q-07-piel-tipo',
    text: '¿Cuál es tu tipo de piel?',
    type: 'single',
    sort_order: 7,
    conditions: { if_any_slug: ['obj-belleza', 'foco-piel', 'foco-antiedad', 'foco-colageno'] },
    options: [
      { id: 'o-piel-grasa',     slug: 'piel-grasa',     text: 'Grasa' },
      { id: 'o-piel-seca',      slug: 'piel-seca',      text: 'Seca' },
      { id: 'o-piel-sensible',  slug: 'piel-sensible',  text: 'Sensible' },
      { id: 'o-piel-normal',    slug: 'piel-normal',    text: 'Normal / mixta' },
    ],
  },
  {
    id: 'q-08-piel-preocupacion',
    text: '¿Qué te preocupa de tu piel?',
    type: 'multi',
    sort_order: 8,
    conditions: { if_any_slug: ['obj-belleza', 'foco-piel', 'foco-antiedad'] },
    options: [
      { id: 'o-piel-arrugas',  slug: 'piel-arrugas',  text: 'Arrugas / líneas finas' },
      { id: 'o-piel-manchas',  slug: 'piel-manchas',  text: 'Manchas / hiperpigmentación' },
      { id: 'o-piel-poros',    slug: 'piel-poros',    text: 'Poros dilatados' },
      { id: 'o-piel-firmeza',  slug: 'piel-firmeza',  text: 'Firmeza y elasticidad' },
      { id: 'o-piel-rojeces',  slug: 'piel-rojeces',  text: 'Rojeces / inflamación' },
      { id: 'o-sin-sensibilidad', slug: 'sin-sensibilidad', text: 'Ninguna de estas' },
    ],
  },
  {
    id: 'q-09-cabello',
    text: '¿Cuál es tu problema principal de cabello?',
    type: 'single',
    sort_order: 9,
    conditions: { if_any_slug: ['foco-cabello'] },
    options: [
      { id: 'o-cabello-caida',       slug: 'cabello-caida',       text: 'Caída excesiva' },
      { id: 'o-cabello-sequedad',    slug: 'cabello-sequedad',    text: 'Sequedad / frizz' },
      { id: 'o-cabello-crecimiento', slug: 'cabello-crecimiento', text: 'Quiero que crezca más' },
    ],
  },
  // ── Rama bienestar ───────────────────────────────────────────────────────
  {
    id: 'q-10-foco-bienestar',
    text: '¿En qué área de bienestar quieres enfocarte?',
    type: 'single',
    sort_order: 10,
    conditions: { if_any_slug: ['obj-bienestar'] },
    options: [
      { id: 'o-foco-sueno',        slug: 'foco-sueno',        text: 'Sueño' },
      { id: 'o-foco-estres',       slug: 'foco-estres',       text: 'Estrés / ansiedad' },
      { id: 'o-foco-sueno-estres', slug: 'foco-sueno-estres', text: 'Ambos' },
      { id: 'o-foco-energia',      slug: 'foco-energia',      text: 'Energía durante el día' },
      { id: 'o-foco-pantallas',    slug: 'foco-pantallas',    text: 'Vista cansada por pantallas' },
    ],
  },
  {
    id: 'q-11-frecuencia',
    text: '¿Con qué frecuencia sueles sentir estos síntomas?',
    type: 'single',
    sort_order: 11,
    conditions: { if_any_slug: ['obj-bienestar', 'foco-sueno', 'foco-estres'] },
    options: [
      { id: 'o-frecuencia-diaria',    slug: 'frecuencia-diaria',    text: 'Casi todos los días' },
      { id: 'o-frecuencia-semanal',   slug: 'frecuencia-semanal',   text: 'Varias veces por semana' },
      { id: 'o-frecuencia-ocasional', slug: 'frecuencia-ocasional', text: 'Ocasionalmente' },
    ],
  },
  // ── Rama digestivo ───────────────────────────────────────────────────────
  {
    id: 'q-12-digestivo',
    text: '¿Qué síntomas digestivos tienes?',
    type: 'multi',
    sort_order: 12,
    conditions: { if_any_slug: ['obj-digestivo'] },
    options: [
      { id: 'o-digestivo-hinchazon',    slug: 'digestivo-hinchazon',    text: 'Hinchazón' },
      { id: 'o-digestivo-estrenimiento',slug: 'digestivo-estrenimiento',text: 'Estreñimiento' },
      { id: 'o-digestivo-reflujo',      slug: 'digestivo-reflujo',      text: 'Reflujo' },
      { id: 'o-digestivo-reset',        slug: 'digestivo-reset',        text: 'Quiero hacer un reset digestivo' },
    ],
  },
  // ── Rama nutrición ───────────────────────────────────────────────────────
  {
    id: 'q-13-nutricion',
    text: '¿Qué tipo de nutrición buscas?',
    type: 'single',
    sort_order: 13,
    conditions: { if_any_slug: ['obj-nutricion'] },
    options: [
      { id: 'o-nutricion-energia', slug: 'nutricion-energia', text: 'Energía y vitalidad' },
      { id: 'o-nutricion-inmune',  slug: 'nutricion-inmune',  text: 'Sistema inmune' },
      { id: 'o-nutricion-base',    slug: 'nutricion-base',    text: 'Vitaminas base (multivitamínico)' },
      { id: 'o-nutricion-andino',  slug: 'nutricion-andino',  text: 'Superalimentos andinos' },
    ],
  },
  // ── Ramas de contexto especial ───────────────────────────────────────────
  {
    id: 'q-14-solar',
    text: '¿Cómo usas la protección solar?',
    type: 'single',
    sort_order: 14,
    conditions: { if_any_slug: ['obj-solar'] },
    options: [
      { id: 'o-solar-diario',   slug: 'solar-diario',   text: 'Uso diario en ciudad' },
      { id: 'o-solar-playa',    slug: 'solar-playa',    text: 'Playa / piscina' },
      { id: 'o-solar-outdoor',  slug: 'solar-outdoor',  text: 'Outdoor / deporte' },
      { id: 'o-solar-completo', slug: 'solar-completo', text: 'Kit solar completo' },
    ],
  },
  {
    id: 'q-15-viaje',
    text: '¿Qué tipo de viaje tienes?',
    type: 'single',
    sort_order: 15,
    conditions: { if_any_slug: ['obj-viaje'] },
    options: [
      { id: 'o-viaje-playa',    slug: 'viaje-playa',    text: 'Playa / tropical' },
      { id: 'o-viaje-ciudad',   slug: 'viaje-ciudad',   text: 'Ciudad / negocios' },
      { id: 'o-viaje-aventura', slug: 'viaje-aventura', text: 'Aventura / trekking' },
      { id: 'o-viaje-largo',    slug: 'viaje-largo',    text: 'Viaje largo / internacional' },
    ],
  },
  {
    id: 'q-16-hogar',
    text: '¿Para quién es el botiquín?',
    type: 'single',
    sort_order: 16,
    conditions: { if_any_slug: ['obj-hogar'] },
    options: [
      { id: 'o-hogar-familiar',  slug: 'hogar-familiar',  text: 'Para toda la familia' },
      { id: 'o-hogar-compacto',  slug: 'hogar-compacto',  text: 'Compacto (vivo solo/a)' },
      { id: 'o-hogar-movil',     slug: 'hogar-movil',     text: 'Móvil (lo llevo a todas partes)' },
    ],
  },
  {
    id: 'q-17-pies',
    text: '¿Qué molestia tienes en pies o cuerpo?',
    type: 'single',
    sort_order: 17,
    conditions: { if_any_slug: ['obj-pies-cuerpo'] },
    options: [
      { id: 'o-pies-durezas',     slug: 'pies-durezas',     text: 'Callos / durezas' },
      { id: 'o-cuerpo-rozaduras', slug: 'cuerpo-rozaduras', text: 'Rozaduras' },
      { id: 'o-cuerpo-muscular',  slug: 'cuerpo-muscular',  text: 'Tensión muscular' },
      { id: 'o-pies-general',     slug: 'pies-general',     text: 'Cuidado general' },
    ],
  },
  // ── Rama orientación (obj-guia) ──────────────────────────────────────────
  {
    id: 'q-18-guia',
    text: '¿Cuál de estas se parece más a lo que necesitas?',
    type: 'single',
    sort_order: 18,
    conditions: { if_any_slug: ['obj-guia'] },
    options: [
      { id: 'o-guia-piel',      slug: 'guia-piel',      text: 'Mejorar mi piel' },
      { id: 'o-guia-bienestar', slug: 'guia-bienestar', text: 'Sentirme más tranquilo/a' },
      { id: 'o-guia-gym',       slug: 'guia-gym',       text: 'Mejorar mi rendimiento' },
      { id: 'o-guia-digestivo', slug: 'guia-digestivo', text: 'Mejorar mi digestión' },
      { id: 'o-guia-viaje',     slug: 'guia-viaje',     text: 'Prepararme para un viaje' },
      { id: 'o-guia-hogar',     slug: 'guia-hogar',     text: 'Tener un botiquín en casa' },
    ],
  },
  // ── S3: Condiciones de salud ─────────────────────────────────────────────
  {
    id: 'q-19-condicion',
    text: '¿Tienes alguna condición de salud que debamos tener en cuenta?',
    type: 'multi',
    sort_order: 19,
    options: [
      { id: 'o-sin-condicion',    slug: 'sin-condicion',    text: 'Ninguna' },
      { id: 'o-cond-embarazo',    slug: 'cond-embarazo',    text: 'Estoy embarazada o en lactancia' },
      { id: 'o-cond-medicamentos',slug: 'cond-medicamentos',text: 'Tomo medicamentos recetados' },
      { id: 'o-cond-medica',      slug: 'cond-medica',      text: 'Tengo una condición médica' },
      { id: 'o-cond-reacciones',  slug: 'cond-reacciones',  text: 'He tenido reacciones a suplementos' },
      { id: 'o-cond-sintomas',    slug: 'cond-sintomas',    text: 'Tengo síntomas intensos o persistentes' },
    ],
  },
  // ── S4: Restricciones / alergias ─────────────────────────────────────────
  {
    id: 'q-20-alergias',
    text: '¿Tienes restricciones o alergias?',
    type: 'multi',
    sort_order: 20,
    options: [
      { id: 'o-sin-restriccion',   slug: 'sin-restriccion',   text: 'Ninguna' },
      { id: 'o-alerg-lactosa',     slug: 'alerg-lactosa',     text: 'Lactosa' },
      { id: 'o-alerg-gluten',      slug: 'alerg-gluten',      text: 'Gluten' },
      { id: 'o-alerg-soya',        slug: 'alerg-soya',        text: 'Soya' },
      { id: 'o-alerg-azucar',      slug: 'alerg-azucar',      text: 'Azúcar añadida' },
      { id: 'o-alerg-cafeina',     slug: 'alerg-cafeina',     text: 'Cafeína' },
      { id: 'o-pref-vegano',       slug: 'pref-vegano',       text: 'Soy vegano/a' },
      { id: 'o-pref-sin-fragancia',slug: 'pref-sin-fragancia',text: 'Sin fragancias sintéticas' },
    ],
  },
  // ── S5: Preferencias ─────────────────────────────────────────────────────
  {
    id: 'q-21-natural',
    text: '¿Qué tan importante es para ti que los productos sean naturales?',
    type: 'single',
    sort_order: 21,
    options: [
      { id: 'o-prefiere-natural',   slug: 'prefiere-natural',   text: 'Muy importante, prefiero 100% natural' },
      { id: 'o-natural-importante', slug: 'natural-importante', text: 'Importante pero no exclusivo' },
      { id: 'o-natural-indiferente',slug: 'natural-indiferente',text: 'Indiferente, lo que funcione' },
    ],
  },
  {
    id: 'q-22-rutina',
    text: '¿Qué tipo de rutina prefieres?',
    type: 'single',
    sort_order: 22,
    options: [
      { id: 'o-rutina-simple',      slug: 'rutina-simple',      text: 'Simple (1-2 productos)' },
      { id: 'o-rutina-balanceada',  slug: 'rutina-balanceada',  text: 'Balanceada (3-4 productos)' },
      { id: 'o-rutina-completa',    slug: 'rutina-completa',    text: 'Completa (5+ productos)' },
      { id: 'o-rutina-guiada',      slug: 'rutina-guiada',      text: 'Quiero que me guíen' },
    ],
  },
  {
    id: 'q-23-presupuesto',
    text: '¿Cuánto quieres invertir en tu kit?',
    type: 'single',
    sort_order: 23,
    options: [
      { id: 'o-presupuesto-bajo',    slug: 'presupuesto-bajo',    text: 'Hasta S/80' },
      { id: 'o-presupuesto-medio',   slug: 'presupuesto-medio',   text: 'S/80 - S/150' },
      { id: 'o-presupuesto-alto',    slug: 'presupuesto-alto',    text: 'S/150 - S/250' },
      { id: 'o-presupuesto-premium', slug: 'presupuesto-premium', text: 'Sin límite' },
    ],
  },
]

export const ALL_QUIZ_SLUGS = QUIZ_QUESTIONS.flatMap(q => q.options.map(o => o.slug))
