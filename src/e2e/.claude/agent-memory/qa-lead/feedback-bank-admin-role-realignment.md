---
name: feedback-bank-admin-role-realignment
description: Bank Admin (`bank_admin`, User Type `bank_tenant`) replaces Power User (Bank Admin) at wire level; retrofit User Management stories per PRD1042-48
metadata:
  type: project
---

Per Ivan Mladenovic decision 2026-07-06 (formalized under PRD1042-48), Bank Admin is the tenant-scoped admin role that manages users within a single bank tenant. Wire value: `bank_admin`; User Type: `bank_tenant`. This role took over responsibilities previously described as "Power User (Bank Admin)" in older story text.

**Why:** Previous story text mixed "Power User" (a platform-privileged concept) with "Bank Admin" (a tenant-scoped concept). PRD1042-48 realignment separates the two: System Admin operates platform-wide, Bank Admin operates within its own bank tenant only. Existing spec files that still say "Power User (Bank Admin)" or use `power_user` in Examples tables are stale and must be retrofitted when touched.

**How to apply:**

- When updating a User Management spec (PRD1042-39 epic) that mentions Power User for tenant-scoped bank actions, replace with Bank Admin (`bank_admin`).
- Add a dated "Updated YYYY-MM-DD:" note directly under the file title clarifying the retrofit and citing PRD1042-48 + Ivan Mladenovic 2026-07-06.
- In Four-Eyes contexts, `bank_admin` is Highly Privileged (same tier as `system_admin`); Support/BO/Risk remain Privileged.
- Restore Access, Deactivation, Suspension, Reactivation flows: Bank Admin acts within its own bank tenant; System Admin platform-wide. Cross-tenant Bank Admin action is 404 (tenant isolation).
- Keep single-actor scenarios (e.g. Reason=Other validation) with `system_admin` only — the Outline that establishes both admin roles cover the actor equivalence; do not multiply single-actor variants.

Retrofitted so far: [[project-prd1042-62]] (US 28.18 User Restore Access, 2026-07-08).

Related: [[project-prd1042-48]] (US 28.11 Role Assignment — origin of the realignment).
