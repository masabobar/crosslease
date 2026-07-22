---
name: project-prd1042-767
description: US 13.21 Compute UBO Completeness Status (Epic 13, system/computation), DoR PASS, Figma N/A (no node; only a completeness badge), 3-stage manual flow, 4 scenario blocks; downstream of US 13.20
metadata:
  type: project
---

PRD1042-767 — US 13.21 | Partner Management | Compute UBO Completeness Status. Thirteenth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]]. **Completeness computation downstream of US 13.20 ([[project-prd1042-766]])**.

**Why:** November 2026 Foundation. UBOCompletenessService computes UBO Completeness Status (Complete / Partial / Missing) from captured DIRECT-ownership records; Validation & Gating Engine consumes → Defer (Partial) / Hard Block (Missing) where UBO completeness required and unmet. Ownership boundary: Partner surfaces status, Validation evaluates.

**How to apply:**

- **System/computation story** — Figma N/A (no node supplied); only FE surface is a Complete/Partial/Missing completeness badge on Partner detail. Drive scenarios from ACs; expect fewer UI-drivable scenarios.
- 8 ACs reconstructed. 5 given Gherkin (happy: AC-01 compute status from direct ownership → badge over 3 outcomes, AC-05 recompute-on-change near-real-time; main-error: AC-02+AC-03 Validation Hard Block on Missing / Defer on Partial where required, AC-04 indirect notes don't count toward completeness). Excluded edge-case: AC-06 badge visibility (bank-internal + Auditor, LC excluded), AC-07 service-interface surfacing, AC-08 UBOCompletenessChanged event. 0 blocked. 4 scenario blocks (2 Outlines + 2 Scenarios). 0 of 4 E2E-ready (needs seeded Partner + UBO-ownership fixtures + Validation gating; greenfield).
- **KEY RULE:** completeness computed from DIRECT ownership only — indirect-ownership notes (from US 13.20) do NOT satisfy automated completeness (OQ-03; recursive traversal deferred to Part B).
- **Role gating N/A** — compute action is all-system ("—" for every role in the matrix); only the read-only badge has a visibility rule (bank-internal + Auditor, LC excluded — classified edge-case). Power User (Bank Admin) enum-mapping note not applicable to a compute action.
- Completeness rule thresholds owned by Compliance configuration (assumption).

Related: [[project-prd1042-766]] (US 13.20 UBO capture feeds this), [[project-prd1042-750]] (Validation Defer pattern), [[feedback-manual-3-stage-pipeline]].
