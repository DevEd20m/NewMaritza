
-- ══════════════════════════════════════════════════════════════
-- PARTE 1: Sección 1 (Q1) + Sección 2 (preguntas nuevas y edits)
-- ══════════════════════════════════════════════════════════════

-- ── Actualizar texto de la pregunta Q1 ────────────────────────
UPDATE quiz_questions
SET text    = '¿Qué quieres cuidar hoy?',
    subtext = 'Elige la opción que más se parece a lo que necesitas ahora.'
WHERE id = '55550012-0001-0001-0000-000000000001';

-- ── Actualizar opciones existentes (texto + sort_order) ───────
UPDATE quiz_question_options
SET text = 'Mi piel, rostro o cabello', sort_order = 1
WHERE slug = 'obj-belleza' AND question_id = '55550012-0001-0001-0000-000000000001';

UPDATE quiz_question_options
SET text = 'Mi descanso, calma o energía diaria', sort_order = 3
WHERE slug = 'obj-bienestar' AND question_id = '55550012-0001-0001-0000-000000000001';

UPDATE quiz_question_options
SET text = 'Mi rendimiento físico, gym o recuperación', sort_order = 4
WHERE slug = 'obj-rendimiento' AND question_id = '55550012-0001-0001-0000-000000000001';

UPDATE quiz_question_options
SET text = 'Mi digestión o hidratación', sort_order = 5
WHERE slug = 'obj-digestivo' AND question_id = '55550012-0001-0001-0000-000000000001';

UPDATE quiz_question_options
SET sort_order = 9
WHERE slug = 'obj-nutricion' AND question_id = '55550012-0001-0001-0000-000000000001';

-- ── Insertar las 5 opciones nuevas en Q1 ──────────────────────
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0001-0001-0000-000000000001', 'Mi protección solar o exposición al sol',      'obj-solar',       2),
  ('55550012-0001-0001-0000-000000000001', 'Un viaje, playa u outdoor',                    'obj-viaje',       6),
  ('55550012-0001-0001-0000-000000000001', 'Mi hogar, familia o primeros auxilios',         'obj-hogar',       7),
  ('55550012-0001-0001-0000-000000000001', 'Mis pies o cuidado corporal',                   'obj-pies-cuerpo', 8),
  ('55550012-0001-0001-0000-000000000001', 'No estoy seguro/a, quiero que LIORA me guíe',  'obj-guia',        10);

-- ══════════════════════════════════════════════════════════════
-- SECCIÓN 2 — Edits a preguntas existentes
-- ══════════════════════════════════════════════════════════════

-- Q7: "caída excesiva" → "caída o debilitamiento"
UPDATE quiz_question_options
SET text = 'Caída o debilitamiento del cabello'
WHERE slug = 'cabello-caida' AND question_id = '55550012-0002-0007-0000-000000000001';

-- Q8: "estrés y ansiedad" → lenguaje más responsable
UPDATE quiz_question_options
SET text = 'Me cuesta relajarme o siento mucha carga mental'
WHERE slug = 'foco-estres' AND question_id = '55550012-0002-0008-0000-000000000001';

-- Q8: agregar opción "pantallas"
INSERT INTO quiz_question_options (question_id, text, slug, sort_order)
VALUES ('55550012-0002-0008-0000-000000000001', 'Paso muchas horas frente a pantallas', 'foco-pantallas', 5);

-- Q10: eliminar "limpiarme por dentro"
UPDATE quiz_question_options
SET text = 'Quiero una rutina digestiva más ligera'
WHERE slug = 'digestivo-reset' AND question_id = '55550012-0002-0010-0000-000000000001';

-- Q12: hacer universal (actualmente solo para nutricion/bienestar)
UPDATE quiz_questions
SET conditions = NULL
WHERE id = '55550012-0002-0012-0000-000000000001';

-- ══════════════════════════════════════════════════════════════
-- SECCIÓN 2 — DELETE Q13 y Q14 (las universales que interrumpían)
-- ══════════════════════════════════════════════════════════════
DELETE FROM quiz_question_options WHERE question_id = '55550012-0002-0013-0000-000000000001';
DELETE FROM quiz_question_options WHERE question_id = '55550012-0002-0014-0000-000000000001';
DELETE FROM quiz_questions WHERE id = '55550012-0002-0013-0000-000000000001';
DELETE FROM quiz_questions WHERE id = '55550012-0002-0014-0000-000000000001';

-- ══════════════════════════════════════════════════════════════
-- SECCIÓN 2 — INSERT nuevas preguntas de rama
-- ══════════════════════════════════════════════════════════════

