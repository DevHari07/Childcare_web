# CCMS Worker Payload

The JSON our app sends the worker to build the client's `csa_portal` records from one
submitted application.

- **Endpoints:**
  - `POST /worker/applications/{id}/payload` → just the constructed payload
  - `POST /worker/applications/{id}/push?dryRun=true` → the ordered insert plan, writes nothing
  - `POST /worker/applications/{id}/push?dryRun=false&rollback=true` → runs every insert then ROLLS BACK (QA)
  - `POST /worker/applications/{id}/push?dryRun=false` → commits to `CCMS_DATABASE_URL`
  - `POST /worker/applications/{id}/push?dryRun=false&force=true` → soft-deletes the prior graph, then re-pushes
- **Source:** `applications.application_details` (canonical doc from `normalize.py`; a raw draft is normalised on the fly)
- **Target DB:** `CCMS_DATABASE_URL` → the local clone `ccms_local` (never the live RDS yet)
- **Idempotency:** a committed push writes `csa_portal.aplctn.id` back to `applications.ccms_aplctn_id`.
  A second push of the same application → **409** unless `?force=true`, which marks the previous
  `aplctn` + person graph `isdeleted='Y'` (worker-created rows only) before inserting fresh ones.
- **Status:** ✅ implemented & verified against `ccms_local` (option A scope). Every row is stamped
  `created_by`/`updated_by` = `CCMS_CREATED_BY` (`CSA_PORTAL`), `isdeleted='N'`.

### Schema surprises found in the real clone (differ from the ER doc)

| ER doc says | Reality in `csa_portal` | Handling |
|---|---|---|
| `person.ssn VARCHAR(9)` | **no `ssn` column** (only `aka_ssn`) | SSN carried per-person in payload (`persons[].ssn`) and written to `csa_portal.prsn_vrfctn_stts` (`attr_nam='SSN'`, `attr_typ='P'`) for login/case linkage |
| `prsn_contact_link.contact_type_cd` | column doesn't exist | dropped; the type lives on `contact.contact_type_key` |
| address type on `prsn_addr_link` | it's a separate table `addr_addr_typ_lnk (address_id, addr_type_cd)` | worker inserts that row too |
| `cp_prsn_income` / `ncp_prsn_income` | `cp_prsn_id` / `ncp_prsn_id` are **NOT NULL** | worker captures them from the `*_prsn_detail` insert |
| many `*_cd` / code columns are `varchar(10)` | raw wizard labels ("STEPDAUGHTER", "MARINE CORPS", formatted phones) overflow | `ccms_codes.child_relationship()` / `military_branch()` / `phone()` map to fitting tokens; the writer also **clips any string to its column length** as a backstop and reports what it clipped in `outcome.clipped` |

## Shape

Grouped by target entity, using **CCMS column names** so the mapping is 1:1 and reviewable.
`ref` strings are local handles the worker uses to wire foreign keys before the CCMS ids exist.
Every created row also gets `created_by` / `updated_by` = `meta.createdBy` and `isdeleted = 'N'`.

