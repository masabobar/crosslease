---
name: project-prd1042-584-bank-admin-update
description: 2026-07-08 update to PRD1042-584 Tenant List View — added bank_admin + Auditor to AC-16 404 Outline (5 roles total), no cross-tenant visibility for Bank Admin
metadata:
  type: project
---

2026-07-08 update to `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-584 Tenant List View.md`: added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).

**Why:** Jira ticket PRD1042-584 Permission Matrix explicitly lists Power User (Bank Admin) with ✗ on View tenant list / Filter/search / Navigate to detail. Bank Admin is a tenant-level role — the platform tenant list would only expose one tenant (its own) making it useless; full list is System Admin platform-only + Support with grant-scoped visibility. Bank Admin gets HTTP 404 per RefiNext 404-not-403 domain rule.

**How to apply:** When updating stories in Epic 29 (Tenant Management) for Bank Admin role — Bank Admin has NO cross-tenant visibility. On any platform-wide tenant list endpoint, Bank Admin receives 404. Bank Admin might see own tenant in scoped contexts (tenant detail view for own tenant) but never the full list.

Changes made:

1. Added Update note below header line (2026-07-08 Bank Admin realignment reference)
2. AC-16 Scope Filter description: "FO, BO, LC User" → "FO, BO, LC User, Bank Admin, Auditor"
3. Scenarios summary: "Scenario Outline — 3 roles" → "Scenario Outline — 5 roles"
4. AC-16 Feature comment block: expanded rationale to cite PRD1042-48 (Ivan 2026-07-06) and note tenant-level scoping rule
5. AC-16 Examples table: added `Bank Admin` and `Auditor` rows (was 3 roles, now 5)

Also noticed during review: original AC-16 Outline was missing Auditor per permission matrix. Added Auditor alongside Bank Admin — both are explicit ✗ in the Jira permission table for View tenant list. Only System Admin and Support User (with grants) are authorized viewers.

Related: [[project-prd1042-584]] (original processing memory), [[project-prd1042-48]] (Bank Admin role source), [[project-prd1042-48-bank-admin-update.md]] (Bank Admin realignment source).
