---
name: project-prd1042-804-framework-agreement-suspension
description: PRD1042-804 US 11.5 Framework Agreement Suspension (Epic 11) processed 2026-07-24 — DoR PASS 18 derived ACs, Stage 2 DESIGN-BLIND (MCP quota + no cached PNG for node 29:3780 despite fixture bank having 24:948/100:6629), Stage 3 WARNINGS spec-anchored, 11 scenario blocks in existing PRD1042-22-Framework Agreement/ folder
metadata:
  type: project
---

Processed 2026-07-24 as a single-story pipeline run against shared Epic 11 Figma file (`aQGn5OLEjEGJO7xGzFikP5`, target node `29:3780` SUSPEND AGREEMENT canvas on file `aQGn5OLEjEGJO7xGzFikP5`).

**Stage 1 — Jira extraction:** DoR PASS. Spec is unusually rich: full Field Specification table (Agreement Name / Justification / Effective From / Active Financings Check with M/O/C flags and validation rules), Validation Rules section (Active-only, 20-char justification, whitespace-only rejection, ≥ now UTC, Draft/Stage 1/Stage 2 non-blockers, Active/Disbursing/Approved blockers), System Behavior (server-authoritative serializable-read dependency check, HTTP 409 with structured conflict list, `fa.suspended` audit event with dependencyCheckSnapshot payload), Security Requirements (Power User (Bank Admin) only → 404 for others, MFA session required, justification field masked for LC/Support), Edge Cases (5 explicit: blocking Financings 409 / non-Active state 409 / concurrent suspension 409 "Already Suspended" / race between check+commit optimistic-lock 409 / in-flight Draft non-blocker). 18 ACs derived from these spec sections.

**Stage 2 — Figma extraction:** FAILED. MCP `get_metadata` returned quota-exhausted error on first call. Cached fixture bank at `src/e2e/fixtures/figma-e11/rendered-nodes/` has PNGs for sibling nodes `24:948` (DETAIL-PAGE), `100:6629` (EDIT-AGREEMENT), and `page-1-2` (FA-list-and-create) — but NOT for `29:3780`. Tried ~12 filename variants (SUSPEND-AGREEMENT, SUSPEND, SUSPENSION, DIALOG, MODAL, SUSPEND-FLOW, various casings) — none exist. Design-blind proceed per user's explicit fallback instruction. Recommend PNG export of `29:3780` when Figma plan quota resets. Note: per [[project-prd1042-22-framework-agreement]] canvas `29:3780` is the "Suspension, Reactivation, Termination" page — sibling PNGs for 24:948 (detail) and 100:6629 (edit) were exported but 29:3780 page was skipped.

**Stage 3 — Comparison:** WARNINGS. No CRITICAL contradictions. Spec is internally consistent. MAJOR design gaps flagged:

- Modal button copy design-blind (e.g. "Confirm suspension" vs "Suspend agreement" — both plausible)
- Justification counter placement + "Min 20 characters" text design-blind (compare to US 11.10 which shows "Min 30 characters")
- Future-dated Effective From explicit-warning banner copy design-blind
- Sequential AC-12 "already Suspended" 409 error copy design-blind (bundled with concurrent-suspension AC-15 which is Blocked on D-Concurrency-Forge)

**Stage 4 — Test generation:** File written to `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-804 Framework Agreement Suspension.md`. 11 scenario blocks (3 Outlines + 8 Scenarios): 4 happy-path + 7 main-error. 15 ACs covered with Gherkin. 2 Blocked ACs (AC-15 concurrent race → D-Concurrency-Forge, AC-18 MFA-session → D-MFA-StepUp). 3 excluded (AC-17 audit-event-fanout → Epic 26; AC-02/AC-04 bundled into AC-01 happy path). 7 of 11 scenarios @e2e-ready.

**Key domain patterns captured:**

- **State-machine gate:** 4-state matrix (Active happy, Draft 409, already-Suspended 409 sequential, Terminated 409) — 3 explicit main-error scenarios anchor each invalid-state transition
- **Blocking-financings dependency check:** 3-way Outline (Active / Disbursing / Approved) — verbatim spec HTTP 409 + structured conflict list
- **20-char justification guardrail:** 4-value Outline (short text + whitespace variants including tabs/newlines) — client-disable + server 400
- **Effective From validation:** past-dated rejection anchored (future-dated permitted-with-warning is happy-path, not tested here since warning copy is design-blind)
- **Draft Financings NOT blockers:** explicit AC-05 happy-path variant confirms Draft/Stage 1/Stage 2 are excluded from the blocking count (differs from AC-10 which enumerates the 3 blocking states)
- **Suspension idempotency vs concurrency split:** AC-12 sequential (Suspended → 409, @e2e-ready) separated from AC-15 concurrent race (Blocked on D-Concurrency-Forge)
- **Role gate + tenant isolation combined:** AC-14+AC-16 6-row Outline (5 non-Power-User roles + 1 LC cross-LC row) — uniform 404-not-403 + explicit assertion that Justification text is NOT leaked in 404 response body
- **Four-Eyes DEFERRED post-November** — Jira `[NOVEMBER 2026]` note explicitly states single-actor confirmation; POST-NOVEMBER `[OPEN QUESTION]` reserves second-Power-User countersignature for later. Test suite does NOT enforce Four-Eyes for November — different from earlier E11 stories where Four-Eyes was in scope.

**Dependency IDs used:**

- D-Concurrency-Forge — already introduced by PRD1042-809 (AC-09) — reused for AC-15 concurrent suspension
- D-MFA-StepUp — already introduced by PRD1042-809 (AC-16) — reused for AC-18 MFA session freshness
- D20 — cross-LC seeded fixture (existing dependency across E11/E13 stories) — needed for AC-16 LC cross-LC 404 row

**No new D-IDs introduced** — this story is fully covered by existing dependencies from the 803/807/809 batch (see [[project-prd1042-803-807-809-framework-agreement]]).

**Comparison to sibling stories:**

- PRD1042-803 (Detail View, 10 scenarios) — Detail is entry point for Suspend (this story). Cached frame 24:948 shows the "Suspend" top-right button context.
- PRD1042-807 (Document Attachment, 11 scenarios) — same 20-char justification-length pattern absent (807 uses different guardrails).
- PRD1042-809 (Edit Active/Suspended, 12 scenarios) — closest sibling. Uses 30-char justification (vs 20-char here), full 2-step wizard (vs single modal here), Four-Eyes deferred both. Same D-Concurrency-Forge + D-MFA-StepUp + D20 dependency set.

Epic folder: `PRD1042-22-Framework Agreement` (existing, per [[project-prd1042-22-framework-agreement]] and [[feedback-epic-folder-naming]]).
