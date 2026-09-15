"""Build the CCMS worker payload from one application's canonical document.

Input  : canonical doc (normalize.to_canonical output) + meta
Output : dict grouped by target entity, using csa_portal column names, with
         `ref` handles the writer uses to wire foreign keys.

Scope (option A): aplctn, person + prsn_role_link + cp/ncp/child detail,
addresses (+prsn_addr_link via addr_addr_typ_lnk), contacts (+prsn_contact_link),
employers (+prsn_emplr_link) + income, NCP military / jail service.
Everything else (support orders, financial accounts, property, vehicles beyond
the first, marital status target, case + work_item) is carried in the payload
under `unmapped` for review but NOT written yet.
"""
from __future__ import annotations

from typing import Any

from . import ccms_codes as C
from .crypto import reveal


def _ssn(value: Any) -> str | None:
    """Canonical SSN is a protected envelope after deep_protect(); recover what we can."""
    if isinstance(value, dict):
        full = reveal(value)
        if full:
            return full[:9]
        last4 = value.get("last4")
        return str(last4) if last4 else None
    s = str(value or "").replace("-", "").strip()
    return s[:9] or None


def _person(name: dict, *, gender=None, dob=None, birth_city=None,
            birth_state=None, maiden_last=None, extra: dict | None = None) -> dict:
    # NOTE: csa_portal.person has no primary `ssn` column in the client's DB
    # (only `aka_ssn`). SSN is carried at the node level pending the client's
    # answer on where it belongs (prsn_vrfctn_stts / csa_fti / member service).
    p = {
        "first_name": (name.get("first") or "").upper() or None,
        "middle_name": (name.get("middle") or "").upper() or None,
        "last_name": (name.get("last") or "").upper() or None,
        "suffix_cd": (name.get("suffix") or "").strip() or None,  # TODO SUFFIX code list
        "dob": dob or None,
        "gender_cd": C.gender(gender),
        "birth_place_city": birth_city or None,
        "birth_place_state_cd": C.state(birth_state),
        "mdn_last_name": (maiden_last or "").upper() or None,
    }
    if extra:
        p.update({k: v for k, v in extra.items() if v not in (None, "")})
    return p


def _address(a: dict | None, addr_type_cd: str) -> dict | None:
    if not a:
        return None
    return {
        "addr_type_cd": addr_type_cd,
        "addr_line_1": a.get("line1") or None,
        "addr_line_2": a.get("line2") or None,
        "city": a.get("city") or None,
        "county_cd": None,
        "state_cd": C.state(a.get("state")),
        "zip_cd": a.get("zip") or None,
        "country_cd": C.country(a.get("country")),
    }


def _contacts(phones: dict | None, email: str | None) -> list[dict]:
    out: list[dict] = []
    phones = phones or {}
    for key, cd in (("home", C.CONTACT_KEY_HOME), ("cell", C.CONTACT_KEY_CELL), ("work", C.CONTACT_KEY_WORK)):
        v = (phones.get(key) or "").strip()
        if v:
            out.append({"contact_type_key": cd, "contact_type_value": v})
    if email:
        out.append({"contact_type_key": C.CONTACT_KEY_EMAIL, "contact_type_value": email.strip()})
    return out


def _employers(emp: dict | None) -> list[dict]:
    emp = emp or {}
    name = (emp.get("employer") or "").strip()
    if not name and C.yn(emp.get("employed")) != "Y":
        return []
    return [{
        "is_employed": C.yn(emp.get("employed")) or ("Y" if name else "N"),
        "employer_name": name.upper() or None,
        "occupation": None,
        "phone_num": C.phone(emp.get("workPhone")),
        "self_empmnt_ind": "N",
        "emplyr_typ": None,
        "empmnt_start_dt": None,
        "empmnt_end_dt": None,
        "address": None,
    }]


def _income(monthly_income, household_size, source_name: str | None) -> list[dict]:
    if monthly_income in (None, "", 0):
        return []
    return [{
        "income_type": "WAGE",
        "income_source": (source_name or "").upper() or None,
        "income_frequency": "MON",
        "income_amount": monthly_income,
        "household_size": household_size,
    }]


# ── section builders ──────────────────────────────────────────────────────
def _aplctn(canonical: dict, meta: dict) -> dict:
    svc = canonical.get("services") or {}
    children = canonical.get("children") or []
    any_child_insurance = any(C.yn(c.get("hasInsurance")) == "Y" for c in children)
    return {
        "aplctn_name": canonical.get("applicationName") or None,
        "aplctn_status_cd": "Submitted",
        "aplctn_status_dt": meta.get("submittedDate"),
        "aplctn_start_dt": meta.get("startDate"),
        "aplctn_recvd_dt": meta.get("submittedDate"),
        "submit_date": meta.get("submittedDate"),
        "stamped_dt": meta.get("submittedDate"),
        "paper_aplctn_type": "electronic",
        "case_type": C.service_case_type(svc.get("type")),          # TODO confirm
        "jurisd_cd": None,
        "signed_name": (canonical.get("certification") or {}).get("signature") or None,
        "signed_dt": meta.get("submittedDate"),
        "agree_future_payment": "Y" if svc.get("withholdOtherPartyInfo") else "N",  # TODO confirm mapping
        "pymnt_agreement": None,
        "has_hlth_ins": "Y" if any_child_insurance else "N",
        "is_pymnt_reqd": "N",
        "review_dt": None,
    }


