// Fuente única del rediseño del cuestionario LIORA.
// De aquí se generan el informe de revisión de copy y la migración SQL,
// para que texto y base de datos no se desincronicen.
//
// status: 'new'    → fila nueva
//         'keep'   → fila existente que se mantiene tal cual
//         'retire' → fila existente que se oculta con condición imposible
//                    (nunca se borra: quiz_profiles.answers referencia sus UUIDs)

export const RETIRE_CONDITION = { if_any_slug: ['retirada-rediseno-indices'] }

export const GROUPS = [
  { key: 'g1', title: '¿Qué buscas?',   sort: 1, interstitial: null },
  { key: 'g2', title: 'Cuéntanos más',  sort: 2, interstitial: null },
  { key: 'g3', title: 'Para terminar',  sort: 3, interstitial: 'Ya casi. Solo unas últimas preguntas.' },
]

// Preguntas actuales que se retiran (se ocultan, no se borran)
export const RETIRED = [
  { id: '55550012-0001-0001-0000-000000000001', text: '¿Qué quieres cuidar hoy?',            motivo: 'Reemplazada: obj-belleza se divide en piel y cabello, y se añade la salida de texto libre.' },
  { id: '55550012-0002-0004-0000-000000000001', text: '¿En qué quieres enfocarte?',          motivo: 'Innecesaria: piel y cabello ya son puertas separadas en Q1.' },
  { id: '55550012-0002-0012-0000-000000000001', text: '¿Qué tan importante es que sean productos naturales u orgánicos?', motivo: 'Ocupa una pantalla para una señal binaria. Pasa a ser una opción en Restricciones.' },
  { id: '55550012-0003-0006-0000-000000000001', text: '¿Qué tipo de rutina prefieres?',      motivo: 'Duplica «¿Cómo quieres armar tu kit?»; su opción «No sé» mapea al mismo hint que «balanceada».' },
  { id: '55550012-0003-0002-0000-000000000001', text: '¿Tienes piel o cuero cabelludo sensible?', motivo: 'Absorbida por el nuevo tipo de piel y las preocupaciones de piel.' },
  { id: '55550012-0003-0005-0000-000000000001', text: 'Antes de recomendarte, ¿hay algo que debamos saber?', motivo: 'Se divide en dos pantallas: salud por un lado, restricciones y preferencias por otro.' },
  { id: 'ba9c0d19-82d9-40fe-b91c-0de2dba7fe64', text: '¿Cuál de estas se parece más a lo que necesitas?', motivo: 'Era la Q1 reformulada: a quien acaba de decir «no estoy seguro» no lo ayuda la misma lista con otras palabras. Su lugar lo toma el campo de texto abierto.' },
  { id: '55550012-0002-0002-0000-000000000001', text: '¿Cuál es tu nivel de entrenamiento?', motivo: 'Fusionada con el tipo de entrenamiento en una sola pregunta.' },
  { id: '55550012-0002-0003-0000-000000000001', text: '¿Sientes molestias en articulaciones o rodillas?', motivo: 'Absorbida por «¿Qué se te hace más cuesta arriba?».' },
  { id: '55550012-0002-0001-0000-000000000001', text: '¿Qué tipo de entrenamiento haces?',   motivo: 'Fusionada con el nivel de entrenamiento.' },
  { id: '55550012-0002-0005-0000-000000000001', text: '¿Cuál es tu tipo de piel?',            motivo: 'Reemplazada por una versión con salida «no estoy seguro/a» y pregunta proxy.' },
  { id: '55550012-0002-0006-0000-000000000001', text: '¿Qué te preocupa más de tu piel?',     motivo: 'Reemplazada: faltaban brotes, luminosidad, hidratación y marcas.' },
  { id: '55550012-0002-0007-0000-000000000001', text: '¿Cuál es tu problema capilar principal?', motivo: 'Reemplazada por la rama de cabello completa.' },
  { id: '55550012-0002-0008-0000-000000000001', text: '¿Qué es lo que más te afecta en tu día a día?', motivo: 'Reemplazada: no distinguía conciliar / mantener / sueño no reparador.' },
  { id: '55550012-0002-0010-0000-000000000001', text: '¿Cuál es tu síntoma principal?',       motivo: 'Reemplazada: faltaban pesadez e irregularidad.' },
  { id: '55550012-0002-0011-0000-000000000001', text: '¿Cuál es tu prioridad?',               motivo: 'Reemplazada: faltaban concentración, belleza, huesos, ánimo y la salida «no sé».' },
  { id: '55550012-0002-0013-0000-000000000001', text: '¿Cómo es tu exposición al sol normalmente?', motivo: 'Reemplazada por la rama solar completa (fototipo, uso, textura, momento).' },
  { id: '55550012-0002-0014-0000-000000000001', text: '¿Qué tipo de destino es tu viaje?',    motivo: 'Se mantiene el contenido pero pasa a la rama de viaje ampliada.' },
  { id: '55550012-0002-0015-0000-000000000001', text: '¿Qué tipo de kit buscas para casa?',   motivo: 'Reemplazada: no preguntaba para quién es, que es una brecha de seguridad.' },
  { id: '55550012-0002-0016-0000-000000000001', text: '¿Qué te preocupa principalmente?',     motivo: 'Reemplazada por la rama de pies y cuerpo ampliada.' },
  { id: '55550012-0002-0017-0000-000000000001', text: '¿Qué buscas principalmente con tu entrenamiento?', motivo: 'Se mantiene el contenido dentro de la rama de gym reordenada.' },
  { id: '55550012-0002-0009-0000-000000000001', text: '¿Con qué frecuencia lo sientes?',      motivo: 'Se recrea con condiciones sobre los nuevos slugs de sueño y estrés.' },
]

