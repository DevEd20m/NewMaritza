-- =============================================================
-- LIORA – Productos y Kits reales desde dataset.json (Organa.com.pe)
-- Migration: 20260601000000_seed_dataset_products.sql
-- 40 productos · 8 kits temáticos · Precios en PEN cents
-- IDs namespace: da/db/dc (dataset) para no colisionar con seed
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PRODUCTS (40 productos reales)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.products
  (id, name, slug, description, brand, category_id, cover_image_url, gallery_urls,
   usage_instructions, indications, contraindications, is_active, created_at, updated_at)
VALUES

-- ── VITAMINAS ─────────────────────────────────────────────────

-- p01 Colágeno C+
('da000001-0000-0000-0000-000000000000',
 'Colágeno C+ Peru Nutrition 500g',
 'colageno-c-peru-nutrition-500g',
 'Colágeno hidrolizado con vitamina C para favorecer la síntesis de colágeno natural. Fácil de disolver, sin sabor fuerte.',
 'Peru Nutrition',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/163092-1200-auto?v=638794019914900000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163092-1200-auto?v=638794019914900000&width=1200&height=auto&aspect=true'],
 'Disolver 1 medida (aprox. 10 g) en agua, jugo o batido. Tomar preferentemente en ayunas o post-entrenamiento.',
 'Personas que buscan mejorar la elasticidad de la piel, salud articular y recuperación muscular.',
 'Consultar con médico si estás embarazada o lactando.',
 true, now(), now()),

-- p02 Colágeno + Biotina
('da000002-0000-0000-0000-000000000000',
 'Colágeno con Biotina Peru Nutrition 500g',
 'colageno-con-biotina-peru-nutrition-500g',
 'Colágeno hidrolizado enriquecido con biotina para fortalecer cabello, piel y uñas. Fórmula completa para la belleza desde adentro.',
 'Peru Nutrition',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/163063/Colageno%20con%20Biotina%20x500gr.png.png?v=638793848773970000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163063/Colageno%20con%20Biotina%20x500gr.png.png?v=638793848773970000'],
 'Disolver 1 medida en 200 ml de agua o jugo. Tomar en ayunas para mejor absorción.',
 'Personas que desean mejorar la salud del cabello, uñas y piel.',
 NULL,
 true, now(), now()),

-- p03 Biotina 10,000 MCG Natures Truth
('da000003-0000-0000-0000-000000000000',
 'Biotina 10,000 MCG Natures Truth 50 Gomitas',
 'biotina-10000-mcg-natures-truth-50gomitas',
 'Gomitas de biotina de alta potencia (10,000 MCG). Apoya la salud del cabello, piel y uñas de forma deliciosa y fácil.',
 'Natures Truth',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162627/biotina%2010000%20gomitas.png.png?v=638768023971270000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162627/biotina%2010000%20gomitas.png.png?v=638768023971270000'],
 'Tomar 1–2 gomitas al día con o sin alimentos.',
 'Para quienes desean fortalecer cabello, uñas y mejorar la salud de la piel.',
 'No exceder la dosis recomendada.',
 true, now(), now()),

-- p04 Glucosamina Condroitina HA Colágeno Mason
('da000004-0000-0000-0000-000000000000',
 'Glucosamina Condroitina Ácido Hialurónico y Colágeno Mason Natural 60 Tabletas',
 'glucosamina-condroitina-ah-colageno-mason-natural-60tab',
 'Fórmula completa para la salud articular con glucosamina, condroitina, ácido hialurónico y colágeno. Favorece la flexibilidad, movilidad y lubricación de las articulaciones.',
 'Mason Naturals',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162884-1200-auto?v=638956251160270000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162884-1200-auto?v=638956251160270000&width=1200&height=auto&aspect=true',
       'https://organaperu.vtexassets.com/arquivos/ids/163805-1200-auto?v=638956477404130000&width=1200&height=auto&aspect=true'],
 'Tomar 3 tabletas al día con las comidas principales.',
 'Personas con desgaste articular, deportistas y adultos que buscan mantener la movilidad.',
 'No recomendado para personas con alergia a mariscos. Consultar con médico si tiene condiciones crónicas.',
 true, now(), now()),

-- p05 Colágeno Marino Cúrcuma Drasanvi
('da000005-0000-0000-0000-000000000000',
 'Colágeno Marino Hidrolizado con Cúrcuma Drasanvi 300g',
 'colageno-marino-hidrolizado-curcuma-drasanvi-300g',
 'Colágeno marino de alta pureza combinado con cúrcuma antiinflamatoria. Apoya la salud articular, muscular y la piel desde adentro.',
 'Drasanvi',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/161340-1200-auto?v=638394825500100000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/161340-1200-auto?v=638394825500100000&width=1200&height=auto&aspect=true'],
 'Disolver 1 medida (10 g) en 200 ml de agua o zumo. Tomar preferiblemente en ayunas.',
 'Para personas con dolores articulares, deportistas y quienes desean mejorar su piel.',
 'Consultar con médico si toma anticoagulantes.',
 true, now(), now()),

-- p06 Magnesio Xtralife
('da000006-0000-0000-0000-000000000000',
 'Magnesio Xtralife 500mg 60 Cápsulas',
 'magnesio-xtralife-500mg-60capsulas',
 'Suplemento de magnesio elemental en cápsulas de fácil absorción. Apoya el sistema nervioso, la salud muscular y ósea.',
 'Xtralife',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162204/MAGNESIUM.png?v=638718794828630000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162204/MAGNESIUM.png?v=638718794828630000'],
 'Tomar 1–2 cápsulas al día con alimentos.',
 'Deportistas, personas con estrés, calambres musculares o alteraciones del sueño.',
 'No exceder la dosis indicada.',
 true, now(), now()),

-- p10 Melatonina Yumi Gumi
('da000010-0000-0000-0000-000000000000',
 'Gud Nait Gomitas con Melatonina Yumi Gumi 90 Unidades',
 'gud-nait-gomitas-melatonina-yumi-gumi-90und',
 'Gomitas con melatonina para un sueño natural y reparador. Ayudan a regular el ciclo del sueño sin generar dependencia.',
 'Yumi Gumi',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/163434-1200-auto?v=638861396794970000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163434-1200-auto?v=638861396794970000&width=1200&height=auto&aspect=true'],
 'Tomar 2 gomitas 30 minutos antes de dormir.',
 'Personas con dificultad para conciliar el sueño o con insomnio leve.',
 'No conducir después de tomar. Consultar con médico si está embarazada o en tratamiento.',
 true, now(), now()),

