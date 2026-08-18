
-- ================================================================
-- 1. CORREGIR CATEGORÍAS MAL ASIGNADAS
-- ================================================================
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'vitaminas')
WHERE slug IN (
  'citrato-de-magnesio-smart-blends-400g',
  'citrato-magnesio-drasanvi-60tabletas'
);

-- ================================================================
-- 2. NUEVOS PRODUCTOS (research mercado Perú 2025)
-- ================================================================
INSERT INTO products (id, name, slug, description, cover_image_url, category_id, is_active) VALUES

  ('da000041-0000-0000-0000-000000000000',
   'Colágeno con Aguaje Biocenter 200g',
   'colageno-con-aguaje-biocenter-200g',
   'Colágeno hidrolizado con aguaje andino, rico en vitamina A y antioxidantes. Reduce arrugas, protege articulaciones y realza el brillo natural de la piel.',
   'https://organaperu.vtexassets.com/arquivos/ids/162548-800-auto?v=638810384960400000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'vitaminas'), true),

  ('da000042-0000-0000-0000-000000000000',
   'Maca Negra Gelatinizada Ecoandino 200g',
   'maca-negra-gelatinizada-ecoandino-200g',
   'Superalimento andino orgánico gelatinizado. Energía sostenida, memoria, resistencia física y vitalidad. Orgullo peruano en su forma más pura.',
   'https://organaperu.vtexassets.com/arquivos/ids/164414-800-auto?v=639155771321400000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'organicos'), true),

  ('da000043-0000-0000-0000-000000000000',
   'Anxiety Ashwagandha + Rhodiola + L-Teanina Xtralife 60 Cáps',
   'anxiety-ashwagandha-rhodiola-lteanina-xtralife-60caps',
   'Fórmula adaptogénica completa contra el estrés: ashwagandha + rhodiola + L-teanina. Calma mental, concentración y resistencia al estrés crónico sin somnolencia.',
   'https://organaperu.vtexassets.com/arquivos/ids/162193-800-auto?v=638718692620370000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'vitaminas'), true),

  ('da000044-0000-0000-0000-000000000000',
   'Colágeno Premium Tipo I Limón Smart Blends 390g',
   'colageno-premium-tipo-i-limon-smart-blends-390g',
   'Colágeno hidrolizado tipo I con extracto de yacón y stevia. Sin azúcar, sabor limón. 30 porciones. Para piel firme, cabello y uñas fuertes.',
   'https://organaperu.vtexassets.com/arquivos/ids/164051-800-auto?v=639005619500630000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'vitaminas'), true),

  ('da000045-0000-0000-0000-000000000000',
   'Lab Nutrition Colágeno Peptides 609g',
   'colageno-peptides-lab-nutrition-609g',
   'Colágeno hidrolizado sin sabor de alta absorción. Sin aditivos, 40 porciones. El más completo para piel, cabello, uñas, huesos y articulaciones.',
   'https://organaperu.vtexassets.com/arquivos/ids/161729-800-auto?v=638629870027230000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'vitaminas'), true),

  ('da000046-0000-0000-0000-000000000000',
   'Glutatión Xtralife 500mg 30 Cáps',
   'glutation-xtralife-500mg-30caps',
   'El antioxidante maestro del cuerpo. 500mg de glutatión por cápsula. Piel luminosa, desintoxicación hepática y sistema inmune reforzado.',
   'https://organaperu.vtexassets.com/arquivos/ids/162198-800-auto?v=638718768395900000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'vitaminas'), true),

  ('da000047-0000-0000-0000-000000000000',
   'Omega 3 Nutricost 2500mg 120 Cáps',
   'omega-3-nutricost-2500mg-120caps',
   'Omega 3 triple potencia de pescado salvaje. 1200mg EPA + 850mg DHA por porción. 40 porciones. Sin OGM, sin gluten. Para corazón, memoria y articulaciones.',
   'https://organaperu.vtexassets.com/arquivos/ids/163524-800-auto?v=638902819782200000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'vitaminas'), true),

  ('da000048-0000-0000-0000-000000000000',
   'Inositol Nutricost 500mg 240 Cáps',
   'inositol-nutricost-500mg-240caps',
   'Myo-inositol para equilibrio hormonal femenino, bienestar emocional, salud metabólica y soporte en SOP. 240 cápsulas vegetarianas sin OGM.',
   'https://organaperu.vtexassets.com/arquivos/ids/164060-800-auto?v=639004609417400000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'vitaminas'), true),

  ('da000049-0000-0000-0000-000000000000',
   'Probiótico Complex Nutricost 60 Cáps',
   'probiotico-complex-nutricost-60caps',
   'Complejo probiótico multi-cepa para flora intestinal sana, digestión óptima, inmunidad fuerte y mejor absorción de nutrientes. 60 cápsulas.',
   'https://organaperu.vtexassets.com/arquivos/ids/163907-800-auto?v=639004596914400000&width=800&height=auto&aspect=true',
   (SELECT id FROM categories WHERE slug = 'organicos'), true);

-- ================================================================
-- 3. VARIANTES Y PRECIOS
-- ================================================================
INSERT INTO product_variants (id, product_id, name, sku, is_active) VALUES
  ('db000041-0000-0000-0000-000000000000', 'da000041-0000-0000-0000-000000000000', '200 g', 'SKU-DA041', true),
  ('db000042-0000-0000-0000-000000000000', 'da000042-0000-0000-0000-000000000000', '200 g', 'SKU-DA042', true),
  ('db000043-0000-0000-0000-000000000000', 'da000043-0000-0000-0000-000000000000', '60 cápsulas', 'SKU-DA043', true),
  ('db000044-0000-0000-0000-000000000000', 'da000044-0000-0000-0000-000000000000', '390 g', 'SKU-DA044', true),
  ('db000045-0000-0000-0000-000000000000', 'da000045-0000-0000-0000-000000000000', '609 g', 'SKU-DA045', true),
  ('db000046-0000-0000-0000-000000000000', 'da000046-0000-0000-0000-000000000000', '30 cápsulas', 'SKU-DA046', true),
  ('db000047-0000-0000-0000-000000000000', 'da000047-0000-0000-0000-000000000000', '120 cápsulas', 'SKU-DA047', true),
  ('db000048-0000-0000-0000-000000000000', 'da000048-0000-0000-0000-000000000000', '240 cápsulas', 'SKU-DA048', true),
  ('db000049-0000-0000-0000-000000000000', 'da000049-0000-0000-0000-000000000000', '60 cápsulas', 'SKU-DA049', true);

INSERT INTO product_prices (variant_id, amount_cents, currency, effective_from) VALUES
  ('db000041-0000-0000-0000-000000000000', 3590,  'PEN', NOW()),
  ('db000042-0000-0000-0000-000000000000', 2490,  'PEN', NOW()),
  ('db000043-0000-0000-0000-000000000000', 8415,  'PEN', NOW()),
  ('db000044-0000-0000-0000-000000000000', 10790, 'PEN', NOW()),
  ('db000045-0000-0000-0000-000000000000', 17900, 'PEN', NOW()),
  ('db000046-0000-0000-0000-000000000000', 7565,  'PEN', NOW()),
  ('db000047-0000-0000-0000-000000000000', 17280, 'PEN', NOW()),
  ('db000048-0000-0000-0000-000000000000', 12665, 'PEN', NOW()),
  ('db000049-0000-0000-0000-000000000000', 16000, 'PEN', NOW());

-- ================================================================
-- 4. TRES NUEVOS KITS BASADOS EN RESEARCH
-- ================================================================

-- Kit Estrés & Ansiedad (tendencia creciente Peru 2025)
INSERT INTO kits (id, name, slug, description, is_active) VALUES
  ('dc000009-0000-0000-0000-000000000000',
   'Kit Estrés & Ansiedad',
   'kit-estres-ansiedad',
   'Para mente tranquila en tiempos acelerados. Ashwagandha + magnesio efervescente + Flores de Bach para calmar el sistema nervioso sin somnolencia.',
   true);

INSERT INTO kit_products (kit_id, variant_id, quantity, sort_order, is_required) VALUES
  ('dc000009-0000-0000-0000-000000000000', 'db000043-0000-0000-0000-000000000000', 1, 1, true),
  ('dc000009-0000-0000-0000-000000000000', 'db000012-0000-0000-0000-000000000000', 1, 2, true),
  ('dc000009-0000-0000-0000-000000000000', 'db000011-0000-0000-0000-000000000000', 1, 3, true);

-- Kit Superalimentos Andinos (identidad peruana, maca es el producto más buscado)
INSERT INTO kits (id, name, slug, description, is_active) VALUES
  ('dc000010-0000-0000-0000-000000000000',
   'Kit Superalimentos Andinos',
   'kit-superalimentos-andinos',
   'Lo mejor de los Andes en un solo kit. Maca negra + blend de superalimentos + cúrcuma con kion para energía natural, vitalidad y bienestar desde las raíces.',
   true);

INSERT INTO kit_products (kit_id, variant_id, quantity, sort_order, is_required) VALUES
  ('dc000010-0000-0000-0000-000000000000', 'db000042-0000-0000-0000-000000000000', 1, 1, true),
  ('dc000010-0000-0000-0000-000000000000', 'db000023-0000-0000-0000-000000000000', 1, 2, true),
  ('dc000010-0000-0000-0000-000000000000', 'db000024-0000-0000-0000-000000000000', 1, 3, true);

-- Kit Antienvejecimiento (categoría #1 en crecimiento, Gen X/Y en Perú)
INSERT INTO kits (id, name, slug, description, is_active) VALUES
  ('dc000011-0000-0000-0000-000000000000',
   'Kit Antienvejecimiento',
   'kit-antienvejecimiento',
   'La trinidad del antienvejecimiento. Glutatión + omega 3 + colágeno péptidos para piel luminosa, articulaciones sanas y cuerpo fuerte desde adentro.',
   true);

INSERT INTO kit_products (kit_id, variant_id, quantity, sort_order, is_required) VALUES
  ('dc000011-0000-0000-0000-000000000000', 'db000046-0000-0000-0000-000000000000', 1, 1, true),
  ('dc000011-0000-0000-0000-000000000000', 'db000047-0000-0000-0000-000000000000', 1, 2, true),
  ('dc000011-0000-0000-0000-000000000000', 'db000045-0000-0000-0000-000000000000', 1, 3, true);
;
