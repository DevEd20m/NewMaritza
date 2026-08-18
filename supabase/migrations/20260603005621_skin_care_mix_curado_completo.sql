
-- ================================================================
-- PRODUCTOS SKIN CARE: MIX CURADO COMPLETO
-- Kumir (peruana natural) + The Ordinary + Korean SPF
-- ================================================================

INSERT INTO products (id, name, slug, description, cover_image_url, category_id, is_active) VALUES

  -- KUMIR (Peruana Natural)
  ('da000050-0000-0000-0000-000000000000',
   'Sérum Facial Calmante Regenerador Kumir',
   'serum-facial-calmante-regenerador-kumir',
   'Sérum calmante y regenerador con ácido hialurónico. Fórmula peruana natural, vegana y cruelty-free. Para piel sensible, seca o mixta. Sin siliconas ni fragancias sintéticas.',
   'https://www.kumir.pe/cdn/shop/files/SerumFacialNoche_r040_a005_27fbc502-71e2-4724-a7aa-eebab87b8f3b_1024x1024.jpg?v=1689187809',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true),

  ('da000051-0000-0000-0000-000000000000',
   'Espuma Limpiadora Facial Piel Mixta Kumir 180ml',
   'espuma-limpiadora-facial-kumir-180ml',
   'Limpieza facial profunda para piel mixta y grasa. Con avena, salvia y aceite de almendra. Sin sulfatos, siliconas ni fragancias artificiales. Vegana y cruelty-free.',
   'https://www.kumir.pe/cdn/shop/files/Espuma_limpiadora_facial_090_000_1024x1024.jpg?v=1740514890',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true),

  ('da000052-0000-0000-0000-000000000000',
   'Mascarilla Facial Hidratante Kumir 25g',
   'mascarilla-facial-hidratante-kumir-25g',
   'Mascarilla facial hidratante con arcilla blanca, vitamina E, aceite de almendra y moringa. Para usar 1-2 veces por semana. Vegana, cruelty-free, sin químicos agresivos.',
   'https://www.kumir.pe/cdn/shop/files/mascarilla1-2_1024x1024.jpg?v=1683753600',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true),

  -- THE ORDINARY (Internacional, transparente en ingredientes)
  ('da000053-0000-0000-0000-000000000000',
   'The Ordinary Niacinamide 10% + Zinc 1% 30ml',
   'the-ordinary-niacinamide-10-zinc-1-30ml',
   'El sérum de niacinamida más popular del mundo. Reduce poros, controla el sebo, unifica el tono y minimiza imperfecciones. 10% niacinamida + 1% zinc. Sin fragancia.',
   'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwce8a7cdf/Images/products/The%20Ordinary/rdn-niacinamide-10pct-zinc-1pct-30ml.png?sw=800&sh=800&sm=fit',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true),

  ('da000054-0000-0000-0000-000000000000',
   'The Ordinary Hyaluronic Acid 2% + B5 30ml',
   'the-ordinary-hyaluronic-acid-2-b5-30ml',
   'Hidratación profunda con 3 pesos moleculares de ácido hialurónico + vitamina B5. Piel más llena, tersa y luminosa. Para todos los tipos de piel, especialmente seca o deshidratada.',
   'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw56cd0f2e/Images/products/The%20Ordinary/rdn-hyaluronic-acid-2pct-b5-30ml.png?sw=800&sh=800&sm=fit',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true),

  ('da000055-0000-0000-0000-000000000000',
   'The Ordinary AHA 30% + BHA 2% Peeling Solution 30ml',
   'the-ordinary-aha-30-bha-2-peeling-solution-30ml',
   'Exfoliante químico de alta concentración. AHA 30% + BHA 2% para renovar la piel, reducir manchas y mejorar textura. Uso 1-2 veces por semana máx. 10 minutos. No usar con retinol.',
   'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dwdf7a6213/Images/products/The%20Ordinary/rdn-aha-30pct-bha-2pct-peeling-solution-30ml.png?sw=800&sh=800&sm=fit',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true),

  -- KOREAN SPF (Los más vendidos en Perú 2025)
  ('da000056-0000-0000-0000-000000000000',
   'Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ 50ml',
   'beauty-of-joseon-relief-sun-spf50-50ml',
   'El protector solar coreano más amado en Perú. Textura acuosa sin residuo blanco. Con 30% extracto de arroz + probióticos para nutrir mientras protege. SPF50+ PA++++.',
   'https://beautyaddicts.pe/cdn/shop/files/Protector-solar-Relief-Sun-Rice-Probiotics-spf50-beauty-of-joseon-1.png',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true),

  ('da000057-0000-0000-0000-000000000000',
   'SKIN1004 Madagascar Centella Water-Fit Sun Serum SPF50+ 50ml',
   'skin1004-centella-water-fit-sun-serum-spf50-50ml',
   'Protector solar-sérum ultraligero con centella asiática de Madagascar. Hidrata y calma mientras protege. Sin white cast, absorción inmediata. SPF50+ PA++++.',
   'https://beautyaddicts.pe/cdn/shop/files/madagascar-centella-hyalu-cica-water-fit-sun-serum-skin1004-1.jpg',
   (SELECT id FROM categories WHERE slug = 'skin-care'), true);

