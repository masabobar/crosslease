# PRD1042-72 — US 28.5 | USER MANAGEMENT | User Search & Filtering

Generated: 2026-06-02
Story: PRD1042-72 — US 28.5 | USER MANAGEMENT | User Search & Filtering
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (16 ACs, description present, stakeholder-reviewed, UAT ready)
ACs with Gherkin scenarios: 5 of 16 | Blocked: 0 | Excluded: 11 (edge-case or separate-feature — scope filter table only)
Figma design: Node 2117:11195, file j5hq5cQgHWdOtzLvSX0jvj — Screen "User Management (Default + Active Filters)" (Stage 2 PARTIAL — filter dropdown panels absent, page size selector absent, empty state absent, Quick Filter row in design does not match authoritative story spec)

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin is the wire value for Power User (Bank Admin) — user_type `bank_tenant`, tenant-scoped single-tenant administrator. Role filter dropdown now enumerates 7 values (Support User, System Admin, Bank Admin, Auditor, Front Office, Back Office/Risk, Leasing Company User) per story description AC-04 ("System Admin and Power User (Bank Admin) must be selectable as distinct role filters"). Happy-path Outline expanded to include Bank Admin as a distinct searcher role; tenant-isolation scenario (AC-08) explicitly anchors on Bank Admin's own-tenant-only scope.

---

## AC Scope Filter

| AC    | Description                                                                                                                                                   | Classification     | Rationale                                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Global Search — return matching users within authorized scope, server-side enforced                                                                           | `happy-path`       | Core success path: user enters search term, results scoped to authorized records                                                                                |
| AC-02 | Partial Matching — partial text returns partial matches without exposing unauthorized user existence                                                          | `edge-case`        | Search algorithm implementation detail; no separate UI state to verify E2E                                                                                      |
| AC-03 | Case Insensitivity — matching remains case-insensitive                                                                                                        | `edge-case`        | Search algorithm implementation detail; no separate UI state to verify E2E                                                                                      |
| AC-04 | Role Filtering — multi-select roles (7 values); Front Office + Back Office/Risk combination blocked; Bank Admin selectable as distinct role from System Admin | `main-error`       | Governance combination-block directly prevents an invalid filter action from completing; Bank Admin vs System Admin split verified as distinct filterable roles |
| AC-05 | Status Filtering — multi-select lifecycle statuses                                                                                                            | `edge-case`        | Filter variant; covered by combined filtering in AC-07; no dropdown panel designed (DG-02)                                                                      |
| AC-06 | Tenant Filtering — platform roles only, server-side enforced                                                                                                  | `edge-case`        | Server-side scoping rule; no dropdown designed; tenant context covered in AC-08 isolation test                                                                  |
| AC-07 | Combined Filtering — multiple filters applied cumulatively without bypassing visibility restrictions                                                          | `happy-path`       | Primary filter workflow; Screen 2 provides visual evidence of multi-filter chip state                                                                           |
| AC-08 | Tenant Isolation — unauthorized tenant users never appear in results; cross-tenant returns 404                                                                | `main-error`       | RefiNext domain rule: cross-tenant isolation enforced server-side; 404 pattern (not 403) applies                                                                |
| AC-09 | Auditor Expiry Enforcement — expired engagement revokes search access                                                                                         | `separate-feature` | Access lifecycle management belongs in auditor access/engagement spec, not search spec                                                                          |
| AC-10 | API Enforcement — unauthorized filters or scopes rejected or sanitized server-side                                                                            | `edge-case`        | Backend-only; no E2E UI scenario; covered by unit/integration tests                                                                                             |
| AC-11 | No Enumeration Leakage — system must not reveal whether unauthorized users exist                                                                              | `main-error`       | Security main error: zero-results wording is security-sensitive; must not disclose unauthorized user existence                                                  |
| AC-12 | Pagination Compatibility — page size 10/20/50/100 configurable; sorting + filtering together                                                                  | `edge-case`        | Pagination UX enhancement; page size selector not designed (DG-03)                                                                                              |
| AC-13 | Filter Persistence — filters may remain preserved during session navigation                                                                                   | `edge-case`        | Session UX enhancement; permissive AC wording ("may remain")                                                                                                    |
| AC-14 | Audit Logging — actor, timestamp, applied filters, tenant context, email search term logged                                                                   | `edge-case`        | Server-side logging; no UI to verify E2E; email audit logging is compliance-tracked via backend                                                                 |
| AC-15 | Governance Search Scope Preservation — historical visibility scope immutable, audit-reconstructible                                                           | `separate-feature` | Audit/governance reconstruction belongs in audit trail / compliance test suite                                                                                  |
| AC-16 | Export Scope Enforcement — exported data limited to authorized scope; all matching records, not only visible page                                             | `edge-case`        | Export is a secondary workflow; no export panel designed; export scope belongs in dedicated export spec                                                         |

