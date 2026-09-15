"""Cognito admin operations — create a user; Cognito emails the temp password."""
from __future__ import annotations

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Form, HTTPException

from .. import config

router = APIRouter(tags=["auth"])

_client = boto3.client("cognito-idp", region_name=config.AWS_REGION)


@router.post("/users")
def create_user(
    email: str = Form(...),
    name: str = Form(...),
    given_name: str = Form(""),
    family_name: str = Form(""),
    role: str = Form("parent"),
):
    """Creates a Cognito user. Cognito emails a temporary password; the user is forced to
    set a permanent one on first sign-in (NEW_PASSWORD_REQUIRED)."""
    if not config.COGNITO_USER_POOL_ID:
        raise HTTPException(500, "COGNITO_USER_POOL_ID is not set for the backend process.")

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
    if config.COGNITO_ROLE_ATTRIBUTE:
        attributes.append({"Name": config.COGNITO_ROLE_ATTRIBUTE, "Value": role})

    try:
        _client.admin_create_user(
            UserPoolId=config.COGNITO_USER_POOL_ID,
            Username=email,
            UserAttributes=attributes,
            DesiredDeliveryMediums=["EMAIL"],
        )
        try:
            _client.admin_add_user_to_group(
                UserPoolId=config.COGNITO_USER_POOL_ID,
                Username=email,
                GroupName=config.COGNITO_DEFAULT_GROUP,
            )
        except ClientError as group_err:
            print(f"admin_add_user_to_group failed: {group_err}")
        return {"success": True, "message": f"Created {email}. A temporary password was emailed."}

    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        message = e.response.get("Error", {}).get("Message", str(e))
        print(f"Cognito ClientError [{code}]: {message}")
        if code == "UsernameExistsException":
            raise HTTPException(409, "An account with that email address already exists.")
        raise HTTPException(400, f"{code}: {message}" if code else message)

    except BotoCoreError as e:
        print(f"Cognito BotoCoreError: {e}")
        raise HTTPException(
            502,
            f"Could not talk to Cognito: {e}. Check AWS credentials / region for the backend.",
        )