-- Rama: Rendimiento (pregunta adicional "¿Qué buscas?")
-- Re-numerar Q4 actual (belleza) para hacer espacio: shift Q4→Q5... etc.
-- En vez de renumerar, usamos sort_order=3.5 con float — o simplemente sort_order entre Q3 y Q4
-- Usamos sort_order=4 para la nueva pregunta y dejamos que el admin la reordene visualmente si desea
-- (no hay unique constraint en sort_order)
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0002-0017-0000-000000000001',
  '55550011-0002-0000-0000-000000000001',
  '¿Qué buscas principalmente con tu entrenamiento?',
  NULL,
  'single',
  4,
  '{"if_any_slug": ["obj-rendimiento"]}'::jsonb
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0002-0017-0000-000000000001', 'Ganar fuerza o masa muscular',              'gym-fuerza',         1),
  ('55550012-0002-0017-0000-000000000001', 'Mejorar energía para entrenar',             'gym-energia',        2),
  ('55550012-0002-0017-0000-000000000001', 'Recuperarme mejor después de entrenar',     'gym-recuperacion',   3),
  ('55550012-0002-0017-0000-000000000001', 'Cuidar mis articulaciones',                 'gym-articulaciones', 4),
  ('55550012-0002-0017-0000-000000000001', 'Hidratarme mejor',                          'gym-hidratacion',    5);

-- Rama: Solar
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0002-0013-0000-000000000001',
  '55550011-0002-0000-0000-000000000001',
  '¿Cómo es tu exposición al sol normalmente?',
  NULL,
  'single',
  13,
  '{"if_any_slug": ["obj-solar"]}'::jsonb
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0002-0013-0000-000000000001', 'Uso diario en ciudad, trabajo o exterior',             'solar-diario',   1),
  ('55550012-0002-0013-0000-000000000001', 'Playa, piscina o deportes acuáticos',                  'solar-playa',    2),
  ('55550012-0002-0013-0000-000000000001', 'Montaña, running o deporte outdoor intenso',            'solar-outdoor',  3),
  ('55550012-0002-0013-0000-000000000001', 'Todo lo anterior, quiero protección completa',          'solar-completo', 4);

-- Rama: Viaje
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0002-0014-0000-000000000001',
  '55550011-0002-0000-0000-000000000001',
  '¿Qué tipo de destino es tu viaje?',
  NULL,
  'single',
  14,
  '{"if_any_slug": ["obj-viaje"]}'::jsonb
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0002-0014-0000-000000000001', 'Playa o destino tropical',              'viaje-playa',    1),
  ('55550012-0002-0014-0000-000000000001', 'Ciudad, trabajo o negocios',            'viaje-ciudad',   2),
  ('55550012-0002-0014-0000-000000000001', 'Montaña, senderismo o aventura',        'viaje-aventura', 3),
  ('55550012-0002-0014-0000-000000000001', 'Vuelo largo o varios destinos',         'viaje-largo',    4);

-- Rama: Hogar
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0002-0015-0000-000000000001',
  '55550011-0002-0000-0000-000000000001',
  '¿Qué tipo de kit buscas para casa?',
  NULL,
  'single',
  15,
  '{"if_any_slug": ["obj-hogar"]}'::jsonb
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0002-0015-0000-000000000001', 'Botiquín familiar completo para casa',     'hogar-familiar', 1),
  ('55550012-0002-0015-0000-000000000001', 'Kit compacto para el día a día',           'hogar-compacto', 2),
  ('55550012-0002-0015-0000-000000000001', 'Para auto, cartera u oficina',             'hogar-movil',    3);

-- Rama: Pies y cuerpo
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0002-0016-0000-000000000001',
  '55550011-0002-0000-0000-000000000001',
  '¿Qué te preocupa principalmente?',
  NULL,
  'single',
  16,
  '{"if_any_slug": ["obj-pies-cuerpo"]}'::jsonb
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0002-0016-0000-000000000001', 'Pies cansados, callos o durezas',              'pies-durezas',     1),
  ('55550012-0002-0016-0000-000000000001', 'Rozaduras, sequedad o cuidado corporal',       'cuerpo-rozaduras', 2),
  ('55550012-0002-0016-0000-000000000001', 'Recuperación muscular del cuerpo',             'cuerpo-muscular',  3),
  ('55550012-0002-0016-0000-000000000001', 'Cuidado general de pies y cuerpo',             'pies-general',     4);
;
