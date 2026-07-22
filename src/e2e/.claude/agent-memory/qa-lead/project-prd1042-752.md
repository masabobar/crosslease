---
name: project-prd1042-752
description: US 13.6 Counter-Confirm Risk-Sensitive Role / Four-Eyes (Epic 13), DoR PASS, Figma PARTIAL (node 235:28545 = 3rd scope-legend card), 3-stage manual flow, 4 scenario blocks, FIRST true Four-Eyes submit+approve in E13
metadata:
  type: project
---

PRD1042-752 — US 13.6 | Partner Management | Counter-Confirm Risk-Sensitive Role (Four-Eyes). Fifth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]].

**Why:** November 2026 Foundation, CP-5. First **genuine Four-Eyes submit+approve** story in E13 (747/751 were single-actor governance). FO initiates a risk-sensitive role assignment; a BO/Risk reviewer must counter-confirm before the flag becomes operational. API `POST /api/partners/{id}/roles/{roleId}/counter-confirm`; RoleGovernanceService; RoleAssignment append-only.

**How to apply:**

- Risk-sensitive roles: **Leasing Company (LG), Bank Entity, UBO-Related Person**.
- **Permission split (initiate vs counter-confirm):** FO initiates (only FO); BO/Risk counter-confirms (only BO/Risk). Both backend-enforced. This is a distinct capability split from 747/751 (which were Sys Admin+FO). Sys Admin does NOT counter-confirm here.
- **Four-Eyes independence** evaluated server-side at the moment of counter-confirmation (not request time, AC-06 edge-case): the initiating actor can never counter-confirm the same assignment, even with BO/Risk capability → rejected + Four-Eyes violation audit event.
- 11 ACs reconstructed. 7 given Gherkin (happy: AC-01/02/05 counter-confirm→operational, non-operational pre-state; main-error: AC-03/04 Four-Eyes same-user rejection, AC-07 role gating BO/Risk-only, AC-08 withdrawn-assignment invalid state). Excluded edge-case: AC-06 independence-at-decision-time, AC-09 notification routing to BO/Risk queue, AC-10 transactional persistence, AC-11 RiskRoleCounterConfirmed event. 0 blocked.
- 4 scenario blocks (2 Outlines + 2 Scenarios). **0 of 4 E2E-ready** — all need a seeded risk-sensitive role-assignment fixture (pending / withdrawn) + a two-user Four-Eyes setup. Greenfield.
- **Power User (Bank Admin) carry-over:** appears in the role-gating negative Outline (cannot counter-confirm), still no UserRole enum mapping.
- **Figma:** URL node 235:28545 is a THIRD E13 scope-legend card (lists 752/761/765), not a screen frame — Stage 2 PARTIAL. Three legend cards now known in the E13 file: 235:28513, 235:28523, 235:28545. Actual screen frames still not located.

Related: [[project-prd1042-751]], [[project-prd1042-747]], [[feedback-manual-3-stage-pipeline]].
