-- Quiz: presupuesto por intención (sin precios visibles) + fusión de
-- restricciones dentro de la pregunta de seguridad.
--
-- 1. Las anclas de precio ("Hasta S/200") capan el ticket y crean una promesa
--    que el motor puede romper (kit real: S/230 con tope elegido de S/200).
--    Los slugs presupuesto-* NO cambian: el motor los sigue mapeando a rangos
--    internos (BUDGET_RANGES en api/kit/recommend), pero el cliente ya no ve
--    montos — elige intención.
-- 2. "¿Tienes alguna restricción?" y "Antes de recomendarte, ¿hay algo que
--    debamos considerar?" se sentían repetidas. Se fusionan en una sola multi.
--    Las opciones de la pregunta vieja NO se mueven ni borran: los perfiles
--    históricos referencian sus IDs y el motor las resuelve por ID al releer
--    respuestas. Se crean opciones NUEVAS con los mismos slugs (ALLERGY_LABELS
--    y SAFETY_FLAG_TEXTS siguen funcionando sin tocar código) y la pregunta
--    vieja se oculta con una condición que ningún slug puede cumplir.
-- 3. Se retira "Orgánico / natural" (pref-organico) de las opciones visibles:
--    duplicaba la pregunta dedicada "¿Qué tan importante es que sean
--    productos naturales u orgánicos?".

-- ── 1 ▸ Presupuesto → intención, sin montos ─────────────────────────────
UPDATE public.quiz_questions
SET text = '¿Cómo quieres armar tu kit?',
    subtext = 'Nos adaptamos a ti: elige el nivel de tu ritual.'
WHERE id = '55550012-0003-0004-0000-000000000001';

UPDATE public.quiz_question_options SET text = 'Lo esencial — solo lo que necesito'
WHERE slug = 'presupuesto-bajo' AND question_id = '55550012-0003-0004-0000-000000000001';

UPDATE public.quiz_question_options SET text = 'Un ritual equilibrado'
WHERE slug = 'presupuesto-medio' AND question_id = '55550012-0003-0004-0000-000000000001';

UPDATE public.quiz_question_options SET text = 'Una rutina completa'
WHERE slug = 'presupuesto-alto' AND question_id = '55550012-0003-0004-0000-000000000001';

UPDATE public.quiz_question_options SET text = 'La experiencia LIORA — lo mejor de lo mejor'
WHERE slug = 'presupuesto-premium' AND question_id = '55550012-0003-0004-0000-000000000001';

-- ── 2 ▸ Pregunta fusionada de seguridad + restricciones ────────────────
UPDATE public.quiz_questions
SET text = 'Antes de recomendarte, ¿hay algo que debamos saber?',
    subtext = 'Marca todo lo que aplique — tu seguridad es lo primero.'
WHERE id = '55550012-0003-0005-0000-000000000001';

-- Restricciones primero (más comunes, menos alarmantes), salud después.
UPDATE public.quiz_question_options SET sort_order = 9
WHERE question_id = '55550012-0003-0005-0000-000000000001' AND slug = 'cond-embarazo';
UPDATE public.quiz_question_options SET sort_order = 10
WHERE question_id = '55550012-0003-0005-0000-000000000001' AND slug = 'cond-medicamentos';
UPDATE public.quiz_question_options SET sort_order = 11
WHERE question_id = '55550012-0003-0005-0000-000000000001' AND slug = 'cond-medica';
UPDATE public.quiz_question_options SET sort_order = 12
WHERE question_id = '55550012-0003-0005-0000-000000000001' AND slug = 'cond-reacciones';
UPDATE public.quiz_question_options SET sort_order = 13
WHERE question_id = '55550012-0003-0005-0000-000000000001' AND slug = 'cond-sintomas';

INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids)
VALUES
  ('55550013-0005-0002-0000-000000000001', '55550012-0003-0005-0000-000000000001', 'Intolerancia a la lactosa', 'alerg-lactosa',      2, '{}'),
  ('55550013-0005-0003-0000-000000000001', '55550012-0003-0005-0000-000000000001', 'Celiaquía / sin gluten',   'alerg-gluten',       3, '{}'),
  ('55550013-0005-0004-0000-000000000001', '55550012-0003-0005-0000-000000000001', 'Alergia a la soya',        'alerg-soya',         4, '{}'),
  ('55550013-0005-0005-0000-000000000001', '55550012-0003-0005-0000-000000000001', 'Sin azúcar',               'alerg-azucar',       5, '{}'),
  ('55550013-0005-0006-0000-000000000001', '55550012-0003-0005-0000-000000000001', 'Sin cafeína',              'alerg-cafeina',      6, '{}'),
  ('55550013-0005-0007-0000-000000000001', '55550012-0003-0005-0000-000000000001', 'Vegano/a',                 'pref-vegano',        7, '{}'),
  ('55550013-0005-0008-0000-000000000001', '55550012-0003-0005-0000-000000000001', 'Sin fragancias',           'pref-sin-fragancia', 8, '{}')
ON CONFLICT (id) DO NOTHING;

-- ── 3 ▸ Ocultar la pregunta vieja de restricciones ─────────────────────
-- Sigue existiendo (perfiles históricos la referencian) pero el quiz nunca
-- la muestra: la condición exige un slug que ninguna opción produce.
UPDATE public.quiz_questions
SET conditions = '{"if_any_slug": ["retirada-fusionada-en-seguridad"]}'::jsonb
WHERE id = '55550012-0003-0001-0000-000000000001';;
