---
name: project-prd1042-583-bank-admin-update
description: 2026-07-08 update to PRD1042-583 Tenant Activation.md — added bank_admin to AC-17 RBAC Outline (cannot activate tenants, 404 pattern)
metadata:
  type: project
---

**Fact:** 2026-07-08 — Updated `/Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-583 Tenant Activation.md` to add Bank Admin role (`bank_admin`) to AC-17 RBAC Outline. Bank Admin cannot activate tenants (platform-only action reserved for System Admin) — returns 404 per RefiNext 404-not-403 pattern.

**Why:** Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06), the seven-role model formalizes `bank_admin` as a bank-tenant-scoped role (`user_type = bank_tenant`). Tenant creation/activation is a platform-level action; only System Admin can countersign under Four-Eyes. Bank Admin, like Front Office/Back Office/Support/Auditor/LC User, must receive a 404 (not 403) on any attempt to view or act on pending governance requests. Aligns with Philipp Maute's terminology alignment note (comment 38523, 2026-07-03) that flagged the "Bank Power User" row in the story's Permission Matrix for joint review.

**How to apply:**

- Update file header with dated "Updated 2026-07-08" note referencing PRD1042-48
- AC Scope Filter AC-17 row: append "(incl. Bank Admin)" and add rationale suffix explaining Bank Admin addition
- AC-17 Scenario Outline: add `| Bank Admin |` Examples row (now 6 roles: Front Office, Back Office, Support User, Auditor, LC User, Bank Admin)
- Extend the AC-17 pre-scenario comment block with the Bank Admin rationale (platform vs bank-tenant scope, PRD1042-48 attribution)
- Story block count unchanged: 6 scenario blocks (2 Outlines + 4 Scenarios); AC-17 Outline row count grew from 5 to 6

**Scope kept minimal:**

- No new scenario blocks added — Bank Admin fits cleanly into existing AC-17 Outline
- No happy-path change (Bank Admin cannot perform the primary action)
- No changes to Blocked ACs, Scenarios Summary line count, or Feature file structure beyond the Examples row
- E2E automation status of AC-17 Outline unchanged (`✅ @e2e-ready` — no new infra dependency)

Links: [[project-prd1042-583]] (original run), [[project-prd1042-48]] (US 28.11 Role Assignment source of Bank Admin definition), [[project-bank-admin-role]] (canonical role fact), [[project-prd1042-48-bank-admin-update]] (parallel PRD1042-48 file update), [[feedback-bank-admin-role-realignment]] (feedback log).
