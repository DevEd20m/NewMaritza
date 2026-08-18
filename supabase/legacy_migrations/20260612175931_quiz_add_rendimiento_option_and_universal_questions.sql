
-- Fix 3: Add obj-rendimiento option to Sección 1 (slot sort_order=1 is free)
INSERT INTO quiz_question_options (question_id, text, slug, sort_order)
VALUES (
  '55550012-0001-0001-0000-000000000001',
  'Mejorar mi rendimiento físico o deporte',
  'obj-rendimiento',
  1
);

-- Fix 4a: Add Q13 — Solar/Viaje universal question (Sección 2, sort_order=13)
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0002-0013-0000-000000000001',
  '55550011-0002-0000-0000-000000000001',
  '¿Pasas tiempo al sol, en playa o tienes un viaje próximo?',
  'Te ayudamos a prepararte para el sol y los viajes también.',
  'single',
  13,
  NULL
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0002-0013-0000-000000000001', 'Sí, me expongo bastante al sol o hago outdoor',  'exposicion-solar', 1),
  ('55550012-0002-0013-0000-000000000001', 'Tengo un viaje próximo o viajo con frecuencia',   'viaje-proximo',    2),
  ('55550012-0002-0013-0000-000000000001', 'No, solo el día a día en ciudad',                 'ciudad-solo',      3);

-- Fix 4b: Add Q14 — Hogar/Pies universal question (Sección 2, sort_order=14)
INSERT INTO quiz_questions (id, group_id, text, subtext, type, sort_order, conditions)
VALUES (
  '55550012-0002-0014-0000-000000000001',
  '55550011-0002-0000-0000-000000000001',
  '¿Tienes alguna de estas necesidades en casa?',
  'Puedes elegir una o varias.',
  'multi',
  14,
  NULL
);
INSERT INTO quiz_question_options (question_id, text, slug, sort_order) VALUES
  ('55550012-0002-0014-0000-000000000001', 'Paso muchas horas de pie o sufro dolor en pies o piernas', 'cuidado-pies',        1),
  ('55550012-0002-0014-0000-000000000001', 'Quiero armar un botiquín para mi casa o familia',           'kit-casa',            2),
  ('55550012-0002-0014-0000-000000000001', 'Ninguna de las anteriores',                                 'sin-necesidad-extra', 3);
;
