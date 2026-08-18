
INSERT INTO public.kits (id, name, slug, description, cover_image_url, type, is_active, created_at)
VALUES
('dc000001-0000-0000-0000-000000000000','Kit Colágeno Radiante','kit-colageno-radiante','Belleza desde adentro. Colágeno + biotina para piel luminosa, cabello fuerte y uñas resistentes.','https://organaperu.vtexassets.com/arquivos/ids/163092-1200-auto?v=638794019914900000&width=1200&height=auto&aspect=true','static',true,now()),
('dc000002-0000-0000-0000-000000000000','Kit Articulaciones & Movilidad','kit-articulaciones-movilidad','Para moverte sin límites. Glucosamina + colágeno marino + magnesio para articulaciones fuertes y flexibles.','https://organaperu.vtexassets.com/arquivos/ids/162884-1200-auto?v=638956251160270000&width=1200&height=auto&aspect=true','static',true,now()),
('dc000003-0000-0000-0000-000000000000','Kit Gym Performance','kit-gym-performance','Entrena más fuerte, recupera mejor. Creatina + pre-workout + magnesio para alcanzar tu máximo rendimiento.','https://organaperu.vtexassets.com/arquivos/ids/163620-1200-auto?v=638921011836900000&width=1200&height=auto&aspect=true','static',true,now()),
('dc000004-0000-0000-0000-000000000000','Kit Sueño Profundo','kit-sueno-profundo','Duerme de verdad. Melatonina + flores de Bach + magnesio para un descanso reparador sin dependencia.','https://organaperu.vtexassets.com/arquivos/ids/163434-1200-auto?v=638861396794970000&width=1200&height=auto&aspect=true','static',true,now()),
('dc000005-0000-0000-0000-000000000000','Kit Detox & Digestión','kit-detox-digestion','Reset intestinal completo. Psyllium + inulina + alcachofa para limpiar, depurar y equilibrar desde adentro.','https://organaperu.vtexassets.com/arquivos/ids/162519-1200-auto?v=638806902983600000&width=1200&height=auto&aspect=true','static',true,now()),
('dc000006-0000-0000-0000-000000000000','Kit Vitaminas Esenciales','kit-vitaminas-esenciales','Las bases de todo. Vitamina D3 + omega + complejo B para inmunidad, energía y sistema nervioso.','https://organaperu.vtexassets.com/arquivos/ids/162233/Vitamina-D3-5000IU.png?v=638719666698530000','static',true,now()),
('dc000007-0000-0000-0000-000000000000','Kit Cuidado Capilar','kit-cuidado-capilar','Cabello que se nota. Champú biotina + champú argán + acondicionador para pelo fuerte, brillante y sin caída.','https://organaperu.vtexassets.com/arquivos/ids/162689-1200-auto?v=638769755362030000&width=1200&height=auto&aspect=true','static',true,now()),
('dc000008-0000-0000-0000-000000000000','Kit Bienestar Andino','kit-bienestar-andino','Lo mejor de los Andes. Golden latte + energy blend + cúrcuma para energía natural, antiinflamación y bienestar diario.','https://organaperu.vtexassets.com/arquivos/ids/164214-1200-auto?v=639054101370570000&width=1200&height=auto&aspect=true','static',true,now());

INSERT INTO public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
VALUES
-- Kit 1: Colágeno Radiante (S/. 311)
('dc000001-0000-0000-0000-000000000000','db000001-0000-0000-0000-000000000000',1,1,true),
('dc000001-0000-0000-0000-000000000000','db000002-0000-0000-0000-000000000000',1,2,true),
('dc000001-0000-0000-0000-000000000000','db000003-0000-0000-0000-000000000000',1,3,true),
-- Kit 2: Articulaciones & Movilidad (S/. 342)
('dc000002-0000-0000-0000-000000000000','db000004-0000-0000-0000-000000000000',1,1,true),
('dc000002-0000-0000-0000-000000000000','db000005-0000-0000-0000-000000000000',1,2,true),
('dc000002-0000-0000-0000-000000000000','db000006-0000-0000-0000-000000000000',1,3,true),
-- Kit 3: Gym Performance (S/. 414)
('dc000003-0000-0000-0000-000000000000','db000007-0000-0000-0000-000000000000',1,1,true),
('dc000003-0000-0000-0000-000000000000','db000008-0000-0000-0000-000000000000',1,2,true),
('dc000003-0000-0000-0000-000000000000','db000009-0000-0000-0000-000000000000',1,3,true),
-- Kit 4: Sueño Profundo (S/. 234)
('dc000004-0000-0000-0000-000000000000','db000010-0000-0000-0000-000000000000',1,1,true),
('dc000004-0000-0000-0000-000000000000','db000011-0000-0000-0000-000000000000',1,2,true),
('dc000004-0000-0000-0000-000000000000','db000012-0000-0000-0000-000000000000',1,3,true),
-- Kit 5: Detox & Digestión (S/. 108)
('dc000005-0000-0000-0000-000000000000','db000013-0000-0000-0000-000000000000',1,1,true),
('dc000005-0000-0000-0000-000000000000','db000014-0000-0000-0000-000000000000',1,2,true),
('dc000005-0000-0000-0000-000000000000','db000015-0000-0000-0000-000000000000',1,3,true),
-- Kit 6: Vitaminas Esenciales (S/. 319)
('dc000006-0000-0000-0000-000000000000','db000016-0000-0000-0000-000000000000',1,1,true),
('dc000006-0000-0000-0000-000000000000','db000017-0000-0000-0000-000000000000',1,2,true),
('dc000006-0000-0000-0000-000000000000','db000018-0000-0000-0000-000000000000',1,3,true),
-- Kit 7: Cuidado Capilar (S/. 176)
('dc000007-0000-0000-0000-000000000000','db000019-0000-0000-0000-000000000000',1,1,true),
('dc000007-0000-0000-0000-000000000000','db000020-0000-0000-0000-000000000000',1,2,true),
('dc000007-0000-0000-0000-000000000000','db000021-0000-0000-0000-000000000000',1,3,true),
-- Kit 8: Bienestar Andino (S/. 222)
('dc000008-0000-0000-0000-000000000000','db000022-0000-0000-0000-000000000000',1,1,true),
('dc000008-0000-0000-0000-000000000000','db000023-0000-0000-0000-000000000000',1,2,true),
('dc000008-0000-0000-0000-000000000000','db000024-0000-0000-0000-000000000000',1,3,true);
;
