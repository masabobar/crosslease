---
name: project-prd1042-808-framework-agreement-utilization
description: PRD1042-808 US 11.9 Live Utilization Tracking & Limit Flags Surfacing (Epic 11) processed 2026-07-24 — DoR PASS 17 derived ACs, Stage 2 FAILED (MCP quota exhausted + no cached PNG for Utilization tab / list-view mini-gauge), Stage 3 WARNINGS spec-anchored, 10 scenario blocks (6 happy + 4 error), 0 Blocked, 7 Excluded/bundled, 0 of 10 E2E-ready (all need fixtures or D-EventBus-Inspection / D-LimitMgmt-Degraded / D20)
metadata:
  type: project
---

Processed 2026-07-24 as a single-story pipeline run inside the Epic 11 batch, sharing the same Figma file `aQGn5OLEjEGJO7xGzFikP5`. Target surfaces: **FA detail — Utilization tab (US 11.04)** and **FA list view (US 11.03) columns**; no specific node ID enumerated in prior batch memory for the Utilization tab.

**Stage 1 — Jira extraction:** DoR PASS. US 11.9 Live Utilization Tracking & Limit Flags Surfacing. 17 derived ACs from Functional Requirements (5) + Field Specification (9-field payload) + Validation Rules (2) + System Behavior (4) + Security Requirements (2) + Non-Functional (1) + Edge Cases (4) + Audit (2). Epic PRD1042-22. Status: Dev in progress. Children: PRD1042-1360 (BE), PRD1042-1361 (FE QA-ready), PRD1042-1362 (QA).

**Stage 2 — Figma extraction:** FAILED. MCP `get_metadata` returned "You've reached the Figma MCP tool call limit for your View seat on the Professional plan" (same quota state confirmed since [[project-prd1042-803-807-809-framework-agreement]] + [[project-prd1042-804-framework-agreement-suspension]] + [[project-prd1042-805-framework-agreement-reactivation]] + [[project-prd1042-806-framework-agreement-termination]] + [[project-prd1042-812]] batch). REST `/v1/files` also quota-exhausted (multi-day Retry-After) on this token per [[feedback-figma-nodes-fallback]] confirmations from prior sessions. WebFetch cannot pass `X-Figma-Token`. No shell available for `curl`. No PNG fixture in `rendered-nodes/` for a Utilization tab or list-view mini-gauge. Proceeded design-blind, spec-anchored per user directive.

**Stage 3 — Comparison:** WARNINGS. No CRITICAL contradictions — spec internally consistent. Design gaps logged:

- Utilization tab bar-gauge copy + color zones (spec anchor: "renders bar gauge with color zones")
- Limit Breach red badge tooltip verbatim copy (spec anchor: "red badge with tooltip explaining cause")
- List-view mini-gauge column header + inline layout
- 503 degraded-state UI copy — "—" placeholder + retry affordance timing after cache TTL
- LC-truncated DTO visual pattern (kept behavioural: DOM absence + JSON-key absence, mirroring 812)

Domain rules:

- Role-based access — 5 non-view roles get 404 (uniform 404-not-403) + LC truncated DTO + Front Office restricted to Active FA only per matrix
- Four-Eyes — N/A (read-only surfacing story, no state mutation from this endpoint)
- Async op — 120s server cache + staleness timestamp on 503 → staleness indicator required, no ✅
- Tenant isolation — cross-tenant reads blocked, cross-LC → 404 via tenant isolation

**Stage 4 — Test generation:** File written to `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-808 Live Utilization Tracking & Limit Flags Surfacing.md`. 10 scenario blocks (2 Outlines + 8 Scenarios). 6 happy + 4 main-error. 0 Blocked. 0 of 10 @e2e-ready — every scenario needs seeded FA / disbursement / redemption / max-volume-change / breach fixtures OR `D-EventBus-Inspection` (for consumed-event injection into cache-bust flows) OR `D-LimitMgmt-Degraded` (for 503 stale-state simulation) OR `D20` (second tenant for cross-LC).

**Key domain patterns captured:**

- **Read-only surfacing story** — no Four-Eyes, no governed modal, no wizard, no MFA freshness gate (contrast with 804/805/806/809)
- **9-field payload contract** asserted field-by-field in AC-01 happy path
- **Formula chain:** Net Exposure = Disbursed − Redeemed; Available = Max − Net Exposure; Utilization % = Net Exposure / Max × 100 — verified in AC-01, AC-05 (max-volume change), AC-07 (clamp), AC-12 (resolve)
- **Cache-bust triggers (3):** `disbursement.confirmed`, `redemption.reconciled`, `fa.max-volume.changed` — each covered in a distinct scenario (AC-05 covers 2 of 3, AC-04 covers disbursement pushing to breach, AC-12 covers redemption clearing breach)
- **Breach/resolve event pair:** `fa.limit.breached` on breach + `fa.limit.breach.resolved` on redemption bringing NE back under Max (AC-04 + AC-12)
- **Negative-NE clamp:** post-redemption surplus clamped to 0 with `UTILIZATION_NEGATIVE_NET_EXPOSURE_CLAMPED` audit alert (AC-07) — new spec-derived alert type
- **Limit Available Flag derivation:** true iff Available > 0 AND lifecycle Active — covered by Outline over Normal / AtLimit / Suspended / Terminated (AC-03)
- **Front Office restriction:** allowed only on Active FA per Permission Matrix; Suspended / Terminated → 404 for FO (new pattern not seen in 803/804/805/806/807/809/812 — those were governed-write stories without a role-conditional read surface)
- **LC hidden-field pattern:** LC receives only 3 of 9 fields (maxVolumeEUR, availableVolume, limitAvailableFlag); the other 6 fields (disbursedVolume, redeemedVolume, netExposure, utilizationPercent, limitBreachFlag, lastRefreshedAt) MUST be absent as JSON keys, not merely null — mirrors [[project-prd1042-812]] hidden-bank-internal-fields DOM+JSON-key absence pattern
- **Support role dual-condition scope:** "grant-scoped, summary" — full 9-field DTO but only within active support grant window (compatibility with [[project-prd1042-585]] and [[project-prd1042-597]] Support Access Grant governance)
- **Batch endpoint separate assertion:** `POST /utilization:batch` payload keyed by faId — AC-17 has its own scenario, list-view N+1-avoidance contract
- **RBAC 404-not-403 uniform** with 803/804/805/806/807/809/812 batch

