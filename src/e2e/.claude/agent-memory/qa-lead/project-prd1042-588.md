---
name: project-prd1042-588
description: PRD1042-588 US 29.7 Tenant Suspension Flow — Stage 2 FAILED (Figma quota), Stage 3 WARNINGS, 5 scenario blocks, 6 ACs Blocked on PRD1042-77
metadata:
  type: project
---

# PRD1042-588 — US 29.7 Tenant Suspension Flow

**Processed:** 2026-07-07
**Epic:** PRD1042-40 (Epic 29 Tenant Management)
**Sub-stories:** PRD1042-704 (BE), PRD1042-705 (FE), PRD1042-706 (QA)
**Output file:** `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-588 Tenant Suspension.md`

## Pipeline results

- **Stage 1 (DoR):** PASS — 14 ACs, description present, stakeholder-reviewed, Jira status "QA in progress"
- **Stage 2 (Figma):** FAILED — Figma Professional plan quota exhausted (Retry-After ≈ 4 days on SUSPEND node 81:2893). MCP endpoints also blocked with quota error. REACTIVATE sibling section 84:5369 (cached from PRD1042-589) used as closest pattern reference.
- **Stage 3 (Comparison):** WARNINGS — 5 MAJOR design gaps (SUSPEND modal copy unfetched, Justification UI unverified, ERROR section unfetched, AC-05 in-flight read-only screen absent, AC-06 integration routing indicator likely no UI)
- **Stage 4 (BDD):** 5 scenario blocks (1 happy-path + 4 main-error, 3 Scenario Outlines + 2 Scenarios)

## AC classification

- **happy-path (1 scenario, covers 2 ACs):** AC-01 (initiate on Active), AC-03 (post-approval state)
- **main-error (4 scenarios):** AC-08 (Justification validation, 4-example Outline), AC-10 (non-Active → 422, 4-state Outline), AC-14 (non-admin → 404, 5-role Outline, `@e2e-ready`), AC-11 (self-countersign blocked, retained but Blocked)
- **Blocked (no Gherkin):** AC-02 (Four-Eyes countersign — PRD1042-77), AC-04 (in-flight non-cancellation — Workflow seam), AC-05 (read-only queue — Workflow UI), AC-06 (integration routing — harness), AC-11 (server enforcement — PRD1042-77), AC-12 (downstream event propagation — PRD1042-77 + User Mgmt contract + integration)
- **separate-feature (no Gherkin):** AC-07 (audit-during-suspended → Audit Trail feature), AC-09 (Effective From — DEFERRED per Ivan Mladenovic 2026-06-29, MVP always immediate), AC-13 (TENANT_SUSPENDED audit event — Audit Trail feature)

## Key stakeholder decisions preserved

- **Ivan Mladenovic 2026-06-29:** Effective From deferred for MVP → AC-09 = `separate-feature`
- **Philipp Maute 2026-07-01:** "System Admin" = platform-level Crosslease role, NOT bank-internal Power User — preserved in Gherkin comment blocks and Background
- **404-not-403 pattern** for AC-14 confirmed (RefiNext tenant-scope enumeration prevention)

## Blocking bugs

- **PRD1042-1100:** Pending module activation blocks suspension — happy-path fixture requires tenant with no pending activations
- **PRD1042-1102:** Cannot initiate from Tenant Management list page — happy-path scenario written against detail view only

## Design gaps (MAJOR)

- SUSPEND modal title / fields / buttons / post-submit copy — unfetched (pattern inferred from REACTIVATE 84:5369 but NOT cited as verbatim)
- Governance Justification field UI (min 30 chars) — also absent from REACTIVATE cache; may live on wizard step
- ERROR section (84:5372) — unknown content (rejection modal? dependency conflict? generic errors?)

## Tooling note

- Figma REST API Retry-After = 373791s (~4.3 days) on this fetch — confirms plan-quota exhaustion signal
- Figma MCP `get_metadata` and `get_design_context` both returned "MCP tool call limit for View seat on Professional plan"
- Next attempt possible after Figma budget window resets (est. ~4 days from 2026-07-07)

## Related memories

- [[project-prd1042-589]] — REACTIVATE sibling section on same canvas (84:5369) served as pattern analog
- [[project-prd1042-587]] — Deactivation flow, same fail-open UX contract pattern
- [[project-prd1042-77]] — Four-Eyes framework blocker (AC-02, AC-11)