```jsonc
{
  "meta": {
    "sourceApplicationId": 42,                 // our applications.id
    "sourceReferenceCode": "NDCS-2026-0908-4471",
    "schemaVersion": 1,
    "submittedAt": "2026-09-08T14:22:00Z",
    "createdBy": "CSA_PORTAL",                  // audit actor for every created_by/updated_by
    "dryRun": true
  },

  // ── csa_portal.aplctn (1 row) ────────────────────────────────────────────
  "aplctn": {
    "aplctn_name":        "Jordan — child support application",  // canonical.applicationName
    "aplctn_status_cd":   "Submitted",                           // fixed on push
    "aplctn_status_dt":   "2026-09-08",
    "aplctn_start_dt":    "2026-09-01",                          // our applications.created_at
    "aplctn_recvd_dt":    "2026-09-08",                          // our submitted_at
    "submit_date":        "2026-09-08",
    "stamped_dt":         "2026-09-08",
    "paper_aplctn_type":  "electronic",                          // fixed (values seen: inperson|mail|electronic)
    "case_type":          "CS",                                  // CS = IV-D / full service · NI = Non-IV-D / search only   [CONFIRM]
    "jurisd_cd":          null,                                  // unknown at intake (worker/caseworker sets later)
    "signed_name":        "Alex P Carter",                       // canonical.certification.signature
    "signed_dt":          "2026-09-08",
    "agree_future_payment": "N",                                 // "Y" if services.withholdOtherPartyInfo   [CONFIRM mapping]
    "pymnt_agreement":    null,
    "has_hlth_ins":       "N",                                   // "Y" if any child_detail.has_insurance
    "is_pymnt_reqd":      "N",
    "review_dt":          null
  },

  // ── persons: person + prsn_role_link + role-specific detail + addr/contact/emp ──
  "persons": [

    { "ref": "applicant",
      "role": {                                                 // csa_portal.prsn_role_link
        "role_cd": "CU_CP",                                      // CU_CP custodial · NCP · CHILD · AP
        "mbr_type": "CP",
        "relationship_to_child": "Mother"                        // RELATION code   [CONFIRM code list]
      },
      "person": {                                               // csa_portal.person
        "first_name": "ALEX", "middle_name": "P", "last_name": "CARTER",   // stored UPPERCASE
        "suffix_cd": null,
        "dob": "1988-04-12",
        "gender_cd": "F",                                        // M|F|O|U|TG  (from wizard male/female/…)
        "race_cd": null,
        "ssn": "123456789",                                      // encrypted by worker before insert
        "birth_place_city": "Baltimore", "birth_place_state_cd": "MD",
        "mdn_last_name": "SMITH"                                 // canonical.applicant.maidenName
      },
      "cp_detail": {                                             // csa_portal.cp_prsn_detail (role = CU_CP only)
        "is_custodial_party": "Y",
        "reln_to_child_cd": "Mother",
        "service_type_cd": "full",                               // full_service | search_only  [CONFIRM codes]
        "is_tca_applicant": "N",
        "is_cash_asstnce": "N", "is_med_asstnce": "N",
        "is_child_care_asstnce": "Y",                            // services.receivesPublicAssistance / assistance flags
        "is_support_order": "N",                                 // true if supportOrders present
        "is_family_violence": "N",
        "is_employed": "Y",
        "text_ntfn": "N", "email_ntfn": "Y", "ntfn_typ": "EMAIL"
      },
      "addresses": [                                             // csa_portal.address + prsn_addr_link
        { "addr_type_cd": "RES", "addr_line_1": "1204 Main Ave", "addr_line_2": "Apt 3",
          "city": "Baltimore", "county_cd": null, "state_cd": "MD", "zip_cd": "21201", "country_cd": "USA" },
        { "addr_type_cd": "MAI", "addr_line_1": "PO Box 12", "city": "Baltimore",
          "state_cd": "MD", "zip_cd": "21201", "country_cd": "USA" }
      ],
      "contacts": [                                              // csa_portal.contact + prsn_contact_link
        { "contact_type_key": "HM", "contact_type_value": "4105551234" },
        { "contact_type_key": "CL", "contact_type_value": "4105555678" },
        { "contact_type_key": "WK", "contact_type_value": "4105559999" },
        { "contact_type_key": "PER", "contact_type_value": "alex@example.com" }   // email → contact
      ],
      "employers": [                                             // csa_portal.employers + prsn_emplr_link
        { "is_employed": "Y", "employer_name": "SANFORD HEALTH", "occupation": null,
          "phone_num": "7015552468", "self_empmnt_ind": "N", "emplyr_typ": null,
          "empmnt_start_dt": null, "empmnt_end_dt": null,
          "address": { "addr_line_1": null, "city": null, "state_cd": null, "zip_cd": null } }
      ],
      "income": [                                                // csa_portal.cp_prsn_income
        { "income_type": "WAGE", "income_source": "SANFORD HEALTH",
          "income_frequency": "MON", "income_amount": 3200, "household_size": 4 }
      ]
    },

    { "ref": "child-1",
      "role": { "role_cd": "CHILD", "mbr_type": null, "relationship_to_child": null },
      "person": {
        "first_name": "JORDAN", "middle_name": null, "last_name": "CARTER",
        "dob": "2015-06-01", "gender_cd": "M", "ssn": "987654321",
        "birth_place_city": "Baltimore", "birth_place_state_cd": "MD"
      },
      "child_detail": {                                          // csa_portal.child_prsn_detail
        "has_paternity": "Y",
        "paternity_type": null,
        "paternity_state_cd": "MD", "paternity_county_cd": null,
        "ptrnty_est_dt": "2016-01-10",
        "court_order_number": null,
        "has_insurance": "N",
        "conception_state_cd": null
      }
    },

    { "ref": "ncp",
      "role": { "role_cd": "NCP", "mbr_type": "AP", "relationship_to_child": "Father" },
      "person": {
        "first_name": "SAM", "middle_name": null, "last_name": "REED",
        "dob": "1985-02-20", "gender_cd": "M", "race_cd": "WH", "ssn": "555443333",
        "birth_place_city": "Fargo", "birth_place_state_cd": "ND",
        "eye_color_cd": "N", "hair_color_cd": "N",                // mapped from Brown → N
        "height_feet": 5, "height_inch": 11, "weight": 180,
        "nick_name": "Sammy", "identity_mark": "tattoo on left forearm",
        "mdn_last_name": null
      },
      "ncp_detail": {                                            // csa_portal.ncp_prsn_detail
        "last_know_addr_dt": null, "tribal_cd": null,
        "is_employed": "Y", "text_ntfn": "N", "email_ntfn": "N", "ntfn_typ": null
      },
      "addresses": [
        { "addr_type_cd": "RES", "addr_line_1": "88 River Rd", "city": "Fargo",
          "state_cd": "ND", "zip_cd": "58102", "country_cd": "USA" }
      ],
      "contacts": [
        { "contact_type_key": "HM", "contact_type_value": "7015550101" },
        { "contact_type_key": "CL", "contact_type_value": "7015550102" }
      ],
      "employers": [
        { "is_employed": "Y", "employer_name": "ACME LOGISTICS", "occupation": "Driver",
          "phone_num": "7015550200", "self_empmnt_ind": "N" }
      ],
      "income": [                                                // csa_portal.ncp_prsn_income
        { "income_type": "WAGE", "income_source": "ACME LOGISTICS",
          "income_frequency": "MON", "income_amount": 4100 }
      ],
      "nc_identity": {                                           // csa_portal.nc_identity
        "has_state_id": "Y", "state_id_num": "D1234567", "state_id_state_cd": "ND",
        "has_auto": 1, "auto_tag_id": "ABC123", "auto_tag_state_cd": "ND",
        "auto_make_model": "Toyota Camry", "auto_year": "2018",
        "has_other_child_support_case": "Y", "other_child_support_state_cd": "VA"
      },
      "nc_military_srvc": {                                      // csa_portal.nc_military_srvc
        "has_military_service": "Y", "is_currently_in_service": "N",
        "military_branch_cd": "ARMY",                            // MILITARY_BRANCH_CD   [CONFIRM code list]
        "from_date": "2005-01-01", "to_date": "2009-01-01"
      },
      "nc_jail_srvc": {                                          // csa_portal.nc_jail_srvc
        "has_jail_service": "N", "is_incarcerated": "N",
        "from_date": null, "to_date": null, "jail_name": null,
        "prsnr_admsn_dt": null, "prsnr_rls_dt": null,
        "address": null
      },
      "nc_child_sppt": [                                         // csa_portal.nc_child_sppt (0..N)
        { "has_court_ordered": "Y", "court_order_num": "CO-2020-111", "court_order_dt": "2020-03-01",
          "court_ordered_state_cd": "VA",
          "has_pay_support": "Y", "to_whom_cd": "OTHR", "agency_name": "Fairfax County CSA",   // [CONFIRM to_whom_cd list]
          "last_payment_dt": "2026-07-01", "paid_amount": 250,
          "is_military_allotment": "N",
          "has_other_child_support_case": "Y", "other_child_support_state_cd": "VA",
          "agency": { "adr_line_1": null, "city": null, "state_cd": "VA", "zip_cd": null, "phone_num": null } }
      ],
      "relatives": [                                             // csa_portal.relative_prsn + prsn_relative_link
        { "relative_type_cd": "MOTHER", "first_name": "MARY", "last_name": "REED",
          "maiden_name": "JONES", "city": "Fargo", "state_cd": "ND" },
        { "relative_type_cd": "FATHER", "first_name": "JOHN", "last_name": "REED", "maiden_name": null },
        { "relative_type_cd": "NEAREST_RELATIVE", "first_name": "PAT", "last_name": "REED",
          "phone_num": "7015550303", "adr_line_1": "12 Oak St", "city": "Fargo", "state_cd": "ND" }
      ],
      "attorney": {                                              // csa_portal.attorney (→ ncp_prsn_detail.attorney_id)
        "first_name": null, "last_name": null, "phone_num": null, "work_email": null, "address": null
      },
      "financial_accounts": [                                    // no dedicated table found → [CONFIRM target]
        { "institution_name": "Bank of America", "account_type": "CHECKING",
          "account_number": "****4321", "account_value": 1500, "in_bankruptcy": "N" }
      ],
      "vehicles": [                                              // → nc_identity.auto_* (first) or [CONFIRM multi-vehicle table]
        { "type": "car", "year": "2018", "make": "Toyota", "model": "Camry",
          "license_number": "ABC123", "state": "ND" }
      ],
      "property": {                                              // [CONFIRM target table]
        "description": "Boat", "estimated_value": 20000,
        "address": null, "lien_holder": "First Bank"
      }
    }
  ],

  // ── support orders ─────────────────────────────────────────────────────────
  // Target table not in the ER doc — likely csa_portal.cs_case_court_order / cs_courtorder_arrears.  [CONFIRM]
  "support_orders": [
    { "order_type": "child_support", "order_number": "CO-2019-555", "state_filed": "MD",
      "date_filed": "2019-05-01", "amount": 400, "frequency": "monthly",
      "start_date": "2019-06-01", "end_date": null,
      "children": ["child-1"] }                                  // refs into persons[]
  ],

  // ── other children (not on this case) ─────────────────────────────────────
  "other_children": [
    { "first_name": "TAYLOR", "last_name": "CARTER", "dob": "2019-02-02" }
  ],

  "other_information": "Free-text notes the applicant added.",

  // ── case + application↔case link (csa_portal.cs_case, aplctn_case_lnk) ────
  "case": {
    "create": true,                                             // worker decides: new case vs link existing
    "case_name": "CARTER, ALEX",
    "case_status_cd": "PENDING",                                 // [CONFIRM CASE_STATUS_CD]
    "case_type": "CS",
    "services_rqd": "FS",                                        // [CONFIRM SERVICE_CODE / services_rqd]
    "jurisd": null
  },

  // ── work item (csa_portal.work_item) ─────────────────────────────────────
  "work_item": {
    "create": true,
    "work_item_type_cd": "APPL",                                 // [CONFIRM work item type code]
    "work_item_status_cd": "OPEN",                               // [CONFIRM]
    "start_dt": "2026-09-08T14:22:00Z",
    "due_dt": null
  }
}
```

