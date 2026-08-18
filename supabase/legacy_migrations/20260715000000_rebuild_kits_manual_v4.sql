-- Recomposición de los 15 kits según el "Manual de 15 Rutinas y Kits Paso a Paso"
-- (PDF v4.0 Auditado Premium, 2026-07-15). Idempotente: borra y reinserta la
-- composición de cada kit por slug. sort_order = número de paso del manual.
-- Precios y nombres/slugs de kits NO se tocan (decisión del usuario).

-- 1. Rutina Skin Care Piel Sensible
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-skin-care-piel-sensible');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('0e378db0-4675-4eea-b07a-8c4449721d81', 1), -- Solución Micelar Sensibio H2O Bioderma 500ml
  ('298bcc65-602e-4c00-b28b-c93f84e8422f', 2), -- Loción de Limpieza Cetaphil 473ml
  ('dac52662-9eab-4054-9f86-448b185a1371', 3), -- Serum Vichy Mineral 89 Booster 50ml
  ('a5c632ae-39ab-4efc-a83f-54c0b7b6c633', 4), -- Bioderma Sensibio Defensive Crema 40ml
  ('a2284f90-8534-448b-8214-f6030df9a1e6', 5)  -- Heliocare 360 Mineral Tolerance SPF50
) as v(vid, ord)
where k.slug = 'rutina-skin-care-piel-sensible';
update public.kits set description = 'Para piel que reacciona, presenta rojeces o tirantez. Limpieza suave, hidratación profunda con ácido hialurónico y defensa solar 100% mineral.'
where slug = 'rutina-skin-care-piel-sensible';

-- 2. Rutina Protector Solar Diario
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-protector-solar-diario');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('894405ce-5087-4fff-a3c5-cc08244788df', 1), -- Neutrogena Hydro Boost 50g
  ('5c37f9f5-7cc7-409e-a834-d66631e2c05c', 2), -- Eucerin Hydro Fluid FPS50+
  ('bb333869-66e8-4a33-b4f1-62b41ae6d414', 3), -- Elta MD UV Clear SPF46 15ml
  ('c68e9900-eeef-4b32-9ce1-ac20646b09d9', 4), -- Isdin Labial Lips Stick SPF50+
  ('2fa40ac2-d2db-4c7c-a261-e9a06ea16556', 5)  -- Anthelios Bruma Rostro FPS50
) as v(vid, ord)
where k.slug = 'rutina-protector-solar-diario';
update public.kits set description = 'Para ciudad, oficina o uso diario. Rutina ligera contra radiación UV y pantallas, con reaplicación portátil sin arruinar el maquillaje.'
where slug = 'rutina-protector-solar-diario';

-- 3. Rutina Skin Care Piel Grasa (ahora 6 pasos, con parches Mario Badescu)
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-skin-care-piel-grasa');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('58f3ef4e-3fca-40b7-a509-2462fb09b723', 1), -- LRP Effaclar Gel Limpiador 400ml
  ('62d4ef69-48a8-4c7a-8eb2-060e794bcd31', 2), -- The Ordinary Tónico Glicólico 7% 240ml
  ('52d3e25e-d485-40bf-a4a8-eb497ee3ee7d', 3), -- Niacinamide 10% Zinc 1% 60ml
  ('0e7ef242-2d7d-49b5-8bf1-17abb6b97068', 4), -- Eucerin Dermopure Oil Control Fluido
  ('f4b86c34-98df-493f-8890-efa4b2cdd58b', 5), -- Eucerin Oil Control Tono Claro FPS50+
  ('e6aa59a5-c8c3-441c-903f-eabdc119e264', 6)  -- Mario Badescu Parche Secante x60
) as v(vid, ord)
where k.slug = 'rutina-skin-care-piel-grasa';
update public.kits set description = 'Para brillo constante, poros visibles y granitos. Protocolo purificante de 6 pasos con exfoliación glicólica, niacinamida, acabado mate y parches SOS.'
where slug = 'rutina-skin-care-piel-grasa';

