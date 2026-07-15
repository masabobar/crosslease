---
name: project-prd1042-588-bank-admin-update
description: 2026-07-08 update to `PRD1042-588 Tenant Suspension.md` — added `bank_admin` to AC-14 RBAC 404 Outline per PRD1042-48 (Ivan Mladenovic 2026-07-06)
metadata:
  type: project
---

2026-07-08 update to `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-588 Tenant Suspension.md` (US 29.7 Tenant Suspension Flow).

**Why:** Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06) a new bank-tenant role `bank_admin` (User Type `bank_tenant`) exists. Tenant suspension is platform-only (System Admin with Two-Actor governance countersign), so Bank Admin cannot suspend any tenant — including their own. Bank Admin must receive HTTP 404 on the suspension endpoint (RefiNext 404-not-403 pattern).

**How to apply:** When touching PRD1042-588 or any tenant-lifecycle spec that gates on System Admin only:

- Add `bank_admin` to AC-14 (or equivalent RBAC 404) Outline as an unauthorized role
- Update the scenario summary row to list Bank Admin among the unauthorized roles
- Update the Gherkin comment block to reference PRD1042-48 (Ivan 2026-07-06) and explain platform-only nature
- Header stamp: "**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin cannot suspend tenants (platform-only)."

**Changes made:**

1. Added Updated stamp below the H1 header
2. AC-14 Scenario summary row: appended "Bank Admin" to the Outline role list
3. AC-14 comment block: rewritten to reference PRD1042-48, cite `bank_admin` wire value + `bank_tenant` User Type, explain platform-only tenant suspension
4. AC-14 Examples table: added `Bank Admin` row (as the first non-System-Admin role listed)

**No other ACs affected:** AC-01/03 happy-path is System Admin only (no expansion needed). AC-08/10 error validation is state-machine and field-level — role-agnostic. AC-11 self-countersign is System-Admin-vs-System-Admin scoped. All other ACs remain Blocked.

Sibling stories with similar Bank Admin retrofits: [[project-prd1042-49-bank-admin-update]], [[project-prd1042-62-bank-admin-retrofit]] (feedback-bank-admin-role-realignment).
