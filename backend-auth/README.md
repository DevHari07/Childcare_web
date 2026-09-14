# Childcare Backend (auth + applications)

FastAPI service with two concerns:

| Area | Endpoints | Storage |
|---|---|---|
| **Local auth** | `POST /auth/register`, `POST /auth/login` | PostgreSQL `users` (bcrypt `password_hash`, role via `user_roles`, security Q&A in `user_security_questions`) — issues an HS256 JWT signed with `LOCAL_JWT_SECRET` |
| **Cognito auth** | `POST /users` | AWS Cognito (admin-create → temp password emailed) |
| **Applications** | `GET/POST /applications`, `GET/PUT/DELETE /applications/{id}`, `POST /applications/{id}/submit`, `GET /applications/{id}/agreements` | PostgreSQL — the whole form is stored as JSON in `applications.application_details` |
| **CCMS worker** | `POST /worker/applications/{id}/payload`, `POST /worker/applications/{id}/push` | Builds the client's normalised `csa_portal` records from a submitted application and writes them to `CCMS_DATABASE_URL` (the local clone `ccms_local`). See `docs/ccms-worker-payload.md`. |

The frontend picks local vs Cognito with `NEXT_PUBLIC_AUTH_PROVIDER` (`local` default).

## CCMS worker

Turns one submitted application into the client's `csa_portal` graph
(`aplctn` → `person` + `prsn_role_link` + cp/ncp/child detail + addresses +
contacts + employers + income + NCP military/jail). Modules: `app/ccms_db.py`
(2nd pool), `app/ccms_codes.py` (value maps), `app/ccms_mapper.py`
(canonical → payload), `app/ccms_writer.py` (transactional insert), `app/routers/worker.py`.

```
POST /worker/applications/{id}/payload                   # the constructed payload only
POST /worker/applications/{id}/push?dryRun=true          # ordered insert plan, writes nothing
POST /worker/applications/{id}/push?dryRun=false&rollback=true   # inserts then ROLLS BACK (QA)
POST /worker/applications/{id}/push?dryRun=false         # commits to CCMS_DATABASE_URL
```

`CCMS_DATABASE_URL` **must stay on the local clone** until the client confirms
live tables vs `_wp` staging. Clone it with:

```powershell
$env:PGPASSWORD='<rds pw>'; $bin="C:\Program Files\PostgreSQL\17\bin"
& "$bin\pg_dump.exe" "host=<rds> port=5432 dbname=ccms_dbs user=<u> sslmode=require" --schema=csa_portal --schema=csa_common --no-owner --no-privileges -Fc -f db/ccms_clone.dump
& "$bin\psql.exe" "postgresql://postgres:TEST@localhost:5432/postgres" -c "CREATE DATABASE ccms_local;"
& "$bin\psql.exe" "postgresql://postgres:TEST@localhost:5432/ccms_local" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;"
& "$bin\pg_restore.exe" -d "postgresql://postgres:TEST@localhost:5432/ccms_local" --no-owner --no-privileges --no-comments db/ccms_clone.dump
```

Option A scope (done): the core intake graph above. Not yet written — support
orders, financial accounts, property, marital status, `cs_case` + `work_item`,
and **SSN** (the client's `person` table has no `ssn` column — target TBD).
`*.dump` files hold real client PII — gitignored, never commit.

Data model: `db/schema.sql` (from `Child_Support_Application_Data_Models_V1`).

## Setup

```powershell
cd backend-auth
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env      # then edit
```

`.env` essentials:

```
DATABASE_URL=postgresql://postgres:TEST@localhost:5432/childcare
POSTGRES_ADMIN_URL=postgresql://postgres:TEST@localhost:5432/postgres
APP_AUTH_MODE=local        # local = accounts in the users table via /auth/*
LOCAL_JWT_SECRET=change-me # HS256 secret for the tokens /auth/* mints
```

## Initialise the database

```powershell
.\venv\Scripts\python.exe init_db.py          # create db + schema + seed
.\venv\Scripts\python.exe init_db.py --reset  # drop & recreate all tables
```

## Run

```powershell
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

Docs at http://localhost:8000/docs · health at `/`.

## Test

```powershell
.\venv\Scripts\python.exe test_applications.py   # applications lifecycle (needs the server running)
.\venv\Scripts\python.exe test_flow.py           # Cognito NEW_PASSWORD_REQUIRED flow
```

## Auth modes

| `APP_AUTH_MODE` | `/applications` behaviour |
|---|---|
| `local` | Requires a token minted by `POST /auth/register` or `POST /auth/login` (HS256, `LOCAL_JWT_SECRET`). Accounts live in the `users` table. |
| `cognito` | Requires a valid Cognito **ID token** (`Authorization: Bearer …`), verified against the pool JWKS. Needs `COGNITO_USER_POOL_ID` + `COGNITO_APP_CLIENT_ID`. |
| `dev` | Reads the bearer token's claims **without verifying the signature**; if no token is sent, uses `DEV_USER_*`. Local only. |

The frontend sends `Authorization: Bearer <token>` from `getAuthToken()` (`src/lib/authToken.ts`), which returns the local JWT or the Cognito ID token depending on `NEXT_PUBLIC_AUTH_PROVIDER`.

### Local auth endpoints

```
POST /auth/register  {firstName,lastName,email,password,role,phone?,securityQuestions:[{question,answer}]}
                     -> 201 {token, user:{id,first_name,last_name,email,role}}   (account ACTIVE immediately)
POST /auth/login     {email,password}
                     -> 200 {token, user}     (email match is case-insensitive)
```

## Application lifecycle

```
POST /applications              -> DRAFT row, reference_code = NDCS-YYYY-MMDD-####
PUT  /applications/{id}         -> replace application_details (autosave; DRAFT only)
POST /applications/{id}/submit  -> normalise -> canonical, snapshot, promote cols, SUBMITTED
DELETE /applications/{id}       -> status WITHDRAWN (never hard-deleted)
```

## How the form is stored

| stage | `application_details` | `form_snapshot` |
|---|---|---|
| **DRAFT** | raw wizard payload `{data, details, stepIndex, visitedSubSections, …}` — perfect round-trip for resuming | — |
| **SUBMITTED** | **canonical** document (`app/normalize.py`): one de-duplicated `applicant` / `children` / `noncustodialParent` / `supportOrders`, typed values (`monthlyIncome: 85000.0`, booleans), no wizard state | the raw payload as submitted (audit), SSN/acct masked |

On submit these columns are also lifted out of the canonical JSON for the caseworker queue:
`applicant_type · service_type · applicant_name · applicant_email · child_count`
(indexed by `(applicant_type, service_type)`). `applicant_type` is `custodian` or
`non-custodian` (legacy `parent_guardian` / `relative_caregiver` payloads are mapped
on normalise).

**PII:** in the canonical doc an SSN becomes `{"last4":"6789"}`; if `APP_ENCRYPTION_KEY`
is set it also carries `{"cipher":"…"}` (Fernet) so an authorised process can recover it.
The full value is never returned by the API. Same for financial `accountNumber`.
`consent` acceptances are additionally expanded into `application_agreements` rows with the exact wording shown.
