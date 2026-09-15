"""Write a CCMS worker payload into csa_portal (one transaction).

Insert order:
  aplctn
  -> per person: person -> prsn_role_link -> {cp|ncp|child}_prsn_detail
       -> address (+ addr_addr_typ_lnk + prsn_addr_link)
       -> contact (+ prsn_contact_link)
       -> employers (+ prsn_emplr_link)
       -> {cp|ncp}_prsn_income
       -> (NCP) nc_military_srvc, nc_jail_srvc

`dry_run` builds the same ordered plan and returns it without executing.
"""
from __future__ import annotations

from typing import Any

from .ccms_db import connection
from .config import CCMS_CREATED_BY

_AUDIT_TABLES_NO_UPDATED_BY: set[str] = set()  # all target tables carry both

# {table: {column: character_maximum_length}} for csa_portal varchar/char columns,
# loaded once per process from information_schema. Used to clip over-long string
# values so a single unmapped code can't fail the whole transaction with
# "value too long for type character varying(n)".
_VARCHAR_LIMITS: dict[str, dict[str, int]] | None = None


def _load_varchar_limits(cur) -> dict[str, dict[str, int]]:
    cur.execute(
        """
        select table_name, column_name, character_maximum_length
        from information_schema.columns
        where table_schema = 'csa_portal'
          and data_type in ('character varying', 'character')
          and character_maximum_length is not null
        """
    )
    out: dict[str, dict[str, int]] = {}
    for r in cur.fetchall():
        out.setdefault(r["table_name"], {})[r["column_name"]] = r["character_maximum_length"]
    return out


def _audit(values: dict, actor: str) -> dict:
    out = dict(values)
    out.setdefault("created_by", actor)
    out.setdefault("updated_by", actor)
    out.setdefault("isdeleted", "N")
    return out


def _insert_sql(table: str, values: dict, returning: str | None) -> tuple[str, list[Any]]:
    cols = list(values.keys())
    placeholders = ", ".join(["%s"] * len(cols))
    sql = f'insert into csa_portal.{table} ({", ".join(cols)}) values ({placeholders})'
    if returning:
        sql += f" returning {returning}"
    return sql, [values[c] for c in cols]