-- p11 Flores de Bach Rescue Night
('da000011-0000-0000-0000-000000000000',
 'Flores de Bach Rescue Night Gummies Frutos Rojos 60 Gomitas',
 'flores-de-bach-rescue-night-gummies-60gomitas',
 'Gomitas Rescue Night con esencias florales de Bach para un sueño tranquilo y relajante. Sabor frutos rojos, sin azúcar añadida.',
 'Bach',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/161885/RESCUE-NIGHT-GUMMIES-SABOR-FRUTOS-ROJOS-60GOM.png?v=638654815015330000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/161885/RESCUE-NIGHT-GUMMIES-SABOR-FRUTOS-ROJOS-60GOM.png?v=638654815015330000'],
 'Tomar 2–4 gomitas 30 minutos antes de dormir.',
 'Para personas con estrés, ansiedad nocturna o dificultades para relajarse.',
 NULL,
 true, now(), now()),

-- p12 Magnesol Efervescente
('da000012-0000-0000-0000-000000000000',
 'Magnesol Efervescente Naranja Dr. Pérez Albela 33 Sobres',
 'magnesol-efervescente-naranja-dr-perez-albela-33sobres',
 'Magnesio efervescente con vitamina B6 y zinc. Apoya el sistema nervioso, reduce la fatiga y mejora la calidad del sueño.',
 'Magnesol',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162136-1200-auto?v=638714515589470000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162136-1200-auto?v=638714515589470000&width=1200&height=auto&aspect=true'],
 'Disolver 1 sobre en 200 ml de agua. Tomar 1 vez al día, preferentemente en la noche.',
 'Personas con estrés, fatiga muscular, calambres o dificultades para dormir.',
 'No exceder la dosis recomendada.',
 true, now(), now()),

-- p16 Vitamina D3 Sundown
('da000016-0000-0000-0000-000000000000',
 'Vitamina D3 5000 UI Sundown Naturals',
 'vitamina-d3-5000ui-sundown-naturals',
 'Vitamina D3 de alta potencia (5,000 UI) en cápsulas blandas. Esencial para huesos, sistema inmune y estado de ánimo.',
 'Sundown Naturals',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162233/Vitamina-D3-5000IU.png?v=638719666698530000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162233/Vitamina-D3-5000IU.png?v=638719666698530000'],
 'Tomar 1 cápsula blanda al día con alimentos que contengan grasa.',
 'Para personas con déficit de vitamina D, baja inmunidad o poca exposición solar.',
 'No exceder la dosis sin indicación médica.',
 true, now(), now()),

-- p17 Omega 3-6-7-9 Natures Truth
('da000017-0000-0000-0000-000000000000',
 'Omega 3-6-7-9 Natures Truth Vegan 50 Gomitas',
 'omega-3-6-7-9-natures-truth-vegan-50gomitas',
 'Gomitas veganas con omega 3, 6, 7 y 9 de fuentes vegetales. Apoya la salud cardiovascular, cerebral y reducción de inflamación.',
 'Natures Truth',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162635-1200-auto?v=638768128033300000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162635-1200-auto?v=638768128033300000&width=1200&height=auto&aspect=true'],
 'Tomar 2 gomitas al día con alimentos.',
 'Para salud cardiovascular, cerebral, piel y reducción de inflamación.',
 NULL,
 true, now(), now()),

-- p18 Stress Formula Complejo B Mason
('da000018-0000-0000-0000-000000000000',
 'Stress Formula Complejo B con Antioxidantes + Zinc Mason Natural 60 Tabletas',
 'stress-formula-complejo-b-zinc-mason-natural-60tab',
 'Fórmula antiestrés con vitaminas del complejo B, antioxidantes y zinc. Apoya el sistema nervioso, combate la fatiga y refuerza el sistema inmune.',
 'Mason Naturals',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162881-1200-auto?v=638956267681070000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162881-1200-auto?v=638956267681070000&width=1200&height=auto&aspect=true'],
 'Tomar 1 tableta al día con alimentos.',
 'Personas con estrés, fatiga mental o que necesiten apoyo del sistema nervioso.',
 NULL,
 true, now(), now()),

-- p25 Zinc Mason Natural
('da000025-0000-0000-0000-000000000000',
 'Zinc Mason Natural 30mg 100 Tabletas',
 'zinc-mason-natural-30mg-100tabletas',
 'Zinc gluconato de alta potencia. Apoya la formación de tejidos, sistema inmune, piel, cabello y uñas.',
 'Mason Naturals',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162262-1200-auto?v=638723802794200000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162262-1200-auto?v=638723802794200000&width=1200&height=auto&aspect=true'],
 'Tomar 1 tableta al día con alimentos.',
 'Para fortalecer el sistema inmune, mejorar piel, cabello, uñas y fertilidad.',
 NULL,
 true, now(), now()),

-- p26 K2 + D3 Mason Naturals
('da000026-0000-0000-0000-000000000000',
 'K2 + D3 Mason Naturals 60 Tabletas',
 'k2-d3-mason-naturals-60tabletas',
 'Combinación de vitamina K2 (MK-7) y D3 para maximizar la absorción y utilización del calcio. Esencial para huesos y salud cardiovascular.',
 'Mason Naturals',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/164047/k2-d3.png?v=639002112280030000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/164047/k2-d3.png?v=639002112280030000'],
 'Tomar 1 tableta al día con alimentos.',
 'Para salud ósea, cardiovascular y personas con déficit de vitamina D.',
 NULL,
 true, now(), now()),

-- p27 Vitamina E Mason Natural
('da000027-0000-0000-0000-000000000000',
 'Vitamina E Mason Natural 450mg 50 Softgels',
 'vitamina-e-mason-natural-450mg-50softgels',
 'Vitamina E natural en forma de alfa-tocoferol. Potente antioxidante que protege las células, apoya la piel y el sistema cardiovascular.',
 'Mason Naturals',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162263-1200-auto?v=638723803418900000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162263-1200-auto?v=638723803418900000&width=1200&height=auto&aspect=true'],
 'Tomar 1 softgel al día con alimentos.',
 'Para protección antioxidante, salud de la piel y sistema cardiovascular.',
 NULL,
 true, now(), now()),

-- p28 Vitamina B12 Mason Natural
('da000028-0000-0000-0000-000000000000',
 'Vitamina B12 Mason Natural 1000mcg 100 Tabletas',
 'vitamina-b12-mason-natural-1000mcg-100tabletas',
 'Vitamina B12 de alta potencia (1,000 mcg) en tabletas de rápida absorción. Esencial para el sistema nervioso, energía y formación de glóbulos rojos.',
 'Mason Naturals',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162251-1200-auto?v=638723791082100000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162251-1200-auto?v=638723791082100000&width=1200&height=auto&aspect=true'],
 'Tomar 1 tableta al día, preferiblemente en ayunas.',
 'Para veganos, personas mayores, con fatiga o anemia.',
 NULL,
 true, now(), now()),

-- p29 Calcio Magnesio Zinc + Vit D Xtralife
('da000029-0000-0000-0000-000000000000',
 'Calcio Magnesio Zinc + Vitamina D Xtralife 100 Tabletas',
 'calcio-magnesio-zinc-vitamina-d-xtralife-100tabletas',
 'Fórmula completa con calcio, magnesio, zinc y vitamina D. Apoya la salud ósea, muscular y el sistema inmune en una sola tableta.',
 'Xtralife',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162208-1200-auto?v=638718799671230000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162208-1200-auto?v=638718799671230000&width=1200&height=auto&aspect=true'],
 'Tomar 1–2 tabletas al día con alimentos.',
 'Para salud ósea, muscular y personas que buscan un complemento mineral completo.',
 NULL,
 true, now(), now()),

