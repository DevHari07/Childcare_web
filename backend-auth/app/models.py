"""Request / response models for the applications API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

STATUSES = {"DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"}


class _In(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")


# ── requests ──────────────────────────────────────────────────────────────
class CreateApplicationRequest(_In):
    application_details: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("application_details", "applicationDetails", "formData", "form_data"),
    )


class SaveApplicationRequest(_In):
    """PUT /applications/{id} — replace the stored form (autosave while editing)."""
    application_details: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("application_details", "applicationDetails", "formData", "form_data"),
    )


class ConsentItem(_In):
    consent_item_code: str = Field(
        validation_alias=AliasChoices("consent_item_code", "consentItemCode", "code")
    )
    accepted: bool = True
    body_snapshot: str = Field(
        "", validation_alias=AliasChoices("body_snapshot", "bodySnapshot", "text")
    )


class SubmitApplicationRequest(_In):
    signature: str = ""
    certified: bool = True
    # The frontend knows the exact wording shown, so it passes the consent items.
    agreements: list[ConsentItem] = Field(default_factory=list)
    # Optional final form snapshot to persist alongside the submit.
    application_details: Optional[dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("application_details", "applicationDetails", "formData", "form_data"),
    )


# ── responses ─────────────────────────────────────────────────────────────
class ApplicationSummary(BaseModel):
    id: int
    reference_code: str
    application_status: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    application_name: Optional[str] = None
    applicant_type: Optional[str] = None
    service_type: Optional[str] = None
    applicant_name: Optional[str] = None
    child_count: Optional[int] = None


class ApplicationOut(ApplicationSummary):
    applicant_user_id: Optional[int] = None
    applicant_email: Optional[str] = None
    application_details: dict[str, Any] = {}


class AgreementOut(BaseModel):
    consent_item_code: str
    accepted: bool
    body_snapshot: str
    created_at: datetime
