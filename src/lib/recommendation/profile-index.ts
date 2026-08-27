// Índice de perfil: convierte las respuestas del cuestionario en un retrato
// estructurado de la persona.
//
// Es el contrato que rompe el amarre con el catálogo. Antes cada respuesta
// sumaba puntos a una de ocho categorías de producto y el motor elegía un kit;
// toda la profundidad del cuestionario se colapsaba en un slug de categoría.
// Ahora las respuestas describen a quien responde, y es la IA la que busca los
// productos con ese retrato en la mano.
//
// Añadir una pregunta al cuestionario = añadir sus slugs a SLUG_INDEX. Nada más.

export interface ProfileIndex {
  demografia: { rangoEdad?: string; sexo?: string }
  objetivos: { principal?: string; secundarios: string[] }
  piel?: { tipo?: string; loDedujimos?: boolean; preocupaciones?: string[]; rutinaActual?: string }
  cabello?: { tipo?: string; cueroCabelludo?: string; problemas?: string[]; tratamientos?: string[] }
  digestion?: { sintomas?: string[]; momento?: string; yaProbo?: string }
  nutricion?: { carencias?: string[]; alimentacion?: string; exposicionSol?: string }
  descanso?: { patron?: string; frecuencia?: string; cafeina?: string; necesitaAlerta?: string }
  solar?: { fototipo?: string; uso?: string; textura?: string[]; momento?: string }
  gym?: { objetivo?: string; entrenamiento?: string; suplementosActuales?: string; friccion?: string }
  piesCuerpo?: { problemas?: string[]; horasDePie?: string; intensidad?: string }
  hogar?: { convivientes?: string[]; lugar?: string; necesidades?: string[] }
  viaje?: { destino?: string; duracion?: string; preocupaciones?: string[] }
  seguridad: string[]
  restricciones: string[]
  preferencias: { natural?: string }
  ritual: { nivel?: string; tamano?: string }
  enSusPalabras?: string
}

type Assign = { path: string; value: string; list?: boolean }
const one = (path: string, value: string): Assign => ({ path, value })
const many = (path: string, value: string): Assign => ({ path, value, list: true })

