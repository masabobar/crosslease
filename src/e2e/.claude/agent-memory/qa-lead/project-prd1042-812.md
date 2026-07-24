---
name: project-prd1042-812
description: Epic 11 Framework Agreement — PRD1042-812 US 11.13 LC Portal Summary View processed 2026-07-24; DoR PASS 21 ACs; Stage 2 FAILED (Figma MCP quota + no shell + no rendered PNG for node 109:8688); Stage 3 WARNINGS design-blind spec-anchored; 9 scenario blocks (5 happy + 4 error); 1 Blocked (D-LimitMgmt-Degraded AC-11); 8 excluded (2 edge-case, 4 separate-feature/NFR, plus AC-04 merged into AC-03/AC-07)
metadata:
  type: project
---

Processed 2026-07-24. First LC Portal story for Epic 11 — sibling to Bank-side FA stories 799 (Draft creation), 800 (Activation), 801 (List/Search), 803 (Detail), 807 (Document attachment), 809 (Edit).

**Story:** PRD1042-812 — US 11.13 | Framework Agreement — LC Portal Summary View
**Epic:** PRD1042-22 Epic 11 Framework Agreement
**Jira status:** Dev in progress (as of 2026-07-24)
**Children:** BE PRD1042-1369, FE PRD1042-1370, QA PRD1042-1371

**Why:** Continuation of the Framework Agreement Epic 11 batch. This is the LC Portal counterpart to the bank-side FA views (799/800/801/803/807/809). Distinct dependencies (`LC Portal Enabled` tenant flag from Epic 29 + LC session JWT from Epic 28 + Limit Management for Available Volume + Document Management for permitted-doc download).

**How to apply:** When re-running or extending LC Portal FA tests, note:

- LC Portal page in Figma is `100:10990` (fifth page of file `aQGn5OLEjEGJO7xGzFikP5`); this story's frame is `109:8688` within it
- No PNG rendering existed in `src/e2e/fixtures/figma-e11/rendered-nodes/` for LC Portal frames at generation time — recommend future PNG export
- LC-portal API endpoints are separate from bank-side: `GET /api/lc-portal/framework-agreements(/{id})(/documents/{docId}/download)`
- Uniform 404 (not 403) applies not just to cross-LC but also to bank-side roles (Power User, FO, BO, Support, Auditor) attempting LC Portal endpoints — the endpoint itself is invisible to bank roles by design
- `Valid Until = null` → design copy `Open ended` (spec-anchored, unverified against design)
- `Available Volume` fallback = `—` (em dash) but Blocked on D-LimitMgmt-Degraded
- Hidden bank-internal fields (must be tested via DOM absence + JSON key absence): Bank Entity, Effective Rate, Base Rate, Spread, LG-Specific Coverage Rate Override, Special Conditions, Created by, Activated by, Audit history, Linked Financings

**Files generated:**

- `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-812 Framework Agreement LC Portal Summary View.md` — 21 ACs, 9 scenario blocks (5 happy + 4 error), 1 Blocked (AC-11 D-LimitMgmt-Degraded), 8 excluded (AC-02/08/10/18 merged into AC-09 cross-LC scenario; AC-04 rolled into AC-03 and AC-07 renders; AC-12 edge-case TTL boundary; AC-13/14/21 separate-feature Epic 26 / Epic 28; AC-15 NFR; AC-20 edge-case race)

**Scenario blocks (all Scenarios, no Outlines needed — single-role happy-paths + LC-only main-errors):**

1. `@happy-path` AC-01 — LC user sees Framework Agreements nav entry (tenant flag ON) ✅
2. `@happy-path` AC-03/AC-04 — FA list shows Active + Suspended cards ✅
3. `@happy-path` AC-04/AC-07 — FA detail LC-visible field set + hidden-fields DOM absence ✅
4. `@happy-path` AC-05 — LC downloads permitted Framework Document ✅
5. `@happy-path` AC-17 — Empty state "No Framework Agreements are currently active for your company." ✅
6. `@main-error` AC-06 — No edit/lifecycle/override controls anywhere on LC surface ✅
7. `@main-error` AC-02/08/09/10/18 — Cross-LC 404-not-403 (⚙️ needs D20)
8. `@main-error` AC-01/16 — Tenant flag OFF → nav hidden + API 404 fail-closed (⚙️ needs D-TenantFlag-Toggle)
9. `@main-error` AC-19 — Bank-internal addendum download returns 404 (⚙️ needs D-DocMgmt-InternalDoc)

**E2E-ready: 6 of 9 scenarios ✅**

**New dependency IDs introduced:**

- `D-TenantFlag-Toggle` — Test harness to toggle a tenant's `LC Portal Enabled` flag on/off between test runs
- `D-DocMgmt-InternalDoc` — Test harness to attach a bank-internal (non-LC-permitted) document to an FA for tenant-scope testing

**Reused dependency IDs:**

- `D20` — Second seeded LC (Beta Leasing GmbH) for cross-LC 404 testing (same D20 as bank-side stories)
- `D-LimitMgmt-Degraded` — Same as PRD1042-803 AC-13 (Limit Mgmt degraded-mode simulator)

**Design-blind extraction note:** Same failure mode as [[project-prd1042-803-807-809-framework-agreement]] — Figma MCP quota exhausted, WebFetch cannot pass X-Figma-Token, no shell for REST curl. LC Portal frames have not been PNG-exported to `rendered-nodes/` yet. Recommend PNG export of page 100:10990 for follow-up test refinement.

**Related sibling stories:** [[project-prd1042-22-framework-agreement]] (bank-side 799/800/801/807), [[project-prd1042-803-807-809-framework-agreement]] (bank-side 803/807/809). This story completes the initial LC-portal-side leg.
