---
name: project-prd1042-759
description: US 13.13 Reconstruct Full Merge History (Epic 13, read-only audit story), DoR PASS, Figma PARTIAL (node 235:28523 = 2nd scope-legend card), 3-stage manual flow, 4 scenario blocks, OPEN tab-visibility design gap
metadata:
  type: project
---

PRD1042-759 — US 13.13 | Partner Management | Reconstruct Full Merge History. Seventh story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]]. Read-only / audit-reconstruction story (no state mutation, no events emitted).

**Why:** November 2026 Foundation, CP-13. Auditor reconstructs a Partner's complete merge history (merged-source Identity Anchor snapshots, merge reason codes, initiator + counter-confirmer Four-Eyes evidence, integrity outcomes) from the Audit Trail alone — independent of live operational state. AuditReconstructionService (read); MergeLineageRecord + Audit Trail events. No emission.

**How to apply:**

- FE surface: Auditor read-only merge-history view (a tab on the surviving Partner detail).
- 9 ACs reconstructed. 6 given Gherkin (happy: AC-01/02/03 reconstruct lineage chain + snapshots + Four-Eyes evidence + reason codes, single + multi-source 1:N; main-error: AC-04 read-only/no-mutation, AC-05 role gating, AC-06 merged-source direct query → Merged + forward reference). Excluded edge-case: AC-07 reconstruction-independent-of-live-state invariant, AC-08 tenant/engagement-window scope + session-audit, AC-09 report SLA. 0 blocked.
- 4 scenario blocks (2 Outlines + 2 Scenarios). **0 of 4 E2E-ready** — all need a seeded merge-history/lineage fixture in the Audit Trail. Greenfield.
- **Role matrix:** Reconstruct merge history = Auditor ✓, System Admin ✓ (read-only), Power User (Bank Admin) Diagnostic; FO/BO/Risk/LC ✗. Scenarios base role gating on the MATRIX.
- **OPEN DESIGN GAP (Philipp Maute, 2026-06-18):** the Figma merge-history tab currently sits on the surviving Partner detail visible to FO/BO/Admin, which does NOT match the 13.13 matrix (Auditor + Sys Admin read-only + Power User diagnostic only). Open question: do FO/BO need a _lighter_ merge-lineage view separate from the 13.13 auditor reconstruction (→ new scope item) or should the tab be restricted to the matrix roles? Needs design to lock tab visibility. Same block/alignment as PRD1042-756.
- **Power User (Bank Admin)** "Diagnostic" access again — still no UserRole enum mapping.
- **Figma:** node 235:28523 is the second E13 scope-legend card (reused; lists 770/751/760/766/759/774), not a screen frame. Four legend cards known: 235:28513, 235:28523, 235:28545, 235:28556.

Related: [[project-prd1042-757]], [[project-prd1042-752]], [[feedback-manual-3-stage-pipeline]].
