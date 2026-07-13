---
name: project-prd1042-787
description: US 26.10 Read-Only Investigation Surface for Authorized Roles, first story processed in Epic 26 (PRD1042-37), Stage 2 FAILED (Figma quota+auth), Stage 3 WARNINGS design-blind, 8 scenario blocks (3 happy + 5 main-error), grooming 2026-06-16 defers AC-03 pre-built views + AC-04 bookmarks + advanced filters, AC-07 Blocked on US 26.09
metadata:
  type: project
---

**Story:** PRD1042-787 — US 26.10 | AUDIT TRAIL | Read-Only Investigation Surface for Authorized Roles
**Epic:** PRD1042-37 — Epic 26: Audit Trail (first story processed in this epic)
**Processed:** 2026-07-10
**Jira status:** Ready for DEV Review
**DoR:** PASS (17 ACs synthesized from Functional/Validation/System/Security/NFR/Edge blocks)

**Why:** First E26 processing under quota-exhaustion conditions. Establishes Audit Trail folder + Investigation Surface scope contract.

**How to apply:**

- Folder path confirmed: `PRD1042-37-Audit Trail/` (already exists — reused, not created)
- Grooming 2026-06-16 (Philipp Maute comment 37243) locks MVP scope: basic-table filters only (entityType, entityId, actionType, actor, dateRange); advanced filters (triggerSourceCode, deltaType, retentionCategory) + saved investigations + bookmarks DEFERRED to backlog per "Filter convention"
- AC-03 Pre-built views (contract history, financing history, document actions, system default flags, override actions, Auditor sessions) DEFERRED
- AC-04 Investigation Bookmarks DEFERRED
- Vesna Plakalovic 2026-06-12 (comment 37050) confirmed filter drawer on right if pre-built views included — moot given deferral
- OQ-AT-09 full-text narrative search default V2 (assumption locked)

**Stage 2:** FAILED — Figma MCP quota exhausted (View seat, Professional plan) AND REST API auth unavailable in session (no shell to run curl with X-Figma-Token). Design-blind processing precedent: PRD1042-599 (backend security enforcement).

**Stage 3:** WARNINGS — comparison_status not BLOCKED because MVP scope explicitly clarified by grooming and story description carries full architectural/frontend/backend spec. Standard 404-not-403 tenant rule applied to AC-01/08/10. Design gaps logged as MAJOR (cannot verify absence-of-affordance UI without frame render).

**Scenario blocks:** 8 (3 happy-path + 5 main-error), 6 `@e2e-ready` + 2 blocked on D-IDs

- Happy: AC-01+AC-08 Outline (3 authorized roles), AC-02 Outline (5 basic filters), AC-05+AC-12 no-affordance
- Main-error: AC-01+AC-10 Outline (3 denied roles → 404), AC-08+AC-10 cross-tenant (needs D20), AC-05+AC-10+AC-14 mutation-verb Outline, AC-11+AC-15 expired session (needs D16), AC-12+AC-17 self-grant export rejection

**Blocked AC:** AC-07 — every query → Audit Log Access Record; requires US 26.09 (PRD1042-786 access-log read path)

**Excluded from Gherkin (scope filter table only):**

- AC-03, AC-04 — `separate-feature` (deferred per grooming)
- AC-06 — `separate-feature` (owned by US 26.05 masking)
- AC-09 — `separate-feature` (owned by US 26.13 archived queryability)
- AC-13 — `edge-case` (SLA NFR, load-test scope)
- AC-14, AC-15, AC-17 — merged into main-error scenarios (AC-10, AC-11, AC-12 respectively)
- AC-16 — `edge-case` (resultCount is US 26.09 internal audit field)

**Dependencies from Epic 26:**

- Blocking: US 26.09 (PRD1042-786) — access logging
- Non-blocking: US 26.05 (masking), US 26.12 (cross-tenant governance), US 26.13 (archived queryability)

**Governance context (Epic 26 grooming 2026-06-16 Philipp Maute):**

- 12 Audit Trail stories moved to Client Approved incl. US 26.10
- Filter convention (basic-table MVP, advanced/bookmarks/saved investigations → backlog) applied to US 26.10 + 26.15
- Permission Stack (Role × Module × Tenant) applied to US 26.10, 26.11, 26.12, 26.18
- Audit-pattern Functional Level applied to US 26.1–26.7

Related: [[project-refinext-overview]], PRD1042-786 (US 26.09 blocking dep)