def _applicant_person(canonical: dict) -> dict:
    ap = canonical.get("applicant") or {}
    svc = canonical.get("services") or {}
    role_cd = C.applicant_role(canonical.get("applicantType"))
    emp = ap.get("employment") or {}
    hh = ap.get("household") or {}
    person = {
        "ref": "applicant",
        "ssn": _ssn(ap.get("ssn")),
        "role": {"role_cd": role_cd, "mbr_type": "CP" if role_cd == "CU_CP" else "AP",
                 "relationship_to_child": None},
        "person": _person(ap.get("name") or {}, gender=ap.get("gender"),
                          dob=ap.get("dob"), birth_city=ap.get("birthCity"),
                          birth_state=ap.get("birthState"), maiden_last=ap.get("maidenName")),
        "addresses": [a for a in (_address(ap.get("residentialAddress"), C.ADDRESS_TYPE_RES),
                                  _address(ap.get("mailingAddress"), C.ADDRESS_TYPE_MAI)) if a],
        "contacts": _contacts(ap.get("phones"), ap.get("email")),
        "employers": _employers(emp),
        "income": _income(hh.get("monthlyIncome"), hh.get("size"), emp.get("employer")),
    }
    if role_cd == "CU_CP":
        person["cp_detail"] = {
            "is_custodial_party": "Y",
            "reln_to_child_cd": None,
            "service_type_cd": (svc.get("type") or "").replace("_service", "") or None,  # TODO confirm codes
            "is_tca_applicant": "N",
            "is_cash_asstnce": "N",
            "is_med_asstnce": "N",
            "is_child_care_asstnce": C.yn(svc.get("receivesPublicAssistance")) or "N",
            "is_support_order": "Y" if canonical.get("supportOrders") else "N",
            "is_family_violence": "N",
            "is_employed": C.yn(emp.get("employed")) or "N",
            "text_ntfn": "N",
            "email_ntfn": "Y" if ap.get("email") else "N",
            "ntfn_typ": "EMAIL" if ap.get("email") else None,
        }
    else:
        person["ncp_detail"] = _ncp_detail_block(emp)
    return person


def _child_persons(canonical: dict) -> list[dict]:
    out = []
    for i, c in enumerate(canonical.get("children") or [], start=1):
        out.append({
            "ref": f"child-{i}",
            "ssn": _ssn(c.get("ssn")),
            "role": {"role_cd": "CHILD", "mbr_type": None,
                     "relationship_to_child": C.child_relationship(c.get("relationship"))},
            "person": _person(c.get("name") or {}, gender=c.get("gender"),
                              dob=c.get("dob"), birth_city=c.get("birthCity"),
                              birth_state=c.get("birthState")),
            "child_detail": {
                "has_paternity": C.yn(c.get("paternityEstablished")),
                "paternity_type": None,
                "paternity_state_cd": C.state(c.get("birthState")),
                "paternity_county_cd": None,
                "ptrnty_est_dt": c.get("paternityDate") or None,
                "court_order_number": None,
                "has_insurance": None,
                "conception_state_cd": None,
            },
        })
    return out


def _ncp_detail_block(emp: dict | None) -> dict:
    emp = emp or {}
    return {
        "last_know_addr_dt": None,
        "tribal_cd": None,
        "is_employed": C.yn(emp.get("employed")) or "N",
        "text_ntfn": "N",
        "email_ntfn": "N",
        "ntfn_typ": None,
    }


