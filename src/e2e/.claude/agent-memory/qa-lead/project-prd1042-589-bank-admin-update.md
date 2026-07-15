---
name: project-prd1042-589-bank-admin-update
description: 2026-07-08 Bank Admin retrofit to US 29.8 Tenant Reactivation — bank_admin added to AC-11 404 role-gating Outline (unauthorized, platform-only reactivation)
metadata:
  type: project
---

2026-07-08 retrofit to `PRD1042-589 Tenant Reactivation.md`.

Added `bank_admin` role coverage per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).

**Why:** Bank Admin (`bank_admin`, user_type `bank_tenant`) has scope limited to bank tenant user management within its own tenant. Tenant reactivation is a PLATFORM-level operation restricted to System Admin only. Bank Admin must receive HTTP 404 (RefiNext 404-not-403 domain rule) when attempting to reactivate any tenant.

**How to apply:** For any lifecycle/governance/platform-level tenant operation (create, activate, suspend, reactivate, archive, decommission), Bank Admin belongs in the unauthorized-roles Examples table alongside Front Office / Back Office / Support / Auditor / LC User. Bank Admin is NOT in the authorized column of the Permission Matrix — verify with the story's Permission Matrix before assuming.

**Changes:**

1. Added update banner below H1 title citing PRD1042-48 (Ivan 2026-07-06)
2. Fixed Jira status in header from "QA in progress" → "UAT ready" (verified via mcp**jira**get_issue)
3. Added `bank_admin` explanatory paragraph to AC-11 role-gating comment block (platform-only rationale)
4. Added `Bank Admin` row to AC-11 Scenario Outline Examples (first row, before Front Office)

**No other scenarios affected:**

- Happy path unchanged (System Admin only — Bank Admin excluded by AC-11 gate)
- AC-06 justification validation unchanged (System Admin only)
- AC-07 invalid-state gate unchanged (action not visible to any non-System-Admin)
- AC-08 Four-Eyes unchanged (System Admin actor-independence)
- Blocked ACs unchanged (TM-05, D-Enforcement)

**Total scenarios:** still 6 blocks (2 Outlines + 4 Scenarios) — added one Example row, no new scenario blocks.

Related: [[project-bank-admin-role]], [[project-prd1042-48-bank-admin-update]], [[project-prd1042-589]]