// ── Áreas: usadas por Q1, Q1b y la rama guía ──────────────────────────
const AREAS = [
  { slug: 'piel',        q1: 'Mi piel y mi rostro',                   guia: 'Quiero cuidar mi piel' },
  { slug: 'cabello',     q1: 'Mi cabello',                            guia: 'Quiero cuidar mi cabello' },
  { slug: 'bienestar',   q1: 'Mi descanso, calma o energía',          guia: 'Ando con poca energía, estrés o mal sueño' },
  { slug: 'rendimiento', q1: 'Gym y rendimiento',                     guia: 'Quiero algo para el gym o la recuperación' },
  { slug: 'digestivo',   q1: 'Mi digestión',                          guia: 'Tengo molestias digestivas' },
  { slug: 'nutricion',   q1: 'Vitaminas y nutrición de base',         guia: 'Creo que me faltan vitaminas' },
  { slug: 'solar',       q1: 'Protección solar',                      guia: 'Quiero protección solar' },
  { slug: 'pies-cuerpo', q1: 'Mis pies o mi cuerpo',                  guia: 'Mis pies o mi cuerpo necesitan cuidado' },
  { slug: 'hogar',       q1: 'Mi hogar, familia o primeros auxilios', guia: 'Quiero un botiquín para casa' },
  { slug: 'viaje',       q1: 'Un viaje, playa u outdoor',             guia: 'Me voy de viaje' },
]