-- p30 Multivitamínico Lab Nutrition
('da000030-0000-0000-0000-000000000000',
 'Multivitamínico para Adultos Lab Nutrition 90 Cápsulas',
 'multivitaminico-adultos-lab-nutrition-90capsulas',
 'Multivitamínico completo con más de 20 vitaminas y minerales esenciales. Formulado para adultos activos que buscan cubrir sus necesidades nutricionales diarias.',
 'Lab Nutrition',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/162172/MULTIVITAMIN-LAB-NUTRITION-90TAB.png?v=638716230925870000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162172/MULTIVITAMIN-LAB-NUTRITION-90TAB.png?v=638716230925870000'],
 'Tomar 3 cápsulas al día con el desayuno.',
 'Para adultos que buscan cubrir deficiencias nutricionales y mantener su energía.',
 NULL,
 true, now(), now()),

-- p31 Colágeno Arándanos Terra Sana
('da000031-0000-0000-0000-000000000000',
 'Colágeno con Arándanos Premium Terra Sana 300g',
 'colageno-arandanos-premium-terra-sana-300g',
 'Colágeno hidrolizado premium enriquecido con arándanos ricos en antioxidantes. Apoya la piel, articulaciones y proporciona protección antioxidante.',
 'Terra Sana',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/161040-1200-auto?v=638260927312630000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/161040-1200-auto?v=638260927312630000&width=1200&height=auto&aspect=true'],
 'Disolver 1 medida en 200 ml de agua o jugo. Tomar en ayunas.',
 'Para quienes buscan mejorar la elasticidad de la piel y salud articular.',
 NULL,
 true, now(), now()),

-- p40 Probiótico Woman Flora Interior
('da000040-0000-0000-0000-000000000000',
 'Probiótico Woman ProBerry Flora Interior 12 Sobres',
 'probiotico-woman-proberry-flora-interior-12sobres',
 'Probiótico especializado para la mujer con cepas Lactobacillus. Apoya la flora vaginal, digestiva y refuerza el sistema inmune femenino.',
 'Flora Interior',
 '11111111-0000-0000-0000-000000000004',
 'https://organaperu.vtexassets.com/arquivos/ids/163904-1200-auto?v=638968470201530000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163904-1200-auto?v=638968470201530000&width=1200&height=auto&aspect=true'],
 'Disolver 1 sobre al día en agua fresca. Tomar en ayunas.',
 'Para mujeres que buscan equilibrio de flora intestinal y vaginal.',
 NULL,
 true, now(), now()),

-- ── GYM & PROTEÍNAS ────────────────────────────────────────────

-- p07 Creatina Lab Nutrition
('da000007-0000-0000-0000-000000000000',
 'Creatina Micronizada Power Lab Nutrition 500g',
 'creatina-micronizada-power-lab-nutrition-500g',
 'Creatina monohidratada micronizada de alta pureza para maximizar la fuerza, potencia y recuperación muscular. Sin sabor, de fácil mezcla.',
 'Lab Nutrition',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/163620-1200-auto?v=638921011836900000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163620-1200-auto?v=638921011836900000&width=1200&height=auto&aspect=true'],
 'Mezclar 5 g (1 scoop) en 200–300 ml de agua o jugo. Consumir antes o después del entrenamiento.',
 'Deportistas que buscan aumentar fuerza, potencia y masa muscular.',
 'No recomendado para personas con problemas renales. Mantener buena hidratación.',
 true, now(), now()),

-- p08 Pre-Workout QNT
('da000008-0000-0000-0000-000000000000',
 'Pre-Workout QNT 390g',
 'pre-workout-qnt-390g',
 'Pre-entrenamiento con cafeína, beta-alanina y citrulina para máximo rendimiento, energía y foco. Sabor limón refrescante.',
 'QNT',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/162064-1200-auto?v=638678959317800000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162064-1200-auto?v=638678959317800000&width=1200&height=auto&aspect=true'],
 'Mezclar 1 scoop en 300 ml de agua fría. Consumir 20–30 minutos antes del entrenamiento.',
 'Deportistas que buscan mayor energía, resistencia y foco durante el entrenamiento.',
 'No recomendado para personas sensibles a la cafeína, embarazadas o menores de 18 años.',
 true, now(), now()),

-- p09 Citrato Magnesio Smartblend 400g
('da000009-0000-0000-0000-000000000000',
 'Citrato de Magnesio Smart Blends 400g',
 'citrato-de-magnesio-smart-blends-400g',
 'Citrato de magnesio en polvo de alta biodisponibilidad. Apoya la recuperación muscular, el sueño reparador y el sistema nervioso.',
 'Smartblend',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/164273-1200-auto?v=639062745292400000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/164273-1200-auto?v=639062745292400000&width=1200&height=auto&aspect=true'],
 'Disolver 1 medida en 300 ml de agua. Tomar preferentemente antes de dormir.',
 'Deportistas, personas con calambres musculares o dificultad para dormir.',
 NULL,
 true, now(), now()),

-- p32 Creatina Applied Nutrition
('da000032-0000-0000-0000-000000000000',
 'Creatina Monohidratada Applied Nutrition 500g',
 'creatina-monohidratada-applied-nutrition-500g',
 'Creatina monohidratada pura sin sabor de Applied Nutrition. Aumenta la fuerza, potencia y masa muscular. De fácil mezcla.',
 'Applied Nutrition',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/163903-1200-auto?v=639142808423530000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163903-1200-auto?v=639142808423530000&width=1200&height=auto&aspect=true'],
 'Mezclar 5 g en 300 ml de agua o batido proteico. Tomar post-entrenamiento.',
 'Para deportistas que buscan aumentar rendimiento, fuerza y masa muscular.',
 'Mantener buena hidratación. No usar en caso de problemas renales.',
 true, now(), now()),

-- p33 L-Glutamina Drasanvi
('da000033-0000-0000-0000-000000000000',
 'L-Glutamina Sabor Limón Drasanvi 300g',
 'l-glutamina-limon-drasanvi-300g',
 'L-Glutamina en polvo con sabor a limón. Favorece la recuperación muscular, salud intestinal y sistema inmune post-entrenamiento.',
 'Drasanvi',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/162074-1200-auto?v=638684309038170000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162074-1200-auto?v=638684309038170000&width=1200&height=auto&aspect=true'],
 'Disolver 5 g en 300 ml de agua. Tomar post-entrenamiento o antes de dormir.',
 'Para deportistas que buscan reducir la fatiga y mejorar la recuperación.',
 NULL,
 true, now(), now()),