def _noncustodial_person(canonical: dict) -> dict | None:
    ncp = canonical.get("noncustodialParent")
    if not ncp:
        return None
    desc = ncp.get("physicalDescription") or {}
    emp = ncp.get("employment") or {}
    mil = ncp.get("military") or {}
    crim = ncp.get("criminalHistory") or {}
    lic = ncp.get("license") or {}
    vehicles = ncp.get("vehicles") or []

    extra = {
        "race_cd": C.race(desc.get("race")),
        "eye_color_cd": C.eye_color(desc.get("eyes")),
        "hair_color_cd": C.hair_color(desc.get("hair")),
        "height_feet": _int(desc.get("heightFt")),
        "height_inch": _int(desc.get("heightIn")),
        "weight": _int(desc.get("weight")),
        "nick_name": (desc.get("nickname") or "").strip() or None,
        "identity_mark": (desc.get("otherFeatures") or "").strip() or None,
    }

    first_vehicle = vehicles[0] if vehicles else {}
    node = {
        "ref": "ncp",
        "ssn": _ssn(ncp.get("ssn")),
        "role": {"role_cd": "NCP", "mbr_type": "AP", "relationship_to_child": None},
        "person": _person(ncp.get("name") or {}, gender=ncp.get("gender"),
                          dob=ncp.get("dob"), birth_city=ncp.get("birthCity"),
                          birth_state=ncp.get("birthState"), maiden_last=ncp.get("maidenName"),
                          extra=extra),
        "ncp_detail": _ncp_detail_block(emp),
        "addresses": [a for a in (_address(ncp.get("residentialAddress"), C.ADDRESS_TYPE_RES),
                                  _address(ncp.get("mailingAddress"), C.ADDRESS_TYPE_MAI)) if a],
        "contacts": _contacts(ncp.get("phones"), ncp.get("email")),
        "employers": _employers(emp),
        "income": [],
        "nc_identity": {
            "has_state_id": "Y" if lic.get("driversLicenseNumber") else "N",
            "state_id_num": (lic.get("driversLicenseNumber") or "").strip() or None,
            "state_id_state_cd": C.state(lic.get("driversLicenseState")),
            "has_auto": 1 if vehicles else 0,
            "auto_tag_id": (first_vehicle.get("licenseNumber") or "").strip() or None,
            "auto_tag_state_cd": C.state(first_vehicle.get("state")),
            "auto_make_model": " ".join(x for x in (first_vehicle.get("make"), first_vehicle.get("model")) if x) or None,
            "auto_year": (first_vehicle.get("year") or "").strip() or None,
            "has_other_child_support_case": None,
            "other_child_support_state_cd": None,
        },
        "nc_military_srvc": {
            "has_military_service": "Y" if (mil.get("branch") or mil.get("servedFrom")) else "N",
            "is_currently_in_service": "Y" if (mil.get("status") or "").lower() in ("active", "active duty") else "N",
            "military_branch_cd": C.military_branch(mil.get("branch")),  # TODO confirm MILITARY_BRANCH_CD list
            "from_date": mil.get("servedFrom") or None,
            "to_date": mil.get("servedTo") or None,
        },
        "nc_jail_srvc": {
            "has_jail_service": C.yn(crim.get("incarcerated")) or C.yn(crim.get("hasCriminalRecord")) or "N",
            "is_incarcerated": C.yn(crim.get("incarcerated")) or "N",
            "from_date": None,
            "to_date": None,
            "jail_name": (crim.get("institutionName") or "").strip() or None,
            "prsnr_admsn_dt": None,
            "prsnr_rls_dt": None,
            "address": _address({
                "line1": "", "city": crim.get("institutionCity"),
                "state": crim.get("institutionState"), "zip": "", "country": "",
            }, "OTH") if crim.get("institutionCity") else None,
        },
    }
    return node


def _int(v: Any) -> int | None:
    try:
        return int(str(v).strip()) if str(v or "").strip() else None
    except ValueError:
        return None


def build_payload(canonical: dict, meta: dict) -> dict:
    persons = [_applicant_person(canonical)]
    persons.extend(_child_persons(canonical))
    ncp = _noncustodial_person(canonical)
    if ncp:
        persons.append(ncp)

    return {
        "meta": {
            "sourceApplicationId": meta.get("sourceApplicationId"),
            "sourceReferenceCode": meta.get("sourceReferenceCode"),
            "schemaVersion": canonical.get("schemaVersion", 1),
            "submittedAt": meta.get("submittedAt"),
            "createdBy": meta.get("createdBy"),
            "dryRun": meta.get("dryRun", True),
        },
        "aplctn": _aplctn(canonical, meta),
        "persons": persons,
        # carried for review, not written in option A
        "unmapped": {
            "supportOrders": canonical.get("supportOrders") or [],
            "otherChildren": canonical.get("otherChildren") or [],
            "otherInformation": canonical.get("otherInformation") or "",
            "applicantMaritalStatus": C.marital_status((canonical.get("applicant") or {}).get("maritalStatus")),
            "ncpFinancialAccounts": ((canonical.get("noncustodialParent") or {}).get("financialAccounts") or {}),
            "ncpProperty": ((canonical.get("noncustodialParent") or {}).get("property") or {}),
            "ncpRelatives": {
                "mother": (canonical.get("noncustodialParent") or {}).get("mother"),
                "father": (canonical.get("noncustodialParent") or {}).get("father"),
                "contacts": (canonical.get("noncustodialParent") or {}).get("contacts") or [],
            },
            "case": {"create": False},
            "work_item": {"create": False},
        },
    }
