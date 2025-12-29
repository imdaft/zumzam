--
-- PostgreSQL database dump
--

\restrict 7ctV9Rf5VOAaOXfGORq38WkpmfkKPmqG93JfQkNnqczd2JEBzUT0j9rdO78tEYH

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
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.tenants (id, name, external_id, jwt_secret, max_concurrent_users, inserted_at, updated_at, max_events_per_second, postgres_cdc_default, max_bytes_per_second, max_channels_per_client, max_joins_per_second, suspend, jwt_jwks, notify_private_alpha, private_only, migrations_ran, broadcast_adapter, max_presence_events_per_second, max_payload_size_in_kb) FROM stdin;
2ac4ad4c-3f34-4a87-a761-862b480f6702	realtime-dev	realtime-dev	iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==	200	2025-12-25 06:46:48	2025-12-25 06:46:48	100	postgres_cdc_rls	100000	100	100	f	{"keys": [{"k": "c3VwZXItc2VjcmV0LWp3dC10b2tlbi13aXRoLWF0LWxlYXN0LTMyLWNoYXJhY3RlcnMtbG9uZw", "kty": "oct"}]}	f	f	65	gen_rpc	1000	3000
\.


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.extensions (id, type, settings, tenant_external_id, inserted_at, updated_at) FROM stdin;
b161b389-d93a-4a5c-bb35-bb798ef916ed	postgres_cdc_rls	{"region": "us-east-1", "db_host": "5jhkTz7TtlshC/+sMCx2M5u2NH68fKzVTuWuICHvDbU=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2025-12-25 06:46:48	2025-12-25 06:46:48
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.schema_migrations (version, inserted_at) FROM stdin;
20210706140551	2025-12-25 06:35:12
20220329161857	2025-12-25 06:35:12
20220410212326	2025-12-25 06:35:12
20220506102948	2025-12-25 06:35:12
20220527210857	2025-12-25 06:35:12
20220815211129	2025-12-25 06:35:12
20220815215024	2025-12-25 06:35:12
20220818141501	2025-12-25 06:35:12
20221018173709	2025-12-25 06:35:12
20221102172703	2025-12-25 06:35:12
20221223010058	2025-12-25 06:35:12
20230110180046	2025-12-25 06:35:12
20230810220907	2025-12-25 06:35:12
20230810220924	2025-12-25 06:35:12
20231024094642	2025-12-25 06:35:12
20240306114423	2025-12-25 06:35:12
20240418082835	2025-12-25 06:35:12
20240625211759	2025-12-25 06:35:12
20240704172020	2025-12-25 06:35:12
20240902173232	2025-12-25 06:35:12
20241106103258	2025-12-25 06:35:12
20250424203323	2025-12-25 06:35:12
20250613072131	2025-12-25 06:35:13
20250711044927	2025-12-25 06:35:13
20250811121559	2025-12-25 06:35:13
20250926223044	2025-12-25 06:35:13
20251204170944	2025-12-25 06:35:13
20251218000543	2025-12-25 06:35:13
\.


--
-- Data for Name: activity_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, full_name, avatar_url, phone, created_at, updated_at, role, is_blocked, last_login_at, credits, telegram_chat_id, telegram_username, onboarding_completed, push_notifications_enabled, email_notifications_enabled, telegram_notifications_enabled) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, slug, display_name, bio, description, city, address, geo_location, rating, reviews_count, bookings_completed, response_time_minutes, price_range, embedding, photos, videos, cover_photo, portfolio_url, verified, verification_date, email, phone, website, social_links, created_at, updated_at, details, main_photo, is_published, user_id, logo, section_order, locations_menu_label, custom_fields_config, faq, legal_agreement_type, legal_agreement_url, legal_agreement_text, legal_agreement_generated_data, legal_agreement_generated_text, booking_rules_type, booking_rules_text, booking_rules_generated_data, booking_rules_generated_text, legal_docs_generated_at, verification_status, rejection_reason, legal_form, claim_status, claim_token, claimed_at, created_by, tags, secondary_categories, section_templates, cover_photo_crop, cover_photo_ai_expanded, role, video_cover, age_restrictions, capacity_info, payment_methods, messenger_contacts, working_hours, metro_stations, parking_info, accessibility, amenities, prepayment_policy, area_info, structured_address, activities, additional_services, search_vector, primary_services, category, primary_venue_type, services) FROM stdin;
\.


