---
name: project-bank-admin-role
description: Bank Admin (`bank_admin`) role introduced per PRD1042-48 (Ivan Mladenovic 2026-07-06) — only role that can edit bank tenant user attributes; assigned at creation only; not reachable via role reassignment
metadata:
  type: project
---

Bank Admin role (`bank_admin`) is the new authoritative role for editing bank tenant user attributes, replacing System Admin in that responsibility.

**Why:** PRD1042-48 update by Ivan Mladenovic on 2026-07-06 clarified the role model:

- System Admin is platform-level and no longer edits bank tenant user attributes
- Bank Admin (`bank_admin`, `user_type=bank_tenant`) is the tenant-scoped administrator
- Bank Admin is assigned at user creation only — it cannot be reached via role reassignment (the role dropdown in edit dialogs must NOT include `bank_admin` as a target option)
- Cross-tenant edit by a Bank Admin returns 404 (tenant isolation, architecture constraint #5)

**How to apply:**

- Any user-management story (edit, list, detail, role assignment, provisioning) that previously named System Admin as the editor should be re-examined and updated to Bank Admin for bank tenant user operations
- Role reassignment scenarios must include a negative case: assigning `bank_admin` or `system_admin` via edit endpoint returns 403 + no state change + audit entry
- Non-admin cross-edit Outlines should include System Admin as a rejected role (System Admin can no longer edit bank users)
- When updating existing test files, add an "**Updated YYYY-MM-DD:**" note below the header rather than rewriting history — preserves traceability

**Related stories touched by this change:**

- PRD1042-346 (US 28.29 Edit or Update User) — updated 2026-07-08
- PRD1042-48 (US 28.11 Role Assignment & Management) — source ticket
- Likely impact: PRD1042-71 (US 28.4 User List), PRD1042-73 (US 28.6 User Detail), PRD1042-59 (US 28.15 User Provisioning), PRD1042-61/62/63 (US 28.17/18/19 lifecycle)

Links: [[project-prd1042-48]] [[project-prd1042-346]]
