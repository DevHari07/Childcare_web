# Childcare Backend (auth + applications)

FastAPI service with two concerns:

| Area | Endpoints | Storage |
|---|---|---|
| **Auth** | `POST /users` | AWS Cognito (admin-create → temp password emailed) |
| **Applications** | `GET/POST /applications`, `GET/PUT/DELETE /applications/{id}`, `POST /applications/{id}/submit`, `GET /applications/{id}/agreements` | PostgreSQL — the whole form is stored as JSON in `applications.application_details` |

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
APP_AUTH_MODE=dev           # dev = don't verify the Cognito token signature
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
| `dev` | Reads the bearer token's claims **without verifying the signature**; if no token is sent, uses `DEV_USER_*`. Local only. |
| `cognito` | Requires a valid Cognito **ID token** (`Authorization: Bearer …`), verified against the pool JWKS. Needs `COGNITO_USER_POOL_ID` + `COGNITO_APP_CLIENT_ID`. |

The frontend sends `Authorization: Bearer <idToken>` (from `getIdToken()` in `src/lib/cognitoAuth.ts`) either way — `dev` mode still records the real user, it just skips signature verification.

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
(indexed by `(applicant_type, service_type)`).

**PII:** in the canonical doc an SSN becomes `{"last4":"6789"}`; if `APP_ENCRYPTION_KEY`
is set it also carries `{"cipher":"…"}` (Fernet) so an authorised process can recover it.
The full value is never returned by the API. Same for financial `accountNumber`.
`consent` acceptances are additionally expanded into `application_agreements` rows with the exact wording shown.
