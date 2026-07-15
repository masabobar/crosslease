---
name: project-prd1042-598-bank-admin-update
description: 2026-07-08 update to PRD1042-598 Cross-Tenant Allow-List Governance — added bank_admin to AC-02/AC-03 cross-tenant write 404 Outline (6→7 role variants); Bank Admin is bound to one tenant and cannot perform cross-tenant ops
metadata:
  type: project
---

**Fact:** On 2026-07-08 updated `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-598 Cross-Tenant Allow-List Governance.md` to include `bank_admin` role in the AC-02/AC-03 Scenario Outline Examples table.

- Added "Updated 2026-07-08" header note referencing PRD1042-48 (Ivan Mladenovic decision 2026-07-06)
- AC-02/AC-03 Scenario Outline (cross-tenant write blocked) Examples table expanded from 6 to 7 role rows: added `Bank Admin` between `System Admin` and `Front Office`
- Comment block above AC-02/AC-03 Outline expanded to explain Bank Admin's tenant-binding constraint
- AC-09 Outline (invalid tenant contexts) unchanged — tests a single Front Office user against various tenant-context variants; does not enumerate roles

**Why:** Bank Admin (`bank_admin`, `bank_tenant` user type) is tenant-bound and cannot perform cross-tenant operations per PRD1042-48. The cross-tenant allow-list is platform-level governance; Bank Admin has no entry in the allow-list matrix (all cross-tenant ops = ✗). Adding Bank Admin to the 404 Outline makes this explicit and prevents test-writers from assuming absence = "not tested."

**How to apply:** When updating other cross-tenant / platform-governance test files (e.g., US 29.18 [[project-prd1042-599-story-processed]], US 29.16 [[project-prd1042-597-story-processed]] Support grant CUD), check if the RBAC 404 Outline enumerates roles; if it does, add `bank_admin` where cross-tenant write / allow-list management is being denied. See sibling updates: [[project-prd1042-49-bank-admin-update]], [[project-prd1042-583-bank-admin-update]], [[project-prd1042-584-bank-admin-update]], [[project-prd1042-586-bank-admin-update]].
