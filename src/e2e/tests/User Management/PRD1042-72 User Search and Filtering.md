# PRD1042-72 — US 28.5 | USER MANAGEMENT | User Search & Filtering

Generated: 2026-06-02
Story: PRD1042-72 — US 28.5 | USER MANAGEMENT | User Search & Filtering
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (16 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 5 of 16 | Blocked: 0 | Excluded: 11 (edge-case or separate-feature — scope filter table only)
Figma design: Node 2117:11195, file j5hq5cQgHWdOtzLvSX0jvj — Screen "User Management (Default + Active Filters)" (Stage 2 PARTIAL — filter dropdown panels absent, page size selector absent, empty state absent, Quick Filter row in design does not match authoritative story spec)

---

## AC Scope Filter

| AC | Description | Classification | Rationale |
|----|-------------|----------------|-----------|
| AC-01 | Global Search — return matching users within authorized scope, server-side enforced | `happy-path` | Core success path: user enters search term, results scoped to authorized records |
| AC-02 | Partial Matching — partial text returns partial matches without exposing unauthorized user existence | `edge-case` | Search algorithm implementation detail; no separate UI state to verify E2E |
| AC-03 | Case Insensitivity — matching remains case-insensitive | `edge-case` | Search algorithm implementation detail; no separate UI state to verify E2E |
| AC-04 | Role Filtering — multi-select roles; Front Office + Back Office/Risk combination blocked | `main-error` | Governance combination-block directly prevents an invalid filter action from completing |
| AC-05 | Status Filtering — multi-select lifecycle statuses | `edge-case` | Filter variant; covered by combined filtering in AC-07; no dropdown panel designed (DG-02) |
| AC-06 | Tenant Filtering — platform roles only, server-side enforced | `edge-case` | Server-side scoping rule; no dropdown designed; tenant context covered in AC-08 isolation test |
| AC-07 | Combined Filtering — multiple filters applied cumulatively without bypassing visibility restrictions | `happy-path` | Primary filter workflow; Screen 2 provides visual evidence of multi-filter chip state |
| AC-08 | Tenant Isolation — unauthorized tenant users never appear in results; cross-tenant returns 404 | `main-error` | RefiNext domain rule: cross-tenant isolation enforced server-side; 404 pattern (not 403) applies |
| AC-09 | Auditor Expiry Enforcement — expired engagement revokes search access | `separate-feature` | Access lifecycle management belongs in auditor access/engagement spec, not search spec |
| AC-10 | API Enforcement — unauthorized filters or scopes rejected or sanitized server-side | `edge-case` | Backend-only; no E2E UI scenario; covered by unit/integration tests |
| AC-11 | No Enumeration Leakage — system must not reveal whether unauthorized users exist | `main-error` | Security main error: zero-results wording is security-sensitive; must not disclose unauthorized user existence |
| AC-12 | Pagination Compatibility — page size 10/20/50/100 configurable; sorting + filtering together | `edge-case` | Pagination UX enhancement; page size selector not designed (DG-03) |
| AC-13 | Filter Persistence — filters may remain preserved during session navigation | `edge-case` | Session UX enhancement; permissive AC wording ("may remain") |
| AC-14 | Audit Logging — actor, timestamp, applied filters, tenant context, email search term logged | `edge-case` | Server-side logging; no UI to verify E2E; email audit logging is compliance-tracked via backend |
| AC-15 | Governance Search Scope Preservation — historical visibility scope immutable, audit-reconstructible | `separate-feature` | Audit/governance reconstruction belongs in audit trail / compliance test suite |
| AC-16 | Export Scope Enforcement — exported data limited to authorized scope; all matching records, not only visible page | `edge-case` | Export is a secondary workflow; no export panel designed; export scope belongs in dedicated export spec |

**Gherkin generated for:** AC-01, AC-04, AC-07, AC-08, AC-11
**Blocked (no scenarios generated):** none
**No Gherkin (edge-case or separate-feature):** AC-02, AC-03, AC-05, AC-06, AC-09, AC-10, AC-12, AC-13, AC-14, AC-15, AC-16

---

## Scenarios summary

| Tag | Scenario | AC | Priority |
|-----|----------|----|----------|
| `@happy-path` | Authorized search returns only in-scope users (Scenario Outline — 3 role variants) | AC-01 | P0 |
| `@happy-path` | Combined filters applied cumulatively yield intersected result set | AC-07 | P0 |
| `@main-error` | Front Office and Back Office/Risk role combination is blocked by governance rule | AC-04 | P0 |
| `@main-error` | Tenant-scoped user search never returns users from other tenants | AC-08 | P0 |
| `@main-error` | Zero-results response does not reveal whether unauthorized users exist | AC-11 | P0 |

Active scenario blocks: 5 (2 Outlines + 3 Scenarios)

---

## Feature file

```gherkin
@user-management @us-28.5 @p0
Feature: User Search and Filtering (US 28.5 — PRD1042-72)
  As a Power User / System Admin, Support User, or Auditor
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

  @happy-path @ac-01 @p0
  Scenario Outline: Authorized search returns only in-scope users (AC-01)
    Given I am authenticated as a <role> user
    And at least one user matching "<search_term>" exists within my authorized scope
    When I enter "<search_term>" in the global search field on the User Management page
    And I execute the search
    Then the results table should display users matching "<search_term>"
    And every displayed user should be within my authorized scope
    And no user outside my authorized scope should appear in the results

    Examples:
      | role               | search_term     |
      | Power User / Admin | john.doe        |
      | Support User       | anna.mueller    |
      | Auditor            | tenant-user-001 |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07
  # Verifies that applying multiple Quick Filters simultaneously yields a
  # cumulative (AND-logic) result set and that the applied filter chips strip
  # reflects each active filter. Screen 2 provides visual evidence of this
  # state. Combined filters must not bypass visibility restrictions already
  # enforced by the user's role scope.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @p0
  Scenario: Combined filters applied cumulatively yield intersected result set (AC-07)
    Given I am authenticated as a Power User / Admin
    And users with varying roles and MFA statuses exist in the system
    When I select "Support" from the Role filter
    And I select "Enabled" from the MFA Status filter
    Then the results table should display only users who are both "Support" role AND have MFA "Enabled"
    And the filter chips strip should show "Role: Support" and "MFA: Enabled" as active chips
    And the Role filter button should display a badge showing the count of selected role values
    And the MFA filter button should display a badge showing the count of selected MFA values
    And the displayed results should remain within my authorized scope

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # The governance rule prohibits selecting Front Office and Back Office/Risk
  # simultaneously in the Role filter. This combination is mutually exclusive
  # and must be enforced at the filter level to prevent invalid result requests.
  # No design evidence exists for the UI treatment of this block — the exact
  # error message or disabled-state behavior is an open question for BA/Designer.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Front Office and Back Office/Risk role combination is blocked by governance rule (AC-04)
    Given I am authenticated as a Power User / Admin
    And the Role filter dropdown is open
    When I select "Front Office" from the Role multi-select
    And I attempt to also select "Back Office / Risk" from the Role multi-select
    Then the system should prevent the "Front Office" and "Back Office / Risk" combination from being applied simultaneously
    And the filter results or UI state should indicate that this role combination is not permitted

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # RefiNext domain rule: cross-tenant isolation is enforced server-side.
  # A tenant-scoped user performing a search must never see users from other
  # tenants in results. The expected server response for a cross-tenant
  # request is 404 (not 403) per RefiNext tenant isolation pattern — this
  # prevents confirming the existence of users in unauthorized tenants.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Tenant-scoped user search never returns users from other tenants (AC-08)
    Given I am authenticated as a user scoped to tenant "Tenant-A"
    And users exist in both "Tenant-A" and "Tenant-B"
    When I search for a user who exists only in "Tenant-B"
    Then the results table should display no results for that user
    And the response must not confirm or deny the existence of the "Tenant-B" user
    And no "Tenant-B" user should appear in the results at any page or sort order

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

  @main-error @ac-11 @p0
  Scenario: Zero-results response does not reveal whether unauthorized users exist (AC-11)
    Given I am authenticated as a Support User with limited tenant scope
    And a user matching "restricted-admin@platform.com" exists in an unauthorized scope
    When I search for "restricted-admin@platform.com" on the User Management page
    Then the results table should display zero results
    And the no-results message should NOT indicate that a matching user exists outside my scope
    And the no-results message should be identical in wording to a search for a non-existent user
```

---

## Blockers and Gaps Summary

| Severity | Item | AC | Resolution required from |
|----------|------|----|--------------------------|
| CRITICAL | Quick Filter row in design (Role, Tenant, MFA, Status, Last login) does not match authoritative story spec (First Name, Last Name, Email, User Status, Tenant, Role, MFA Status). First Name, Last Name, and Email filters are absent from design; "Last login" filter is not in the authoritative list. Order is also wrong. Story explicitly states the Quick Filter list is closed. | AC-01, AC-04, AC-05, AC-06, AC-07 | Designer + BA — revise Quick Filter row to match story spec exactly; remove "Last login" from Quick Filter; add First Name, Last Name, Email filters before proceeding to automation sprint |
| MAJOR | No filter dropdown panel designed for Role, Status, Tenant, or MFA filters. Multi-select behavior, expanded state, and option lists are unspecified in design. | AC-04, AC-05, AC-06, AC-07 | Designer — provide expanded-state frames for each Quick Filter button |
| MAJOR | Page size selector absent from design. Story requires user-configurable 10/20/50/100 page sizes in pagination. | AC-12 | Designer — add page size selector component to pagination row |
| MAJOR | No empty state / zero-results state designed. Wording is security-sensitive for AC-11 (must not reveal unauthorized user existence). | AC-01, AC-11 | BA + Designer + Copywriter — specify neutral empty-state copy and design the empty state frame |
| MAJOR | No access-denied / expired-engagement state designed for Auditor whose engagement has expired. | AC-09 | Designer + BA — design error state for expired audit engagement scenario |
| MAJOR | Export button present but no export panel or scope confirmation dialog designed. Story requires export to cover all records matching filters, not only the visible page. Export format (CSV/XLSX/PDF) unspecified. | AC-16 | BA + Designer — specify export format, scope confirmation UX, and design the export dialog |
| MINOR | Actions column header still reads "table-header-text" (placeholder, not replaced in design). | — | Designer — replace placeholder with correct column header label |
| MINOR | Search field outer label reads "Description" (placeholder, not replaced in design). | AC-01 | Designer — replace placeholder label with correct field label |
| MINOR | Active filter chip date range appears in wrong order in design: "12 May 2026 - 12 Apr 2026" (end before start). | AC-07 | Designer — fix date chip to show start → end order |
| INFO | Governance role combination block (Front Office + Back Office/Risk) — UI treatment unspecified. Is it enforced at filter selection (UI prevents selecting both) or at results level (empty results with error)? | AC-04 | BA — specify the UI enforcement pattern and provide design before automation |
| INFO | Auditor expiry enforcement (AC-09) — full-page access denied, toast/banner, or redirect? No design evidence. | AC-09 | BA + Designer — specify UX treatment |
| INFO | Zero-results message exact copy not specified (security-sensitive for AC-11). | AC-11 | BA + Copywriter — confirm neutral wording |
| INFO | "Import users" and "Invite user" CTAs present in design but covered by no AC in this story. Confirm which story covers these. | — | BA — confirm owning story for Import and Invite actions |
| INFO | Export format and scope confirmation UX not specified in story or design. | AC-16 | BA — specify export format and confirm whether a dedicated export story exists |
```