-- p34 Proteína Tarwi Smartblend
('da000034-0000-0000-0000-000000000000',
 'Proteína de Tarwi en Polvo Smart Blends 500g',
 'proteina-tarwi-smart-blends-500g',
 'Proteína vegetal de tarwi (chocho andino) en polvo. Planta andina con alto contenido proteico, ideal para veganos y quienes buscan proteína de origen natural.',
 'Smartblend',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/164222-1200-auto?v=639057337221970000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/164222-1200-auto?v=639057337221970000&width=1200&height=auto&aspect=true'],
 'Mezclar 30 g en agua, leche vegetal o batidos. 1–2 veces al día.',
 'Para veganos, vegetarianos y quienes buscan proteína vegetal andina.',
 NULL,
 true, now(), now()),

-- p35 Whey QNT
('da000035-0000-0000-0000-000000000000',
 'Proteína Whey Light Digest Coco QNT 500g',
 'proteina-whey-light-digest-coco-qnt-500g',
 'Proteína whey de fácil digestión con sabor a coco. Con enzimas digestivas para mejor absorción. 22 g de proteína por servicio.',
 'QNT',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/162408-1200-auto?v=638733337938100000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162408-1200-auto?v=638733337938100000&width=1200&height=auto&aspect=true'],
 'Mezclar 30 g en 250 ml de agua o leche. Tomar post-entrenamiento.',
 'Para deportistas que buscan proteína de calidad con buena digestibilidad.',
 NULL,
 true, now(), now()),

-- p36 Citrato Magnesio Drasanvi tabletas
('da000036-0000-0000-0000-000000000000',
 'Citrato de Magnesio Drasanvi 60 Tabletas',
 'citrato-magnesio-drasanvi-60tabletas',
 'Citrato de magnesio en tabletas para máxima biodisponibilidad. Alivia calambres, mejora el sueño y apoya el sistema nervioso.',
 'Drasanvi',
 '11111111-0000-0000-0000-000000000002',
 'https://organaperu.vtexassets.com/arquivos/ids/161126/Drasanvi-Citrato-De-Magnesio-60Tab-.png?v=638314474982430000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/161126/Drasanvi-Citrato-De-Magnesio-60Tab-.png?v=638314474982430000'],
 'Tomar 2 tabletas al día con abundante agua.',
 'Para deportistas con calambres, estrés o dificultades para dormir.',
 NULL,
 true, now(), now()),

-- ── SKIN CARE ──────────────────────────────────────────────────

-- p19 Shampoo Biotina Drasanvi
('da000019-0000-0000-0000-000000000000',
 'Champú con Biotina + Aloe Vera Drasanvi 1 L',
 'champu-biotina-aloe-vera-drasanvi-1l',
 'Champú con biotina y aloe vera para fortalecer el cabello desde la raíz. Apto para todo tipo de cabello. Sin parabenos ni sulfatos agresivos.',
 'Drasanvi',
 '11111111-0000-0000-0000-000000000003',
 'https://organaperu.vtexassets.com/arquivos/ids/162689-1200-auto?v=638769755362030000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162689-1200-auto?v=638769755362030000&width=1200&height=auto&aspect=true'],
 'Aplicar sobre cabello húmedo, masajear el cuero cabelludo y enjuagar. Usar regularmente.',
 'Para cabello débil, con caída o que necesita nutrición.',
 NULL,
 true, now(), now()),

-- p20 Shampoo Argán Drasanvi
('da000020-0000-0000-0000-000000000000',
 'Champú de Argán Ecocert Bio Drasanvi 500ml',
 'champu-argan-ecocert-bio-drasanvi-500ml',
 'Champú con aceite de argán certificado Ecocert. Nutre, hidrata y aporta brillo al cabello seco o dañado. Fórmula bio sin químicos agresivos.',
 'Drasanvi',
 '11111111-0000-0000-0000-000000000003',
 'https://organaperu.vtexassets.com/arquivos/ids/162694-1200-auto?v=638770587771130000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162694-1200-auto?v=638770587771130000&width=1200&height=auto&aspect=true'],
 'Aplicar en cabello mojado, masajear suavemente y enjuagar. Repetir si es necesario.',
 'Para cabello seco, teñido o dañado que necesita nutrición intensa.',
 NULL,
 true, now(), now()),

-- p21 Karica Acondicionador
('da000021-0000-0000-0000-000000000000',
 'Karica Acondicionador Aroma Floral 260ml',
 'karica-acondicionador-aroma-floral-260ml',
 'Acondicionador con aroma floral que desenreda, suaviza y protege el cabello. Fórmula con ingredientes naturales.',
 'Karica',
 '11111111-0000-0000-0000-000000000003',
 'https://organaperu.vtexassets.com/arquivos/ids/162647-1200-auto?v=638768795015700000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162647-1200-auto?v=638768795015700000&width=1200&height=auto&aspect=true'],
 'Aplicar sobre cabello lavado, dejar actuar 2–3 minutos y enjuagar.',
 'Para todo tipo de cabello que necesita suavidad y nutrición.',
 NULL,
 true, now(), now()),

-- p37 Karica Shampoo
('da000037-0000-0000-0000-000000000000',
 'Karica Shampoo Aroma Floral 260ml',
 'karica-shampoo-aroma-floral-260ml',
 'Shampoo con aroma floral que limpia, nutre y aporta brillo. Formulado con ingredientes naturales, libre de sulfatos agresivos.',
 'Karica',
 '11111111-0000-0000-0000-000000000003',
 'https://organaperu.vtexassets.com/arquivos/ids/162649/shampoo%20aroma%20floral%20x260.png.png?v=638768795447830000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162649/shampoo%20aroma%20floral%20x260.png.png?v=638768795447830000'],
 'Aplicar en cabello húmedo, masajear y enjuagar. Usar en cada lavado.',
 'Para todo tipo de cabello que necesita nutrición y brillo.',
 NULL,
 true, now(), now()),

-- ── ORGÁNICOS ─────────────────────────────────────────────────

-- p13 Psyllium
('da000013-0000-0000-0000-000000000000',
 'Psyllium Vivir Power Snacks 284g',
 'psyllium-vivir-power-snacks-284g',
 'Cáscaras de psyllium (plantago ovata) con 86% de fibra. Apoya el tránsito intestinal, la saciedad y los niveles de glucosa.',
 'Vivir Power Snacks',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/162519-1200-auto?v=638806902983600000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162519-1200-auto?v=638806902983600000&width=1200&height=auto&aspect=true'],
 'Mezclar 5 g (1 cucharada) en 300 ml de agua o jugo. Consumir inmediatamente.',
 'Para mejorar el tránsito intestinal, control del azúcar y saciedad.',
 'Tomar con abundante agua. No recomendado si hay obstrucción intestinal.',
 true, now(), now()),

-- p14 Inulina
('da000014-0000-0000-0000-000000000000',
 'Inulina Vivir Power Snacks 250g',
 'inulina-vivir-power-snacks-250g',
 'Inulina en polvo extraída de achicoria. Prebiótico natural que alimenta la flora intestinal beneficiosa y mejora la digestión.',
 'Vivir Power Snacks',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/162510/inulina.png.png?v=638761872120200000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162510/inulina.png.png?v=638761872120200000'],
 'Agregar 5 g a bebidas, yogur, batidos o comidas. 1–2 veces al día.',
 'Para mejorar la microbiota intestinal, digestión y sistema inmune.',
 NULL,
 true, now(), now()),