-- ================================================================
-- VARIANTES Y PRECIOS
-- ================================================================
INSERT INTO product_variants (id, product_id, name, sku, is_active) VALUES
  ('db000050-0000-0000-0000-000000000000', 'da000050-0000-0000-0000-000000000000', '30 ml',       'SKU-DA050', true),
  ('db000051-0000-0000-0000-000000000000', 'da000051-0000-0000-0000-000000000000', '180 ml',      'SKU-DA051', true),
  ('db000052-0000-0000-0000-000000000000', 'da000052-0000-0000-0000-000000000000', '25 g',        'SKU-DA052', true),
  ('db000053-0000-0000-0000-000000000000', 'da000053-0000-0000-0000-000000000000', '30 ml',       'SKU-DA053', true),
  ('db000054-0000-0000-0000-000000000000', 'da000054-0000-0000-0000-000000000000', '30 ml',       'SKU-DA054', true),
  ('db000055-0000-0000-0000-000000000000', 'da000055-0000-0000-0000-000000000000', '30 ml',       'SKU-DA055', true),
  ('db000056-0000-0000-0000-000000000000', 'da000056-0000-0000-0000-000000000000', '50 ml',       'SKU-DA056', true),
  ('db000057-0000-0000-0000-000000000000', 'da000057-0000-0000-0000-000000000000', '50 ml',       'SKU-DA057', true);

INSERT INTO product_prices (variant_id, amount_cents, currency, effective_from) VALUES
  ('db000050-0000-0000-0000-000000000000', 3450,  'PEN', NOW()),
  ('db000051-0000-0000-0000-000000000000', 3490,  'PEN', NOW()),
  ('db000052-0000-0000-0000-000000000000', 1990,  'PEN', NOW()),
  ('db000053-0000-0000-0000-000000000000', 7990,  'PEN', NOW()),
  ('db000054-0000-0000-0000-000000000000', 8990,  'PEN', NOW()),
  ('db000055-0000-0000-0000-000000000000', 7990,  'PEN', NOW()),
  ('db000056-0000-0000-0000-000000000000', 3500,  'PEN', NOW()),
  ('db000057-0000-0000-0000-000000000000', 4500,  'PEN', NOW());

-- ================================================================
-- KIT RUTINA FACIAL BÁSICA (3 pasos esenciales)
-- ================================================================
INSERT INTO kits (id, name, slug, description, is_active) VALUES
  ('dc000012-0000-0000-0000-000000000000',
   'Kit Rutina Facial Básica',
   'kit-rutina-facial-basica',
   'Los 3 pasos esenciales que toda rutina facial necesita. Limpieza + sérum activo + protector solar. Con productos seleccionados por eficacia y precio accesible.',
   true);

INSERT INTO kit_products (kit_id, variant_id, quantity, sort_order, is_required) VALUES
  ('dc000012-0000-0000-0000-000000000000', 'db000051-0000-0000-0000-000000000000', 1, 1, true),  -- Espuma limpiadora Kumir
  ('dc000012-0000-0000-0000-000000000000', 'db000053-0000-0000-0000-000000000000', 1, 2, true),  -- Niacinamida The Ordinary
  ('dc000012-0000-0000-0000-000000000000', 'db000056-0000-0000-0000-000000000000', 1, 3, true);  -- Beauty of Joseon SPF50+
;
