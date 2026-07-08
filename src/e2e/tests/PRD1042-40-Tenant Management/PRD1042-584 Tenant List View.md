# PRD1042-584 — US 29.3 | TENANT MANAGEMENT | Tenant List View & Search

Generated: 2026-07-06
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin has no cross-tenant visibility — the platform tenant list is System Admin + grant-scoped Support only.
Story: PRD1042-584 — US 29.3 | TENANT MANAGEMENT | Tenant List View & Search
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (17 ACs, description present, stakeholder-reviewed, QA in progress)
ACs with Gherkin scenarios: 6 of 17 | Blocked: 2 (PRD1042-1046) | Excluded: 9 (edge-case — scope filter table only)
Figma design: Node 9:6160, file 7pygkopuqyeEhUTMVp9lrP — Screen "Tenant List View" (Stage 2 FAILED — MCP rate-limited, Bash/curl unavailable; no design evidence extracted)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                | Blocking dependency                                         |
| ----- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| AC-08 | Module selector filter cannot be tested — feature not yet implemented | PRD1042-1046 — "Active Module filter is missing" (open bug) |
| AC-09 | Module Active boolean filter cannot be tested — same missing feature  | PRD1042-1046 — "Active Module filter is missing" (open bug) |

---

## AC Scope Filter

| AC    | Description                                                                                                  | Classification | Rationale                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| AC-01 | System Admin sees all tenants across all lifecycle states                                                    | `happy-path`   | Core success flow; Admin list must be non-empty and span all states                            |
| AC-02 | Support User sees only tenants with an active, non-expired Support Access Grant                              | `happy-path`   | Core success flow for second authorized role; scoped visibility is the defining behaviour      |
| AC-03 | Default sort: Tenant Name ascending                                                                          | `edge-case`    | UI ordering detail; not a workflow blocker; verifying sort direction is a visual assertion     |
| AC-04 | List columns: Tenant Name (link), Tenant Code, Tenant Type, Lifecycle Status badge, Module Count, Created At | `happy-path`   | Column presence directly confirms the list renders correctly; linked with AC-01/AC-02          |
| AC-05 | Lifecycle Status filter (multi-select): Draft/Provisioning, Active, Suspended, Archived                      | `happy-path`   | Core filter workflow — applying a status filter must narrow the list; primary Admin action     |
| AC-06 | Tenant Type filter (multi-select): Bank, Bank Entity, Bank Branch Group                                      | `edge-case`    | Same filter mechanism as AC-05; redundant at E2E layer — one filter type is sufficient         |
| AC-07 | Country/Jurisdiction filter (multi-select): ISO country code list                                            | `edge-case`    | Third filter variation; same mechanism; not a blocking workflow concern                        |
| AC-08 | Module selector (enum): required when Module Active filter is used                                           | `Blocked`      | PRD1042-1046 — Active Module filter not yet implemented                                        |
| AC-09 | Module Active boolean filter: true=active module tenants, false=inactive module tenants                      | `Blocked`      | PRD1042-1046 — Active Module filter not yet implemented                                        |
| AC-10 | Creation Date Range filter (from/to)                                                                         | `edge-case`    | Date range is a filter variation; same mechanism as AC-05; not blocking                        |
| AC-11 | Pagination: max 50 rows; server-generated cursor tokens; tampered token returns 400                          | `edge-case`    | Cursor token tampering requires crafting invalid tokens — server-side detail; not standard E2E |
| AC-12 | Scope enforcement at query layer — no post-query filtering                                                   | `edge-case`    | Backend implementation rule; not directly assertable at UI layer                               |
| AC-13 | Support User with no active grants receives empty list, not an error                                         | `main-error`   | Blocks Support User from seeing any data; empty state vs error page is a critical distinction  |
| AC-14 | Support User list access writes SUPPORT_LIST_ACCESS audit event                                              | `edge-case`    | Backend audit log; not assertable at UI layer without privileged API access                    |
| AC-15 | Suspended and Archived tenants have muted/differentiated visual styling                                      | `edge-case`    | Visual styling detail; design not confirmed (Stage 2 FAILED); not a workflow blocker           |
| AC-16 | Tenant list endpoint returns HTTP 404 to non-authorized roles (FO, BO, LC User, Bank Admin, Auditor)         | `main-error`   | RefiNext 404-not-403 domain rule; unauthorized access must be hard-blocked and non-enumerable  |
| AC-17 | Sequential identifier enumeration prevented by server-authoritative scope filtering                          | `edge-case`    | Security implementation detail; requires crafting enumeration attacks — not standard E2E       |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-05, AC-13, AC-16
**Blocked (no Gherkin):** AC-08, AC-09
**No Gherkin (edge-case or separate-feature):** AC-03, AC-06, AC-07, AC-10, AC-11, AC-12, AC-14, AC-15, AC-17

---

## Scenarios summary