-- p15 Alcachofa Biocenter
('da000015-0000-0000-0000-000000000000',
 'Alcachofa Biocenter 200g',
 'alcachofa-biocenter-200g',
 'Extracto de alcachofa en polvo. Apoya la función hepática, facilita la digestión y favorece el drenaje de líquidos.',
 'Biocenter',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/162544/alcachofa-en-polvo.png.png?v=638810288675870000',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162544/alcachofa-en-polvo.png.png?v=638810288675870000'],
 'Disolver 1 cucharadita en 200 ml de agua tibia. Tomar antes de las comidas.',
 'Para quienes buscan apoyar su hígado, facilitar la digestión o depurar el organismo.',
 'Consultar con médico en caso de cálculos biliares.',
 true, now(), now()),

-- p22 Dúo Bienestar Riwi
('da000022-0000-0000-0000-000000000000',
 'Dúo Bienestar: Golden Latte + Reishi Cacao Riwi',
 'duo-bienestar-golden-latte-reishi-cacao-riwi',
 'Pack de dos superalimentos funcionales: Golden Latte (cúrcuma + jengibre + pimienta) y Reishi Cacao (hongo reishi + cacao puro). Antiinflamatorio, adaptógeno y relajante.',
 'Riwi',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/164214-1200-auto?v=639054101370570000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/164214-1200-auto?v=639054101370570000&width=1200&height=auto&aspect=true'],
 'Mezclar 1 cucharadita (5 g) en leche vegetal caliente o fría. Endulzar al gusto.',
 'Para personas que buscan un estilo de vida saludable y reducir la inflamación.',
 NULL,
 true, now(), now()),

-- p23 Energy Blend Smartblend
('da000023-0000-0000-0000-000000000000',
 'Energy Blend Superalimento Smart Blends 420g',
 'energy-blend-superalimento-smart-blends-420g',
 'Mix de superalimentos andinos y naturales: maca, espirulina, cúrcuma, jengibre y más. Para energía sostenida, nutrición densa y bienestar general.',
 'Smartblend',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/162149-1200-auto?v=638715142148000000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162149-1200-auto?v=638715142148000000&width=1200&height=auto&aspect=true'],
 'Mezclar 10 g en agua, jugo, batidos o smoothies. 1–2 veces al día.',
 'Para personas activas que buscan energía natural y nutrición densa.',
 NULL,
 true, now(), now()),

-- p24 Cúrcuma Pimienta Kion Lima Naturals
('da000024-0000-0000-0000-000000000000',
 'Cúrcuma Pimienta y Kion Lima Naturals 500g',
 'curcuma-pimienta-kion-lima-naturals-500g',
 'Mezcla de cúrcuma, pimienta negra y kion (jengibre) en polvo. La pimienta potencia la absorción de curcumina hasta 2,000%. Antiinflamatorio natural.',
 'Lima Naturals',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/162717-1200-auto?v=638808641055330000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/162717-1200-auto?v=638808641055330000&width=1200&height=auto&aspect=true'],
 'Agregar 1/2 cucharadita a bebidas, leche dorada, sopas o comidas. 1–2 veces al día.',
 'Para personas con inflamación, dolores articulares o que buscan un boost inmune.',
 'Consultar con médico si toma anticoagulantes.',
 true, now(), now()),

-- p38 Moringa Benatural
('da000038-0000-0000-0000-000000000000',
 'Moringa en Polvo BeNatural 200g',
 'moringa-polvo-benatural-200g',
 'Moringa oleífera en polvo con alto contenido de vitaminas, minerales y aminoácidos. Superfood con propiedades antiinflamatorias y antioxidantes.',
 'Be Natural',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/163481-1200-auto?v=638891632904900000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163481-1200-auto?v=638891632904900000&width=1200&height=auto&aspect=true'],
 'Mezclar 1 cucharadita (5 g) en agua, jugos o batidos. 1–2 veces al día.',
 'Para personas que buscan nutrición densa, energía natural y propiedades antiinflamatorias.',
 NULL,
 true, now(), now()),

-- p39 Pack Bienestar Nua
('da000039-0000-0000-0000-000000000000',
 'Pack Bienestar: Digestión Menta Jengibre + Pasifloral Nua',
 'pack-bienestar-digestion-menta-jengibre-pasifloral-nua',
 'Pack doble de Nua: Digestión (menta + jengibre para el sistema digestivo) y Pasifloral (pasiflora para calmar y relajar). Bienestar desde adentro.',
 'Nua',
 '11111111-0000-0000-0000-000000000001',
 'https://organaperu.vtexassets.com/arquivos/ids/163930-1200-auto?v=638970101040800000&width=1200&height=auto&aspect=true',
 ARRAY['https://organaperu.vtexassets.com/arquivos/ids/163930-1200-auto?v=638970101040800000&width=1200&height=auto&aspect=true'],
 'Digestión: 20 gotas en agua antes de comer. Pasifloral: 30 gotas en agua 30 min antes de dormir.',
 'Para mejorar la digestión y reducir el estrés o ansiedad naturalmente.',
 NULL,
 true, now(), now());


