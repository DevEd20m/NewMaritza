export const SLUG_WEIGHTS: Record<string, Record<string, number>> = {
  // ── Objetivos principales ─────────────────────────────
  'obj-rendimiento':  { gym: 3 },
  'obj-belleza':      { piel: 3 },
  'obj-bienestar':    { bienestar: 3 },
  'obj-digestivo':    { digestivo: 3, gym: 1 },
  'obj-nutricion':    { bienestar: 3, digestivo: 1 },
  'obj-solar':        { solar: 3 },
  'obj-viaje':        { viaje: 3 },
  'obj-hogar':        { hogar: 3 },
  'obj-pies-cuerpo':  { 'pies-cuerpo': 3 },
  'obj-guia':         {},
  // ── Señales de contexto (legado) ─────────────────────
  'exposicion-solar':    { solar: 3 },
  'vacaciones-playa':    { solar: 2, viaje: 2 },
  'viaje-proximo':       { viaje: 3 },
  'kit-casa':            { hogar: 3 },
  'cuidado-pies':        { 'pies-cuerpo': 3 },
  'recuperacion-pies':   { 'pies-cuerpo': 2 },
  // ── Solar (rama nueva) ───────────────────────────────
  'solar-diario':    { solar: 3 },
  'solar-playa':     { solar: 4 },
  'solar-outdoor':   { solar: 3 },
  'solar-completo':  { solar: 4 },
  // ── Viaje (rama nueva) ───────────────────────────────
  'viaje-playa':     { solar: 2, viaje: 2 },
  'viaje-ciudad':    { viaje: 3 },
  'viaje-aventura':  { viaje: 3 },
  'viaje-largo':     { viaje: 3 },
  // ── Hogar (rama nueva) ───────────────────────────────
  'hogar-familiar':  { hogar: 4 },
  'hogar-compacto':  { hogar: 3 },
  'hogar-movil':     { hogar: 2 },
  // ── Pies/cuerpo (rama nueva) ─────────────────────────
  'pies-durezas':      { 'pies-cuerpo': 4 },
  'cuerpo-rozaduras':  { 'pies-cuerpo': 3 },
  'cuerpo-muscular':   { gym: 2, 'pies-cuerpo': 2 },
  'pies-general':      { 'pies-cuerpo': 3 },
  // ── Rendimiento detalle ───────────────────────────────
  'gym-fuerza':         { gym: 4 },
  'gym-energia':        { gym: 3 },
  'gym-recuperacion':   { gym: 3 },
  'gym-articulaciones': { gym: 3 },
  'gym-hidratacion':    { gym: 2, digestivo: 1 },
  // ── Foco belleza ──────────────────────────────────────
  'foco-piel':      { piel: 3 },
  'foco-cabello':   { piel: 3 },
  'foco-colageno':  { piel: 2, bienestar: 2 },
  'foco-antiedad':  { piel: 3, bienestar: 2 },
  // ── Foco bienestar ────────────────────────────────────
  'foco-sueno':        { bienestar: 3 },
  'foco-estres':       { bienestar: 3 },
  'foco-sueno-estres': { bienestar: 3 },
  'foco-energia':      { bienestar: 3 },
  'foco-pantallas':    { bienestar: 3 },
  // ── Entrenamiento ─────────────────────────────────────
  'tipo-fuerza': { gym: 3 },
  'tipo-cardio': { gym: 2, bienestar: 1 },
  'tipo-hiit':   { gym: 3 },
  'tipo-yoga':   { bienestar: 1 },
  'nivel-principiante': { gym: 1 },
  'nivel-activo':       { gym: 2 },
  'nivel-alto':         { gym: 3 },
  'nivel-elite':        { gym: 3 },
  // ── Articulaciones ────────────────────────────────────
  'sin-dolor':      { gym: 1 },
  'dolor-leve':     { gym: 1, bienestar: 1 },
  'dolor-frecuente':{ gym: 2, bienestar: 2 },
  // ── Piel ──────────────────────────────────────────────
  'piel-arrugas':   { piel: 3, bienestar: 1 },
  'piel-manchas':   { piel: 3 },
  'piel-poros':     { piel: 2 },
  'piel-firmeza':   { piel: 3, bienestar: 1 },
  'piel-grasa':     { piel: 3 },
  'piel-seca':      { piel: 3 },
  'piel-sensible':  { piel: 2 },
  'piel-normal':    { piel: 1 },
  'piel-rojeces':   { piel: 2 },
  'sin-sensibilidad': {},
  // ── Cabello ───────────────────────────────────────────
  'cabello-caida':      { piel: 3 },
  'cabello-sequedad':   { piel: 2 },
  'cabello-frizz':      { piel: 2 },
  'cabello-crecimiento':{ piel: 3 },
  // ── Bienestar: frecuencia ─────────────────────────────
  'frecuencia-diaria':    { bienestar: 2 },
  'frecuencia-semanal':   { bienestar: 1 },
  'frecuencia-ocasional': {},
  // ── Digestivo ─────────────────────────────────────────
  'digestivo-hinchazon':    { digestivo: 2 },
  'digestivo-estrenimiento':{ digestivo: 2 },
  'digestivo-reflujo':      { digestivo: 1 },
  'digestivo-reset':        { digestivo: 3 },
  // ── Nutrición ─────────────────────────────────────────
  'nutricion-energia': { bienestar: 2, digestivo: 2 },
  'nutricion-inmune':  { bienestar: 3 },
  'nutricion-base':    { bienestar: 3 },
  'nutricion-andino':  { digestivo: 3 },
  // ── Natural / orgánico (preferencia — no implica categoría) ──
  'prefiere-natural':  {},
  'natural-importante':{},
  'natural-indiferente':{},
  // ── Seguridad (informacional para IA) ────────────────
  'sin-condicion': {}, 'cond-embarazo': {}, 'cond-medicamentos': {},
  'cond-medica': {}, 'cond-reacciones': {}, 'cond-sintomas': {},
  // ── Alergias / restricciones (informacional para IA) ──
  'sin-restriccion': {},
  'alerg-lactosa': {},   'alerg-gluten': {},
  'alerg-soya': {},      'alerg-azucar': {},
  'alerg-cafeina': {},   'alerg-piel': { piel: 1 },
  'pref-vegano': {},     'pref-sin-fragancia': {},
  'pref-organico': { digestivo: 1 },
  // ── Tipo de rutina (informacional) ───────────────────
  'rutina-simple': {}, 'rutina-balanceada': {}, 'rutina-completa': {}, 'rutina-guiada': {},
  // ── Género (informacional, legado) ───────────────────
  'genero-femenino': {}, 'genero-masculino': {}, 'genero-no-especifica': {},
  // ── Presupuesto ───────────────────────────────────────
  'presupuesto-bajo': {}, 'presupuesto-medio': {}, 'presupuesto-alto': {}, 'presupuesto-premium': {},
  // ── Rama de orientación (obj-guia) ───────────────────
  'guia-piel':      { piel: 2 },
  'guia-bienestar': { bienestar: 2 },
  'guia-gym':       { gym: 2 },
  'guia-digestivo': { digestivo: 2 },
  'guia-viaje':     { viaje: 2, solar: 1 },
  'guia-hogar':     { hogar: 2 },
  // ── Slugs legados (no rompen perfiles históricos) ─────
  'obj-piel': { piel: 3 }, 'obj-cabello': { piel: 2 },
  'entreno-fuerza': { gym: 3 }, 'entreno-cardio': { gym: 2, bienestar: 1 },
  'entreno-mixto': { gym: 2 }, 'entreno-hiit': { gym: 3 },
  'alto-rendimiento': { gym: 3 }, elite: { gym: 3 }, activo: { gym: 2 }, principiante: { gym: 1 },
  'sin-dolor-articular': { gym: 1 }, 'dolor-articular-leve': { gym: 2 },
  'dolor-articular-frecuente': { bienestar: 3 },
  'bienestar-sueno': { bienestar: 3 }, 'bienestar-estres': { bienestar: 3 },
  'bienestar-ambos': { bienestar: 3 }, 'bienestar-frecuente': { bienestar: 2 },
  'nutricion-general': { bienestar: 2 }, 'nutricion-superalimentos': { digestivo: 3 },
  'natural-puro': { digestivo: 3 }, 'reset-exceso': { digestivo: 2 },
  gym: { gym: 3 }, skin: { piel: 3 }, organico: { digestivo: 3 },
  energia: { bienestar: 3, digestivo: 1 }, 'energia-mental': { bienestar: 3 },
  'energia-manana': { bienestar: 2 }, 'energia-entreno': { gym: 2 },
  'energia-tarde': { bienestar: 2 }, inmune: { bienestar: 2 },
  efectivo: {}, 'precio-valor': {}, resultados: {},
}