export const QUESTIONS = [
  // ══ BLOQUE 1 ══════════════════════════════════════════════════════
  {
    key: 'q1', group: 'g1', sort: 1, type: 'single', required: true, status: 'new',
    text: '¿Qué quieres cuidar hoy?',
    subtext: 'Elige lo que más se parece a lo que necesitas ahora.',
    conditions: null,
    note: 'Reemplaza la Q1 actual. Dos cambios: piel y cabello se separan (hoy «Mi piel, rostro o cabello» esconde 28 productos de cabello que el motor no puede alcanzar), y las dos salidas de escape se fusionan en una. Antes «guíame» y «prefiero escribir» iban por separado pero llevaban al mismo sitio: ahora es una sola opción que deja claro que lo siguiente es escribir.',
    options: [
      ...AREAS.map(a => ({ text: a.q1, slug: `obj-${a.slug}` })),
      { text: 'No estoy seguro/a — prefiero contarles con mis palabras', slug: 'obj-texto-libre', render: 'secundaria' },
    ],
  },
  {
    key: 'q1b', group: 'g1', sort: 2, type: 'multi', required: false, maxSelect: 3, status: 'new',
    text: '¿Algo más que quieras trabajar?',
    subtext: 'Opcional. No alarga el cuestionario: solo nos ayuda a que tu rutina cubra todo lo tuyo.',
    // Solo aparece cuando hay un objetivo declarado: preguntarle «¿algo más?»
    // a quien eligió contarlo con sus palabras no tiene sentido. El cliente
    // además oculta la opción del objetivo ya elegido.
    conditions: { if_any_slug: AREAS.map(a => `obj-${a.slug}`) },
    note: 'No abre ramas — solo alimenta el índice como objetivos secundarios. No aparece en la ruta de texto libre, y la opción del objetivo ya elegido se oculta.',
    options: [
      ...AREAS.filter(a => a.slug !== 'viaje' && a.slug !== 'hogar').map(a => ({ text: a.q1, slug: `extra-${a.slug}` })),
      { text: 'Nada más por ahora', slug: 'sin-extras' },
    ],
  },

  // ══ BLOQUE 2 — PIEL ═══════════════════════════════════════════════
  {
    key: 'piel1', group: 'g2', sort: 10, type: 'single', required: true, status: 'new',
    text: '¿Cómo describirías tu piel?',
    subtext: 'Si no estás seguro/a, no pasa nada — te ayudamos en la siguiente.',
    conditions: { if_any_slug: ['obj-piel'] },
    note: 'Responde a «¿cómo sé si mi piel es seca, grasa o mixta?». La salida «no estoy seguro/a» es obligatoria: hoy quien no sabe tiene que adivinar.',
    options: [
      { text: 'Grasa: brilla y los poros se notan', slug: 'piel-grasa' },
      { text: 'Mixta: brilla en frente y nariz, normal en las mejillas', slug: 'piel-mixta' },
      { text: 'Seca: la siento áspera o tirante', slug: 'piel-seca' },
      { text: 'Sensible: se irrita o enrojece con facilidad', slug: 'piel-sensible' },
      { text: 'Normal: sin mayores problemas', slug: 'piel-normal' },
      { text: 'No estoy seguro/a', slug: 'piel-no-se' },
    ],
  },
  {
    key: 'piel2', group: 'g2', sort: 11, type: 'single', required: true, status: 'new',
    text: 'A media tarde, sin retocarte, ¿cómo sientes la cara?',
    subtext: 'Con esto lo deducimos nosotros.',
    conditions: { if_any_slug: ['piel-no-se'] },
    note: 'Pregunta proxy: infiere el tipo de piel por comportamiento observable en vez de pedir un autodiagnóstico. La cuarta opción captura el caso «tengo piel grasa pero se me reseca» = deshidratada, que hoy no existe en el cuestionario.',
    options: [
      { text: 'Brillosa en frente y nariz, el resto normal', slug: 'piel-mixta' },
      { text: 'Brillosa en toda la cara', slug: 'piel-grasa' },
      { text: 'Tirante o con zonas ásperas', slug: 'piel-seca' },
      { text: 'Brillosa y tirante a la vez', slug: 'piel-deshidratada' },
      { text: 'Cómoda, ni brillo ni tirantez', slug: 'piel-normal' },
      { text: 'Con rojeces o ardor', slug: 'piel-sensible' },
    ],
  },
  {
    key: 'piel3', group: 'g2', sort: 12, type: 'multi', required: true, status: 'new',
    text: '¿Qué te gustaría mejorar?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-piel'] },
    note: 'Añade brotes, luminosidad, hidratación y marcas — cuatro de las consultas más frecuentes que hoy no tienen dónde caer.',
    options: [
      { text: 'Granitos o brotes', slug: 'piel-brotes' },
      { text: 'Puntos negros y poros abiertos', slug: 'piel-poros' },
      { text: 'Manchas o tono desigual', slug: 'piel-manchas' },
      { text: 'Líneas de expresión y falta de firmeza', slug: 'piel-arrugas' },
      { text: 'Falta de luminosidad', slug: 'piel-luminosidad' },
      { text: 'Rojeces o irritación', slug: 'piel-rojeces' },
      { text: 'Falta de hidratación', slug: 'piel-hidratacion' },
      { text: 'Marcas de granitos pasados', slug: 'piel-marcas' },
    ],
  },
  {
    key: 'piel4', group: 'g2', sort: 13, type: 'single', required: true, status: 'new',
    text: '¿Cómo es tu rutina hoy?',
    subtext: 'Para no recomendarte algo demasiado fuerte de entrada.',
    conditions: { if_any_slug: ['obj-piel'] },
    note: 'Decide si es responsable proponer retinol o ácidos. Responde a «¿necesito sérum?», «¿retinol, vitamina C o ácido hialurónico?» y «quiero empezar una rutina, ¿qué compro?».',
    options: [
      { text: 'No tengo rutina, quiero empezar', slug: 'rutina-piel-ninguna' },
      { text: 'Limpio e hidrato, nada más', slug: 'rutina-piel-basica' },
      { text: 'Ya uso activos (vitamina C, ácidos, retinol)', slug: 'rutina-piel-activos' },
      { text: 'Probé activos y me irritaron', slug: 'rutina-piel-intolerancia' },
    ],
  },

  // ══ BLOQUE 2 — CABELLO (rama nueva) ═══════════════════════════════
  {
    key: 'cab1', group: 'g2', sort: 20, type: 'single', required: true, status: 'new',
    text: '¿Cómo es tu cabello?',
    conditions: { if_any_slug: ['obj-cabello'] },
    note: 'Rama nueva completa. Hoy cabello es un subcaso de belleza con una sola pregunta, y sus 28 productos vendibles son inalcanzables para el motor.',
    options: [
      { text: 'Liso', slug: 'cabello-liso' },
      { text: 'Ondulado', slug: 'cabello-ondulado' },
      { text: 'Rizado o afro', slug: 'cabello-rizado' },
      { text: 'No estoy seguro/a', slug: 'cabello-tipo-no-se' },
    ],
  },
  {
    key: 'cab2', group: 'g2', sort: 21, type: 'single', required: true, status: 'new',
    text: '¿Y tu cuero cabelludo?',
    conditions: { if_any_slug: ['obj-cabello'] },
    options: [
      { text: 'Se engrasa rápido', slug: 'cuero-graso' },
      { text: 'Seco o con picazón', slug: 'cuero-seco' },
      { text: 'Con caspa', slug: 'cuero-caspa' },
      { text: 'Normal', slug: 'cuero-normal' },
    ],
  },
  {
    key: 'cab3', group: 'g2', sort: 22, type: 'multi', required: true, status: 'new',
    text: '¿Qué quieres resolver?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-cabello'] },
    options: [
      { text: 'Caída o poco volumen', slug: 'cabello-caida' },
      { text: 'Sequedad, quiebre o puntas abiertas', slug: 'cabello-sequedad' },
      { text: 'Frizz y falta de brillo', slug: 'cabello-frizz' },
      { text: 'Crecimiento lento', slug: 'cabello-crecimiento' },
      { text: 'Exceso de grasa', slug: 'cabello-grasa' },
      { text: 'Caspa', slug: 'cabello-caspa' },
    ],
  },
  {
    key: 'cab4', group: 'g2', sort: 23, type: 'multi', required: true, status: 'new',
    text: '¿Tu cabello pasa por alguno de estos?',
    conditions: { if_any_slug: ['obj-cabello'] },
    note: 'Teñido y decolorado cambian por completo qué producto conviene; hoy no se pregunta.',
    options: [
      { text: 'Lo tiño o me hago mechas', slug: 'cabello-tenido' },
      { text: 'Está decolorado', slug: 'cabello-decolorado' },
      { text: 'Uso plancha o secadora seguido', slug: 'cabello-calor' },
      { text: 'Ninguno, lo llevo natural', slug: 'sin-tratamiento-capilar' },
    ],
  },

  // ══ BLOQUE 2 — DIGESTIVO ══════════════════════════════════════════
  {
    key: 'dig1', group: 'g2', sort: 30, type: 'multi', required: true, status: 'new',
    text: '¿Qué es lo que más te incomoda?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-digestivo'] },
    note: 'Añade pesadez e irregularidad. Nota de contenido: el copy habla de bienestar digestivo y apoyo, nunca de tratar o curar.',
    options: [
      { text: 'Hinchazón y gases', slug: 'digestivo-hinchazon' },
      { text: 'Estreñimiento o tránsito lento', slug: 'digestivo-estrenimiento' },
      { text: 'Reflujo o acidez', slug: 'digestivo-reflujo' },
      { text: 'Pesadez después de comer', slug: 'digestivo-pesadez' },
      { text: 'Digestión irregular, cambia de un día a otro', slug: 'digestivo-irregular' },
      { text: 'Nada puntual, quiero cuidar mi digestión', slug: 'digestivo-reset' },
    ],
  },
  {
    key: 'dig2', group: 'g2', sort: 31, type: 'single', required: true, status: 'new',
    text: '¿Cuándo lo sientes más?',
    conditions: { if_any_slug: ['obj-digestivo'] },
    note: 'El momento distingue enzimas (con la comida) de probióticos (rutina sostenida) — hoy no se pregunta y la IA tiene que adivinar.',
    options: [
      { text: 'Justo después de comer', slug: 'digestivo-postcomida' },
      { text: 'A lo largo de todo el día', slug: 'digestivo-continuo' },
      { text: 'Solo con ciertas comidas', slug: 'digestivo-gatillos' },
      { text: 'Por temporadas, sobre todo con estrés', slug: 'digestivo-estres' },
    ],
  },
  {
    key: 'dig3', group: 'g2', sort: 32, type: 'single', required: true, status: 'new',
    text: '¿Has tomado algo para esto?',
    subtext: 'Para no recomendarte lo que ya probaste.',
    conditions: { if_any_slug: ['obj-digestivo'] },
    options: [
      { text: 'Nunca he tomado nada', slug: 'digestivo-sin-experiencia' },
      { text: 'Tomo o he tomado probióticos', slug: 'digestivo-probioticos' },
      { text: 'Tomo fibra', slug: 'digestivo-fibra' },
      { text: 'Probé algo y no me funcionó', slug: 'digestivo-sin-resultado' },
    ],
  },

  // ══ BLOQUE 2 — NUTRICIÓN ══════════════════════════════════════════
  {
    key: 'nut1', group: 'g2', sort: 40, type: 'multi', required: true, status: 'new',
    text: '¿Qué sientes que te falta?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-nutricion'] },
    note: 'La salida «no sé qué me falta» es la consulta más común de esta categoría y hoy no existe.',
    options: [
      { text: 'Energía, me canso rápido', slug: 'nutricion-energia' },
      { text: 'Defensas, me enfermo seguido', slug: 'nutricion-inmune' },
      { text: 'Concentración y claridad mental', slug: 'nutricion-concentracion' },
      { text: 'Piel, cabello y uñas fuertes', slug: 'nutricion-belleza' },
      { text: 'Huesos y articulaciones', slug: 'nutricion-huesos' },
      { text: 'Ánimo estable', slug: 'nutricion-animo' },
      { text: 'No sé qué me falta, oriéntenme', slug: 'nutricion-no-se' },
    ],
  },
  {
    key: 'nut2', group: 'g2', sort: 41, type: 'single', required: true, status: 'new',
    text: '¿Cómo es tu alimentación?',
    conditions: { if_any_slug: ['obj-nutricion'] },
    note: 'Determina B12 y hierro. Cruzada con edad y sexo responde «¿qué vitaminas recomiendan para hombres / para mujeres / según la edad?».',
    options: [
      { text: 'Como de todo', slug: 'dieta-omnivora' },
      { text: 'Vegetariana', slug: 'dieta-vegetariana' },
      { text: 'Vegana', slug: 'dieta-vegana' },
      { text: 'Como poca carne o lácteos', slug: 'dieta-baja-animal' },
      { text: 'Irregular, como a deshoras', slug: 'dieta-irregular' },
    ],
  },
  {
    key: 'nut3', group: 'g2', sort: 42, type: 'single', required: true, status: 'new',
    text: '¿Cuánto sol y aire libre te da al día?',
    subtext: 'Nos dice si conviene reforzar la vitamina D.',
    conditions: { if_any_slug: ['obj-nutricion'] },
    options: [
      { text: 'Casi nada, paso el día en interiores', slug: 'sol-nada' },
      { text: 'Un rato, al ir y volver', slug: 'sol-poco' },
      { text: 'Bastante, estoy fuera varias horas', slug: 'sol-mucho' },
    ],
  },

  // ══ BLOQUE 2 — DESCANSO Y ESTRÉS ══════════════════════════════════
  {
    key: 'bie1', group: 'g2', sort: 50, type: 'single', required: true, status: 'new',
    text: '¿Qué se parece más a lo que te pasa?',
    conditions: { if_any_slug: ['obj-bienestar'] },
    note: 'Hoy «no puedo dormir bien» junta tres problemas distintos con soluciones distintas. Separar conciliar / mantener / sueño no reparador es lo que permite elegir entre melatonina, magnesio o adaptógenos.',
    options: [
      { text: 'Me cuesta quedarme dormido/a', slug: 'sueno-conciliar' },
      { text: 'Me despierto durante la noche', slug: 'sueno-mantener' },
      { text: 'Duermo, pero amanezco cansado/a', slug: 'sueno-no-repara' },
      { text: 'Mi mente no para durante el día', slug: 'estres-mental' },
      { text: 'Me falta energía todo el día', slug: 'foco-energia' },
      { text: 'Paso muchas horas frente a pantallas', slug: 'foco-pantallas' },
    ],
  },
  {
    key: 'bie2', group: 'g2', sort: 51, type: 'single', required: true, status: 'new',
    text: '¿Con qué frecuencia?',
    conditions: { if_any_slug: ['sueno-conciliar', 'sueno-mantener', 'sueno-no-repara', 'estres-mental'] },
    options: [
      { text: 'Casi todos los días', slug: 'frecuencia-diaria' },
      { text: 'Varias veces a la semana', slug: 'frecuencia-semanal' },
      { text: 'Solo en épocas de carga', slug: 'frecuencia-ocasional' },
    ],
  },
  {
    key: 'bie3', group: 'g2', sort: 52, type: 'single', required: true, status: 'new',
    text: '¿Cómo va tu café o tus energizantes?',
    conditions: { if_any_slug: ['obj-bienestar'] },
    note: 'La cafeína después de las 4 pm suele ser la causa real del mal sueño. Sin este dato la rutina ataca el síntoma y no el origen.',
    options: [
      { text: 'No tomo', slug: 'cafeina-nada' },
      { text: 'Uno o dos, en la mañana', slug: 'cafeina-manana' },
      { text: 'Varios a lo largo del día', slug: 'cafeina-varios' },
      { text: 'También en la tarde o noche', slug: 'cafeina-tarde' },
    ],
  },
  {
    key: 'bie4', group: 'g2', sort: 53, type: 'single', required: true, status: 'new',
    text: 'Durante el día, ¿necesitas estar bien despierto/a?',
    subtext: 'Para no recomendarte nada que te dé sueño cuando no toca.',
    conditions: { if_any_slug: ['obj-bienestar'] },
    note: 'Responde directamente a «¿qué puedo usar sin que me dé sueño durante el día?» y separa melatonina de magnesio.',
    options: [
      { text: 'Sí, necesito estar alerta y concentrado/a', slug: 'requiere-alerta' },
      { text: 'No, puedo permitirme estar más relajado/a', slug: 'sin-requerir-alerta' },
    ],
  },

  // ══ BLOQUE 2 — SOLAR ══════════════════════════════════════════════
  {
    key: 'sol1', group: 'g2', sort: 60, type: 'single', required: true, status: 'new',
    text: '¿Cómo reacciona tu piel al sol?',
    subtext: 'Nos dice qué SPF necesitas de verdad.',
    conditions: { if_any_slug: ['obj-solar'] },
    note: 'Fototipo preguntado por comportamiento, no por escalas técnicas. Responde a «¿SPF 30 o SPF 50?».',
    options: [
      { text: 'Me quemo siempre, casi no bronceo', slug: 'fototipo-muy-claro' },
      { text: 'Me quemo primero y luego bronceo', slug: 'fototipo-claro' },
      { text: 'Bronceo con facilidad, rara vez me quemo', slug: 'fototipo-medio' },
      { text: 'Casi nunca me quemo', slug: 'fototipo-oscuro' },
    ],
  },
  {
    key: 'sol2', group: 'g2', sort: 61, type: 'single', required: true, status: 'new',
    text: '¿Para qué lo necesitas?',
    conditions: { if_any_slug: ['obj-solar'] },
    options: [
      { text: 'Cara, todos los días en la ciudad', slug: 'solar-diario' },
      { text: 'Cuerpo', slug: 'solar-cuerpo' },
      { text: 'Playa, piscina o deporte en el agua', slug: 'solar-playa' },
      { text: 'Montaña, running u outdoor intenso', slug: 'solar-outdoor' },
      { text: 'Todo lo anterior', slug: 'solar-completo' },
    ],
  },
  {
    key: 'sol3', group: 'g2', sort: 62, type: 'multi', required: true, status: 'new',
    text: '¿Algo importante sobre cómo se siente en la piel?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-solar'] },
    note: 'Las tres objeciones que más hacen abandonar un protector: deja blanco, no va bajo el maquillaje, es pesado en piel grasa. Hoy no se preguntan.',
    options: [
      { text: 'Lo uso debajo del maquillaje', slug: 'solar-bajo-maquillaje' },
      { text: 'No quiero que me deje la cara blanca', slug: 'solar-sin-blanco' },
      { text: 'Mi piel es grasa, busco algo ligero', slug: 'solar-ligero' },
      { text: 'Necesito que resista agua y sudor', slug: 'solar-resistente' },
      { text: 'Me da igual, que proteja bien', slug: 'solar-indiferente' },
    ],
  },
  {
    key: 'sol4', group: 'g2', sort: 63, type: 'single', required: true, status: 'new',
    text: '¿En qué momento estás?',
    conditions: { if_any_slug: ['obj-solar'] },
    note: 'Abre el eje antes / durante / después del sol: quien viene de una quemadura necesita after-sun y calmantes, no solo SPF.',
    options: [
      { text: 'Quiero prevenir, para el uso diario', slug: 'solar-prevenir' },
      { text: 'Estoy expuesto/a ahora (verano, viaje, playa)', slug: 'solar-expuesto' },
      { text: 'Vengo de una quemadura o exposición fuerte', slug: 'solar-post' },
    ],
  },

  // ══ BLOQUE 2 — GYM ════════════════════════════════════════════════
  {
    key: 'gym1', group: 'g2', sort: 70, type: 'single', required: true, status: 'new',
    text: '¿Qué buscas principalmente?',
    conditions: { if_any_slug: ['obj-rendimiento'] },
    options: [
      { text: 'Ganar fuerza o masa muscular', slug: 'gym-fuerza' },
      { text: 'Recuperarme mejor', slug: 'gym-recuperacion' },
      { text: 'Tener más energía para entrenar', slug: 'gym-energia' },
      { text: 'Mejorar mi resistencia', slug: 'gym-resistencia' },
      { text: 'Cuidar mis articulaciones', slug: 'gym-articulaciones' },
      { text: 'Hidratarme mejor', slug: 'gym-hidratacion' },
    ],
  },
  {
    key: 'gym2', group: 'g2', sort: 71, type: 'single', required: true, status: 'new',
    text: '¿Cómo y cuánto entrenas?',
    conditions: { if_any_slug: ['obj-rendimiento'] },
    note: 'Fusiona las dos preguntas actuales (tipo y nivel) en una. Ahorra una pantalla sin perder información.',
    options: [
      { text: 'Fuerza, 4 o más veces por semana', slug: 'gym-fuerza-alto' },
      { text: 'Fuerza, 2 o 3 veces por semana', slug: 'gym-fuerza-medio' },
      { text: 'Cardio o resistencia (running, ciclismo, natación)', slug: 'gym-cardio' },
      { text: 'HIIT o funcional', slug: 'tipo-hiit' },
      { text: 'Yoga, pilates o movilidad', slug: 'tipo-yoga' },
      { text: 'Recién estoy empezando', slug: 'nivel-principiante' },
    ],
  },
  {
    key: 'gym3', group: 'g2', sort: 72, type: 'single', required: true, status: 'new',
    text: '¿Qué tomas hoy?',
    subtext: 'Para no recomendarte lo que ya tienes.',
    conditions: { if_any_slug: ['obj-rendimiento'] },
    note: 'Responde a «¿necesito creatina si recién estoy empezando?» y «¿qué suplementos sirven realmente y cuáles no necesito?».',
    options: [
      { text: 'Nada todavía', slug: 'gym-sin-suplementos' },
      { text: 'Proteína', slug: 'gym-toma-proteina' },
      { text: 'Proteína y creatina', slug: 'gym-toma-varios' },
      { text: 'Probé varios y no sé cuáles valen la pena', slug: 'gym-confundido' },
    ],
  },
  {
    key: 'gym4', group: 'g2', sort: 73, type: 'single', required: true, status: 'new',
    text: '¿Qué se te hace más cuesta arriba?',
    conditions: { if_any_slug: ['obj-rendimiento'] },
    note: 'Absorbe la pregunta actual de molestias articulares y añade el problema más citado: «¿cómo evito sentirme destruido al día siguiente?».',
    options: [
      { text: 'Arrancar el entrenamiento con energía', slug: 'gym-friccion-energia' },
      { text: 'El día siguiente: quedo adolorido/a', slug: 'gym-friccion-dolor' },
      { text: 'Me deshidrato o me dan calambres', slug: 'gym-friccion-hidratacion' },
      { text: 'Las articulaciones me molestan', slug: 'dolor-frecuente' },
      { text: 'Nada en particular', slug: 'gym-sin-friccion' },
    ],
  },

  // ══ BLOQUE 2 — PIES Y CUERPO ══════════════════════════════════════
  {
    key: 'pie1', group: 'g2', sort: 80, type: 'multi', required: true, status: 'new',
    text: '¿Qué quieres resolver?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-pies-cuerpo'] },
    note: 'Pasa de 1 pregunta a 3 en una categoría con 32 productos. Talones agrietados, pies cansados y mal olor son consultas frecuentes que hoy no tienen dónde caer.',
    options: [
      { text: 'Durezas o callos', slug: 'pies-durezas' },
      { text: 'Talones agrietados', slug: 'pies-talones' },
      { text: 'Pies muy secos', slug: 'pies-secos' },
      { text: 'Pies cansados o hinchados', slug: 'pies-cansados' },
      { text: 'Mal olor', slug: 'pies-olor' },
      { text: 'Rozaduras o ampollas', slug: 'cuerpo-rozaduras' },
      { text: 'Piel del cuerpo seca', slug: 'cuerpo-seco' },
      { text: 'Recuperación muscular', slug: 'cuerpo-muscular' },
    ],
  },
  {
    key: 'pie2', group: 'g2', sort: 81, type: 'single', required: true, status: 'new',
    text: '¿Cuántas horas pasas de pie al día?',
    conditions: { if_any_slug: ['obj-pies-cuerpo'] },
    note: 'Responde a «¿qué puedo usar después de estar todo el día parado?» y calibra la intensidad del tratamiento.',
    options: [
      { text: 'Menos de 2', slug: 'pies-poco-tiempo' },
      { text: 'Entre 2 y 6', slug: 'pies-medio-tiempo' },
      { text: 'Más de 6', slug: 'pies-mucho-tiempo' },
    ],
  },
  {
    key: 'pie3', group: 'g2', sort: 82, type: 'single', required: true, status: 'new',
    text: '¿Qué necesitas ahora?',
    conditions: { if_any_slug: ['obj-pies-cuerpo'] },
    options: [
      { text: 'Un tratamiento intensivo, está bastante marcado', slug: 'pies-intensivo' },
      { text: 'Mantenimiento, que no empeore', slug: 'pies-mantenimiento' },
      { text: 'Una rutina completa de cuidado en casa', slug: 'pies-rutina-completa' },
    ],
  },

  // ══ BLOQUE 2 — HOGAR ══════════════════════════════════════════════
  {
    key: 'hog1', group: 'g2', sort: 90, type: 'multi', required: true, status: 'new',
    text: '¿Quiénes viven en casa?',
    subtext: 'Importa para elegir productos seguros para todos.',
    conditions: { if_any_slug: ['obj-hogar'] },
    note: 'BRECHA DE SEGURIDAD ACTUAL: hoy se arma un botiquín familiar sin saber si hay niños pequeños, adultos mayores o alguien embarazada.',
    options: [
      { text: 'Solo adultos', slug: 'hogar-adultos' },
      { text: 'Niños pequeños', slug: 'hogar-ninos' },
      { text: 'Adolescentes', slug: 'hogar-adolescentes' },
      { text: 'Adultos mayores', slug: 'hogar-mayores' },
      { text: 'Alguien embarazada o dando de lactar', slug: 'hogar-embarazo' },
    ],
  },
  {
    key: 'hog2', group: 'g2', sort: 91, type: 'single', required: true, status: 'new',
    text: '¿Dónde va a estar?',
    conditions: { if_any_slug: ['obj-hogar'] },
    options: [
      { text: 'En casa', slug: 'hogar-familiar' },
      { text: 'En el auto', slug: 'hogar-auto' },
      { text: 'En la oficina o la mochila', slug: 'hogar-movil' },
      { text: 'Uno compacto para llevar a todos lados', slug: 'hogar-compacto' },
    ],
  },
  {
    key: 'hog3', group: 'g2', sort: 92, type: 'multi', required: true, status: 'new',
    text: '¿Qué sueles necesitar?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-hogar'] },
    options: [
      { text: 'Curaciones: cortes, raspones, ampollas', slug: 'hogar-curaciones' },
      { text: 'Dolor de cabeza o fiebre', slug: 'hogar-dolor' },
      { text: 'Golpes, esguinces o dolor muscular', slug: 'hogar-golpes' },
      { text: 'Quemaduras leves o picaduras', slug: 'hogar-quemaduras' },
      { text: 'Malestar estomacal', slug: 'hogar-estomago' },
      { text: 'Lo básico, por si acaso', slug: 'hogar-basico' },
    ],
  },

  // ══ BLOQUE 2 — VIAJE ══════════════════════════════════════════════
  {
    key: 'via1', group: 'g2', sort: 100, type: 'single', required: true, status: 'new',
    text: '¿A dónde vas?',
    conditions: { if_any_slug: ['obj-viaje'] },
    note: 'No existe ninguna categoría «viaje» con productos: esta rama se resuelve componiendo solar, digestivo y hogar. Por eso pregunta por preocupaciones, no por tipo de producto.',
    options: [
      { text: 'Playa o destino tropical', slug: 'viaje-playa' },
      { text: 'Ciudad, trabajo o negocios', slug: 'viaje-ciudad' },
      { text: 'Montaña, senderismo o aventura', slug: 'viaje-aventura' },
      { text: 'Varios destinos o vuelo largo', slug: 'viaje-largo' },
    ],
  },
  {
    key: 'via2', group: 'g2', sort: 101, type: 'single', required: true, status: 'new',
    text: '¿Cuánto tiempo?',
    conditions: { if_any_slug: ['obj-viaje'] },
    options: [
      { text: 'Un fin de semana', slug: 'viaje-corto' },
      { text: 'Una o dos semanas', slug: 'viaje-medio' },
      { text: 'Más de dos semanas', slug: 'viaje-largo-estadia' },
    ],
  },
  {
    key: 'via3', group: 'g2', sort: 102, type: 'multi', required: true, status: 'new',
    text: '¿Qué te preocupa del viaje?',
    subtext: 'Puedes elegir varias.',
    conditions: { if_any_slug: ['obj-viaje'] },
    options: [
      { text: 'El sol', slug: 'viaje-preocupa-sol' },
      { text: 'Que me caiga mal la comida', slug: 'viaje-preocupa-digestivo' },
      { text: 'Dormir bien o el cambio de horario', slug: 'viaje-preocupa-sueno' },
      { text: 'Cortes, ampollas o picaduras', slug: 'viaje-preocupa-botiquin' },
      { text: 'Mantener mi rutina de piel', slug: 'viaje-preocupa-piel' },
    ],
  },

  // ══ BLOQUE 2b — CAMPO ABIERTO ═════════════════════════════════════
  {
    key: 'texto', group: 'g2', sort: 110, type: 'text', required: false, maxLength: 500, status: 'new',
    text: 'Cuéntanos con tus palabras',
    subtext: 'Cómo te sientes, qué has probado, qué te gustaría mejorar. Opcional, pero es lo que más nos ayuda a acertar.',
    placeholder: 'Ej: tengo la piel grasa pero se me reseca en las mejillas, probé retinol y me irritó…',
    conditions: null,
    note: 'Una sola fila con dos usos. Sin condición, aparece siempre al final del bloque 2. Para quien eligió la salida de escape en Q1 todas las ramas quedan ocultas, así que esta pasa a ser su única pantalla del bloque: el atajo funciona sin lógica extra, y es también el destino de quien no sabe qué necesita. Para el resto es un añadido opcional al final. Requiere ampliar el CHECK de quiz_questions.type para admitir «text».',
  },

  // ══ BLOQUE 3 — SEGURIDAD ══════════════════════════════════════════
  {
    key: 'seg1', group: 'g3', sort: 1, type: 'multi', required: true, status: 'new',
    text: '¿Hay algo de tu salud que debamos considerar?',
    subtext: 'Tu seguridad es lo primero. Marca todo lo que aplique.',
    conditions: null,
    note: 'Hoy estas 5 banderas médicas comparten pantalla con 8 preferencias alimentarias, con «Ninguna» de primera y «Embarazo» en la posición 9. Separarlas es lo que evita que se subreporten.',
    options: [
      { text: 'Nada de lo siguiente', slug: 'sin-condicion' },
      { text: 'Estoy embarazada o dando de lactar', slug: 'cond-embarazo' },
      { text: 'Tomo medicamentos con receta', slug: 'cond-medicamentos' },
      { text: 'Tengo una condición médica diagnosticada', slug: 'cond-medica' },
      { text: 'He tenido reacciones fuertes a productos', slug: 'cond-reacciones' },
      { text: 'Tengo síntomas intensos o que no se van', slug: 'cond-sintomas' },
    ],
  },
  {
    key: 'seg2', group: 'g3', sort: 2, type: 'multi', required: true, status: 'new',
    text: '¿Alguna restricción o preferencia?',
    conditions: null,
    note: 'Absorbe la pregunta de «¿qué tan importante que sean naturales?», que hoy gasta una pantalla entera para una señal binaria. Añade frutos secos, que faltaba.',
    options: [
      { text: 'Ninguna', slug: 'sin-restriccion' },
      { text: 'Intolerancia a la lactosa', slug: 'alerg-lactosa' },
      { text: 'Sin gluten / celiaquía', slug: 'alerg-gluten' },
      { text: 'Alergia a la soya', slug: 'alerg-soya' },
      { text: 'Alergia a frutos secos', slug: 'alerg-frutos-secos' },
      { text: 'Vegano/a', slug: 'pref-vegano' },
      { text: 'Sin azúcar', slug: 'alerg-azucar' },
      { text: 'Sin cafeína', slug: 'alerg-cafeina' },
      { text: 'Sin fragancia', slug: 'pref-sin-fragancia' },
      { text: 'Prefiero productos naturales u orgánicos', slug: 'pref-organico' },
    ],
  },

  // ══ BLOQUE 4 — CÓMO LO VAS A USAR ═════════════════════════════════
  {
    key: 'edad', group: 'g3', sort: 3, type: 'single', required: false, status: 'new',
    text: '¿En qué rango de edad estás?',
    conditions: null,
    note: 'Nunca se ha preguntado. Determina antiedad, colágeno, vitamina D y las necesidades que cambian con la edad.',
    options: [
      { text: '18 a 24', slug: 'edad-18-24' },
      { text: '25 a 34', slug: 'edad-25-34' },
      { text: '35 a 44', slug: 'edad-35-44' },
      { text: '45 a 54', slug: 'edad-45-54' },
      { text: '55 o más', slug: 'edad-55-mas' },
    ],
  },
  {
    key: 'sexo', group: 'g3', sort: 4, type: 'single', required: false, status: 'new',
    text: '¿Con cuál te identificas?',
    subtext: 'Algunas necesidades nutricionales cambian.',
    conditions: null,
    note: 'El motor ya tiene lógica de género escrita (route.ts:137-139) que nunca se activa porque la pregunta se eliminó hace tiempo: hoy siempre resuelve «no especificado».',
    options: [
      { text: 'Mujer', slug: 'sexo-mujer' },
      { text: 'Hombre', slug: 'sexo-hombre' },
      { text: 'Prefiero no decirlo', slug: 'sexo-no-decir' },
    ],
  },
  {
    key: 'ritual', group: 'g3', sort: 5, type: 'single', required: true, status: 'keep',
    id: '55550012-0003-0004-0000-000000000001',
    text: '¿Cómo quieres armar tu kit?',
    subtext: 'Nos adaptamos a ti: elige el nivel de tu ritual.',
    conditions: null,
    note: 'Se mantiene sin tocar. Los tiers son de intención y no muestran montos: los rangos en S/ son guía interna para la IA, nunca una cifra prometida.',
    options: [
      { text: 'Lo esencial — solo lo que necesito', slug: 'presupuesto-bajo' },
      { text: 'Un ritual equilibrado', slug: 'presupuesto-medio' },
      { text: 'Una rutina completa', slug: 'presupuesto-alto' },
      { text: 'La experiencia LIORA — lo mejor de lo mejor', slug: 'presupuesto-premium' },
    ],
  },
]