-- ─────────────────────────────────────────────────────────────
-- 2. PRODUCT VARIANTS (uno por producto)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.product_variants (id, product_id, sku, name, weight_grams, is_active, created_at)
VALUES
-- Vitaminas
('db000001-0000-0000-0000-000000000000', 'da000001-0000-0000-0000-000000000000', 'COL-C-PN-500',      '500 g',              500,  true, now()),
('db000002-0000-0000-0000-000000000000', 'da000002-0000-0000-0000-000000000000', 'COL-BIO-PN-500',    '500 g',              500,  true, now()),
('db000003-0000-0000-0000-000000000000', 'da000003-0000-0000-0000-000000000000', 'BIO-NT-50G',        '50 gomitas',          60,  true, now()),
('db000004-0000-0000-0000-000000000000', 'da000004-0000-0000-0000-000000000000', 'GLC-MN-60T',        '60 tabletas',        120,  true, now()),
('db000005-0000-0000-0000-000000000000', 'da000005-0000-0000-0000-000000000000', 'COL-MAR-DR-300',    '300 g',              300,  true, now()),
('db000006-0000-0000-0000-000000000000', 'da000006-0000-0000-0000-000000000000', 'MAG-XTL-60C',       '60 cápsulas',         90,  true, now()),
('db000010-0000-0000-0000-000000000000', 'da000010-0000-0000-0000-000000000000', 'GUD-YG-90G',        '90 gomitas',         135,  true, now()),
('db000011-0000-0000-0000-000000000000', 'da000011-0000-0000-0000-000000000000', 'BACH-RNT-60G',      '60 gomitas',          90,  true, now()),
('db000012-0000-0000-0000-000000000000', 'da000012-0000-0000-0000-000000000000', 'MGL-EFV-33S',       '33 sobres',           99,  true, now()),
('db000016-0000-0000-0000-000000000000', 'da000016-0000-0000-0000-000000000000', 'VIT-D3-SD-90S',     'Frasco 90 softgels',  90,  true, now()),
('db000017-0000-0000-0000-000000000000', 'da000017-0000-0000-0000-000000000000', 'OMG-NT-50G',        '50 gomitas',          75,  true, now()),
('db000018-0000-0000-0000-000000000000', 'da000018-0000-0000-0000-000000000000', 'STR-MN-60T',        '60 tabletas',         90,  true, now()),
('db000025-0000-0000-0000-000000000000', 'da000025-0000-0000-0000-000000000000', 'ZNC-MN-100T',       '100 tabletas',       120,  true, now()),
('db000026-0000-0000-0000-000000000000', 'da000026-0000-0000-0000-000000000000', 'K2D3-MN-60T',       '60 tabletas',         60,  true, now()),
('db000027-0000-0000-0000-000000000000', 'da000027-0000-0000-0000-000000000000', 'VITE-MN-50SG',      '50 softgels',         75,  true, now()),
('db000028-0000-0000-0000-000000000000', 'da000028-0000-0000-0000-000000000000', 'B12-MN-100T',       '100 tabletas',       100,  true, now()),
('db000029-0000-0000-0000-000000000000', 'da000029-0000-0000-0000-000000000000', 'CAL-XTL-100T',      '100 tabletas',       150,  true, now()),
('db000030-0000-0000-0000-000000000000', 'da000030-0000-0000-0000-000000000000', 'MLT-LN-90C',        '90 cápsulas',        135,  true, now()),
('db000031-0000-0000-0000-000000000000', 'da000031-0000-0000-0000-000000000000', 'COL-ARN-TS-300',    '300 g',              300,  true, now()),
('db000040-0000-0000-0000-000000000000', 'da000040-0000-0000-0000-000000000000', 'PRB-WOM-FI-12S',    '12 sobres',           60,  true, now()),
-- Gym & Proteínas
('db000007-0000-0000-0000-000000000000', 'da000007-0000-0000-0000-000000000000', 'CRE-LN-500',        '500 g',              500,  true, now()),
('db000008-0000-0000-0000-000000000000', 'da000008-0000-0000-0000-000000000000', 'PRW-QNT-390',       '390 g',              390,  true, now()),
('db000009-0000-0000-0000-000000000000', 'da000009-0000-0000-0000-000000000000', 'CTM-SB-400',        '400 g',              400,  true, now()),
('db000032-0000-0000-0000-000000000000', 'da000032-0000-0000-0000-000000000000', 'CRE-AN-500',        '500 g',              500,  true, now()),
('db000033-0000-0000-0000-000000000000', 'da000033-0000-0000-0000-000000000000', 'GLT-DR-300',        '300 g',              300,  true, now()),
('db000034-0000-0000-0000-000000000000', 'da000034-0000-0000-0000-000000000000', 'PTW-SB-500',        '500 g',              500,  true, now()),
('db000035-0000-0000-0000-000000000000', 'da000035-0000-0000-0000-000000000000', 'WHY-QNT-500',       '500 g',              500,  true, now()),
('db000036-0000-0000-0000-000000000000', 'da000036-0000-0000-0000-000000000000', 'CTM-DR-60T',        '60 tabletas',         90,  true, now()),
-- Skin Care
('db000019-0000-0000-0000-000000000000', 'da000019-0000-0000-0000-000000000000', 'SHP-BIO-DR-1L',     '1 L',               1000,  true, now()),
('db000020-0000-0000-0000-000000000000', 'da000020-0000-0000-0000-000000000000', 'SHP-ARG-DR-500',    '500 ml',             500,  true, now()),
('db000021-0000-0000-0000-000000000000', 'da000021-0000-0000-0000-000000000000', 'ACN-KRC-260',       '260 ml',             260,  true, now()),
('db000037-0000-0000-0000-000000000000', 'da000037-0000-0000-0000-000000000000', 'SHP-KRC-260',       '260 ml',             260,  true, now()),
-- Orgánicos
('db000013-0000-0000-0000-000000000000', 'da000013-0000-0000-0000-000000000000', 'PSY-VPS-284',       '284 g',              284,  true, now()),
('db000014-0000-0000-0000-000000000000', 'da000014-0000-0000-0000-000000000000', 'INU-VPS-250',       '250 g',              250,  true, now()),
('db000015-0000-0000-0000-000000000000', 'da000015-0000-0000-0000-000000000000', 'ALC-BIO-200',       '200 g',              200,  true, now()),
('db000022-0000-0000-0000-000000000000', 'da000022-0000-0000-0000-000000000000', 'DUO-RWI-2PK',       'Pack 2 unidades',    200,  true, now()),
('db000023-0000-0000-0000-000000000000', 'da000023-0000-0000-0000-000000000000', 'ENR-SB-420',        '420 g',              420,  true, now()),
('db000024-0000-0000-0000-000000000000', 'da000024-0000-0000-0000-000000000000', 'CUR-LN-500',        '500 g',              500,  true, now()),
('db000038-0000-0000-0000-000000000000', 'da000038-0000-0000-0000-000000000000', 'MRG-BN-200',        '200 g',              200,  true, now()),
('db000039-0000-0000-0000-000000000000', 'da000039-0000-0000-0000-000000000000', 'PKG-NUA-2PK',       'Pack 2 unidades',    120,  true, now());