-- 4. Kit Viaje Esencial
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'kit-viaje-esencial');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('e53dd0d5-31ae-493b-a1c9-50dcb3e81a1b', 1), -- Haan Gel Sanitizer Sunset Fleur 30ml
  ('2359bbac-c5ba-4c2b-aa3d-e7f4023bb218', 2), -- Crema de Manos Coco Cooler Haan 50ml
  ('11abf17a-f19d-41b7-b553-56140acc67f8', 3), -- Protector Labial Nivea Original Care
  ('5521e94a-d875-4027-92ce-ab050ed41598', 4), -- Curitas Transpiel Hansaplast x20
  ('0b72c7ce-ef1f-4710-81f9-77f354613a0c', 5), -- Toallitas Desmaquillantes Neutrogena x25
  ('439f0002-23ae-46b4-b303-b996f617bb78', 6)  -- Bach Rescue Remedy Night 10ml
) as v(vid, ord)
where k.slug = 'kit-viaje-esencial';
update public.kits set description = 'Básicos para mochila o maleta de cabina: desinfección, cuidado labial, protección de ampollas, desmaquillado express y alivio del jet-lag.'
where slug = 'kit-viaje-esencial';

-- 5. Kit Protector Solar Playa y Outdoor
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'kit-protector-solar-playa-y-outdoor');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('ab36ffa5-c0db-4362-8f5b-cc49d111215f', 1), -- Eucerin Ultra 100 FPS50+ 80ml
  ('03f42ffe-c035-40bd-bad2-6db6261b5ee4', 2), -- Eucerin Kids Sensitive Protect spray 250ml
  ('7a68ad44-7387-4736-a684-43b95abec3c9', 3), -- Eucerin Corporal Textura Extra Ligera 150ml
  ('0622b2ba-d0b2-46d7-a646-ab68aec68e0c', 4), -- Nivea Sun Protect FPS30 labial
  ('686f75e5-116e-4e56-9136-021d8a5c850e', 5)  -- Eucerin Spray Transparent Toque Seco 200ml
) as v(vid, ord)
where k.slug = 'kit-protector-solar-playa-y-outdoor';
update public.kits set description = 'Para playa, deporte o exposición solar directa. Protección extrema para rostro, cuerpo, piel infantil y labios frente al sol, mar y sudor.'
where slug = 'kit-protector-solar-playa-y-outdoor';

-- 6. Kit Primeros Auxilios Familiar
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'kit-primeros-auxilios');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('d9b7e0b4-e82f-46c2-abdc-5cea211030be', 1), -- Nexcare Steri-strip x12
  ('bb873b11-f6a5-4756-9ade-4f6cffe210ea', 2), -- Nexcare Ultra Flexibles x20
  ('0a8a0e4d-0a7f-482b-98ce-4043cf888eaf', 3), -- Nexcare Duo x10
  ('bcf2f23a-4fe1-40fc-8af5-ac41d4bc7e22', 4), -- Nexcare Clear Waterproof x15
  ('959bc739-91ff-49f9-aa60-c99f073ff2d8', 5)  -- Curitas BendiC x100
) as v(vid, ord)
where k.slug = 'kit-primeros-auxilios';
update public.kits set description = 'Para la casa y la familia. Protocolo ordenado para atender cortes, raspones y heridas domésticas con tecnología adhesiva especializada.'
where slug = 'kit-primeros-auxilios';

-- 7. Kit Botiquín Compacto (4 ítems)
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'kit-botiquin-compacto');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('4bc150b6-3e3a-4184-902a-9ae23e01dc45', 1), -- Humed 0.3% Lágrimas Artificiales 15ml
  ('5521e94a-d875-4027-92ce-ab050ed41598', 2), -- Curitas Transpiel Hansaplast x20
  ('580ee02f-f5ea-4a50-8c25-7134997aa4fb', 3), -- Nexcare Ultra Flexibles x8
  ('97aa0957-530e-4be9-9f2e-b276b35bff29', 4)  -- Nexcare Steri-strip x30
) as v(vid, ord)
where k.slug = 'kit-botiquin-compacto';
update public.kits set description = 'Para cartera, auto u oficina. Set de respuesta rápida para cortes, ampollas y resequedad ocular en formato minimalista.'
where slug = 'kit-botiquin-compacto';

