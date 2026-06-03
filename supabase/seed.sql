SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict Sj3wV1wv0sVOwMfeOxOQgnBLjz0rCWyvHBC0k3WHgnySpQyBbaqbCuX3JKQMtRq

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '8dfd19be-441d-451e-96ae-956783c3deeb', 'authenticated', 'authenticated', 'pradoulima@gmail.com', '$2a$10$0/MK2Wp8aa6Ep.TiwOjUse913181S0tSq8WxYx25XdLosIfWJgH4e', '2026-05-19 17:30:13.912431+00', NULL, '', '2026-05-19 17:29:56.708931+00', '', NULL, '', '', NULL, '2026-05-27 18:47:11.238723+00', '{"provider": "email", "providers": ["email", "google"]}', '{"iss": "https://accounts.google.com", "sub": "104425175458661567010", "name": "José Edmundo Prado Astucuri", "email": "pradoulima@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLeoM31r1f4M9gf6xuSUTKlvg0P3xhdfzSAYFvtIG4GeTBHlg=s96-c", "full_name": "José Edmundo Prado Astucuri", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLeoM31r1f4M9gf6xuSUTKlvg0P3xhdfzSAYFvtIG4GeTBHlg=s96-c", "provider_id": "104425175458661567010", "email_verified": true, "phone_verified": false}', NULL, '2026-05-19 17:29:56.656757+00', '2026-05-28 14:45:39.619725+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('8dfd19be-441d-451e-96ae-956783c3deeb', '8dfd19be-441d-451e-96ae-956783c3deeb', '{"sub": "8dfd19be-441d-451e-96ae-956783c3deeb", "email": "pradoulima@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-05-19 17:29:56.689367+00', '2026-05-19 17:29:56.689427+00', '2026-05-19 17:29:56.689427+00', '3b81c0c0-5dda-42ff-bbab-04bdfd378197'),
	('104425175458661567010', '8dfd19be-441d-451e-96ae-956783c3deeb', '{"iss": "https://accounts.google.com", "sub": "104425175458661567010", "name": "José Edmundo Prado Astucuri", "email": "pradoulima@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLeoM31r1f4M9gf6xuSUTKlvg0P3xhdfzSAYFvtIG4GeTBHlg=s96-c", "full_name": "José Edmundo Prado Astucuri", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLeoM31r1f4M9gf6xuSUTKlvg0P3xhdfzSAYFvtIG4GeTBHlg=s96-c", "provider_id": "104425175458661567010", "email_verified": true, "phone_verified": false}', 'google', '2026-05-19 20:10:20.093422+00', '2026-05-19 20:10:20.093479+00', '2026-05-27 18:47:10.458811+00', '5275c8f0-520f-4b3b-9350-ded1d579cc88');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('8a96e259-cd87-4c33-8378-6923a43bd2dc', '8dfd19be-441d-451e-96ae-956783c3deeb', '2026-05-19 17:30:15.175924+00', '2026-05-19 19:38:03.727745+00', NULL, 'aal1', NULL, '2026-05-19 19:38:03.727653', 'node', '38.250.155.77', NULL, NULL, NULL, NULL, NULL),
	('71a7cb29-95e1-481e-9d68-c70a581f0958', '8dfd19be-441d-451e-96ae-956783c3deeb', '2026-05-19 20:10:20.99207+00', '2026-05-19 20:10:20.99207+00', NULL, 'aal1', NULL, NULL, 'node', '38.250.155.77', NULL, NULL, NULL, NULL, NULL),
	('61161f69-162b-4b78-a1fb-ab9231cf8740', '8dfd19be-441d-451e-96ae-956783c3deeb', '2026-05-19 21:02:35.506627+00', '2026-05-19 21:02:35.506627+00', NULL, 'aal1', NULL, NULL, 'node', '38.250.155.77', NULL, NULL, NULL, NULL, NULL),
	('f1b25b4f-edcd-42d4-b0e2-b0f87ec67227', '8dfd19be-441d-451e-96ae-956783c3deeb', '2026-05-19 21:02:48.106374+00', '2026-05-19 21:02:48.106374+00', NULL, 'aal1', NULL, NULL, 'node', '38.250.155.77', NULL, NULL, NULL, NULL, NULL),
	('2b65cc44-45fb-4546-bf3c-675fce8533c9', '8dfd19be-441d-451e-96ae-956783c3deeb', '2026-05-19 21:10:46.938152+00', '2026-05-19 21:10:46.938152+00', NULL, 'aal1', NULL, NULL, 'node', '38.250.155.77', NULL, NULL, NULL, NULL, NULL),
	('ad4f88f2-90d3-4851-b911-0904bc8e26f1', '8dfd19be-441d-451e-96ae-956783c3deeb', '2026-05-19 21:20:22.010251+00', '2026-05-27 18:28:27.683754+00', NULL, 'aal1', NULL, '2026-05-27 18:28:27.683657', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '38.250.155.77', NULL, NULL, NULL, NULL, NULL),
	('fe5a569a-84ae-4b6c-bb1c-8955f5edd9e5', '8dfd19be-441d-451e-96ae-956783c3deeb', '2026-05-27 18:47:11.243196+00', '2026-05-28 14:48:07.567124+00', NULL, 'aal1', NULL, '2026-05-28 14:48:07.567027', 'node', '38.250.155.77', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('8a96e259-cd87-4c33-8378-6923a43bd2dc', '2026-05-19 17:30:15.195501+00', '2026-05-19 17:30:15.195501+00', 'email/signup', '7c0163db-2b02-462f-ba9d-5830efd9e530'),
	('71a7cb29-95e1-481e-9d68-c70a581f0958', '2026-05-19 20:10:21.003685+00', '2026-05-19 20:10:21.003685+00', 'oauth', 'e04de854-c50f-472b-a88d-7e4b7d66e3f5'),
	('61161f69-162b-4b78-a1fb-ab9231cf8740', '2026-05-19 21:02:35.520635+00', '2026-05-19 21:02:35.520635+00', 'oauth', '16a20030-de08-41b5-854c-cd418290de25'),
	('f1b25b4f-edcd-42d4-b0e2-b0f87ec67227', '2026-05-19 21:02:48.109181+00', '2026-05-19 21:02:48.109181+00', 'oauth', 'a80b6fc9-99cb-4684-8e8f-5d1ee9441d76'),
	('2b65cc44-45fb-4546-bf3c-675fce8533c9', '2026-05-19 21:10:46.943749+00', '2026-05-19 21:10:46.943749+00', 'oauth', '5f08bbb3-8ae2-4bf3-bde7-a443a700e603'),
	('ad4f88f2-90d3-4851-b911-0904bc8e26f1', '2026-05-19 21:20:22.017727+00', '2026-05-19 21:20:22.017727+00', 'oauth', '0cab409d-6113-4d50-8e47-32834027b891'),
	('fe5a569a-84ae-4b6c-bb1c-8955f5edd9e5', '2026-05-27 18:47:11.254535+00', '2026-05-27 18:47:11.254535+00', 'oauth', 'e7b34006-9a23-4c62-a27f-c341be50bfa2');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'ze6tv6koj3ga', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-19 17:30:15.183552+00', '2026-05-19 19:38:01.707329+00', NULL, '8a96e259-cd87-4c33-8378-6923a43bd2dc'),
	('00000000-0000-0000-0000-000000000000', 2, 'pmbrhkk5olbq', '8dfd19be-441d-451e-96ae-956783c3deeb', false, '2026-05-19 19:38:01.720232+00', '2026-05-19 19:38:01.720232+00', 'ze6tv6koj3ga', '8a96e259-cd87-4c33-8378-6923a43bd2dc'),
	('00000000-0000-0000-0000-000000000000', 3, 'xkb3eqyrtdf6', '8dfd19be-441d-451e-96ae-956783c3deeb', false, '2026-05-19 20:10:20.996072+00', '2026-05-19 20:10:20.996072+00', NULL, '71a7cb29-95e1-481e-9d68-c70a581f0958'),
	('00000000-0000-0000-0000-000000000000', 4, 'tfo3t5elg5of', '8dfd19be-441d-451e-96ae-956783c3deeb', false, '2026-05-19 21:02:35.510801+00', '2026-05-19 21:02:35.510801+00', NULL, '61161f69-162b-4b78-a1fb-ab9231cf8740'),
	('00000000-0000-0000-0000-000000000000', 5, 'tpeqvetlvqda', '8dfd19be-441d-451e-96ae-956783c3deeb', false, '2026-05-19 21:02:48.1075+00', '2026-05-19 21:02:48.1075+00', NULL, 'f1b25b4f-edcd-42d4-b0e2-b0f87ec67227'),
	('00000000-0000-0000-0000-000000000000', 6, 'e3sdzd2t6qq2', '8dfd19be-441d-451e-96ae-956783c3deeb', false, '2026-05-19 21:10:46.940398+00', '2026-05-19 21:10:46.940398+00', NULL, '2b65cc44-45fb-4546-bf3c-675fce8533c9'),
	('00000000-0000-0000-0000-000000000000', 7, 't5nux6u57vfk', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-19 21:20:22.01307+00', '2026-05-19 22:50:31.184571+00', NULL, 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 8, 'qgu7h4iwplge', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-19 22:50:31.199634+00', '2026-05-20 00:36:26.105364+00', 't5nux6u57vfk', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 9, '2wqrcrxlngsr', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-20 00:36:26.122075+00', '2026-05-20 02:30:15.431669+00', 'qgu7h4iwplge', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 10, '6hevzrxiq6gv', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-20 02:30:15.44992+00', '2026-05-25 15:56:18.093329+00', '2wqrcrxlngsr', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 11, '4lfybzph4buv', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-25 15:56:18.117021+00', '2026-05-26 19:34:26.856778+00', '6hevzrxiq6gv', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 12, 's54ngj4cpyfa', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-26 19:34:26.877039+00', '2026-05-26 20:36:12.880282+00', '4lfybzph4buv', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 13, 'ugo5wsaivitc', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-26 20:36:12.889969+00', '2026-05-27 15:32:52.924908+00', 's54ngj4cpyfa', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 14, 'ioxicvk3w6zf', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-27 15:32:52.9447+00', '2026-05-27 18:28:01.594207+00', 'ugo5wsaivitc', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 15, 'q7asw5j6g7jd', '8dfd19be-441d-451e-96ae-956783c3deeb', false, '2026-05-27 18:28:01.60588+00', '2026-05-27 18:28:01.60588+00', 'ioxicvk3w6zf', 'ad4f88f2-90d3-4851-b911-0904bc8e26f1'),
	('00000000-0000-0000-0000-000000000000', 16, 'ksaffvg4obto', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-27 18:47:11.247836+00', '2026-05-27 19:50:41.789073+00', NULL, 'fe5a569a-84ae-4b6c-bb1c-8955f5edd9e5'),
	('00000000-0000-0000-0000-000000000000', 17, 'rre5uulgw57g', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-27 19:50:41.801158+00', '2026-05-28 00:27:50.817281+00', 'ksaffvg4obto', 'fe5a569a-84ae-4b6c-bb1c-8955f5edd9e5'),
	('00000000-0000-0000-0000-000000000000', 18, 'o67wtuhtjugw', '8dfd19be-441d-451e-96ae-956783c3deeb', true, '2026-05-28 00:27:50.828542+00', '2026-05-28 14:45:39.590722+00', 'rre5uulgw57g', 'fe5a569a-84ae-4b6c-bb1c-8955f5edd9e5'),
	('00000000-0000-0000-0000-000000000000', 19, 'qmbo2astyz5h', '8dfd19be-441d-451e-96ae-956783c3deeb', false, '2026-05-28 14:45:39.611161+00', '2026-05-28 14:45:39.611161+00', 'o67wtuhtjugw', 'fe5a569a-84ae-4b6c-bb1c-8955f5edd9e5');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "name", "slug", "parent_id", "sort_order", "created_at") VALUES
	('11111111-0000-0000-0000-000000000001', 'Orgánicos', 'organicos', NULL, 1, '2026-05-27 19:36:07.683861+00'),
	('11111111-0000-0000-0000-000000000002', 'Gym & Proteínas', 'gym', NULL, 2, '2026-05-27 19:36:07.683861+00'),
	('11111111-0000-0000-0000-000000000003', 'Skin Care', 'skin-care', NULL, 3, '2026-05-27 19:36:07.683861+00'),
	('11111111-0000-0000-0000-000000000004', 'Vitaminas', 'vitaminas', NULL, 4, '2026-05-27 19:36:07.683861+00');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "name", "slug", "description", "brand", "category_id", "cover_image_url", "gallery_urls", "usage_instructions", "indications", "contraindications", "is_active", "created_at", "updated_at") VALUES
	('22220001-0000-0000-0000-000000000001', 'Granola Andina Bowl', 'granola-andina-bowl', 'Granola artesanal con quinua, kiwicha y miel de abeja. Sin azúcares añadidos.', NULL, '11111111-0000-0000-0000-000000000001', NULL, '{}', 'Servir 50g con leche vegetal o yogur.', 'Personas que buscan un desayuno nutritivo y natural.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220001-0000-0000-0000-000000000002', 'Té Detox Verde', 'te-detox-verde', 'Blend de té verde con hierbas amazónicas. Ayuda a depurar y activar el metabolismo.', NULL, '11111111-0000-0000-0000-000000000001', NULL, '{}', 'Infusionar 1 bolsita en 200ml de agua a 80°C por 3 minutos.', 'Para quienes buscan desintoxicación natural.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220001-0000-0000-0000-000000000003', 'Aceite de Coco Orgánico', 'aceite-de-coco-organico', '100% puro, prensado en frío. Ideal para cocinar, piel y cabello.', NULL, '11111111-0000-0000-0000-000000000001', NULL, '{}', 'Consumir 1-2 cdas al día o aplicar directamente en piel.', 'Uso culinario y cosmético.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220002-0000-0000-0000-000000000001', 'Whey Isolate Zero', 'whey-isolate-zero', 'Proteína de suero aislada con 25g de proteína por serving. Sin lactosa, sin azúcar.', NULL, '11111111-0000-0000-0000-000000000002', NULL, '{}', 'Mezclar 1 scoop (30g) con 250ml de agua o leche fría. Tomar post-entrenamiento.', 'Deportistas que buscan recuperación muscular rápida.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220002-0000-0000-0000-000000000002', 'BCAA Tropical', 'bcaa-tropical', 'Aminoácidos ramificados 2:1:1 con electrolitos. Sabor tropical sin colorantes artificiales.', NULL, '11111111-0000-0000-0000-000000000002', NULL, '{}', 'Mezclar 1 scoop con 400ml de agua. Consumir durante el entrenamiento.', 'Para mantener masa muscular y reducir fatiga durante el entrenamiento.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220002-0000-0000-0000-000000000003', 'Magnesio Citrato', 'magnesio-citrato', 'Magnesio en forma de citrato para máxima absorción. Apoya músculo, sueño y sistema nervioso.', NULL, '11111111-0000-0000-0000-000000000002', NULL, '{}', 'Tomar 2 cápsulas antes de dormir.', 'Deportistas y personas con estrés o calambres musculares.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220003-0000-0000-0000-000000000001', 'Sérum Vitamina C 20%', 'serum-vitamina-c-20', 'Sérum concentrado con ácido ascórbico estabilizado. Ilumina, unifica y protege del daño oxidativo.', NULL, '11111111-0000-0000-0000-000000000003', NULL, '{}', 'Aplicar 3-4 gotas en rostro limpio cada mañana. Usar protector solar después.', 'Todo tipo de piel. Especial para manchas, opacidad y signos de edad.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220003-0000-0000-0000-000000000002', 'Crema Hidratante Día', 'crema-hidratante-dia', 'Textura ligera con ácido hialurónico y niacinamida. Para piel mixta a normal.', NULL, '11111111-0000-0000-0000-000000000003', NULL, '{}', 'Aplicar por la mañana después del sérum. Puede usarse bajo maquillaje.', 'Piel mixta y normal que necesita hidratación sin brillos.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220003-0000-0000-0000-000000000003', 'Limpiador Suave Espuma', 'limpiador-suave-espuma', 'Limpiador en espuma con pH balanceado. Retira impurezas sin alterar la barrera cutánea.', NULL, '11111111-0000-0000-0000-000000000003', NULL, '{}', 'Aplicar en rostro húmedo, masajear y enjuagar con agua tibia.', 'Todo tipo de piel, especialmente sensible.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220004-0000-0000-0000-000000000001', 'Multivitamínico Mujer', 'multivitaminico-mujer', 'Complejo de 23 vitaminas y minerales formulado para las necesidades de la mujer activa.', NULL, '11111111-0000-0000-0000-000000000004', NULL, '{}', 'Tomar 2 cápsulas con el desayuno.', 'Mujeres adultas que buscan cubrir sus necesidades nutricionales diarias.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220004-0000-0000-0000-000000000002', 'Omega 3 Premium 1000mg', 'omega-3-premium-1000mg', 'Aceite de pescado de aguas frías con certificación IFOS. 300mg EPA + 200mg DHA por cápsula.', NULL, '11111111-0000-0000-0000-000000000004', NULL, '{}', 'Tomar 2 cápsulas con las comidas principales.', 'Para salud cardiovascular, cerebral y reducción de inflamación.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00'),
	('22220004-0000-0000-0000-000000000003', 'Colágeno + Biotina', 'colageno-biotina', 'Colágeno hidrolizado tipo I y III con biotina y vitamina C. Apoya piel, cabello y uñas.', NULL, '11111111-0000-0000-0000-000000000004', NULL, '{}', 'Disolver 1 scoop en 200ml de agua o jugo. Tomar en ayunas.', 'Para quienes buscan mejorar la elasticidad de la piel y la fortaleza del cabello.', NULL, true, '2026-05-27 19:36:07.683861+00', '2026-05-27 19:36:07.683861+00');


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."product_variants" ("id", "product_id", "sku", "name", "weight_grams", "is_active", "created_at") VALUES
	('33330001-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001', 'GRA-AND-500', '500g', 500, true, '2026-05-27 19:36:07.683861+00'),
	('33330001-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002', 'TE-DET-20U', '20 bolsitas', 40, true, '2026-05-27 19:36:07.683861+00'),
	('33330001-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003', 'ACE-COC-250', '250ml', 250, true, '2026-05-27 19:36:07.683861+00'),
	('33330002-0000-0000-0000-000000000001', '22220002-0000-0000-0000-000000000001', 'WHE-ISO-1K', '1kg Vainilla', 1000, true, '2026-05-27 19:36:07.683861+00'),
	('33330002-0000-0000-0000-000000000002', '22220002-0000-0000-0000-000000000002', 'BCA-TRO-300', '300g Tropical', 300, true, '2026-05-27 19:36:07.683861+00'),
	('33330002-0000-0000-0000-000000000003', '22220002-0000-0000-0000-000000000003', 'MAG-CIT-90C', '90 cápsulas', 90, true, '2026-05-27 19:36:07.683861+00'),
	('33330003-0000-0000-0000-000000000001', '22220003-0000-0000-0000-000000000001', 'SER-VTC-30L', '30ml', 30, true, '2026-05-27 19:36:07.683861+00'),
	('33330003-0000-0000-0000-000000000002', '22220003-0000-0000-0000-000000000002', 'CRE-HID-50G', '50ml', 50, true, '2026-05-27 19:36:07.683861+00'),
	('33330003-0000-0000-0000-000000000003', '22220003-0000-0000-0000-000000000003', 'LIM-SUA-150', '150ml', 150, true, '2026-05-27 19:36:07.683861+00'),
	('33330004-0000-0000-0000-000000000001', '22220004-0000-0000-0000-000000000001', 'MUL-MUJ-60C', '60 cápsulas', 60, true, '2026-05-27 19:36:07.683861+00'),
	('33330004-0000-0000-0000-000000000002', '22220004-0000-0000-0000-000000000002', 'OME-PRE-90C', '90 cápsulas', 90, true, '2026-05-27 19:36:07.683861+00'),
	('33330004-0000-0000-0000-000000000003', '22220004-0000-0000-0000-000000000003', 'COL-BIO-300', '300g Natural', 300, true, '2026-05-27 19:36:07.683861+00');


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."coupons" ("id", "code", "type", "value", "gift_variant_id", "scope", "scope_category_ids", "scope_product_ids", "min_purchase_cents", "max_uses", "max_uses_per_user", "is_active", "starts_at", "expires_at", "created_by", "created_at") VALUES
	('d4d3e27a-46c2-48c2-a8c9-a3f1d30f1859', 'BIENVENIDA10', 'percentage', 10, NULL, 'all', NULL, NULL, NULL, 500, 1, true, NULL, NULL, NULL, '2026-05-27 19:36:07.683861+00');


--
-- Data for Name: kits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."kits" ("id", "name", "slug", "description", "cover_image_url", "type", "is_active", "created_at") VALUES
	('44440001-0000-0000-0000-000000000001', 'Kit Energía Total', 'kit-energia-total', 'Para mañanas que cuestan arrancar. Whey, vitaminas y omega para todo el día.', NULL, 'static', true, '2026-05-27 19:36:07.683861+00'),
	('44440001-0000-0000-0000-000000000002', 'Kit Piel Luminosa', 'kit-piel-luminosa', 'Limpia, hidrata e ilumina. Sérum Vit. C + crema de día + limpiador balanceado.', NULL, 'static', true, '2026-05-27 19:36:07.683861+00'),
	('44440001-0000-0000-0000-000000000003', 'Kit Post-entreno', 'kit-post-entreno', 'Recuperación que se siente. Whey isolate, BCAA y magnesio para recuperar bien.', NULL, 'static', true, '2026-05-27 19:36:07.683861+00'),
	('44440001-0000-0000-0000-000000000004', 'Kit Reset Detox', 'kit-reset-detox', 'Para empezar de cero. Té detox, granola andina y multivitamínico para el equilibrio.', NULL, 'static', true, '2026-05-27 19:36:07.683861+00');


--
-- Data for Name: quiz_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quiz_templates" ("id", "kit_id", "name", "description", "max_questions", "created_at") VALUES
	('55550001-0000-0000-0000-000000000001', NULL, 'Cuestionario LIORA', 'Descubre tu kit de bienestar personalizado', 8, '2026-05-27 19:36:07.683861+00');


--
-- Data for Name: quiz_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quiz_profiles" ("id", "session_token", "user_id", "template_id", "answers", "applied_tags", "created_at") VALUES
	('13d7fba2-35d2-4362-b5b4-2297e4835d09', 'quiz_fyecug8pllnmpoihysd', '8dfd19be-441d-451e-96ae-956783c3deeb', '55550001-0000-0000-0000-000000000001', '{"77770001-0000-0000-0000-000000000001": ["0d410325-dcb4-4556-b82f-57e038a4aad8"], "77770001-0000-0000-0000-000000000002": ["6124bf8c-8639-4989-80f1-509f154e51e4"], "77770001-0000-0000-0000-000000000003": ["5b570099-25c6-472e-baa5-33388e425524"], "77770002-0000-0000-0000-000000000001": ["d795fb67-d482-49df-a657-6ae88f92e6e6"], "77770002-0000-0000-0000-000000000002": ["fe7b6179-7737-4c08-8287-5f1fbebc9944"], "77770002-0000-0000-0000-000000000003": ["3cc25d84-3cb8-48d3-a50a-2f0b0964a108"], "77770002-0000-0000-0000-000000000004": ["230d48fe-a3b1-4e4c-a9bb-c8ee052d3f18"], "77770002-0000-0000-0000-000000000005": ["338e94b9-0bc6-4cb3-a4c2-8365dad29fb8"]}', '{}', '2026-05-27 20:23:48.465548+00'),
	('32c81da0-5cdd-4605-8027-1da6cbb5d414', 'quiz_ui9u3wid10mmpoii092', '8dfd19be-441d-451e-96ae-956783c3deeb', '55550001-0000-0000-0000-000000000001', '{"77770001-0000-0000-0000-000000000001": ["0d410325-dcb4-4556-b82f-57e038a4aad8"], "77770001-0000-0000-0000-000000000002": ["6124bf8c-8639-4989-80f1-509f154e51e4"], "77770001-0000-0000-0000-000000000003": ["5b570099-25c6-472e-baa5-33388e425524"], "77770002-0000-0000-0000-000000000001": ["d795fb67-d482-49df-a657-6ae88f92e6e6"], "77770002-0000-0000-0000-000000000002": ["fe7b6179-7737-4c08-8287-5f1fbebc9944"], "77770002-0000-0000-0000-000000000003": ["3cc25d84-3cb8-48d3-a50a-2f0b0964a108"], "77770002-0000-0000-0000-000000000004": ["230d48fe-a3b1-4e4c-a9bb-c8ee052d3f18"], "77770002-0000-0000-0000-000000000005": ["338e94b9-0bc6-4cb3-a4c2-8365dad29fb8"]}', '{}', '2026-05-27 20:23:50.366854+00'),
	('c9442800-48da-439e-b3ce-edd6cb75ef7e', 'quiz_dpwntg25f28mpoiikcg', '8dfd19be-441d-451e-96ae-956783c3deeb', '55550001-0000-0000-0000-000000000001', '{"77770001-0000-0000-0000-000000000001": ["0d410325-dcb4-4556-b82f-57e038a4aad8"], "77770001-0000-0000-0000-000000000002": ["b3ba60f7-af6b-48e8-88e3-6fffcec1fa12"], "77770001-0000-0000-0000-000000000003": ["5b570099-25c6-472e-baa5-33388e425524"], "77770002-0000-0000-0000-000000000001": ["8a4cc272-9a32-4d2c-8197-b2ce6b5ca62e"], "77770002-0000-0000-0000-000000000002": ["fe7b6179-7737-4c08-8287-5f1fbebc9944"], "77770002-0000-0000-0000-000000000003": ["7f1e0770-86ac-4e78-b84f-3b3aa9ca912d"], "77770002-0000-0000-0000-000000000004": ["230d48fe-a3b1-4e4c-a9bb-c8ee052d3f18"], "77770002-0000-0000-0000-000000000005": ["91583029-737d-4247-9675-40d64d808e3e"]}', '{}', '2026-05-27 20:24:16.466501+00'),
	('dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', 'quiz_fk3h775hrpempornd0z', '8dfd19be-441d-451e-96ae-956783c3deeb', '55550001-0000-0000-0000-000000000001', '{"77770001-0000-0000-0000-000000000001": ["1efe8123-241e-4c4a-9f6e-53ab2c2ee504"], "77770001-0000-0000-0000-000000000002": ["08cdc2d6-af5f-4f19-ae85-4530ffbb092e"], "77770001-0000-0000-0000-000000000003": ["6c179a86-30fc-4e29-8c4e-5bc25a2209c4"], "77770002-0000-0000-0000-000000000001": ["299f2d65-3e9f-416e-83f5-df744a04c8a6"], "77770002-0000-0000-0000-000000000002": ["11b15681-3df4-4c81-954e-39b2fa4858c7"], "77770002-0000-0000-0000-000000000003": ["3cc25d84-3cb8-48d3-a50a-2f0b0964a108"], "77770002-0000-0000-0000-000000000004": ["9d05bb4f-16b5-45e0-994a-d1d9f980e514"], "77770002-0000-0000-0000-000000000005": ["310704c4-d193-4111-94ff-fdc64483958e"]}', '{}', '2026-05-28 00:39:56.565157+00');


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bot_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bot_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: kit_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."kit_products" ("kit_id", "variant_id", "quantity", "sort_order", "is_required") VALUES
	('44440001-0000-0000-0000-000000000001', '33330002-0000-0000-0000-000000000001', 1, 1, true),
	('44440001-0000-0000-0000-000000000001', '33330004-0000-0000-0000-000000000001', 1, 2, true),
	('44440001-0000-0000-0000-000000000001', '33330004-0000-0000-0000-000000000002', 1, 3, true),
	('44440001-0000-0000-0000-000000000002', '33330003-0000-0000-0000-000000000001', 1, 1, true),
	('44440001-0000-0000-0000-000000000002', '33330003-0000-0000-0000-000000000002', 1, 2, true),
	('44440001-0000-0000-0000-000000000002', '33330003-0000-0000-0000-000000000003', 1, 3, true),
	('44440001-0000-0000-0000-000000000003', '33330002-0000-0000-0000-000000000001', 1, 1, true),
	('44440001-0000-0000-0000-000000000003', '33330002-0000-0000-0000-000000000002', 1, 2, true),
	('44440001-0000-0000-0000-000000000003', '33330002-0000-0000-0000-000000000003', 1, 3, true),
	('44440001-0000-0000-0000-000000000004', '33330001-0000-0000-0000-000000000002', 1, 1, true),
	('44440001-0000-0000-0000-000000000004', '33330001-0000-0000-0000-000000000001', 1, 2, true),
	('44440001-0000-0000-0000-000000000004', '33330004-0000-0000-0000-000000000003', 1, 3, true);


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."leads" ("id", "email", "quiz_profile_id", "source", "created_at", "phone") VALUES
	('953e28ab-3f40-41f0-abed-31db6606fff4', 'pradoulima@gmail.com', '13d7fba2-35d2-4362-b5b4-2297e4835d09', 'quiz_p7', '2026-05-27 20:23:48.905172+00', NULL);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payment_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."product_prices" ("id", "variant_id", "currency", "amount_cents", "compare_at_cents", "effective_from", "effective_to") VALUES
	('7c965da4-1b82-4d90-863a-185b2f9d7a44', '33330001-0000-0000-0000-000000000001', 'PEN', 3900, NULL, '2026-05-27 19:36:07.683861+00', NULL),
	('91945d7b-7c1b-4d49-aaeb-17d60fbd1769', '33330001-0000-0000-0000-000000000002', 'PEN', 2500, NULL, '2026-05-27 19:36:07.683861+00', NULL),
	('ad8abd69-c583-4eb6-97c5-9a52a8afba3b', '33330001-0000-0000-0000-000000000003', 'PEN', 3500, 4500, '2026-05-27 19:36:07.683861+00', NULL),
	('5fc4ceb8-f321-4763-9fa1-d0d92601b556', '33330002-0000-0000-0000-000000000001', 'PEN', 18900, 21900, '2026-05-27 19:36:07.683861+00', NULL),
	('82237bba-8f42-42ab-8c89-d153547c1e06', '33330002-0000-0000-0000-000000000002', 'PEN', 8900, NULL, '2026-05-27 19:36:07.683861+00', NULL),
	('370669fa-7675-4ee1-98e8-2e9e92c63bde', '33330002-0000-0000-0000-000000000003', 'PEN', 6900, 8500, '2026-05-27 19:36:07.683861+00', NULL),
	('c9e203bf-094f-4a08-8dd6-def674bbf23f', '33330003-0000-0000-0000-000000000001', 'PEN', 7900, 9900, '2026-05-27 19:36:07.683861+00', NULL),
	('45f6d232-c3a6-4858-8278-94cb6b903622', '33330003-0000-0000-0000-000000000002', 'PEN', 6500, NULL, '2026-05-27 19:36:07.683861+00', NULL),
	('e353d242-98d6-4546-9769-440a75d4e9a6', '33330003-0000-0000-0000-000000000003', 'PEN', 4900, NULL, '2026-05-27 19:36:07.683861+00', NULL),
	('3c0596e8-2824-4436-89e7-22e42ac405bc', '33330004-0000-0000-0000-000000000001', 'PEN', 8900, NULL, '2026-05-27 19:36:07.683861+00', NULL),
	('93ed0bd0-6634-42ad-ba97-96cca162ccdb', '33330004-0000-0000-0000-000000000002', 'PEN', 10900, 12900, '2026-05-27 19:36:07.683861+00', NULL),
	('be20152b-4da2-4a28-bc01-037029303708', '33330004-0000-0000-0000-000000000003', 'PEN', 9900, NULL, '2026-05-27 19:36:07.683861+00', NULL);


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "first_name", "last_name", "phone", "avatar_url", "preferred_currency", "quiz_profile_id", "role", "created_at", "updated_at") VALUES
	('8dfd19be-441d-451e-96ae-956783c3deeb', 'José', 'Prado Astucuri', NULL, NULL, 'PEN', NULL, 'admin', '2026-05-27 19:50:33.211057+00', '2026-05-27 19:50:33.211057+00');


--
-- Data for Name: quiz_question_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quiz_question_groups" ("id", "template_id", "title", "sort_order", "interstitial_text") VALUES
	('66660001-0000-0000-0000-000000000001', '55550001-0000-0000-0000-000000000001', 'Tus objetivos', 1, '¡Buenas noticias! El 73% de clientes LIORA reduce al menos un suplemento innecesario. Quedan 5 preguntas — vale la pena.'),
	('66660001-0000-0000-0000-000000000002', '55550001-0000-0000-0000-000000000001', 'Tu cuerpo y rutina', 2, NULL);


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quiz_questions" ("id", "group_id", "text", "subtext", "type", "sort_order", "is_required", "conditions") VALUES
	('77770001-0000-0000-0000-000000000001', '66660001-0000-0000-0000-000000000001', '¿Cuál es tu objetivo principal?', 'Elige uno. Podemos ajustar después.', 'single', 1, true, NULL),
	('77770001-0000-0000-0000-000000000002', '66660001-0000-0000-0000-000000000001', '¿Cómo describirías tus mañanas?', 'No hay respuesta correcta — solo la tuya.', 'single', 2, true, NULL),
	('77770001-0000-0000-0000-000000000003', '66660001-0000-0000-0000-000000000001', '¿Cómo es tu piel hoy?', 'Si no estás segura, "Mixta" es buena apuesta.', 'single', 3, true, NULL),
	('77770002-0000-0000-0000-000000000001', '66660001-0000-0000-0000-000000000002', '¿Entrenas?', 'Cualquier movimiento cuenta.', 'single', 1, true, NULL),
	('77770002-0000-0000-0000-000000000002', '66660001-0000-0000-0000-000000000002', '¿Cuál es tu mayor preocupación?', 'Lo que más quieres mejorar ahora mismo.', 'single', 2, true, NULL),
	('77770002-0000-0000-0000-000000000003', '66660001-0000-0000-0000-000000000002', '¿Cómo es tu alimentación hoy?', 'Sin juicios — solo para conocerte mejor.', 'single', 3, true, NULL),
	('77770002-0000-0000-0000-000000000004', '66660001-0000-0000-0000-000000000002', '¿Cuánto tiempo tienes para tu rutina?', 'Diseñamos tu kit para que quepa en tu día.', 'single', 4, true, NULL),
	('77770002-0000-0000-0000-000000000005', '66660001-0000-0000-0000-000000000002', '¿Tienes alguna condición especial?', 'Para asegurarnos de recomendarte solo lo que es seguro.', 'single', 5, true, NULL);


--
-- Data for Name: quiz_question_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quiz_question_options" ("id", "question_id", "text", "slug", "icon_url", "sort_order", "tag_ids", "next_question_id") VALUES
	('0d410325-dcb4-4556-b82f-57e038a4aad8', '77770001-0000-0000-0000-000000000001', 'Más energía día a día', 'energia', NULL, 1, '{}', NULL),
	('f8d4375f-e8e3-44eb-bee7-1e92919da71f', '77770001-0000-0000-0000-000000000001', 'Ganar músculo', 'gym', NULL, 2, '{}', NULL),
	('419bed18-462c-4193-96a6-553285fdfb41', '77770001-0000-0000-0000-000000000001', 'Mejorar mi piel', 'skin', NULL, 3, '{}', NULL),
	('1efe8123-241e-4c4a-9f6e-53ab2c2ee504', '77770001-0000-0000-0000-000000000001', 'Comer más limpio', 'organico', NULL, 4, '{}', NULL),
	('6124bf8c-8639-4989-80f1-509f154e51e4', '77770001-0000-0000-0000-000000000002', 'Salto de la cama, lista', 'manana-activa', NULL, 1, '{}', NULL),
	('b3ba60f7-af6b-48e8-88e3-6fffcec1fa12', '77770001-0000-0000-0000-000000000002', 'Necesito mi café', 'manana-cafe', NULL, 2, '{}', NULL),
	('04184305-3fbb-49ed-854a-266f824b9be7', '77770001-0000-0000-0000-000000000002', 'Cuesta arrancar', 'manana-lenta', NULL, 3, '{}', NULL),
	('08cdc2d6-af5f-4f19-ae85-4530ffbb092e', '77770001-0000-0000-0000-000000000002', 'Depende del día', 'manana-variable', NULL, 4, '{}', NULL),
	('6c179a86-30fc-4e29-8c4e-5bc25a2209c4', '77770001-0000-0000-0000-000000000003', 'Grasa', 'piel-grasa', NULL, 1, '{}', NULL),
	('1e037391-c4b2-4d2c-ba05-051c3f869c6a', '77770001-0000-0000-0000-000000000003', 'Seca', 'piel-seca', NULL, 2, '{}', NULL),
	('5b570099-25c6-472e-baa5-33388e425524', '77770001-0000-0000-0000-000000000003', 'Mixta', 'piel-mixta', NULL, 3, '{}', NULL),
	('2a2e5fc9-82f7-4442-95cb-e7f6c03815ec', '77770001-0000-0000-0000-000000000003', 'Sensible', 'piel-sensible', NULL, 4, '{}', NULL),
	('299f2d65-3e9f-416e-83f5-df744a04c8a6', '77770002-0000-0000-0000-000000000001', '3+ veces por semana', 'alto-rendimiento', NULL, 1, '{}', NULL),
	('1bf216ce-b13c-430b-a8a8-c0ff1fe6d234', '77770002-0000-0000-0000-000000000001', '1–2 veces por semana', 'activo', NULL, 2, '{}', NULL),
	('8a4cc272-9a32-4d2c-8197-b2ce6b5ca62e', '77770002-0000-0000-0000-000000000001', 'Camino y ya', 'ligero', NULL, 3, '{}', NULL),
	('d795fb67-d482-49df-a657-6ae88f92e6e6', '77770002-0000-0000-0000-000000000001', 'No, pero quiero', 'principiante', NULL, 4, '{}', NULL),
	('11b15681-3df4-4c81-954e-39b2fa4858c7', '77770002-0000-0000-0000-000000000002', 'Energía y concentración', 'energia-mental', NULL, 1, '{}', NULL),
	('fe7b6179-7737-4c08-8287-5f1fbebc9944', '77770002-0000-0000-0000-000000000002', 'Peso y composición', 'peso', NULL, 2, '{}', NULL),
	('63a65870-48af-4956-8b39-49d00357e5c0', '77770002-0000-0000-0000-000000000002', 'Piel y cabello', 'belleza', NULL, 3, '{}', NULL),
	('a43c72cc-ad16-4472-8cf1-86dab8ea8939', '77770002-0000-0000-0000-000000000002', 'Sistema inmune', 'inmune', NULL, 4, '{}', NULL),
	('3cc25d84-3cb8-48d3-a50a-2f0b0964a108', '77770002-0000-0000-0000-000000000003', 'Muy saludable y ordenada', 'muy-saludable', NULL, 1, '{}', NULL),
	('55386ad7-31cd-44b0-befe-5149c90f5d0a', '77770002-0000-0000-0000-000000000003', 'Intento serlo', 'en-proceso', NULL, 2, '{}', NULL),
	('7f1e0770-86ac-4e78-b84f-3b3aa9ca912d', '77770002-0000-0000-0000-000000000003', 'Irregular, como lo que hay', 'irregular', NULL, 3, '{}', NULL),
	('26da0ebd-3a85-4301-8362-1c2ce26f0c6d', '77770002-0000-0000-0000-000000000003', 'Quiero mejorarla', 'quiero-mejorar', NULL, 4, '{}', NULL),
	('9d05bb4f-16b5-45e0-994a-d1d9f980e514', '77770002-0000-0000-0000-000000000004', '5 minutos (rápido y simple)', 'tiempo-minimo', NULL, 1, '{}', NULL),
	('230d48fe-a3b1-4e4c-a9bb-c8ee052d3f18', '77770002-0000-0000-0000-000000000004', '15–20 minutos', 'tiempo-medio', NULL, 2, '{}', NULL),
	('38b960e5-9f3b-4389-a23c-3ec4fc312ee4', '77770002-0000-0000-0000-000000000004', 'Tengo todo el tiempo', 'tiempo-completo', NULL, 3, '{}', NULL),
	('338e94b9-0bc6-4cb3-a4c2-8365dad29fb8', '77770002-0000-0000-0000-000000000005', 'Ninguna', 'sin-condicion', NULL, 1, '{}', NULL),
	('310704c4-d193-4111-94ff-fdc64483958e', '77770002-0000-0000-0000-000000000005', 'Embarazada o lactando', 'embarazo', NULL, 2, '{}', NULL),
	('58c445b1-8e9e-4a53-a6ad-676c1a6f4ec0', '77770002-0000-0000-0000-000000000005', 'Problemas digestivos', 'digestivo', NULL, 3, '{}', NULL),
	('91583029-737d-4247-9675-40d64d808e3e', '77770002-0000-0000-0000-000000000005', 'Piel sensible / alergias', 'alergias', NULL, 4, '{}', NULL);


--
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."recommendations" ("id", "quiz_profile_id", "variant_id", "score", "rationale", "created_at") VALUES
	('b0656edd-3917-41ca-bb5a-8c9fa9eb47f5', 'c9442800-48da-439e-b3ce-edd6cb75ef7e', '33330001-0000-0000-0000-000000000001', 50, 'kit', '2026-05-28 00:23:37.450717+00'),
	('03763062-f66a-4adb-ac3b-c7ac75f398a0', 'c9442800-48da-439e-b3ce-edd6cb75ef7e', '33330002-0000-0000-0000-000000000001', 40, 'kit', '2026-05-28 00:23:37.450717+00'),
	('fb194f1b-cebf-462f-9ef4-a5a334cd49cf', 'c9442800-48da-439e-b3ce-edd6cb75ef7e', '33330004-0000-0000-0000-000000000001', 30, 'kit', '2026-05-28 00:23:37.450717+00'),
	('bac3d650-e28d-4ded-b07d-98d30808810a', 'c9442800-48da-439e-b3ce-edd6cb75ef7e', '33330003-0000-0000-0000-000000000002', 20, 'kit', '2026-05-28 00:23:37.450717+00'),
	('467eb52c-1ea0-4fd6-bcc8-5f3243df2005', 'c9442800-48da-439e-b3ce-edd6cb75ef7e', '33330002-0000-0000-0000-000000000003', 15, 'suggestion', '2026-05-28 00:23:37.450717+00'),
	('40baea65-7679-4914-b955-20a233b2b384', 'c9442800-48da-439e-b3ce-edd6cb75ef7e', '33330003-0000-0000-0000-000000000001', 10, 'suggestion', '2026-05-28 00:23:37.450717+00'),
	('4754f53f-c4ea-4b03-baee-72542106335e', 'c9442800-48da-439e-b3ce-edd6cb75ef7e', '33330004-0000-0000-0000-000000000002', 5, 'suggestion', '2026-05-28 00:23:37.450717+00'),
	('b0f99f02-68cd-4a71-9ac5-db68ad4ed1de', 'dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', '33330002-0000-0000-0000-000000000001', 50, 'kit', '2026-05-28 00:40:07.341026+00'),
	('24d16f8c-0e25-4472-8c41-73ce53dd5ae0', 'dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', '33330004-0000-0000-0000-000000000001', 40, 'kit', '2026-05-28 00:40:07.341026+00'),
	('19c5a4cd-12bf-4ee5-9ec1-80794aa9c9cd', 'dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', '33330003-0000-0000-0000-000000000002', 30, 'kit', '2026-05-28 00:40:07.341026+00'),
	('88be364c-b279-4a8e-8085-e095bd11157c', 'dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', '33330001-0000-0000-0000-000000000003', 20, 'kit', '2026-05-28 00:40:07.341026+00'),
	('495fef2b-1b30-428f-975b-55ccc733fa4f', 'dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', '33330002-0000-0000-0000-000000000002', 15, 'suggestion', '2026-05-28 00:40:07.341026+00'),
	('08567194-1bda-4bb2-ba7b-3be84bf73c7f', 'dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', '33330003-0000-0000-0000-000000000001', 10, 'suggestion', '2026-05-28 00:40:07.341026+00'),
	('aa6ba5ac-920e-4213-820d-bd293945debd', 'dbc9406f-c0da-4cd7-b98a-253cdd6c77d5', '33330004-0000-0000-0000-000000000002', 5, 'suggestion', '2026-05-28 00:40:07.341026+00');


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 19, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict Sj3wV1wv0sVOwMfeOxOQgnBLjz0rCWyvHBC0k3WHgnySpQyBbaqbCuX3JKQMtRq

RESET ALL;
