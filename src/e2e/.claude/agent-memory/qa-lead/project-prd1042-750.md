---
name: project-prd1042-750
description: US 13.4 Ambiguous Resolution → Pending Confirmation Block (Epic 13), DoR PASS, Figma PARTIAL, 3-stage manual flow, 4 scenario blocks, Pending Confirmation badge + FO candidate-comparison view
metadata:
  type: project
---

PRD1042-750 — US 13.4 | Partner Management | Ambiguous Resolution → Pending Confirmation Block. Third story under Epic 13 Partner Management (PRD1042-24), processed via the 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]].

**Why:** November 2026 Foundation, CP-4/CP-6. On Ambiguous identity resolution (from US 13.03), the Partner enters Pending Confirmation and cannot be referenced by any downstream operational entity until governance (FO confirm, US 13.05) resolves it. Consuming workflows (Refinancing Request Stage 1/2) get a Validation Engine Defer.

**How to apply:**

- FE surfaces: a **Pending Confirmation badge** on the Partner + an **FO candidate-comparison view** (lists matched candidates + evidence). **LC sees a simplified Pending status only** (no candidate set/evidence).
- 10 ACs reconstructed (clean AC-01..AC-10; AC-10 = downstream-reference-block is the explicitly-referenced one, CP-6). 5 given Gherkin (happy: AC-01/02; main-error: AC-03 Validation Defer in consuming workflow, AC-06 role visibility, AC-10 downstream block); 5 excluded edge-case (AC-04 Validation Engine ownership/Defer emission, AC-05 notification routing to FO queue, AC-07 synchronous state-transition recording, AC-08 PartnerPendingConfirmation event, AC-09 audit content). 0 blocked.
- 4 scenario blocks (1 Outline over 4 roles + 3 Scenarios). **0 of 4 E2E-ready** — every scenario needs a seeded Pending-Confirmation / ambiguous-match Partner fixture (greenfield epic, no fixtures yet); AC-03 also needs the Refinancing Request gating flow.
- Ownership boundary (assumption): Validation & Gating Engine evaluates the rule and emits Defer; Partner Management only surfaces state — do not attribute Defer logic to Partner Management in tests.
- **Power User (Bank Admin) carry-over:** "View Pending Confirmation: Diagnostic" matrix row — role still has no UserRole enum mapping. Flagged, not forced into Gherkin.

Related: [[project-prd1042-749]], [[project-prd1042-747]], [[feedback-manual-3-stage-pipeline]].
