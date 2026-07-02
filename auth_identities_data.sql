--
-- PostgreSQL database dump
--

\restrict z8m9g98OXdnsrIAOGwPXuF4ex0csJSYTuBS21hRDFCPF0IRLF7oZTaUTMEi64Nk

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
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
4c3436ec-7e84-4b31-afbb-0c8858ddb0c3	4c3436ec-7e84-4b31-afbb-0c8858ddb0c3	{"sub": "4c3436ec-7e84-4b31-afbb-0c8858ddb0c3", "email": "info.nishantchauhan@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-06-29 20:36:02.680968+00	2026-06-29 20:36:02.681993+00	2026-06-29 20:36:02.681993+00	92575e9d-32f6-4be5-98bf-180f9324612a
115734020192034330946	4c3436ec-7e84-4b31-afbb-0c8858ddb0c3	{"iss": "https://accounts.google.com", "sub": "115734020192034330946", "name": "Nishant Chauhan", "email": "info.nishantchauhan@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKBd1uabXdfRDULADJ5fPbfszW7MBHhaoOHS0bOhqURvuEbOVztzg=s96-c", "full_name": "Nishant Chauhan", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKBd1uabXdfRDULADJ5fPbfszW7MBHhaoOHS0bOhqURvuEbOVztzg=s96-c", "provider_id": "115734020192034330946", "email_verified": true, "phone_verified": false}	google	2026-06-29 22:23:47.028924+00	2026-06-29 22:23:47.02899+00	2026-06-29 22:23:47.02899+00	19726142-f662-4ec2-95c1-391bdd895f50
105022489076762910886	edff9f2c-9304-4aff-befd-f0865d5a9915	{"iss": "https://accounts.google.com", "sub": "105022489076762910886", "name": "Nishant chauhan", "email": "thenoobinfo@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLyO56fpgEzXX8N6tj4vNCN5CiFdyb1AaaQxyNNd1Xr8AQ5LzU=s96-c", "full_name": "Nishant chauhan", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLyO56fpgEzXX8N6tj4vNCN5CiFdyb1AaaQxyNNd1Xr8AQ5LzU=s96-c", "provider_id": "105022489076762910886", "email_verified": true, "phone_verified": false}	google	2026-06-29 22:18:59.259985+00	2026-06-29 22:18:59.260042+00	2026-06-30 11:57:48.181855+00	7aee0c9c-c5e5-4e51-8455-14e271fa5adb
35cade87-2502-4766-9f1f-27fcb84b519f	35cade87-2502-4766-9f1f-27fcb84b519f	{"sub": "35cade87-2502-4766-9f1f-27fcb84b519f", "firm": "", "email": "yashk6885@gmail.com", "full_name": "Yash", "email_verified": false, "phone_verified": false}	email	2026-06-30 15:16:32.404857+00	2026-06-30 15:16:32.404908+00	2026-06-30 15:16:32.404908+00	ccffb72b-65c5-4560-a9cf-733604a2f766
f9298a0f-5a0c-46af-be6e-3eadfad319c0	f9298a0f-5a0c-46af-be6e-3eadfad319c0	{"sub": "f9298a0f-5a0c-46af-be6e-3eadfad319c0", "firm": "abc broker", "email": "ravindracscrohtak@gmail.com", "full_name": "ravi", "email_verified": false, "phone_verified": false}	email	2026-06-30 18:20:51.410857+00	2026-06-30 18:20:51.410907+00	2026-06-30 18:20:51.410907+00	d7ec3fba-09b9-4561-bd42-fb04062ac6df
\.


--
-- PostgreSQL database dump complete
--

\unrestrict z8m9g98OXdnsrIAOGwPXuF4ex0csJSYTuBS21hRDFCPF0IRLF7oZTaUTMEi64Nk

