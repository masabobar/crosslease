# PRD1042-71 — US 28.4 | USER MANAGEMENT | User List View

Generated: 2026-06-03
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin is the tenant-scoped bank administrator (formerly "Power User"); System Admin (`system_admin`) is the platform-wide cross-tenant viewer. Jira description updated 2026-07-06 to split the previously combined "Power User / System Admin" role.
Story: PRD1042-71 — US 28.4 | User Management | User List View
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (14 ACs, description present, stakeholder-reviewed, UAT ready)
ACs with Gherkin scenarios: 9 of 14 | Blocked: 0 | Excluded: 5 (edge-case or separate-feature — scope filter table only)
Figma design: Node 2162:6928, file j5hq5cQgHWdOtzLvSX0jvj — Screen "Design" (Stage 2 PARTIAL — no role-variant nav, status badge variants unconfirmed, no read-only row variant, rate limit hit on sub-node text extraction)

---

## Role permission matrix (updated 2026-07-08)

| Wire value             | Display name            | User type         | Scope                        | List view access                                                |
| ---------------------- | ----------------------- | ----------------- | ---------------------------- | --------------------------------------------------------------- |
| `system_admin`         | System Admin            | `platform`        | Platform-wide (cross-tenant) | View all users across all tenants and roles                     |
| `bank_admin`           | Power User (Bank Admin) | `bank_tenant`     | Single tenant                | View users of own tenant only; cross-tenant → 404 or empty      |
| `support_user`         | Support User            | `platform`        | Cross-tenant, read-only      | View limited diagnostic fields across tenants; no modifications |
| `auditor`              | Auditor                 | `platform`        | Assigned tenant, read-only   | View users within assigned tenant during engagement only        |
| `front_office`         | Front Office            | `bank_tenant`     | Single tenant                | View limited operational users within own tenant                |
| `back_office`          | Back Office / Risk      | `bank_tenant`     | Single tenant                | View limited operational users within own tenant                |
| `leasing_company_user` | Leasing Company User    | `leasing_company` | LC context only              | Module completely invisible — no nav, no route, no placeholder  |

**Key distinction:** `system_admin` and `bank_admin` are shown as distinct roles in the list view per AC-05. Bank Admin can only see users within its own tenant; System Admin can see users across all tenants.

---

## AC Scope Filter

| AC    | Description                                                                                     | Classification     | Rationale                                                                                                                                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Display only users within authorized visibility scope                                           | `happy-path`       | Core success flow — 1 Scenario Outline covering System Admin (cross-tenant), Bank Admin (tenant-scoped), Support, Auditor roles showing scoped user records                                                                                                          |
| AC-02 | Tenant isolation — cross-tenant records hidden; server-side enforced                            | `main-error`       | Security invariant — cross-tenant API request must return 404 not 403 (tenant isolation domain rule); applies to Bank Admin and all tenant-scoped roles                                                                                                              |
| AC-03 | LC User denied — nav hidden, route blocked, no placeholder exposed                              | `main-error`       | Entire role blocked from module; 2 scenarios: nav entry absent + route access blocked                                                                                                                                                                                |
| AC-04 | Correct current status displayed per user lifecycle state                                       | `happy-path`       | Core list rendering — status column assertion included in AC-01 Outline examples                                                                                                                                                                                     |
| AC-05 | Role visible per permissions; 7 distinct role values displayed; FO + BO/Risk mutually exclusive | `happy-path`       | Role column must display all 7 distinct values (Support User, System Admin, Bank Admin, Auditor, Front Office, Back Office/Risk, Leasing Company User); System Admin and Bank Admin shown as distinct rows; exclusivity enforcement tested in User Create/Edit story |
| AC-06 | Sorting by name, role, status, tenant, last login                                               | `happy-path`       | Core interactive feature of the list — 1 scenario for sort trigger + result order validation                                                                                                                                                                         |
| AC-07 | Pagination — max 50 server-side; tamper-resistant tokens; oversized requests rejected           | `happy-path`       | Core navigation feature — 1 scenario for pagination interaction and server-cap enforcement                                                                                                                                                                           |
| AC-08 | Direct API enumeration blocked; backend scope enforced                                          | `edge-case`        | Backend/API-layer enforcement only; not verifiable at E2E UI layer; belongs in API integration test suite                                                                                                                                                            |
| AC-09 | Auditor access revoked immediately on engagement expiry                                         | `separate-feature` | Requires AUDITOR_VALIDITY_MINUTES env override (D21); belongs in auditor-access.spec.ts                                                                                                                                                                              |
| AC-10 | Support/Auditor cannot modify; modification actions unavailable                                 | `main-error`       | Directly blocks unauthorized modification; 1 scenario verifying action suppression                                                                                                                                                                                   |
| AC-11 | Access to User List View audit-logged (actor, timestamp, tenant, scope, type)                   | `edge-case`        | Backend audit trail; not verifiable at E2E UI layer; belongs in backend integration test suite                                                                                                                                                                       |
| AC-12 | Role exclusivity enforcement — FO + BO/Risk mutually exclusive; server-side                     | `separate-feature` | Assignment enforcement belongs to User Create/Edit story; not triggered from list view                                                                                                                                                                               |
| AC-13 | Governance lineage preserved — immutable point-in-time role/scope/tenant/approval               | `edge-case`        | Audit reconstruction; belongs in User Detail View (PRD1042-73) and audit trail features                                                                                                                                                                              |
| AC-14 | Export limited to authorized scope; cross-tenant blocked; server-validated; audit-logged        | `happy-path`       | Export button present in design; happy-path export trigger (1 scenario) + cross-tenant block as main-error (1 scenario)                                                                                                                                              |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-10, AC-14
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-08, AC-09, AC-11, AC-12, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                 | AC           | Priority | E2E          |
| ------------- | ---------------------------------------------------------------------------------------- | ------------ | -------- | ------------ |
| `@happy-path` | Authorized users see only their scoped user records (Scenario Outline — 4 roles)         | AC-01, AC-04 | P0       | ⚙️ needs D20 |
| `@happy-path` | Role column displays all 7 distinct role values including System Admin and Bank Admin    | AC-05        | P0       | ✅           |
| `@happy-path` | Sorting by column produces ordered results (AC-06)                                       | AC-06        | P0       | ✅           |
| `@happy-path` | Paginating through large user lists (AC-07)                                              | AC-07        | P0       | ✅           |
| `@happy-path` | Export trigger downloads records within authorized scope (AC-14)                         | AC-14        | P1       | ✅           |
| `@main-error` | Cross-tenant request returns 404 not 403 (AC-02) — Bank Admin cannot view Tenant B users | AC-02        | P0       | ⚙️ needs D20 |
| `@main-error` | User Management nav entry absent for Leasing Company User (AC-03)                        | AC-03        | P0       | ✅           |
| `@main-error` | Direct route access blocked for Leasing Company User (AC-03)                             | AC-03        | P0       | ✅           |
| `@main-error` | Support and Auditor see no modification actions in user rows (AC-10)                     | AC-10        | P0       | ✅           |
| `@main-error` | Cross-tenant export attempt blocked server-side (AC-14)                                  | AC-14        | P0       | ⚙️ needs D20 |

