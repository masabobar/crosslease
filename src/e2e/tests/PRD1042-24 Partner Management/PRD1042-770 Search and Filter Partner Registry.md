# PRD1042-770 — US 13.23 | Partner Management | Search & Filter Partner Registry (Bank-Internal)

Generated: 2026-07-08
Story: PRD1042-770 — US 13.23 | Partner Management | Search & Filter Partner Registry (Bank-Internal)
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (14 ACs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 11 of 14 | Blocked: 0 | Excluded: 2 (edge-case — scope filter table only); AC-12 folded into AC-13
Figma design: Node 235:28523, file PQVvNvRcoFac0zdHGaLWCg — Screen "Registry search grid + filter bar" (Stage 2 PARTIAL — linked node is the 2nd E13 scope-legend card, not a screen frame; the grid/filter-bar frame could not be enumerated from the legend card. Scenarios driven from ACs.)

---

## AC Scope Filter

| AC    | Description                                                                                        | Classification | Rationale                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| AC-01 | Bank-internal roles search/filter the tenant-scoped registry by the six filter dimensions          | `happy-path`   | Core success flow — covered by the filter Outline; also the "no matches → empty state" scenario        |
| AC-02 | All filtering server-side against the tenant-scoped result set; no client-side scope widening      | `happy-path`   | Asserted in the happy-path Outline (results confined to the caller's tenant, server-side)              |
| AC-03 | Status filter — Draft / Pending Confirmation / Confirmed / Archived / Merged / Rejected            | `happy-path`   | Filter-type variant in the happy-path Outline                                                          |
| AC-04 | Role multi-enum filter (role flags)                                                                | `happy-path`   | Filter-type variant in the happy-path Outline                                                          |
| AC-05 | Country filter (ISO 3166-1)                                                                        | `happy-path`   | Filter-type variant in the happy-path Outline                                                          |
| AC-06 | KYC Outcome filter available only where the KYC module is active for the tenant                    | `happy-path`   | Conditional-rendering scenario (visible-when-active state)                                             |
| AC-07 | UBO Status filter — Complete / Partial / Missing                                                   | `happy-path`   | Filter-type variant in the happy-path Outline                                                          |
| AC-08 | Confirmation Status filter — Pending / Confirmed                                                   | `happy-path`   | Filter-type variant in the happy-path Outline                                                          |
| AC-09 | Invalid enum filter value → HTTP 400                                                               | `main-error`   | Server-side enum validation blocks a malformed query                                                   |
| AC-10 | Filters compose with AND semantics, validated server-side                                          | `happy-path`   | AND-composition scenario (intersection of two filters)                                                 |
| AC-11 | KYC Outcome filter suppressed for tenants with the KYC module deactivated                          | `happy-path`   | Conditional-rendering scenario (hidden-when-deactivated state); pairs with AC-06                       |
| AC-12 | Scope enforcement at the query layer before returning data                                         | `edge-case`    | Internal query-layer implementation detail; observed indirectly via the AC-13 tenant/LC isolation test |
| AC-13 | Results tenant-scoped; LC excluded from registry-wide search (US 13.24) → out-of-scope reads → 404 | `main-error`   | RefiNext tenant/role isolation — LC registry-wide read restricted to own scope, out-of-scope → 404     |
| AC-14 | Filtered query returns within 2s under normal load                                                 | `edge-case`    | Non-functional performance target; not an E2E functional assertion                                     |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-10, AC-11, AC-13
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-12, AC-14

---

## Scenarios summary

| Tag           | Scenario                                                                          | AC                                              | Priority | E2E                                              |
| ------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- | -------- | ------------------------------------------------ |
| `@happy-path` | FO filters the tenant-scoped registry by a single dimension (Outline — 6 filters) | AC-01, AC-02, AC-03, AC-04, AC-05, AC-07, AC-08 | P0       | ⚙️ needs seeded Partner registry fixtures        |
| `@happy-path` | Multiple filters compose with AND semantics (intersection)                        | AC-10                                           | P0       | ⚙️ needs seeded Partner registry fixtures        |
| `@happy-path` | KYC Outcome filter is conditionally rendered by module state (Outline — 2 states) | AC-06, AC-11                                    | P0       | ⚙️ needs E29 KYC module toggle + tenant fixtures |
| `@happy-path` | A search with no matches shows an empty state and no error                        | AC-01                                           | P1       | ⚙️ needs controlled/empty registry state         |
| `@main-error` | Invalid enum filter value returns HTTP 400                                        | AC-09                                           | P0       | ✅                                               |
| `@main-error` | LC user is excluded from registry-wide search; out-of-scope read returns 404      | AC-13                                           | P0       | ⚙️ needs LC user + own-submission fixtures       |

Active scenario blocks: 6 (3 Outlines + 3 Scenarios)
E2E automation candidates: 1 of 6 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.23 @p0
Feature: Search & Filter Partner Registry (US 13.23 — PRD1042-770)
  As a Front Office case worker
  I want to search and filter the Partner registry within my tenant by Status, Role, Country, KYC Outcome, UBO Status, and Confirmation Status
  So that I can find Partners for operational tasks efficiently

  Background:
    Given I am logged in as a Front Office case worker
    And I am on the Partner registry search page for my tenant
    And the registry contains Partners in multiple statuses, roles, countries, and UBO/confirmation states

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-03, AC-04, AC-05, AC-07, AC-08
  # A bank-internal role filters the tenant-scoped registry by each supported
  # dimension. Filtering is server-side and confined to the caller's tenant —
  # the result set never widens beyond the tenant regardless of the filter used.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-03 @ac-04 @ac-05 @ac-07 @ac-08 @p0
  Scenario Outline: FO filters the tenant-scoped registry by a single dimension (AC-01, AC-03, AC-04, AC-05, AC-07, AC-08)
    Given Partners exist in my tenant that match "<filter>" = "<value>"
    When I apply the "<filter>" filter with value "<value>"
    Then the results should contain only Partners where "<filter>" is "<value>"
    And every result should belong to my tenant
    And the query should be executed server-side

    Examples:
      | filter              | value                |
      | Status              | Confirmed            |
      | Status              | Pending Confirmation |
      | Role                | Lessee               |
      | Country             | DE                   |
      | UBO Status          | Complete             |
      | Confirmation Status | Pending              |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-10
  # Two active filters compose with AND semantics: the result set is the
  # intersection, validated server-side. Confirms filters narrow, never widen.
  # ---------------------------------------------------------------------------

  @happy-path @ac-10 @p0
  Scenario: Multiple filters compose with AND semantics (AC-10)
    Given Partners exist in my tenant with various Status and Country combinations
    When I apply the "Status" filter with value "Confirmed"
    And I apply the "Country" filter with value "DE"
    Then the results should contain only Partners that are both "Confirmed" and in "DE"
    And no result should match only one of the two filters

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06, AC-11
  # The KYC Outcome filter is conditionally rendered: present only where the
  # KYC module is active for the tenant, and suppressed (not merely disabled)
  # where the module is deactivated. Suppression must not widen results.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @ac-11 @p0
  Scenario Outline: KYC Outcome filter is conditionally rendered by module state (AC-06, AC-11)
    Given the KYC module is "<kyc_module_state>" for my tenant
    When I open the registry filter bar
    Then the "KYC Outcome" filter should be "<visibility>"

    Examples:
      | kyc_module_state | visibility |
      | active           | visible    |
      | deactivated      | hidden     |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01 (empty result of a valid search)
  # A valid search that matches nothing renders an empty state, not an error.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p1
  Scenario: A search with no matches shows an empty state and no error (AC-01)
    Given no Partner in my tenant matches "Status" = "Archived"
    When I apply the "Status" filter with value "Archived"
    Then I should see an empty-state message
    And no error should be displayed
    And the results list should be empty

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Enum filter values are validated server-side; a malformed value is rejected
  # with HTTP 400 rather than being silently ignored or widening the result set.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0 @e2e-ready
  Scenario: Invalid enum filter value returns HTTP 400 (AC-09)
    Given I am authenticated as a Front Office case worker
    When I GET "/api/partners?status=NOT_A_REAL_STATUS"
    Then the response status should be 400

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13 (RefiNext tenant/role isolation, auto-applied)
  # LC users are excluded from registry-wide search and confined to their own
  # submission scope (US 13.24). An out-of-scope read returns 404, not 403 —
  # the platform must not confirm the existence of out-of-scope Partners.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario: LC user is excluded from registry-wide search; out-of-scope read returns 404 (AC-13)
    Given I am logged in as a Leasing Company user
    And a Partner "P-OTHER" exists in the tenant registry outside my own-submission scope
    When I GET "/api/partners/P-OTHER"
    Then the response status should be 404
    And the response should not reveal that the Partner exists
```
