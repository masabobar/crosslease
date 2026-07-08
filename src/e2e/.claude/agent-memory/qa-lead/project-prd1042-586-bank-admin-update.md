---
name: project-prd1042-586-bank-admin-update
description: 2026-07-08 update to PRD1042-586 Module Activation.md — added bank_admin to AC-19 RBAC 404 Outline (5 role variants) per PRD1042-48 Ivan Mladenovic 2026-07-06
metadata:
  type: project
---

**2026-07-08:** Retrofitted `PRD1042-586 Module Activation.md` for the Bank Admin role (`bank_admin`, user_type `bank_tenant`) per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).

**Why:** Bank Admin was introduced across the platform as the tenant-level admin role. Per Jira PRD1042-586 Permission Matrix and Security Requirements: "Module activation API returns HTTP 404 to all non-System Admin roles" — Power User (Bank Admin) is explicitly ✗ for the Activate module action. Module activation remains a platform-only System Admin action, so `bank_admin` must be added to the 404 unauthorized-roles list.

**How to apply / Changes:**

1. Header note added: "Updated 2026-07-08: Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin cannot activate modules (platform-only)."
2. Scenarios summary — AC-19 row: `4 role variants` → `5 role variants`
3. AC-19 Scenario Outline Examples — added `bank_admin` as first row alongside `support_user`, `auditor`, `front_office`, `leasing_company_user`

**Unchanged (verified against Jira):**

- No happy-path changes — activation remains System Admin only
- No new Blocked ACs
- No changes to AC classification table
- Scenario count remains 9 blocks (5 Outlines + 4 Scenarios); only AC-19 Outline row count grew from 4 → 5

**Related:** [[project-prd1042-48-bank-admin-update]] — parent decision, [[feedback-bank-admin-role-realignment]] — role realignment pattern