Active scenario blocks: 10 (2 Outlines + 8 Scenarios)
E2E automation candidates: 7 of 10 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.4 @p0
Feature: User List View (US 28.4 — PRD1042-71)
  As a System Admin (platform-wide) or Bank Admin (tenant-scoped)
  I want to view a centralized list of platform users
  So that I can manage user access, monitor account status, and review tenant and role assignments

  Background:
    Given the application is running and reachable
    And the User List View is accessible at "/users"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-04
  # Tests that each authorized role sees only their scoped user records and that
  # the correct lifecycle status is shown per user row.
  # System Admin (`system_admin`) is platform-wide and sees users across ALL tenants.
  # Bank Admin (`bank_admin`) is tenant-scoped and sees users of own tenant ONLY.
  # Design gap noted: status badge color variants for Expired/Locked/Archived not
  # confirmed in Figma; test asserts text label only.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-04 @p0
  Scenario Outline: Authorized users see only their scoped user records (AC-01, AC-04)
    Given I am logged in as <role> with wire value "<wire_value>"
    And Tenant A and Tenant B both exist with seeded users
    When I navigate to the User List View
    Then I should see a table of users within my <scope>
    And each user row should display a status from the allowed lifecycle states
    And I should not see users outside my authorized scope

    Examples:
      | role         | wire_value     | scope                             |
      | System Admin | system_admin   | platform-wide scope (all tenants) |
      | Bank Admin   | bank_admin     | own tenant only                   |
      | Support User | support_user   | authorized cross-tenant scope     |
      | Auditor      | auditor        | assigned tenant only              |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Role column must render all 7 distinct role display values per AC-05.
  # System Admin and Bank Admin must appear as distinct role rows (not combined).
  # Verified against the role permission matrix updated 2026-07-08.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0 @e2e-ready
  Scenario: Role column displays all 7 distinct role values including System Admin and Bank Admin (AC-05)
    Given I am logged in as a System Admin
    And the seeded user set contains at least one user for each of the 7 role wire values
    When I navigate to the User List View
    Then the Role column should display all of the following distinct role values:
      | display_value           | wire_value             |
      | System Admin            | system_admin           |
      | Power User (Bank Admin) | bank_admin             |
      | Support User            | support_user           |
      | Auditor                 | auditor                |
      | Front Office            | front_office           |
      | Back Office / Risk      | back_office            |
      | Leasing Company User    | leasing_company_user   |
    And System Admin and Power User (Bank Admin) rows should be shown as distinct roles

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # Tests that clicking a sortable column header reorders results correctly.
  # The table has column headers present in the design; sort direction toggle
  # is implied by the AC but no sort icon visible in extracted design metadata.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0 @e2e-ready
  Scenario: Sorting by column produces ordered results (AC-06)
    Given I am logged in as a Bank Admin
    And the User List View is displayed with multiple users
    When I click the "Name" column header to sort ascending
    Then the user rows should be ordered alphabetically by name ascending
    When I click the "Name" column header again to sort descending
    Then the user rows should be ordered alphabetically by name descending

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07
  # Tests that pagination controls work and that the backend enforces the 50-record
  # page cap. Server must reject oversized pagination requests.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @p0 @e2e-ready
  Scenario: Paginating through large user lists (AC-07)
    Given I am logged in as a Bank Admin
    And more than 50 users exist within my authorized scope
    When I navigate to the User List View
    Then the first page should show at most 50 user records
    And pagination controls should be visible ("Previous", page numbers, "Next")
    When I click "Next" to advance to the next page
    Then the next set of user records should be displayed
    And the URL or pagination token should update to reflect the current page

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-14
  # Tests that the export trigger initiates a download scoped to the authorized
  # visibility scope. Export button confirmed in design (Actions bar, far right).
  # Export format/dropdown not designed; test asserts download initiated only.
  # ---------------------------------------------------------------------------

  @happy-path @ac-14 @p1 @e2e-ready
  Scenario: Export trigger downloads records within authorized scope (AC-14)
    Given I am logged in as a Bank Admin
    And the User List View is displaying user records within my scope
    When I click the "Export" button in the Actions bar
    Then a file download should be initiated
    And the downloaded file should contain only users within my authorized scope

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Tenant isolation: a tenant-scoped user accessing the API with a cross-tenant
  # scope must receive 404, not 403. RefiNext domain rule: cross-tenant returns
  # 404 to prevent enumeration (not 403 which confirms record existence).
  # Bank Admin (`bank_admin`) is the primary tenant-scoped viewer per AC-02 and
  # must NOT be able to view users in other tenants. Front Office is included
  # to confirm the same rule applies to all tenant-scoped operational roles.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario Outline: Cross-tenant request returns 404 not 403 (AC-02)
    Given I am logged in as a <role> belonging to Tenant A
    When I send a GET request to "/api/v1/users" with a tenant scope for Tenant B
    Then the response status should be 404
    And the response should not be 403
    And the response body should not reveal any Tenant B user records

    Examples:
      | role         |
      | Bank Admin   |
      | Front Office |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (navigation)
  # The User Management module must be completely invisible to Leasing Company
  # Users — no nav entry, no route, no placeholder. Design shows a single admin
  # sidebar with no LC User variant; test is written against requirements only.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario: User Management nav entry absent for Leasing Company User (AC-03)
    Given I am logged in as a Leasing Company User
    When I view the application sidebar navigation
    Then I should not see a "User Management" navigation entry
    And I should not see any placeholder or greyed-out entry for User Management

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (direct route access)
  # Even without a nav link, a Leasing Company User must not access the route
  # directly. System must block without exposing an access-denied placeholder.
  # AMB-02: whether response is 404 or silent redirect — open question to BA.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario: Direct route access blocked for Leasing Company User (AC-03)
    Given I am logged in as a Leasing Company User
    When I navigate directly to "/users"
    Then I should not be shown the User List View
    And I should not see an access-denied placeholder for the User Management module
    And I should be redirected away or receive a 404 response

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Support Users and Auditors have read-only access. Modification actions
  # (edit, suspend, deactivate buttons) must not appear in their user rows.
  # Design gap noted: no read-only row variant designed; test written against AC.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0 @e2e-ready
  Scenario: Support and Auditor see no modification actions in user rows (AC-10)
    Given I am logged in as a <role>
    And the User List View is displayed with user records
    Then I should see user records in the table
    And I should not see any edit, suspend, or deactivate action controls in the user rows

    Examples:
      | role          |
      | Support User  |
      | Auditor       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14 (cross-tenant export blocked)
  # Export must be server-side validated. Any attempt to export beyond the
  # authorized scope must be rejected. Complements the happy-path export scenario.
  # Bank Admin (`bank_admin`) is the primary tenant-scoped role expected to
  # trigger this block — export must remain limited to own tenant.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: Cross-tenant export attempt blocked server-side (AC-14)
    Given I am logged in as a Bank Admin belonging to Tenant A
    When I send a POST request to the export endpoint with a scope covering Tenant B users
    Then the response status should be 403 or 400
    And the exported data should not contain any Tenant B user records
    And the export attempt should be audit-logged
```
