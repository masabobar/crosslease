---
name: project-prd1042-749
description: US 13.3 Deterministic Identity Resolution (Epic 13 Partner Mgmt), DoR PASS, Figma PARTIAL, 3-stage manual flow, 4 scenario blocks, system/matching story with read-only match-evidence panel
metadata:
  type: project
---

PRD1042-749 — US 13.3 | Partner Management | Deterministic Identity Resolution. Second story processed under **Epic 13 Partner Management (PRD1042-24)**. First story generated under the new **3-stage manual flow** (no comparator) — see [[feedback-manual-3-stage-pipeline]].

**Why:** November 2026 Foundation. System/matching-engine story: MatchingService runs deterministic exact-match on LEI/VAT/HRB + simple legal-name similarity, classifying Exact / No Match / Ambiguous. Reproducibility per CP-3; fuzzy/ML matching deferred to Part B (OQ-09).

**How to apply:**

- Only manual-observable FE surface is a **read-only match-evidence panel** surfaced inside the creation (US 13.01) and identity-change (US 13.14) flows — no standalone form. Manual scenarios assert panel content (classification, matched anchors, confidence Definite/Probable/Possible).
- Many ACs are integration/system-level, NOT UI-drivable → classified edge-case (no Gherkin): AC-07 reproducibility (integration tests), AC-08 IdentityResolutionPerformed event payload, AC-09 no-fuzzy-matching (negative capability), AC-10 <1s NFR.
- 10 ACs reconstructed; 6 given Gherkin (happy: AC-01/02/04; main-error: AC-03/05/06); 4 excluded edge-case; 0 blocked. 4 scenario blocks (1 Outline over 3 classification outcomes + 3 Scenarios). Only 1 of 4 E2E-ready (LC-cannot-view-evidence, uses seeded LC user); Exact/Ambiguous + definite-duplicate need seeded Partner fixtures; cross-tenant needs D20.
- **Power User (Bank Admin) ambiguity carries over from 747:** view-matching-evidence matrix gives Power User "Diagnostic" access, but "Power User (Bank Admin)" still has no UserRole enum mapping (enum = system_admin, support_user, auditor, front_office, back_office, leasing_company_user). Flagged, not forced into Gherkin. Also: deterministic rule weights are platform config owned under governed Power User paths (assumption).
- Tenant-isolation here is a matching-scope concern (cross-tenant candidate → No Match), not a 403/404 read pattern — no CRITICAL.
- OQ-05 open: legal-name similarity threshold tenant-configurable vs fixed; recommendation fixed platform-wide for November to preserve CP-3.

Related: [[project-prd1042-747]], [[feedback-manual-3-stage-pipeline]], [[reference-jira]].