export const ALLERGY_LABELS: Record<string, string> = {
  'alerg-lactosa':      'lactosa',
  'alerg-gluten':       'gluten',
  'alerg-soya':         'soya',
  'alerg-piel':         'irritantes cutáneos',
  'alerg-azucar':       'azúcar añadida o edulcorantes',
  'alerg-cafeina':      'cafeína',
  'pref-vegano':        'ingredientes de origen animal (colágeno, whey, gelatina)',
  'pref-sin-fragancia': 'fragancias sintéticas',
}

export const SAFETY_FLAG_TEXTS: Record<string, string> = {
  'cond-embarazo':     'La persona está EMBARAZADA o en lactancia. CRÍTICO: excluir melatonina, vitamina A alta dosis, ashwagandha y estimulantes.',
  'cond-medicamentos': 'La persona TOMA MEDICAMENTOS. Evitar omega-3 con anticoagulantes, magnesio con antibióticos. Incluir recomendación de consulta médica en el diagnosis.',
  'cond-medica':       'La persona tiene una CONDICIÓN MÉDICA. Limitar a productos de bajo riesgo; mencionar consulta profesional en el diagnosis.',
  'cond-reacciones':   'La persona ha tenido REACCIONES FUERTES a productos. Priorizar fórmulas suaves e hipoalergénicas.',
  'cond-sintomas':     'La persona tiene SÍNTOMAS INTENSOS O PERSISTENTES. No recomendar kit terapéutico; indicar evaluación profesional en el diagnosis.',
}