**Gherkin generated for:** AC-01, AC-04, AC-07, AC-08, AC-11
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-02, AC-03, AC-05, AC-06, AC-09, AC-10, AC-12, AC-13, AC-14, AC-15, AC-16

---

## Scenarios summary

| Tag           | Scenario                                                                                            | AC    | Priority | E2E          |
| ------------- | --------------------------------------------------------------------------------------------------- | ----- | -------- | ------------ |
| `@happy-path` | Authorized search returns only in-scope users (Scenario Outline — 4 role variants incl. Bank Admin) | AC-01 | P0       | ✅           |
| `@happy-path` | Combined filters applied cumulatively yield intersected result set                                  | AC-07 | P0       | ✅           |
| `@main-error` | Front Office and Back Office/Risk role combination is blocked by governance rule                    | AC-04 | P0       | ✅           |
| `@main-error` | Tenant-scoped Bank Admin search never returns users from other tenants                              | AC-08 | P0       | ⚙️ needs D20 |
| `@main-error` | Zero-results response does not reveal whether unauthorized users exist                              | AC-11 | P0       | ✅           |

Active scenario blocks: 5 (2 Outlines + 3 Scenarios)
E2E automation candidates: 4 of 5 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.5 @p0
Feature: User Search and Filtering (US 28.5 — PRD1042-72)
  As a System Admin, Bank Admin (Power User), Support User, or Auditor
  I want to search and filter users based on specific criteria
  So that I can efficiently locate users, investigate access issues,
  and review role or tenant assignments within my authorized scope

  Background:
    Given the User Management page is accessible at "/platform-administration/user-management"
    And the authenticated user has access to the User Management section

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Verifies that global search returns only results within the authenticated
  # user's authorized scope. Server-side enforcement means the result set
  # must never include records outside the caller's permission boundary.
  # NOTE: Quick Filter row in design (Role, Tenant, MFA, Status, Last login)
  # does NOT match the authoritative story spec (First Name, Last Name, Email,
  # User Status, Tenant, Role, MFA Status). Scenarios use story-authoritative
  # field names. Design must be updated before these scenarios can be automated.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario Outline: Authorized search returns only in-scope users (AC-01)
    Given I am authenticated as a <role> user
    And at least one user matching "<search_term>" exists within my authorized scope
    When I enter "<search_term>" in the global search field on the User Management page
    And I execute the search
    Then the results table should display users matching "<search_term>"
    And every displayed user should be within my authorized scope
    And no user outside my authorized scope should appear in the results

    Examples:
      | role         | search_term     |
      | System Admin | john.doe        |
      | Bank Admin   | anna.mueller    |
      | Support User | jane.smith      |
      | Auditor      | tenant-user-001 |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07
  # Verifies that applying multiple Quick Filters simultaneously yields a
  # cumulative (AND-logic) result set and that the applied filter chips strip
  # reflects each active filter. Screen 2 provides visual evidence of this
  # state. Combined filters must not bypass visibility restrictions already
  # enforced by the user's role scope.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @p0 @e2e-ready
  Scenario: Combined filters applied cumulatively yield intersected result set (AC-07)
    Given I am authenticated as a Bank Admin
    And the Role filter dropdown enumerates exactly 7 values: "Support User", "System Admin", "Bank Admin", "Auditor", "Front Office", "Back Office / Risk", "Leasing Company User"
    And users with varying roles and MFA statuses exist in the system
    When I select "Support User" from the Role filter
    And I select "Enabled" from the MFA Status filter
    Then the results table should display only users who are both "Support User" role AND have MFA "Enabled"
    And the filter chips strip should show "Role: Support User" and "MFA: Enabled" as active chips
    And the Role filter button should display a badge showing the count of selected role values
    And the MFA filter button should display a badge showing the count of selected MFA values
    And the displayed results should remain within my Bank Admin tenant scope

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # The governance rule prohibits selecting Front Office and Back Office/Risk
  # simultaneously in the Role filter. This combination is mutually exclusive
  # and must be enforced at the filter level to prevent invalid result requests.
  # The Role filter dropdown enumerates 7 values, with System Admin and
  # Bank Admin (Power User) as distinct selectable roles per AC-04. No design
  # evidence exists for the UI treatment of the FO+BO/Risk block — the exact
  # error message or disabled-state behavior is an open question for BA/Designer.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario: Front Office and Back Office/Risk role combination is blocked by governance rule (AC-04)
    Given I am authenticated as a Bank Admin
    And the Role filter dropdown is open
    And the dropdown enumerates exactly 7 values: "Support User", "System Admin", "Bank Admin", "Auditor", "Front Office", "Back Office / Risk", "Leasing Company User"
    When I select "Front Office" from the Role multi-select
    And I attempt to also select "Back Office / Risk" from the Role multi-select
    Then the system should prevent the "Front Office" and "Back Office / Risk" combination from being applied simultaneously
    And the filter results or UI state should indicate that this role combination is not permitted
    And "System Admin" and "Bank Admin" should remain selectable as distinct role filter values

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # RefiNext domain rule: cross-tenant isolation is enforced server-side.
  # Bank Admin (Power User) is tenant-scoped (user_type bank_tenant, single
  # tenant). AC-08 states explicitly: "a Power User (Bank Admin) may search
  # only within its own tenant". A Bank Admin performing a search must never
  # see users from other tenants in results. The expected server response for
  # a cross-tenant request is 404 (not 403) per RefiNext tenant isolation
  # pattern — this prevents confirming the existence of users in unauthorized
  # tenants.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Tenant-scoped Bank Admin search never returns users from other tenants (AC-08)
    Given I am authenticated as a Bank Admin scoped to tenant "Tenant-A"
    And users exist in both "Tenant-A" and "Tenant-B"
    When I search for a user who exists only in "Tenant-B"
    Then the results table should display no results for that user
    And the response must not confirm or deny the existence of the "Tenant-B" user
    And no "Tenant-B" user should appear in the results at any page or sort order
    And the Bank Admin must not be able to select "Tenant-B" from the Tenant filter (Tenant filter is Platform-only per Filter Visibility Matrix)

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Security main error: when a search returns zero results, the system must
  # not reveal whether users matching the query exist but are outside the
  # caller's authorized scope. The zero-results message wording is
  # security-sensitive — it must be identical whether no matching users exist
  # at all or matching users exist but are inaccessible. No empty-state copy
  # is designed yet (DG-04, DG-05) — wording must be confirmed by BA before
  # automation. Wildcard enumeration attacks must also be blocked.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready
  Scenario: Zero-results response does not reveal whether unauthorized users exist (AC-11)
    Given I am authenticated as a Support User with limited tenant scope
    And a user matching "restricted-admin@platform.com" exists in an unauthorized scope
    When I search for "restricted-admin@platform.com" on the User Management page
    Then the results table should display zero results
    And the no-results message should NOT indicate that a matching user exists outside my scope
    And the no-results message should be identical in wording to a search for a non-existent user
```
