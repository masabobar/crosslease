# PRD1042-51 — US 28.13 | User Management | Leasing Company Access Restrictions

Generated: 2026-06-10
Story: PRD1042-51 — US 28.13 | User Management | Leasing Company Access Restrictions
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (13 ACs, description present, stakeholder-reviewed, Ready for Staging)
ACs with Gherkin scenarios: 5 of 13 | Blocked: 0 | Excluded: 8 (edge-case or separate-feature — scope filter table only)
Figma design: none — backend/access-restriction story, no UI frame linked (Stage 2 SKIPPED — design gap logged to terminal)

---

## AC Scope Filter

| AC    | Description                 | Classification     | Rationale                                                                                                             |
| ----- | --------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Limited Module Visibility   | `happy-path`       | LC user sees only allowed modules; navigation presence/absence is the core success flow. Testable via seeded LC user. |
| AC-02 | Restricted Modules Hidden   | `main-error`       | LC user blocked from an internal module via direct URL/API; backend-authoritative denial. Folds in AC-07 (API guard). |
| AC-03 | LG Scope Enforcement        | `main-error`       | LC data load returns only own-LG records; tenant-isolation domain rule (single own-LG-only assertion).                |
| AC-04 | No Cross-LG Access          | `main-error`       | Cross-LG access returns 404 (undiscoverable, not 403) per tenant-isolation domain rule.                               |
| AC-05 | Proposal-Based Actions      | `separate-feature` | Requires LC module (Refinancing Request + bank approval workflow) not built in Sprint 1. Future LC module sprint.     |
| AC-06 | No Direct State Changes     | `separate-feature` | Requires core business objects + approval gate from the LC module. Future sprint.                                     |
| AC-07 | Backend Enforcement         | `main-error`       | Manipulated API/direct-URL request rejected server-side. Covered by AC-02 (API block) and AC-13 (route block).        |
| AC-08 | Data Masking                | `edge-case`        | Field-level masking detail; depends on LC-visible record screens not built until the LC module ships.                 |
| AC-09 | No Inference of Hidden Data | `edge-case`        | Non-inferability via counts/metadata/errors/search; covered indirectly by the 404 cross-LG isolation assertion.       |
| AC-10 | Audit Logging               | `edge-case`        | Internal audit log format/immutability — not observable at the E2E layer. Implementation detail.                      |
| AC-11 | Session Revalidation        | `separate-feature` | Session lifecycle on scope change owned by US 28.10 Session Management (PRD1042-47); also timing-dependent.           |
| AC-12 | Export Restriction          | `separate-feature` | Requires LC-visible exportable data/documents from the LC module. Future sprint.                                      |
| AC-13 | Hidden Route Protection     | `main-error`       | Direct-URL/manipulated route to hidden functionality rejected before data exposure. Backend route guard negative.     |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-13 (AC-07 folded into AC-02 and AC-13)
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06, AC-08, AC-09, AC-10, AC-11, AC-12

---

## Scenarios summary

| Tag           | Scenario                                                                     | AC           | Priority | E2E          |
| ------------- | ---------------------------------------------------------------------------- | ------------ | -------- | ------------ |
| `@happy-path` | LC user navigation shows only allowed modules (Scenario Outline — 4 modules) | AC-01        | P0       | ✅           |
| `@main-error` | LC user cannot reach a restricted module via direct API (AC-02, AC-07)       | AC-02, AC-07 | P0       | ✅           |
| `@main-error` | LC user data load returns only own Leasing Company records (AC-03)           | AC-03        | P0       | ⚙️ needs D20 |
| `@main-error` | Cross-LG access returns 404 not 403 — undiscoverable (AC-04)                 | AC-04        | P0       | ⚙️ needs D20 |
| `@main-error` | LC user direct-URL access to hidden route is rejected (AC-13, AC-07)         | AC-13, AC-07 | P0       | ✅           |

Active scenario blocks: 5 (1 Outline + 4 Scenarios)
E2E automation candidates: 3 of 5 scenarios ✅

---

## Feature file

```gherkin
@rbac @tenant-isolation @us-28.13 @p0
Feature: Leasing Company Access Restrictions (US 28.13 — PRD1042-51)
  As a Leasing Company user
  I want my access strictly limited to my own Leasing Company and allowed modules
  So that internal bank logic, data, and other tenants remain fully isolated from me

  Background:
    Given a Leasing Company user "lc-a@lender-a.com" assigned to Leasing Company "LC-A" exists
    And the user is authenticated as a Leasing Company user

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # LC user navigation must expose only allowed modules. Internal bank modules
  # (Financing, Risk, Approval, Audit) must not appear. UI hiding is RBAC-derived;
  # backend block is the authoritative enforcement (covered in main-error below).
  # No Figma frame for LC nav — assertions target module presence/absence.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario Outline: LC user navigation shows only allowed modules (AC-01)
    Given I am logged in as Leasing Company user "lc-a@lender-a.com"
    When the application navigation loads
    Then I should see the "<allowed_module>" module
    And I should NOT see the "<restricted_module>" module

    Examples:
      | allowed_module       | restricted_module    |
      | Refinancing Requests | Financing            |
      | My Documents         | Risk                 |
      | My Requests          | Approval Workflows   |
      | Dashboard            | Audit Trail          |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-07
  # Restricted internal module must be inaccessible via direct API call, not only
  # hidden in the UI. Frontend restriction alone must not determine access; the
  # backend rejects the manipulated request server-side.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-07 @p0 @e2e-ready
  Scenario: LC user cannot reach a restricted module via direct API (AC-02, AC-07)
    Given I am logged in as Leasing Company user "lc-a@lender-a.com"
    When I send a GET request to the restricted endpoint "/api/v1/financings"
    Then the response status should be 403
    And the response body should NOT contain any financing records

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Scope enforcement: a data load for an LC user must return only records
  # belonging to their assigned Leasing Company. Needs a second seeded tenant/LG
  # (LC-B) to prove cross-LG records are excluded — depends on D20.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: LC user data load returns only own Leasing Company records (AC-03)
    Given a Leasing Company "LC-B" exists with its own refinancing requests
    And I am logged in as Leasing Company user "lc-a@lender-a.com"
    When I request the refinancing requests list
    Then every returned record should belong to Leasing Company "LC-A"
    And no record belonging to Leasing Company "LC-B" should be returned

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (tenant-isolation domain rule)
  # Cross-LG access must be blocked AND undiscoverable: the response must be 404,
  # not 403, so the LC user cannot infer that the other company's record exists.
  # Needs a second seeded LG (LC-B) with a known record id — depends on D20.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Cross-LG access returns 404 not 403 — undiscoverable (AC-04)
    Given a refinancing request "REQ-LCB-001" belongs to Leasing Company "LC-B"
    And I am logged in as Leasing Company user "lc-a@lender-a.com"
    When I send a GET request to "/api/v1/refinancing-requests/REQ-LCB-001"
    Then the response status should be 404
    And the response status should NOT be 403
    And the response body should NOT reveal that the record exists

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13, AC-07
  # Hidden functionality reached by direct URL / manipulated route must be
  # rejected before any restricted data is exposed. Backend route guard is
  # authoritative; no partial content may leak during the redirect/denial.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @ac-07 @p0 @e2e-ready
  Scenario: LC user direct-URL access to hidden route is rejected (AC-13, AC-07)
    Given I am logged in as Leasing Company user "lc-a@lender-a.com"
    When I navigate directly to the hidden route "/risk/scores"
    Then I should not be granted access to the route
    And no restricted risk or pricing content should be rendered
    And I should be redirected away from the hidden route
```
