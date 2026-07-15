---
name: project-prd1042-586
description: PRD1042-586 US 29.5 Module Activation per Tenant — re-run 2026-07-07 Stage 2 SUCCESS via Node 93:15900, 3 post-submission alert states captured verbatim, 9 scenario blocks
metadata:
  type: project
---

**Story:** PRD1042-586 — US 29.5 Module Activation per Tenant (Epic 29 / PRD1042-40 Tenant Management)
**First processed:** 2026-07-07 (design-blind v1)
**Re-run:** 2026-07-07 (Stage 2 SUCCESS — supersedes design-blind v1)
**Output:** src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-586 Module Activation.md

## Pipeline outcome (re-run)

- Stage 1: DoR PASS (26 ACs) — unchanged from v1
- Stage 2: SUCCESS — Figma REST API, Node 93:15900 (MODULE ACTIVATION section) in file 7pygkopuqyeEhUTMVp9lrP, canvas 93:12429 "Module Activation/Deactivation"
- Stage 3: WARNINGS — 3 previously-unverified UI states now design-anchored (AC-04, AC-05, AC-16/22); 2 NEW MAJOR gaps (Justification + Effective From fields not visible in modal frame)
- Stage 4: 9 scenario blocks (5 Outlines + 4 Scenarios), 13 of 26 ACs covered (up from 10 in v1)

## Design copy captured verbatim (Node 93:15900)

- **Modal title:** "Activate module"
- **Primary button:** "Submit for activation"
- **Secondary button:** "Cancel"
- **Modal fields visible:** "Module name" (read-only, e.g. "Reporting"), "Current status" (read-only)
- **State 1 alert (AC-04 Pending Enforcement):** "Module activation submitted" / "Reporting will remain inactive until enforcement is confirmed." / "View profile"
- **State 2 alert (AC-16, AC-22 Enforcement Timeout):** "Enforcement confirmation timed out." / "Reporting module remains in Pending enforcement. The platform operations team has been notified."
- **State 3 alert (AC-05 Activation Confirmed):** "Activation confirmed" / "Reporting is now active." / "View profile"

## AC classification changes vs v1

- AC-04 (was `Blocked`) → `main-error` design-verified but infra-blocked (D-Enforcement)
- AC-05 (was `Blocked`) → `happy-path` design-verified but infra-blocked (D-Enforcement)
- AC-16 (was `Blocked`) → `main-error` design-verified but infra-blocked (D-Enforcement + clock)
- AC-22 (was `Blocked`) → `main-error` design-verified but infra-blocked (D-Enforcement) — shares UI with AC-16
- AC-08 (was `happy-path`) → `edge-case` design gap (Effective From field not in extracted modal frame)
- AC-09 (was `happy-path` + `main-error`) → `edge-case` design gap (Justification field not in extracted modal frame)
- AC-01, AC-02, AC-07, AC-10, AC-11, AC-12, AC-19, AC-24: unchanged classification, scenarios updated with design-verified copy where applicable

## MAJOR design gaps still logged

- Justification field (AC-09, min 10 chars, mandatory) — NOT visible in extracted modal frame. API-level still testable but out of E2E scope for this design pass.
- Effective From field (AC-08, optional DateTime) — NOT visible in extracted modal frame.
- Dependency-check UI (for AC-12/24 duplicate conflict feedback) — not shown in this section.

## Blocked dependencies (unchanged from v1)

- PRD1042-77 Four-Eyes Approval Validation → AC-03, AC-13, AC-14, AC-26
- D-Enforcement Authorization Enforcement Layer → AC-04, AC-05, AC-15, AC-16, AC-18, AC-22, AC-23
- AC-14 combined block (Four-Eyes + enforcement)

## RefiNext domain rules applied

- **Fail-closed activation** (Vesna Plakalovic 2026-06-05) — now anchored by design State 1 ("will remain inactive until enforcement is confirmed") + State 2 ("no auto-fallback")
- **404-not-403 role gating** (AC-19) — remains only E2E-ready scenario
- **Four-Eyes independence** (AC-03, AC-26) — Blocked pending PRD1042-77

## Why the re-run

User provided verified Figma design data via REST API (previously MCP was rate-limited). Design copy for the three post-submission alert states was previously unverified; capturing verbatim copy upgrades Stage 3 comparisons from design-blind speculation to design-anchored assertion — and produces 3 NEW scenarios wired to explicit design text.

## How to apply

- Design-verified but infra-blocked scenarios (AC-04, AC-05, AC-16/22) use full Given-When-Then with verbatim design copy in Then steps + code comment citing Node 93:15900 State N — this pattern lets them execute once D-Enforcement wiring lands, without any rewrite
- Justification and Effective From ambiguity — if design team clarifies these fields live in a wizard step 2 or a separate frame, reclassify AC-08/AC-09 back to `happy-path` / `main-error` and add scenarios
- Duplicate-conflict Outline pattern (AC-12/24 merged) still reusable for future in-flight conflict tests

**Related:** [[project-prd1042-77]] Four-Eyes Approval Validation blocks 4 ACs. [[project-prd1042-585]] Tenant Detail View — Module Profile tab is the entry point for activation modal. [[project-prd1042-583]] Tenant Activation established the "REST API works when MCP rate-limited" fallback used here.