-- 8. Rutina Sueño y Descanso
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-sueno-y-descanso');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('d27a6eee-dbbf-4c11-bd29-d4125f267c43', 1), -- Triptófano+Melatonina+Magnesio+B6 AML x60
  ('168b044d-0c91-46b2-965d-dc7ac0490c7a', 2), -- Sleep Well Healing Lab 30ml
  ('4f76c1d9-4318-41bf-98fa-ee1bfadd29c2', 3), -- Rescue Night Gummies Frutos Rojos x60
  ('42596162-b762-49aa-875a-ab4af39e4bd7', 4), -- Melatonina 1mg Gummies Natures Truth x60
  ('127d6410-1ea2-4ca1-874e-29ba5d16844e', 5)  -- Gomitas Gummix Dormir Adulto x90
) as v(vid, ord)
where k.slug = 'rutina-sueno-y-descanso';
update public.kits set description = 'Secuencia de relajación muscular y nerviosa que induce el sueño profundo y disminuye los despertares nocturnos de forma 100% natural.'
where slug = 'rutina-sueno-y-descanso';

-- 9. Rutina Acidez y Pesadez Estomacal (protocolo simbiótico con Kéfir)
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-acidez-y-pesadez-estomacal');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('e4e9167c-f3fa-422d-88de-057ecffd9619', 1), -- Kéfir de Leche 1 Litro
  ('15fd1e04-3563-484c-bd62-bf2562fb78c5', 2), -- Kéfir de Agua 475ml
  ('d3e2b891-135d-463b-a0da-afe9c5702c6e', 3), -- Moringa Oleifera Herbals & Health x60
  ('5ffd287a-d2f0-4207-9473-eeeca12eb860', 4), -- Neem Herbals & Health x60
  ('a468ddd6-5c29-46d6-8162-8f33b67817b2', 5)  -- Siete Semillas Vainilla Naturandes 200g
) as v(vid, ord)
where k.slug = 'rutina-acidez-y-pesadez-estomacal';
update public.kits set description = 'Protocolo simbiótico: probióticos vivos de Kéfir, desinflamación gástrica con hierbas y fibra prebiótica contra el reflujo y la pesadez.'
where slug = 'rutina-acidez-y-pesadez-estomacal';

-- 10. Rutina Estrés y Calma Diaria
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-estres-y-calma-diaria');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('a07bd2df-76a0-4351-9a59-a464b7d87594', 1), -- Ashwagandha Drasanvi x60
  ('7a01b22e-cc4a-40d7-9ebc-cb884adde79f', 2), -- Bach Rescue Remedy 20ml
  ('2f489211-0e4c-4ae5-b0d2-ff4bb6faa41b', 3), -- Calm+ Gomitas TMX x70
  ('3228b4cd-9599-41ae-b5ef-3d28550ffcce', 4), -- Chill & Relax Healing Lab 30ml
  ('1dc49139-2c04-456a-a9fe-2737e5aed3c0', 5)  -- Rescue Pastilles Berry Blend lata 50g
) as v(vid, ord)
where k.slug = 'rutina-estres-y-calma-diaria';
update public.kits set description = 'Para días de alta tensión. Regulación del cortisol, alivio sublingual inmediato y relajación profunda post-jornada sin somnolencia diurna.'
where slug = 'rutina-estres-y-calma-diaria';

-- 11. Rutina Gym y Recuperación
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-gym-y-recuperacion');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('0401d28a-c866-416b-906b-105d7e02a3cd', 1), -- 100% Hydrolyzed Vainilla Lab Nutrition 2LB
  ('a0cc5b38-ba49-424d-b829-682266bc3cb3', 2), -- Epic Protein Real Sport 456g
  ('8a9feb0b-615b-4717-819d-90ecb16afc4d', 3), -- Whey Light Digest Chocolate QNT 500g
  ('5a64f172-d43c-49f2-b225-0125091a79fa', 4), -- Barra Crunchy Chocolate QNT 65g
  ('43af62cc-19f6-4ee9-88f3-d0f29f32baa4', 5)  -- Orgain Protein Bar Peanut Butter 40g
) as v(vid, ord)
where k.slug = 'rutina-gym-y-recuperacion';
update public.kits set description = 'Proteína hidrolizada de absorción inmediata post-entreno, proteína vegetal orgánica para batidos y snacks proteicos para sostener tus macros.'
where slug = 'rutina-gym-y-recuperacion';

