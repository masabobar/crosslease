---
name: project-prd1042-806-framework-agreement-termination
description: PRD1042-806 US 11.7 Framework Agreement Termination (Epic 11) processed 2026-07-24 — DoR PASS 13 derived ACs, Stage 2 DESIGN-BLIND (MCP quota + no cached PNG for node 29:3780 TERMINATE section), Stage 3 WARNINGS spec-anchored, 10 scenario blocks (4 happy + 6 error), 2 Blocked, 1 Excluded (Epic 26), 4 of 10 E2E-ready
metadata:
  type: project
---

Processed 2026-07-24 as a single-story pipeline run against shared Epic 11 Figma file (`aQGn5OLEjEGJO7xGzFikP5`, target node `29:3780` — TERMINATE section on the "Suspension, Reactivation, Termination" canvas).

**Stage 1 — Jira extraction:** DoR PASS. US 11.7 Framework Agreement Termination. 13 derived ACs from spec: 5 Functional Requirements + 5 Validation Rules + 1 System Behavior chunk + 1 Security block + Edge Cases. Epic PRD1042-22. Status: Dev in progress. Children: PRD1042-1354 (BE), PRD1042-1355 (FE), PRD1042-1356 (QA).

**Stage 2 — Figma extraction:** FAILED. MCP `get_screenshot` returned Professional-plan quota-exhausted error. REST `/v1/files` quota-exhausted in prior 803/807/809 session on same token (per [[feedback-figma-nodes-fallback]]). No PNG fixture for node `29:3780` or child TERMINATE section in `src/e2e/fixtures/figma-e11/rendered-nodes/` — checked 5+ common filename patterns. WebFetch cannot pass `X-Figma-Token`. No shell tool available. Proceeded design-blind, spec-anchored per user directive.

**Stage 3 — Comparison:** WARNINGS. No CRITICAL contradictions — spec internally consistent. Design gap logged: verbatim modal copy for termination modal (Justification textarea label, Irreversibility checkbox label, Active-Financings-Check display copy, primary-button copy). Spec anchors carried through verbatim into scenario Given/When/Then. Behavioural assertions used where design copy would ordinarily anchor UI text.

**Stage 4 — Test generation:** File written to `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-806 Framework Agreement Termination.md`. 10 scenario blocks (1 Outline for RBAC 404, 1 Outline for terminal-state back-transition, 8 discrete Scenarios). 4 happy-path + 6 main-error. 2 Blocked (AC-11 D-Concurrency-Forge, AC-13 D-MFA-StepUp). 1 Excluded (AC-14 → Epic 26). 4 of 10 @e2e-ready.

**Key domain patterns captured:**

- **November 2026 single Power User (Bank Admin) action** — Four-Eyes deferred per Plan v1.3 §3
- **Active-Financings dependency guard:** Active / Disbursing / Approved (pre-disbursement) block; Completed / Terminated do not — HTTP 409 with structured conflict list + `FA_TERMINATION_BLOCKED` audit event
- **Draft rejection:** 409 with pointer to US 11.01 hard-delete path
- **Terminal-state Outline:** `/terminate`, `/suspend`, `/reactivate` all return 409 on a Terminated FA (irreversibility contract)
- **Limit Breach Flag does NOT block termination** — preserved as historical evidence
- **Historical-reporting invariant:** Terminated FA remains queryable; Limit Management utilization record retained
- **RBAC 404-not-403** (same as 803/807/809); LC cross-LC 404 via tenant isolation
- **MFA freshness gate** acknowledged but blocked pending D-MFA-StepUp

**No new dependency IDs introduced** — reuses existing 803/807/809 batch: `D-Concurrency-Forge`, `D-MFA-StepUp`, `D20`.

**Comparison to sibling stories:**

- [[project-prd1042-804-framework-agreement-suspension]] — Suspension is reversible (→ Reactivation); Termination is terminal.
- [[project-prd1042-805-framework-agreement-reactivation]] — mirrors: 22-char (805) vs Termination's longer justification; both use Re-Validation-style attestation but Termination gates on Irreversibility checkbox.
- Sibling PRD1042-808 Suspend is next natural candidate (not yet processed).
- Mirrors [[project-prd1042-809-framework-agreement]] governed-modal pattern (30-char justification, wizard).

Epic folder: `PRD1042-22-Framework Agreement`.

## CR Amendments — PRD1042-22 Reconciliation v10

**Effective:** 2026-07-22 (Scope Reconciliation v2). **QA merge:** 2026-07-27.

**Deltas applied:**

- **Header** — CR v10 acknowledgement note added distinguishing 1495 vs v10 items.
- **AC-03/AC-10** `Blocked-by-CR-pending` — dependency-check reference figure contested per v10 §7 B4. Structural conflict-list assertions UNAFFECTED. Scenario tagged `@cr-pending-b4`.
- **AC-07/AC-08** `Blocked-by-CR-pending` — 5-role 404 Outline tagged `@cr-pending-b5` pending Philipp Maute.
- **B7 confirmation** — single-admin two-step termination (no Four-Eyes) reinforced by v10 §4.3 / §6 US 11.7; already implemented — no test change.
- **State model** — 4 stored values (Draft/Active/Suspended/Terminated) reinforced. AC-05 back-transition Outline (Terminated → Suspend/Reactivate all 409) remains correct.
- **AC-09 Limit Breach non-blocker** — v10 §6 US 11.7 confirms Limit Breach Flag does NOT block termination (already correct per spec).
- **Non-gating invariant** — v10 §6 US 11.9: no operation blocks on utilisation figure. Termination's Active-Financings gate is on existence (not utilisation percentage) — CORRECT and RETAINED.

**No `[CR-REMOVED — coordinate spec deletion]`** items.

**No new dependencies.**

See also [[project-cr-prd1042-22-reconciliation-v10]].