// Los textos son los que verá la IA, no los del cuestionario: describen a la
// persona en tercera persona y en español natural.
export const SLUG_INDEX: Record<string, Assign> = {
  // ── Objetivo principal ──────────────────────────────────────────────
  'obj-piel':          one('objetivos.principal', 'su piel y su rostro'),
  'obj-cabello':       one('objetivos.principal', 'su cabello'),
  'obj-bienestar':     one('objetivos.principal', 'su descanso, calma o energía'),
  'obj-rendimiento':   one('objetivos.principal', 'gym y rendimiento'),
  'obj-digestivo':     one('objetivos.principal', 'su digestión'),
  'obj-nutricion':     one('objetivos.principal', 'vitaminas y nutrición de base'),
  'obj-solar':         one('objetivos.principal', 'protección solar'),
  'obj-pies-cuerpo':   one('objetivos.principal', 'sus pies o su cuerpo'),
  'obj-hogar':         one('objetivos.principal', 'su hogar, familia o primeros auxilios'),
  'obj-viaje':         one('objetivos.principal', 'un viaje, playa u outdoor'),
  'obj-texto-libre':   one('objetivos.principal', 'no lo tiene claro — lo explica en sus palabras'),

  'extra-piel':        many('objetivos.secundarios', 'su piel'),
  'extra-cabello':     many('objetivos.secundarios', 'su cabello'),
  'extra-bienestar':   many('objetivos.secundarios', 'su descanso o energía'),
  'extra-rendimiento': many('objetivos.secundarios', 'gym y rendimiento'),
  'extra-digestivo':   many('objetivos.secundarios', 'su digestión'),
  'extra-nutricion':   many('objetivos.secundarios', 'vitaminas y nutrición'),
  'extra-solar':       many('objetivos.secundarios', 'protección solar'),
  'extra-pies-cuerpo': many('objetivos.secundarios', 'sus pies o su cuerpo'),

  // ── Piel ────────────────────────────────────────────────────────────
  'piel-grasa':         one('piel.tipo', 'grasa'),
  'piel-mixta':         one('piel.tipo', 'mixta'),
  'piel-seca':          one('piel.tipo', 'seca'),
  'piel-sensible':      one('piel.tipo', 'sensible o reactiva'),
  'piel-normal':        one('piel.tipo', 'normal'),
  'piel-deshidratada':  one('piel.tipo', 'deshidratada: grasa en superficie pero tirante — necesita hidratación, no más aceite'),
  'piel-no-se':         one('piel.loDedujimos', 'si'),

  'piel-brotes':       many('piel.preocupaciones', 'granitos o brotes'),
  'piel-poros':        many('piel.preocupaciones', 'puntos negros y poros abiertos'),
  'piel-manchas':      many('piel.preocupaciones', 'manchas y tono desigual'),
  'piel-arrugas':      many('piel.preocupaciones', 'líneas de expresión y falta de firmeza'),
  'piel-luminosidad':  many('piel.preocupaciones', 'falta de luminosidad'),
  'piel-rojeces':      many('piel.preocupaciones', 'rojeces e irritación'),
  'piel-hidratacion':  many('piel.preocupaciones', 'falta de hidratación'),
  'piel-marcas':       many('piel.preocupaciones', 'marcas de granitos pasados'),

  'rutina-piel-ninguna':      one('piel.rutinaActual', 'no tiene rutina, quiere empezar — nada de activos fuertes de entrada'),
  'rutina-piel-basica':       one('piel.rutinaActual', 'limpia e hidrata, nada más — puede introducir un activo suave'),
  'rutina-piel-activos':      one('piel.rutinaActual', 'ya usa activos (vitamina C, ácidos, retinol) y los tolera'),
  'rutina-piel-intolerancia': one('piel.rutinaActual', 'probó activos y le irritaron — evitar retinol y ácidos fuertes'),

  // ── Cabello ─────────────────────────────────────────────────────────
  'cabello-liso':        one('cabello.tipo', 'liso'),
  'cabello-ondulado':    one('cabello.tipo', 'ondulado'),
  'cabello-rizado':      one('cabello.tipo', 'rizado o afro'),
  'cabello-tipo-no-se':  one('cabello.tipo', 'no está seguro/a'),

  'cuero-graso':   one('cabello.cueroCabelludo', 'se engrasa rápido'),
  'cuero-seco':    one('cabello.cueroCabelludo', 'seco o con picazón'),
  'cuero-caspa':   one('cabello.cueroCabelludo', 'con caspa'),
  'cuero-normal':  one('cabello.cueroCabelludo', 'normal'),

  'cabello-caida':        many('cabello.problemas', 'caída o poco volumen'),
  'cabello-sequedad':     many('cabello.problemas', 'sequedad, quiebre o puntas abiertas'),
  'cabello-frizz':        many('cabello.problemas', 'frizz y falta de brillo'),
  'cabello-crecimiento':  many('cabello.problemas', 'crecimiento lento'),
  'cabello-grasa':        many('cabello.problemas', 'exceso de grasa'),
  'cabello-caspa':        many('cabello.problemas', 'caspa'),

  'cabello-tenido':          many('cabello.tratamientos', 'teñido o con mechas'),
  'cabello-decolorado':      many('cabello.tratamientos', 'decolorado'),
  'cabello-calor':           many('cabello.tratamientos', 'usa plancha o secadora seguido'),
  'sin-tratamiento-capilar': many('cabello.tratamientos', 'lo lleva natural, sin tratamientos'),

  // ── Digestión ───────────────────────────────────────────────────────
  'digestivo-hinchazon':     many('digestion.sintomas', 'hinchazón y gases'),
  'digestivo-estrenimiento': many('digestion.sintomas', 'estreñimiento o tránsito lento'),
  'digestivo-reflujo':       many('digestion.sintomas', 'reflujo o acidez'),
  'digestivo-pesadez':       many('digestion.sintomas', 'pesadez después de comer'),
  'digestivo-irregular':     many('digestion.sintomas', 'digestión irregular, cambia de un día a otro'),
  'digestivo-reset':         many('digestion.sintomas', 'nada puntual, quiere cuidar su digestión'),

  'digestivo-postcomida': one('digestion.momento', 'justo después de comer — apunta a apoyo digestivo con las comidas'),
  'digestivo-continuo':   one('digestion.momento', 'a lo largo de todo el día'),
  'digestivo-gatillos':   one('digestion.momento', 'solo con ciertas comidas'),
  'digestivo-estres':     one('digestion.momento', 'por temporadas, sobre todo con estrés'),

  'digestivo-sin-experiencia': one('digestion.yaProbo', 'nunca ha tomado nada'),
  'digestivo-probioticos':     one('digestion.yaProbo', 'toma o ha tomado probióticos'),
  'digestivo-fibra':           one('digestion.yaProbo', 'toma fibra'),
  'digestivo-sin-resultado':   one('digestion.yaProbo', 'probó algo y no le funcionó — proponer un enfoque distinto'),

  // ── Nutrición ───────────────────────────────────────────────────────
  'nutricion-energia':       many('nutricion.carencias', 'energía, se cansa rápido'),
  'nutricion-inmune':        many('nutricion.carencias', 'defensas'),
  'nutricion-concentracion': many('nutricion.carencias', 'concentración y claridad mental'),
  'nutricion-belleza':       many('nutricion.carencias', 'piel, cabello y uñas'),
  'nutricion-huesos':        many('nutricion.carencias', 'huesos y articulaciones'),
  'nutricion-animo':         many('nutricion.carencias', 'ánimo estable'),
  'nutricion-no-se':         many('nutricion.carencias', 'no sabe qué le falta, pide orientación'),

  'dieta-omnivora':     one('nutricion.alimentacion', 'come de todo'),
  'dieta-vegetariana':  one('nutricion.alimentacion', 'vegetariana — vigilar B12 y hierro'),
  'dieta-vegana':       one('nutricion.alimentacion', 'vegana — vigilar B12, hierro y omega de origen vegetal'),
  'dieta-baja-animal':  one('nutricion.alimentacion', 'come poca carne o lácteos'),
  'dieta-irregular':    one('nutricion.alimentacion', 'irregular, come a deshoras'),

  'sol-nada':  one('nutricion.exposicionSol', 'casi nada, pasa el día en interiores — candidata a vitamina D'),
  'sol-poco':  one('nutricion.exposicionSol', 'poca, solo al ir y volver'),
  'sol-mucho': one('nutricion.exposicionSol', 'bastante, está fuera varias horas'),

  // ── Descanso y estrés ───────────────────────────────────────────────
  'sueno-conciliar':  one('descanso.patron', 'le cuesta quedarse dormido/a'),
  'sueno-mantener':   one('descanso.patron', 'se despierta durante la noche'),
  'sueno-no-repara':  one('descanso.patron', 'duerme pero amanece cansado/a — el sueño no repara'),
  'estres-mental':    one('descanso.patron', 'su mente no para durante el día'),
  'foco-energia':     one('descanso.patron', 'le falta energía todo el día'),
  'foco-pantallas':   one('descanso.patron', 'pasa muchas horas frente a pantallas'),

  'frecuencia-diaria':     one('descanso.frecuencia', 'casi todos los días'),
  'frecuencia-semanal':    one('descanso.frecuencia', 'varias veces a la semana'),
  'frecuencia-ocasional':  one('descanso.frecuencia', 'solo en épocas de carga'),

  'cafeina-nada':    one('descanso.cafeina', 'no toma café ni energizantes'),
  'cafeina-manana':  one('descanso.cafeina', 'uno o dos en la mañana'),
  'cafeina-varios':  one('descanso.cafeina', 'varios a lo largo del día'),
  'cafeina-tarde':   one('descanso.cafeina', 'también en la tarde o noche — probable causa del mal sueño'),

  'requiere-alerta':      one('descanso.necesitaAlerta', 'sí, necesita estar alerta de día — nada sedante en horario diurno'),
  'sin-requerir-alerta':  one('descanso.necesitaAlerta', 'no, puede permitirse estar más relajado/a'),

  // ── Solar ───────────────────────────────────────────────────────────
  'fototipo-muy-claro': one('solar.fototipo', 'se quema siempre y casi no broncea — necesita la protección más alta'),
  'fototipo-claro':     one('solar.fototipo', 'se quema primero y luego broncea'),
  'fototipo-medio':     one('solar.fototipo', 'broncea con facilidad, rara vez se quema'),
  'fototipo-oscuro':    one('solar.fototipo', 'casi nunca se quema'),

  'solar-diario':   one('solar.uso', 'cara, uso diario en ciudad'),
  'solar-cuerpo':   one('solar.uso', 'cuerpo'),
  'solar-playa':    one('solar.uso', 'playa, piscina o deporte en el agua'),
  'solar-outdoor':  one('solar.uso', 'montaña, running u outdoor intenso'),
  'solar-completo': one('solar.uso', 'todo: cara, cuerpo y exposición intensa'),

  'solar-bajo-maquillaje': many('solar.textura', 'lo usa debajo del maquillaje'),
  'solar-sin-blanco':      many('solar.textura', 'no quiere efecto blanco'),
  'solar-ligero':          many('solar.textura', 'piel grasa, busca textura ligera'),
  'solar-resistente':      many('solar.textura', 'necesita resistencia al agua y al sudor'),
  'solar-indiferente':     many('solar.textura', 'la textura le da igual, prioriza la protección'),

  'solar-prevenir': one('solar.momento', 'quiere prevenir, uso diario'),
  'solar-expuesto': one('solar.momento', 'está expuesto/a ahora'),
  'solar-post':     one('solar.momento', 'viene de una quemadura o exposición fuerte — necesita calmar y reparar, no solo proteger'),

  // ── Gym ─────────────────────────────────────────────────────────────
  'gym-fuerza':          one('gym.objetivo', 'ganar fuerza o masa muscular'),
  'gym-recuperacion':    one('gym.objetivo', 'recuperarse mejor'),
  'gym-energia':         one('gym.objetivo', 'más energía para entrenar'),
  'gym-resistencia':     one('gym.objetivo', 'mejorar resistencia'),
  'gym-articulaciones':  one('gym.objetivo', 'cuidar sus articulaciones'),
  'gym-hidratacion':     one('gym.objetivo', 'hidratarse mejor'),

  'gym-fuerza-alto':    one('gym.entrenamiento', 'fuerza, 4 o más veces por semana'),
  'gym-fuerza-medio':   one('gym.entrenamiento', 'fuerza, 2 o 3 veces por semana'),
  'gym-cardio':         one('gym.entrenamiento', 'cardio o resistencia'),
  'tipo-hiit':          one('gym.entrenamiento', 'HIIT o funcional'),
  'tipo-yoga':          one('gym.entrenamiento', 'yoga, pilates o movilidad'),
  'nivel-principiante': one('gym.entrenamiento', 'recién empieza'),

  'gym-sin-suplementos': one('gym.suplementosActuales', 'no toma nada todavía'),
  'gym-toma-proteina':   one('gym.suplementosActuales', 'ya toma proteína — no repetirla'),
  'gym-toma-varios':     one('gym.suplementosActuales', 'ya toma proteína y creatina — no repetirlas'),
  'gym-confundido':      one('gym.suplementosActuales', 'probó varios y no sabe cuáles valen la pena'),

  'gym-friccion-energia':      one('gym.friccion', 'le cuesta arrancar con energía'),
  'gym-friccion-dolor':        one('gym.friccion', 'queda muy adolorido/a al día siguiente'),
  'gym-friccion-hidratacion':  one('gym.friccion', 'se deshidrata o le dan calambres'),
  'dolor-frecuente':           one('gym.friccion', 'le molestan las articulaciones'),
  'gym-sin-friccion':          one('gym.friccion', 'nada en particular'),

  // ── Pies y cuerpo ───────────────────────────────────────────────────
  'pies-durezas':      many('piesCuerpo.problemas', 'durezas o callos'),
  'pies-talones':      many('piesCuerpo.problemas', 'talones agrietados'),
  'pies-secos':        many('piesCuerpo.problemas', 'pies muy secos'),
  'pies-cansados':     many('piesCuerpo.problemas', 'pies cansados o hinchados'),
  'pies-olor':         many('piesCuerpo.problemas', 'mal olor'),
  'cuerpo-rozaduras':  many('piesCuerpo.problemas', 'rozaduras o ampollas'),
  'cuerpo-seco':       many('piesCuerpo.problemas', 'piel del cuerpo seca'),
  'cuerpo-muscular':   many('piesCuerpo.problemas', 'recuperación muscular'),

  'pies-poco-tiempo':  one('piesCuerpo.horasDePie', 'menos de 2 horas al día'),
  'pies-medio-tiempo': one('piesCuerpo.horasDePie', 'entre 2 y 6 horas al día'),
  'pies-mucho-tiempo': one('piesCuerpo.horasDePie', 'más de 6 horas al día de pie'),

  'pies-intensivo':        one('piesCuerpo.intensidad', 'necesita un tratamiento intensivo, está bastante marcado'),
  'pies-mantenimiento':    one('piesCuerpo.intensidad', 'mantenimiento, que no empeore'),
  'pies-rutina-completa':  one('piesCuerpo.intensidad', 'una rutina completa de cuidado en casa'),

  // ── Hogar ───────────────────────────────────────────────────────────
  'hogar-adultos':      many('hogar.convivientes', 'solo adultos'),
  'hogar-ninos':        many('hogar.convivientes', 'niños pequeños — todo debe ser apto para menores'),
  'hogar-adolescentes': many('hogar.convivientes', 'adolescentes'),
  'hogar-mayores':      many('hogar.convivientes', 'adultos mayores'),
  'hogar-embarazo':     many('hogar.convivientes', 'alguien embarazada o dando de lactar'),

  'hogar-familiar':  one('hogar.lugar', 'en casa'),
  'hogar-auto':      one('hogar.lugar', 'en el auto'),
  'hogar-movil':     one('hogar.lugar', 'en la oficina o la mochila'),
  'hogar-compacto':  one('hogar.lugar', 'compacto, para llevar a todos lados'),

  'hogar-curaciones':  many('hogar.necesidades', 'curaciones: cortes, raspones, ampollas'),
  'hogar-dolor':       many('hogar.necesidades', 'dolor de cabeza o fiebre'),
  'hogar-golpes':      many('hogar.necesidades', 'golpes, esguinces o dolor muscular'),
  'hogar-quemaduras':  many('hogar.necesidades', 'quemaduras leves o picaduras'),
  'hogar-estomago':    many('hogar.necesidades', 'malestar estomacal'),
  'hogar-basico':      many('hogar.necesidades', 'lo básico, por si acaso'),

  // ── Viaje ───────────────────────────────────────────────────────────
  'viaje-playa':    one('viaje.destino', 'playa o destino tropical'),
  'viaje-ciudad':   one('viaje.destino', 'ciudad, trabajo o negocios'),
  'viaje-aventura': one('viaje.destino', 'montaña, senderismo o aventura'),
  'viaje-largo':    one('viaje.destino', 'varios destinos o vuelo largo'),

  'viaje-corto':          one('viaje.duracion', 'un fin de semana'),
  'viaje-medio':          one('viaje.duracion', 'una o dos semanas'),
  'viaje-largo-estadia':  one('viaje.duracion', 'más de dos semanas'),

  'viaje-preocupa-sol':       many('viaje.preocupaciones', 'el sol'),
  'viaje-preocupa-digestivo': many('viaje.preocupaciones', 'que le caiga mal la comida'),
  'viaje-preocupa-sueno':     many('viaje.preocupaciones', 'dormir bien o el cambio de horario'),
  'viaje-preocupa-botiquin':  many('viaje.preocupaciones', 'cortes, ampollas o picaduras'),
  'viaje-preocupa-piel':      many('viaje.preocupaciones', 'mantener su rutina de piel'),

  // ── Demografía ──────────────────────────────────────────────────────
  'edad-18-24':  one('demografia.rangoEdad', '18 a 24 años'),
  'edad-25-34':  one('demografia.rangoEdad', '25 a 34 años'),
  'edad-35-44':  one('demografia.rangoEdad', '35 a 44 años'),
  'edad-45-54':  one('demografia.rangoEdad', '45 a 54 años'),
  'edad-55-mas': one('demografia.rangoEdad', '55 años o más'),

  'sexo-mujer':      one('demografia.sexo', 'mujer'),
  'sexo-hombre':     one('demografia.sexo', 'hombre'),
  'sexo-no-decir':   one('demografia.sexo', 'prefiere no decirlo — usar lenguaje neutro'),

  // ── Ritual ──────────────────────────────────────────────────────────
  'presupuesto-bajo':     one('ritual.nivel', 'lo esencial'),
  'presupuesto-medio':    one('ritual.nivel', 'un ritual equilibrado'),
  'presupuesto-alto':     one('ritual.nivel', 'una rutina completa'),
  'presupuesto-premium':  one('ritual.nivel', 'la experiencia completa, lo mejor del catálogo'),

  // ── Preferencia de formulación ──────────────────────────────────────
  'pref-organico':        one('preferencias.natural', 'prefiere productos naturales u orgánicos'),
  'prefiere-natural':     one('preferencias.natural', 'para la persona es fundamental que todo sea natural u orgánico'),
  'natural-importante':   one('preferencias.natural', 'le importa lo natural, pero no es excluyente'),
  'natural-indiferente':  one('preferencias.natural', 'no es su prioridad, quiere resultados'),

  // ── Legado: cuestionarios anteriores ────────────────────────────────
  // Los perfiles guardados referencian estos slugs y deben seguir resolviendo.
  'obj-belleza':   one('objetivos.principal', 'su piel, rostro o cabello'),
  'obj-guia':      one('objetivos.principal', 'no lo tiene claro, pide orientación'),
  'foco-piel':     one('objetivos.principal', 'su piel'),
  'foco-cabello':  one('objetivos.principal', 'su cabello'),
  'guia-piel':       one('objetivos.principal', 'su piel o cabello'),
  'guia-bienestar':  one('objetivos.principal', 'su energía, estrés o sueño'),
  'guia-gym':        one('objetivos.principal', 'gym o recuperación'),
  'guia-digestivo':  one('objetivos.principal', 'su digestión o vitaminas'),
  'guia-viaje':      one('objetivos.principal', 'un viaje o protección solar'),
  'guia-hogar':      one('objetivos.principal', 'un botiquín o cuidado para casa'),
  'foco-colageno':   many('piel.preocupaciones', 'colágeno y belleza desde adentro'),
  'foco-antiedad':   many('piel.preocupaciones', 'antiedad integral'),
  'piel-firmeza':    many('piel.preocupaciones', 'firmeza y luminosidad'),
  'alerg-piel':      many('piel.preocupaciones', 'reacciona a algunos ingredientes'),
  'foco-sueno':        one('descanso.patron', 'no puede dormir bien'),
  'foco-estres':       one('descanso.patron', 'le cuesta relajarse, mucha carga mental'),
  'foco-sueno-estres': one('descanso.patron', 'mal sueño y mucho estrés a la vez'),
  'tipo-fuerza':   one('gym.entrenamiento', 'fuerza y musculación'),
  'tipo-cardio':   one('gym.entrenamiento', 'cardio, running o ciclismo'),
  'nivel-activo':  one('gym.entrenamiento', 'entrena 2 o 3 veces por semana'),
  'nivel-alto':    one('gym.entrenamiento', 'entrena 4 o más veces por semana'),
  'nivel-elite':   one('gym.entrenamiento', 'nivel competitivo o élite'),
  'sin-dolor':     one('gym.friccion', 'se mueve sin problemas'),
  'dolor-leve':    one('gym.friccion', 'molestias a veces, después de entrenar'),
  'pies-general':  many('piesCuerpo.problemas', 'cuidado general de pies y cuerpo'),
  'nutricion-base':   many('nutricion.carencias', 'vitaminas de base: omega, vitamina D, complejo B'),
  'nutricion-andino': many('nutricion.carencias', 'superalimentos andinos (maca, spirulina, cúrcuma)'),
  'rutina-simple':      one('ritual.tamano', 'muy simple, pocos productos'),
  'rutina-balanceada':  one('ritual.tamano', 'balanceada, lo necesario'),
  'rutina-completa':    one('ritual.tamano', 'completa, quiere más opciones'),
  'rutina-guiada':      one('ritual.tamano', 'pidió ser guiada/o'),
}

