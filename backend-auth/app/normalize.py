"""Turn the raw wizard payload ({data, details, ...}) into one clean canonical
document that is stored in applications.application_details on submit.

Why: the wizard keeps two overlapping React state objects (`data` + `details`)
plus navigation state (stepIndex, visitedSubSections). None of that belongs in
the record of what someone applied for. This module produces a single,
de-duplicated, typed shape — and protects SSN / account numbers (see crypto.py).

The output is versioned via `schemaVersion`. Bump it and add a branch here when
the shape changes.
"""
from __future__ import annotations

from typing import Any

from .crypto import deep_protect

CANONICAL_SCHEMA_VERSION = 1

_SERVICE_TYPE = {"full": "full_service", "search_only": "search_only"}
_TRISTATE = {"yes": True, "no": False, "unknown": None, "": None}


# ── scalar helpers ────────────────────────────────────────────────────────
def _s(v: Any) -> str:
    return str(v).strip() if v not in (None, "") else ""


def _yn(v: Any) -> bool | None:
    return _TRISTATE.get(_s(v).lower(), None)


def _num(v: Any) -> float | None:
    try:
        return float(str(v).replace(",", "").strip()) if _s(v) else None
    except ValueError:
        return None


def _int(v: Any) -> int | None:
    n = _num(v)
    return int(n) if n is not None else None


def _name(obj: dict, first="firstName", middle="middleName", last="lastName", suffix="suffix") -> dict:
    return {
        "first": _s(obj.get(first)),
        "middle": _s(obj.get(middle)),
        "last": _s(obj.get(last)),
        "suffix": _s(obj.get(suffix)),
    }


def _addr(block: dict | None) -> dict | None:
    if not isinstance(block, dict):
        return None
    a = {
        "line1": _s(block.get("line1")),
        "line2": _s(block.get("line2")),
        "city": _s(block.get("city")),
        "state": _s(block.get("state")),
        "zip": _s(block.get("zip")),
        "country": _s(block.get("country")) or "United States of America",
    }
    return a if any(a[k] for k in ("line1", "city", "state", "zip")) else None


def _has_any(obj: dict | None, *keys: str) -> bool:
    return isinstance(obj, dict) and any(_s(obj.get(k)) for k in keys)


# ── section builders ─────────────────────────────────────────────────────
def _applicant(details: dict, data: dict) -> dict:
    nm = details.get("custodialName", {}) or {}
    ad = details.get("custodialAddress", {}) or {}
    emp = details.get("custodialEmployment", {}) or {}
    return {
        "name": _name(nm),
        "ssn": _s(nm.get("ssn")),  # deep_protect() converts this later
        "gender": _s(nm.get("gender")),
        "dob": _s(nm.get("birthDate")),
        "birthCity": _s(nm.get("birthCity")),
        "birthState": _s(nm.get("birthState")),
        "maritalStatus": _s(nm.get("maritalStatus")),
        "maidenName": _s(nm.get("maidenName")),
        "spouseName": _s(nm.get("spouseName")),
        "dateMarried": _s(nm.get("dateMarried")),
        "residentialAddress": _addr(ad.get("residential")),
        "mailingAddress": _addr(ad.get("mailing")),
        "phones": {
            "home": _s(ad.get("homePhone")),
            "cell": _s(ad.get("cellPhone")),
            "emergency": _s(ad.get("emergencyPhone")),
        },
        "email": _s(ad.get("email")) or _s(data.get("email")),
        "employment": {
            "employed": _yn(emp.get("currentlyEmployed")),
            "employer": _s(emp.get("employerName")),
            "workPhone": _s(emp.get("workPhone")),
        },
        "household": {
            "size": _int(data.get("householdSize")),
            "monthlyIncome": _num(data.get("monthlyIncome")),
        },
    }


def _child(c: dict) -> dict:
    return {
        "id": _s(c.get("id")),
        "name": _name(c),
        "ssn": _s(c.get("ssn")),
        "gender": _s(c.get("gender")),
        "dob": _s(c.get("birthDate")),
        "birthCity": _s(c.get("birthCity")),
        "birthState": _s(c.get("birthState")),
        "relationship": _s(c.get("relationship")).lower(),
        "homeState": _s(c.get("state")),
        "paternityEstablished": _yn(c.get("paternityEstablished")),
        "paternityDate": _s(c.get("paternityDate")),
    }


def _income(inc: dict) -> dict:
    out = {}
    for key, node in (inc or {}).items():
        if isinstance(node, dict) and (_s(node.get("has")) or _s(node.get("amount"))):
            out[key] = {"has": _yn(node.get("has")), "amount": _num(node.get("amount"))}
    return out


