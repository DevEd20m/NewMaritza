export interface ScheduleItem {
  time: string
  emoji: string
  products: string[]
  tip: string
}

export interface TimelinePhase {
  label: string
  title: string
  description: string
}

export interface Tip {
  emoji: string
  title: string
  body: string
}

export interface FAQ {
  q: string
  a: string
}

export interface Recipe {
  title: string
  emoji: string
  ingredients: string[]
  steps: string[]
}

export interface KitGuide {
  slug: string
  kitName: string
  tagline: string
  description: string
  color: string
  schedule: ScheduleItem[]
  timeline: TimelinePhase[]
  tips: Tip[]
  recipe?: Recipe
  warnings?: string[]
  faqs: FAQ[]
}

export const GUIDES: KitGuide[] = [
  {
    slug: 'kit-colageno-radiante',
    kitName: 'Kit Colágeno Radiante',
    tagline: 'Belleza que se construye desde adentro, día a día.',
    description: 'Este kit trabaja en tres frentes: producción de colágeno nuevo, soporte a la keratina del cabello y fortalecimiento de uñas. Los resultados son acumulativos — la consistencia es todo.',
    color: 'var(--cat-coral)',
    schedule: [
      {
        time: 'En ayunas o antes del desayuno',
        emoji: '☀️',
        products: ['Colágeno C+ Peru Nutrition', 'Colágeno con Biotina Peru Nutrition'],
        tip: 'Disuelve ambas cucharadas en jugo de naranja natural. La vitamina C es co-factor esencial para que el cuerpo sintetice colágeno nuevo.'
      },
      {
        time: 'Con el desayuno',
        emoji: '🫐',
        products: ['Biotina 10,000 MCG Natures Truth'],
        tip: 'Toma 1 gomita con comida — la biotina es liposoluble y se absorbe mejor con grasas del desayuno.'
      },
    ],
    timeline: [
      { label: 'Semana 1–2', title: 'Uñas que ya lo notan', description: 'Las uñas crecen más rápido y con menos quebraduras. La hidratación de la piel mejora visiblemente.' },
      { label: 'Mes 1', title: 'Cabello en modo recuperación', description: 'Menos caída en el cepillo y la ducha. El cabello nuevo crece con más grosor. La piel se ve más tersa.' },
      { label: 'Mes 2–3', title: 'La transformación completa', description: 'Elasticidad de piel notablemente mejorada. Cabello más brillante y voluminoso. Uñas largas y resistentes.' },
    ],
    tips: [
      { emoji: '🍊', title: 'Vitamina C es tu aliada', body: 'Sin vitamina C, el cuerpo no puede convertir el colágeno en polvo en colágeno funcional. Siempre tómalo con cítrico.' },
      { emoji: '💧', title: 'Hidratación constante', body: 'Beber 2 litros de agua al día potencia todos los efectos del colágeno. Sin agua, los tejidos no se regeneran bien.' },
      { emoji: '🔄', title: 'Consistencia sobre dosis', body: 'Es mejor tomar la dosis normal 30 días seguidos que el doble durante 2 semanas. El colágeno necesita tiempo acumulado.' },
      { emoji: '🚭', title: 'El cigarro destruye el colágeno', body: 'El tabaco activa enzimas que degradan el colágeno. Si fumas, el kit trabajará a la mitad de su potencial.' },
    ],
    recipe: {
      title: 'Batido Colágeno Brillante',
      emoji: '🫙',
      ingredients: [
        '1 cucharada Colágeno C+ Peru Nutrition',
        '1 cucharada Colágeno con Biotina',
        '½ taza jugo de naranja o maracuyá',
        '½ taza agua o leche de almendra',
        'Hielo al gusto',
      ],
      steps: [
        'Mezcla ambos colágenos en el jugo cítrico primero (sin hielo).',
        'Revuelve 30 segundos hasta disolver completamente.',
        'Agrega agua o leche y el hielo.',
        'Tómalo inmediatamente para no perder la vitamina C del jugo.',
      ],
    },
    faqs: [
      { q: '¿Puedo tomar los dos colágenos al mismo tiempo?', a: 'Sí, son completamente complementarios. El C+ aporta vitamina C integrada y el con Biotina suma keratina. Juntos son más efectivos.' },
      { q: '¿Cuánto tiempo hasta notar resultados visibles?', a: 'Las uñas responden en 2-3 semanas. El cabello entre 4-8 semanas. La piel entre 6-12 semanas. La paciencia se recompensa.' },
      { q: '¿Puedo tomarlo si estoy embarazada o lactando?', a: 'Siempre consulta con tu médico. El colágeno en polvo es generalmente seguro, pero cada embarazo es diferente.' },
      { q: '¿A qué hora es mejor tomarlo?', a: 'En ayunas o lejos de las comidas principales mejora la absorción. Lo importante es hacerlo a la misma hora cada día.' },
    ],
  },

  {
    slug: 'kit-articulaciones-movilidad',
    kitName: 'Kit Articulaciones & Movilidad',
    tagline: 'Muévete sin límites. Las articulaciones se regeneran, solo necesitan tiempo.',
    description: 'La glucosamina y condroitina trabajan en el cartílago articular, el colágeno marino repara tejido conectivo, y el magnesio reduce la inflamación muscular. Es el trío más completo para movilidad.',
    color: 'var(--cat-mostaza)',
    schedule: [
      {
        time: 'Con el desayuno',
        emoji: '🌅',
        products: ['Glucosamina Condroitina Ácido Hialurónico Mason Natural'],
        tip: 'Tomarlo con comida evita el malestar gástrico ocasional. No lo tomes en ayunas.'
      },
      {
        time: 'A cualquier hora del día',
        emoji: '🐟',
        products: ['Colágeno Marino Hidrolizado con Cúrcuma Drasanvi'],
        tip: 'Disuelve una cucharada en agua tibia o en tu bebida habitual. La cúrcuma integrada ya actúa como antiinflamatorio.'
      },
      {
        time: 'Antes de dormir',
        emoji: '🌙',
        products: ['Magnesio Xtralife 500mg'],
        tip: 'La noche es cuando el cuerpo repara tejidos. El magnesio nocturno también mejora la calidad del sueño.'
      },
    ],
    timeline: [
      { label: 'Semana 2–4', title: 'Menos rigidez matutina', description: 'El primer cambio que notarás es que al despertar te mueves con más facilidad. El chasquido puede reducirse.' },
      { label: 'Mes 1–2', title: 'Mayor rango de movimiento', description: 'Actividades que antes dolían se vuelven más llevaderas. La inflamación baja progresivamente.' },
      { label: 'Mes 3+', title: 'Cartílago en recuperación', description: 'La glucosamina necesita 90 días para alcanzar su efecto completo en la regeneración del cartílago.' },
    ],
    tips: [
      { emoji: '💧', title: 'Más agua que nunca', body: 'El cartílago articular es 70% agua. Beber 2-3 litros diarios es tan importante como el suplemento.' },
      { emoji: '🏊', title: 'Ejercicio de bajo impacto', body: 'Natación, caminata o ciclismo nutren el cartílago sin dañarlo. El reposo total en realidad empeora la rigidez.' },
      { emoji: '⏰', title: 'No suspendas antes de los 3 meses', body: 'La glucosamina es lenta pero profunda. Muchos desisten a las 4 semanas, justo cuando empieza el efecto real.' },
      { emoji: '🌶️', title: 'La cúrcuma necesita pimienta', body: 'Para potenciar el colágeno marino, agrégale una pizca de pimienta negra — la piperina aumenta 2000% la absorción de curcumina.' },
    ],
    faqs: [
      { q: '¿Para qué articulaciones funciona?', a: 'Para todas: rodillas, caderas, hombros, manos, columna. Es especialmente efectivo en articulaciones de carga (rodillas, caderas).' },
      { q: '¿Es seguro tomarlo con antiinflamatorios?', a: 'Generalmente sí, pero consulta con tu médico si tomas ibuprofeno o naproxeno regularmente.' },
      { q: '¿Funciona para artritis?', a: 'Ayuda con los síntomas y puede frenar la progresión, pero no cura la artritis. Complementa el tratamiento médico, no lo reemplaza.' },
      { q: '¿Puedo tomarlo si soy alérgico al marisco?', a: 'La glucosamina proviene de caparazones. Si tienes alergia severa al marisco, consulta con tu médico antes.' },
    ],
  },

  {
    slug: 'kit-sueno-profundo',
    kitName: 'Kit Sueño Profundo',
    tagline: 'Dormir bien no es un lujo, es la base de todo lo demás.',
    description: 'La melatonina señaliza al cerebro que es hora de dormir, las Flores de Bach calman el sistema nervioso y el magnesio relaja los músculos. Juntos crean las condiciones perfectas para el sueño.',
    color: 'var(--cat-lavanda)',
    schedule: [
      {
        time: '30–45 minutos antes de dormir',
        emoji: '🌙',
        products: ['Gud Nait Gomitas con Melatonina Yumi Gumi', 'Flores de Bach Rescue Night Gummies', 'Magnesol Efervescente Dr. Pérez Albela'],
        tip: 'Disuelve el Magnesol en agua tibia mientras tomas las gomitas. La rutina en sí (preparar la bebida, tomar las gomitas) entrena al cerebro para entrar en modo sueño.'
      },
    ],
    timeline: [
      { label: 'Noche 1–3', title: 'Quedarse dormido es más fácil', description: 'La melatonina actúa rápido. Notarás que te duermes en menos tiempo y con menos pensamientos circulares.' },
      { label: 'Semana 2', title: 'Sueño más profundo', description: 'Menos despertares en la madrugada. El cuerpo entra en fases de sueño más reparadoras.' },
      { label: 'Mes 1', title: 'Ciclo restaurado', description: 'El ritmo circadiano se regula. Te despiertas más descansado sin necesidad de alarma, o con energía genuina al despertar.' },
    ],
    tips: [
      { emoji: '📱', title: 'Pantallas apagadas 1 hora antes', body: 'La luz azul suprime la melatonina natural. El kit amplifica la tuya, pero el celular la cancela.' },
      { emoji: '🕐', title: 'Misma hora siempre', body: 'El circadiano responde a regularidad. Tomar el kit a horas diferentes cada noche reduce su efectividad.' },
      { emoji: '🌡️', title: 'Habitación fresca y oscura', body: 'La temperatura corporal baja al dormirse. Una habitación fría (18-20°C) sincroniza ese proceso.' },
      { emoji: '☕', title: 'Corta la cafeína a las 2pm', body: 'El café tiene vida media de 5-6 horas. Si tomas café a las 4pm, a la medianoche todavía tienes la mitad en sangre.' },
    ],
    warnings: ['No conducir tras tomar melatonina', 'No combinar con alcohol', 'No superar la dosis recomendada'],
    faqs: [
      { q: '¿Crea dependencia la melatonina?', a: 'No. A diferencia de los somníferos, la melatonina es una hormona natural que el cuerpo ya produce. No crea dependencia física.' },
      { q: '¿Puedo tomar solo la melatonina sin los otros?', a: 'Sí, pero el trío funciona mucho mejor. El magnesio relaja músculos y el Bach calma la mente — sin ellos, la melatonina solo acorta el tiempo de conciliación.' },
      { q: '¿Es seguro para mayores de 60 años?', a: 'Sí, en muchos casos está especialmente recomendado ya que la producción natural de melatonina cae con la edad.' },
      { q: '¿Funciona si tengo insomnio severo crónico?', a: 'El kit ayuda con el insomnio leve a moderado. Si tienes insomnio severo de años, consulta un especialista en sueño adicionalmente.' },
    ],
  },

  {
    slug: 'kit-gym-performance',
    kitName: 'Kit Gym Performance',
    tagline: 'Entrena más fuerte. Recupera más rápido. Repite.',
    description: 'Creatina para fuerza explosiva, pre-workout para energía sostenida y magnesio para recuperación y prevención de calambres. El stack más probado por la ciencia.',
    color: 'var(--cat-durazno)',
    schedule: [
      {
        time: '30–45 min antes de entrenar',
        emoji: '⚡',
        products: ['Pre-Workout QNT 390g'],
        tip: 'Mezcla en 200ml de agua fría. Empieza con media dosis la primera semana para evaluar tolerancia a la cafeína.'
      },
      {
        time: 'Post-entrenamiento o en cualquier momento del día',
        emoji: '💪',
        products: ['Creatina Micronizada Power Lab Nutrition 500g'],
        tip: '5g en agua, jugo o batido de proteína. La creatina no necesita ser "antes del gym" — lo que importa es tomarla diariamente sin excepción.'
      },
      {
        time: 'Post-entrenamiento o antes de dormir',
        emoji: '🔧',
        products: ['Citrato de Magnesio Smart Blends 400g'],
        tip: 'Mezcla en agua y bebe lentamente. El magnesio nocturno también profundiza el sueño reparador.'
      },
    ],
    timeline: [
      { label: 'Semana 1 (fase de carga opcional)', title: 'Creatina acumulando', description: 'Si quieres resultados más rápidos, puedes hacer carga: 20g al día dividido en 4 tomas x 5 días. Luego 5g/día.' },
      { label: 'Semana 2–4', title: 'Fuerza y volumen visibles', description: 'Los músculos retienen más agua (normal, no es grasa). Mayor fuerza en los levantamientos compuestos.' },
      { label: 'Mes 2–3', title: 'Composición corporal cambia', description: 'Con entrenamiento consistente: más masa muscular, menor porcentaje de grasa, recuperación más rápida entre sesiones.' },
    ],
    tips: [
      { emoji: '💧', title: 'Bebe más agua con creatina', body: 'La creatina lleva agua a las células musculares. Si no tomas suficiente agua, puedes tener calambres o dolores de cabeza.' },
      { emoji: '📅', title: 'No te saltes días de creatina', body: 'A diferencia del pre-workout que se toma solo cuando entrenas, la creatina debe tomarse diariamente — incluyendo días de descanso.' },
      { emoji: '🍌', title: 'Potasio + magnesio anti-calambres', body: 'Si tienes calambres durante el entrenamiento, un plátano antes y el magnesio post-entreno los eliminan.' },
      { emoji: '😴', title: 'El descanso es donde creces', body: 'Los músculos se construyen durante el sueño, no en el gym. El kit nocturno (magnesio) es tan importante como el pre-workout.' },
    ],
    faqs: [
      { q: '¿La creatina es para hombres solo?', a: 'No. La creatina funciona igual de bien en mujeres y tiene los mismos beneficios en fuerza y recuperación.' },
      { q: '¿Tengo que hacer la fase de carga?', a: 'No es obligatoria. Sin carga, la creatina tarda 3-4 semanas en saturar el músculo en vez de 5 días. Ambos enfoques llegan al mismo resultado.' },
      { q: '¿El pre-workout afecta el sueño?', a: 'Si entrenas en la noche, evita el pre-workout después de las 5pm. La cafeína tiene vida media de 5-6 horas.' },
      { q: '¿Puedo usar el kit si hago cardio, no pesas?', a: 'Sí. La creatina también mejora el rendimiento en esfuerzos de alta intensidad (HIIT, sprints). El magnesio es universal para el atleta.' },
    ],
  },

  {
    slug: 'kit-vitaminas-esenciales',
    kitName: 'Kit Vitaminas Esenciales',
    tagline: 'Las bases que tu cuerpo necesita para todo lo demás.',
    description: 'D3 para inmunidad y huesos, Omega para corazón y cerebro, y el complejo B para energía y sistema nervioso. Son los tres pilares que el organismo moderno más frecuentemente tiene en déficit.',
    color: 'var(--cat-lavanda)',
    schedule: [
      {
        time: 'Con el desayuno (con grasas)',
        emoji: '🌅',
        products: ['Vitamina D3 5000 UI Sundown Naturals', 'Omega 3-6-7-9 Natures Truth Vegan', 'Stress Formula Complejo B Mason Natural'],
        tip: 'La vitamina D y el Omega son solubles en grasa — siempre con un desayuno que incluya aguacate, huevo, aceite o frutos secos para absorción óptima.'
      },
    ],
    timeline: [
      { label: 'Semana 2–4', title: 'Más energía y mejor ánimo', description: 'El complejo B actúa más rápido. Notarás más energía mental y física, y mejor manejo del estrés diario.' },
      { label: 'Mes 1–2', title: 'Sistema inmune más fuerte', description: 'Menos resfriados o más rápida recuperación cuando te enfermas. La vitamina D tarda en acumularse.' },
      { label: 'Mes 3+', title: 'Efectos profundos', description: 'Huesos y dientes más fuertes (D3 + K2 si lo tienes). Inflamación sistémica reducida (Omega). Nervios más estables.' },
    ],
    tips: [
      { emoji: '🥑', title: 'Siempre con grasa', body: 'D3 y Omega son insolubles en agua. Sin grasa en la comida, una fracción mínima llega a tu sangre.' },
      { emoji: '🩸', title: 'Chéquea tu nivel de vitamina D', body: 'Un análisis de sangre te dice si estás en déficit. Muchos peruanos de Lima están bajos pese a la altitud (la contaminación y el exceso de nublado en invierno reducen la síntesis).' },
      { emoji: '🧠', title: 'El Omega protege el cerebro', body: 'El DHA del Omega es el principal constituyente del tejido cerebral. Es especialmente importante para memoria y concentración.' },
      { emoji: '😰', title: 'Complejo B para el estrés', body: 'Los primeros nutrientes que se agotan con el estrés crónico son las vitaminas B. El Stress Formula repone exactamente los que más se consumen.' },
    ],
    faqs: [
      { q: '¿Puedo tomar 5000 UI de vitamina D al día sin supervisión?', a: '5000 UI es la dosis diaria para adultos en déficit o con poco sol. Si tomas esta dosis más de 6 meses, hacer un análisis anual es prudente.' },
      { q: '¿El Omega Vegan tiene DHA y EPA?', a: 'El omega vegano (de algas) sí tiene DHA. Puede tener menos EPA que el de pescado, pero es completamente apto para veganos con beneficios equivalentes para el cerebro.' },
      { q: '¿El complejo B pone orina amarilla?', a: 'Sí, completamente normal. La riboflavina (B2) tiñe la orina de amarillo brillante. Es solo exceso siendo eliminado, no un problema.' },
    ],
  },

  {
    slug: 'kit-detox-digestion',
    kitName: 'Kit Detox & Digestión',
    tagline: 'Cuando el intestino funciona bien, todo lo demás fluye.',
    description: 'La fibra soluble (psyllium) barre el colon, la inulina alimenta las bacterias buenas, y la alcachofa estimula el hígado. Es un reset intestinal completo y progresivo.',
    color: 'var(--cat-menta)',
    schedule: [
      {
        time: '15 minutos antes del desayuno',
        emoji: '💧',
        products: ['Psyllium Vivir Power Snacks 284g'],
        tip: 'CRÍTICO: Mezcla 1 cucharada en un vaso GRANDE de agua y bebe inmediatamente antes de que se espese. Luego toma otro vaso de agua.'
      },
      {
        time: 'Con el desayuno',
        emoji: '🌿',
        products: ['Inulina Vivir Power Snacks 250g'],
        tip: 'Agrega 1 cucharada en yogur, avena, o cualquier desayuno. La inulina es insípida — no cambia el sabor.'
      },
      {
        time: 'Con el almuerzo',
        emoji: '🥗',
        products: ['Alcachofa Biocenter 200g'],
        tip: 'Disuelve 1 cucharada en un vaso de agua o en la ensalada. Estimula la bilis y el metabolismo hepático.'
      },
    ],
    timeline: [
      { label: 'Día 1–3', title: 'El intestino se pone en marcha', description: 'Notarás cambios en el tránsito intestinal. Es normal sentir algo de hinchazón los primeros días mientras el microbioma se adapta.' },
      { label: 'Semana 2', title: 'Menos hinchazón y flatulencia', description: 'La inulina empieza a equilibrar las bacterias intestinales. Digestiones más cómodas y regulares.' },
      { label: 'Mes 1', title: 'Flora intestinal restaurada', description: 'Mayor bienestar general, piel más limpia (el intestino y la piel están conectados), y mejor absorción de nutrientes.' },
    ],
    tips: [
      { emoji: '💧', title: 'Agua, agua, agua', body: 'El psyllium absorbe mucha agua. Sin hidratación suficiente puede causar el efecto contrario: estreñimiento. Mínimo 2.5 litros al día.' },
      { emoji: '🐢', title: 'Empieza con media dosis', body: 'Los primeros 3 días, usa media cucharada de psyllium e inulina para que el microbioma se adapte sin reacciones.' },
      { emoji: '⏰', title: 'No al acostarte', body: 'Nunca tomes el psyllium justo antes de dormir. Necesita agua y movimiento para hacer su trabajo.' },
      { emoji: '🥦', title: 'Suma fibra en la dieta', body: 'El kit potencia su efecto si simultáneamente aumentas vegetales y frutas. El preencaje de fibra alimentaria + suplemento es el combo ideal.' },
    ],
    faqs: [
      { q: '¿El psyllium crea dependencia?', a: 'No. Es fibra vegetal, no un laxante estimulante. El intestino no se vuelve "dependiente" como con otros productos.' },
      { q: '¿Puedo tomarlo si estoy embarazada?', a: 'El psyllium es generalmente seguro en el embarazo. La inulina y alcachofa también. Consulta con tu médico para tu caso específico.' },
      { q: '¿Para qué sirve la alcachofa exactamente?', a: 'Estimula la producción de bilis (para digerir grasas), protege el hígado, y tiene efecto depurativo en la sangre.' },
      { q: '¿Puedo tomarlo indefinidamente?', a: 'Sí, especialmente la inulina (prebiótico). El psyllium puede tomarse en ciclos de 1-2 meses con descanso, aunque en dosis bajas es seguro a largo plazo.' },
    ],
  },

  {
    slug: 'kit-cuidado-capilar',
    kitName: 'Kit Cuidado Capilar',
    tagline: 'Cabello que se nota, desde la raíz hasta las puntas.',
    description: 'El champú de biotina activa el crecimiento y frena la caída. El de argán hidrata en profundidad. El acondicionador Karica sella y nutre. Usa los tres en rotación para el efecto completo.',
    color: 'var(--cat-coral)',
    schedule: [
      {
        time: 'Lavados 2–3 veces por semana',
        emoji: '🚿',
        products: ['Champú con Biotina + Aloe Vera Drasanvi', 'Champú de Argán Ecocert Bio Drasanvi', 'Karica Acondicionador Aroma Floral'],
        tip: 'Alterna: biotina 2 veces por semana (para caída/crecimiento) y argán 1 vez (hidratación profunda). Siempre termina con el acondicionador Karica.'
      },
    ],
    timeline: [
      { label: 'Semana 1–2', title: 'Cuero cabelludo equilibrado', description: 'Menos grasa acumulada, cuero cabelludo más sano. El aloe vera calma la irritación.' },
      { label: 'Mes 1', title: 'Menos caída', description: 'Notarás menos cabello en el cepillo y en la ducha. Los folículos se fortalecen con la biotina.' },
      { label: 'Mes 2–3', title: 'Brillo y crecimiento', description: 'El argán restaura el pelo dañado. El cabello nuevo crece más grueso y brillante gracias a la biotina acumulada.' },
    ],
    tips: [
      { emoji: '🌊', title: 'Agua fría al final', body: 'Termina el enjuague con agua fría. Cierra las cutículas del cabello, da más brillo y reduce el frizz.' },
      { emoji: '🤲', title: 'Masajea el cuero cabelludo', body: 'Al aplicar el champú, masajea con las yemas (no las uñas) por 2-3 minutos. Activa la circulación y potencia el efecto de la biotina.' },
      { emoji: '⏱️', title: 'Acondicionador: no lo laves de prisa', body: 'Deja el acondicionador Karica 3-5 minutos mínimo. Ese tiempo de contacto es lo que hace la diferencia en la hidratación.' },
      { emoji: '🌡️', title: 'Baja la temperatura del secador', body: 'El calor directo abre la cutícula y seca la proteína. Usa temperatura media y distancia de 20cm.' },
    ],
    faqs: [
      { q: '¿Puedo usar solo uno de los dos champús?', a: 'Sí. El de biotina es el más activo para caída y crecimiento. El de argán es ideal para el que ya tiene poco cabello fino y frágil.' },
      { q: '¿Cada cuánto debo lavar el cabello?', a: '2-3 veces por semana es lo óptimo para la mayoría. Lavar todos los días quita los aceites naturales que protegen el cabello.' },
      { q: '¿Para qué sirve el acondicionador vs. el champú?', a: 'El champú limpia y activa. El acondicionador sella la cutícula, hidrata la fibra capilar y reduce el frizz. Sin él, el champú seca el cabello.' },
    ],
  },

  {
    slug: 'kit-bienestar-andino',
    kitName: 'Kit Bienestar Andino',
    tagline: 'Energía real, desde los Andes hasta tu rutina.',
    description: 'El golden latte con adaptógenos andinos, el energy blend superalimento y la cúrcuma con kion crean un sistema de bienestar anti-inflamatorio y energizante sin cafeína. Sostenible todo el día.',
    color: 'var(--cat-menta)',
    schedule: [
      {
        time: 'Mañana — como tu ritual de inicio',
        emoji: '🌄',
        products: ['Dúo Bienestar: Golden Latte + Reishi Cacao Riwi'],
        tip: 'Calienta leche de avena o almendra (no hervir — a 60-70°C). Mezcla 1-2 cucharaditas. Este es tu momento de quietud antes de que empiece el día.'
      },
      {
        time: 'Mañana — en tu smoothie o agua',
        emoji: '⚡',
        products: ['Energy Blend Superalimento Smart Blends 420g'],
        tip: '2 cucharadas en un vaso de agua, jugo o batido. La mezcla de tarwi, espirulina y maca da energía limpia sin picos ni caídas.'
      },
      {
        time: 'Con las comidas principales',
        emoji: '🌿',
        products: ['Cúrcuma Pimienta y Kion Lima Naturals 500g'],
        tip: 'Agrega ½ cucharadita a guisos, sopas, arroces o haz una infusión. Siempre con pimienta negra — la piperina multiplica la absorción de curcumina.'
      },
    ],
    timeline: [
      { label: 'Semana 1', title: 'Energía más estable', description: 'Sin el bajón de la tarde que da el café. La energía es más suave pero más duradera.' },
      { label: 'Mes 1', title: 'Inflamación reducida', description: 'La cúrcuma tiene efecto antiinflamatorio acumulativo. Menos dolores musculares, mejor digestión.' },
      { label: 'Mes 2–3', title: 'Bienestar sistémico', description: 'Sistema inmune más robusto, piel más luminosa, mejor estado de ánimo general.' },
    ],
    tips: [
      { emoji: '🌶️', title: 'Pimienta negra es obligatoria con la cúrcuma', body: 'Sin pimienta, solo el 3% de la curcumina se absorbe. Con pimienta (piperina), ese número sube 20 veces. Siempre combínala.' },
      { emoji: '🥛', title: 'Golden Latte: temperatura, no hervor', body: 'Hervir el golden latte destruye los adaptógenos (reishi, ashwagandha). La temperatura ideal es 65-70°C.' },
      { emoji: '🔄', title: 'Maca en ciclos', body: 'Si en tu kit hay maca, tómala 5 días encendido y 2 días apagado. El cuerpo responde mejor en ciclos que en toma continua.' },
      { emoji: '🍵', title: 'Hazlo ritual', body: 'El golden latte funciona también como anclaje psicológico de inicio del día. La consistencia del ritual potencia sus efectos.' },
    ],
    recipe: {
      title: 'Golden Latte Andino Perfecto',
      emoji: '✨',
      ingredients: [
        '250ml leche de avena, almendra o coco',
        '1.5 cucharaditas Golden Latte Riwi',
        '¼ cucharadita Cúrcuma Lima Naturals',
        '¼ cucharadita canela en polvo',
        'Una pizca de pimienta negra molida',
        'Miel de abeja o panela al gusto',
      ],
      steps: [
        'Calienta la leche a 65-70°C (humeante, sin hervir).',
        'Agrega todos los polvos y mezcla con batidor de mano.',
        'Espuma con un espumador si tienes, o bate vigorosamente.',
        'Sirve en tu taza favorita. La pizca de pimienta es obligatoria.',
      ],
    },
    faqs: [
      { q: '¿El golden latte tiene cafeína?', a: 'No tiene cafeína directa, pero el reishi y ashwagandha dan energía adaptógena sin estimulación nerviosa.' },
      { q: '¿Puedo tomar el energy blend en agua sola?', a: 'Sí. Tiene sabor suave a espirulina. Si no te gusta el sabor, lo disimulas fácil en un batido con plátano o mango.' },
      { q: '¿La cúrcuma mancha los dientes?', a: 'Puede tintar ligeramente. Para evitarlo, enjuágate la boca con agua inmediatamente después de tomarlo en infusión.' },
    ],
  },

  {
    slug: 'kit-estres-ansiedad',
    kitName: 'Kit Estrés & Ansiedad',
    tagline: 'Para mente tranquila en tiempos acelerados.',
    description: 'La ashwagandha regula el cortisol a largo plazo, el magnesio relaja el sistema nervioso, y las Flores de Bach son el rescate inmediato para momentos de alta tensión. Los tres juntos son el kit más completo para el estrés moderno.',
    color: 'var(--cat-lavanda)',
    schedule: [
      {
        time: 'Con el desayuno',
        emoji: '🌅',
        products: ['Anxiety Ashwagandha + Rhodiola + L-Teanina Xtralife'],
        tip: 'Toma con comida. La ashwagandha actúa a lo largo del día — necesita acumularse en el organismo durante 2-4 semanas para su efecto completo.'
      },
      {
        time: 'Cuando sientas tensión o ansiedad',
        emoji: '🕊️',
        products: ['Flores de Bach Rescue Night Gummies'],
        tip: '2 gomitas cuando sientas ansiedad aguda, estrés antes de una reunión importante, o anticipación negativa. Efecto en 15-30 minutos.'
      },
      {
        time: 'Antes de dormir',
        emoji: '🌙',
        products: ['Magnesol Efervescente Dr. Pérez Albela'],
        tip: 'Un sobre en agua tibia. El magnesio baja el cortisol nocturno, relaja los músculos tensos y mejora la calidad del sueño.'
      },
    ],
    timeline: [
      { label: 'Día 1', title: 'Efecto inmediato del Bach y Magnesio', description: 'Las Flores de Bach y el magnesio actúan desde la primera toma. Notarás calma muscular y mental más rápido.' },
      { label: 'Semana 2–4', title: 'La ashwagandha empieza a trabajar', description: 'La respuesta al estrés se vuelve más controlada. Los picos de cortisol bajan. Duermes mejor.' },
      { label: 'Mes 2–3', title: 'Resiliencia construida', description: 'Situaciones que antes te desbordaban empiezan a sentirse manejables. El sistema nervioso está mejor regulado.' },
    ],
    tips: [
      { emoji: '⏰', title: 'No abandones la ashwagandha prematuramente', body: 'El mayor error es dejarla a las 2 semanas, justo cuando empieza su efecto profundo. Comprométete con 90 días.' },
      { emoji: '🫁', title: 'Combínala con respiración', body: '4 ciclos de respiración lenta (inhala 4 seg, sostén 4, exhala 6) potencian el efecto de las Flores de Bach.' },
      { emoji: '🧂', title: 'Revisa tu consumo de cafeína', body: 'El café y las bebidas energizantes elevan el cortisol. Si consumes mucha cafeína, el kit trabaja contra corriente.' },
      { emoji: '📓', title: 'Journaling de 5 minutos', body: 'Anotar 3 cosas positivas del día antes de tomar el Magnesol amplifica el efecto del kit sobre el estado de ánimo.' },
    ],
    faqs: [
      { q: '¿La ashwagandha crea dependencia?', a: 'No. Es una planta adaptógena, no un ansiolítico químico. Puede tomarse y dejarse sin síndrome de abstinencia.' },
      { q: '¿Puedo tomar este kit junto con ansiolíticos recetados?', a: 'Consulta con tu médico. La ashwagandha puede interactuar con medicamentos sedativos. El Magnesol y Bach son generalmente seguros.' },
      { q: '¿Las Flores de Bach realmente funcionan?', a: 'Tienen fuerte respaldo en uso clínico para ansiedad leve-moderada. No son medicamentos — son catalizadores emocionales. Su efectividad varía por persona.' },
      { q: '¿Para ansiedad severa o ataques de pánico, es suficiente?', a: 'Este kit está pensado para estrés cotidiano y ansiedad funcional. Para ansiedad severa, busca apoyo profesional adicionalmente.' },
    ],
  },

  {
    slug: 'kit-superalimentos-andinos',
    kitName: 'Kit Superalimentos Andinos',
    tagline: 'Lo mejor de los Andes, en tu rutina de cada día.',
    description: 'La maca negra peruana para energía y vitalidad, el energy blend de superalimentos para el desayuno perfecto, y la cúrcuma con kion para protección antiinflamatoria. Tres ingredientes ancestrales, efectividad moderna.',
    color: 'var(--cat-menta)',
    schedule: [
      {
        time: 'Mañana — en batido o jugo FRÍO',
        emoji: '🏔️',
        products: ['Maca Negra Gelatinizada Ecoandino 200g'],
        tip: '1 cucharadita en batido o jugo frío. La maca pierde sus propiedades con el calor — NO en bebidas calientes. Protocolo: 5 días ON, 2 días OFF.'
      },
      {
        time: 'Mañana — en tu batido base',
        emoji: '⚡',
        products: ['Energy Blend Superalimento Smart Blends 420g'],
        tip: '2 cucharadas en el mismo batido de la maca o en agua. Contiene tarwi, espirulina, kiwicha, quinua y maca — es un desayuno en sí mismo.'
      },
      {
        time: 'Con las comidas',
        emoji: '🌿',
        products: ['Cúrcuma Pimienta y Kion Lima Naturals 500g'],
        tip: 'Espolvorea sobre la comida o haz infusión. SIEMPRE con pimienta negra para potenciar la curcumina.'
      },
    ],
    timeline: [
      { label: 'Semana 1–2', title: 'Energía más estable', description: 'La maca negra da energía sostenida. Sin el crash del café.' },
      { label: 'Mes 1', title: 'Vitalidad y ánimo', description: 'La maca tiene efecto adaptógeno sobre el sistema hormonal. Mejor humor, más energía para el ejercicio.' },
      { label: 'Mes 2–3', title: 'Efectos profundos andinos', description: 'Beneficios acumulativos: mayor tolerancia al ejercicio, mejor función cognitiva, sistema inmune fortalecido.' },
    ],
    tips: [
      { emoji: '❄️', title: 'Maca siempre fría', body: 'El calor destruye los alcaloides de la maca que dan sus beneficios. Batidos, jugos o agua fría — nunca té caliente.' },
      { emoji: '🔄', title: 'Ciclo 5:2 para la maca', body: '5 días tomándola, 2 días de descanso. El cuerpo se adapta mejor y los beneficios son más notables que en toma diaria continua.' },
      { emoji: '🏋️', title: 'Potenciada con ejercicio', body: 'Los superalimentos andinos dan sus mejores resultados cuando el cuerpo los usa. Combínalos con actividad física regular.' },
      { emoji: '🌶️', title: 'Pimienta negra y cúrcuma siempre juntos', body: 'Sin piperina, la cúrcuma se absorbe muy poco. La combinación pre-mezclada en Lima Naturals ya incluye pimienta y kion.' },
    ],
    recipe: {
      title: 'Batido Andino de Poder',
      emoji: '🏔️',
      ingredients: [
        '1 taza leche de avena o almendra fría',
        '1 cucharadita Maca Negra Ecoandino',
        '2 cucharadas Energy Blend Smart Blends',
        '1 plátano maduro',
        '1 cucharadita miel o stevia',
        'Hielo al gusto',
      ],
      steps: [
        'Agrega todos los ingredientes en la licuadora.',
        'Licúa 45-60 segundos hasta obtener textura cremosa.',
        'Sirve en vaso alto con hielo.',
        'Tómalo dentro de los 20 minutos — la espirulina oxida rápido.',
      ],
    },
    faqs: [
      { q: '¿La maca negra es solo para hombres?', a: 'No. La maca negra beneficia a hombres y mujeres. En mujeres, puede apoyar el equilibrio hormonal. En hombres, la vitalidad y libido.' },
      { q: '¿Puedo tomar maca si tengo hipotiroidismo?', a: 'Consulta con tu médico. Algunos estudios muestran beneficios, pero la interacción con la tiroides varía por persona.' },
      { q: '¿El energy blend tiene gluten?', a: 'Smart Blends declara no contener gluten, pero si eres celíaco verifica la etiqueta actual por posible contaminación cruzada.' },
    ],
  },

  {
    slug: 'kit-antienvejecimiento',
    kitName: 'Kit Antienvejecimiento',
    tagline: 'No se trata de lucir más joven. Se trata de vivir mejor por más tiempo.',
    description: 'El glutatión protege las células del daño oxidativo, el omega 3 mantiene las membranas celulares jóvenes y flexibles, y el colágeno peptides repone la estructura que el tiempo va degradando. La trinidad anti-aging con mayor respaldo científico.',
    color: 'var(--cat-coral)',
    schedule: [
      {
        time: 'En ayunas — 30 minutos antes del desayuno',
        emoji: '🌅',
        products: ['Glutatión Xtralife 500mg'],
        tip: 'El glutatión se absorbe mejor en ayunas. Espera 30 minutos antes de comer. Tomar con vitamina C potencia su efecto antioxidante.'
      },
      {
        time: 'Con el desayuno (con grasas)',
        emoji: '🐟',
        products: ['Omega 3 Nutricost 2500mg'],
        tip: '1 cápsula con el desayuno que contenga grasa (huevo, palta, aceite de oliva). El EPA y DHA son solubles en grasa — sin ella, no se absorben bien.'
      },
      {
        time: 'A cualquier momento del día',
        emoji: '✨',
        products: ['Lab Nutrition Colágeno Peptides 609g'],
        tip: '1 cucharada en agua, café frío, batido o cualquier bebida. Los péptidos de colágeno son termoresistentes — también funcionan en bebidas calientes.'
      },
    ],
    timeline: [
      { label: 'Mes 1', title: 'Piel más luminosa', description: 'El glutatión es conocido como el "antioxidante de la piel luminosa". Muchos notan más brillo desde el mes 1.' },
      { label: 'Mes 2–3', title: 'Firmeza y elasticidad', description: 'El colágeno tarda en acumularse en los tejidos. El omega 3 hidrata las membranas celulares de la piel desde adentro.' },
      { label: 'Mes 6+', title: 'Antienvejecimiento real', description: 'Los efectos anti-aging profundos son de largo plazo. Con consistencia de 6 meses, la diferencia en piel, articulaciones y energía es notable.' },
    ],
    tips: [
      { emoji: '🌞', title: 'Protector solar es obligatorio', body: 'Ningún suplemento anti-aging funciona si el sol destruye el colágeno y daña el ADN celular todos los días. SPF 50 es el paso más importante.' },
      { emoji: '🚬', title: 'Tabaco cancela este kit', body: 'El cigarro genera radicales libres que el glutatión apenas puede contrarrestar. Es la causa principal de envejecimiento prematuro de la piel.' },
      { emoji: '😴', title: 'Dormir 7-8 horas es parte del kit', body: 'El colágeno y el glutatión se producen en mayor cantidad durante el sueño profundo. El kit funciona, pero el sueño es cuando actúa.' },
      { emoji: '🍫', title: 'Azúcar es el enemigo del colágeno', body: 'La glicación (azúcar + proteínas) destruye el colágeno. Reducir azúcares refinados multiplica el efecto del kit.' },
    ],
    recipe: {
      title: 'Café de Colágeno (sin sabor)',
      emoji: '☕',
      ingredients: [
        '1 taza café espresso o americano',
        '1 cucharada Lab Nutrition Colágeno Peptides',
        '1 chorrito de leche o leche vegetal (opcional)',
        'Hielo si prefieres frío',
      ],
      steps: [
        'Prepara tu café como siempre.',
        'Agrega la cucharada de colágeno mientras el café está caliente.',
        'Revuelve vigorosamente por 15 segundos hasta disolver.',
        'Los péptidos de colágeno no cambian el sabor ni la textura del café.',
      ],
    },
    faqs: [
      { q: '¿A qué edad debo empezar con este kit?', a: 'Desde los 25-28 años, cuando la producción de colágeno propio empieza a declinar. Más efectivo cuanto antes se empiece.' },
      { q: '¿El glutatión IV es mejor que el oral?', a: 'El IV tiene mayor biodisponibilidad. El oral es significativamente más conveniente y con la formulación correcta (liposomal o con N-acetilcisteína) es muy efectivo.' },
      { q: '¿Cuánto tiempo debo tomar este kit?', a: 'El anti-aging es a largo plazo. Se recomienda mínimo 6 meses continuos para ver resultados profundos, y después mantener.' },
      { q: '¿Puedo tomar este kit siendo menor de 30 años?', a: 'Sí, especialmente si tienes estrés oxidativo alto (fumar, sol, ciudad contaminada). La prevención funciona mejor que la corrección.' },
    ],
  },

  {
    slug: 'kit-rutina-facial-basica',
    kitName: 'Kit Rutina Facial Básica',
    tagline: '3 pasos. Mañana y noche. Para siempre.',
    description: 'La limpieza elimina impurezas sin agredir la barrera. La niacinamida unifica el tono y controla los poros. El SPF protege todo lo que los pasos anteriores construyen. Es la rutina que los dermatólogos recomiendan.',
    color: 'var(--cat-coral)',
    schedule: [
      {
        time: 'Mañana — en este orden exacto',
        emoji: '🌅',
        products: ['Espuma Limpiadora Facial Piel Mixta Kumir', 'The Ordinary Niacinamide 10% + Zinc 1%', 'Beauty of Joseon Relief Sun SPF50+'],
        tip: 'ORDEN IMPORTA. Limpiar → sérum → SPF. Espera 30 segundos entre capas para que cada producto se absorba antes de aplicar el siguiente.'
      },
      {
        time: 'Noche — rutina simplificada',
        emoji: '🌙',
        products: ['Espuma Limpiadora Facial Piel Mixta Kumir', 'The Ordinary Niacinamide 10% + Zinc 1%'],
        tip: 'El SPF no se aplica de noche. La limpieza nocturna es la más importante — remueve el SPF, contaminación y sebo acumulado del día.'
      },
    ],
    timeline: [
      { label: 'Semana 1–2', title: 'La piel se adapta', description: 'Puede haber un ligero período de ajuste con la niacinamida (purging). Es normal y temporal — no suspendas.' },
      { label: 'Mes 1', title: 'Poros menos visibles, tono más uniforme', description: 'La niacinamida reduce la apariencia de poros y comienza a unificar el tono. La piel está más limpia y libre de brillos.' },
      { label: 'Mes 2–3', title: 'Piel transformada', description: 'Reducción visible de manchas. El SPF ha prevenido nuevo daño solar. La piel está saludable y protegida.' },
    ],
    tips: [
      { emoji: '🧪', title: 'Patch test primero', body: 'La primera semana, aplica la niacinamida solo en la parte interna de la muñeca durante 3 días. Si no hay reacción, pasa a la cara.' },
      { emoji: '🌞', title: 'El SPF es el producto más anti-aging que existe', body: 'El 80% del envejecimiento visible es causado por el sol. El Beauty of Joseon es ligero, sin cast blanco y se usa como último paso de la rutina.' },
      { emoji: '💧', title: 'Niacinamida en piel ligeramente húmeda', body: 'Aplicar en piel ligeramente húmeda (no empapada) mejora la penetración del producto.' },
      { emoji: '🚫', title: 'No mezcles con vitamina C directa', body: 'Si usas vitamina C pura (ácido ascórbico), no la apliques en el mismo paso que la niacinamida. Sepáralas por AM/PM.' },
    ],
    warnings: ['Usar SPF todos los días, incluso nublado', 'Evitar contacto con ojos', 'AHA/BHA no combinar con niacinamida el mismo momento'],
    faqs: [
      { q: '¿Puedo usar este kit si tengo piel sensible?', a: 'Sí. La espuma Kumir es suave y la niacinamida es uno de los activos mejor tolerados. El SPF de Beauty of Joseon tiene centella asiática calmante.' },
      { q: '¿Tengo que usar el SPF aunque sea nublado o esté en casa?', a: 'Sí. La radiación UV atraviesa las nubes y los vidrios. 10 minutos de exposición acumulada diaria deteriora el colágeno.' },
      { q: '¿La niacinamida 10% es muy fuerte para empezar?', a: '10% es la concentración clínica estándar. Si eres muy sensible, en las primeras 2 semanas alterna un día sí, un día no, hasta que la piel se acostumbre.' },
      { q: '¿Cuándo agregar más productos a esta rutina?', a: 'Espera 30 días antes de agregar algo nuevo. La piel necesita estabilizarse con la base. Después puedes agregar retinol (noche) o vitamina C (mañana).' },
    ],
  },
]