| Tag           | Scenario                                                                               | AC           | Priority | E2E                           |
| ------------- | -------------------------------------------------------------------------------------- | ------------ | -------- | ----------------------------- |
| `@happy-path` | System Admin views tenant list with all columns rendered (Scenario Outline — 4 states) | AC-01, AC-04 | P0       | ✅                            |
| `@happy-path` | Support User views scoped tenant list matching active grant                            | AC-02, AC-04 | P0       | ⚙️ needs seeded Support Grant |
| `@happy-path` | System Admin filters list by Lifecycle Status                                          | AC-05        | P0       | ✅                            |
| `@main-error` | Support User with no active grants sees empty list not error                           | AC-13        | P0       | ⚙️ needs seeded Support Grant |
| `@main-error` | Unauthorized roles receive 404 on tenant list endpoint (Scenario Outline — 5 roles)    | AC-16        | P0       | ✅                            |

Active scenario blocks: 5 (2 Outlines + 3 Scenarios)
E2E automation candidates: 3 of 5 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.3 @p0
Feature: Tenant List View & Search (US 29.3 — PRD1042-584)
  As a System Admin
  I want to view, filter, and search all tenants
  So that I can quickly locate and navigate to tenants for administrative purposes

  Background:
    Given the application is running and accessible
    And at least one tenant exists in each lifecycle state: Draft, Active, Suspended, Archived

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-04
  # System Admin accesses the tenant list and all mandatory columns are rendered.
  # Tests that the list loads, columns are present, and tenant name links are visible.
  # Design extraction failed; column presence asserted against AC-04 specification.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-04 @p0 @e2e-ready
  Scenario Outline: System Admin sees tenant list with all required columns (AC-01, AC-04)
    Given I am logged in as a System Admin
    When I navigate to the tenant list page
    Then I should see a list of tenants
    And the list should contain a tenant with lifecycle status "<status>"
    And each row should display a "Tenant Name" column rendered as a clickable link
    And each row should display a "Tenant Code" column
    And each row should display a "Tenant Type" column
    And each row should display a "Lifecycle Status" badge column
    And each row should display an "Active Module Count" column
    And each row should display a "Created At" column

    Examples:
      | status            |
      | Active            |
      | Suspended         |
      | Draft             |
      | Archived          |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02, AC-04
  # Support User with an active, non-expired Support Access Grant sees only
  # the tenants within their grant scope — not all tenants.
  # Requires a seeded Support Grant tied to a specific tenant to be testable.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @ac-04 @p0
  Scenario: Support User sees only tenants within active grant scope (AC-02, AC-04)
    Given I am logged in as a Support User
    And an active, non-expired Support Access Grant exists for my identity scoped to tenant "GRANT_TENANT_001"
    When I navigate to the tenant list page
    Then I should see tenant "GRANT_TENANT_001" in the list
    And I should NOT see tenants outside my active grant scope
    And each visible row should display a "Tenant Name" column rendered as a clickable link
    And each visible row should display a "Tenant Code" column
    And each visible row should display a "Lifecycle Status" badge column

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # System Admin applies a Lifecycle Status filter; the list narrows to matching tenants.
  # Filter panel must present multi-select values; applying a filter must update the list.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0 @e2e-ready
  Scenario: System Admin filters tenant list by Lifecycle Status (AC-05)
    Given I am logged in as a System Admin
    And tenants exist with lifecycle status "Active" and "Suspended"
    When I navigate to the tenant list page
    And I apply the Lifecycle Status filter with value "Active"
    Then I should only see tenants with lifecycle status "Active" in the list
    And tenants with lifecycle status "Suspended" should NOT appear in the list

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Support User with NO active grant receives an empty list, not an error page.
  # This is the "graceful degradation" check — an empty state must render.
  # Requires a Support User seeded with no active grants.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario: Support User with no active grants sees empty list not error (AC-13)
    Given I am logged in as a Support User
    And no active Support Access Grant exists for my identity
    When I navigate to the tenant list page
    Then I should see an empty list state
    And I should NOT see an error message or error page
    And I should NOT see any tenant rows

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16
  # RefiNext 404-not-403 domain rule: non-authorized roles must receive HTTP 404
  # on the tenant list endpoint — not 403 — to prevent tenant enumeration.
  # Tests Front Office, Back Office, LC User, Bank Admin, and Auditor in one Outline.
  # Bank Admin (bank_admin, bank_tenant) is a tenant-level role with no cross-tenant
  # visibility — the platform tenant list is System Admin + grant-scoped Support only
  # (per PRD1042-48, Ivan Mladenovic 2026-07-06). Auditor also excluded per permission matrix.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @p0 @e2e-ready
  Scenario Outline: Unauthorized roles receive 404 on tenant list endpoint (AC-16)
    Given I am logged in as a "<role>" user
    When I request the tenant list endpoint "GET /api/tenants"
    Then the response status should be 404
    And the response should NOT be 403

    Examples:
      | role          |
      | Front Office  |
      | Back Office   |
      | LC User       |
      | Bank Admin    |
      | Auditor       |
```
