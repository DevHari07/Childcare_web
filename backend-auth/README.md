# Auth backend

Small FastAPI service that creates Cognito users for the signup flow
(`admin_create_user` → Cognito emails a temporary password → user sets a
permanent password on first sign-in).

## Run

```bash
cd backend-auth
python -m venv venv
venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirements.txt
copy .env.example .env             # then edit values
# load .env into the shell (or use a launcher that does), then:
uvicorn app.main:app --reload --port 8010
```

Verify: http://localhost:8010/ → `{"status":"online",...}`

## Endpoint

`POST /users` (multipart form)

| field | required | notes |
|---|---|---|
| `email` | yes | becomes the Cognito username |
| `name` | yes | full name |
| `given_name` / `family_name` | no | stored if provided |
| `role` | no | `parent` / `provider`; only written to Cognito if `COGNITO_ROLE_ATTRIBUTE` is set |

Every new user is added to the `User` group. Promote to `Admin` in the Cognito console.

## AWS setup this depends on

- **App client** (`303hgct81mo8ngd404arb2ftef`): enable auth flow **`ALLOW_USER_PASSWORD_AUTH`** (and `ALLOW_REFRESH_TOKEN_AUTH`). No client secret (browser SPA).
- **Groups**: `User` (and `Admin`) must exist in the pool.
- **Message customisation**: the "temporary password" email template controls what the
  user receives. Default includes `{username}` and `{####}` (the temp password).
- boto3 credentials with `cognito-idp:AdminCreateUser` + `cognito-idp:AdminAddUserToGroup`.
