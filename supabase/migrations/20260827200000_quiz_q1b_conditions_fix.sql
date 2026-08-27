-- Segunda pasada del rediseño: Q1b («¿Algo más que quieras trabajar?») pasa a
-- ser condicional a un objetivo declarado — no aparece en la ruta de texto
-- libre. Reaplica el resto de forma idempotente (UUIDs deterministas +
-- ON CONFLICT DO UPDATE), lo que además restaura la pregunta de texto que se
-- ocultó temporalmente mientras el código no estaba desplegado.
--
-- Aditiva por diseño. Ninguna pregunta ni opción se borra: quiz_profiles.answers
-- referencia sus UUIDs y el motor los resuelve por ahí. Las preguntas que salen
-- del flujo se ocultan con una condición que ninguna opción emite.
--
-- Generado por scripts/quiz-redesign/build-migration.mjs desde questionnaire.mjs.
-- No editar a mano: cambiar la especificación y regenerar.

BEGIN;

-- ── Esquema ──────────────────────────────────────────────────────────
-- El campo abierto necesita un tipo de pregunta nuevo.
ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_type_check;
ALTER TABLE public.quiz_questions ADD CONSTRAINT quiz_questions_type_check
  CHECK (type IN ('single','multi','range','age','text'));

-- Tope de selección para las preguntas de varias respuestas, y tope de
-- caracteres para el campo abierto. Ambos opcionales.
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS max_select integer;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS max_length integer;
ALTER TABLE public.quiz_question_options ADD COLUMN IF NOT EXISTS render text;

-- ── Preguntas que salen del flujo ────────────────────────────────────
-- Se ocultan, no se borran. El slug de la condición no lo emite ninguna opción.
-- ¿Qué quieres cuidar hoy? — Reemplazada: obj-belleza se divide en piel y cabello, y se añade la salida de texto libre.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0001-0001-0000-000000000001';
-- ¿En qué quieres enfocarte? — Innecesaria: piel y cabello ya son puertas separadas en Q1.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0004-0000-000000000001';
-- ¿Qué tan importante es que sean productos naturales u orgánicos? — Ocupa una pantalla para una señal binaria. Pasa a ser una opción en Restricciones.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0012-0000-000000000001';
-- ¿Qué tipo de rutina prefieres? — Duplica «¿Cómo quieres armar tu kit?»; su opción «No sé» mapea al mismo hint que «balanceada».
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0003-0006-0000-000000000001';
-- ¿Tienes piel o cuero cabelludo sensible? — Absorbida por el nuevo tipo de piel y las preocupaciones de piel.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0003-0002-0000-000000000001';
-- Antes de recomendarte, ¿hay algo que debamos saber? — Se divide en dos pantallas: salud por un lado, restricciones y preferencias por otro.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0003-0005-0000-000000000001';
-- ¿Cuál de estas se parece más a lo que necesitas? — Era la Q1 reformulada: a quien acaba de decir «no estoy seguro» no lo ayuda la misma lista con otras palabras. Su lugar lo toma el campo de texto abierto.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = 'ba9c0d19-82d9-40fe-b91c-0de2dba7fe64';
-- ¿Cuál es tu nivel de entrenamiento? — Fusionada con el tipo de entrenamiento en una sola pregunta.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0002-0000-000000000001';
-- ¿Sientes molestias en articulaciones o rodillas? — Absorbida por «¿Qué se te hace más cuesta arriba?».
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0003-0000-000000000001';
-- ¿Qué tipo de entrenamiento haces? — Fusionada con el nivel de entrenamiento.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0001-0000-000000000001';
-- ¿Cuál es tu tipo de piel? — Reemplazada por una versión con salida «no estoy seguro/a» y pregunta proxy.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0005-0000-000000000001';
-- ¿Qué te preocupa más de tu piel? — Reemplazada: faltaban brotes, luminosidad, hidratación y marcas.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0006-0000-000000000001';
-- ¿Cuál es tu problema capilar principal? — Reemplazada por la rama de cabello completa.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0007-0000-000000000001';
-- ¿Qué es lo que más te afecta en tu día a día? — Reemplazada: no distinguía conciliar / mantener / sueño no reparador.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0008-0000-000000000001';
-- ¿Cuál es tu síntoma principal? — Reemplazada: faltaban pesadez e irregularidad.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0010-0000-000000000001';
-- ¿Cuál es tu prioridad? — Reemplazada: faltaban concentración, belleza, huesos, ánimo y la salida «no sé».
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0011-0000-000000000001';
-- ¿Cómo es tu exposición al sol normalmente? — Reemplazada por la rama solar completa (fototipo, uso, textura, momento).
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0013-0000-000000000001';
-- ¿Qué tipo de destino es tu viaje? — Se mantiene el contenido pero pasa a la rama de viaje ampliada.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0014-0000-000000000001';
-- ¿Qué tipo de kit buscas para casa? — Reemplazada: no preguntaba para quién es, que es una brecha de seguridad.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0015-0000-000000000001';
-- ¿Qué te preocupa principalmente? — Reemplazada por la rama de pies y cuerpo ampliada.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0016-0000-000000000001';
-- ¿Qué buscas principalmente con tu entrenamiento? — Se mantiene el contenido dentro de la rama de gym reordenada.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0017-0000-000000000001';
-- ¿Con qué frecuencia lo sientes? — Se recrea con condiciones sobre los nuevos slugs de sueño y estrés.
UPDATE public.quiz_questions SET conditions = '{"if_any_slug":["retirada-rediseno-indices"]}'::jsonb WHERE id = '55550012-0002-0009-0000-000000000001';

-- ── Preguntas nuevas ─────────────────────────────────────────────────