def _noncustodial(details: dict) -> dict | None:
    nm = details.get("noncustodialName", {}) or {}
    ad = details.get("noncustodialAddress", {}) or {}
    emp = details.get("noncustodialEmployment", {}) or {}
    desc = details.get("noncustodialDescription", {}) or {}
    crim = details.get("noncustodialCriminalHistory", {}) or {}
    lic = details.get("noncustodialLicense", {}) or {}
    prop = details.get("noncustodialProperty", {}) or {}
    fin = details.get("noncustodialFinancialAccounts", {}) or {}
    mother = details.get("noncustodialMother", {}) or {}
    father = details.get("noncustodialFather", {}) or {}
    mil = details.get("noncustodialMilitary", {}) or {}
    vehicles = details.get("noncustodialVehicles", []) or []
    contacts = details.get("noncustodialContacts", []) or []

    provided = any(
        [
            _has_any(nm, "firstName", "lastName", "ssn", "birthDate"),
            _addr(ad.get("residential")),
            _has_any(emp, "employerName"),
            _has_any(crim, "hasCriminalRecord", "incarcerated"),
            _has_any(lic, "driversLicenseNumber"),
            _addr({**prop, "line1": prop.get("addressLine1", "")}),
            bool(fin.get("accounts")),
            bool(vehicles),
            _has_any(mother, "firstName", "lastName"),
            _has_any(father, "firstName", "lastName"),
        ]
    )
    if not provided:
        return None

    return {
        "name": _name(nm),
        "ssn": _s(nm.get("ssn")),
        "gender": _s(nm.get("gender")),
        "dob": _s(nm.get("birthDate")),
        "birthCity": _s(nm.get("birthCity")),
        "birthState": _s(nm.get("birthState")),
        "maritalStatus": _s(nm.get("maritalStatus")),
        "maidenName": _s(nm.get("maidenName")),
        "spouseName": _s(nm.get("spouseName")),
        "dateMarried": _s(nm.get("dateMarried")),
        "physicalDescription": {
            "hair": _s(desc.get("hair")), "eyes": _s(desc.get("eyes")),
            "heightFt": _s(desc.get("heightFt")), "heightIn": _s(desc.get("heightIn")),
            "weight": _s(desc.get("weight")), "race": _s(desc.get("race")),
            "nickname": _s(desc.get("nickname")), "otherFeatures": _s(desc.get("otherFeatures")),
        },
        "residentialAddress": _addr(ad.get("residential")),
        "mailingAddress": _addr(ad.get("mailing")),
        "phones": {"home": _s(ad.get("homePhone")), "cell": _s(ad.get("cellPhone"))},
        "email": _s(ad.get("email")),
        "employment": {
            "employed": _yn(emp.get("currentlyEmployed")),
            "employer": _s(emp.get("employerName")),
            "workPhone": _s(emp.get("workPhone")),
        },
        "income": _income(details.get("noncustodialIncome", {})),
        "mother": _name(mother) | {"maidenName": _s(mother.get("maidenName")),
                                   "deceased": _yn(mother.get("deceased")),
                                   "birthCity": _s(mother.get("birthCity")),
                                   "birthState": _s(mother.get("birthState"))},
        "father": _name(father) | {"maidenName": _s(father.get("maidenName")),
                                   "deceased": _yn(father.get("deceased")),
                                   "birthCity": _s(father.get("birthCity")),
                                   "birthState": _s(father.get("birthState"))},
        "military": {
            "status": _s(mil.get("status")), "branch": _s(mil.get("branch")),
            "serviceNumber": _s(mil.get("serviceNumber")),
            "servedFrom": _s(mil.get("servedFrom")), "servedTo": _s(mil.get("servedTo")),
        },
        "criminalHistory": {
            "hasCriminalRecord": _yn(crim.get("hasCriminalRecord")),
            "incarcerated": _yn(crim.get("incarcerated")),
            "institutionName": _s(crim.get("institutionName")),
            "institutionCity": _s(crim.get("institutionCity")),
            "institutionState": _s(crim.get("institutionState")),
            "onParole": _yn(crim.get("onParole")),
            "paroleOfficer": _s(crim.get("paroleOfficer")),
            "paroleOfficerPhone": _s(crim.get("paroleOfficerPhone")),
        },
        "financialAccounts": {
            "inBankruptcy": _yn(fin.get("inBankruptcy")),
            "accounts": [
                {
                    "institutionName": _s(a.get("institutionName")),
                    "accountType": _s(a.get("accountType")),
                    "accountNumber": _s(a.get("accountNumber")),  # protected later
                    "accountValue": _num(a.get("accountValue")),
                }
                for a in (fin.get("accounts") or [])
            ],
        },
        "license": {
            "driversLicenseNumber": _s(lic.get("driversLicenseNumber")),
            "driversLicenseState": _s(lic.get("driversLicenseState")),
            "professionalLicenseHeld": _yn(lic.get("professionalLicenseHeld")),
            "licenseType": _s(lic.get("licenseType")),
            "licenseNumber": _s(lic.get("licenseNumber")),
            "issuingState": _s(lic.get("issuingState")),
        },
        "vehicles": [
            {
                "type": _s(v.get("type")), "year": _s(v.get("year")),
                "make": _s(v.get("make")), "model": _s(v.get("model")),
                "licenseNumber": _s(v.get("licenseNumber")), "state": _s(v.get("state")),
            }
            for v in vehicles
        ],
        "property": {
            "description": _s(prop.get("description")),
            "estimatedValue": _num(prop.get("estimatedValue")),
            "address": _addr({
                "line1": prop.get("addressLine1", ""), "line2": prop.get("addressLine2", ""),
                "city": prop.get("city", ""), "state": prop.get("state", ""),
                "zip": prop.get("zip", ""), "country": "United States of America",
            }),
            "lienHolder": _s(prop.get("lienHolder")),
        },
        "contacts": [
            {
                "relationship": _s(c.get("relationship")),
                "name": _name(c),
                "address": _addr({
                    "line1": c.get("addressLine1", ""), "line2": c.get("addressLine2", ""),
                    "city": c.get("city", ""), "state": c.get("state", ""),
                    "zip": c.get("zip", ""), "country": "United States of America",
                }),
                "phone": _s(c.get("phone")),
            }
            for c in contacts
        ],
    }