-- ─────────────────────────────────────────────────────────────
-- 3. PRODUCT PRICES (PEN, en centavos)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.product_prices (id, variant_id, currency, amount_cents, compare_at_cents, effective_from, effective_to)
VALUES
-- Vitaminas
(gen_random_uuid(), 'db000001-0000-0000-0000-000000000000', 'PEN', 10090,  NULL,  now(), NULL),  -- S/. 100.90
(gen_random_uuid(), 'db000002-0000-0000-0000-000000000000', 'PEN', 11000,  NULL,  now(), NULL),  -- S/. 110.00
(gen_random_uuid(), 'db000003-0000-0000-0000-000000000000', 'PEN',  9990,  NULL,  now(), NULL),  -- S/.  99.90
(gen_random_uuid(), 'db000004-0000-0000-0000-000000000000', 'PEN', 15750, 17500, now(), NULL),   -- S/. 157.50 (comp. 175)
(gen_random_uuid(), 'db000005-0000-0000-0000-000000000000', 'PEN', 13500,  NULL,  now(), NULL),  -- S/. 135.00
(gen_random_uuid(), 'db000006-0000-0000-0000-000000000000', 'PEN',  4990,  NULL,  now(), NULL),  -- S/.  49.90
(gen_random_uuid(), 'db000010-0000-0000-0000-000000000000', 'PEN',  7490,  NULL,  now(), NULL),  -- S/.  74.90
(gen_random_uuid(), 'db000011-0000-0000-0000-000000000000', 'PEN', 12000,  NULL,  now(), NULL),  -- S/. 120.00
(gen_random_uuid(), 'db000012-0000-0000-0000-000000000000', 'PEN',  3950,  NULL,  now(), NULL),  -- S/.  39.50
(gen_random_uuid(), 'db000016-0000-0000-0000-000000000000', 'PEN', 15000,  NULL,  now(), NULL),  -- S/. 150.00
(gen_random_uuid(), 'db000017-0000-0000-0000-000000000000', 'PEN', 10990,  NULL,  now(), NULL),  -- S/. 109.90
(gen_random_uuid(), 'db000018-0000-0000-0000-000000000000', 'PEN',  5841,  6590, now(), NULL),   -- S/.  58.41 (comp. 65.90)
(gen_random_uuid(), 'db000025-0000-0000-0000-000000000000', 'PEN',  5931,  6590, now(), NULL),   -- S/.  59.31 (comp. 65.90)
(gen_random_uuid(), 'db000026-0000-0000-0000-000000000000', 'PEN',  7011,  NULL,  now(), NULL),  -- S/.  70.11
(gen_random_uuid(), 'db000027-0000-0000-0000-000000000000', 'PEN', 10800,  NULL,  now(), NULL),  -- S/. 108.00
(gen_random_uuid(), 'db000028-0000-0000-0000-000000000000', 'PEN',  9531,  NULL,  now(), NULL),  -- S/.  95.31
(gen_random_uuid(), 'db000029-0000-0000-0000-000000000000', 'PEN',  6690,  NULL,  now(), NULL),  -- S/.  66.90
(gen_random_uuid(), 'db000030-0000-0000-0000-000000000000', 'PEN', 12900,  NULL,  now(), NULL),  -- S/. 129.00
(gen_random_uuid(), 'db000031-0000-0000-0000-000000000000', 'PEN',  6990,  NULL,  now(), NULL),  -- S/.  69.90
(gen_random_uuid(), 'db000040-0000-0000-0000-000000000000', 'PEN',  6090,  NULL,  now(), NULL),  -- S/.  60.90
-- Gym & Proteínas
(gen_random_uuid(), 'db000007-0000-0000-0000-000000000000', 'PEN', 17900,  NULL,  now(), NULL),  -- S/. 179.00
(gen_random_uuid(), 'db000008-0000-0000-0000-000000000000', 'PEN', 14990,  NULL,  now(), NULL),  -- S/. 149.90
(gen_random_uuid(), 'db000009-0000-0000-0000-000000000000', 'PEN',  8490,  NULL,  now(), NULL),  -- S/.  84.90
(gen_random_uuid(), 'db000032-0000-0000-0000-000000000000', 'PEN',  9891,  NULL,  now(), NULL),  -- S/.  98.91
(gen_random_uuid(), 'db000033-0000-0000-0000-000000000000', 'PEN', 11200,  NULL,  now(), NULL),  -- S/. 112.00
(gen_random_uuid(), 'db000034-0000-0000-0000-000000000000', 'PEN',  3411,  NULL,  now(), NULL),  -- S/.  34.11
(gen_random_uuid(), 'db000035-0000-0000-0000-000000000000', 'PEN',  9990,  NULL,  now(), NULL),  -- S/.  99.90
(gen_random_uuid(), 'db000036-0000-0000-0000-000000000000', 'PEN',  3990,  NULL,  now(), NULL),  -- S/.  39.90
-- Skin Care
(gen_random_uuid(), 'db000019-0000-0000-0000-000000000000', 'PEN',  6000,  NULL,  now(), NULL),  -- S/.  60.00
(gen_random_uuid(), 'db000020-0000-0000-0000-000000000000', 'PEN',  6000,  NULL,  now(), NULL),  -- S/.  60.00
(gen_random_uuid(), 'db000021-0000-0000-0000-000000000000', 'PEN',  5590,  NULL,  now(), NULL),  -- S/.  55.90
(gen_random_uuid(), 'db000037-0000-0000-0000-000000000000', 'PEN',  5590,  NULL,  now(), NULL),  -- S/.  55.90
-- Orgánicos
(gen_random_uuid(), 'db000013-0000-0000-0000-000000000000', 'PEN',  4990,  NULL,  now(), NULL),  -- S/.  49.90
(gen_random_uuid(), 'db000014-0000-0000-0000-000000000000', 'PEN',  3590,  NULL,  now(), NULL),  -- S/.  35.90
(gen_random_uuid(), 'db000015-0000-0000-0000-000000000000', 'PEN',  2190,  NULL,  now(), NULL),  -- S/.  21.90
(gen_random_uuid(), 'db000022-0000-0000-0000-000000000000', 'PEN', 10280,  NULL,  now(), NULL),  -- S/. 102.80
(gen_random_uuid(), 'db000023-0000-0000-0000-000000000000', 'PEN',  7590,  NULL,  now(), NULL),  -- S/.  75.90
(gen_random_uuid(), 'db000024-0000-0000-0000-000000000000', 'PEN',  4290,  NULL,  now(), NULL),  -- S/.  42.90
(gen_random_uuid(), 'db000038-0000-0000-0000-000000000000', 'PEN',  2392,  NULL,  now(), NULL),  -- S/.  23.92
(gen_random_uuid(), 'db000039-0000-0000-0000-000000000000', 'PEN',  8000,  NULL,  now(), NULL);  -- S/.  80.00


-- ─────────────────────────────────────────────────────────────
-- 4. KITS (8 kits temáticos)
-- ─────────────────────────────────────────────────────────────
-- Precio total visible en UI (suma de productos incluidos):
-- K01 Kit Colágeno Radiante        → S/. 311  (10090+11000+9990)
-- K02 Kit Articulaciones           → S/. 342  (15750+13500+4990)
-- K03 Kit Gym Performance          → S/. 414  (17900+14990+8490)
-- K04 Kit Sueño Profundo           → S/. 234  (7490+12000+3950)
-- K05 Kit Detox & Digestión        → S/. 108  (4990+3590+2190)
-- K06 Kit Vitaminas Esenciales     → S/. 319  (15000+10990+5841)
-- K07 Kit Cuidado Capilar          → S/. 176  (6000+6000+5590)
-- K08 Kit Bienestar Andino         → S/. 222  (10280+7590+4290)
INSERT INTO public.kits (id, name, slug, description, cover_image_url, type, is_active, created_at)
VALUES

('dc000001-0000-0000-0000-000000000000',
 'Kit Colágeno Radiante',
 'kit-colageno-radiante',
 'Belleza desde adentro. Colágeno + biotina para piel luminosa, cabello fuerte y uñas resistentes.',
 'https://organaperu.vtexassets.com/arquivos/ids/163092-1200-auto?v=638794019914900000&width=1200&height=auto&aspect=true',
 'static', true, now()),

