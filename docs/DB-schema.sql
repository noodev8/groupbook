--
-- PostgreSQL database dump
--

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.4

-- Started on 2025-12-15 13:13:19

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
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: groupbook_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO groupbook_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 23105)
-- Name: app_user; Type: TABLE; Schema: public; Owner: groupbook_user
--

CREATE TABLE public.app_user (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    restaurant_name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    logo_url text,
    hero_image_url text,
    terms_link text
);


ALTER TABLE public.app_user OWNER TO groupbook_user;

--
-- TOC entry 219 (class 1259 OID 23104)
-- Name: app_user_id_seq; Type: SEQUENCE; Schema: public; Owner: groupbook_user
--

CREATE SEQUENCE public.app_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_user_id_seq OWNER TO groupbook_user;

--
-- TOC entry 3427 (class 0 OID 0)
-- Dependencies: 219
-- Name: app_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groupbook_user
--

ALTER SEQUENCE public.app_user_id_seq OWNED BY public.app_user.id;


--
-- TOC entry 216 (class 1259 OID 23085)
-- Name: event; Type: TABLE; Schema: public; Owner: groupbook_user
--

CREATE TABLE public.event (
    id integer NOT NULL,
    restaurant_name character varying(255) NOT NULL,
    event_name character varying(255) NOT NULL,
    event_date_time timestamp without time zone NOT NULL,
    cutoff_datetime timestamp without time zone,
    link_token character varying(64) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    app_user_id integer NOT NULL,
    party_lead_name character varying(255),
    party_lead_email character varying(255),
    party_lead_phone character varying(50),
    is_locked boolean DEFAULT false,
    staff_notes text,
    menu_link text
);


ALTER TABLE public.event OWNER TO groupbook_user;

--
-- TOC entry 215 (class 1259 OID 23084)
-- Name: event_id_seq; Type: SEQUENCE; Schema: public; Owner: groupbook_user
--

CREATE SEQUENCE public.event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_id_seq OWNER TO groupbook_user;

--
-- TOC entry 3428 (class 0 OID 0)
-- Dependencies: 215
-- Name: event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groupbook_user
--

ALTER SEQUENCE public.event_id_seq OWNED BY public.event.id;


--
-- TOC entry 218 (class 1259 OID 23095)
-- Name: guest; Type: TABLE; Schema: public; Owner: groupbook_user
--

CREATE TABLE public.guest (
    id integer NOT NULL,
    event_id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    food_order text,
    edit_token character varying(64),
    dietary_notes text
);


ALTER TABLE public.guest OWNER TO groupbook_user;

--
-- TOC entry 217 (class 1259 OID 23094)
-- Name: guest_id_seq; Type: SEQUENCE; Schema: public; Owner: groupbook_user
--

CREATE SEQUENCE public.guest_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_id_seq OWNER TO groupbook_user;

--
-- TOC entry 3429 (class 0 OID 0)
-- Dependencies: 217
-- Name: guest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groupbook_user
--

ALTER SEQUENCE public.guest_id_seq OWNED BY public.guest.id;


--
-- TOC entry 3266 (class 2604 OID 23108)
-- Name: app_user id; Type: DEFAULT; Schema: public; Owner: groupbook_user
--

ALTER TABLE ONLY public.app_user ALTER COLUMN id SET DEFAULT nextval('public.app_user_id_seq'::regclass);


--
-- TOC entry 3261 (class 2604 OID 23088)
-- Name: event id; Type: DEFAULT; Schema: public; Owner: groupbook_user
--

ALTER TABLE ONLY public.event ALTER COLUMN id SET DEFAULT nextval('public.event_id_seq'::regclass);


--
-- TOC entry 3264 (class 2604 OID 23098)
-- Name: guest id; Type: DEFAULT; Schema: public; Owner: groupbook_user
--

ALTER TABLE ONLY public.guest ALTER COLUMN id SET DEFAULT nextval('public.guest_id_seq'::regclass);


--
-- TOC entry 3277 (class 2606 OID 23113)
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: groupbook_user
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- TOC entry 3269 (class 2606 OID 23093)
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: groupbook_user
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);


--
-- TOC entry 3273 (class 2606 OID 23101)
-- Name: guest guest_pkey; Type: CONSTRAINT; Schema: public; Owner: groupbook_user
--

ALTER TABLE ONLY public.guest
    ADD CONSTRAINT guest_pkey PRIMARY KEY (id);


--
-- TOC entry 3278 (class 1259 OID 23114)
-- Name: idx_app_user_email; Type: INDEX; Schema: public; Owner: groupbook_user
--

CREATE UNIQUE INDEX idx_app_user_email ON public.app_user USING btree (email);


--
-- TOC entry 3270 (class 1259 OID 23115)
-- Name: idx_event_app_user_id; Type: INDEX; Schema: public; Owner: groupbook_user
--

CREATE INDEX idx_event_app_user_id ON public.event USING btree (app_user_id);


--
-- TOC entry 3271 (class 1259 OID 23102)
-- Name: idx_event_link_token; Type: INDEX; Schema: public; Owner: groupbook_user
--

CREATE UNIQUE INDEX idx_event_link_token ON public.event USING btree (link_token);


--
-- TOC entry 3274 (class 1259 OID 23127)
-- Name: idx_guest_edit_token; Type: INDEX; Schema: public; Owner: groupbook_user
--

CREATE INDEX idx_guest_edit_token ON public.guest USING btree (edit_token);


--
-- TOC entry 3275 (class 1259 OID 23103)
-- Name: idx_guest_event_id; Type: INDEX; Schema: public; Owner: groupbook_user
--

CREATE INDEX idx_guest_event_id ON public.guest USING btree (event_id);


--
-- TOC entry 2048 (class 826 OID 23083)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO groupbook_user;


--
-- TOC entry 2049 (class 826 OID 23082)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO groupbook_user;


-- Completed on 2025-12-15 13:13:25

--
-- PostgreSQL database dump complete
--

