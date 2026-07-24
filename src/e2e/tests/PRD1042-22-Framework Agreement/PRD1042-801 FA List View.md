# PRD1042-801 — US 11.3 | Framework Agreement | Framework Agreement List View & Search

Generated: 2026-07-23
Story: PRD1042-801 — US 11.3 | Framework Agreement | Framework Agreement List View & Search
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (12 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 7 of 12 | Blocked: 0 | Excluded: 5 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:9673 (FA list Design frame with Table 1:9695), file aQGn5OLEjEGJO7xGzFikP5. Design already reflects CR A1/A2/A3/A4: visible columns are Agreement | Leasing company | Status | Valid from — no Bank Entity, no Utilization %, no Limit Available/Breach flags. Status badges verbatim: Active, Suspended, Draft, Terminated. Breadcrumb: Home > Business configuration > Framework agreements. Stage 2 COMPLETE via REST /nodes fallback.
Updated per CR PRD1042-1495 (2026-07-23): Bank Entity column hidden (A4); Utilization %, Limit Available Flag, Limit Breach Flag columns hidden (A1, A3); Bank Entity filter removed from filter bar (A2). All four CR items already reflected in current Figma design.

---

## AC Scope Filter

| AC    | Description                                                                                               | Classification | Rationale                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| AC-01 | Role-scoped default view: Power User/BO-Risk see all states; FO sees Active only                          | `happy-path`   | Core list view behaviour; role-based scoping is primary tested concern                                        |
| AC-02 | LC user sees own-LC agreements only, limited summary; bank-internal pricing and Special Conditions hidden | `happy-path`   | LC isolation is an explicit acceptance criterion; verifiable via seeded data + DTO assertion                  |
| AC-03 | Default sort: Lifecycle Status (Active first) then Agreement Name ascending                               | `edge-case`    | Sort-order detail; implementation verification; not a user flow blocker                                       |
| AC-04 | Server-side pagination; max 50 rows per page                                                              | `edge-case`    | Pagination boundary; requires large data set seeding; low E2E value                                           |
| AC-05 | [CR A4] Bank Entity column hidden from list (hidden per CR — UI only)                                     | `happy-path`   | CR A4 confirmed change; assertion merged into AC-01 happy-path scenario                                       |
| AC-06 | [CR A1, A3] Utilization %, Limit Available Flag, Limit Breach Flag columns hidden                         | `happy-path`   | CR A1 + A3 confirmed changes; assertions merged into AC-01 happy-path scenario                                |
| AC-07 | [CR A2] Bank Entity filter removed from filter bar                                                        | `happy-path`   | CR A2 confirmed change; assertion merged into AC-01 happy-path scenario                                       |
| AC-08 | Filter combinations AND-evaluated; date-range start > end rejected; search whitespace trimmed             | `edge-case`    | Filter validation boundary; implementation detail; not a primary flow blocker                                 |
| AC-09 | LC cross-LC request → HTTP 403; bank-internal fields excluded from LC DTO                                 | `main-error`   | Directly relevant to LC isolation; testable with seeded second LC                                             |
| AC-10 | Limit Management read failure → Utilization columns display "—" gracefully                                | `edge-case`    | Graceful degradation requires fault injection; not observable via standard E2E                                |
| AC-11 | Auditor outside engagement window → HTTP 403                                                              | `edge-case`    | Requires D21 (AUDITOR_VALIDITY_MINUTES override); engagement-window timing not testable without clock control |
| AC-12 | Tenant in Suspended state → all list routes return 403                                                    | `main-error`   | Fail-closed gating; directly blocks all list access; tenant-level security boundary                           |

**Gherkin generated for:** AC-01, AC-02, AC-05, AC-06, AC-07, AC-09, AC-12
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04, AC-08, AC-10, AC-11

---

## Scenarios summary

| Tag           | Scenario                                                                               | AC                         | Priority | E2E |
| ------------- | -------------------------------------------------------------------------------------- | -------------------------- | -------- | --- |
| `@happy-path` | Role-scoped FA list with CR hidden columns (Scenario Outline — 3 variants)             | AC-01, AC-05, AC-06, AC-07 | P0       | ✅  |
| `@happy-path` | LC user sees own-LC limited summary; bank-internal pricing hidden                      | AC-02                      | P0       | ✅  |
| `@main-error` | LC user cross-LC attempt returns HTTP 403; bank-internal fields excluded from response | AC-09                      | P0       | ✅  |
| `@main-error` | Suspended tenant blocks all FA list routes with HTTP 403                               | AC-12                      | P0       | ✅  |

Active scenario blocks: 4 (3 Scenarios + 1 Outline)
E2E automation candidates: 4 of 4 scenarios ✅

---

## Feature file

```gherkin
@framework-agreement @us-11.3 @p0
Feature: Framework Agreement List View & Search (US 11.3 — PRD1042-801)
  As a Power User (Bank Admin) or Back Office / Risk user
  I want to view, filter, and search Framework Agreements within my tenant
  So that I can quickly locate agreements for review, lifecycle action, or operational diagnostics

  Background:
    Given the Framework Agreement module is active for the tenant
    And the tenant contains Framework Agreements in Draft, Active, and Suspended states

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-05, AC-06, AC-07
  # Each role sees the correct scope of agreements. Power User and BO/Risk
  # see all lifecycle states; Front Office sees Active only.
  # CR A4: Bank Entity column is NOT present in the list.
  # CR A1 + A3: Utilization %, Limit Available Flag, Limit Breach Flag columns
  # are NOT present (hidden per PO Sync 2026-07-20 decision).
  # CR A2: Bank Entity filter is NOT present in the filter bar.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-05 @ac-06 @ac-07 @p0 @e2e-ready
  Scenario Outline: Role-based FA list view shows correct scope and hidden CR columns (AC-01, AC-05, AC-06, AC-07)
    Given I am authenticated as a <role> user
    When I navigate to "Framework agreements" from Business configuration
    Then I see Framework Agreements with statuses: <visible_statuses>
    And the list table contains the columns "Agreement", "Leasing company", "Status", "Valid from"
    And the list table does NOT contain a "Bank Entity" column
    And the list table does NOT contain a "Utilization %" column
    And the list table does NOT contain a "Limit Available" column
    And the list table does NOT contain a "Limit Breach" column
    And the filter bar does NOT contain a "Bank Entity" filter

    Examples:
      | role                  | visible_statuses                    |
      | Power User (Bank Admin)| Draft, Active, Suspended, Terminated |
      | Back Office / Risk    | Draft, Active, Suspended, Terminated |
      | Front Office          | Active                              |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # LC users are scoped to their own Leasing Company. They see only agreements
  # bound to their LC, with a limited summary (identity, validity, available
  # volume). Bank-internal pricing (Effective Rate) and Special Conditions are
  # excluded from the LC user's DTO.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0 @e2e-ready
  Scenario: LC user sees own-LC agreement list with limited fields; bank-internal pricing is hidden (AC-02)
    Given I am authenticated as an LC User for "LC Test GmbH"
    And Framework Agreements exist for "LC Test GmbH" and for "LC Other GmbH"
    When I navigate to the Framework Agreement list
    Then I see only Framework Agreements associated with "LC Test GmbH"
    And I do NOT see Framework Agreements for "LC Other GmbH"
    And the list does NOT display the "Effective Rate" column
    And the list does NOT display the "Special Conditions" column

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # LC users receive HTTP 403 if they attempt to query Framework Agreements
  # outside their own LC scope. Bank-internal fields (pricing, governance
  # justifications) are excluded from the LC DTO at assembly layer.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0 @e2e-ready
  Scenario: LC user cross-LC query returns HTTP 403 (AC-09)
    Given I am authenticated as an LC User for "LC Test GmbH"
    And a Framework Agreement "RV-OTHER-001" exists for "LC Other GmbH"
    When I GET "/api/framework-agreements?lc=LC-OTHER-ID"
    Then the response status should be 403
    And the response body does not contain any agreement data for "LC Other GmbH"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # When the tenant is in Suspended state, all Framework Agreement list routes
  # return HTTP 403 (fail-closed gating). No list data is returned.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0 @e2e-ready
  Scenario: Suspended tenant blocks all FA list access with HTTP 403 (AC-12)
    Given the tenant is in Suspended state
    And I am authenticated as a Power User (Bank Admin)
    When I GET "/api/framework-agreements"
    Then the response status should be 403
```
