-- Ritual "Paso a Paso" en la ficha del kit (manual v4.0, Protocolo de Implementación #1)
-- Cada producto dentro de un kit gana: rol en la rutina (step_label), momento de uso
-- (step_when, con emoji para el chip) e instrucción de aplicación (step_instruction).
-- Los textos provienen del "Manual de 15 Rutinas y Kits Paso a Paso" v4.0 y se mapean
-- por (kit slug, sort_order) — el orden en BD es 1:1 con el manual (verificado 2026-07-15).

alter table kit_products
  add column if not exists step_label text,
  add column if not exists step_when text,
  add column if not exists step_instruction text;

-- 1. Rutina Skin Care Piel Sensible (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Limpieza micelar', '☀️🌙 Mañana y noche', 'Empapa un disco de algodón y deslízalo con suavidad para desmaquillar y limpiar impurezas sin necesidad de frotar ni enjuagar con agua del grifo.'),
  (2, 'Limpieza profunda', '☀️🌙 Mañana y noche', 'Aplica sobre rostro húmedo, masajea en círculos para disolver residuos polucionantes y aclara con agua tibia o un disco de algodón suave.'),
  (3, 'Booster de hidratación', '☀️🌙 Mañana y noche', 'Aplica 2 gotas en la piel húmeda. Infunde agua volcánica y ácido hialurónico para fortalecer la barrera sin causar irritación ni ardor.'),
  (4, 'Tratamiento calmante', '☀️🌙 Mañana y noche', 'Distribuye por rostro y cuello. Actúa sobre las causas biológicas de la reactividad, calmando el ardor y la tirantez al instante.'),
  (5, 'Protección mineral', '☀️ Mañana', 'Agita y aplica dos dedos de producto. Filtro 100% físico invisible que blinda la piel intolerante frente a radiación UVA, UVB y luz visible.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-skin-care-piel-sensible' and kp.sort_order = v.ord;

-- 2. Rutina Protector Solar Diario (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Base hidratante', '☀️ Mañana', 'Aplica en rostro limpio para infundir ácido hialurónico de absorción ultrarrápida, dejando un lienzo suave, fresco y sin sensación grasa.'),
  (2, 'Protector de diario', '☀️ Mañana', 'Distribuye por rostro y cuello. Textura fluida ultraligera que no deja brillo ni residuos, perfecta para el ritmo acelerado matutino.'),
  (3, 'Alternativa tratante', '✨ Días con rojeces o brotes', 'Alternativa premium con niacinamida de grado médico que calma imperfecciones mientras protege de la radiación solar.'),
  (4, 'Defensa de labios', '👄 Durante el día', 'Desliza sobre los labios para protegerlos de quemaduras y resecamiento. Llévalo siempre en el bolsillo o cartera.'),
  (5, 'Reaplicación en oficina', '⏰ Cada 3 horas', 'Rocía en "Z" a 15 cm del rostro. Permite reaplicar el bloqueador en el trabajo o la calle sin tocar la cara ni correr el maquillaje.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-protector-solar-diario' and kp.sort_order = v.ord;

-- 3. Rutina Skin Care Piel Grasa (6 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Limpieza purificante', '☀️🌙 Mañana y noche', 'Emulsiona con agua tibia en las manos, masajea el rostro por 30 segundos y enjuaga para eliminar grasa y sudor acumulado.'),
  (2, 'Exfoliación química', '🌙 Noche · 3 veces por semana', 'Aplica en un algodón y pasa por el rostro limpio (evitando ojos) para renovar la textura y desobstruir poros.'),
  (3, 'Tratamiento seborregulador', '☀️🌙 Mañana y noche', 'Aplica 3 gotas. Reduce el brillo facial, calma la inflamación de brotes activos y afina notablemente los poros abiertos.'),
  (4, 'Sello matificante', '☀️🌙 Mañana y noche', 'Aplica para sellar la hidratación sin aportar aceites, manteniendo la piel con un acabado mate aterciopelado hasta por 8 horas.'),
  (5, 'Protector toque seco', '☀️ Mañana', 'Aplica dos dedos de producto. Protege del sol, controla el sudor facial y unifica el tono ligera y naturalmente sin obstruir poros.'),
  (6, 'Tratamiento SOS localizado', '🌙 Noche · en granitos activos', 'Coloca un parche sobre la imperfección limpia antes de dormir para extraer la impureza, desinflamar y evitar tocarlo.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-skin-care-piel-grasa' and kp.sort_order = v.ord;

-- 4. Kit Viaje Esencial (6 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Desinfección de manos', '✈️ En todo momento', 'Rocía en las manos durante traslados o en el avión para desinfectar eficazmente sin resecar. Aroma floral fresco.'),
  (2, 'Nutrición portátil', '🧴 Uso frecuente', 'Aplica tras el desinfectante para contrarrestar la intensa sequedad de aviones, aeropuertos o climas fríos.'),
  (3, 'Cuidado labial', '👄 En ruta', 'Desliza por los labios para prevenir grietas y dolorosa resequedad causada por cambios bruscos de temperatura o viento.'),
  (4, 'Protección de ampollas', '🥾 Caminatas turísticas', 'Colócalas en talones o dedos al primer signo de roce con calzado nuevo o caminatas prolongadas por la ciudad.'),
  (5, 'Limpieza express', '🌙 Noche de hotel', 'Retira maquillaje y suciedad acumulada del viaje en segundos cuando estés muy cansado para una rutina larga de lavado.'),
  (6, 'Inductor de calma', '😴 Antes de dormir', 'Coloca 4 gotas en la lengua para calmar la agitación del viaje, adaptarse a camas de hotel y combatir el jet-lag.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'kit-viaje-esencial' and kp.sort_order = v.ord;

-- 5. Kit Protector Solar Playa y Outdoor (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Escudo facial extremo', '☀️ Antes de salir · rostro', 'Aplica generosamente en el rostro para prevenir quemaduras solares severas y daño celular durante exposición extrema.'),
  (2, 'Protección infantil', '👶 Antes de salir · niños', 'Aplica en los niños 20 minutos antes de la piscina o playa. Fórmula hipoalergénica sin fragancias de alta resistencia al agua.'),
  (3, 'Protección corporal', '🏖️ Antes de exponerse', 'Distribuye por brazos, piernas y espalda. Se absorbe al instante sin dejar sensación pegajosa ni atrapar arena del mar.'),
  (4, 'Protección de labios', '👄 Reaplicación frecuente', 'Evita quemaduras, grietas y dolorosa descamación en los labios producidas por el sol y la salinidad marítima.'),
  (5, 'Reaplicación express', '⏰ Cada 2 horas en la playa', 'Ideal para reaplicar sobre la piel sudada o mojada al salir del mar sin necesidad de esparcir con las manos llenas de arena.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'kit-protector-solar-playa-y-outdoor' and kp.sort_order = v.ord;

-- 6. Kit Primeros Auxilios Familiar (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Sutura de emergencia', '🩹 Cortes profundos', 'Limpia la herida y aplica perpendicularmente para unir los bordes de la piel, cerrando el corte sin puntos y reduciendo cicatrices.'),
  (2, 'Protección adaptable', '🩹 Raspones en articulaciones', 'Bandas de tela elástica que se mueven con el cuerpo, ideales para codos, rodillas y nudillos raspados.'),
  (3, 'Retirada sin dolor', '👶 Piel delicada o niños', 'Curitas con adhesivo de silicona suave que protegen e hidratan la herida y se retiran sin dar tirones en la piel ni vellos.'),
  (4, 'Sello impermeable', '💧 Heridas mojadas', 'Parche transparente 100% impermeable que bloquea el ingreso de agua, jabón y bacterias al bañarse o nadar en piscina.'),
  (5, 'Suministro base', '🩹 Uso diario', 'El suministro perfecto para mantener en el botiquín casero para pequeños rasguños, pinchazos o cortes cotidianos leves.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'kit-primeros-auxilios' and kp.sort_order = v.ord;

-- 7. Kit Botiquín Compacto (4 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Alivio ocular SOS', '👁️ Ante ardor o fatiga visual', 'Aplica 1 gota en cada ojo para hidratar y aliviar la irritación causada por aire acondicionado en el auto o computadora.'),
  (2, 'Cortes y ampollas', '🩹 Roce diario', 'Surtido de tamaños discretos e invisibles para proteger cortes menores en la oficina o ampollas en los talones por zapatos formales.'),
  (3, 'Heridas flexibles', '🩹 Cortes en manos o dedos', 'Curitas de tela ultra flexible que se adaptan a los nudillos y dedos, permitiendo seguir trabajando o manejando sin caerse.'),
  (4, 'Sutura de emergencia', '🩹 Cortes profundos', 'Permite cerrar de emergencia cortes limpios con vidrio o cuchillas antes de llegar a un centro médico si fuera necesario.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'kit-botiquin-compacto' and kp.sort_order = v.ord;

-- 8. Rutina Sueño y Descanso (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Relajante muscular', '🌙 60–90 min antes de dormir', 'Toma 1 o 2 comprimidos con agua tras la cena para relajar el sistema nervioso y preparar biológicamente el cuerpo para el descanso.'),
  (2, 'Desconexión mental', '🌙 30–45 min antes', 'Diluye las gotas en un sorbo de agua tibia para calmar la ansiedad, bajar las revoluciones mentales y facilitar la relajación.'),
  (3, 'Armonía emocional', '🌙 20 min antes', 'Mastica 1 o 2 gomitas para liberar tensiones emocionales y rumiaciones acumuladas durante el día gracias a las esencias florales.'),
  (4, 'Inductor inmediato', '😴 Al apagar la luz', 'Mastica 1 gomita ya en la cama. Envía la señal hormonal de inicio del sueño al cerebro para dormir rápidamente sin somnolencia matutina.'),
  (5, 'Soporte alternante', '🔄 Mantenimiento', 'Fórmula perfecta para alternar durante las semanas o tener de respaldo en la mesa de noche, asegurando un sueño sin interrupciones.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-sueno-y-descanso' and kp.sort_order = v.ord;

-- 9. Rutina Acidez y Pesadez Estomacal (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Probiótico vivo intensivo', '🌅 En ayunas · 8:00 a.m.', 'Bebe 100ml de Kéfir fresco al despertar. Siembra miles de millones de bacterias y levaduras benéficas para proteger y regenerar la mucosa del estómago.'),
  (2, 'Hidratación simbiótica', '☕ Media mañana', 'Refresco probiótico ligero y vegano. Aporta hidratación enzimática sin lactosa para continuar reforzando la flora intestinal durante la mañana.'),
  (3, 'Desinflamación gástrica', '🍽️ Con el almuerzo', 'Toma 1 cápsula. Aporta potentes antioxidantes que ayudan a calmar la irritación y ardor en las paredes gástricas tras comer.'),
  (4, 'Depuración bacteriana', '🍽️ Con el almuerzo', 'Toma 1 cápsula. El Neem ayuda a regular patógenos nocivos en el tracto digestivo y purifica el entorno estomacal.'),
  (5, 'Alimento prebiótico', '🥤 Merienda de tarde', 'Prepara en colada o batido. Su fibra soluble actúa como alimento (prebiótico) para que las bacterias del Kéfir colonicen exitosamente el intestino.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-acidez-y-pesadez-estomacal' and kp.sort_order = v.ord;

-- 10. Rutina Estrés y Calma Diaria (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Regulación del cortisol', '☀️ Mañana · desayuno', 'Toma 1 cápsula para aportar resistencia biológica al estrés, estabilizar el estado de ánimo y evitar el agotamiento físico o mental.'),
  (2, 'Rescate de crisis', '🆘 Momentos de alta presión', 'Aplica 4 gotas debajo de la lengua antes de reuniones difíciles, tráfico tenso o picos de ansiedad para recobrar la calma al instante.'),
  (3, 'Calma diurna', '🕒 Tarde · 3:00 p.m.', 'Mastica 1 a 2 gomitas en el momento de mayor cansancio laboral para aplacar el agobio y la ansiedad por picar dulces insanos.'),
  (4, 'Relajación hogareña', '🏠 Al llegar a casa', 'Diluye unas gotas en infusión tibia o agua para marcar el final de la jornada de trabajo, relajar los músculos y disfrutar la velada.'),
  (5, 'Calma discreta', '👜 En la cartera o auto', 'Pastillas masticables de rápida acción para consumir en transporte público, esperas o conducción sin requerir agua.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-estres-y-calma-diaria' and kp.sort_order = v.ord;

-- 11. Rutina Gym y Recuperación (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Asimilación ultra rápida', '💪 Post-entreno inmediato', 'Mezcla 1 scoop en 250ml de agua en tu shaker al terminar de entrenar. La proteína hidrolizada nutre las fibras musculares en minutos sin causar pesadez.'),
  (2, 'Proteína vegana completa', '🥣 Desayunos funcionales', 'Ideal para licuar con avena, plátano o leche vegetal por las mañanas, aportando proteína orgánica de origen vegetal y superalimentos.'),
  (3, 'Fácil digestión', '🥞 Recetas y horneo', 'Proteína de suero altamente digestiva y baja en lactosa, ideal para preparar panqueques proteicos, avena horneada o batidos de merienda.'),
  (4, 'Snack proteico', '🎒 En la maleta de gym', 'Sacia el hambre post-entrenamiento o durante largas jornadas laborales, aportando proteína con una textura crujiente y deliciosa.'),
  (5, 'Energía pre-entreno', '⚡ 45 min antes del gym', 'Snack orgánico vegetal perfecto para darte energía limpia, carbohidratos complejos y grasas saludables antes de levantar pesas.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-gym-y-recuperacion' and kp.sort_order = v.ord;

-- 12. Rutina Oficina y Pantallas (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Enfoque sin temblor', '🌅 Inicio de jornada · 8:00 a.m.', 'Toma 1 cápsula para obtener energía mental y concentración aguda. La L-Teanina elimina la ansiedad, temblores o el bajón de la cafeína pura.'),
  (2, 'Lubricación ocular', '👁️ Cada 4 horas', 'Instila 1 gota en cada ojo para prevenir el síndrome de ojo seco, ardor y visión borrosa causados por el parpadeo reducido ante monitores.'),
  (3, 'Rescate ocular SOS', '👁️ Alternancia o bolsillo', 'Llévalo siempre contigo para aplicar al sentir ardor por aire acondicionado de oficina, polvo o contaminación ambiental.'),
  (4, 'Energía celular premium', '🍽️ Con el almuerzo', 'Toma 1 cápsula. Complejo B de alta asimilación celular que nutre el sistema nervioso, combate la fatiga mental severa y sostiene el metabolismo.'),
  (5, 'Desconexión laboral', '🌆 Fin de jornada · 6:00 p.m.', 'Consume 2 gomitas al cerrar la laptop para soltar la tensión del cuello y hombros, propiciando una noche tranquila en casa.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-oficina-y-pantallas' and kp.sort_order = v.ord;

-- 13. Rutina Pies Perfectos (6 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Ablandador de durezas', '🚿 En la ducha', 'Aplica en talones y zonas ásperas o con callosidades. Deja actuar de 3 a 5 minutos para ablandar profundamente la piel engrosada.'),
  (2, 'Pulido mecánico', '🚿 En la ducha', 'Con la piel suave por el removedor, frota con movimientos circulares para retirar toda la célula muerta y dejar talones de bebé.'),
  (3, 'Corte seguro', '🚿 Al salir de la ducha', 'Aprovecha la suavidad de las uñas limpias para realizar un corte recto preciso, previniendo dolorosas uñas encarnadas.'),
  (4, 'Acción TriAction', '👟 Antes de vestirte', 'Espolvorea entre los dedos de los pies y dentro del calzado para absorber humedad y prevenir bacterias u hongos.'),
  (5, 'Frescura mentolada', '🔄 Uso alternante', 'Talco de acción refrescante y calmante, ideal para espolvorear dentro de zapatillas deportivas o botas después de entrenar.'),
  (6, 'Protección clínica 24h', '🧴 Uso diario', 'Rocía a 10cm sobre la planta y empeine. Su fórmula clínica antitranspirante mantiene los pies secos y perfumados todo el día.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-pies-perfectos' and kp.sort_order = v.ord;

-- 14. Rutina Cuidado Piel Corporal (5 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Higiene dermo-protectora', '🚿 En la ducha diaria', 'Gel limpiador sin jabón enriquecido con omegas que limpia suavemente el rostro y cuerpo respetando la barrera lipídica y evitando picazón.'),
  (2, 'Limpieza sensorial', '🚿 Ducha refrescante', 'Alternativa sensorial con prebióticos y aroma fresco, ideal para después de hacer deporte o mañanas calurosas de verano.'),
  (3, 'Sello de ceramidas', '💧 Al salir de la ducha', 'Aplica sobre la piel ligeramente húmeda de todo el cuerpo. Sus 3 ceramidas esenciales sellan la hidratación por 24 horas sin dejar sensación grasa.'),
  (4, 'Rescate intensivo SOS', '🆘 Zonas rebeldes', 'Aplica como bálsamo intensivo en codos, rodillas, talones o zonas con eccema, irritación o descamación severa para un alivio inmediato.'),
  (5, 'Belleza desde el interior', '✨ Dosis diaria', 'Mastica 2 gomitas al día para fortalecer la elasticidad, el brillo de la piel, uñas y cabello desde el interior celular.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'rutina-cuidado-piel-corporal' and kp.sort_order = v.ord;

-- 15. Kit Dolor Muscular Leve (4 pasos)
update kit_products kp
set step_label = v.label, step_when = v.wh, step_instruction = v.instr
from kits k, (values
  (1, 'Alivio interno', '🍽️ Con las comidas', 'Toma 1 cápsula para reducir la inflamación sistémica, el dolor muscular tardío (DOMS) y la rigidez articular post-entrenamiento.'),
  (2, 'Aromaterapia y masaje', '💆 Masaje o infusión', 'Aplica unas gotas con un aceite portador para masajear zonas con contracturas, o agrega 2 gotas en té tibio para relajar el cuerpo.'),
  (3, 'Soporte articular', '🦶 Ante torceduras o fatiga', 'Coloca en el pie derecho para brindar estabilidad articular, compresión ligera y descanso tras caminatas o ejercicios de impacto.'),
  (4, 'Regeneración de tejidos', '🥤 Batido diario', 'Mezcla 1 scoop en tu bebida favorita para nutrir cartílagos, tendones, ligamentos y acelerar la recuperación del tejido conectivo.')
) as v(ord, label, wh, instr)
where kp.kit_id = k.id and k.slug = 'kit-dolor-muscular-leve' and kp.sort_order = v.ord;

-- Fix: nombre corrupto del tónico The Ordinary (arrastraba texto del catálogo y le faltaba la "T")
update products
set name = 'The Ordinary Tónico Exfoliante de Ácido Glicólico 7% 240ml'
where slug = 'he-ordinary-tonico-exfoliante-de-acido-glicolico-7-100ml-momento-de-aplicacion-n';
