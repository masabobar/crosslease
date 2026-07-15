---
name: project-prd1042-760
description: US 13.14 Propose Identity Change on Confirmed Partner (Epic 13), DoR PASS, Figma PARTIAL (node 235:28523 = 2nd scope-legend card), 3-stage manual flow, 4 scenario blocks, FO-initiated change; high-risk path pairs with US 13.15 Four-Eyes
metadata:
  type: project
---

PRD1042-760 — US 13.14 | Partner Management | Propose Identity Change on Confirmed Partner. Eighth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]].

**Why:** November 2026 Foundation, Flow E. FO proposes a change to a Confirmed Partner's legal Identity Anchors (Legal Name / Legal Form / HRB / Tax ID / LEI / Country) → governed append-only IdentityChangeEvent. Non-high-risk commits under single-actor governance; **high-risk anchors (driving role Leasing Company / Bank Entity) require BO/Risk Four-Eyes counter-confirmation (US 13.15) before commit** — same FO-initiates / BO-Risk-counter-confirms split as 752/756/757. API `POST /api/partners/{id}/identity-change`; IdentityChangeService; IdentityChangeEvent (append-only, CP-9).

**How to apply:**

- FE surface: identity-change form with a pre-change impact preview (UI-observable for high-risk).
- 11 ACs reconstructed. 7 given Gherkin (happy: AC-01/02/03/04 propose→append-only event, non-high-risk committed vs high-risk impact-preview+held; main-error: AC-05 role gating FO-only, AC-06 anchor locks (only via governed path), AC-07 LEI ISO 17442 / HRB DE format failure → field-level error). Excluded: AC-08 append-only/never-deleted CP-9, AC-09 IdentityChangeProposed event, AC-10 impact-assessment currency NFR (edge-case); AC-11 commit re-runs matching → dedup US 13.08 (separate-feature). 0 blocked.
- **LEI/HRB format note:** classified as **main-error here** (invalid anchor blocks the governed proposal), a deliberate story-specific call — DIFFERENT from 747/749 where LEI/HRB format was edge-case (login-style validation). Context: on this governed identity-change form, valid anchors are core to completing the action, and the coordinator explicitly requested these scenarios.
- 4 scenario blocks (3 Outlines + 1 Scenario). **0 of 4 E2E-ready** — all need a seeded Confirmed Partner fixture + high-risk anchor setup. Greenfield.
- **Permission:** Propose identity change = FO only (Sys Admin/BO/LC/Power User/Auditor ✗). Power User (Bank Admin) in role-gating negative, still no UserRole enum mapping.
- **Figma:** node 235:28523 = second E13 scope-legend card (reused), not a screen frame.

Related: [[project-prd1042-757]], [[project-prd1042-752]], [[feedback-manual-3-stage-pipeline]].
