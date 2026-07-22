---
name: project-prd1042-766
description: US 13.20 Capture Direct UBO Ownership (Epic 13), DoR PASS, Figma PARTIAL (node 235:28523; ADD UBO OWNER confirmed in real frame 21:11234), 3-stage manual flow, 4 scenario blocks; FIRST UBO story
metadata:
  type: project
---

PRD1042-766 — US 13.20 | Partner Management | Capture Direct UBO Ownership. Twelfth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]]. **First UBO story** (natural-person Partners as UBOs of legal entities).

**Why:** November 2026 Foundation, GwG §3 UBO disclosure. FO links a Confirmed natural-person Partner as a direct UBO of a legal-entity Partner with ownership % + Ownership Type=Direct → UBOOwnershipRecord captured. **Direct ownership only in November**; indirect/multi-layer captured as structured notes, NOT auto-traversed (recursive traversal deferred, OQ-03, Part B → US 13.21). API `POST /api/partners/{id}/ubo`; UBOService.

**How to apply:**

- 8 ACs reconstructed. 5 given Gherkin (happy: AC-01/02 link Confirmed natural person + % + Direct → UBO record; main-error: AC-03 UBO target must be Confirmed else blocked, AC-04 indirect/multi-layer → structured notes only no auto-traverse, AC-05 role gating FO-only). Excluded: AC-06 feeds UBO Completeness (separate-feature → US 13.21); AC-07 UBOCaptured event, AC-08 persistence NFR (edge-case). 0 blocked. 4 scenario blocks (1 Outline + 3 Scenarios). 0 of 4 E2E-ready (needs seeded Confirmed legal-entity + natural-person Partners; greenfield).
- **Permission:** Capture direct UBO ownership = FO only. Power User (Bank Admin) in role-gating negative, still no UserRole enum mapping.
- **Figma:** URL node 235:28523 = second E13 scope-legend card (PARTIAL), BUT the real frame 21:11234 (from 764) contains the "ADD UBO OWNER" action — UBO-capture entry point confirmed in real design. For COMPLETE UBO-panel field extraction, request the specific 21:xxxxx frame.
- **OQ-PM-BU (DEFERRED, context only — NOT a blocker):** Borrower Unit (Kreditnehmereinheit, §19 Abs.2 KWG) UBO aggregation is parked on Epic 19 Limit Management, confirmed NOT in the Partner Management model; November stays per-Partner (direct UBO + notes). Moved to Client Approved 2026-06-17. Additive hook preserved. Do not build scenarios for it.

Related: [[project-prd1042-764]] (ADD UBO OWNER frame 21:11234), [[feedback-manual-3-stage-pipeline]].
