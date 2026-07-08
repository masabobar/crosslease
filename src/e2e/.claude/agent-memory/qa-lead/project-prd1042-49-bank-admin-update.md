---
name: project-prd1042-49-bank-admin-update
description: Bank Admin role added to PRD1042-49 Tenant Scope Assignment test file 2026-07-08 — immutable tenant scope, no role transition, tenant-level user_type
metadata:
  type: project
---

Bank Admin role (`bank_admin`, user_type `bank_tenant`) added to `PRD1042-49 Tenant Scope Assignment.md` on 2026-07-08 following Ivan Mladenovic decision 2026-07-06 (surfaced via PRD1042-48). Underlying Jira story description was already updated 6 July 2026 to split the former "Power User / System Admin" into two distinct roles.

**Why:** Bank Admin fills the tenant-level admin gap so System Admin (platform-level) no longer needs to touch bank-tenant user management directly. This changes the tenant-scope assignment story because a new role must be validated in the AC-01 role Outline and two new constraints (immutability, no role transition) must be tested at AC-10.

**How to apply:**

- Any future update to PRD1042-49, PRD1042-48 (Role Assignment), PRD1042-59 (User Provisioning), or PRD1042-46 (RBAC scenarios) must respect the tenant-scoped roles matrix now in the PRD1042-49 file header
- Bank Admin wire value is `bank_admin`, user_type is `bank_tenant` — do not confuse with `system_admin` (platform)
- Tenant scope for `bank_admin` is IMMUTABLE after creation — differs from FO/BO/LC where scope changes are allowed with Four-Eyes for privileged targets
- Bank Admin cannot be reached via role transition — must be created directly with role `bank_admin` at user creation
- Bank Admin administers own tenant only, no cross-tenant scope

**Scenarios added (3 new, 1 modified in `PRD1042-49 Tenant Scope Assignment.md`):**

- AC-01 Scenario Outline: added `Bank Admin (Power User)` row → 4 roles total
- AC-01 new happy-path: Bank Admin bound to exactly one tenant — multi-tenant scope invalid (needs D19)
- AC-10 new main-error: Bank Admin tenant scope is immutable — change attempt returns error (needs D19)
- AC-10 new main-error: Bank Admin cannot be reached via role transition (needs D19)

Total active scenario blocks after update: 9 (2 Outlines + 7 Scenarios), E2E automation candidates: 2 of 9 ✅.

**Open questions surfaced during update:**

- OQ-BA-1: The story does not spell out whether the initial Bank Admin for a new tenant is created by System Admin (bootstrap) or via a tenant onboarding flow. Assumed bootstrap-by-System-Admin per user's authoritative context, but PRD1042-48 or a tenant lifecycle story may own the exact flow.
- OQ-BA-2: Comment 35326 (Philipp) states "privileged scope" changes need Four-Eyes and mandatory reason. Since Bank Admin scope is IMMUTABLE, Four-Eyes never fires for Bank Admin tenant change — but Four-Eyes may still apply to Bank Admin creation itself. Not covered in current PRD1042-49 file.
- OQ-BA-3: What happens if the tenant a Bank Admin is bound to is archived/decommissioned (PRD1042-590)? Cascading behavior for immutable-scope users is not defined in AC-10.

Links to related memories: [[project-prd1042-48]], [[project-prd1042-49]], [[project-prd1042-59]], [[project-prd1042-50]].
