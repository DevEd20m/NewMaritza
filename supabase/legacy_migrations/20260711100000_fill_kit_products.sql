-- Llena los 15 kits temáticos (vacíos hasta hoy) con 4-6 productos curados del catálogo real.
-- sort_order 0 = producto más representativo (define la imagen de respaldo del kit).
-- Idempotente: ON CONFLICT sobre la PK (kit_id, variant_id).

insert into kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.id, 1, x.sort_order, true
from (values
  -- Rutina Skin Care Piel Grasa
  ('rutina-skin-care-piel-grasa', 'la-roche-posay-effaclar-gel-limpiador-purificante', 0),
  ('rutina-skin-care-piel-grasa', 'serum-niacinamide-10-zinc-1-the-ordinary-60ml', 1),
  ('rutina-skin-care-piel-grasa', 'eucerin-dermopure-oil-control-fluido-matificante', 2),
  ('rutina-skin-care-piel-grasa', 'he-ordinary-tonico-exfoliante-de-acido-glicolico-7-100ml-momento-de-aplicacion-n', 3),
  ('rutina-skin-care-piel-grasa', 'protector-solar-facial-eucerin-oil-control-tono-claro-fps-50', 4),

  -- Rutina Skin Care Piel Sensible
  ('rutina-skin-care-piel-sensible', 'solucion-micelar-sensibio-h2o-bioderma', 0),
  ('rutina-skin-care-piel-sensible', 'locion-de-limpieza-cetaphil-piel-sensible-y-seca', 1),
  ('rutina-skin-care-piel-sensible', 'la-roche-posay-toleriane-dermallergo-fluido', 2),
  ('rutina-skin-care-piel-sensible', 'eucerin-ultra-sensitive-crema-facial-fluida', 3),
  ('rutina-skin-care-piel-sensible', 'fotoprotector-facial-heliocare-360-mineral-tolerance-fluid-para-piel-sensible-sp', 4),

  -- Rutina Protector Solar Diario
  ('rutina-protector-solar-diario', 'protector-solar-facial-eucerin-hydro-fluid-textura-ultra-ligera-fps-50', 0),
  ('rutina-protector-solar-diario', 'elta-md-uv-clear-spf-46-protector-solar-facial', 1),
  ('rutina-protector-solar-diario', 'protector-solar-anthelios-bruma-rostro-fps-50-75ml-bloqueador', 2),
  ('rutina-protector-solar-diario', 'protector-solar-isdin-labial-lips-stick-spf-50-4gr-bloqueador', 3),
  ('rutina-protector-solar-diario', 'crema-hidratante-facial-en-gel-neutrogena-hydro-boost-water-gel-acido-hialuronic', 4),

  -- Kit Protector Solar Playa y Outdoor
  ('kit-protector-solar-playa-y-outdoor', 'protector-solar-corporal-en-spray-eucerin-transparent-toque-seco-fps-50', 0),
  ('kit-protector-solar-playa-y-outdoor', 'protector-solar-corporal-eucerin-textura-extra-ligera-fps-50', 1),
  ('kit-protector-solar-playa-y-outdoor', 'protector-solar-kids-eucerin-sensitive-protect-fps-50', 2),
  ('kit-protector-solar-playa-y-outdoor', 'protector-solar-facial-eucerin-ultra-100-fps50', 3),
  ('kit-protector-solar-playa-y-outdoor', 'protector-labial-nivea-sun-protect-fps30', 4),

  -- Rutina Estrés y Calma Diaria
  ('rutina-estres-y-calma-diaria', 'ashwagandha-drasanvi-60-caps', 0),
  ('rutina-estres-y-calma-diaria', 'bach-flores-de-bach-rescue-remedy-20ml', 1),
  ('rutina-estres-y-calma-diaria', 'calm-gomitas-tmx', 2),
  ('rutina-estres-y-calma-diaria', 'chill-relax-efecto-relajante-healing-lab-30ml', 3),
  ('rutina-estres-y-calma-diaria', 'rescue-pastilles-berry-blend-lata-50-gr', 4),

  -- Rutina Sueño y Descanso
  ('rutina-sueno-y-descanso', 'melatonina-1-mg-gommies-natures-truth-x60-gomitas', 0),
  ('rutina-sueno-y-descanso', 'triptofano-con-melatonina-magnesio-bit-b6-ana-maria-lajusticia-60-comprimidos', 1),
  ('rutina-sueno-y-descanso', 'sleep-well-sedante-healing-lab-30ml', 2),
  ('rutina-sueno-y-descanso', 'bach-flores-de-bach-rescue-night-gummies-sabor-frutos-rojos-x60-gomitas', 3),
  ('rutina-sueno-y-descanso', 'gomitas-gummix-para-dormir-adulto', 4),

  -- Rutina Oficina y Pantallas
  ('rutina-oficina-y-pantallas', 'frasco-10-ml-systane-ultra-solucion-oftalmica', 0),
  ('rutina-oficina-y-pantallas', 'frasco-10-ml-lubrial-lubricante-ocular-clase-ii', 1),
  ('rutina-oficina-y-pantallas', 'caffeina-con-l-theanina-nutricost-240caps', 2),
  ('rutina-oficina-y-pantallas', 'sunvit-b-complex-100-tableta', 3),
  ('rutina-oficina-y-pantallas', 'frasco-100-un-gomitas-more-calm-sabor-arandano', 4),

  -- Rutina Gym y Recuperación
  ('rutina-gym-y-recuperacion', '100-hydrolyzed-vainilla-lab-nutrition-x2lb', 0),
  ('rutina-gym-y-recuperacion', 'epic-protein-real-sport-sprout-living-x456gr', 1),
  ('rutina-gym-y-recuperacion', 'proteina-whey-light-digest-chocolate-qnt-500gr', 2),
  ('rutina-gym-y-recuperacion', 'barra-de-proteina-crunchy-chocolate-qnt-65gr', 3),
  ('rutina-gym-y-recuperacion', 'orgain-protein-bar-peanut-butter-chocolate-chunk-40gr', 4),

  -- Kit Dolor Muscular Leve
  ('kit-dolor-muscular-leve', 'tobillera-con-ferula-branson-t-m-pie-derecho', 0),
  ('kit-dolor-muscular-leve', 'nua-aceite-de-lavanda-comestible-30ml', 1),
  ('kit-dolor-muscular-leve', 'turmeric-formula', 2),
  ('kit-dolor-muscular-leve', 'epic-protein-pro-colageno-sprout-living-x364gr', 3),

  -- Kit Viaje Esencial
  ('kit-viaje-esencial', 'haan-gel-sanitizer-desinfectante-de-manos-haan-sunset-fleur-30ml', 0),
  ('kit-viaje-esencial', 'crema-de-manos-coco-cooler-haan', 1),
  ('kit-viaje-esencial', 'protector-labial-nivea-original-care', 2),
  ('kit-viaje-esencial', 'caja-20-curitas-transpiel-hansaplast-tamanos-diversos', 3),
  ('kit-viaje-esencial', 'toallitas-desmaquillantes-neutrogena-night-calming', 4),
  ('kit-viaje-esencial', 'bach-flores-de-bach-rescue-remedy-10ml', 5),

  -- Rutina Acidez y Pesadez Estomacal
  ('rutina-acidez-y-pesadez-estomacal', 'moringa-oleifera-herbals-health', 0),
  ('rutina-acidez-y-pesadez-estomacal', 'neem-herbals-health', 1),
  ('rutina-acidez-y-pesadez-estomacal', 'siete-semillas-vainilla-naturandes-200gr', 2),
  ('rutina-acidez-y-pesadez-estomacal', 'siete-semillas-chocolate-naturandes-200gr', 3),

  -- Kit Primeros Auxilios Familiar
  ('kit-primeros-auxilios', 'caja-20-un-nexcare-ultra-flexibles-bandages', 0),
  ('kit-primeros-auxilios', 'caja-100-un-curitas-bendic', 1),
  ('kit-primeros-auxilios', 'caja-12-un-nexcare-steri-strip-sutura-cutanea-adhesiva', 2),
  ('kit-primeros-auxilios', 'caja-15-un-nexcare-clear-waterproof-bandages-vendit-transp', 3),
  ('kit-primeros-auxilios', 'caja-10-un-nexcare-duo-bandages', 4),

  -- Kit Botiquín Compacto
  ('kit-botiquin-compacto', 'caja-8-un-nexcare-ultra-flexibles-bandages', 0),
  ('kit-botiquin-compacto', 'caja-30-un-nexcare-steri-strip-sutura-cutanea-adhesiva', 1),
  ('kit-botiquin-compacto', 'frasco-15-ml-humed-0-3-lagrimas-artificiales-solucion-oftalmica-frasco-15-ml', 2),
  ('kit-botiquin-compacto', 'caja-20-curitas-transpiel-hansaplast-tamanos-diversos', 3),

  -- Rutina Pies Perfectos
  ('rutina-pies-perfectos', 'piedra-pomez-con-mango-para-pies-biu', 0),
  ('rutina-pies-perfectos', 'removedor-de-callos-para-pies-biu', 1),
  ('rutina-pies-perfectos', 'cortaunas-grande-para-pies-biu', 2),
  ('rutina-pies-perfectos', 'frasco-120-gr-talco-desodorante-para-pies-hansaplast-triaction', 3),
  ('rutina-pies-perfectos', 'pack-2-un-talco-para-pie-antisudorales-portugal-mentolado', 4),
  ('rutina-pies-perfectos', 'frasco-260-ml-desodorante-spray-deo-pies-clinical', 5),

  -- Rutina Cuidado Piel Corporal
  ('rutina-cuidado-piel-corporal', 'crema-bioderma-atoderm-intensive-baume', 0),
  ('rutina-cuidado-piel-corporal', 'crema-hidratante-cerave-piel-seca-a-muy-seca', 1),
  ('rutina-cuidado-piel-corporal', 'gel-ducha-morning-glory-haan', 2),
  ('rutina-cuidado-piel-corporal', 'svr-gel-lavant-topialyse', 3),
  ('rutina-cuidado-piel-corporal', 'un-1-un-colageno-resveratrol-biotina-zinc-gummies-adult', 4)
) as x(kit_slug, product_slug, sort_order)
join kits k on k.slug = x.kit_slug
join products p on p.slug = x.product_slug
join product_variants v on v.product_id = p.id and v.is_active
on conflict (kit_id, variant_id) do nothing;

-- Activar el kit que estaba oculto, ahora que tiene productos
update kits set is_active = true where slug = 'kit-dolor-muscular-leve';
