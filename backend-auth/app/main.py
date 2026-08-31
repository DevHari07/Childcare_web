import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load backend-auth/.env (next to this package) if present.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

REGION = os.getenv("AWS_REGION", "us-east-1")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")

# Every self-service signup lands in this group. Elevate to "Admin" manually in the console.
DEFAULT_GROUP = os.getenv("COGNITO_DEFAULT_GROUP", "User")

# If your pool has a custom attribute for the app-level role (parent/provider), set this to
# its full name, e.g. "custom:role". Leave unset to skip writing it.
ROLE_ATTRIBUTE = os.getenv("COGNITO_ROLE_ATTRIBUTE", "").strip()

# Comma-separated list of extra allowed browser origins. Any localhost / 127.0.0.1 port is
# allowed by default (dev convenience) via the regex below.
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app = FastAPI(title="Childcare Auth Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = boto3.client("cognito-idp", region_name=REGION)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Childcare Auth (Cognito admin)",
        "region": REGION,
        "pool": USER_POOL_ID,
        "pool_configured": bool(USER_POOL_ID),
    }


@app.post("/users")
def create_user(
    email: str = Form(...),
    name: str = Form(...),
    given_name: str = Form(""),
    family_name: str = Form(""),
    role: str = Form("parent"),
):
    """Creates a Cognito user. Cognito emails a temporary password; the user is forced to
    set a permanent one on first sign-in (NEW_PASSWORD_REQUIRED)."""
    if not USER_POOL_ID:
        raise HTTPException(
            status_code=500,
            detail="COGNITO_USER_POOL_ID is not set for the backend process.",
        )

    email = email.strip().lower()

    attributes = [
        {"Name": "email", "Value": email},
        {"Name": "email_verified", "Value": "true"},
        {"Name": "name", "Value": name},
    ]
    if given_name:
        attributes.append({"Name": "given_name", "Value": given_name})
    if family_name:
        attributes.append({"Name": "family_name", "Value": family_name})
    if ROLE_ATTRIBUTE:
        attributes.append({"Name": ROLE_ATTRIBUTE, "Value": role})

    try:
        client.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            UserAttributes=attributes,
            DesiredDeliveryMediums=["EMAIL"],
        )

        try:
            client.admin_add_user_to_group(
                UserPoolId=USER_POOL_ID, Username=email, GroupName=DEFAULT_GROUP
            )
        except ClientError as group_err:
            # User is created; a missing group shouldn't fail the whole signup.
            print(f"admin_add_user_to_group failed: {group_err}")

        return {"success": True, "message": f"Created {email}. A temporary password was emailed."}

    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        message = e.response.get("Error", {}).get("Message", str(e))
        print(f"Cognito ClientError [{code}]: {message}")
        if code == "UsernameExistsException":
            raise HTTPException(status_code=409, detail="An account with that email address already exists.")
        raise HTTPException(status_code=400, detail=f"{code}: {message}" if code else message)

    except BotoCoreError as e:
        # No credentials, bad region, network/endpoint failure, param validation, etc.
        print(f"Cognito BotoCoreError: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Could not talk to Cognito: {e}. Check AWS credentials / region for the backend.",
        )
