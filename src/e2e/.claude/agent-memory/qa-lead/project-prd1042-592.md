---
name: project-prd1042-592
description: PRD1042-592 US 29.11 Tenant Integration Binding Management — no Figma (backend/integration story), 13 derived ACs, 7 scenario blocks, AC-03 Blocked on TM-09, tenant-isolation 404-not-403 confirmed
metadata:
  type: project
---

# PRD1042-592 — US 29.11 Tenant Integration Binding Management

**Epic:** PRD1042-40 (Epic 29 Tenant Management)
**Status:** QA ready · DoR PASS · 13 derived ACs
**Sub-stories:** PRD1042-680 (BE, Done), PRD1042-681 (FE, Done), PRD1042-682 (QA in progress)
**Processed:** 2026-07-07

## Pipeline Result

- **Stage 1:** PASS — story description present with permission matrix, field spec (Endpoint URL, Integration Active Flag, Credential Scope Identifier, Governance Justification min 20 chars, audit fields), validation rules (HTTPS, one-per-tenant → 409, Active-only writes, Archived read-only → 422), audit events (INTEGRATION_BINDING_CREATED / MODIFIED / DECOMMISSIONED), edge cases, security requirements. 13 ACs derived from FR + validation + permission matrix + security blocks.
- **Stage 2:** FAILED — no Figma URL in story description or child subtasks; backend/integration story pattern (matches [[project-prd1042-46]], [[project-prd1042-47]], [[project-prd1042-69]] backend security stories). No UI/UX subtask exists (children are BE/FE/QA only).
- **Stage 3:** WARNINGS — design-blind but no CRITICAL blockers. RefiNext domain rules applied: 404-not-403 for cross-tenant + non-Support write roles, 403 for Support write attempt, tenant-scoped credential storage, Support-view masking.
- **Stage 4:** 7 scenario blocks (2 happy-path Outlines/Scenarios, 5 main-error Outlines/Scenarios)

## Coverage Breakdown

- **Gherkin generated (6 ACs):** AC-04 (409 second binding), AC-05 (Active-only write), AC-06 (Archived read-only 422), AC-09 (RBAC create/modify), AC-10 (view + Support masking), AC-11 (cross-tenant 404-not-403)
- **Blocked (1 AC, no Gherkin):** AC-03 (Archived decommission + credential invalidation + inbound reject — TM-09 side effect + D-Integration observability)
- **Excluded (6 ACs):**
  - AC-01 merged into AC-04 (same one-per-tenant rule expressed via 409)
  - AC-02 separate-feature (Suspended inbound/outbound routing — Integration/Disbursement epic)
  - AC-07 edge-case (HTTPS URL format validation)
  - AC-08 edge-case (min-20-char justification — standard field validation)
  - AC-12 separate-feature (audit event delivery — Audit epic)
  - AC-13 separate-feature (Archived inbound reject + operational alert — Integration + observability)

## Domain Rules Applied

- **404-not-403** — AC-11 cross-tenant scenario; AC-09 RBAC for FO/BO/LC/Auditor (no view grant) → 404; Support (has view grant, lacks write) → 403
- **Tenant isolation** — Credential Scope Identifier stored tenant-scoped; cross-tenant admin cannot enumerate via 403 leakage
- **Response shaping (view masking)** — Support view masks Endpoint URL + Credential Scope; System Admin view unmasked
- **State-guarded writes** — Active only; Draft/Suspended/Archived all reject binding creation
- **Immutability on terminal state** — Archived bindings 422 on modify (consistent with [[project-prd1042-590]] Archived read-only pattern)
- **Single System Admin action** — No Four-Eyes required for binding management per spec (contrast with lifecycle stories 588/589/590 that require dual-approve)

## Key Notes

- **AC-09 dual-status pattern** — 404 for FO/BO/LC/Auditor (no view grant); 403 for Support User (has view grant but lacks write). Documented in Outline Examples table.
- **AC-03 blocked** — Archiving-triggered decommission requires TM-09 flow + credential-invalidation observability; not directly testable at binding-endpoint level. Assumes TM-09 (PRD1042-590 Archiving) is complete first.
- **[POST-NOVEMBER] deferred** — Per-tenant encryption key management deferred per story; governance expectations tracked in Epic §10; does not affect V1 test scope.
- **Second binding rule (AC-01 + AC-04)** — Merged into single 409 scenario; AC-01 is the rule statement, AC-04 is the HTTP contract for enforcement.

## E2E Automation

- **@e2e-ready (1 scenario):** AC-09 RBAC Outline (no additional fixtures beyond seeded role users)
- **⚙️ Needs infra (6 scenarios):** All lifecycle-state scenarios need tenant fixtures in Draft/Suspended/Archived states; happy-path needs binding-creation fixture harness; cross-tenant needs [[D20]] Tenant B seeded fixture

## Output

`/Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-592 Tenant Integration Binding Management.md`