## Field mapping (canonical → CCMS)

| Canonical path (`application_details`) | CCMS target | Notes |
|---|---|---|
| `applicationName` | `aplctn.aplctn_name` | |
| `applicantType` (`custodian`/`non-custodian`) | drives `prsn_role_link.role_cd` of the applicant | `custodian → CU_CP`, `non-custodian → NCP` |
| `services.type` (`full_service`/`search_only`) | `cp_prsn_detail.service_type_cd`, `aplctn.case_type` | `full_service → CS`, `search_only → NI` **[CONFIRM]** |
| `services.withholdOtherPartyInfo` | `aplctn.agree_future_payment` | **[CONFIRM]** |
| `certification.signature` | `aplctn.signed_name` | |
| `applicant.name.{first,middle,last,suffix}` | `person.{first_name,middle_name,last_name,suffix_cd}` | upper-cased; `suffix_cd` via SUFFIX ref list |
| `applicant.ssn` | `person.ssn` | worker encrypts (`crypto.py`) before insert |
| `applicant.gender` | `person.gender_cd` | `male→M female→F other→O ""→U` |
| `applicant.dob` | `person.dob` | ISO |
| `applicant.birthCity / birthState` | `person.birth_place_city / birth_place_state_cd` | state name → USPS 2-letter |
| `applicant.maidenName` | `person.mdn_last_name` | |
| `applicant.maritalStatus` | *(no person col)* → `cp_prsn_detail`? | MARITAL STATUS ref (`Married→MR` …) **[CONFIRM target]** |
| `applicant.residentialAddress` | `address` + `prsn_addr_link` (`addr_type_cd='RES'`) | country name → `USA` |
| `applicant.mailingAddress` | `address` + `prsn_addr_link` (`addr_type_cd='MAI'`) | |
| `applicant.phones.{home,cell}` | `contact` + `prsn_contact_link` (`HM`,`CL`) | |
| `applicant.phones.emergency` | `contact` (`EMG`?) **[CONFIRM]** | |
| `applicant.email` | `contact` + `prsn_contact_link` (`contact_type_key='PER'`) | |
| `applicant.employment.*` | `employers` + `prsn_emplr_link` | |
| `applicant.household.{size,monthlyIncome}` | `cp_prsn_income.{household_size,income_amount}` | |
| `children[].*` | `person` + `prsn_role_link (CHILD)` + `child_prsn_detail` | |
| `children[].paternityEstablished / paternityDate` | `child_prsn_detail.has_paternity / ptrnty_est_dt` | |
| `noncustodialParent.name/ssn/gender/dob` | `person` + `prsn_role_link (NCP)` | |
| `noncustodialParent.physicalDescription.*` | `person.{eye_color_cd,hair_color_cd,height_feet,height_inch,weight,race_cd,nick_name,identity_mark}` | eye/hair/race → ref codes |
| `noncustodialParent.employment / income` | `employers` + `prsn_emplr_link`, `ncp_prsn_income` | |
| `noncustodialParent.mother / father` | `relative_prsn` + `prsn_relative_link` (`relative_type_cd` MOTHER/FATHER) | |
| `noncustodialParent.contacts[]` (nearest relatives) | `relative_prsn` + `prsn_relative_link` | |
| `noncustodialParent.military.*` | `nc_military_srvc` | branch → MILITARY_BRANCH_CD **[CONFIRM]** |
| `noncustodialParent.criminalHistory.*` | `nc_jail_srvc` | |
| `noncustodialParent.license.*` | `nc_identity.{has_state_id,state_id_num,state_id_state_cd}` | professional license → **[CONFIRM]** |
| `noncustodialParent.vehicles[]` | `nc_identity.auto_*` (first vehicle) | multi-vehicle → **[CONFIRM table]** |
| `noncustodialParent.financialAccounts.*` | **[CONFIRM: no obvious target table]** | |
| `noncustodialParent.property.*` | **[CONFIRM target]** | |
| `supportOrders[]` | `cs_case_court_order` / `cs_courtorder_arrears` **[CONFIRM]** | |
| `otherInformation` | **[CONFIRM: aplctn note table]** | |
| — | `aplctn_case_lnk`, `cs_case`, `work_item` | created by worker after the person graph |

## Open items to confirm with the client

1. **Target tables — live vs `_wp` staging.** Parallel `*_wp` tables exist (`aplctn_wp`, `cp_prsn_detail_wp`, …). Does a paper/portal application land in `_wp` first (then a CCMS job promotes it), or straight into the live tables?
2. **`case_type` / `services_rqd` codes** for full-service vs search-only.
3. **Code lists** we can't see in `reference_data_detail`: `MILITARY_BRANCH_CD`, `SUFFIX`, `to_whom_cd`, `work_item_type_cd`/`status`, `case_status_cd`, `relative_type_cd`, professional-license fields.
4. **`created_by` value** the client wants stamped on portal-sourced rows.
5. **Targets for**: financial accounts, real/personal property, multiple vehicles, professional licenses, support orders, applicant marital status, free-text "other information", emergency phone.
6. **Case + work item creation** — should the worker create `cs_case` + `work_item`, or only `aplctn` + person graph and let CCMS intake do the rest?
7. **`aplctn_num`** — auto-assigned by the sequence (default), or supplied by us?
