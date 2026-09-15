--
-- childcare.public schema-only dump
-- Generated via information_schema/pg_catalog (pg_dump.exe is blocked
-- by an Application Control policy on this machine).
--

CREATE SEQUENCE public.application_agreements_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE public.applications_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE public.roles_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE public.security_questions_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE public.state_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE public.user_activation_codes_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE public.user_security_questions_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE public.users_id_seq
    AS bigint START WITH 1 INCREMENT BY 1
    MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE TABLE public.application_agreements (
    id bigint NOT NULL DEFAULT nextval('application_agreements_id_seq'::regclass),
    application_id bigint NOT NULL,
    consent_item_code character varying(100) NOT NULL,
    accepted boolean NOT NULL,
    body_snapshot text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

CREATE TABLE public.applications (
    id bigint NOT NULL DEFAULT nextval('applications_id_seq'::regclass),
    reference_code character varying(50) NOT NULL,
    applicant_user_id bigint,
    application_details jsonb NOT NULL DEFAULT '{}'::jsonb,
    application_status character varying(30) NOT NULL DEFAULT 'DRAFT'::character varying,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100),
    form_snapshot jsonb,
    applicant_type character varying(30),
    service_type character varying(30),
    applicant_name character varying(200),
    applicant_email character varying(255),
    child_count integer,
    application_name character varying(120),
    ccms_aplctn_id bigint
);

CREATE TABLE public.roles (
    id bigint NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
    role_name character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

CREATE TABLE public.security_questions (
    id bigint NOT NULL DEFAULT nextval('security_questions_id_seq'::regclass),
    question_text character varying(500) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

CREATE TABLE public.state (
    id bigint NOT NULL DEFAULT nextval('state_id_seq'::regclass),
    name character varying(100) NOT NULL,
    short_code character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

CREATE TABLE public.user_activation_codes (
    id bigint NOT NULL DEFAULT nextval('user_activation_codes_id_seq'::regclass),
    user_id bigint NOT NULL,
    activation_type character varying(20) NOT NULL,
    code_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    attempt_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

CREATE TABLE public.user_roles (
    user_id bigint NOT NULL,
    role_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

CREATE TABLE public.user_security_questions (
    id bigint NOT NULL DEFAULT nextval('user_security_questions_id_seq'::regclass),
    user_id bigint NOT NULL,
    security_question_id bigint NOT NULL,
    answer_hash character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

CREATE TABLE public.users (
    id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    user_id character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    recovery_email character varying(255) NOT NULL,
    recovery_phone character varying(20),
    email_verified boolean NOT NULL DEFAULT false,
    phone_verified boolean NOT NULL DEFAULT false,
    account_status character varying(20) NOT NULL DEFAULT 'PENDING'::character varying,
    failed_login_attempts integer NOT NULL DEFAULT 0,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by character varying(100),
    updated_by character varying(100)
);

ALTER TABLE ONLY public.application_agreements
    ADD CONSTRAINT application_agreements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.application_agreements
    ADD CONSTRAINT application_agreements_application_id_consent_item_code_key UNIQUE (application_id, consent_item_code);

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_reference_code_key UNIQUE (reference_code);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);

ALTER TABLE ONLY public.security_questions
    ADD CONSTRAINT security_questions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.security_questions
    ADD CONSTRAINT security_questions_question_text_key UNIQUE (question_text);

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state_short_code_key UNIQUE (short_code);

ALTER TABLE ONLY public.user_activation_codes
    ADD CONSTRAINT user_activation_codes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (role_id, user_id);

ALTER TABLE ONLY public.user_security_questions
    ADD CONSTRAINT user_security_questions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_recovery_email_key UNIQUE (recovery_email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.application_agreements
    ADD CONSTRAINT application_agreements_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_applicant_user_id_fkey FOREIGN KEY (applicant_user_id)
    REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE ONLY public.user_activation_codes
    ADD CONSTRAINT user_activation_codes_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id)
    REFERENCES public.roles (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_security_questions
    ADD CONSTRAINT user_security_questions_security_question_id_fkey FOREIGN KEY (security_question_id)
    REFERENCES public.security_questions (id);

ALTER TABLE ONLY public.user_security_questions
    ADD CONSTRAINT user_security_questions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_application_status_check CHECK ((application_status)::text = ANY ((ARRAY['DRAFT'::character varying, 'SUBMITTED'::character varying, 'IN_REVIEW'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'WITHDRAWN'::character varying])::text[]));

ALTER TABLE ONLY public.user_activation_codes
    ADD CONSTRAINT user_activation_codes_activation_type_check CHECK ((activation_type)::text = ANY ((ARRAY['EMAIL'::character varying, 'PHONE'::character varying])::text[]));

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_account_status_check CHECK ((account_status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'LOCKED'::character varying, 'DISABLED'::character varying])::text[]));

CREATE INDEX application_agreements_app_idx ON public.application_agreements USING btree (application_id);

CREATE INDEX applications_applicant_idx ON public.applications USING btree (applicant_user_id, application_status);

CREATE INDEX applications_details_gin ON public.applications USING gin (application_details jsonb_path_ops);

CREATE INDEX applications_status_idx ON public.applications USING btree (application_status);

CREATE INDEX applications_type_idx ON public.applications USING btree (applicant_type, service_type);

CREATE INDEX uac_user_idx ON public.user_activation_codes USING btree (user_id);

CREATE INDEX usq_user_idx ON public.user_security_questions USING btree (user_id);
