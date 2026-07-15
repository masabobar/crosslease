# PRD1042-747 — US 13.1 | Partner Management | Submit New Counterparty into Partner Registry

Generated: 2026-07-08
Story: PRD1042-747 — US 13.1 | Partner Management | Submit New Counterparty into Partner Registry
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (15 ACs reconstructed from AC-referenced functional/validation/behavior specs, description present, stakeholder-reviewed / Client Approved, Ready for DEV Review)
ACs with Gherkin scenarios: 8 of 15 | Blocked: 0 | Excluded: 7 (edge-case or separate-feature — scope filter table only)
Figma design: Node 235:28513, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope legend / cover)" (Stage 2 PARTIAL — claude.ai Figma MCP truncated the page tree to the cover slide; Partner Type selector, conditional anchor sets, inline match-feedback panel and validation-error frames not enumerated)

---

## AC Scope Filter

| AC    | Description                                                                                                 | Classification     | Rationale                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| AC-01 | On successful submission Partner persists with exactly one immutable Partner Internal ID (UUID)             | `happy-path`       | Core success outcome; covered by the primary submission Scenario Outline                                      |
| AC-02 | Tenant ID derived from authenticated session; cross-tenant write rejected at runtime (CP-10)                | `main-error`       | Tenant-isolation domain rule → 1 auto negative scenario (payload tenant ignored / cross-tenant write blocked) |
| AC-03 | FO selects Partner Type at submission; system presents conditional anchor set for the type                  | `happy-path`       | Core differentiator; exercised across all three Partner Types in the happy-path Outline                       |
| AC-04 | Submission missing a mandatory anchor for the selected type rejected before persistence (HTTP 400)          | `main-error`       | Directly blocks the primary create workflow; 1 Outline across the three types                                 |
| AC-05 | LEI format / check-digit failure (LegalEntity) → field-level validation error                               | `edge-case`        | Field-level format validation rule (ISO 17442 check digit); not a core-flow blocker                           |
| AC-06 | HRB (Handelsregister) format failure where Country = DE → field-level validation error                      | `edge-case`        | Country-conditional field-format validation rule                                                              |
| AC-07 | Deterministic matching invoked synchronously; identical inputs yield identical matching decisions           | `edge-case`        | Determinism/repeatability is a property/implementation detail; matching outcomes covered by AC-09/10/11       |
| AC-08 | IdentityResolutionPerformed event records matching evidence + classification (Exact / No Match / Ambiguous) | `edge-case`        | Internal audit/event emission format — not an observable E2E UI concern                                       |
| AC-09 | On No Match → Partner persisted as Draft, proceeds to confirmation (US 13.05)                               | `happy-path`       | Primary success path; merged into the happy-path submission Outline                                           |
| AC-10 | On Exact Match → existing canonical Partner returned; no duplicate canonical record (CP-1)                  | `main-error`       | Deduplication guard — blocks creation of a duplicate canonical Partner                                        |
| AC-11 | On Ambiguous → Partner enters Pending Confirmation; US 13.04 governs resolution                             | `main-error`       | Alternative matching outcome that blocks downstream progression; resolution flow is US 13.04                  |
| AC-12 | Role flags recorded at submission; risk-sensitive flags require Four-Eyes per US 13.06                      | `separate-feature` | Four-Eyes approval of risk-sensitive role flags is US 13.06 (own story/test file)                             |
| AC-13 | Only System Admin + Front Office may create/submit a Partner; other roles rejected (backend authz)          | `main-error`       | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403)                           |
| AC-14 | Synchronous matching round-trip target < 2s under normal load                                               | `edge-case`        | Non-functional performance/timing target — not a deterministic E2E assertion                                  |
| AC-15 | Partner Type immutable after first confirmation; change requires governed identity-change path              | `separate-feature` | Post-confirmation identity change is US 13.14 / 13.15 (own stories); out of scope for creation                |

**Gherkin generated for:** AC-01, AC-03, AC-09, AC-02, AC-04, AC-10, AC-11, AC-13
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06, AC-07, AC-08, AC-14 (edge-case); AC-12, AC-15 (separate-feature)

---

## Scenarios summary

| Tag           | Scenario                                                                                                  | AC                  | Priority | E2E                                     |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------- | -------- | --------------------------------------- |
| `@happy-path` | FO submits a new counterparty and it persists as Draft (Scenario Outline — 3 Partner Types)               | AC-01, AC-03, AC-09 | P0       | ⚙️ needs Partner test-data cleanup      |
| `@main-error` | Submission missing a mandatory anchor is rejected before persistence (Scenario Outline — 3 Partner Types) | AC-04               | P0       | ✅                                      |
| `@main-error` | Exact match returns the existing canonical Partner without creating a duplicate                           | AC-10               | P0       | ⚙️ needs seeded canonical Partner       |
| `@main-error` | Ambiguous match places the Partner into Pending Confirmation                                              | AC-11               | P0       | ⚙️ needs seeded near-duplicate Partners |
| `@main-error` | Tenant is derived from the session and cross-tenant write is rejected                                     | AC-02               | P0       | ⚙️ needs D20 (Tenant B)                 |
| `@main-error` | Only Front Office and System Admin may submit a Partner (Scenario Outline — 4 roles)                      | AC-13               | P0       | ⚙️ needs Power User role seed/mapping   |