class _Writer:
    def __init__(self, payload: dict, dry_run: bool):
        self.payload = payload
        self.dry_run = dry_run
        self.actor = (payload.get("meta") or {}).get("createdBy") or CCMS_CREATED_BY
        self.plan: list[dict] = []
        self.result: dict = {"aplctn": None, "persons": []}
        self.clipped: list[dict] = []

    # -- low level -----------------------------------------------------------
    def _clip(self, cur, table: str, values: dict) -> dict:
        global _VARCHAR_LIMITS
        if _VARCHAR_LIMITS is None:
            _VARCHAR_LIMITS = _load_varchar_limits(cur)
        limits = _VARCHAR_LIMITS.get(table)
        if not limits:
            return values
        for col, val in list(values.items()):
            cap = limits.get(col)
            if cap is not None and isinstance(val, str) and len(val) > cap:
                values[col] = val[:cap]
                self.clipped.append({"table": table, "column": col, "original": val, "stored": val[:cap]})
        return values

    def _exec(self, cur, table: str, values: dict, returning: str | None) -> Any:
        values = _audit(values, self.actor)
        self.plan.append({"table": table, "values": values})
        if self.dry_run or cur is None:
            return {"__ref__": f"{table}#{len(self.plan)}"}
        values = self._clip(cur, table, values)
        sql, params = _insert_sql(table, values, returning)
        cur.execute(sql, params)
        row = cur.fetchone() if returning else None
        return row

    # -- sections ----------------------------------------------------------
    def _write_person_node(self, cur, node: dict, aplctn_id: Any) -> dict:
        summary: dict = {"ref": node.get("ref")}

        prow = self._exec(cur, "person", dict(node["person"]), "id")
        person_id = _pk(prow, "id")
        summary["person_id"] = person_id

        role = node.get("role") or {}
        rl = self._exec(cur, "prsn_role_link", {
            "prsn_id": person_id,
            "aplctn_id": aplctn_id,
            "role_cd": role.get("role_cd"),
            "mbr_type": role.get("mbr_type"),
            "relationship_to_child": role.get("relationship_to_child"),
        }, "prsn_role_id")
        prsn_role_id = _pk(rl, "prsn_role_id")
        summary["prsn_role_id"] = prsn_role_id

        ncp_prsn_id = cp_prsn_id = None
        if "cp_detail" in node:
            cr = self._exec(cur, "cp_prsn_detail", {**node["cp_detail"], "prsn_role_id": prsn_role_id}, "cp_prsn_id")
            cp_prsn_id = _pk(cr, "cp_prsn_id")
        if "child_detail" in node:
            self._exec(cur, "child_prsn_detail", {**node["child_detail"], "prsn_role_id": prsn_role_id}, "child_prsn_id")
        if "ncp_detail" in node:
            nr = self._exec(cur, "ncp_prsn_detail", {**node["ncp_detail"], "prsn_role_id": prsn_role_id}, "ncp_prsn_id")
            ncp_prsn_id = _pk(nr, "ncp_prsn_id")

        for addr in node.get("addresses") or []:
            addr = dict(addr)
            addr_type = addr.pop("addr_type_cd", None)
            ar = self._exec(cur, "address", addr, "address_id")
            address_id = _pk(ar, "address_id")
            if addr_type:
                self._exec(cur, "addr_addr_typ_lnk", {"address_id": address_id, "addr_type_cd": addr_type}, None)
            self._exec(cur, "prsn_addr_link", {"address_id": address_id, "prsn_role_id": prsn_role_id}, None)

        for ct in node.get("contacts") or []:
            cr = self._exec(cur, "contact", dict(ct), "contact_id")
            contact_id = _pk(cr, "contact_id")
            self._exec(cur, "prsn_contact_link", {
                "prsn_role_id": prsn_role_id, "contact_id": contact_id,
            }, None)

        for emp in node.get("employers") or []:
            emp = dict(emp)
            emp.pop("address", None)  # employer address: TODO (address_id link)
            er = self._exec(cur, "employers", emp, "employer_id")
            employer_id = _pk(er, "employer_id")
            self._exec(cur, "prsn_emplr_link", {"prsn_role_id": prsn_role_id, "employer_id": employer_id}, None)

        # cp_prsn_income.cp_prsn_id / ncp_prsn_income.ncp_prsn_id are required.
        if "ncp_detail" in node:
            income_table, owner = "ncp_prsn_income", {"ncp_prsn_id": ncp_prsn_id}
        elif "cp_detail" in node:
            income_table, owner = "cp_prsn_income", {"cp_prsn_id": cp_prsn_id}
        else:
            income_table, owner = None, {}
        if income_table:
            for inc in node.get("income") or []:
                self._exec(cur, income_table, {**inc, **owner, "prsn_role_id": prsn_role_id}, None)

        if ncp_prsn_id is not None or self.dry_run:
            mil = node.get("nc_military_srvc")
            if mil and mil.get("has_military_service") == "Y":
                self._exec(cur, "nc_military_srvc", {**mil, "ncp_prsn_id": ncp_prsn_id}, None)
            jail = node.get("nc_jail_srvc")
            if jail and (jail.get("has_jail_service") == "Y" or jail.get("is_incarcerated") == "Y"):
                jail = dict(jail)
                jail.pop("address", None)  # jail address: TODO
                self._exec(cur, "nc_jail_srvc", {**jail, "ncp_prsn_id": ncp_prsn_id}, None)

        return summary

    def run(self, cur) -> dict:
        ar = self._exec(cur, "aplctn", dict(self.payload["aplctn"]), "id, aplctn_num")
        aplctn_id = _pk(ar, "id")
        self.result["aplctn"] = {"id": aplctn_id, "aplctn_num": _pk(ar, "aplctn_num")}
        for node in self.payload.get("persons") or []:
            self.result["persons"].append(self._write_person_node(cur, node, aplctn_id))
        return self.result


