-- ===========================================================================
-- Child Support Application — database schema
-- Source: Child_Support_Application_Data_Models_V1 (Excel), PostgreSQL 15+
--
-- The whole application form is stored as JSON in applications.application_details.
-- application_agreements holds an audit copy of each consent clause accepted.
--
-- Deviations from the spreadsheet (intentional):
--   * application_details is JSONB (not JSON) — same storage, but queryable/indexable.
--   * application_agreements is 1:N with applications (one row per consent item),
--     not 1:1 — the columns (consent_item_code / accepted / body_snapshot) are
--     per-item. It also carries application_id, required by the Relationships sheet.
--   * users.user_id holds the Cognito 'sub'; users.password_hash is the sentinel
--     'COGNITO' because credentials live in the Cognito user pool.
-- ===========================================================================

create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ── state ──────────────────────────────────────────────────────────────────
create table if not exists state (
  id          bigserial     primary key,
  name        varchar(100)  not null,
  short_code  varchar(100)  not null,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),
  created_by  varchar(100),
  updated_by  varchar(100),
  unique (short_code)
);


-- ── users ──────────────────────────────────────────────────────────────────
create table if not exists users (
  id                    bigserial     primary key,
  first_name            varchar(100)  not null,
  last_name             varchar(100)  not null,
  user_id               varchar(100)  not null unique,   -- unique login id (Cognito 'sub')
  password_hash         varchar(255)  not null,          -- 'COGNITO' when auth is delegated
  recovery_email        varchar(255)  not null unique,
  recovery_phone        varchar(20),
  email_verified        boolean       not null default false,
  phone_verified        boolean       not null default false,
  account_status        varchar(20)   not null default 'PENDING'
                        check (account_status in ('PENDING','ACTIVE','LOCKED','DISABLED')),
  failed_login_attempts integer       not null default 0,
  locked_until          timestamptz,
  last_login_at         timestamptz,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),
  created_by            varchar(100),
  updated_by            varchar(100)
);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();


-- ── security_questions ─────────────────────────────────────────────────────
create table if not exists security_questions (
  id            bigserial     primary key,
  question_text varchar(500)  not null unique,
  active        boolean       not null default true,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  created_by    varchar(100),
  updated_by    varchar(100)
);


-- ── user_security_questions ────────────────────────────────────────────────
create table if not exists user_security_questions (
  id                   bigserial    primary key,
  user_id              bigint       not null references users(id) on delete cascade,
  security_question_id bigint       not null references security_questions(id),
  answer_hash          varchar(255) not null,
  created_at           timestamptz  not null default now(),
  updated_at           timestamptz  not null default now(),
  created_by           varchar(100),
  updated_by           varchar(100)
);

create index if not exists usq_user_idx on user_security_questions (user_id);


-- ── user_activation_codes ──────────────────────────────────────────────────
create table if not exists user_activation_codes (
  id              bigserial    primary key,
  user_id         bigint       not null references users(id) on delete cascade,
  activation_type varchar(20)  not null check (activation_type in ('EMAIL','PHONE')),
  code_hash       varchar(255) not null,
  expires_at      timestamptz  not null,
  verified_at     timestamptz,
  attempt_count   integer      not null default 0,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  created_by      varchar(100),
  updated_by      varchar(100)
);

create index if not exists uac_user_idx on user_activation_codes (user_id);


-- ── roles ──────────────────────────────────────────────────────────────────
create table if not exists roles (
  id          bigserial    primary key,
  role_name   varchar(50)  not null unique,
  description varchar(255),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  created_by  varchar(100),
  updated_by  varchar(100)
);


-- ── user_roles ─────────────────────────────────────────────────────────────
create table if not exists user_roles (
  user_id    bigint      not null references users(id) on delete cascade,
  role_id    bigint      not null references roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by varchar(100),
  updated_by varchar(100),
  primary key (user_id, role_id)
);


-- ── applications ───────────────────────────────────────────────────────────
create table if not exists applications (
  id                  bigserial     primary key,
  reference_code      varchar(50)   not null unique,        -- e.g. NDCS-2026-0903-4471
  applicant_user_id   bigint        references users(id) on delete set null,
  application_details jsonb         not null default '{}'::jsonb,   -- THE ENTIRE FORM
  application_status  varchar(30)   not null default 'DRAFT'
                      check (application_status in
                             ('DRAFT','SUBMITTED','IN_REVIEW','APPROVED','REJECTED','WITHDRAWN')),
  submitted_at        timestamptz,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),
  created_by          varchar(100),
  updated_by          varchar(100)
);

-- Extra columns (patched in on re-run for existing installs):
--   * form_snapshot — the exact raw wizard payload captured at submit (audit).
--     While DRAFT, application_details holds that raw payload; on submit it is
--     replaced with the normalised canonical document and the raw copy moves here.
--   * the promoted columns below are lifted out of the canonical JSON so the
--     caseworker queue can filter/sort without reading the blob.
alter table applications add column if not exists form_snapshot     jsonb;
alter table applications add column if not exists application_name   varchar(120);
alter table applications add column if not exists applicant_type     varchar(30);
alter table applications add column if not exists service_type     varchar(30);
alter table applications add column if not exists applicant_name   varchar(200);
alter table applications add column if not exists applicant_email  varchar(255);
alter table applications add column if not exists child_count      integer;
-- Set by the CCMS worker (POST /worker/applications/{id}/push) to the
-- csa_portal.aplctn.id it created — makes a re-push idempotent.
alter table applications add column if not exists ccms_aplctn_id   bigint;

drop trigger if exists applications_set_updated_at on applications;
create trigger applications_set_updated_at before update on applications
  for each row execute function set_updated_at();

create index if not exists applications_applicant_idx on applications (applicant_user_id, application_status);
create index if not exists applications_status_idx    on applications (application_status);
create index if not exists applications_type_idx      on applications (applicant_type, service_type);
create index if not exists applications_details_gin   on applications using gin (application_details jsonb_path_ops);


-- ── application_agreements ─────────────────────────────────────────────────
-- One row per consent clause accepted on the application (agreement + rights).
create table if not exists application_agreements (
  id                bigserial    primary key,
  application_id    bigint       not null references applications(id) on delete cascade,
  consent_item_code varchar(100) not null,
  accepted          boolean      not null,
  body_snapshot     text         not null,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now(),
  created_by        varchar(100),
  updated_by        varchar(100),
  unique (application_id, consent_item_code)
);

create index if not exists application_agreements_app_idx on application_agreements (application_id);


-- ===========================================================================
-- Relationships (from the Relationships sheet)
--   users 1--N user_security_questions   (CASCADE)
--   security_questions 1--N user_security_questions
--   users 1--N user_activation_codes     (CASCADE)
--   users 1--N user_roles                (CASCADE)
--   roles 1--N user_roles                (CASCADE)
--   users 1--N applications              (SET NULL)
--   applications 1--N application_agreements (CASCADE)
-- ===========================================================================