('dc000002-0000-0000-0000-000000000000',
 'Kit Articulaciones & Movilidad',
 'kit-articulaciones-movilidad',
 'Para moverte sin límites. Glucosamina + colágeno marino + magnesio para articulaciones fuertes y flexibles.',
 'https://organaperu.vtexassets.com/arquivos/ids/162884-1200-auto?v=638956251160270000&width=1200&height=auto&aspect=true',
 'static', true, now()),

('dc000003-0000-0000-0000-000000000000',
 'Kit Gym Performance',
 'kit-gym-performance',
 'Entrena más fuerte, recupera mejor. Creatina + pre-workout + magnesio para alcanzar tu máximo rendimiento.',
 'https://organaperu.vtexassets.com/arquivos/ids/163620-1200-auto?v=638921011836900000&width=1200&height=auto&aspect=true',
 'static', true, now()),

('dc000004-0000-0000-0000-000000000000',
 'Kit Sueño Profundo',
 'kit-sueno-profundo',
 'Duerme de verdad. Melatonina + flores de Bach + magnesio para un descanso reparador sin dependencia.',
 'https://organaperu.vtexassets.com/arquivos/ids/163434-1200-auto?v=638861396794970000&width=1200&height=auto&aspect=true',
 'static', true, now()),

('dc000005-0000-0000-0000-000000000000',
 'Kit Detox & Digestión',
 'kit-detox-digestion',
 'Reset intestinal completo. Psyllium + inulina + alcachofa para limpiar, depurar y equilibrar desde adentro.',
 'https://organaperu.vtexassets.com/arquivos/ids/162519-1200-auto?v=638806902983600000&width=1200&height=auto&aspect=true',
 'static', true, now()),

('dc000006-0000-0000-0000-000000000000',
 'Kit Vitaminas Esenciales',
 'kit-vitaminas-esenciales',
 'Las bases de todo. Vitamina D3 + omega + complejo B para inmunidad, energía y sistema nervioso.',
 'https://organaperu.vtexassets.com/arquivos/ids/162233/Vitamina-D3-5000IU.png?v=638719666698530000',
 'static', true, now()),

('dc000007-0000-0000-0000-000000000000',
 'Kit Cuidado Capilar',
 'kit-cuidado-capilar',
 'Cabello que se nota. Champú biotina + champú argán + acondicionador para pelo fuerte, brillante y sin caída.',
 'https://organaperu.vtexassets.com/arquivos/ids/162689-1200-auto?v=638769755362030000&width=1200&height=auto&aspect=true',
 'static', true, now()),

('dc000008-0000-0000-0000-000000000000',
 'Kit Bienestar Andino',
 'kit-bienestar-andino',
 'Lo mejor de los Andes. Golden latte + energy blend + cúrcuma para energía natural, antiinflamación y bienestar diario.',
 'https://organaperu.vtexassets.com/arquivos/ids/164214-1200-auto?v=639054101370570000&width=1200&height=auto&aspect=true',
 'static', true, now());


-- ─────────────────────────────────────────────────────────────
-- 5. KIT_PRODUCTS (productos que componen cada kit)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
VALUES

-- Kit 1: Colágeno Radiante
('dc000001-0000-0000-0000-000000000000', 'db000001-0000-0000-0000-000000000000', 1, 1, true),  -- Colágeno C+
('dc000001-0000-0000-0000-000000000000', 'db000002-0000-0000-0000-000000000000', 1, 2, true),  -- Colágeno + Biotina
('dc000001-0000-0000-0000-000000000000', 'db000003-0000-0000-0000-000000000000', 1, 3, true),  -- Biotina 10,000MCG

-- Kit 2: Articulaciones & Movilidad
('dc000002-0000-0000-0000-000000000000', 'db000004-0000-0000-0000-000000000000', 1, 1, true),  -- Glucosamina Condroitina
('dc000002-0000-0000-0000-000000000000', 'db000005-0000-0000-0000-000000000000', 1, 2, true),  -- Colágeno Marino Cúrcuma
('dc000002-0000-0000-0000-000000000000', 'db000006-0000-0000-0000-000000000000', 1, 3, true),  -- Magnesio Xtralife

-- Kit 3: Gym Performance
('dc000003-0000-0000-0000-000000000000', 'db000007-0000-0000-0000-000000000000', 1, 1, true),  -- Creatina Lab Nutrition
('dc000003-0000-0000-0000-000000000000', 'db000008-0000-0000-0000-000000000000', 1, 2, true),  -- Pre-Workout QNT
('dc000003-0000-0000-0000-000000000000', 'db000009-0000-0000-0000-000000000000', 1, 3, true),  -- Citrato Magnesio Smart

-- Kit 4: Sueño Profundo
('dc000004-0000-0000-0000-000000000000', 'db000010-0000-0000-0000-000000000000', 1, 1, true),  -- Melatonina Yumi Gumi
('dc000004-0000-0000-0000-000000000000', 'db000011-0000-0000-0000-000000000000', 1, 2, true),  -- Flores Bach Rescue Night
('dc000004-0000-0000-0000-000000000000', 'db000012-0000-0000-0000-000000000000', 1, 3, true),  -- Magnesol Efervescente

-- Kit 5: Detox & Digestión
('dc000005-0000-0000-0000-000000000000', 'db000013-0000-0000-0000-000000000000', 1, 1, true),  -- Psyllium
('dc000005-0000-0000-0000-000000000000', 'db000014-0000-0000-0000-000000000000', 1, 2, true),  -- Inulina
('dc000005-0000-0000-0000-000000000000', 'db000015-0000-0000-0000-000000000000', 1, 3, true),  -- Alcachofa

-- Kit 6: Vitaminas Esenciales
('dc000006-0000-0000-0000-000000000000', 'db000016-0000-0000-0000-000000000000', 1, 1, true),  -- Vitamina D3
('dc000006-0000-0000-0000-000000000000', 'db000017-0000-0000-0000-000000000000', 1, 2, true),  -- Omega 3-6-7-9
('dc000006-0000-0000-0000-000000000000', 'db000018-0000-0000-0000-000000000000', 1, 3, true),  -- Stress Formula

-- Kit 7: Cuidado Capilar
('dc000007-0000-0000-0000-000000000000', 'db000019-0000-0000-0000-000000000000', 1, 1, true),  -- Champú Biotina Drasanvi
('dc000007-0000-0000-0000-000000000000', 'db000020-0000-0000-0000-000000000000', 1, 2, true),  -- Champú Argán Drasanvi
('dc000007-0000-0000-0000-000000000000', 'db000021-0000-0000-0000-000000000000', 1, 3, true),  -- Karica Acondicionador

-- Kit 8: Bienestar Andino
('dc000008-0000-0000-0000-000000000000', 'db000022-0000-0000-0000-000000000000', 1, 1, true),  -- Dúo Bienestar Riwi
('dc000008-0000-0000-0000-000000000000', 'db000023-0000-0000-0000-000000000000', 1, 2, true),  -- Energy Blend Smart
('dc000008-0000-0000-0000-000000000000', 'db000024-0000-0000-0000-000000000000', 1, 3, true); -- Cúrcuma Pimienta Kion
