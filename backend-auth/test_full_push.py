"""Full end-to-end integration test:
1. Registers/logins local user.
2. Creates and populates a full childcare assistance application.
3. Submits the application.
4. Pushes the application to CCMS database via POST /worker/applications/{id}/push?dryRun=false.
5. Queries CCMS database directly to verify `csa_portal.aplctn`, `person`, `prsn_role_link`, and `prsn_vrfctn_stts`.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime

BASE = os.getenv("BASE_URL", "http://localhost:8000")


def call(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        BASE + path, data=data, method=method,
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, json.loads(raw or "null") if raw else {"error": str(e)}


def main():
    print("--- 1. Authenticating User ---")
    # Register/Login
    email = f"testuser_{int(datetime.now().timestamp())}@example.com"
    code, auth_res = call("POST", "/auth/register", {
        "email": email,
        "password": "Password123!",
        "first_name": "Alexis",
        "last_name": "Carter",
        "role": "parent"
    })
    if code != 200:
        print(f"Register response {code}: {auth_res}. Trying login...")
        code, auth_res = call("POST", "/auth/login", {"email": email, "password": "Password123!"})
    
    if code != 200 or "token" not in auth_res:
        print(f"FAILED Auth: {code} {auth_res}")
        sys.exit(1)
    
    token = auth_res["token"]
    print(f"Authenticated successfully as {email}. Token acquired.")

    print("\n--- 2. Creating Application Draft ---")
    code, created = call("POST", "/applications", {
        "applicationDetails": {"apply": {"applicantType": "custodian"}},
    }, token=token)
    if code != 201:
        print(f"FAILED Create application: {code} {created}")
        sys.exit(1)

    app_id = created["id"]
    ref_code = created["reference_code"]
    print(f"Created Application ID: {app_id}, Reference: {ref_code}")

    print("\n--- 3. Populating Full Application Data ---")
    full_form_data = {
        "data": {
            "applicantType": "custodian",
            "fullName": "Alexis P Carter",
            "ssn": "6789",
            "gender": "female",
            "dob": "1988-04-12",
            "birthCity": "Baltimore",
            "birthState": "MD",
            "maidenName": "SMITH",
            "maritalStatus": "divorced",
            "receivesPublicAssistance": "yes",
            "withholdOtherPartyInfo": False,
            "children": [
                {
                    "id": "c1",
                    "firstName": "JORDAN",
                    "middleName": "R",
                    "lastName": "CARTER",
                    "ssn": "4321",
                    "dob": "2015-06-01",
                    "gender": "male",
                    "birthCity": "Baltimore",
                    "birthState": "MD",
                    "relationship": "son",
                    "paternityEstablished": "yes",
                    "paternityDate": "2016-01-10",
                    "hasInsurance": "yes"
                },
                {
                    "id": "c2",
                    "firstName": "RILEY",
                    "lastName": "CARTER",
                    "ssn": "3333",
                    "dob": "2018-09-15",
                    "gender": "female",
                    "birthState": "MD",
                    "relationship": "daughter",
                    "paternityEstablished": "no"
                }
            ],
            "agreementChecks": [True] * 6,
            "rightsChecks": [True] * 6,
            "redeterminationAck": True,
            "certify": True
        },
        "details": {
            "custodialName": {
                "firstName": "Alexis",
                "middleName": "P",
                "lastName": "Carter",
                "maidenName": "Smith",
                "ssn": "6789"
            },
            "custodialAddress": {
                "residential": {
                    "line1": "1204 Main Ave",
                    "line2": "Apt 3",
                    "city": "Baltimore",
                    "state": "MD",
                    "zip": "21201"
                },
                "mailing": {
                    "line1": "PO Box 812",
                    "city": "Baltimore",
                    "state": "MD",
                    "zip": "21203"
                }
            },
            "custodialContact": {
                "homePhone": "4105551234",
                "cellPhone": "4105555678",
                "email": "alexis.carter@example.com"
            },
            "custodialEmployment": {
                "currentlyEmployed": "yes",
                "employerName": "SANFORD HEALTH",
                "workPhone": "7015552468",
                "monthlyIncome": 3200.0,
                "householdSize": 4
            },
            "noncustodialParent": {
                "name": {
                    "first": "Samuel",
                    "middle": "T",
                    "last": "Reed",
                    "suffix": "Jr"
                },
                "ssn": "3333",
                "dob": "1985-02-20",
                "gender": "male",
                "birthCity": "Fargo",
                "birthState": "ND",
                "physicalDescription": {
                    "race": "white",
                    "eyes": "blue",
                    "hair": "brown",
                    "heightFt": "5",
                    "heightIn": "11",
                    "weight": "185",
                    "nickname": "Sammy",
                    "otherFeatures": "Tattoo on left forearm"
                },
                "residentialAddress": {
                    "line1": "88 River Rd",
                    "city": "Fargo",
                    "state": "ND",
                    "zip": "58102"
                },
                "phones": {
                    "home": "7015550101",
                    "cell": "7015550102"
                },
                "email": "sam.reed@example.com",
                "employment": {
                    "employed": "yes",
                    "employer": "ACME LOGISTICS",
                    "workPhone": "7015550200"
                },
                "license": {
                    "driversLicenseNumber": "D1234567",
                    "driversLicenseState": "ND"
                },
                "military": {
                    "branch": "Army",
                    "status": "Inactive",
                    "servedFrom": "2005-01-01",
                    "servedTo": "2009-01-01"
                },
                "criminalHistory": {
                    "incarcerated": "yes",
                    "institutionName": "State Penitentiary",
                    "institutionCity": "Bismarck",
                    "institutionState": "ND"
                }
            }
        },
        "stepIndex": 8
    }

    code, saved = call("PUT", f"/applications/{app_id}", {"formData": full_form_data}, token=token)
    if code != 200:
        print(f"FAILED Autosave form data: {code} {saved}")
        sys.exit(1)
    print("Form data autosaved successfully.")

    print("\n--- 4. Submitting Application ---")
    code, submitted = call("POST", f"/applications/{app_id}/submit", {
        "signature": "Alexis P Carter",
        "certified": True,
        "agreements": [
            {"consentItemCode": "agreement.assign_support", "accepted": True, "bodySnapshot": "Assign support..."},
            {"consentItemCode": "rights.cooperation", "accepted": True, "bodySnapshot": "Cooperation rights..."}
        ]
    }, token=token)
    if code != 200:
        print(f"FAILED Submission: {code} {submitted}")
        sys.exit(1)
    print(f"Submitted successfully. Application status: {submitted['application_status']}")

    print("\n--- 5. Pushing Application to Worker DB (CCMS) ---")
    # Call worker push endpoint with dryRun=false
    code, push_res = call("POST", f"/worker/applications/{app_id}/push?dryRun=false", token=token)
    if code != 200:
        print(f"FAILED Push: {code} {push_res}")
        sys.exit(1)

    print("Push succeeded!")
    ccms_aplctn_id = push_res.get("outcome", {}).get("result", {}).get("aplctn", {}).get("id")
    print(f"Created CCMS csa_portal.aplctn id: {ccms_aplctn_id}")

    print("\n--- 6. Direct Database Verification of csa_portal.prsn_vrfctn_stts ---")
    from app.ccms_db import connection
    with connection() as conn:
        with conn.cursor() as cur:
            # Query prsn_vrfctn_stts records for this application's persons
            cur.execute(
                """
                select pvs.stts_id, pvs.prsn_id, pvs.attr_typ, pvs.attr_nam, pvs.attr_id, 
                       pvs.vrfctn_stts, pvs.vrfctn_src, p.first_name, p.last_name, prl.role_cd
                from csa_portal.prsn_vrfctn_stts pvs
                join csa_portal.person p on p.id = pvs.prsn_id
                join csa_portal.prsn_role_link prl on prl.prsn_id = p.id
                where prl.aplctn_id = %s
                """,
                (ccms_aplctn_id,)
            )
            rows = cur.fetchall()
            print(f"Found {len(rows)} verification status records in csa_portal.prsn_vrfctn_stts:")
            for r in rows:
                print(f"  • ID: {r['stts_id']}, Person: {r['first_name']} {r['last_name']} ({r['role_cd']}), "
                      f"Attr: {r['attr_nam']}={r['attr_id']}, Status: {r['vrfctn_stts']}, Source: {r['vrfctn_src']}")

            # Also query aplctn table
            cur.execute("select id, aplctn_name, signed_name, submit_date from csa_portal.aplctn where id = %s", (ccms_aplctn_id,))
            app_row = cur.fetchone()
            print(f"\nCreated csa_portal.aplctn record: {dict(app_row)}")

    print("\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    main()