export function getGuideBySlug(slug: string): KitGuide | undefined {
  return GUIDES.find(g => g.slug === slug)
}

export function detectKitFromItems(productNames: string[]): KitGuide | undefined {
  const names = productNames.join(' ').toLowerCase()
  // Match kits by detecting key product names in the order
  if (names.includes('colag') && names.includes('biotina') && (names.includes('natures truth') || names.includes('gomita'))) return getGuideBySlug('kit-colageno-radiante')
  if (names.includes('glucosamina') || (names.includes('marino') && names.includes('curcuma'))) return getGuideBySlug('kit-articulaciones-movilidad')
  if (names.includes('melatonina') || names.includes('gud nait') || names.includes('rescue night')) return getGuideBySlug('kit-sueno-profundo')
  if (names.includes('creatina') && (names.includes('pre-workout') || names.includes('preworkout'))) return getGuideBySlug('kit-gym-performance')
  if (names.includes('vitamina d3') || names.includes('sundown')) return getGuideBySlug('kit-vitaminas-esenciales')
  if (names.includes('psyllium') || names.includes('inulina') || names.includes('alcachofa')) return getGuideBySlug('kit-detox-digestion')
  if (names.includes('champú') || names.includes('champu') || names.includes('acondicionador') || names.includes('karica')) return getGuideBySlug('kit-cuidado-capilar')
  if (names.includes('golden latte') || names.includes('reishi')) return getGuideBySlug('kit-bienestar-andino')
  if (names.includes('ashwagandha') || names.includes('rhodiola')) return getGuideBySlug('kit-estres-ansiedad')
  if (names.includes('maca')) return getGuideBySlug('kit-superalimentos-andinos')
  if (names.includes('glutatión') || names.includes('glutation') || names.includes('peptides') || names.includes('nutricost')) return getGuideBySlug('kit-antienvejecimiento')
  if (names.includes('espuma') || names.includes('niacinamide') || names.includes('joseon') || names.includes('spf')) return getGuideBySlug('kit-rutina-facial-basica')
  return undefined
}
