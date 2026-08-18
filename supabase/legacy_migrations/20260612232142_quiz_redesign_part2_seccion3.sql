
-- ══════════════════════════════════════════════════════════════
-- PARTE 2: Sección 3 — Restructura completa
-- ══════════════════════════════════════════════════════════════

-- ── INSERT pregunta de seguridad (sort_order=0, primera) ──────
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0003-0005-0000-000000000001',
  '55550011-0003-0000-0000-000000000001',
  'Antes de recomendarte algo, ¿hay algo que debamos considerar?',
  'Tu seguridad es lo primero.',
  'multi',
  0,
  NULL
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0003-0005-0000-000000000001', 'Ninguna',                                        'sin-condicion',      1),
  ('55550012-0003-0005-0000-000000000001', 'Estoy embarazada o en lactancia',                'cond-embarazo',      2),
  ('55550012-0003-0005-0000-000000000001', 'Tomo medicamentos actualmente',                  'cond-medicamentos',  3),
  ('55550012-0003-0005-0000-000000000001', 'Tengo una condición médica relevante',           'cond-medica',        4),
  ('55550012-0003-0005-0000-000000000001', 'He tenido reacciones fuertes a productos',       'cond-reacciones',    5),
  ('55550012-0003-0005-0000-000000000001', 'Tengo síntomas intensos o persistentes',         'cond-sintomas',      6);

-- ── UPDATE Q1 alergias → universal + texto + opciones nuevas ──
UPDATE quiz_questions
SET text       = '¿Tienes alguna restricción o preferencia?',
    conditions = NULL
WHERE id = '55550012-0003-0001-0000-000000000001';

-- Cambiar "Ninguna" → "Ninguna restricción"
UPDATE quiz_question_options
SET text = 'Ninguna restricción'
WHERE slug = 'sin-restriccion' AND question_id = '55550012-0003-0001-0000-000000000001';

-- Agregar nuevas opciones de restricción/preferencia
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0003-0001-0000-000000000001', 'Sin azúcar',        'alerg-azucar',      5),
  ('55550012-0003-0001-0000-000000000001', 'Sin cafeína',       'alerg-cafeina',     6),
  ('55550012-0003-0001-0000-000000000001', 'Vegano/a',          'pref-vegano',       7),
  ('55550012-0003-0001-0000-000000000001', 'Sin fragancia',     'pref-sin-fragancia',8),
  ('55550012-0003-0001-0000-000000000001', 'Orgánico / natural','pref-organico',     9);

-- ── DELETE pregunta de género ──────────────────────────────────
DELETE FROM quiz_question_options WHERE question_id = '55550012-0003-0003-0000-000000000001';
DELETE FROM quiz_questions WHERE id = '55550012-0003-0003-0000-000000000001';

-- ── INSERT pregunta de tipo de rutina (sort_order=3, slot libre) ──
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0003-0006-0000-000000000001',
  '55550011-0003-0000-0000-000000000001',
  '¿Qué tipo de rutina prefieres?',
  NULL,
  'single',
  3,
  NULL
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0003-0006-0000-000000000001', 'Muy simple, pocos productos',   'rutina-simple',    1),
  ('55550012-0003-0006-0000-000000000001', 'Balanceada, lo necesario',      'rutina-balanceada',2),
  ('55550012-0003-0006-0000-000000000001', 'Completa, quiero más opciones', 'rutina-completa',  3),
  ('55550012-0003-0006-0000-000000000001', 'No sé, recomiéndenme',          'rutina-guiada',    4);

-- ── UPDATE Q4 presupuesto — texto y última opción ─────────────
UPDATE quiz_questions
SET text = '¿Qué presupuesto quieres considerar para tu kit?'
WHERE id = '55550012-0003-0004-0000-000000000001';

UPDATE quiz_question_options
SET text = 'Más de S/250 — quiero lo mejor'
WHERE slug = 'presupuesto-premium' AND question_id = '55550012-0003-0004-0000-000000000001';
;
