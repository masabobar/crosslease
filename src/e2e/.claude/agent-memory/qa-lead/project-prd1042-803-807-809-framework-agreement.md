---
name: project-prd1042-803-807-809-framework-agreement
description: Epic 11 Framework Agreement batch (803 FA Detail, 807 FA Document Attachment, 809 FA Edit) processed 2026-07-24 — DoR PASS all 3, Stage 2 FAILED (MCP quota exhausted, WebFetch cannot pass X-Figma-Token), Stage 3 WARNINGS design-blind spec-anchored, files under existing PRD1042-22-Framework Agreement/ folder
metadata:
  type: project
---

Batch processed 2026-07-24 in a single pipeline run against shared Figma URL for Epic 11 (node 10:15285, file aQGn5OLEjEGJO7xGzFikP5).

**All 3 tickets:** DoR PASS, spec-embedded with permission matrix + field specs + edge cases.

**Stage 2 outcome (Figma REST extraction):** FAILED. MCP `get_metadata` returned a 434KB blob but the Read tool cannot open files exceeding 25K tokens regardless of offset/limit (single-line JSON). WebFetch cannot pass X-Figma-Token header (403 on `/nodes` fallback). Bash + curl helper not available (no shell tool in session). Design-blind extraction — spec-anchored only.

**Prior Epic 11 context reused:** PRD1042-807 was previously processed on 2026-07-23 via `/nodes` fallback (per [[project-prd1042-22-framework-agreement]]) — upload modal + Document Type enum + detach button visibility copy anchors already merged. Marked as Stage 2 PARTIAL for 807 in this run.

**Stage 3 status per ticket:** WARNINGS for all 3 (no CRITICAL contradictions — spec anchors are internally consistent, design gaps flagged as MAJOR).

**Files generated:**

- `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-803 Framework Agreement Detail View.md` — 16 derived ACs, 10 scenario blocks (6 happy + 4 error), 2 Blocked (D-LimitMgmt-Degraded AC-13, D-DocMgmt-FileMissing AC-14), 8 of 10 @e2e-ready
- `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-807 Framework Document Attachment.md` — 15 derived ACs, 11 scenario blocks (3 happy + 8 error), 2 Blocked (D-VirusScan-Force AC-12, D-DocMgmt-Down AC-14), 9 of 11 @e2e-ready
- `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-809 Framework Agreement Edit Active Suspended.md` — 18 derived ACs, 12 scenario blocks (3 happy + 9 error), 2 Blocked (D-Concurrency-Forge AC-09, D-MFA-StepUp AC-16), 9 of 12 @e2e-ready

**Key domain patterns anchored:**

- Tenant isolation (LC cross-LC): all 3 stories return 404-not-403 (AC-09 in 803, AC-10 in 807, AC-17 in 809)
- Role-based access: Bank Admin (Power User) is the only edit/attach/detach actor; other roles get 404-not-403 on API, hidden-not-disabled in UI (AC-08 in 803, AC-08 in 807, AC-15 in 809)
- Immutability of historical Financings after FA pricing edit (Option B audit anchor): 809 AC-13 confirms Effective Rate applied at approval time is preserved
- 30-char minimum justification for governed edits (809 AC-04) — same pattern as US 29.x tenant lifecycle stories

**New dependency IDs introduced:**

- D-LimitMgmt-Degraded — Limit Mgmt degraded-mode simulator (803 AC-13)
- D-DocMgmt-FileMissing — Document Mgmt integrity fault forge (803 AC-14)
- D-VirusScan-Force — VirusScan negative outcome forge (807 AC-12)
- D-DocMgmt-Down — Document Mgmt storage-failure forge (807 AC-14)
- D-Concurrency-Forge — optimistic-lock race harness (809 AC-09)
- D-MFA-StepUp — MFA freshness override endpoint (809 AC-16, also relevant to 807 AC-11)

Epic folder: `PRD1042-22-Framework Agreement` (existing, per [[project-prd1042-22-framework-agreement]] and [[feedback-epic-folder-naming]]).

## CR Amendments — PRD1042-1495

**Effective date:** 2026-07-20 (PO Sync, Philipp Maute + Laurence Ahrabian). **FE merge:** 2026-07-23 (Nevena Milivojevic — A1-A6 + B1 + B4 + B5 + B6). **BE-pending:** B2 (VFE).

**Deltas applied to PRD1042-803 (FA Detail View):**

- AC-01 `modified-by-CR` — chip row and IDENTITY section field list no longer include Bank entity (was: `Bank entity Sparkasse` present). Assertion inverted to "not present in the DOM".
- AC-07 `modified-by-CR` — LC-user IDENTITY.Bank-entity hidden assertion clarified: per CR A4, this is now the ALL-role default, not LC-specific.
- AC-CR-A4 (synthetic) `added-by-CR` — Bank Entity hidden from FA Detail for all roles; bundled into AC-01.

**Deltas applied to PRD1042-807 (FA Document Attachment):**

- AC-02 `modified-by-CR` — "Attach documents primary button enabled once every staged row has a Document type selected" changed to "enabled once at least one file is staged" per CR A6.
- AC-CR-A6 (synthetic) `added-by-CR` — new happy-path scenario: uncategorized document (no Document type) is accepted; server default = "Uncategorized". @e2e-ready.
- AC-CR-B3 (synthetic) `added-by-CR` — bundled/config-level: all FA documents optional in the first place; mandatory list configurable per-tenant, not hard-coded. Not E2E-observable in this story.
- Modal spec table verbatim `Document type` (required) → `Document type` (optional per CR A6).

**Deltas applied to PRD1042-809 (FA Edit Active/Suspended):**

- AC-01/AC-02/AC-05 `modified-by-CR` — comment / rationale annotation: pre-CR two-step wizard baseline retained for behavioural assertions; post-CR B4 6-step alignment (adds Special Conditions) flagged for verbatim step count/title refresh once new frame exported. `edit_version_counter` behaviour preserved (each save bumps version).
- AC-03 `unchanged` — immutable-field list (Agreement ID / Name / LC / Bank Entity / Tenant ID / Currency / Valid From) already includes Bank Entity; no new test surface for A4 in this story.
- Interaction model section: added pre-CR/post-CR annotation table.

**No `[CR-REMOVED — coordinate spec deletion]`** items in this batch.

**New / reused D-\* dependencies:** none. Existing D-LimitMgmt-Degraded, D-DocMgmt-FileMissing, D-VirusScan-Force, D-DocMgmt-Down, D-Concurrency-Forge, D-MFA-StepUp all unaffected.

See also [[project-cr-prd1042-1495-framework-agreement-cr]].
