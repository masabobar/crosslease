---
name: project-prd1042-751
description: US 13.5 Confirm Pending Partner / Governed Confirmation (Epic 13), DoR PASS, Figma PARTIAL (node 235:28523 = 2nd scope-legend card), 3-stage manual flow, 5 scenario blocks
metadata:
  type: project
---

PRD1042-751 — US 13.5 | Partner Management | Confirm Pending Partner (Governed Confirmation). Fourth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]].

**Why:** November 2026 Foundation, CP-6. FO (or Sys Admin) confirms a Pending Confirmation Partner via the governed workflow → an append-only, immutable Partner Confirmation Record is appended and the Partner transitions to Confirmed (referenceable for Contract/Financing/approval). API `POST /api/partners/{id}/confirm`; Workflow Engine routes the task, Partner Management only defines the triggering event.

**How to apply:**

- FE surfaces: Confirm action (with candidate evidence) + confirmation-history list.
- 11 ACs reconstructed (AC-01..AC-11). 7 given Gherkin (happy: AC-01/02/03 confirm→record→referenceable; main-error: AC-04 role gating, AC-05 invalid transition from Rejected/Merged/Archived, AC-06 idempotent re-confirm, AC-11 edit/delete record rejected + critical security audit event). Excluded: AC-07 transactional persistence, AC-08 PartnerConfirmed event, AC-09 confirmation-history record content (edge-case); AC-10 non-referenceable-while-Pending (separate-feature → owned by US 13.4 / PRD1042-750). 0 blocked.
- 5 scenario blocks (3 Outlines + 2 Scenarios). **0 of 5 E2E-ready** — all need seeded Partner-lifecycle fixtures (Pending/Confirmed/Rejected/Merged/Archived + an existing Confirmation Record). Greenfield epic, no fixtures.
- **Confirm authority:** only Sys Admin + FO (BO/Risk, LC, Power User, Auditor cannot) — same restricted-create pattern as 747.
- **Power User (Bank Admin) carry-over:** "View confirmation history: Diagnostic" matrix row — role still has no UserRole enum mapping. Flagged, not forced into Gherkin.
- **Figma note:** URL node 235:28523 is a SECOND E13 scope-legend card (lists 770/751/760/766/759/774), not a screen frame — Stage 2 PARTIAL again. Two legend cards now known in the E13 file: 235:28513 and 235:28523.

Related: [[project-prd1042-750]], [[project-prd1042-747]], [[feedback-manual-3-stage-pipeline]].