Active scenario blocks: 6 (3 Outlines + 3 Scenarios)
E2E automation candidates: 1 of 6 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.1 @p0
Feature: Submit New Counterparty into Partner Registry (US 13.1 — PRD1042-747)
  As a Front Office case worker
  I want to submit a new counterparty into the Partner registry with the full Identity Anchor Set
  So that downstream Refinancing Request / Contract preparation can reference a single canonical Partner identity

  Background:
    Given the Partner registry is accessible
    And I am authenticated as a Front Office case worker in an active tenant with the Partner Management module enabled

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03, AC-09
  # FO selects a Partner Type, the type-specific conditional anchor set is
  # presented, and a fresh (no-match) submission persists as a Draft Partner
  # with a single immutable UUID and proceeds to confirmation (US 13.05).
  # Design note: form frames are PARTIAL in Figma; steps are driven from the ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @ac-09 @p0
  Scenario Outline: FO submits a new counterparty and it persists as Draft (AC-01, AC-03, AC-09)
    Given I select Partner Type "<partner_type>"
    And the conditional anchor set for "<partner_type>" is presented
    When I submit the full Identity Anchor Set with unique anchors that match no existing Partner
    Then deterministic matching returns "No Match"
    And the Partner is persisted as Draft with exactly one immutable Partner Internal ID
    And I proceed to the confirmation step (US 13.05)

    Examples:
      | partner_type   |
      | LegalEntity    |
      | NaturalPerson  |
      | SoleProprietor |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # A submission that omits a mandatory anchor for the selected Partner Type is
  # rejected before persistence (HTTP 400 + field-level error), so no partial
  # or invalid Partner ever reaches the registry.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario Outline: Submission missing a mandatory anchor is rejected before persistence (AC-04)
    Given I select Partner Type "<partner_type>"
    When I submit the anchor set omitting the mandatory field "<missing_field>"
    Then the submission is rejected with HTTP 400
    And a field-level validation error is shown for "<missing_field>"
    And no Partner is persisted

    Examples:
      | partner_type   | missing_field |
      | LegalEntity    | Legal Form    |
      | NaturalPerson  | Date of Birth |
      | SoleProprietor | Date of Birth |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Deterministic matching against the type-appropriate anchor set finds an
  # exact match on a strong anchor (LEI / VAT / HRB); the existing canonical
  # Partner is returned and no duplicate canonical record is created (CP-1).
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Exact match returns the existing canonical Partner without creating a duplicate (AC-10)
    Given a canonical Partner exists with a known strong anchor (LEI / VAT / HRB)
    When I submit a new counterparty whose anchors exactly match that Partner
    Then deterministic matching returns "Exact Match"
    And the existing canonical Partner is returned
    And no new canonical Partner record is created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # An ambiguous match (multiple candidate Partners) does not silently create a
  # record; the Partner enters Pending Confirmation and downstream progression
  # is blocked until resolution is governed by US 13.04.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Ambiguous match places the Partner into Pending Confirmation (AC-11)
    Given multiple candidate Partners exist that partially match the submitted anchors
    When I submit the new counterparty
    Then deterministic matching returns "Ambiguous"
    And the Partner enters status "Pending Confirmation"
    And downstream progression is blocked pending resolution (US 13.04)

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02 (tenant isolation, auto-applied domain rule)
  # The owning tenant is bound from the authenticated session, never from the
  # client payload; a payload asserting a different tenant is ignored and any
  # cross-tenant write is rejected at runtime (CP-10).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario: Tenant is derived from the session and cross-tenant write is rejected (AC-02)
    Given I am authenticated in Tenant A
    When I submit a new counterparty with a payload asserting Tenant B as the owning tenant
    Then the owning tenant is bound from my session (Tenant A), not from the payload
    And any attempt to write the Partner into Tenant B is rejected at runtime

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13 (role-based access, auto-applied domain rule)
  # Backend authorization is the boundary, not UI visibility. Only System Admin
  # and Front Office may create/submit a Partner via this path; every other role
  # (including LC User, whose path is proposal-only per US 13.02) is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario Outline: Only Front Office and System Admin may submit a Partner (AC-13)
    Given I am authenticated as a "<role>" user
    When I attempt to submit a new counterparty
    Then the request is rejected with HTTP 403
    And no Partner is created

    Examples:
      | role                    |
      | BO/Risk                 |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |
```
