"""End-to-end smoke test for the applications API (APP_AUTH_MODE=dev).

    # terminal 1
    .\\venv\\Scripts\\uvicorn.exe app.main:app --port 8000
    # terminal 2
    .\\venv\\Scripts\\python.exe test_applications.py
"""
import os
import sys

import urllib.request
import json

BASE = os.getenv("BASE_URL", "http://localhost:8000")


def call(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path, data=data, method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or "null")


def check(label: str, cond: bool) -> None:
    print(f"  {'OK ' if cond else 'FAIL'}  {label}")
    if not cond:
        sys.exit(1)


def main() -> None:
    code, health = call("GET", "/")
    check("health online", code == 200 and health.get("status") == "online")
    check("database connected", health.get("database_connected") is True)

    code, created = call("POST", "/applications", {
        "applicationDetails": {"apply": {"applicantType": "custodian"}},
    })
    check("create draft -> 201", code == 201)
    app_id = created["id"]
    check("has reference_code", created["reference_code"].startswith("NDCS-"))
    check("status DRAFT", created["application_status"] == "DRAFT")

    code, saved = call("PUT", f"/applications/{app_id}", {
        "formData": {
            "data": {
                "applicantType": "custodian", "fullName": "Test User", "certify": True,
                "assistanceType": "full", "householdSize": "3", "monthlyIncome": "85000",
                "children": [{"id": "c1", "firstName": "Kid", "lastName": "Test", "ssn": "123456789"}],
                "agreementChecks": [True] * 6, "rightsChecks": [True] * 6, "redeterminationAck": True,
            },
            "details": {
                "custodialName": {"firstName": "Test", "lastName": "User", "ssn": "987654321"},
                "custodialAddress": {"residential": {"city": "Fargo", "state": "ND", "zip": "58103", "line1": "1 Main"}},
                "custodialEmployment": {"currentlyEmployed": "yes", "employerName": "ACME"},
            },
            "stepIndex": 6,
        },
    })
    check("autosave -> 200", code == 200)
    check("draft keeps raw shape", "stepIndex" in saved["application_details"])
    check("draft json persisted", len(saved["application_details"]["data"]["children"]) == 1)

    code, mine = call("GET", "/applications")
    check("list contains it", any(a["id"] == app_id for a in mine))

    code, submitted = call("POST", f"/applications/{app_id}/submit", {
        "signature": "Test User",
        "certified": True,
        "agreements": [
            {"consentItemCode": "agreement.assign_support", "accepted": True, "bodySnapshot": "..."},
            {"consentItemCode": "rights.cooperation", "accepted": True, "bodySnapshot": "..."},
        ],
    })
    check("submit -> 200", code == 200)
    check("status SUBMITTED", submitted["application_status"] == "SUBMITTED")
    check("submitted_at set", submitted["submitted_at"] is not None)

    canon = submitted["application_details"]
    check("submitted doc is canonical (no wizard state)", "stepIndex" not in canon and "data" not in canon)
    check("applicant merged", canon["applicant"]["name"]["last"] == "User")
    check("income typed", canon["applicant"]["household"]["monthlyIncome"] == 85000.0)
    check("ssn reduced to last4", canon["applicant"]["ssn"] == {"last4": "4321"})
    check("promoted columns", submitted["applicant_type"] == "custodian" and submitted["child_count"] == 1)

    # Legacy applicant-type codes still normalize to the canonical values.
    from app.normalize import to_canonical as _tc
    check("legacy applicantType maps", _tc({"data": {"applicantType": "relative_caregiver"}})["applicantType"] == "non-custodian")

    code, agreements = call("GET", f"/applications/{app_id}/agreements")
    check("2 agreements stored", code == 200 and len(agreements) == 2)

    code, _ = call("PUT", f"/applications/{app_id}", {"formData": {}})
    check("edit after submit -> 409", code == 409)

    code, withdrawn = call("DELETE", f"/applications/{app_id}")
    check("withdraw -> 200 WITHDRAWN", code == 200 and withdrawn["application_status"] == "WITHDRAWN")

    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
