"""Value mappings: our wizard / canonical vocabulary -> CCMS csa_portal codes.

Codes verified against the local clone's csa_common.reference_data_detail
(GENDER, MARITAL STATUS, RACE, EYE/HAIR COLOR, ADDRESS TYPE, PHONE TYPE, STATE,
CASE_TYPE). Items still marked TODO need the client's code lists.
"""
from __future__ import annotations

from typing import Any


def yn(v: Any) -> str | None:
    """canonical bool / 'yes'|'no' -> 'Y' | 'N' | None."""
    if v is True:
        return "Y"
    if v is False:
        return "N"
    s = str(v).strip().lower()
    if s in ("y", "yes", "true", "1"):
        return "Y"
    if s in ("n", "no", "false", "0"):
        return "N"
    return None


GENDER = {
    "male": "M", "m": "M",
    "female": "F", "f": "F",
    "transgender": "TG",
    "other": "O",
    "": "U", "unknown": "U", "prefer not to say": "U",
}

MARITAL_STATUS = {
    "single": "SG", "married": "MR", "divorced": "DV",
    "widowed": "WD", "separated": "LS", "domestic partner": "LP",
}

RACE = {
    "white": "WH",
    "black or african american": "BA",
    "american indian or alaska native": "AI",
    "asian": "AS",
    "native hawaiian or other pacific islander": "PI",
    "hispanic or latino": "HI",
    "two or more races": "UN",   # TODO confirm — no multi-race code seen
    "other": "UN",
    "unknown": "UN",
}

EYE_COLOR = {
    "brown": "N", "blue": "E", "green": "R", "hazel": "H",
    "gray": "G", "grey": "G", "black": "B", "pink": "P", "other": "O",
}

HAIR_COLOR = {
    "black": "B", "brown": "N", "blonde": "L", "red": "R",
    "gray": "G", "grey": "G", "white": "W", "bald": "BA", "other": "O",
}

# Wizard applicantType -> prsn_role_link.role_cd for the applicant person.
APPLICANT_ROLE = {"custodian": "CU_CP", "non-custodian": "NCP"}

# services.type -> aplctn.case_type   (CASE_TYPE: CS = IV-D, NI = Non-IV-D)
SERVICE_CASE_TYPE = {"full_service": "CS", "search_only": "NI"}

ADDRESS_TYPE_RES = "RES"
ADDRESS_TYPE_MAI = "MAI"

CONTACT_KEY_HOME = "HM"
CONTACT_KEY_CELL = "CL"
CONTACT_KEY_WORK = "WK"
CONTACT_KEY_EMAIL = "PER"

COUNTRY = {
    "united states of america": "USA", "united states": "USA", "usa": "USA", "us": "USA",
    "": None,
}

# Full state / territory name -> USPS 2-letter (address.state_cd is 2-char USPS).
STATE = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "district of columbia": "DC",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID", "illinois": "IL",
    "indiana": "IN", "iowa": "IA", "kansas": "KS", "kentucky": "KY", "louisiana": "LA",
    "maine": "ME", "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
    "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR",
    "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
    "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA",
    "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "puerto rico": "PR", "guam": "GU", "u.s. virgin islands": "VI", "american samoa": "AS",
    "northern mariana islands": "MP",
}


def _lookup(table: dict, value: Any, default: Any = None) -> Any:
    return table.get(str(value or "").strip().lower(), default)


def gender(v: Any) -> str:
    return _lookup(GENDER, v, "U")


def marital_status(v: Any) -> str | None:
    return _lookup(MARITAL_STATUS, v)


def race(v: Any) -> str | None:
    return _lookup(RACE, v)


def eye_color(v: Any) -> str | None:
    return _lookup(EYE_COLOR, v)


def hair_color(v: Any) -> str | None:
    return _lookup(HAIR_COLOR, v)


def state(v: Any) -> str | None:
    s = str(v or "").strip()
    if len(s) == 2 and s.isalpha():
        return s.upper()
    return _lookup(STATE, s)


def country(v: Any) -> str | None:
    s = str(v or "").strip()
    if len(s) == 3 and s.isalpha():
        return s.upper()
    return _lookup(COUNTRY, s, "USA" if s else None)


def applicant_role(applicant_type: Any) -> str:
    return _lookup(APPLICANT_ROLE, applicant_type, "CU_CP")


def service_case_type(service_type: Any) -> str | None:
    return _lookup(SERVICE_CASE_TYPE, service_type)


# Child's relationship to the custodial party. prsn_role_link.relationship_to_child
# is varchar(10), so the raw wizard labels ("STEPDAUGHTER", "OTHER RELATIVE", …)
# don't fit. Compact, unambiguous tokens until the client confirms a code list.
CHILD_RELATIONSHIP = {
    "son": "SON",
    "daughter": "DAUGHTER",
    "stepson": "STEPSON",
    "stepdaughter": "STEPDAUGHR",
    "grandchild": "GRANDCHILD",
    "niece": "NIECE",
    "nephew": "NEPHEW",
    "foster child": "FOSTER",
    "other relative": "OTHER",
    "other": "OTHER",
}

# NCP military branch. nc_military_srvc.military_branch_cd is varchar(10).
MILITARY_BRANCH = {
    "army": "ARMY",
    "navy": "NAVY",
    "air force": "AIRFORCE",
    "marine corps": "MARINES",
    "marines": "MARINES",
    "coast guard": "COASTGUARD",
    "space force": "SPACEFORCE",
    "national guard": "NATLGUARD",
}


def phone(v: Any) -> str | None:
    """Strip formatting to bare digits; keep the last 10 (drops a leading US 1).
    employers.phone_num / nc_jail_srvc.inst_phne_num are varchar(10)."""
    digits = "".join(ch for ch in str(v or "") if ch.isdigit())
    if not digits:
        return None
    if len(digits) == 11 and digits[0] == "1":
        digits = digits[1:]
    return digits[-10:]


def child_relationship(v: Any) -> str | None:
    s = str(v or "").strip()
    if not s:
        return None
    return CHILD_RELATIONSHIP.get(s.lower(), s.upper()[:10])


def military_branch(v: Any) -> str | None:
    s = str(v or "").strip()
    if not s:
        return None
    return MILITARY_BRANCH.get(s.lower(), s.upper()[:10])
