--
-- PostgreSQL database dump
--

\restrict BzkCIvcCBhYN1wpAaSeFGrdGHQudWSOdDCgqKk9o9N9Tpcs41Oq4a7YDPmc9RcN

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

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
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	35cade87-2502-4766-9f1f-27fcb84b519f	authenticated	authenticated	yashk6885@gmail.com	$2a$10$m7uZhw2RYnN0osHed.lEhefPvTXP4vnjml0yWZXidfcCVVIMj1Oh6	2026-06-30 15:16:32.409876+00	\N		\N		\N			\N	2026-06-30 15:16:32.419968+00	{"provider": "email", "providers": ["email"]}	{"sub": "35cade87-2502-4766-9f1f-27fcb84b519f", "firm": "", "email": "yashk6885@gmail.com", "full_name": "Yash", "email_verified": true, "phone_verified": false}	\N	2026-06-30 15:16:32.367332+00	2026-06-30 16:41:52.486394+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	edff9f2c-9304-4aff-befd-f0865d5a9915	authenticated	authenticated	thenoobinfo@gmail.com	\N	2026-06-29 22:18:59.265735+00	\N		\N		\N			\N	2026-06-30 11:57:48.20185+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "105022489076762910886", "name": "Nishant chauhan", "email": "thenoobinfo@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLyO56fpgEzXX8N6tj4vNCN5CiFdyb1AaaQxyNNd1Xr8AQ5LzU=s96-c", "full_name": "Nishant chauhan", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLyO56fpgEzXX8N6tj4vNCN5CiFdyb1AaaQxyNNd1Xr8AQ5LzU=s96-c", "provider_id": "105022489076762910886", "email_verified": true, "phone_verified": false}	\N	2026-06-29 22:18:59.237231+00	2026-06-30 16:59:08.935869+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f9298a0f-5a0c-46af-be6e-3eadfad319c0	authenticated	authenticated	ravindracscrohtak@gmail.com	$2a$10$J0b8aoXVD0QheI1zs0pVJOJXwG6e27PAG8UKrXB0Bo2Lq38apZLtC	2026-06-30 18:20:51.41867+00	\N		\N		\N			\N	2026-06-30 18:20:51.429424+00	{"provider": "email", "providers": ["email"]}	{"sub": "f9298a0f-5a0c-46af-be6e-3eadfad319c0", "firm": "abc broker", "email": "ravindracscrohtak@gmail.com", "full_name": "ravi", "email_verified": true, "phone_verified": false}	\N	2026-06-30 18:20:51.338638+00	2026-06-30 18:20:51.454389+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4c3436ec-7e84-4b31-afbb-0c8858ddb0c3	authenticated	authenticated	info.nishantchauhan@gmail.com	$2a$10$T9S//4Qo6YXpD6EVieWQwOhua4LnEL/s30dfetBcz3WnlZpuXZub6	2026-06-29 20:36:02.686887+00	\N		\N		\N			\N	2026-06-30 18:57:00.911676+00	{"provider": "email", "providers": ["email", "google"]}	{"iss": "https://accounts.google.com", "sub": "115734020192034330946", "name": "Nishant Chauhan", "email": "info.nishantchauhan@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKBd1uabXdfRDULADJ5fPbfszW7MBHhaoOHS0bOhqURvuEbOVztzg=s96-c", "full_name": "Nishant Chauhan", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKBd1uabXdfRDULADJ5fPbfszW7MBHhaoOHS0bOhqURvuEbOVztzg=s96-c", "provider_id": "115734020192034330946", "email_verified": true, "phone_verified": false}	\N	2026-06-29 20:36:02.662568+00	2026-06-30 20:07:50.80606+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- PostgreSQL database dump complete
--

\unrestrict BzkCIvcCBhYN1wpAaSeFGrdGHQudWSOdDCgqKk9o9N9Tpcs41Oq4a7YDPmc9RcN

