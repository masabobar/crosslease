---
name: project-prd1042-747
description: US 13.1 Submit New Counterparty (Partner Registry), first story of Epic 13 Partner Management, DoR PASS, Figma PARTIAL, WARNINGS, 6 scenario blocks, Power User has no create rights + no enum mapping
metadata:
  type: project
---

PRD1042-747 — US 13.1 | Partner Management | Submit New Counterparty into Partner Registry. First story processed under **Epic 13: Partner Management (PRD1042-24)** — a new epic area beyond Epic 28 User Management. Established test folder `src/e2e/tests/PRD1042-24 Partner Management/`.

**Why:** November 2026 Release Foundation (Sprint 1). FO submits a new Partner with the full Identity Anchor Set; deterministic matching runs synchronously before persistence (CP-3, Flow A). Partner Type discriminator (LegalEntity / NaturalPerson / SoleProprietor) drives a conditional anchor set (FieldSpec v4, additive).

**How to apply:**

- ACs are NOT explicitly numbered in Jira — they are embedded across Functional Requirements / Field Spec / Validation / System Behavior / Security sections with explicit references to AC-01, AC-02, AC-04–AC-08. Reconstructed a coherent 15-AC set preserving those references. Future E13 stories likely follow the same embedded-AC style.
- Pipeline: DoR PASS; Stage 2 Figma PARTIAL (claude.ai Figma MCP truncated the E13 file `PQVvNvRcoFac0zdHGaLWCg` tree to the cover slide node 235:28513 — a scope legend covering PRD1042-747/770/749/750/753/771; form frames not enumerable); Stage 3 WARNINGS (no CRITICAL); Stage 4 = 6 scenario blocks (3 Outlines + 3 Scenarios), 8 of 15 ACs given Gherkin, 0 Blocked, 7 excluded (edge-case/separate-feature).
- **Role deviation (important):** Per the story's permission matrix, only **System Admin + Front Office** may create/submit a Partner. **Power User (Bank Admin) create = ✗** — unlike User Management where Bank Admin is privileged. Also **"Power User (Bank Admin)" has no corresponding UserRole enum value** (enum = system_admin, support_user, auditor, front_office, back_office, leasing_company_user). Flag this mapping gap on any E13 role-access test. LC User create = proposal-only (US 13.02), so a direct-create by LC User is rejected here.
- **Matching outcomes** (deterministic, synchronous): No Match → Draft + confirmation (US 13.05, happy path); Exact Match → existing canonical returned, no duplicate (CP-1); Ambiguous → Pending Confirmation (US 13.04 governs resolution). Testing all three is in-scope, not edge-case explosion.
- **Tenant isolation ambiguity:** story says "cross-tenant write rejected (CP-10)" but does not specify 403 vs 404. This is a WRITE with tenant derived from session (payload injection), not a cross-tenant read, so the 404-not-403 domain rule does not cleanly apply — logged as ambiguity, not CRITICAL.
- **E2E infra gaps (greenfield epic, no fixtures yet):** happy-path create needs a Partner test-data cleanup/throwaway mechanism (analogous to D19) to avoid registry pollution + self-matching on re-runs; Exact/Ambiguous need seeded canonical/near-duplicate Partner fixtures; cross-tenant needs D20 (Tenant B). Only the missing-anchor 400 scenario is fully @e2e-ready (creates no data). 1 of 6 automation-ready.
- Deferred to Part B (post-November): country-conditional legal-entity identifier registry for non-DE (AT FN, CH UID, FR SIREN/SIRET, SE Organisationsnummer, VIES). November keeps HRB + VAT mandatory for DE, free-text foreign ID + country tag otherwise.

Related: [[reference-jira]], [[project-refinext-overview]], [[feedback-figma-design-convention]].
