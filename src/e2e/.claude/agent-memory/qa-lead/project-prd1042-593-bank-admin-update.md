---
name: project-prd1042-593-bank-admin-update
description: 2026-07-08 update to PRD1042-593 Tenant Access Policy Management.md — added bank_admin to AC-08 404 Outline (5→6 roles); Bank Admin cannot view or modify Access Policy (System-Admin-only per Permission Matrix); Outline extended to assert 404 on both GET and PUT; per Ivan Mladenovic 2026-07-06 via PRD1042-48
metadata:
  type: project
---

**File updated:** `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-593 Tenant Access Policy Management.md`
**Date:** 2026-07-08
**Trigger:** PRD1042-48 Bank Admin role decision (Ivan Mladenovic 2026-07-06)
**Bank Admin role:** `bank_admin` (wire value), `bank_tenant` (user type)

**Story Permission Matrix (verbatim from PRD1042-593):**

| Action                     | System Admin | Front Office | Back Office/Risk | LC User | Power User (Bank Admin) | Support | Auditor |
| -------------------------- | ------------ | ------------ | ---------------- | ------- | ----------------------- | ------- | ------- |
| View Access Policy tab     | ✓            | ✗            | ✗                | ✗       | ✗                       | ✗       | ✗       |
| Modify access policy flags | ✓            | ✗            | ✗                | ✗       | ✗                       | ✗       | ✗       |

**Bank Admin verdict:** NOT an authorized actor. Tenant Access Policy is a **platform-level, System-Admin-only configuration**. Bank Admin cannot view or modify — even for their own tenant. AC-08 already mandates 404-not-403 for all non-System-Admin roles.

**Changes applied:**

1. **Header updated line added** — "Updated 2026-07-08" note explaining Bank Admin is non-authorized per Permission Matrix; System Admin retains sole platform-level authority
2. **DoR status corrected** — Jira status was "QA ready" in file header but current status is "UAT ready" (updated 2026-07-08 13:26 via Jira)
3. **AC-08 Scenario Outline extended:**
   - Added `Bank Admin` row to Examples table (5 → 6 roles: Bank Admin, Front Office, Back Office, LC User, Support User, Auditor)
   - Extended body from GET-only to GET + PUT assertions — both operations must return 404 for all non-System-Admin roles (view + modify from Permission Matrix)
4. **AC-08 comment block extended** — added Bank Admin rationale referencing PRD1042-48, Permission Matrix (Power User = ✗ view + modify), and platform-level scope
5. **Scenarios summary row updated** — AC-08 row label now reads "Non-System Admin roles (incl. Bank Admin) receive 404 on GET+PUT Access Policy (AC-08)"

**Scope filter table unchanged** — no new classifications, no new ACs.
**Active scenario blocks unchanged** — 8 blocks (2 happy + 6 error); no new scenarios, only Outline example rows and body assertions extended.
**E2E status of AC-08 unchanged** — still `✅ @e2e-ready` (seeded users per role; UI/API assertion only; no fixture blockers).

**Contrast with sibling stories:**

- Unlike US 28.15 (PRD1042-59 User Provisioning), US 28.17 (PRD1042-61 Suspension), US 28.18 (PRD1042-62 Restore), US 29.4 (PRD1042-585 Tenant Detail) — Bank Admin has NO own-tenant authority here. Tenant Access Policy is not delegable to bank-tenant role.
- Pattern mirrors PRD1042-582 (Tenant Creation), PRD1042-583 (Tenant Activation), PRD1042-586 (Module Activation), PRD1042-587 (Module Deactivation), PRD1042-588 (Tenant Suspension) — all platform-only, Bank Admin added only to 404 Outlines.

**Related:** [[project-prd1042-593]] (original story processing), [[project-bank-admin-role]] (role decision), [[project-prd1042-48-bank-admin-update]] (source decision), [[project-prd1042-585-bank-admin-update]] (contrast — Bank Admin own-tenant view allowed on Detail but not on Access Policy)
