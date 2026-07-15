---
name: project-prd1042-596-bank-admin-update
description: 2026-07-08 update to PRD1042-596 US 29.15 Tenant Edit — added bank_admin to AC-07 404 Outline (5→6 roles); Bank Admin cannot edit tenant identity fields (platform-managed by System Admin)
metadata:
  type: project
---

2026-07-08 update to `/Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-596 Tenant Edit.md`:

**Change:** Added `Bank Admin` (wire value `bank_admin`, User Type `bank_tenant`) to the AC-07 RBAC 404 Outline. Role count went from 5 → 6 non-admin roles (Bank Admin, Front Office, Back Office, LC User, Support User, Auditor).

**Rationale (authoritative — confirmed by user):**

- Bank Admin CANNOT edit tenant identity fields (Tenant Name, Legal Entity Name, Description, Legal Hold Flag) — all platform-managed by System Admin only.
- Bank Admin may edit BANK-side configuration — covered separately in [[project-prd1042-591]] (US 29.10 Config Overrides).
- Cross-tenant edit → HTTP 404 (RefiNext 404-not-403 domain rule).

**Edits applied:**

1. Header — added `**Updated 2026-07-08:**` line explaining scope of change and PRD1042-48 provenance.
2. AC Scope Filter (AC-07 row) — rationale updated: "5 non-admin roles" → "6 non-admin roles including `bank_admin` (bank tenant identity is platform-managed by System Admin only)".
3. Scenarios summary table — "5 role variants" → "6 role variants".
4. AC-07 Gherkin comment block — added 5-line explanation of Bank Admin's inclusion and the PRD1042-48/PRD1042-591 split.
5. AC-07 Examples table — added `Bank Admin` row (placed first, above Front Office, before other roles).

**Provenance:** PRD1042-48 (Ivan Mladenovic decision 2026-07-06); see [[project-prd1042-48-bank-admin-update]] and [[feedback-bank-admin-role-realignment]].

**Not affected:** AC-01/02/03/04/05/06/14 scenarios and Blocked ACs table — no changes needed because Bank Admin has no positive edit path on tenant identity; the single 404 Outline covers all Bank Admin behavior on this endpoint.

**Open questions:** none — Ivan's decision is explicit that Bank Admin has zero tenant-identity edit access.