export const BRANCHES = [
  { key: 'piel',        label: 'Piel',            trigger: 'obj-piel',        questions: ['piel1', 'piel2', 'piel3', 'piel4'] },
  { key: 'cabello',     label: 'Cabello',         trigger: 'obj-cabello',     questions: ['cab1', 'cab2', 'cab3', 'cab4'] },
  { key: 'bienestar',   label: 'Descanso y estrés', trigger: 'obj-bienestar', questions: ['bie1', 'bie2', 'bie3', 'bie4'] },
  { key: 'digestivo',   label: 'Digestión',       trigger: 'obj-digestivo',   questions: ['dig1', 'dig2', 'dig3'] },
  { key: 'nutricion',   label: 'Vitaminas',       trigger: 'obj-nutricion',   questions: ['nut1', 'nut2', 'nut3'] },
  { key: 'solar',       label: 'Protección solar', trigger: 'obj-solar',      questions: ['sol1', 'sol2', 'sol3', 'sol4'] },
  { key: 'rendimiento', label: 'Gym',             trigger: 'obj-rendimiento', questions: ['gym1', 'gym2', 'gym3', 'gym4'] },
  { key: 'pies-cuerpo', label: 'Pies y cuerpo',   trigger: 'obj-pies-cuerpo', questions: ['pie1', 'pie2', 'pie3'] },
  { key: 'hogar',       label: 'Hogar',           trigger: 'obj-hogar',       questions: ['hog1', 'hog2', 'hog3'] },
  { key: 'viaje',       label: 'Viaje',           trigger: 'obj-viaje',       questions: ['via1', 'via2', 'via3'] },
]
