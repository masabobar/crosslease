---
name: project-prd1042-587-bank-admin-update
description: 2026-07-08 update to PRD1042-587 (US 29.6 Module Deactivation) — added bank_admin as unauthorized role in AC-16 RBAC 404 Outline (5 variants), platform-only action per PRD1042-48
metadata:
  type: project
---

**File:** `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-587 Module Deactivation.md`

**Update date:** 2026-07-08

**Trigger:** PRD1042-48 Bank Admin role decision (Ivan Mladenovic 2026-07-06) — see [[project-prd1042-48-bank-admin-update]] and [[project-bank-admin-role]].

**Bank Admin (`bank_admin`, `bank_tenant`) behaviour for Module Deactivation:**

- CANNOT deactivate modules — module deactivation is a platform-only action reserved for System Admin
- Receives HTTP 404 (not 403) — 404-not-403 tenant isolation pattern
- Confirmed by story Permission Matrix: `Power User (Bank Admin) = ✗ Deactivate module`

**Why:** Bank Admin scope is bank tenant user management only; module lifecycle (activation/deactivation) is platform-level configuration reserved for System Admin.

**How to apply:** For any story where module lifecycle actions appear, Bank Admin must be in the 404-not-403 role list alongside Front Office, Back Office, Support User, Auditor. Do NOT grant Bank Admin any module CUD permission.

**Changes made:**

1. Added "Updated 2026-07-08" note in header
2. AC-16 rationale updated: "4 non-admin role variants" → "5 non-admin role variants (incl. `bank_admin` per PRD1042-48 2026-07-06)"
3. Scenarios summary Outline count: "4 variants" → "5 variants"
4. AC-16 comment block extended with Bank Admin platform-only rationale
5. AC-16 Examples table gained `Bank Admin` row (now first row alphabetically-ordered by intent, placed at top to highlight the change)

**Scenario blocks:** Still 5 (2 Outlines + 3 Scenarios). No new scenario block added — Bank Admin was folded into the existing AC-16 Scenario Outline via a new Examples row.

**Open questions:** None — Permission Matrix in story description explicitly lists `Power User (Bank Admin) = ✗`, so 404 for `bank_admin` is fully aligned with story requirements.
