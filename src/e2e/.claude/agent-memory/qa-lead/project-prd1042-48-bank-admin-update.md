---
name: project-prd1042-48-bank-admin-update
description: PRD1042-48 file updated 2026-07-08 to add Power User (Bank Admin) role after 2026-07-06 realignment split System Admin from bank user administration
metadata:
  type: project
---

PRD1042-48 test file UPDATED 2026-07-08 (Ivan Mladenovic decision 2026-07-06) to add Power User (Bank Admin) role. Story status now UAT ready.

**Role model shift (7 canonical roles):**

- Added: Power User (Bank Admin) — wire value `bank_admin`, tenant-level, `bank_tenant` user_type
- System Admin — reduced scope: platform-only, no bank user administration
- Auditor — realigned to tenant-scoped per Philipp 2026-05-26 (was platform in v1)

**Bank Admin invariants (drive all new scenarios):**

- ONLY role authorized to change tenant user roles (FO ↔ BO/Risk) — per Philipp/Ivan sync 2026-06-22
- Four-Eyes 2nd principal for those role changes (both principals must be Bank Admin)
- Bound to exactly ONE tenant at creation (immutable — cannot change tenant scope)
- NOT reachable via role reassignment (any-role → bank_admin blocked; bank_admin assigned at creation only)
- Cannot: cross-tenant access, platform administration, access LC data

**Scenarios added (4 new blocks, all @e2e-ready):**

1. System Admin cannot change bank tenant user roles (AC-05, AC-07) — moved to Bank Admin authority
2. Bank Admin cannot be reached via role reassignment (AC-07) — Outline × 6 from_roles
3. Bank Admin cannot change own tenant scope (AC-14) — tenant binding immutable
4. Non-Bank-Admin roles (FO/BO/Support/Auditor/LC) cannot assign/change user roles (AC-05, AC-16) — Outline × 5 actor_roles

**Scenarios modified:**

- Feature preamble + Background: actor is now "Power User (Bank Admin) with role bank_admin", bound to Tenant A
- AC-01/AC-03 happy Outline: 6 roles → 7 roles (added Power User (Bank Admin) + System Admin as separate entries)
- AC-07 happy Outline: retitled "Bank Admin changes tenant user role via allowed transition"
- AC-12 Four-Eyes: both principals must be Bank Admin, second within same tenant
- AC-16: session actor renamed "valid Bank Admin session"

**Scope filter table updates:**

- AC-03: 6 → 7 predefined roles
- AC-07: added note "Bank Admin is NOT reachable via reassignment; System Admin cannot change bank user roles"

**File header additions:**

- Line "**Updated 2026-07-08:** Added Bank Admin role..." below main header
- 7-role table with wire values, level, notes
- Permission matrix table showing Bank Admin exclusive authority for role administration

**Scenario counts:** 9 → 13 scenario blocks (2 Outlines + 11 Scenarios). E2E automation candidates: 12 of 13 (AC-14 tenant-isolation still needs D20).

Linked to [[project-prd1042-48]] (original processing 2026-06-12).
