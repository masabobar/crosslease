---
name: project-prd1042-757
description: US 13.11 Counter-Confirm Merge / Four-Eyes No-Loss (Epic 13), DoR PASS, Figma PARTIAL (node 235:28556 = 4th scope-legend card), 3-stage manual flow, 6 scenario blocks, OPEN post-reject-state design gap
metadata:
  type: project
---

PRD1042-757 — US 13.11 | Partner Management | Counter-Confirm Merge (Four-Eyes, No-Loss). Sixth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]]. 4th Four-Eyes/governance story; same FO-initiates / BO-Risk-counter-confirms split as [[project-prd1042-752]] (and 756).

**Why:** November 2026 Foundation, CP-8 no-loss merge governance. BO/Risk reviews a reference-preservation manifest + survivor/source KYC/credit conflict, then Approves (→ authorises atomic execution, US 13.12) or Rejects (cancels, sources distinct, audit). API `POST /api/partners/merge/{id}/counter-confirm`; MergeService; MergeLineageRecord.

**How to apply:**

- Fields: Decision (Approve/Reject) M; **Conflict Acknowledgement boolean** C — required (and blocks approval) where a survivor/source outcome conflict exists; Note O.
- 11 ACs reconstructed. 7 given Gherkin (happy: AC-01/02 approve→authorise execution; main-error: AC-03 unacknowledged-conflict blocks approval, AC-04 Four-Eyes same-user, AC-05 role gating BO/Risk-only, AC-06 self-merge + cross-tenant rejected at gate/CP-10, AC-07 reject branch). Excluded: AC-08 atomic execution (separate-feature → US 13.12); AC-09 transactional persistence, AC-10 MergeCounterConfirmed/MergeRejected events, AC-11 audit content (edge-case). 0 blocked.
- 6 scenario blocks (2 Outlines + 4 Scenarios). **0 of 6 E2E-ready** — need seeded merge-candidate/conflicting/illegal-merge fixtures + two-user Four-Eyes + D20 (cross-tenant). Greenfield.
- **OPEN DESIGN GAP (Philipp Maute, 2026-06-18):** the pair state AFTER a rejected merge is UNDEFINED; design has no post-reject state. Recommendation pending (route to Deferred, reason-coded; reviewer re-initiates corrected merge or resolves as Confirmed Distinct). The AC-07 Reject scenario deliberately asserts ONLY "merge cancelled; sources remain distinct; audit recorded" — NO specific resulting pair status. Needs BA/PO to pin post-reject routing (recommend → Deferred). Same block/alignment as PRD1042-756.
- **Power User (Bank Admin)** appears in the role-gating negative Outline (cannot counter-confirm), still no UserRole enum mapping.
- **Figma:** node 235:28556 is a FOURTH E13 scope-legend card (lists 754/755/756/757), not a screen frame. Four legend cards now known: 235:28513, 235:28523, 235:28545, 235:28556. Actual screen frames still not located.

Related: [[project-prd1042-752]], [[project-prd1042-751]], [[feedback-manual-3-stage-pipeline]].