def _support_orders(orders: list) -> list:
    out = []
    for o in orders or []:
        out.append(
            {
                "id": _s(o.get("id")),
                "orderType": _s(o.get("orderType")),
                "orderNumber": _s(o.get("orderNumber")),
                "stateFiled": _s(o.get("stateFiled")),
                "dateFiled": _s(o.get("dateFiled")),
                "amount": _num(o.get("amount")),
                "frequency": _s(o.get("frequency")),
                "startDate": _s(o.get("startDate")),
                "endDate": _s(o.get("endDate")),
                "childrenCovered": [_s(x) for x in (o.get("childrenCovered") or [])],
            }
        )
    return out


# Canonical applicant-type values. Legacy drafts may still carry the old codes.
_APPLICANT_TYPE = {
    "custodian": "custodian",
    "non-custodian": "non-custodian",
    "parent_guardian": "custodian",       # legacy
    "relative_caregiver": "non-custodian",  # legacy
}


def _applicant_type(value: Any) -> str:
    return _APPLICANT_TYPE.get(_s(value), _s(value))


# ── entry point ──────────────────────────────────────────────────────────
def to_canonical(raw: dict[str, Any]) -> dict[str, Any]:
    data = raw.get("data", {}) or {}
    details = raw.get("details", {}) or {}
    applicant_type = _applicant_type(data.get("applicantType"))
    is_ncp = applicant_type == "non-custodian"

    doc = {
        "schemaVersion": CANONICAL_SCHEMA_VERSION,
        "applicationName": _s(data.get("applicationName")),
        "applicantType": applicant_type,
        "services": {
            "type": _SERVICE_TYPE.get(_s(data.get("assistanceType")), ""),
            "searchProviderName": _s(data.get("providerName")),
            "ncpServiceType": _s(data.get("ncpServiceType")) if is_ncp else "",
            "receivesPublicAssistance": _yn(data.get("receivesPublicAssistance")),
            "withholdOtherPartyInfo": _s(data.get("withholdConsent")) == "yes",
        },
        "applicant": _applicant(details, data),
        "children": [_child(c) for c in (data.get("children") or [])],
        "noncustodialParent": _noncustodial(details),
        "supportOrders": _support_orders(data.get("supportOrders")),
        "otherChildren": [
            {"id": _s(c.get("id")), "name": _name(c), "dob": _s(c.get("birthDate"))}
            for c in (data.get("otherChildren") or [])
        ],
        "otherInformation": _s(data.get("otherInformationText")),
        "certification": {
            "certified": bool(data.get("certify")),
            "signature": _s(data.get("fullName")),
        },
    }
    return deep_protect(doc)


def summary_columns(canonical: dict) -> dict:
    """Values lifted into real columns on `applications` for the caseworker queue."""
    ap = canonical.get("applicant", {}).get("name", {})
    return {
        "application_name": canonical.get("applicationName") or None,
        "applicant_type": canonical.get("applicantType") or None,
        "service_type": (canonical.get("services") or {}).get("type") or None,
        "applicant_name": " ".join(x for x in (ap.get("first"), ap.get("last")) if x) or None,
        "applicant_email": (canonical.get("applicant") or {}).get("email") or None,
        "child_count": len(canonical.get("children") or []),
    }
