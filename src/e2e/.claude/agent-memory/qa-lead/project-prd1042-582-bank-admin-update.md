---
name: project-prd1042-582-bank-admin-update
description: 2026-07-08 update to PRD1042-582 Tenant Creation.md — added bank_admin to AC-11 RBAC 404 Outline (6 roles), no new scenarios (Bank Admin provisioning not in story scope)
metadata:
  type: project
---

**Fact:** On 2026-07-08 updated `PRD1042-582 Tenant Creation.md` for the new Bank Admin role (`bank_admin`, User Type `bank_tenant`).

**Why:** Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06), Bank Admin is a bank-tenant-scoped role with immutable tenant binding that CANNOT create/activate/suspend/reactivate/archive tenants. All tenant lifecycle actions are System Admin platform-only. AC-11 requires all non-System-Admin roles to receive HTTP 404 on tenant creation endpoint.

**How to apply:** For US 29.1 Tenant Creation (PRD1042-582):

- Bank Admin gets 404 on POST /api/tenants like any other non-System-Admin role
- Added to AC-11 Scenario Outline Examples (now 6 roles: bank_admin + front_office + back_office + support_user + auditor + leasing_company_user)
- Extended AC-11 comment block to reference PRD1042-48
- Updated AC-11 rationale in Scope Filter to note Bank Admin
- Story description "Permission Matrix" already listed "Power User (Bank Admin)" with ✗ for Create Tenant — Ivan's decision aligns Bank Admin wire value to `bank_admin`

**No new scenarios added:** Jira description mentions no "provisioning initial Bank Admin during tenant creation" workflow. Tenant creation only creates the Tenant record + Four-Eyes governance request; Bank Admin user provisioning is a separate concern (User Management epic PRD1042-39, US 28.15 User Provisioning per [[project-prd1042-59]]).

**Scenario counts unchanged:** Still 9 scenario blocks (1 Outline + 8 Scenarios). Outline row count updated 5 → 6 roles.

**Related:**

- [[project-prd1042-48-bank-admin-update]] — the source Role Assignment story change that mandates this retrofit
- [[feedback-bank-admin-role-realignment]] — retrofit pattern applied across affected tests
- [[project-prd1042-582]] — original story processing record (initial pipeline run)