**New dependency IDs introduced:**

- `D-LimitMgmt-Degraded` — Limit Management downstream failure simulator (for AC-10 503 stale-state; new — first Epic 11 story requiring downstream-service unavailability simulation). NOTE: `D-LimitMgmt-Degraded` was previously mentioned in [[project-prd1042-803-807-809-framework-agreement]] batch as a candidate D-ID; this story is where it becomes concretely required for a happy Gherkin scenario.

**Reused dependency IDs:**

- `D-EventBus-Inspection` — for injecting `disbursement.confirmed`, `redemption.reconciled`, `fa.max-volume.changed` events and asserting `FA_LIMIT_BREACHED` / `FA_LIMIT_BREACH_RESOLVED` audit-event emission (reused from [[project-prd1042-805-framework-agreement-reactivation]] and [[project-prd1042-812]])
- `D20` — Second seeded Bank Tenant (for LC cross-LC 404 assertion in AC-13/AC-14 Outline)

**Comparison to sibling stories:**

- [[project-prd1042-804-framework-agreement-suspension]] and [[project-prd1042-806-framework-agreement-termination]] — both are governed-write stories; 808 is the read-side counterpart consumed by the governed modals (Suspension / Termination modals must GET utilization for the Active-Financings display, though 806's spec labels that display as "count of active Financings" not utilization payload — different endpoint)
- [[project-prd1042-812]] — LC Portal Summary View — 812 is the LC portal read; 808 is the bank + LC read. The hidden-bank-internal-fields DOM+JSON-key absence pattern is inherited from 812
- [[project-prd1042-806-framework-agreement-termination]] AC-09 — "Termination while Limit Breach Flag is set is permitted; flag becomes historical evidence" — 808 supplies the surfacing contract that the 806 termination flow uses to display the Limit Breach Flag as historical evidence
- Limit Management (Epic 19) ownership boundary is explicit in the story description ("consumer of utilization figures and limit flags; underlying computation lives in Limit Management") — this is the first Epic 11 story where the Limit Management ownership boundary is codified as a first-class AC (AC-02)
- No prior Epic 11 story uses `fa.max-volume.changed` as a consumed event — this is US 11.10's governed-write event; 808 is the read-side consumer

Epic folder: `PRD1042-22-Framework Agreement`.

## CR Amendments — PRD1042-1495

**Effective date:** 2026-07-20 (PO Sync, Philipp Maute + Laurence Ahrabian). **FE merge:** 2026-07-23 (Nevena Milivojevic).

**Deltas applied:**

- AC-17 `modified-by-CR` — batch utilization read scenario reworked as **API-only** (was: batch payload plus list-view UI badge assertions on `FA-Utilization-Breach` and `FA-Utilization-AtLimit`). Per CR A1/A3, the FA list view no longer surfaces mini-gauge or Limit Breach / Limit Available flag badges. Backend endpoint `POST /utilization:batch` remains active and unchanged; the removed UI assertions are documented in the scenario NOTE for potential re-enablement post-MVP.
- Design specification section `modified-by-CR` — list-view surface (US 11.03 mini-gauge + flag badges) now flagged HIDDEN per CR A1/A3; detail-view Utilization tab surfacing (US 11.04) RETAINED.

**No `[CR-REMOVED — coordinate spec deletion]`** items. AC-17 scenario is retained, not removed — only its UI-assertion scope is narrowed.

**New / reused D-\* dependencies:** none. D-LimitMgmt-Degraded, D-EventBus-Inspection, D20 unaffected.

**Note:** BE work per CR is UI-only hiding — backend endpoint contract stays intact. FE team may optionally pause list-view surfacing work per PO note (US 11.9 Dev-in-progress).

See also [[project-cr-prd1042-1495-framework-agreement-cr]].

## CR Amendments — PRD1042-22 Reconciliation v10

**Effective:** 2026-07-22 (Scope Reconciliation v2). **QA merge:** 2026-07-27.

**Deltas applied:**

- **Header** — CR v10 acknowledgement note added; [CR-PENDING B4] on entire utilization surface.
- **Entire suite** `Blocked-by-CR-pending` — v10 §6 US 11.9 proposes REAL FINANCINGS (not Limit Management) as source of truth for used-against-approved figure. Current 808 scenarios source everything from Limit Management (spec-anchored). Marked as B4-provisional. AC-01 tagged `@cr-pending-b4`; other scenarios inherit note.
- **CRITICAL non-gating invariant CONFIRMED** — v10 §6 US 11.9: "No operation is blocked, refused, or gated on the strength of the utilisation figure." AC-11 (Validation & Gating Engine blocking on Limit Breach) already classified `separate-feature` — belongs to Validation Engine suite, not this surfacing story. Header display remains informational only.
- **State model** — 4 stored values (Draft/Active/Suspended/Terminated) reinforced. AC-03 Outline (Suspended / Terminated → limitAvailableFlag = false) remains correct.

**No `[CR-REMOVED — coordinate spec deletion]`** items.

**No new dependencies.**

See also [[project-cr-prd1042-22-reconciliation-v10]].
