"""CRUD for child support applications. The whole form lives in application_details (JSONB)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from .. import repository
from ..models import (
    AgreementOut,
    ApplicationOut,
    ApplicationSummary,
    CreateApplicationRequest,
    SaveApplicationRequest,
    SubmitApplicationRequest,
)
from ..security import CurrentUser, get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


def _resolve_user_id(user: CurrentUser) -> tuple[int, str]:
    uid = repository.get_or_create_user(user)
    return uid, (user.email or user.sub)


@router.get("", response_model=list[ApplicationSummary])
def list_my_applications(user: CurrentUser = Depends(get_current_user)):
    uid, _ = _resolve_user_id(user)
    return repository.list_applications(uid)


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(body: CreateApplicationRequest, user: CurrentUser = Depends(get_current_user)):
    uid, actor = _resolve_user_id(user)
    return repository.create_application(uid, body.application_details, actor)


@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(app_id: int, user: CurrentUser = Depends(get_current_user)):
    uid, _ = _resolve_user_id(user)
    row = repository.get_application(app_id, uid)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    return row


@router.put("/{app_id}", response_model=ApplicationOut)
def save_application(app_id: int, body: SaveApplicationRequest, user: CurrentUser = Depends(get_current_user)):
    uid, actor = _resolve_user_id(user)
    row = repository.save_application(app_id, uid, body.application_details, actor)
    if not row:
        # Either it does not exist / not owned, or it is no longer editable.
        existing = repository.get_application(app_id, uid)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, "This application can no longer be edited.")
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    return row


@router.post("/{app_id}/submit", response_model=ApplicationOut)
def submit_application(app_id: int, body: SubmitApplicationRequest, user: CurrentUser = Depends(get_current_user)):
    uid, actor = _resolve_user_id(user)
    if not body.certified:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You must certify the application before submitting.")

    agreements = [a.model_dump() for a in body.agreements]
    row = repository.submit_application(app_id, uid, body.application_details, agreements, actor)
    if not row:
        existing = repository.get_application(app_id, uid)
        if existing:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Application is '{existing['application_status']}', not a draft that can be submitted.",
            )
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    return row


@router.delete("/{app_id}", response_model=ApplicationOut)
def withdraw_application(app_id: int, user: CurrentUser = Depends(get_current_user)):
    uid, actor = _resolve_user_id(user)
    row = repository.withdraw_application(app_id, uid, actor)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found or cannot be withdrawn.")
    return row


@router.get("/{app_id}/agreements", response_model=list[AgreementOut])
def list_agreements(app_id: int, user: CurrentUser = Depends(get_current_user)):
    uid, _ = _resolve_user_id(user)
    if not repository.get_application(app_id, uid):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    return repository.get_agreements(app_id, uid)