// Banderas de salud. El texto es la instrucción que verá la IA.
export const SAFETY_INDEX: Record<string, string> = {
  'cond-embarazo':     'EMBARAZO O LACTANCIA. Excluir melatonina, vitamina A en dosis alta, ashwagandha, retinol y estimulantes.',
  'cond-medicamentos': 'TOMA MEDICAMENTOS CON RECETA. Evitar omega-3 con anticoagulantes y magnesio con antibióticos. Recordar la consulta médica en el diagnóstico.',
  'cond-medica':       'CONDICIÓN MÉDICA DIAGNOSTICADA. Limitarse a productos de bajo riesgo y mencionar la consulta profesional.',
  'cond-reacciones':   'HA TENIDO REACCIONES FUERTES a productos similares. Priorizar fórmulas suaves e hipoalergénicas.',
  'cond-sintomas':     'SÍNTOMAS INTENSOS O PERSISTENTES. No plantear la rutina como tratamiento: indicar evaluación profesional en el diagnóstico.',
}

// Restricciones. El texto nombra lo que hay que excluir del producto.
export const RESTRICTION_INDEX: Record<string, string> = {
  'alerg-lactosa':       'lactosa',
  'alerg-gluten':        'gluten',
  'alerg-soya':          'soya',
  'alerg-frutos-secos':  'frutos secos',
  'alerg-azucar':        'azúcar añadida y edulcorantes',
  'alerg-cafeina':       'cafeína',
  'pref-vegano':         'ingredientes de origen animal (colágeno, whey, gelatina)',
  'pref-sin-fragancia':  'fragancias sintéticas',
}