def _pk(row: Any, col: str) -> Any:
    if isinstance(row, dict):
        return row.get(col, row.get("__ref__"))
    return row


def soft_delete_aplctn(aplctn_id: int) -> dict:
    """Mark a previously-pushed aplctn and its whole person graph isdeleted='Y'
    (used by ?force=true before a re-push). Only touches rows created by the
    worker (`created_by = CCMS_CREATED_BY`)."""
    counts: dict[str, int] = {}
    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select prsn_role_id, prsn_id from csa_portal.prsn_role_link where aplctn_id = %s",
                (aplctn_id,),
            )
            rows = cur.fetchall()
            role_ids = [r["prsn_role_id"] for r in rows]
            person_ids = [r["prsn_id"] for r in rows if r["prsn_id"]]

            def mark(table: str, where: str, params: tuple) -> None:
                cur.execute(
                    f"update csa_portal.{table} set isdeleted = 'Y', updated_by = %s "
                    f"where {where} and created_by = %s",
                    (CCMS_CREATED_BY, *params, CCMS_CREATED_BY),
                )
                counts[table] = counts.get(table, 0) + cur.rowcount

            mark("aplctn", "id = %s", (aplctn_id,))
            if role_ids:
                addr_ids = _ids(cur, "select address_id from csa_portal.prsn_addr_link where prsn_role_id = any(%s)", role_ids)
                contact_ids = _ids(cur, "select contact_id from csa_portal.prsn_contact_link where prsn_role_id = any(%s)", role_ids)
                emplr_ids = _ids(cur, "select employer_id from csa_portal.prsn_emplr_link where prsn_role_id = any(%s)", role_ids)
                ncp_ids = _ids(cur, "select ncp_prsn_id from csa_portal.ncp_prsn_detail where prsn_role_id = any(%s)", role_ids)
                for t in ("prsn_role_link", "cp_prsn_detail", "ncp_prsn_detail", "child_prsn_detail",
                          "cp_prsn_income", "ncp_prsn_income", "prsn_addr_link", "prsn_contact_link", "prsn_emplr_link"):
                    key = "aplctn_id = %s" if t == "prsn_role_link" else "prsn_role_id = any(%s)"
                    mark(t, key, (aplctn_id if t == "prsn_role_link" else role_ids,))
                for t, ids in (("address", addr_ids), ("addr_addr_typ_lnk", addr_ids),
                               ("contact", contact_ids), ("employers", emplr_ids)):
                    if ids:
                        mark(t, "address_id = any(%s)" if t in ("address", "addr_addr_typ_lnk")
                             else ("contact_id = any(%s)" if t == "contact" else "employer_id = any(%s)"), (ids,))
                if ncp_ids:
                    mark("nc_military_srvc", "ncp_prsn_id = any(%s)", (ncp_ids,))
                    mark("nc_jail_srvc", "ncp_prsn_id = any(%s)", (ncp_ids,))
            if person_ids:
                mark("person", "id = any(%s)", (person_ids,))
        conn.commit()
    return {"softDeleted": aplctn_id, "counts": counts}


def _ids(cur, sql: str, params) -> list:
    cur.execute(sql, (params,))
    col = cur.description[0].name
    return [r[col] for r in cur.fetchall()]


def push(payload: dict, *, dry_run: bool = True, rollback: bool = False) -> dict:
    """dry_run: build the plan, touch no DB.  rollback: run every insert then
    ROLL BACK (proves the SQL end-to-end without persisting — for QA)."""
    w = _Writer(payload, dry_run)
    if dry_run:
        w.run(None)
        return {"dryRun": True, "plan": w.plan, "planCount": len(w.plan)}

    with connection() as conn:
        with conn.cursor() as cur:
            result = w.run(cur)
        if rollback:
            conn.rollback()
        else:
            conn.commit()
    return {
        "dryRun": False,
        "rolledBack": rollback,
        "result": result,
        "planCount": len(w.plan),
        "clipped": w.clipped,
    }