--
-- Data for Name: agency_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agency_cases (id, profile_id, title, description, photos, event_type, guest_count, budget_tier, included_services, is_active, display_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agency_partners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agency_partners (id, agency_profile_id, partner_profile_id, custom_name, custom_specialization, custom_photo, custom_description, custom_contacts, is_active, display_order, created_at) FROM stdin;
\.


--
-- Data for Name: agency_services_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agency_services_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: animator_services_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.animator_services_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: master_class_programs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_class_programs (id, profile_id, name, description, photo, video_url, duration_minutes, age_min, age_max, min_participants, max_participants, materials_included, materials_list, take_home, certificate, categories, price, active, created_at) FROM stdin;
\.


--
-- Data for Name: masterclass_types_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.masterclass_types_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: photographer_styles_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.photographer_styles_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: profile_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_activities (id, profile_id, activity_id, created_at) FROM stdin;
\.


--
-- Data for Name: profile_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_locations (id, profile_id, city, address, name, phone, email, geo_location, is_main, active, details, yandex_url, yandex_rating, yandex_review_count, photos, video_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: profile_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_services (id, profile_id, service_id, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: quest_types_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quest_types_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, profile_id, user_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: service_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, profile_id, name, description, price, duration_minutes, photos, is_additional, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: show_types_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.show_types_catalog (id, name_ru, name_en, category, icon, description) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_activity (id, user_id, session_id, action_type, action_data, page_url, referrer_url, device_type, ip_address, user_agent, created_at) FROM stdin;
90dc20a0-aafb-4743-b7be-304effe33ddb	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	page_view	{"path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": "", "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:11:29.567888+00
671fb558-2747-41ea-b35f-36a2c25b463d	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 0, "time_seconds": 19}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:11:29.567888+00
850c81f2-85fc-458c-b90e-901a00e4f17d	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 0, "time_seconds": 48}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:11:44.569821+00
8d172109-bdc9-4f97-bdc6-da50b535da5c	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/profiles", "path": "/profiles", "title": "ZumZam — Детские праздники в Санкт-Петербурге | Аниматоры, студии, квесты", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1447}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 100, "time_seconds": 27923}	http://localhost:4000/profiles		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:37.726154+00
e0a6f44f-da21-4e4e-8010-94d9cf0418c9	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 0, "time_seconds": 293}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:37.878993+00
9415da55-7117-425b-85ce-300b2886ec90	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	page_view	{"path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": "", "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:43.652367+00
187a0a0d-ac62-40aa-b558-f0e9e280b848	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 25, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:48.615205+00
e0f6255b-e427-4190-a6e9-034ef620e3b7	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 50, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:48.615205+00
0702a3d5-d31d-4422-8b1e-753b90ba4cfd	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 75, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:48.615205+00
79fe0d03-16a2-481d-8010-46b53d123620	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 100, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:48.615205+00
ab19cd2e-3602-4adc-8004-e910983c26df	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 100, "time_seconds": 11}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:49.464174+00
d2d1e221-8735-4b81-8d3d-85b7448b3303	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	page_view	{"path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": "", "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:55.17298+00
6eeb2848-bbfb-415e-a48e-ebe31daa4a65	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	link_click	{"url": "http://localhost:4000/", "text": "", "external": false, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:16:55.17298+00
e353dad8-8f15-4960-84e8-3c246bde885e	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 0, "time_seconds": 6}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:17:00.567714+00
389b414d-4fed-42a3-ac1b-0009eadf8554	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 0, "time_seconds": 333}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:22:33.006525+00
ac8c20d8-54db-4baf-8c39-fd593c86531a	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	page_view	{"path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": "", "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:22:44.366248+00
5aa7540a-5970-44f2-8060-669828b3c5c6	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 25, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:22:44.366248+00
eb49a9f2-cfb0-4c86-a929-93b65029578e	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 50, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:22:44.366248+00
47c2dc66-838d-4ad1-a52e-5f8603a26bdd	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 75, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:22:44.366248+00
262ba1d1-7ab1-420f-a8c1-5261aa755ce6	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	scroll_depth	{"depth": 100, "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:22:44.366248+00
0e7dd26b-14ba-4bf8-80b6-64a84c183e02	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 100, "time_seconds": 13}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:22:51.616179+00
17fce7a6-572c-4478-9cc8-ea368abfa470	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 100, "time_seconds": 13}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:23:06.682649+00
113c3d8a-19ef-41ed-bf35-9a15d2175f7d	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 100, "time_seconds": 126}	http://localhost:4000/		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:25:11.575299+00
aa0afa2d-1451-4d13-b42a-9b81f5c86415	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	page_view	{"path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": "", "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "http://localhost:4000/", "host": "localhost:4000"}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/	http://localhost:4000/	desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:41:01.026066+00
fb6295e2-3f9f-4621-8021-ffdc2bc58b1d	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "http://localhost:4000/", "host": "localhost:4000"}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 0, "time_seconds": 641}	http://localhost:4000/	http://localhost:4000/	desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:41:01.026066+00
412c8a9a-b868-454c-a13d-f1e87af613ef	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	page_view	{"path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": "", "__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "http://localhost:4000/", "host": "localhost:4000"}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}}	http://localhost:4000/	http://localhost:4000/	desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:41:14.2291+00
e921d8ae-8dc8-4586-abe9-d2825bd2d551	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/", "path": "/", "title": "ZumZam - детские праздники | ZumZam", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "http://localhost:4000/", "host": "localhost:4000"}, "viewport": {"h": 911, "w": 1482}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 24, "time_seconds": 2266}	http://localhost:4000/	http://localhost:4000/	desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 14:19:03.140833+00
354493f0-cc9c-499b-9d8d-553ac168334b	\N	c3fc52a0-2f49-4662-ac9e-0210274cb183	time_on_page	{"__context": {"os": "Windows", "browser": "Chrome", "context": {"page": {"url": "http://localhost:4000/profiles", "path": "/profiles", "title": "ZumZam — Детские праздники в Санкт-Петербурге | Аниматоры, студии, квесты", "search": ""}, "locale": "ru-RU", "screen": {"h": 1080, "w": 1920}, "referrer": {"url": "", "host": ""}, "viewport": {"h": 911, "w": 1447}, "tz_offset_min": -180}, "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "device_type": "desktop"}, "scroll_depth": 100, "time_seconds": 3736}	http://localhost:4000/profiles		desktop	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 14:19:03.140832+00
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 7ctV9Rf5VOAaOXfGORq38WkpmfkKPmqG93JfQkNnqczd2JEBzUT0j9rdO78tEYH

