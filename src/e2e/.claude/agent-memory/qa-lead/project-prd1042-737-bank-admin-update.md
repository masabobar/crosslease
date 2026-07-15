---
name: project-prd1042-737-bank-admin-update
description: 2026-07-08 update to PRD1042-737 Tenant License Limit Management — added Bank Admin (bank_admin) to AC-11/16/18 404 write Outline (5→7 rows including own+cross tenant) and to AC-05 view Outline (2→3 roles, conditional on OQ-BA-01); no new scenario blocks; Jira permission matrix does not list Bank Admin as viewer, flagged as OQ-BA-01
metadata:
  type: project
---

Update to `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-737 Tenant License Limit Management.md` on 2026-07-08 for Bank Admin role per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).

**What changed:**

- Added header note explaining Bank Admin retrofit + OQ-BA-01 (Jira permission matrix silence).
- **AC-05 view Outline:** 2 roles → 3 roles. Added `Bank Admin | acme-bank` row with tenant scope column. Bank Admin can only view its OWN tenant.
- **AC-11/16/18 404 write Outline:** 5 rows → 7 rows. Added `tenant_scope` and `target_tenant` columns to make own-vs-cross-tenant surface explicit. Two Bank Admin rows exercise both surfaces (own-tenant modification attempt + cross-tenant modification attempt) — both collapse to 404 under AC-18 rule "must never modify license limits through any API path."
- Scenarios summary table updated: AC-05 row now says "3 roles"; AC-11/16/18 row now says "7 rows: 5 platform-role + 2 Bank Admin own/cross tenant."
- No new scenario blocks added — same 8 blocks, expanded Examples tables.

**Why:**

- License limits are platform-level commercial configuration (System Admin only per PRD1042-737 Permission Matrix).
- Bank Admin is a tenant-level role (`bank_tenant`) — matches Support-like read pattern for own tenant but NEVER write.
- 404-not-403 domain rule applies uniformly.

**How to apply:**

- If retrofitting other Tenant Management stories (PRD1042-582 through PRD1042-599, PRD1042-737): add Bank Admin to 404 role Outlines for platform-write endpoints; add Bank Admin (own-tenant-scoped) to read Outlines if the endpoint is read-permissible per PRD1042-48.

**Open question OQ-BA-01:** Jira PRD1042-737 Permission Matrix explicitly lists only System Admin (write+view), Support (view), Auditor (view) — Bank Admin is not listed as viewer. User-provided context 2026-07-08 says Bank Admin "may have view access to own tenant." Bank Admin row in AC-05 Outline is conditional; if PO confirms Bank Admin is NOT a viewer, drop that row and add Bank Admin to a 404-on-read scenario instead.

Related: [[project-prd1042-48-bank-admin-update]] source of role decision; sibling retrofits [[project-prd1042-582-bank-admin-update]], [[project-prd1042-583-bank-admin-update]], [[project-prd1042-584-bank-admin-update]], [[project-prd1042-586-bank-admin-update]], [[project-prd1042-49-bank-admin-update]].
