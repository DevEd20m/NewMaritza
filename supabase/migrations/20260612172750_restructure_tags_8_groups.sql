
-- 1. Agregar columna is_internal
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

-- 2. Limpiar datos existentes
DELETE FROM product_tags;
DELETE FROM tags;

-- 3. Insertar los 74 nuevos tags
INSERT INTO tags (name, slug, "group", is_internal) VALUES
  -- OBJETIVO (19)
  ('Articulaciones',              'objetivo-articulaciones',    'objetivo',    false),
  ('Barrera Reparadora',          'objetivo-barrera',           'objetivo',    false),
  ('Belleza y Cabello',           'objetivo-belleza-cabello',   'objetivo',    false),
  ('Calma y Relajación',          'objetivo-calma',             'objetivo',    false),
  ('Concentración',               'objetivo-concentracion',     'objetivo',    false),
  ('Control de Peso',             'objetivo-control-peso',      'objetivo',    false),
  ('Cuidado Corporal',            'objetivo-cuerpo',            'objetivo',    false),
  ('Cuidado de Piel',             'objetivo-piel',              'objetivo',    false),
  ('Digestivo',                   'objetivo-digestivo',         'objetivo',    false),
  ('Energía',                     'objetivo-energia',           'objetivo',    false),
  ('Gym y Rendimiento',           'objetivo-gym',               'objetivo',    false),
  ('Hidratación',                 'objetivo-hidratacion',       'objetivo',    false),
  ('Pies',                        'objetivo-pies',              'objetivo',    false),
  ('Primeros Auxilios',           'objetivo-primeros-auxilios', 'objetivo',    false),
  ('Protección Solar',            'objetivo-solar',             'objetivo',    false),
  ('Recuperación Muscular',       'objetivo-recuperacion',      'objetivo',    false),
  ('Sistema Inmune',              'objetivo-inmune',            'objetivo',    false),
  ('Sueño y Descanso',            'objetivo-sueno',             'objetivo',    false),
  ('Viaje',                       'objetivo-viaje',             'objetivo',    false),
  -- USO (11)
  ('Familia',                     'uso-familia',                'uso',         false),
  ('Gym',                         'uso-gym',                    'uso',         false),
  ('Hogar',                       'uso-hogar',                  'uso',         false),
  ('Oficina y Pantallas',         'uso-oficina',                'uso',         false),
  ('Outdoor',                     'uso-outdoor',                'uso',         false),
  ('Playa',                       'uso-playa',                  'uso',         false),
  ('Post Entrenamiento',          'uso-post-entreno',           'uso',         false),
  ('Principiante en Autocuidado', 'uso-principiante',           'uso',         false),
  ('Rutina Diaria',               'uso-rutina-dia',             'uso',         false),
  ('Rutina Nocturna',             'uso-rutina-noche',           'uso',         false),
  ('Viaje',                       'uso-viaje',                  'uso',         false),
  -- NIVEL (3)
  ('Avanzado',                    'nivel-avanzado',             'nivel',       false),
  ('Intermedio',                  'nivel-intermedio',           'nivel',       false),
  ('Principiante',                'nivel-principiante',         'nivel',       false),
  -- INTENSIDAD (3)
  ('Alto Rendimiento',            'intensidad-alto',            'intensidad',  false),
  ('Completo',                    'intensidad-completo',        'intensidad',  false),
  ('Ligero',                      'intensidad-ligero',          'intensidad',  false),
  -- PIEL (8)
  ('Barrera Alterada',            'piel-barrera-alterada',      'piel',        false),
  ('Piel Deshidratada',           'piel-deshidratada',          'piel',        false),
  ('Piel Grasa',                  'piel-grasa',                 'piel',        false),
  ('Piel Mixta',                  'piel-mixta',                 'piel',        false),
  ('Piel Normal',                 'piel-normal',                'piel',        false),
  ('Piel Seca',                   'piel-seca',                  'piel',        false),
  ('Piel Sensible',               'piel-sensible',              'piel',        false),
  ('Tendencia a Brotes',          'piel-brotes',                'piel',        false),
  -- PREFERENCIA (10)
  ('Cruelty Free',                'pref-cruelty-free',          'preferencia', false),
  ('Orgánico y Natural',          'pref-organico',              'preferencia', false),
  ('Sin Alcohol',                 'pref-sin-alcohol',           'preferencia', false),
  ('Sin Azúcar',                  'pref-sin-azucar',            'preferencia', false),
  ('Sin Cafeína',                 'pref-sin-cafeina',           'preferencia', false),
  ('Sin Fragancia',               'pref-sin-fragancia',         'preferencia', false),
  ('Sin Gluten',                  'pref-sin-gluten',            'preferencia', false),
  ('Textura Ligera',              'pref-textura-ligera',        'preferencia', false),
  ('Travel Size',                 'pref-travel-size',           'preferencia', false),
  ('Vegano',                      'pref-vegano',                'preferencia', false),
  -- MOMENTO (8)
  ('Antes de Dormir',             'momento-antes-dormir',       'momento',     false),
  ('Antes de Entrenar',           'momento-antes-entreno',      'momento',     false),
  ('Después de Entrenar',         'momento-post-entreno',       'momento',     false),
  ('Durante Viaje',               'momento-viaje',              'momento',     false),
  ('Mañana',                      'momento-manana',             'momento',     false),
  ('Noche',                       'momento-noche',              'momento',     false),
  ('Uso Diario',                  'momento-uso-diario',         'momento',     false),
  ('Uso Ocasional',               'momento-uso-ocasional',      'momento',     false),
  -- ALERTAS INTERNAS (12)
  ('Alergia a Frutos Secos',      'alerta-frutos-secos',        'alerta',      true),
  ('Alergia a Lácteos',           'alerta-lacteos',             'alerta',      true),
  ('Alergia a Soya',              'alerta-soya',                'alerta',      true),
  ('Embarazo o Lactancia',        'alerta-embarazo',            'alerta',      true),
  ('Menores de Edad',             'alerta-menores',             'alerta',      true),
  ('No Combinar con Alcohol',     'alerta-alcohol',             'alerta',      true),
  ('No Combinar con Sedantes',    'alerta-sedantes',            'alerta',      true),
  ('Piel Muy Sensible',           'alerta-piel-sensible',       'alerta',      true),
  ('Requiere Advertencia',        'alerta-advertencia',         'alerta',      true),
  ('Requiere Consulta',           'alerta-consulta',            'alerta',      true),
  ('Sensibilidad a Cafeína',      'alerta-cafeina',             'alerta',      true),
  ('Uso con Medicamentos',        'alerta-medicamentos',        'alerta',      true);
;
