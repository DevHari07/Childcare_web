"""End-to-end check of the Cognito auth chain the app relies on.

Runs the same calls the frontend makes:
  admin_create_user  ->  InitiateAuth (USER_PASSWORD_AUTH)  ->  NEW_PASSWORD_REQUIRED
  ->  RespondToAuthChallenge  ->  tokens  ->  InitiateAuth again (no challenge)

Needs, in the environment:
  AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID
  AWS credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or a profile)

The test user is created with MessageAction=SUPPRESS (no email) and deleted at the end.

Usage:
  python test_flow.py                # uses a random +test address
  python test_flow.py you@place.com  # explicit address
"""

import base64
import json
import os
import secrets
import sys

import boto3
from botocore.exceptions import ClientError

REGION = os.environ["AWS_REGION"]
POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
CLIENT_ID = os.environ["COGNITO_APP_CLIENT_ID"]
GROUP = os.getenv("COGNITO_DEFAULT_GROUP", "User")

idp = boto3.client("cognito-idp", region_name=REGION)

email = sys.argv[1] if len(sys.argv) > 1 else f"childcare+test_{secrets.token_hex(4)}@example.com"
temp_password = "Tmp!" + secrets.token_hex(6) + "A1"
new_password = "New!" + secrets.token_hex(6) + "A1"


def ok(msg):
    print(f"  \033[92mPASS\033[0m  {msg}")


def fail(msg):
    print(f"  \033[91mFAIL\033[0m  {msg}")
    sys.exit(1)


def claims(id_token):
    payload = id_token.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(payload))


print(f"\nPool {POOL_ID}  client {CLIENT_ID}  region {REGION}")
print(f"Test user: {email}\n")

# 1. create user (no email)
try:
    idp.admin_create_user(
        UserPoolId=POOL_ID,
        Username=email,
        UserAttributes=[
            {"Name": "email", "Value": email},
            {"Name": "email_verified", "Value": "true"},
            {"Name": "name", "Value": "Flow Test"},
            {"Name": "given_name", "Value": "Flow"},
            {"Name": "family_name", "Value": "Test"},
        ],
        TemporaryPassword=temp_password,
        MessageAction="SUPPRESS",
    )
    ok("admin_create_user")
except ClientError as e:
    fail(f"admin_create_user -> {e.response['Error']['Code']}: {e.response['Error']['Message']}")

try:
    idp.admin_add_user_to_group(UserPoolId=POOL_ID, Username=email, GroupName=GROUP)
    ok(f"admin_add_user_to_group ({GROUP})")
except ClientError as e:
    fail(f"admin_add_user_to_group -> {e.response['Error']['Code']}: {e.response['Error']['Message']} "
         f"(does the group '{GROUP}' exist?)")

try:
    # 2. sign in with temp password -> expect NEW_PASSWORD_REQUIRED
    r = idp.initiate_auth(
        AuthFlow="USER_PASSWORD_AUTH",
        ClientId=CLIENT_ID,
        AuthParameters={"USERNAME": email, "PASSWORD": temp_password},
    )
    if r.get("ChallengeName") != "NEW_PASSWORD_REQUIRED":
        fail(f"expected NEW_PASSWORD_REQUIRED, got {r.get('ChallengeName') or 'tokens'}")
    ok("initiate_auth -> NEW_PASSWORD_REQUIRED")

    # 3. set the permanent password
    r = idp.respond_to_auth_challenge(
        ClientId=CLIENT_ID,
        ChallengeName="NEW_PASSWORD_REQUIRED",
        Session=r["Session"],
        ChallengeResponses={"USERNAME": email, "NEW_PASSWORD": new_password},
    )
    auth = r.get("AuthenticationResult")
    if not auth:
        fail(f"respond_to_auth_challenge -> extra challenge {r.get('ChallengeName')}")
    ok("respond_to_auth_challenge -> tokens issued")

    c = claims(auth["IdToken"])
    print(f"       id-token claims: email={c.get('email')} given_name={c.get('given_name')} "
          f"family_name={c.get('family_name')} groups={c.get('cognito:groups')}")
    if not c.get("given_name") or not c.get("family_name"):
        print("       \033[93mNOTE\033[0m given_name/family_name missing -> grant the app client "
              "read access to those attributes")

    # 4. sign in again with the new password -> straight to tokens, no challenge
    r = idp.initiate_auth(
        AuthFlow="USER_PASSWORD_AUTH",
        ClientId=CLIENT_ID,
        AuthParameters={"USERNAME": email, "PASSWORD": new_password},
    )
    if not r.get("AuthenticationResult"):
        fail(f"second sign-in returned challenge {r.get('ChallengeName')}")
    ok("initiate_auth (new password) -> tokens, no challenge")

    # 5. refresh token flow
    rt = r["AuthenticationResult"]["RefreshToken"]
    r = idp.initiate_auth(
        AuthFlow="REFRESH_TOKEN_AUTH", ClientId=CLIENT_ID, AuthParameters={"REFRESH_TOKEN": rt}
    )
    if not r.get("AuthenticationResult", {}).get("IdToken"):
        fail("refresh token flow returned no IdToken")
    ok("initiate_auth REFRESH_TOKEN_AUTH -> new IdToken")

except ClientError as e:
    code = e.response["Error"]["Code"]
    msg = e.response["Error"]["Message"]
    if code == "InvalidParameterException" and "USER_PASSWORD_AUTH" in msg:
        fail("USER_PASSWORD_AUTH is not enabled on the app client "
             "(Cognito console -> App client -> Authentication flows)")
    fail(f"{code}: {msg}")
finally:
    try:
        idp.admin_delete_user(UserPoolId=POOL_ID, Username=email)
        ok("admin_delete_user (cleanup)")
    except ClientError as e:
        print(f"  cleanup: could not delete {email}: {e}")

print("\n\033[92mAll checks passed.\033[0m The frontend flow will work with these settings.\n")
