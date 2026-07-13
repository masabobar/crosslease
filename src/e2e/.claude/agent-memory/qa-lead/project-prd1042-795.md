---
name: project-prd1042-795
description: US 26.18 Security Event Audit Coverage — 10 derived ACs, DoR PASS, no Figma (backend security-event emission), Stage 2 FAILED (MCP quota + no shell), Stage 3 WARNINGS design-blind, 7 scenario blocks (2 happy Outline + 5 main-error), 2 Blocked (D-AuditFaultInject AC-08, D-AuditQuery AC-09), all @pending on US 26.10 audit-view API + AC-03 needs D20
metadata:
  type: project
---

**Story:** PRD1042-795 — US 26.18 | Audit Trail | Security Event Audit Coverage
**Epic:** PRD1042-37 — Epic 26: Audit Trail
**Processed:** 2026-07-10
**File written:** `src/e2e/tests/PRD1042-37-Audit Trail/PRD1042-795 Security Event Audit Coverage.md`

**Why:** Backend security-event emission story — server-side audit capture per Epic 26 §2 "enforced at database level, not merely as UI-visible history". Six named event types (ROLE_ASSIGNED, ROLE_REVOKED, CROSS_TENANT_BLOCKED, FORBIDDEN_TRANSITION, KYC_DETAIL_ACCESS, EXPORT_EXECUTED, MISATTRIBUTION_REJECTED) all Regulatory Critical per §6.7.

**How to apply:**

- Stage 2 Figma expected to fail — investigation surface UI belongs to US 26.10, not this story
- Bank Admin retrofit: included in AC-07 unauthorized-view Outline (5 roles: FO, BO, LC User, Bank Admin, Support) — Bank Admin cannot view platform-wide security audit events per Permission Matrix
- INSERT-only DB permission (Epic 26 §2 + Philipp comment 34102 2026-05-08): explicit AC-06 assertion (DELETE denies at DB layer for MISATTRIBUTION_REJECTED)
- Four-Eyes: AC-01 captures BOTH principal_id (acting) AND authorizing_actor_id (second approver)
- Cross-tenant AC-03: event lands in REQUESTING tenant not target — RFC-standard tenant-isolation pattern; 404-not-403 for enumeration prevention
- OQ-AT-07 (Product/UX V1 freeze): No proactive notification to FO/BO for governance-sensitive flags — no UI assertion attempted
- Uses hyphen folder convention `PRD1042-37-Audit Trail/` per feedback-epic-folder-naming.md

**Blocking dependencies for future re-classification:**

- D-AuditQuery — Auditor-scoped audit-view API (from US 26.10) — all 7 scenarios currently @pending
- D-AuditFaultInject — transaction-level audit-emission fault-injection harness (AC-08 fail-closed NFR)
- D20 — second seeded Bank Tenant B (AC-03 cross-tenant scenario, per e2e-test-configuration.md)

Sibling story pair: [[project-prd1042-792]] (US 26.19 Auditor Session Access Logging) — 795 emits security events, 792 audits the reads of those events. Both belong to Epic 26 governance completeness.
