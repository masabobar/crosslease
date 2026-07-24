---
name: project-prd1042-805-framework-agreement-reactivation
description: PRD1042-805 US 11.6 Framework Agreement Reactivation (Epic 11) processed 2026-07-24 — DoR PASS 17 derived ACs, Stage 2 DESIGN-BLIND (MCP quota + no cached PNG for node 29:3780 REACTIVATE section), Stage 3 WARNINGS spec-anchored, 10 scenario blocks (2 happy + 8 error), 3 Blocked, 9 of 10 E2E-ready
metadata:
  type: project
---

Processed 2026-07-24 as a single-story pipeline run against shared Epic 11 Figma file (`aQGn5OLEjEGJO7xGzFikP5`, target node `29:3780` — REACTIVATE section on the "Suspension, Reactivation, Termination" canvas).

**Stage 1 — Jira extraction:** DoR PASS. Story is US 11.6 Framework Agreement Reactivation. Title + rich description with Permission Matrix, 6 Functional Requirements, 2-field modal spec (Justification + Re-Validation checkbox), 3-rule Validation set, 3 Edge Cases, 3 Dependencies. 17 derived ACs. FE subtask PRD1042-1352 QA-ready.

**Stage 2 — Figma extraction:** FAILED. MCP `get_metadata` and `get_screenshot` both returned Professional-plan seat quota-exhausted 429. Cached fixture bank searched for `frame-29-3780*.png` / `page-29-3780*.png` — no PNG discoverable for the REACTIVATE section on page `29:3780` (Suspension, Reactivation, Termination). Proceeded design-blind, spec-anchored per user directive.

**Stage 3 — Comparison:** WARNINGS. No CRITICAL contradictions. 3 MAJOR design gaps logged:

- Verbatim modal copy (Justification textarea label, primary-button copy) design-blind
- Re-Validation checkbox label design-blind ("I have re-validated LC status, Valid Until and Product Template" plausible)
- CR B5 UI-hidden gate — Reactivate entry-point button was hidden by CR PRD1042-1495 B5; code retained but not user-reachable → new dependency `D-CR-B5-Rollback`
- 1 MINOR: Notification Center emit has no design surface
- 2 ambiguities resolved with documented assumptions (CR B5 hides UI but POST still active; MFA freshness inherits US 11.8/11.10 window)

**Stage 4 — Test generation:** File written to `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-805 Framework Agreement Reactivation.md`. 10 scenario blocks: 2 happy-path + 8 main-error. 9 of 10 E2E-ready (1 needs D20 seeded second tenant). 3 ACs Blocked (D-CR-B5-Rollback / D-MFA-StepUp / D-EventBus-Inspection). AC-05/06/07 consolidated into AC-15/16/17 error scenarios.

**Scenario breakdown:**

- Happy: AC-04+AC-08 (reactivate → Suspended→Active + audit), AC-09 (Financing assembly resumes)
- Errors: AC-02 (short justification 400), AC-03 (reValidationConfirmed=false 400), AC-11 (5-role 404 Outline), AC-13 (3-state lifecycle 409 Outline), AC-14 (cross-tenant 404), AC-15 (LC Suspended 422), AC-16 (Valid Until expired 422), AC-17 (deprecated template 422)

**Key domain patterns captured:**

- **Single Power User (Bank Admin) reactivation** for November 2026 — Four-Eyes explicitly deferred per Jira SCOPE note. Do NOT reuse US 29.8 Tenant Reactivation "Two-Actor / A second admin must approve" copy.
- **404-not-403** uniform across role gate (5 roles) and cross-tenant — matches Epic 11 sibling pattern (799/800/801/803/807/809/812).
- **22-char minimum justification** (softest lifecycle gate; contrast US 11.10 Edit=30, US 29.9 Archive=50).
- **Re-Validation checkbox as explicit human-attestation** — server 400 on false, distinct from client-side disable.
- **Three revalidation errors** (LC status / Valid Until / Product Template) consolidated as AC-15/16/17 → 422 with structured field-level conflict.

**New dependency ID introduced:** `D-CR-B5-Rollback` — Reactivate UI entry-point visibility toggle (unblocks AC-01 UI click-path once CR PRD1042-1495 B5 is rolled back or flag-gated).

**Reused dependencies:** `D-MFA-StepUp` (AC-18), `D-EventBus-Inspection` (AC-19), `D20` (AC-14 cross-tenant seed) — all from [[project-prd1042-803-807-809-framework-agreement]].

**Comparison to sibling stories:**

- [[project-prd1042-804-framework-agreement-suspension]] — Suspension is the entry state for Reactivation. Same 5-role 404 Outline pattern.
- [[project-prd1042-806-framework-agreement-termination]] — Termination is terminal (no reactivation from Terminated). AC-13 Outline confirms 409.
- US 29.8 Tenant Reactivation ([[project-prd1042-589]]) — deliberately DIFFERENT: Tenant Reactivation is Four-Eyes (Two-Actor); FA Reactivation is single-actor for November.

Epic folder: `PRD1042-22-Framework Agreement`.

## CR Amendments — PRD1042-1495

**Effective date:** 2026-07-20 (PO Sync, Philipp Maute + Laurence Ahrabian). **FE merge:** 2026-07-23 (Nevena Milivojevic).

**Deltas applied:**

- AC-01 `Blocked by-CR` — Reactivate UI entry-point button hidden per CR B5. AC covered by AC-04 API-level happy path. Was recorded pre-CR-run 2026-07-24 (D-CR-B5-Rollback).
- AC-UI (synthetic) `added-by-CR` — UI click-path unreachable while CR B5 gate is closed. Dependency: D-CR-B5-Rollback.

**No `[CR-REMOVED — coordinate spec deletion]`** items. AC-01 UI path was already Blocked pre-CR-run.

**New / reused D-\* dependencies:** D-CR-B5-Rollback (introduced by this CR).

See also [[project-cr-prd1042-1495-framework-agreement-cr]].
