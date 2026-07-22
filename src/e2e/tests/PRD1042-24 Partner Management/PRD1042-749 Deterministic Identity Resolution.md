# PRD1042-749 — US 13.3 | Partner Management | Deterministic Identity Resolution

Generated: 2026-07-08
Story: PRD1042-749 — US 13.3 | Partner Management | Deterministic Identity Resolution
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (10 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 6 of 10 | Blocked: 0 | Excluded: 4 (edge-case — scope filter table only)
Figma design: Node 235:28513, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope legend / cover)" (Stage 2 PARTIAL — system/matching story; only FE surface is a read-only match-evidence panel in creation/identity-change flows; its Exact/No Match/Ambiguous states not enumerable, MCP truncated to cover slide)

---

## AC Scope Filter

| AC    | Description                                                                                                      | Classification | Rationale                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | Matching runs synchronously on creation (US 13.01) and Identity Change commit (US 13.14), tenant-scoped registry | `happy-path`   | Observable via the creation flow: match-evidence panel surfaces a result on submission (identity-change trigger covered by US 13.14) |
| AC-02 | Rule set (exact LEI/VAT/HRB + simple legal-name similarity) outputs Exact / No Match / Ambiguous                 | `happy-path`   | Core behavior; exercised across all three classification outcomes in the happy-path Outline                                          |
| AC-03 | Definite duplicates auto-block at intake and route to deduplication governance (US 13.08, US 13.09)              | `main-error`   | Blocks the create workflow — a distinct, observable intake-block outcome                                                             |
| AC-04 | Match-evidence panel records Matched Anchors, Classification, Match Confidence (Definite/Probable/Possible)      | `happy-path`   | The read-only panel content is the observable assertion in the happy-path Outline                                                    |
| AC-05 | Matching evidence visible to bank-internal roles + Auditor only; never exposed to LC                             | `main-error`   | Role-based-access domain rule → 1 auto negative scenario (LC cannot view match evidence)                                             |
| AC-06 | Matching is tenant-scoped; cross-tenant candidates never considered (CP-10)                                      | `main-error`   | Tenant-isolation domain rule → 1 auto negative scenario (same anchor in another tenant yields No Match)                              |
| AC-07 | Identical inputs always produce identical decisions (CP-3); reproducibility verifiable by integration tests      | `edge-case`    | Reproducibility/determinism property; the story itself scopes this to integration tests, not manual UI                               |
| AC-08 | IdentityResolutionPerformed event carries matched anchors + classification                                       | `edge-case`    | Internal event payload / audit format — not an observable manual-UI concern                                                          |
| AC-09 | Probabilistic / fuzzy / ML matching is NOT invoked in November                                                   | `edge-case`    | Negative capability assertion; absence of fuzzy matching is an integration-level check, not a manual UI test                         |
| AC-10 | Deterministic match evaluation < 1s within November volume envelope                                              | `edge-case`    | Non-functional performance/timing target — not a deterministic manual assertion                                                      |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-03, AC-05, AC-06
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-07, AC-08, AC-09, AC-10 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                       | AC                  | Priority | E2E                               |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------- | -------- | --------------------------------- |
| `@happy-path` | Match-evidence panel surfaces the deterministic classification (Scenario Outline — 3 outcomes) | AC-01, AC-02, AC-04 | P0       | ⚙️ needs seeded Partner fixtures  |
| `@main-error` | Definite duplicate is auto-blocked at intake and routed to deduplication governance            | AC-03               | P0       | ⚙️ needs seeded canonical Partner |
| `@main-error` | LC users cannot view matching evidence                                                         | AC-05               | P0       | ✅                                |
| `@main-error` | Cross-tenant candidates are never considered by deterministic matching                         | AC-06               | P0       | ⚙️ needs D20 (Tenant B)           |

Active scenario blocks: 4 (1 Outline + 3 Scenarios)
E2E automation candidates: 1 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.3 @p0
Feature: Deterministic Identity Resolution (US 13.3 — PRD1042-749)
  As a bank-internal user working the Partner creation flow
  I want deterministic identity resolution surfaced as read-only match evidence
  So that one entity reliably maps to one canonical Partner

  Background:
    Given I am authenticated as a Front Office case worker in an active tenant with the Partner Management module enabled
    And I am in the Partner creation flow (US 13.01) where the read-only match-evidence panel is surfaced

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-04
  # On submission, deterministic matching runs synchronously against the
  # tenant-scoped registry and the read-only match-evidence panel surfaces the
  # classification, matched anchors, and confidence for each of the three
  # outcomes. Design note: panel frames are PARTIAL in Figma; steps driven from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-04 @p0
  Scenario Outline: Match-evidence panel surfaces the deterministic classification on submission (AC-01, AC-02, AC-04)
    Given the tenant registry <registry_state>
    When I submit a Partner with <anchor_input>
    Then deterministic matching runs synchronously against the tenant-scoped registry
    And the match-evidence panel shows classification "<classification>"
    And it lists the matched anchors "<matched_anchors>"
    And it shows match confidence "<confidence>"

    Examples:
      | registry_state                                  | anchor_input               | classification | matched_anchors | confidence |
      | has no entity matching the input                | a unique LEI               | No Match       | none            | n/a        |
      | has one entity with the same LEI                | that same LEI              | Exact          | LEI             | Definite   |
      | has two entities matching different anchors     | overlapping VAT and HRB    | Ambiguous      | VAT; HRB        | Possible   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # A definite-duplicate submission is auto-blocked at intake and routed to the
  # deduplication governance queue (US 13.08 / US 13.09) so no duplicate
  # canonical Partner is ever created.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Definite duplicate is auto-blocked at intake and routed to deduplication governance (AC-03)
    Given the tenant registry has a canonical Partner with a definite-duplicate anchor (LEI / VAT / HRB)
    When I submit a Partner whose anchor is a definite match to that Partner
    Then intake is auto-blocked
    And the submission is routed to deduplication governance (US 13.08, US 13.09)
    And no new canonical Partner is created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (role-based access, auto-applied domain rule)
  # Match evidence is a bank-internal + Auditor concern; a Leasing Company user
  # must never see matched anchors or classification.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @e2e-ready
  Scenario: LC users cannot view matching evidence (AC-05)
    Given I am authenticated as a Leasing Company (LC) user
    When I view a Partner within my permitted scope
    Then the match-evidence panel is not shown
    And matched anchors and classification are not exposed to me

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (tenant isolation, auto-applied domain rule)
  # Deterministic matching considers only the caller's tenant registry; an
  # identical anchor that exists only in another tenant must yield No Match and
  # must never surface the other tenant's Partner as a candidate.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Cross-tenant candidates are never considered by deterministic matching (AC-06)
    Given a canonical Partner with a given LEI exists only in Tenant B
    And I am authenticated in Tenant A
    When I submit a Partner with that same LEI in Tenant A
    Then deterministic matching considers only the Tenant A registry
    And the classification is "No Match"
    And the Tenant B Partner is never surfaced as a candidate
```