function assign(idx: Record<string, unknown>, { path, value, list }: Assign) {
  const [head, tail] = path.split('.')
  if (!tail) return
  const bucket = (idx[head] ??= {}) as Record<string, unknown>
  if (list) {
    const arr = (bucket[tail] ??= []) as string[]
    if (!arr.includes(value)) arr.push(value)
  } else if (bucket[tail] === undefined) {
    // La primera respuesta gana: las ramas nuevas van antes que los slugs de
    // legado, así un perfil viejo no pisa uno nuevo.
    bucket[tail] = value
  }
}

export interface BuildInput {
  slugs: string[]
  /** Lo que la persona escribió en el campo abierto, ya recortado. */
  texto?: string | null
}

export function buildProfileIndex({ slugs, texto }: BuildInput): ProfileIndex {
  const idx: Record<string, unknown> = {
    demografia: {},
    objetivos: { secundarios: [] as string[] },
    preferencias: {},
    ritual: {},
  }
  const seguridad: string[] = []
  const restricciones: string[] = []

  // El mismo filtro que aplica el cliente, por si llegan respuestas antiguas o
  // construidas a mano: un objetivo secundario nunca duplica al principal.
  const objetivos = new Set(slugs.filter((s) => s.startsWith('obj-')))
  const depurados = slugs.filter((s) => !(s.startsWith('extra-') && objetivos.has(`obj-${s.slice(6)}`)))

  for (const slug of new Set(depurados)) {
    const a = SLUG_INDEX[slug]
    if (a) assign(idx, a)
    const s = SAFETY_INDEX[slug]
    if (s && !seguridad.includes(s)) seguridad.push(s)
    const r = RESTRICTION_INDEX[slug]
    if (r && !restricciones.includes(r)) restricciones.push(r)
  }

  const profile = idx as unknown as ProfileIndex
  profile.seguridad = seguridad
  profile.restricciones = restricciones
  const limpio = (texto ?? '').trim()
  if (limpio) profile.enSusPalabras = limpio
  return profile
}