-- [q1] ¿Qué quieres cuidar hoy?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('374b2280-e5f0-5013-9f09-371feb09cecf', '55550011-0001-0000-0000-000000000001', '¿Qué quieres cuidar hoy?', 'Elige lo que más se parece a lo que necesitas ahora.', 'single', 1, true, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('57333af1-bf7c-5479-95ae-ed3d567ed1f5', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Mi piel y mi rostro', 'obj-piel', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('74b99eb3-cec6-5c0c-986d-031a954d3692', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Mi cabello', 'obj-cabello', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('5e90bba7-b06a-5476-94c7-f434cc714b2d', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Mi descanso, calma o energía', 'obj-bienestar', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('1d73b698-3b8d-5790-ab93-b034d1da30a6', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Gym y rendimiento', 'obj-rendimiento', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('01eb5b66-f8a0-5a4f-aea0-54c660080d89', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Mi digestión', 'obj-digestivo', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('df11d42d-b3d3-5152-98c0-ce20d1f57ab0', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Vitaminas y nutrición de base', 'obj-nutricion', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e5a72852-772a-5a6c-b10d-9a803e827778', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Protección solar', 'obj-solar', 7, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('cf1ac818-651d-5720-862b-558d57f294e3', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Mis pies o mi cuerpo', 'obj-pies-cuerpo', 8, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('70c32873-44f6-515d-9b25-56f4139f2725', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Mi hogar, familia o primeros auxilios', 'obj-hogar', 9, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0b0211a8-b711-5abb-83ba-1597cf624794', '374b2280-e5f0-5013-9f09-371feb09cecf', 'Un viaje, playa u outdoor', 'obj-viaje', 10, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('74355d75-bd26-59fe-ac50-b1a8e3889937', '374b2280-e5f0-5013-9f09-371feb09cecf', 'No estoy seguro/a — prefiero contarles con mis palabras', 'obj-texto-libre', 11, '{}', NULL, NULL, 'secundaria')
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [q1b] ¿Algo más que quieras trabajar?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('e667e3ba-e4e1-53f7-af51-84c6574422a6', '55550011-0001-0000-0000-000000000001', '¿Algo más que quieras trabajar?', 'Opcional. No alarga el cuestionario: solo nos ayuda a que tu rutina cubra todo lo tuyo.', 'multi', 2, false, '{"if_any_slug":["obj-piel","obj-cabello","obj-bienestar","obj-rendimiento","obj-digestivo","obj-nutricion","obj-solar","obj-pies-cuerpo","obj-hogar","obj-viaje"]}'::jsonb, 3, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a127daf2-9d86-58d3-8663-b49f33da8d26', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Mi piel y mi rostro', 'extra-piel', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9e07c04a-25d6-5e31-8b71-2495a37236da', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Mi cabello', 'extra-cabello', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('d3bc00bd-343c-5306-91af-7ad44122cbb9', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Mi descanso, calma o energía', 'extra-bienestar', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9d7ad119-78aa-564a-945c-c658382909ce', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Gym y rendimiento', 'extra-rendimiento', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('110d6ce5-be81-5b22-808d-b7a5c0265138', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Mi digestión', 'extra-digestivo', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0e79ad4e-c961-534c-88fb-fe387721788d', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Vitaminas y nutrición de base', 'extra-nutricion', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('77310095-e6c1-5f31-8d43-3f87346905aa', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Protección solar', 'extra-solar', 7, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c905c957-59d2-5711-ab71-a9658ec5e7c8', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Mis pies o mi cuerpo', 'extra-pies-cuerpo', 8, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('d66534ed-1579-585c-bba3-cb5d40e22358', 'e667e3ba-e4e1-53f7-af51-84c6574422a6', 'Nada más por ahora', 'sin-extras', 9, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [piel1] ¿Cómo describirías tu piel?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('373eef09-2f16-52c4-ac5d-3612e8f430ce', '55550011-0002-0000-0000-000000000001', '¿Cómo describirías tu piel?', 'Si no estás seguro/a, no pasa nada — te ayudamos en la siguiente.', 'single', 10, true, '{"if_any_slug":["obj-piel"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('3cb85229-579a-55c2-964a-58d6c957db25', '373eef09-2f16-52c4-ac5d-3612e8f430ce', 'Grasa: brilla y los poros se notan', 'piel-grasa', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b6f9b588-b81f-5adc-a3cf-d90cae7f363b', '373eef09-2f16-52c4-ac5d-3612e8f430ce', 'Mixta: brilla en frente y nariz, normal en las mejillas', 'piel-mixta', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('dcc009c7-3744-561a-8012-d4c0b632c5d1', '373eef09-2f16-52c4-ac5d-3612e8f430ce', 'Seca: la siento áspera o tirante', 'piel-seca', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c8ede60f-b552-57d0-a382-96143b801086', '373eef09-2f16-52c4-ac5d-3612e8f430ce', 'Sensible: se irrita o enrojece con facilidad', 'piel-sensible', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ddc290d7-5143-5c02-9793-81d9dc465950', '373eef09-2f16-52c4-ac5d-3612e8f430ce', 'Normal: sin mayores problemas', 'piel-normal', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b47fd0ee-d67e-51a5-a9df-8c2c15be267c', '373eef09-2f16-52c4-ac5d-3612e8f430ce', 'No estoy seguro/a', 'piel-no-se', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [piel2] A media tarde, sin retocarte, ¿cómo sientes la cara?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('8030b869-342e-5fd2-833f-9f145425053e', '55550011-0002-0000-0000-000000000001', 'A media tarde, sin retocarte, ¿cómo sientes la cara?', 'Con esto lo deducimos nosotros.', 'single', 11, true, '{"if_any_slug":["piel-no-se"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('4a9d1576-4021-5f37-8e05-0e95a1054e79', '8030b869-342e-5fd2-833f-9f145425053e', 'Brillosa en frente y nariz, el resto normal', 'piel-mixta', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('8901b81f-6641-5aa5-a25d-2d253751b99b', '8030b869-342e-5fd2-833f-9f145425053e', 'Brillosa en toda la cara', 'piel-grasa', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('5b20bc18-a741-5d15-abf3-bbbb1dbb7e63', '8030b869-342e-5fd2-833f-9f145425053e', 'Tirante o con zonas ásperas', 'piel-seca', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a7d3f5fb-8051-5029-82a3-6c71812100ed', '8030b869-342e-5fd2-833f-9f145425053e', 'Brillosa y tirante a la vez', 'piel-deshidratada', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2a0ee13c-def8-56c8-be3c-a02def3bd3ce', '8030b869-342e-5fd2-833f-9f145425053e', 'Cómoda, ni brillo ni tirantez', 'piel-normal', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('8c0e1cd4-654e-5aa8-a74c-817be2a5f402', '8030b869-342e-5fd2-833f-9f145425053e', 'Con rojeces o ardor', 'piel-sensible', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [piel3] ¿Qué te gustaría mejorar?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('ed454a4a-2075-53b9-b579-131550c87eff', '55550011-0002-0000-0000-000000000001', '¿Qué te gustaría mejorar?', 'Puedes elegir varias.', 'multi', 12, true, '{"if_any_slug":["obj-piel"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ffdb3870-c21c-5a18-9f7d-b5e847abfe97', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Granitos o brotes', 'piel-brotes', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('49bd704d-c719-5d6e-88be-c2928e643373', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Puntos negros y poros abiertos', 'piel-poros', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a129e9ac-4127-59d5-bcb5-fe15d2a23f38', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Manchas o tono desigual', 'piel-manchas', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('de1e72b8-6c13-5fc3-a1bc-de0a37716e31', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Líneas de expresión y falta de firmeza', 'piel-arrugas', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('55f392b3-f91e-5f80-bdf0-5ee69b6a87fb', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Falta de luminosidad', 'piel-luminosidad', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('3f74e845-bc44-5ff1-951c-cf5103878c68', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Rojeces o irritación', 'piel-rojeces', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2e1c9441-4b35-555d-bedb-4d3707337fdd', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Falta de hidratación', 'piel-hidratacion', 7, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ec530da0-63cf-56b3-9fe8-7fbb562172c6', 'ed454a4a-2075-53b9-b579-131550c87eff', 'Marcas de granitos pasados', 'piel-marcas', 8, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [piel4] ¿Cómo es tu rutina hoy?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('d9bbac00-2acf-5072-963f-ba0047b7b877', '55550011-0002-0000-0000-000000000001', '¿Cómo es tu rutina hoy?', 'Para no recomendarte algo demasiado fuerte de entrada.', 'single', 13, true, '{"if_any_slug":["obj-piel"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('83cfa728-b3ea-563b-824f-5707be8b5df5', 'd9bbac00-2acf-5072-963f-ba0047b7b877', 'No tengo rutina, quiero empezar', 'rutina-piel-ninguna', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('dc94e347-6813-50c7-9c79-6ff6719e3b27', 'd9bbac00-2acf-5072-963f-ba0047b7b877', 'Limpio e hidrato, nada más', 'rutina-piel-basica', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('fe24c28f-632e-54b6-882d-b090e914e1d4', 'd9bbac00-2acf-5072-963f-ba0047b7b877', 'Ya uso activos (vitamina C, ácidos, retinol)', 'rutina-piel-activos', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0a1a1d2b-5d30-5a95-9311-e7a180a94afe', 'd9bbac00-2acf-5072-963f-ba0047b7b877', 'Probé activos y me irritaron', 'rutina-piel-intolerancia', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [cab1] ¿Cómo es tu cabello?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('2a028028-8c05-58d9-8d40-57c8d3dbfa3c', '55550011-0002-0000-0000-000000000001', '¿Cómo es tu cabello?', NULL, 'single', 20, true, '{"if_any_slug":["obj-cabello"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2551c106-6460-5986-a38d-7080adedbea5', '2a028028-8c05-58d9-8d40-57c8d3dbfa3c', 'Liso', 'cabello-liso', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('1d967b9e-0cca-5bd9-9db0-4004d711251a', '2a028028-8c05-58d9-8d40-57c8d3dbfa3c', 'Ondulado', 'cabello-ondulado', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('6ec1ecdf-ebc5-5087-91e4-9b5686ad9ea7', '2a028028-8c05-58d9-8d40-57c8d3dbfa3c', 'Rizado o afro', 'cabello-rizado', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('470b2f1f-0114-5a10-bbe2-bb7a2ba20b6f', '2a028028-8c05-58d9-8d40-57c8d3dbfa3c', 'No estoy seguro/a', 'cabello-tipo-no-se', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [cab2] ¿Y tu cuero cabelludo?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('2ea6f174-8df4-56ac-8f0f-b1e3bad44be7', '55550011-0002-0000-0000-000000000001', '¿Y tu cuero cabelludo?', NULL, 'single', 21, true, '{"if_any_slug":["obj-cabello"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('42dea30d-b63d-5ac6-bef0-99d6a7f3844b', '2ea6f174-8df4-56ac-8f0f-b1e3bad44be7', 'Se engrasa rápido', 'cuero-graso', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b0f91af2-bbd5-51c1-bae0-69688ca1d144', '2ea6f174-8df4-56ac-8f0f-b1e3bad44be7', 'Seco o con picazón', 'cuero-seco', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ae3fa65f-1aaa-5c2d-beb9-e478fcd6f3c4', '2ea6f174-8df4-56ac-8f0f-b1e3bad44be7', 'Con caspa', 'cuero-caspa', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('1756a7c7-28ef-5f64-98c5-619c18b56516', '2ea6f174-8df4-56ac-8f0f-b1e3bad44be7', 'Normal', 'cuero-normal', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [cab3] ¿Qué quieres resolver?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('d7803e79-1857-56ce-a5e1-47fd50b52368', '55550011-0002-0000-0000-000000000001', '¿Qué quieres resolver?', 'Puedes elegir varias.', 'multi', 22, true, '{"if_any_slug":["obj-cabello"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('7b43907f-0acc-5c81-ba9e-bdaffcc1505c', 'd7803e79-1857-56ce-a5e1-47fd50b52368', 'Caída o poco volumen', 'cabello-caida', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('7be2b553-179a-5daf-a883-c2dcd93eb072', 'd7803e79-1857-56ce-a5e1-47fd50b52368', 'Sequedad, quiebre o puntas abiertas', 'cabello-sequedad', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('cb1a17d0-d5c9-5a1a-ad17-8c995489b44e', 'd7803e79-1857-56ce-a5e1-47fd50b52368', 'Frizz y falta de brillo', 'cabello-frizz', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c98551d1-32e7-5121-a482-61f08af39932', 'd7803e79-1857-56ce-a5e1-47fd50b52368', 'Crecimiento lento', 'cabello-crecimiento', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e398434b-c549-57d1-9416-3ce9229d7ae5', 'd7803e79-1857-56ce-a5e1-47fd50b52368', 'Exceso de grasa', 'cabello-grasa', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('77ac73c5-494d-5756-b4f5-d081c2a4d916', 'd7803e79-1857-56ce-a5e1-47fd50b52368', 'Caspa', 'cabello-caspa', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [cab4] ¿Tu cabello pasa por alguno de estos?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('d10e7628-ddc6-553e-9c66-e8aad39750dc', '55550011-0002-0000-0000-000000000001', '¿Tu cabello pasa por alguno de estos?', NULL, 'multi', 23, true, '{"if_any_slug":["obj-cabello"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c9b6ca89-ae6d-5a67-b073-7a975e4ad2d5', 'd10e7628-ddc6-553e-9c66-e8aad39750dc', 'Lo tiño o me hago mechas', 'cabello-tenido', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('014483b8-4c89-56a5-80e8-2d1481fd0825', 'd10e7628-ddc6-553e-9c66-e8aad39750dc', 'Está decolorado', 'cabello-decolorado', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('3ba97a58-0a84-555e-9e70-1c9c405af689', 'd10e7628-ddc6-553e-9c66-e8aad39750dc', 'Uso plancha o secadora seguido', 'cabello-calor', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('68a3a925-7273-5cf5-a759-581c442209e0', 'd10e7628-ddc6-553e-9c66-e8aad39750dc', 'Ninguno, lo llevo natural', 'sin-tratamiento-capilar', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [dig1] ¿Qué es lo que más te incomoda?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('e5c4e5ed-18c6-5768-aea1-445c2e6fbbc5', '55550011-0002-0000-0000-000000000001', '¿Qué es lo que más te incomoda?', 'Puedes elegir varias.', 'multi', 30, true, '{"if_any_slug":["obj-digestivo"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c0137d4c-0d60-58e3-8d8e-dea2eb496c42', 'e5c4e5ed-18c6-5768-aea1-445c2e6fbbc5', 'Hinchazón y gases', 'digestivo-hinchazon', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a10938a0-40e0-5296-ae68-c0e150d559cc', 'e5c4e5ed-18c6-5768-aea1-445c2e6fbbc5', 'Estreñimiento o tránsito lento', 'digestivo-estrenimiento', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('bd977ef2-8e54-52ce-90d4-97d1a77c72d7', 'e5c4e5ed-18c6-5768-aea1-445c2e6fbbc5', 'Reflujo o acidez', 'digestivo-reflujo', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('70228a47-aee7-5cfa-b3b2-217bcbfa1e96', 'e5c4e5ed-18c6-5768-aea1-445c2e6fbbc5', 'Pesadez después de comer', 'digestivo-pesadez', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0e7032b1-698e-5701-866a-e9ad8b9ba4af', 'e5c4e5ed-18c6-5768-aea1-445c2e6fbbc5', 'Digestión irregular, cambia de un día a otro', 'digestivo-irregular', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('202589ce-dcce-5cf9-91c1-d7b48e2c476f', 'e5c4e5ed-18c6-5768-aea1-445c2e6fbbc5', 'Nada puntual, quiero cuidar mi digestión', 'digestivo-reset', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [dig2] ¿Cuándo lo sientes más?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('6a5fdec0-88f4-54b5-b152-1b693269df38', '55550011-0002-0000-0000-000000000001', '¿Cuándo lo sientes más?', NULL, 'single', 31, true, '{"if_any_slug":["obj-digestivo"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b1d9959f-102b-5203-8db6-0cbbde4bf178', '6a5fdec0-88f4-54b5-b152-1b693269df38', 'Justo después de comer', 'digestivo-postcomida', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('95eb477a-6419-507b-9cb5-24f395356357', '6a5fdec0-88f4-54b5-b152-1b693269df38', 'A lo largo de todo el día', 'digestivo-continuo', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('6521f4c7-d473-5192-8fdc-8ca1d33a2196', '6a5fdec0-88f4-54b5-b152-1b693269df38', 'Solo con ciertas comidas', 'digestivo-gatillos', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c74474ba-b4e1-5a89-8b53-a332a7e6d2ca', '6a5fdec0-88f4-54b5-b152-1b693269df38', 'Por temporadas, sobre todo con estrés', 'digestivo-estres', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [dig3] ¿Has tomado algo para esto?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('f1d381d3-3b18-5053-8c60-0cfc94e19112', '55550011-0002-0000-0000-000000000001', '¿Has tomado algo para esto?', 'Para no recomendarte lo que ya probaste.', 'single', 32, true, '{"if_any_slug":["obj-digestivo"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('488fc592-bcbd-5953-b4b0-fc88a3fa6d17', 'f1d381d3-3b18-5053-8c60-0cfc94e19112', 'Nunca he tomado nada', 'digestivo-sin-experiencia', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('806a1d32-a115-57d3-b531-2744c6dc81bb', 'f1d381d3-3b18-5053-8c60-0cfc94e19112', 'Tomo o he tomado probióticos', 'digestivo-probioticos', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9823d57a-f487-5765-a097-d1359a481cc7', 'f1d381d3-3b18-5053-8c60-0cfc94e19112', 'Tomo fibra', 'digestivo-fibra', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('8b643acd-c343-505c-a0b3-93e6a62e0918', 'f1d381d3-3b18-5053-8c60-0cfc94e19112', 'Probé algo y no me funcionó', 'digestivo-sin-resultado', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [nut1] ¿Qué sientes que te falta?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('33ec72f4-5140-505a-9c0e-294271f19e48', '55550011-0002-0000-0000-000000000001', '¿Qué sientes que te falta?', 'Puedes elegir varias.', 'multi', 40, true, '{"if_any_slug":["obj-nutricion"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('469affb6-fdcc-5d39-bda0-096f78ef9796', '33ec72f4-5140-505a-9c0e-294271f19e48', 'Energía, me canso rápido', 'nutricion-energia', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e47e976e-a66e-5619-85e9-4b37063e4c8d', '33ec72f4-5140-505a-9c0e-294271f19e48', 'Defensas, me enfermo seguido', 'nutricion-inmune', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('13be8da3-cb7a-5a76-9342-cde16691936c', '33ec72f4-5140-505a-9c0e-294271f19e48', 'Concentración y claridad mental', 'nutricion-concentracion', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('4256bfcd-62b8-53d6-bbbe-eb3cd90eee88', '33ec72f4-5140-505a-9c0e-294271f19e48', 'Piel, cabello y uñas fuertes', 'nutricion-belleza', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('fac47826-d179-51d4-945e-2153af80c08e', '33ec72f4-5140-505a-9c0e-294271f19e48', 'Huesos y articulaciones', 'nutricion-huesos', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('04ae5755-7203-5d2c-9ccc-bb107b5dde67', '33ec72f4-5140-505a-9c0e-294271f19e48', 'Ánimo estable', 'nutricion-animo', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ba14b0d1-bc69-5e91-b460-3457635a1962', '33ec72f4-5140-505a-9c0e-294271f19e48', 'No sé qué me falta, oriéntenme', 'nutricion-no-se', 7, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [nut2] ¿Cómo es tu alimentación?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('26b81555-b870-5845-bd52-8ff86f910dee', '55550011-0002-0000-0000-000000000001', '¿Cómo es tu alimentación?', NULL, 'single', 41, true, '{"if_any_slug":["obj-nutricion"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ed700bd3-783e-5af7-98a1-e6a25933f8d9', '26b81555-b870-5845-bd52-8ff86f910dee', 'Como de todo', 'dieta-omnivora', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ef5c2934-0c78-54e1-ae38-4627eeb84cd3', '26b81555-b870-5845-bd52-8ff86f910dee', 'Vegetariana', 'dieta-vegetariana', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('adeb016c-cd0a-5e6b-9da0-d232c2fe44f3', '26b81555-b870-5845-bd52-8ff86f910dee', 'Vegana', 'dieta-vegana', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ef806fa3-7701-5ddc-aede-5980d46af40b', '26b81555-b870-5845-bd52-8ff86f910dee', 'Como poca carne o lácteos', 'dieta-baja-animal', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('d34941e4-e1a0-5371-ada6-75940672af5f', '26b81555-b870-5845-bd52-8ff86f910dee', 'Irregular, como a deshoras', 'dieta-irregular', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [nut3] ¿Cuánto sol y aire libre te da al día?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('0a183d20-7bac-52b2-9b8f-c692a695e792', '55550011-0002-0000-0000-000000000001', '¿Cuánto sol y aire libre te da al día?', 'Nos dice si conviene reforzar la vitamina D.', 'single', 42, true, '{"if_any_slug":["obj-nutricion"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('eb893d91-3d92-5adf-9115-547320a1a094', '0a183d20-7bac-52b2-9b8f-c692a695e792', 'Casi nada, paso el día en interiores', 'sol-nada', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a99413cf-b29e-56fb-88cf-558f94ab9e8a', '0a183d20-7bac-52b2-9b8f-c692a695e792', 'Un rato, al ir y volver', 'sol-poco', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2f4a21b4-b4a8-50f5-ab86-0832d2f4c489', '0a183d20-7bac-52b2-9b8f-c692a695e792', 'Bastante, estoy fuera varias horas', 'sol-mucho', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [bie1] ¿Qué se parece más a lo que te pasa?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('a88ef0a9-9369-52d7-8162-fd5fa77d835d', '55550011-0002-0000-0000-000000000001', '¿Qué se parece más a lo que te pasa?', NULL, 'single', 50, true, '{"if_any_slug":["obj-bienestar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9346dabf-a74b-57be-b296-3c1844a1e32a', 'a88ef0a9-9369-52d7-8162-fd5fa77d835d', 'Me cuesta quedarme dormido/a', 'sueno-conciliar', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('f4d2c619-30eb-5d19-a75f-17e80fe2a782', 'a88ef0a9-9369-52d7-8162-fd5fa77d835d', 'Me despierto durante la noche', 'sueno-mantener', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0691d81c-781f-5439-af57-4c72ce1bfe07', 'a88ef0a9-9369-52d7-8162-fd5fa77d835d', 'Duermo, pero amanezco cansado/a', 'sueno-no-repara', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e536f940-b9dd-5a91-8532-98ddf5421cff', 'a88ef0a9-9369-52d7-8162-fd5fa77d835d', 'Mi mente no para durante el día', 'estres-mental', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('3bcbdbfd-3b2e-56d8-8a3c-695ccb3ec32c', 'a88ef0a9-9369-52d7-8162-fd5fa77d835d', 'Me falta energía todo el día', 'foco-energia', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0f34aa43-caad-582d-a46e-6e948a410a88', 'a88ef0a9-9369-52d7-8162-fd5fa77d835d', 'Paso muchas horas frente a pantallas', 'foco-pantallas', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [bie2] ¿Con qué frecuencia?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('52f01a7e-e827-5b8d-bd64-da79a7d093c3', '55550011-0002-0000-0000-000000000001', '¿Con qué frecuencia?', NULL, 'single', 51, true, '{"if_any_slug":["sueno-conciliar","sueno-mantener","sueno-no-repara","estres-mental"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('34b5c193-090e-5cbf-ab27-4b2d29a024b8', '52f01a7e-e827-5b8d-bd64-da79a7d093c3', 'Casi todos los días', 'frecuencia-diaria', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('d441c3ca-0e08-58a5-a068-8c20d3c3827a', '52f01a7e-e827-5b8d-bd64-da79a7d093c3', 'Varias veces a la semana', 'frecuencia-semanal', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('51b08337-3c5c-57eb-9266-bd30de9371ab', '52f01a7e-e827-5b8d-bd64-da79a7d093c3', 'Solo en épocas de carga', 'frecuencia-ocasional', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [bie3] ¿Cómo va tu café o tus energizantes?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('ceefe084-7038-5076-9ed2-0db7650997e3', '55550011-0002-0000-0000-000000000001', '¿Cómo va tu café o tus energizantes?', NULL, 'single', 52, true, '{"if_any_slug":["obj-bienestar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2009cd93-497b-54d2-bc2a-3f82b799d922', 'ceefe084-7038-5076-9ed2-0db7650997e3', 'No tomo', 'cafeina-nada', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('dac4584e-26e8-5b5b-a847-c0d2d62c9995', 'ceefe084-7038-5076-9ed2-0db7650997e3', 'Uno o dos, en la mañana', 'cafeina-manana', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c672ebc8-2093-5405-876d-aa4ac5ae3ae1', 'ceefe084-7038-5076-9ed2-0db7650997e3', 'Varios a lo largo del día', 'cafeina-varios', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('147bb637-b7f5-5d2a-b4bf-7b7957cfae58', 'ceefe084-7038-5076-9ed2-0db7650997e3', 'También en la tarde o noche', 'cafeina-tarde', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [bie4] Durante el día, ¿necesitas estar bien despierto/a?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('257c6eb3-075e-5957-a5c5-d060364740d4', '55550011-0002-0000-0000-000000000001', 'Durante el día, ¿necesitas estar bien despierto/a?', 'Para no recomendarte nada que te dé sueño cuando no toca.', 'single', 53, true, '{"if_any_slug":["obj-bienestar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a1c20857-a308-5892-a584-edf6d06f3e55', '257c6eb3-075e-5957-a5c5-d060364740d4', 'Sí, necesito estar alerta y concentrado/a', 'requiere-alerta', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('f994ba6d-c710-5a18-a326-968907dee752', '257c6eb3-075e-5957-a5c5-d060364740d4', 'No, puedo permitirme estar más relajado/a', 'sin-requerir-alerta', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [sol1] ¿Cómo reacciona tu piel al sol?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('248b5a0c-eac6-552b-82f8-dd60f6854a45', '55550011-0002-0000-0000-000000000001', '¿Cómo reacciona tu piel al sol?', 'Nos dice qué SPF necesitas de verdad.', 'single', 60, true, '{"if_any_slug":["obj-solar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('7fefa205-7deb-51e4-8c08-b1251f4a9683', '248b5a0c-eac6-552b-82f8-dd60f6854a45', 'Me quemo siempre, casi no bronceo', 'fototipo-muy-claro', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e05a82b8-33f3-54d2-99f2-17c7433c5763', '248b5a0c-eac6-552b-82f8-dd60f6854a45', 'Me quemo primero y luego bronceo', 'fototipo-claro', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9064ae81-565f-55ef-a361-927bf61e2448', '248b5a0c-eac6-552b-82f8-dd60f6854a45', 'Bronceo con facilidad, rara vez me quemo', 'fototipo-medio', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('11a0a1de-129a-5765-b4a4-b5bc8e7cca72', '248b5a0c-eac6-552b-82f8-dd60f6854a45', 'Casi nunca me quemo', 'fototipo-oscuro', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [sol2] ¿Para qué lo necesitas?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('444e9b5e-cb8f-52db-b46f-cb151863038a', '55550011-0002-0000-0000-000000000001', '¿Para qué lo necesitas?', NULL, 'single', 61, true, '{"if_any_slug":["obj-solar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('458a358a-a79a-5da2-bce9-3d0fcc6ec094', '444e9b5e-cb8f-52db-b46f-cb151863038a', 'Cara, todos los días en la ciudad', 'solar-diario', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('f11d50e8-b982-5d02-959e-5cda451f2544', '444e9b5e-cb8f-52db-b46f-cb151863038a', 'Cuerpo', 'solar-cuerpo', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('f377d582-478a-5b5b-a9b2-a9911fbfbda7', '444e9b5e-cb8f-52db-b46f-cb151863038a', 'Playa, piscina o deporte en el agua', 'solar-playa', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('18167c7e-61f0-545d-ba27-abd75f123e16', '444e9b5e-cb8f-52db-b46f-cb151863038a', 'Montaña, running u outdoor intenso', 'solar-outdoor', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('cf0f24b6-d31c-56d4-b642-a7027e18e159', '444e9b5e-cb8f-52db-b46f-cb151863038a', 'Todo lo anterior', 'solar-completo', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [sol3] ¿Algo importante sobre cómo se siente en la piel?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('97d47f7a-817a-5a19-9648-36d2e42c992f', '55550011-0002-0000-0000-000000000001', '¿Algo importante sobre cómo se siente en la piel?', 'Puedes elegir varias.', 'multi', 62, true, '{"if_any_slug":["obj-solar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0e1ddf97-ba3a-5a7f-a7a6-87104c4d64ae', '97d47f7a-817a-5a19-9648-36d2e42c992f', 'Lo uso debajo del maquillaje', 'solar-bajo-maquillaje', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('155cf63e-5c8e-597b-9c54-0a3e700fc39b', '97d47f7a-817a-5a19-9648-36d2e42c992f', 'No quiero que me deje la cara blanca', 'solar-sin-blanco', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9ff6fa2f-1499-5c17-96ff-76acb45402a9', '97d47f7a-817a-5a19-9648-36d2e42c992f', 'Mi piel es grasa, busco algo ligero', 'solar-ligero', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('97a44365-67df-5fe4-a65b-860324f2025d', '97d47f7a-817a-5a19-9648-36d2e42c992f', 'Necesito que resista agua y sudor', 'solar-resistente', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('901ef816-079d-5c53-adcd-3777e7c94f18', '97d47f7a-817a-5a19-9648-36d2e42c992f', 'Me da igual, que proteja bien', 'solar-indiferente', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [sol4] ¿En qué momento estás?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('ab9e97c7-3dec-5afe-920c-5aaca85f1cfc', '55550011-0002-0000-0000-000000000001', '¿En qué momento estás?', NULL, 'single', 63, true, '{"if_any_slug":["obj-solar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('660aa96f-871a-51cb-9ca4-b1a3166da4a7', 'ab9e97c7-3dec-5afe-920c-5aaca85f1cfc', 'Quiero prevenir, para el uso diario', 'solar-prevenir', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('240f44eb-2c51-5c07-b2e0-5a57bdb17e0d', 'ab9e97c7-3dec-5afe-920c-5aaca85f1cfc', 'Estoy expuesto/a ahora (verano, viaje, playa)', 'solar-expuesto', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a5b066de-d427-5198-af03-2c40b877f22f', 'ab9e97c7-3dec-5afe-920c-5aaca85f1cfc', 'Vengo de una quemadura o exposición fuerte', 'solar-post', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [gym1] ¿Qué buscas principalmente?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('1e69e460-3c4c-55bc-83ba-7040a8718456', '55550011-0002-0000-0000-000000000001', '¿Qué buscas principalmente?', NULL, 'single', 70, true, '{"if_any_slug":["obj-rendimiento"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('771877c6-3b97-5457-976a-d41f10d35386', '1e69e460-3c4c-55bc-83ba-7040a8718456', 'Ganar fuerza o masa muscular', 'gym-fuerza', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('054509d7-0bdb-5c8f-9137-74cdff239ee4', '1e69e460-3c4c-55bc-83ba-7040a8718456', 'Recuperarme mejor', 'gym-recuperacion', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('733a7c92-44bd-5617-91e7-1f3f650b2a23', '1e69e460-3c4c-55bc-83ba-7040a8718456', 'Tener más energía para entrenar', 'gym-energia', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('fc64adb5-5ddd-508b-9c6e-273a86f15119', '1e69e460-3c4c-55bc-83ba-7040a8718456', 'Mejorar mi resistencia', 'gym-resistencia', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('4161e692-746a-57bb-b6cb-291b5454f8b9', '1e69e460-3c4c-55bc-83ba-7040a8718456', 'Cuidar mis articulaciones', 'gym-articulaciones', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('acbc4161-d9d2-5549-8c12-10c7ce4b6933', '1e69e460-3c4c-55bc-83ba-7040a8718456', 'Hidratarme mejor', 'gym-hidratacion', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [gym2] ¿Cómo y cuánto entrenas?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('6da1daaf-6611-5953-9dda-fa3eba96258a', '55550011-0002-0000-0000-000000000001', '¿Cómo y cuánto entrenas?', NULL, 'single', 71, true, '{"if_any_slug":["obj-rendimiento"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c7e0f76d-c508-5fbc-a169-cac9b51f47fa', '6da1daaf-6611-5953-9dda-fa3eba96258a', 'Fuerza, 4 o más veces por semana', 'gym-fuerza-alto', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('7b7aa292-b666-55d3-97a5-82db678f259f', '6da1daaf-6611-5953-9dda-fa3eba96258a', 'Fuerza, 2 o 3 veces por semana', 'gym-fuerza-medio', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2a25bd90-505a-5d1e-9387-5b4636225cf7', '6da1daaf-6611-5953-9dda-fa3eba96258a', 'Cardio o resistencia (running, ciclismo, natación)', 'gym-cardio', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('91d8829d-a03f-5fa8-ae07-85d705594ab4', '6da1daaf-6611-5953-9dda-fa3eba96258a', 'HIIT o funcional', 'tipo-hiit', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('03c85e27-a88c-5d9c-8074-28d66375238c', '6da1daaf-6611-5953-9dda-fa3eba96258a', 'Yoga, pilates o movilidad', 'tipo-yoga', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('d7896a5e-6e79-5c35-ab3b-4e60bbef84e1', '6da1daaf-6611-5953-9dda-fa3eba96258a', 'Recién estoy empezando', 'nivel-principiante', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [gym3] ¿Qué tomas hoy?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('167f8b9d-225d-5958-bd7a-1591256450b4', '55550011-0002-0000-0000-000000000001', '¿Qué tomas hoy?', 'Para no recomendarte lo que ya tienes.', 'single', 72, true, '{"if_any_slug":["obj-rendimiento"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('cfae4871-26a3-5966-bc8a-ceb11e93849e', '167f8b9d-225d-5958-bd7a-1591256450b4', 'Nada todavía', 'gym-sin-suplementos', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0c4e9ed8-7881-5989-acd0-53d0c3f94264', '167f8b9d-225d-5958-bd7a-1591256450b4', 'Proteína', 'gym-toma-proteina', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('fe39a755-9b8d-548b-94cc-7bb42ad40723', '167f8b9d-225d-5958-bd7a-1591256450b4', 'Proteína y creatina', 'gym-toma-varios', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a7668c29-1e85-5f7f-b69b-3b9a0a20a6d7', '167f8b9d-225d-5958-bd7a-1591256450b4', 'Probé varios y no sé cuáles valen la pena', 'gym-confundido', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [gym4] ¿Qué se te hace más cuesta arriba?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('58355587-6559-5b14-9d89-d2a883e2ad6c', '55550011-0002-0000-0000-000000000001', '¿Qué se te hace más cuesta arriba?', NULL, 'single', 73, true, '{"if_any_slug":["obj-rendimiento"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ee34fd5c-a3ef-5494-a5c4-03af5de2ca3d', '58355587-6559-5b14-9d89-d2a883e2ad6c', 'Arrancar el entrenamiento con energía', 'gym-friccion-energia', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('882b9a52-869b-5015-9c45-f85e3f3eb21b', '58355587-6559-5b14-9d89-d2a883e2ad6c', 'El día siguiente: quedo adolorido/a', 'gym-friccion-dolor', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a7b47cae-c369-5de5-ba8e-6a450fb5e1ae', '58355587-6559-5b14-9d89-d2a883e2ad6c', 'Me deshidrato o me dan calambres', 'gym-friccion-hidratacion', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('34b41428-6afd-5f39-bd6c-02ad101a727d', '58355587-6559-5b14-9d89-d2a883e2ad6c', 'Las articulaciones me molestan', 'dolor-frecuente', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('8c805dea-2c68-598c-b13d-a45b1edab9a9', '58355587-6559-5b14-9d89-d2a883e2ad6c', 'Nada en particular', 'gym-sin-friccion', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [pie1] ¿Qué quieres resolver?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', '55550011-0002-0000-0000-000000000001', '¿Qué quieres resolver?', 'Puedes elegir varias.', 'multi', 80, true, '{"if_any_slug":["obj-pies-cuerpo"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('8f91cb45-891d-5896-ae6a-aaf48674a2fe', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Durezas o callos', 'pies-durezas', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('708ff167-0678-50a2-a19e-928f12527388', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Talones agrietados', 'pies-talones', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c52eefac-3821-5ef3-be1f-affb0d3f0431', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Pies muy secos', 'pies-secos', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('91926375-a015-5780-af7a-d57d993fbb97', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Pies cansados o hinchados', 'pies-cansados', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('c1885f0c-d540-549a-b1ed-58d4716a0357', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Mal olor', 'pies-olor', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e79a47b9-aef6-532a-8160-3056fcc1b26f', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Rozaduras o ampollas', 'cuerpo-rozaduras', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a28bbe73-f4d9-5a17-8e6f-560c05c45b31', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Piel del cuerpo seca', 'cuerpo-seco', 7, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9fb5db61-f07f-5d3b-a850-452ad54aa366', 'dd6b585d-35dd-55bb-ab3e-a2e6291f80d8', 'Recuperación muscular', 'cuerpo-muscular', 8, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [pie2] ¿Cuántas horas pasas de pie al día?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('445f72c4-eb88-5f22-830b-a3edb752572a', '55550011-0002-0000-0000-000000000001', '¿Cuántas horas pasas de pie al día?', NULL, 'single', 81, true, '{"if_any_slug":["obj-pies-cuerpo"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('11c02f41-fffa-5f2d-97ab-12d46ad5131e', '445f72c4-eb88-5f22-830b-a3edb752572a', 'Menos de 2', 'pies-poco-tiempo', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('6c5d45f2-8952-5aa4-aaf0-31d417ce45a1', '445f72c4-eb88-5f22-830b-a3edb752572a', 'Entre 2 y 6', 'pies-medio-tiempo', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('bda47e25-a4c5-51d9-b7a5-8958358be80c', '445f72c4-eb88-5f22-830b-a3edb752572a', 'Más de 6', 'pies-mucho-tiempo', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [pie3] ¿Qué necesitas ahora?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('7b0f4fda-9a4f-5441-b8c6-30efac58b5db', '55550011-0002-0000-0000-000000000001', '¿Qué necesitas ahora?', NULL, 'single', 82, true, '{"if_any_slug":["obj-pies-cuerpo"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('72f4f3bc-df4b-5ba2-a604-969038ab0d3e', '7b0f4fda-9a4f-5441-b8c6-30efac58b5db', 'Un tratamiento intensivo, está bastante marcado', 'pies-intensivo', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ce7e712a-41ba-5fd8-aea0-92a823d21300', '7b0f4fda-9a4f-5441-b8c6-30efac58b5db', 'Mantenimiento, que no empeore', 'pies-mantenimiento', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('73d96062-d4f7-5839-9bd5-5fa75d8a84c9', '7b0f4fda-9a4f-5441-b8c6-30efac58b5db', 'Una rutina completa de cuidado en casa', 'pies-rutina-completa', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [hog1] ¿Quiénes viven en casa?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('f45a658b-f095-5318-96e2-a4d42d47c767', '55550011-0002-0000-0000-000000000001', '¿Quiénes viven en casa?', 'Importa para elegir productos seguros para todos.', 'multi', 90, true, '{"if_any_slug":["obj-hogar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('824d4371-5a32-52f5-b162-bb0d01c64197', 'f45a658b-f095-5318-96e2-a4d42d47c767', 'Solo adultos', 'hogar-adultos', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('a202627e-6eb6-559c-8e29-191e5cf6be71', 'f45a658b-f095-5318-96e2-a4d42d47c767', 'Niños pequeños', 'hogar-ninos', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b2517782-f74e-5089-a4ad-2d04ef865ac5', 'f45a658b-f095-5318-96e2-a4d42d47c767', 'Adolescentes', 'hogar-adolescentes', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('cd07fd7d-56bf-57ff-aae8-582be834e9ac', 'f45a658b-f095-5318-96e2-a4d42d47c767', 'Adultos mayores', 'hogar-mayores', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('33b2a18a-04c8-5e83-b838-02e45be0bcfc', 'f45a658b-f095-5318-96e2-a4d42d47c767', 'Alguien embarazada o dando de lactar', 'hogar-embarazo', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [hog2] ¿Dónde va a estar?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('40e53de8-f913-5a37-8ca3-c16cd264ad50', '55550011-0002-0000-0000-000000000001', '¿Dónde va a estar?', NULL, 'single', 91, true, '{"if_any_slug":["obj-hogar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('6f2ba618-e7c6-561b-9681-b4ee90635ea5', '40e53de8-f913-5a37-8ca3-c16cd264ad50', 'En casa', 'hogar-familiar', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('7bc0b886-fb79-5528-b414-5ce4fdd3b574', '40e53de8-f913-5a37-8ca3-c16cd264ad50', 'En el auto', 'hogar-auto', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('93d839a2-68fa-5a07-aac3-4fafc8dc0da2', '40e53de8-f913-5a37-8ca3-c16cd264ad50', 'En la oficina o la mochila', 'hogar-movil', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('8d9b5567-bf14-5ceb-85a1-2d48cf4291bc', '40e53de8-f913-5a37-8ca3-c16cd264ad50', 'Uno compacto para llevar a todos lados', 'hogar-compacto', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [hog3] ¿Qué sueles necesitar?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('f7704da5-75ba-5b3c-9c4b-090c33770645', '55550011-0002-0000-0000-000000000001', '¿Qué sueles necesitar?', 'Puedes elegir varias.', 'multi', 92, true, '{"if_any_slug":["obj-hogar"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e657abbb-5814-5168-877b-6a0e65c393d3', 'f7704da5-75ba-5b3c-9c4b-090c33770645', 'Curaciones: cortes, raspones, ampollas', 'hogar-curaciones', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('1de53683-175e-55a5-b3e9-e2a011ef128b', 'f7704da5-75ba-5b3c-9c4b-090c33770645', 'Dolor de cabeza o fiebre', 'hogar-dolor', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('44ed5bcc-40ed-5a9b-b105-bec97886c922', 'f7704da5-75ba-5b3c-9c4b-090c33770645', 'Golpes, esguinces o dolor muscular', 'hogar-golpes', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2e746b06-c602-5cfc-a15d-11b915f2e2f4', 'f7704da5-75ba-5b3c-9c4b-090c33770645', 'Quemaduras leves o picaduras', 'hogar-quemaduras', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('1e4fb5ad-e290-5399-9dd9-ea72b57d3592', 'f7704da5-75ba-5b3c-9c4b-090c33770645', 'Malestar estomacal', 'hogar-estomago', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9a1478aa-3bb8-5956-ae7d-16f7dadc5b27', 'f7704da5-75ba-5b3c-9c4b-090c33770645', 'Lo básico, por si acaso', 'hogar-basico', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [via1] ¿A dónde vas?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('60e82c0e-01f4-5efc-a666-6e7efd1d2a1c', '55550011-0002-0000-0000-000000000001', '¿A dónde vas?', NULL, 'single', 100, true, '{"if_any_slug":["obj-viaje"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('bc74eae8-10b3-5aba-a410-65163218fff3', '60e82c0e-01f4-5efc-a666-6e7efd1d2a1c', 'Playa o destino tropical', 'viaje-playa', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('cc182982-2541-5583-a893-f090f9b185df', '60e82c0e-01f4-5efc-a666-6e7efd1d2a1c', 'Ciudad, trabajo o negocios', 'viaje-ciudad', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e5a50e25-4e88-5255-a58b-7187b9233124', '60e82c0e-01f4-5efc-a666-6e7efd1d2a1c', 'Montaña, senderismo o aventura', 'viaje-aventura', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('1352dc0f-c68f-5da6-ad2a-50445346e959', '60e82c0e-01f4-5efc-a666-6e7efd1d2a1c', 'Varios destinos o vuelo largo', 'viaje-largo', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [via2] ¿Cuánto tiempo?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('9567a4b5-f9c8-5dee-8f0b-a4521c82f563', '55550011-0002-0000-0000-000000000001', '¿Cuánto tiempo?', NULL, 'single', 101, true, '{"if_any_slug":["obj-viaje"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e0ac1229-0f81-5ada-91ae-fc49f9db0dfd', '9567a4b5-f9c8-5dee-8f0b-a4521c82f563', 'Un fin de semana', 'viaje-corto', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('db17c169-a7f2-5375-8e5a-a55f3b9f125e', '9567a4b5-f9c8-5dee-8f0b-a4521c82f563', 'Una o dos semanas', 'viaje-medio', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('83b0298c-e43d-5300-8c10-e12e0b9e6833', '9567a4b5-f9c8-5dee-8f0b-a4521c82f563', 'Más de dos semanas', 'viaje-largo-estadia', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [via3] ¿Qué te preocupa del viaje?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('3256c475-5ac3-5a67-b348-ac20807eb164', '55550011-0002-0000-0000-000000000001', '¿Qué te preocupa del viaje?', 'Puedes elegir varias.', 'multi', 102, true, '{"if_any_slug":["obj-viaje"]}'::jsonb, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('3fe3234f-9646-5298-be00-8f5100b22d40', '3256c475-5ac3-5a67-b348-ac20807eb164', 'El sol', 'viaje-preocupa-sol', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('5632e5e7-428f-536b-817d-3a7c84b9dac6', '3256c475-5ac3-5a67-b348-ac20807eb164', 'Que me caiga mal la comida', 'viaje-preocupa-digestivo', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('43916864-9239-53fb-986c-5746ba608285', '3256c475-5ac3-5a67-b348-ac20807eb164', 'Dormir bien o el cambio de horario', 'viaje-preocupa-sueno', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('bff7ac1b-1445-5974-86f0-938522f603a1', '3256c475-5ac3-5a67-b348-ac20807eb164', 'Cortes, ampollas o picaduras', 'viaje-preocupa-botiquin', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('784386fb-f0bf-597a-8f33-2e48efa3d790', '3256c475-5ac3-5a67-b348-ac20807eb164', 'Mantener mi rutina de piel', 'viaje-preocupa-piel', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [texto] Cuéntanos con tus palabras
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('e076e1dd-c856-5c00-a0e8-c21c8d0b16b5', '55550011-0002-0000-0000-000000000001', 'Cuéntanos con tus palabras', 'Cómo te sientes, qué has probado, qué te gustaría mejorar. Opcional, pero es lo que más nos ayuda a acertar.', 'text', 110, false, NULL, NULL, 500)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;

-- [seg1] ¿Hay algo de tu salud que debamos considerar?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('4e34cc1b-87b1-5ba4-9db1-476f72e344a3', '55550011-0003-0000-0000-000000000001', '¿Hay algo de tu salud que debamos considerar?', 'Tu seguridad es lo primero. Marca todo lo que aplique.', 'multi', 1, true, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('11953e69-ea82-5e02-834a-9e21a4a6130f', '4e34cc1b-87b1-5ba4-9db1-476f72e344a3', 'Nada de lo siguiente', 'sin-condicion', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('bde7ffe3-cc9b-5437-80b6-07229aa45a24', '4e34cc1b-87b1-5ba4-9db1-476f72e344a3', 'Estoy embarazada o dando de lactar', 'cond-embarazo', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('179b2c73-e7af-5b77-a046-6d8a46d8cb42', '4e34cc1b-87b1-5ba4-9db1-476f72e344a3', 'Tomo medicamentos con receta', 'cond-medicamentos', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('4ef152a9-375c-5a28-8291-9b083fcb4f25', '4e34cc1b-87b1-5ba4-9db1-476f72e344a3', 'Tengo una condición médica diagnosticada', 'cond-medica', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('d0824ce9-2b6f-5480-8815-2d3638be4f38', '4e34cc1b-87b1-5ba4-9db1-476f72e344a3', 'He tenido reacciones fuertes a productos', 'cond-reacciones', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e749cca9-9b70-540b-b0e1-508c07e7ec77', '4e34cc1b-87b1-5ba4-9db1-476f72e344a3', 'Tengo síntomas intensos o que no se van', 'cond-sintomas', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [seg2] ¿Alguna restricción o preferencia?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('39cae396-a27f-5cfc-ac2b-e6ba4f299845', '55550011-0003-0000-0000-000000000001', '¿Alguna restricción o preferencia?', NULL, 'multi', 2, true, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e478f368-0685-5c44-a4ae-1e86ee9bd95c', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Ninguna', 'sin-restriccion', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('ce061be2-d7dd-5ecd-a89a-33a27cf16e24', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Intolerancia a la lactosa', 'alerg-lactosa', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b77547df-cfb7-5d51-b3ee-d7ab2e381a81', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Sin gluten / celiaquía', 'alerg-gluten', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('abe3ddfe-be51-5f23-b143-fe095f9569fb', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Alergia a la soya', 'alerg-soya', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('1ccfdb20-a5b7-5c27-91d0-8d96a64dc53a', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Alergia a frutos secos', 'alerg-frutos-secos', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('36dfb1a6-977b-5028-9d29-2bb6d9b533e3', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Vegano/a', 'pref-vegano', 6, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b099a57b-c7ab-5c70-9a77-461e83867833', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Sin azúcar', 'alerg-azucar', 7, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('79b09c0e-e87c-5f2f-a237-375ed7cb82ca', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Sin cafeína', 'alerg-cafeina', 8, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('b5c893ec-e2f7-56ce-8cfa-beedbd25bd29', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Sin fragancia', 'pref-sin-fragancia', 9, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('4e93ee1c-d9af-56b5-a29d-0013ab626c68', '39cae396-a27f-5cfc-ac2b-e6ba4f299845', 'Prefiero productos naturales u orgánicos', 'pref-organico', 10, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [edad] ¿En qué rango de edad estás?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('b3a22b74-15ce-5db2-8f2d-867415f303ad', '55550011-0003-0000-0000-000000000001', '¿En qué rango de edad estás?', NULL, 'single', 3, false, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('be4f0b63-a575-5704-87c0-0933038af1f1', 'b3a22b74-15ce-5db2-8f2d-867415f303ad', '18 a 24', 'edad-18-24', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('062f2562-da5f-55d9-8ae2-f478389ba113', 'b3a22b74-15ce-5db2-8f2d-867415f303ad', '25 a 34', 'edad-25-34', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('8bdf4ca3-8404-5b18-8d28-4b938554fc60', 'b3a22b74-15ce-5db2-8f2d-867415f303ad', '35 a 44', 'edad-35-44', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('2f697434-96e9-5a3f-a16d-dfe3b22e266a', 'b3a22b74-15ce-5db2-8f2d-867415f303ad', '45 a 54', 'edad-45-54', 4, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('e0e2cac9-3ba0-558d-b522-6738ed625a51', 'b3a22b74-15ce-5db2-8f2d-867415f303ad', '55 o más', 'edad-55-mas', 5, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- [sexo] ¿Con cuál te identificas?
INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)
VALUES ('bfb3c11a-65df-5aba-913c-cd084988fc9d', '55550011-0003-0000-0000-000000000001', '¿Con cuál te identificas?', 'Algunas necesidades nutricionales cambian.', 'single', 4, false, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,
  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,
  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('9b8fed43-d5f4-570b-ae3d-c48c18e3034d', 'bfb3c11a-65df-5aba-913c-cd084988fc9d', 'Mujer', 'sexo-mujer', 1, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('36607b3f-1069-5723-903a-76f96b2caaf3', 'bfb3c11a-65df-5aba-913c-cd084988fc9d', 'Hombre', 'sexo-hombre', 2, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;
INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)
VALUES ('0943552c-94d2-5589-9caa-f511ca44b728', 'bfb3c11a-65df-5aba-913c-cd084988fc9d', 'Prefiero no decirlo', 'sexo-no-decir', 3, '{}', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;

-- ── Preguntas que se mantienen ───────────────────────────────────────
-- Solo cambia su posición para dejar sitio a las nuevas. Cambiar sort_order
-- no afecta a los perfiles guardados: el motor resuelve por id, no por orden.
UPDATE public.quiz_questions SET sort_order = 5 WHERE id = '55550012-0003-0004-0000-000000000001';  -- ¿Cómo quieres armar tu kit?

-- ── Etiquetas colgadas ───────────────────────────────────────────────
-- Los tag_ids de las opciones apuntan a filas de tags borradas en junio por
-- 20260612172750_restructure_tags_8_groups.sql, que hizo DELETE + reinsert con
-- ids nuevos. quiz_profiles.applied_tags viene guardando UUIDs muertos desde
-- entonces. No se reconecta: el motor no debe amarrarse a productos concretos
-- porque el catálogo cambia. Las etiquetas llegan a la IA como texto del
-- producto, nunca como filtro.
UPDATE public.quiz_question_options SET tag_ids = '{}'
WHERE tag_ids <> '{}'
  AND NOT EXISTS (SELECT 1 FROM public.tags t WHERE t.id = ANY(quiz_question_options.tag_ids));

COMMIT;