-- 12. Rutina Oficina y Pantallas (upgrade a B Complex Life Extension)
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-oficina-y-pantallas');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('f3ca9921-f0d5-49a7-b6a7-56c811f9abbd', 1), -- Caffeina con L-Theanina Nutricost x240
  ('3d023e0b-a977-4804-a11a-fe4fa51d781a', 2), -- Systane Ultra 10ml
  ('2c6e6de7-8ace-4b7c-a975-4f030cdc8818', 3), -- Lubrial Lubricante Ocular 10ml
  ('79ab484a-ed23-491f-8cb2-8b638b2bb6ca', 4), -- B Complex Bioactivo Life Extension x60
  ('f8f41b05-a299-473f-bc58-2f708c0fd664', 5)  -- Gomitas More Calm Arándano x100
) as v(vid, ord)
where k.slug = 'rutina-oficina-y-pantallas';
update public.kits set description = 'Para profesionales frente a pantallas. Enfoque cognitivo sin temblor, lubricación ocular intensiva, complejo B bioactivo y desconexión post-jornada.'
where slug = 'rutina-oficina-y-pantallas';

-- 13. Rutina Pies Perfectos
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-pies-perfectos');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('7b5a54a5-e19f-467b-bec7-d9820fdfaa60', 1), -- Removedor de Callos Biu 100ml
  ('24a05620-31e5-4c92-a38a-107cf8384eb7', 2), -- Piedra Pómez con Mango Biu
  ('f79eaf1b-ab01-4579-ba5b-79bc39565a4e', 3), -- Cortauñas Grande Biu
  ('84d6d4eb-3233-4aa6-a143-6c4b10ea8e25', 4), -- Talco Hansaplast TriAction 120g
  ('97f4fb2a-0049-496e-86f0-9b2297752e15', 5), -- Talco Portugal Mentolado x2
  ('aa07bd6f-53cd-421b-964e-fb5958e0eb9b', 6)  -- Deo Pies Clinical spray 260ml
) as v(vid, ord)
where k.slug = 'rutina-pies-perfectos';
update public.kits set description = 'Para sudor, olor, gym o uso diario. Protocolo de 6 pasos: ablanda durezas, pule callosidades, corte seguro y protección antisudoral clínica.'
where slug = 'rutina-pies-perfectos';

-- 14. Rutina Cuidado Piel Corporal
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'rutina-cuidado-piel-corporal');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('8649712c-bb88-4e32-a31f-d2494856fba9', 1), -- SVR Gel Lavant Topialyse 1L
  ('dd01217b-36b7-4c6d-90df-7c55e792e93a', 2), -- Gel Ducha Morning Glory Haan 450ml
  ('2c337e39-0bd8-4c49-bdbb-9e4a0e46fefb', 3), -- CeraVe Piel Seca a Muy Seca 340g
  ('50095527-066b-4bf2-a8d2-a0822d034857', 4), -- Bioderma Atoderm Intensive Baume 200ml
  ('d7dbc51d-05a7-4661-b97c-57e2dd033161', 5)  -- Colágeno+Resveratrol+Biotina+Zinc Gummies x60
) as v(vid, ord)
where k.slug = 'rutina-cuidado-piel-corporal';
update public.kits set description = 'Para piel seca, rozaduras o picazón. Limpieza sin jabones agresivos, sellado con ceramidas, rescate intensivo y refuerzo antioxidante interno.'
where slug = 'rutina-cuidado-piel-corporal';

-- 15. Kit Dolor Muscular Leve (4 ítems)
delete from public.kit_products where kit_id = (select id from public.kits where slug = 'kit-dolor-muscular-leve');
insert into public.kit_products (kit_id, variant_id, quantity, sort_order, is_required)
select k.id, v.vid::uuid, 1, v.ord, true from public.kits k,
(values
  ('076dfb77-1ad6-4e9b-9762-d49549ee8dce', 1), -- Turmeric Formula x60
  ('48ca85aa-779d-46a1-a397-ef9ee4d54ac4', 2), -- NUA Aceite de Lavanda 30ml
  ('4bb94cac-105d-446a-90da-76b639f67f37', 3), -- Tobillera con Férula Branson T:M
  ('ac66f2ab-cc48-4aab-ac5d-ce3d1aea1a57', 4)  -- Epic Protein Pro Colágeno 364g
) as v(vid, ord)
where k.slug = 'kit-dolor-muscular-leve';
update public.kits set description = 'Para molestias post-entrenamiento o sobrecargas. Desinflamación con cúrcuma, aromaterapia, soporte tobillero y colágeno regenerador.'
where slug = 'kit-dolor-muscular-leve';
