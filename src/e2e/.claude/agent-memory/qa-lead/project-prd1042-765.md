---
name: project-prd1042-765
description: US 13.19 Counter-Confirm Risk-Sensitive Role Assignment (Epic 13), DoR PASS, Figma PARTIAL (node 235:28545), 3-stage manual flow, 4 scenario blocks; FUNCTIONAL DUPLICATE of US 13.06 (PRD1042-752)
metadata:
  type: project
---

PRD1042-765 — US 13.19 | Partner Management | Counter-Confirm Risk-Sensitive Role Assignment. Eleventh story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]].

**Why / KEY FLAG:** This story is a **FUNCTIONAL DUPLICATE of US 13.06 ([[project-prd1042-752]])**. Its own assumption states "Behaviour is identical to US 13.06; retained for 1:1 PM-to-US traceability" (PM-19 vs PM-06). Shares the SAME API `POST /api/partners/{id}/roles/{roleId}/counter-confirm` and RoleGovernanceService. **OQ-PM-A1** asks whether to consolidate 13.06 + 13.19 into one story — recommendation is retain separately (documentation-only, no operational divergence). The 765 suite closely mirrors the 752 suite. **Escalated to BA/PO:** redundant test coverage; if consolidated, one of 752/765 becomes obsolete.

**How to apply:**

- BO/Risk counter-confirms an FO-initiated risk-sensitive role assignment (LG / Bank Entity / UBO-Related Person); flag operational only after counter-confirmation (CP-5); same-user rejected (Four-Eyes); reject → non-operational.
- 9 ACs reconstructed. 6 given Gherkin (happy: AC-01/02/04 counter-confirm→operational over 3 roles, non-operational pre-state; main-error: AC-03 Four-Eyes same-user, AC-05 role gating BO/Risk-only, AC-06 reject→non-operational). Excluded edge-case: AC-07 notification routing, AC-08 RiskRoleCounterConfirmed event, AC-09 independence evidence persistence. 0 blocked. 4 scenario blocks (2 Outlines + 2 Scenarios). 0 of 4 E2E-ready (needs seeded role-assignment fixture + two-user; greenfield).
- Mirrors 752 exactly EXCEPT 752 also had an invalid-state (withdrawn assignment) scenario; 765's ACs don't include that, so 765 has 4 blocks vs 752's 4 (752: happy + Four-Eyes + role-gating + withdrawn; 765: happy + Four-Eyes + role-gating + reject).
- **Power User (Bank Admin)** in role-gating negative, still no UserRole enum mapping.
- **Figma:** node 235:28545 = third E13 scope-legend card (reused), not a screen frame. Real frames under 21:xxxxx (see 764).

Related: [[project-prd1042-752]] (the original; 765 duplicates it), [[project-prd1042-764]], [[feedback-manual-3-stage-pipeline]].
