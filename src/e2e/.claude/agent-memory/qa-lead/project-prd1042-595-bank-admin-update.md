---
name: project-prd1042-595-bank-admin-update
description: 2026-07-08 update to PRD1042-595 US 29.14 Seed Package Assignment — added bank_admin to AC-14 404 Outline (5→6 roles); Bank Admin cannot assign seed packages (platform-only, Step 3 of tenant creation wizard, System Admin only)
metadata:
  type: project
---

**Fact:** 2026-07-08 retrofit of `PRD1042-595 Seed Package Assignment.md` for the Bank Admin role split (per PRD1042-48, Ivan Mladenovic 2026-07-06).

**Why:** Bank Admin (`bank_admin`, `bank_tenant` user_type) is a new tenant-level administrator role. The AC-14 RBAC 404 Outline previously covered 5 non-System-Admin roles (`front_office`, `back_office`, `support_user`, `auditor`, `leasing_company_user`). Bank Admin must also be denied — seed package assignment is a platform-only System Admin action performed only during Step 3 of the tenant creation wizard (TM-01).

**How to apply:**

- Header note added: `Updated 2026-07-08: Added Bank Admin role...`
- Jira status corrected from "QA in progress" → "UAT ready" (current status per fetch)
- AC-14 Scenario Outline: added `bank_admin` row at top of Examples table (6 roles total)
- Comment block above the Outline extended to explain why `bank_admin` is included (platform-only seed package binding, no cross-tenant visibility)
- Scenarios summary updated: "5 roles" → "6 roles including `bank_admin`"
- Active scenario blocks unchanged (5); scenario count unchanged (5)

**Sibling stories updated in same 2026-07-08 sweep:**

- [[project-prd1042-48-bank-admin-update]] — US 28.11 Role Assignment
- [[project-prd1042-49-bank-admin-update]] — US 28.14 Tenant Scope
- [[project-prd1042-584-bank-admin-update]] — US 29.3 Tenant List View
- [[feedback-bank-admin-role-realignment]] — US 28.18 Restore Access

**Open questions:** None. Bank Admin's exclusion from seed package assignment is unambiguous per PRD1042-48 (Bank Admin can only manage bank tenant users within own tenant; platform-level actions like seed package binding remain System Admin exclusive).
