---
name: project-prd1042-761
description: US 13.15 Counter-Confirm High-Risk Identity Change / Four-Eyes (Epic 13), DoR PASS, Figma PARTIAL (node 235:28545 = 3rd scope-legend card), 3-stage manual flow, 6 scenario blocks; pairs with US 13.14
metadata:
  type: project
---

PRD1042-761 — US 13.15 | Partner Management | Counter-Confirm High-Risk Identity Change (Four-Eyes). Ninth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]]. **Counter-confirmation partner to US 13.14 (PRD1042-760)** — 5th Four-Eyes/governance story; same FO-initiates (13.14) / BO-Risk-counter-confirms split as 752/756/757/760.

**Why:** November 2026 Foundation, CP-9. BO/Risk reviews a pre-change downstream impact assessment (affected Contracts / Refinancing Requests / KYC cases) and Approves → the high-risk identity change commits atomically with appended IdentityChangeEvent + pre/post snapshots; Reject cancels. API `POST /api/partners/{id}/identity-change/{ev}/counter-confirm`; IdentityChangeService.

**How to apply:**

- Fields: Decision (Approve/Reject) M; **Impact Acknowledgement boolean MANDATORY** (confirms review of affected downstream objects — approval blocked without it); Note O.
- 10 ACs reconstructed. 7 given Gherkin (happy: AC-01/02 review+acknowledge+approve → atomic commit + event + pre/post snapshots; main-error: AC-03 approval-without-impact-ack blocked, AC-04 Four-Eyes proposer≠counter-confirmer, AC-05 role gating BO/Risk-only, AC-06 reject → cancelled/anchors unchanged, AC-07 atomic rollback on commit failure — no partial commit). Excluded: AC-08 KYC re-screening trigger (separate-feature → US 13.16 Part B); AC-09 IdentityChangeCommitted/Rejected events, AC-10 audit content (edge-case). 0 blocked.
- 6 scenario blocks (1 Outline + 5 Scenarios). **0 of 6 E2E-ready** — need seeded pending high-risk identity change + two-user Four-Eyes + commit-failure injection for the rollback scenario. Greenfield.
- **Permission:** Counter-confirm identity change = BO/Risk only. Power User (Bank Admin) in role-gating negative, still no UserRole enum mapping.
- **Figma:** node 235:28545 = third E13 scope-legend card (reused; lists 752/761/765), not a screen frame.

Related: [[project-prd1042-760]], [[project-prd1042-757]], [[project-prd1042-752]], [[feedback-manual-3-stage-pipeline]].