// ── Serialización para el prompt ──────────────────────────────────────
// Un bloque estructurado rinde mejor que las líneas de pregunta/respuesta
// crudas: es más corto, no repite el texto de la interfaz y nombra cada dato
// por lo que significa.

const SECCIONES: Array<[keyof ProfileIndex, string, Record<string, string>]> = [
  ['piel',       'PIEL',            { tipo: 'tipo', loDedujimos: 'no sabía su tipo, lo dedujimos', preocupaciones: 'quiere mejorar', rutinaActual: 'rutina actual' }],
  ['cabello',    'CABELLO',         { tipo: 'tipo', cueroCabelludo: 'cuero cabelludo', problemas: 'quiere resolver', tratamientos: 'tratamientos' }],
  ['digestion',  'DIGESTIÓN',       { sintomas: 'le incomoda', momento: 'cuándo', yaProbo: 'ya probó' }],
  ['nutricion',  'NUTRICIÓN',       { carencias: 'siente que le falta', alimentacion: 'alimentación', exposicionSol: 'sol y aire libre' }],
  ['descanso',   'DESCANSO Y ESTRÉS', { patron: 'qué le pasa', frecuencia: 'frecuencia', cafeina: 'cafeína', necesitaAlerta: 'alerta de día' }],
  ['solar',      'SOL',             { fototipo: 'reacción al sol', uso: 'para qué lo necesita', textura: 'textura', momento: 'momento' }],
  ['gym',        'GYM',             { objetivo: 'busca', entrenamiento: 'entrena', suplementosActuales: 'toma hoy', friccion: 'lo que se le hace cuesta arriba' }],
  ['piesCuerpo', 'PIES Y CUERPO',   { problemas: 'quiere resolver', horasDePie: 'horas de pie', intensidad: 'necesita' }],
  ['hogar',      'HOGAR',           { convivientes: 'quiénes viven en casa', lugar: 'dónde va a estar', necesidades: 'suele necesitar' }],
  ['viaje',      'VIAJE',           { destino: 'destino', duracion: 'duración', preocupaciones: 'le preocupa' }],
]

export function renderProfile(p: ProfileIndex): string {
  const out: string[] = []
  const push = (label: string, v: unknown) => {
    if (v === undefined || v === null || (Array.isArray(v) && !v.length)) return
    out.push(`- ${label}: ${Array.isArray(v) ? v.join(', ') : v}`)
  }

  out.push('QUIÉN ES')
  push('edad', p.demografia?.rangoEdad)
  push('sexo', p.demografia?.sexo ?? 'no lo dijo — usar lenguaje neutro')
  push('quiere cuidar', p.objetivos?.principal)
  push('además le interesa', p.objetivos?.secundarios)

  for (const [key, titulo, campos] of SECCIONES) {
    const sec = p[key] as Record<string, unknown> | undefined
    if (!sec) continue
    const antes = out.length
    out.push('', titulo)
    for (const [campo, label] of Object.entries(campos)) push(label, sec[campo])
    if (out.length === antes + 2) out.length = antes  // sección vacía
  }

  out.push('', 'CÓMO LO VA A USAR')
  push('nivel del ritual', p.ritual?.nivel)
  push('tamaño de rutina', p.ritual?.tamano)
  push('formulación', p.preferencias?.natural)

  return out.join('\n')
}
