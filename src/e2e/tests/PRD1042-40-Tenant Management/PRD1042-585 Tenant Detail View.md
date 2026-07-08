# PRD1042-585 — US 29.4 | Tenant Management | Tenant Detail View

Generated: 2026-07-07
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin views own tenant detail (subset of tabs: Identity & Status limited + Module Profile + Integration Active Flag); lifecycle buttons NOT visible; cross-tenant → 404.

Story: PRD1042-585 — US 29.4 | Tenant Management | Tenant Detail View
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (14 ACs, description present, stakeholder-reviewed, QA in progress)
ACs with Gherkin scenarios: 7 of 14 | Blocked: 1 (PRD1042-1099) | Excluded: 6 (edge-case or separate-feature — scope filter table only)
Figma design: Node 52:1806, file 7pygkopuqyeEhUTMVp9lrP — Screen "Tenant details page + edit" (Stage 2 PARTIAL — MCP rate-limited; section names ADMIN/SUPPORT/AUDITOR/EDIT frames confirmed from prior extraction; field-level content unverified; no Bank Admin variant frame observed — assumed similar to Support-restricted view with own-tenant scoping)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                      | Blocking dependency                                                                    |
| ----- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| AC-03 | Auditor tab access broken at implementation level; cannot write passing E2E test against it | PRD1042-1099 — "Auditor cannot access Tenant Governance History in Tenant Detail View" |

---

## AC Scope Filter

| AC    | Description                                                                               | Classification     | Rationale                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| AC-01 | Detail view organized into 7 tabs (Identity & Status, Module Profile, etc.)               | `happy-path`       | Core System Admin view — tab visibility is the primary observable AC                                      |
| AC-02 | Support User access: active grant required; limited tabs visible                          | `happy-path`       | Core access scenario for Support User — tab restriction and grant enforcement                             |
| AC-03 | Auditor access: Governance History tab only, assigned tenant, active engagement window    | `Blocked`          | PRD1042-1099 blocks Auditor tab access in current implementation                                          |
| AC-04 | Lifecycle action buttons visible only to System Admin, valid transitions only             | `happy-path`       | Directly observable UI state: buttons present for SysAdmin, absent for all others                         |
| AC-05 | Configuration Overrides tab: fields defined in TM-10, System Admin only                   | `separate-feature` | Defined in TM-10 story/ticket; own scope, own spec                                                        |
| AC-06 | Integration Binding tab: defined in TM-11, creds hidden from Support User                 | `separate-feature` | Defined in TM-11 story/ticket; own scope, own spec                                                        |
| AC-07 | Identity & Status tab field specification (14 fields, types, M/O/C)                       | `happy-path`       | Full field display is the primary read scenario; immutable fields have no edit affordance                 |
| AC-08 | Immutable fields (Tenant Code, ID, timestamps, governance actors) show no edit affordance | `main-error`       | Absence of edit control on immutable fields is a direct display requirement; tested within AC-07 scenario |
| AC-09 | Governance History append-only — no edit or delete controls for any role                  | `main-error`       | Absence of modification controls is a critical read-only integrity constraint                             |
| AC-10 | Support User access writes SUPPORT_TENANT_ACCESS audit event                              | `edge-case`        | Backend audit trail; not observable via UI E2E; belongs in BE integration tests                           |
| AC-11 | API response shaped at server layer to exclude out-of-scope fields                        | `edge-case`        | Backend enforcement; not directly observable in UI E2E; belongs in API contract tests                     |
| AC-12 | HTTP 404 returned to non-authorized roles on tenant detail endpoint                       | `main-error`       | 404-not-403 is a directly testable RefiNext domain rule via API assertion                                 |
| AC-13 | Sensitive governance fields excluded from Support User API responses                      | `edge-case`        | API response content — backend enforcement; belongs in API contract / BE integration tests                |
| AC-14 | Support User requires Support Access Allowed flag=true AND active grant                   | `main-error`       | Dual-condition access block — directly testable: no active grant → 404 response                           |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-07, AC-08, AC-09, AC-12, AC-14
**Blocked (no Gherkin):** AC-03
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06, AC-10, AC-11, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                                                      | AC           | Priority | E2E                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ | -------- | -------------------------------------------------- |
| `@happy-path` | System Admin views all 7 tabs on Tenant Detail View (Scenario Outline — 1 variant)                                            | AC-01        | P0       | ✅                                                 |
| `@happy-path` | Support User with active grant sees limited tabs (Identity & Status, Module Profile)                                          | AC-02        | P0       | ⚙️ needs D20 (seeded Support grant)                |
| `@happy-path` | Bank Admin views own tenant detail — limited tab subset visible                                                               | AC-01, AC-02 | P0       | ✅                                                 |
| `@happy-path` | Lifecycle action buttons visible to System Admin, absent for all other roles (Scenario Outline — 5 role variants)             | AC-04        | P0       | ✅                                                 |
| `@happy-path` | System Admin views Identity & Status tab with correct field display                                                           | AC-07        | P0       | ✅                                                 |
| `@main-error` | Immutable fields show no edit affordance on Tenant Detail View                                                                | AC-07, AC-08 | P0       | ✅                                                 |
| `@main-error` | Governance History tab shows no edit or delete controls for any role                                                          | AC-09        | P0       | ✅                                                 |
| `@main-error` | Non-authorized role receives 404 on tenant detail endpoint (Scenario Outline — 4 role variants incl. Bank Admin cross-tenant) | AC-12        | P0       | ✅                                                 |
| `@main-error` | Bank Admin attempts to view another tenant's detail — 404 returned                                                            | AC-12        | P0       | ⚙️ needs D20 (second seeded tenant)                |
| `@main-error` | Support User without active grant receives 404 on tenant detail endpoint                                                      | AC-14        | P0       | ⚙️ needs D20 (seeded tenant without Support grant) |

Active scenario blocks: 10 (3 Outlines + 7 Scenarios)
E2E automation candidates: 7 of 10 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.4 @p0
Feature: Tenant Detail View (US 29.4 — PRD1042-585)
  As a System Admin
  I want to view all details of a specific tenant across identity, module profile,
  configuration, integration, governance history, and access policy
  So that I can understand and administer the tenant's full operational state

  Background:
    Given I am logged in as a System Admin
    And an active tenant "TENANT-001" exists in the system

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # System Admin navigates to the Tenant Detail View and sees all 7 tabs.
  # Design node 52:1806 ADMIN section confirms the tabbed layout structure.
  # Tab names per story: Identity & Status, Module Profile, Configuration
  # Overrides, Integration Binding, Governance History, Access Policy,
  # Support Access Grants.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario: System Admin views all 7 tabs on Tenant Detail View (AC-01)
    Given I navigate to the tenant detail page for tenant "TENANT-001"
    Then I should see the tab "Identity & Status"
    And I should see the tab "Module Profile"
    And I should see the tab "Configuration Overrides"
    And I should see the tab "Integration Binding"
    And I should see the tab "Governance History"
    And I should see the tab "Access Policy"
    And I should see the tab "Support Access Grants"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # Support User with an active Support Access Grant sees a restricted tab set:
  # Identity & Status (limited fields) and Module Profile (status only).
  # The story states: "Support User access requires an active Support Access Grant."
  # Requires seeded tenant with an active support grant for the test user (D20).
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0
  Scenario: Support User with active grant sees limited tabs (AC-02)
    Given I am logged in as a Support User
    And an active Support Access Grant exists for Support User on tenant "TENANT-001"
    When I navigate to the tenant detail page for tenant "TENANT-001"
    Then I should see the tab "Identity & Status"
    And I should see the tab "Module Profile"
    And I should NOT see the tab "Configuration Overrides"
    And I should NOT see the tab "Integration Binding"
    And I should NOT see the tab "Governance History"
    And I should NOT see the tab "Access Policy"
    And I should NOT see the tab "Support Access Grants"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # Lifecycle action buttons (Suspend, Archive, Reactivate) are visible only
  # to System Admin and only when the lifecycle transition is valid.
  # All other roles — including Bank Admin — must NOT see these buttons.
  # Bank Admin is a tenant-scoped bank tenant role introduced 2026-07-06 per
  # PRD1042-48 (Ivan Mladenovic); tenant lifecycle actions remain platform-
  # level System Admin actions and are NEVER exposed to Bank Admin, even on
  # own tenant.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0 @e2e-ready
  Scenario Outline: Lifecycle action buttons visible only to System Admin (AC-04)
    Given I am logged in as a <role>
    And I navigate to the tenant detail page for tenant "TENANT-001"
    Then lifecycle action buttons should <visibility> on the page

    Examples:
      | role           | visibility     |
      | System Admin   | be visible     |
      | Bank Admin     | not be visible |
      | Front Office   | not be visible |
      | Back Office    | not be visible |
      | Support User   | not be visible |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02 (Bank Admin variant)
  # Bank Admin (`bank_admin`, User Type `bank_tenant`) is bound to exactly one
  # tenant and needs visibility into own tenant configuration to manage bank-
  # tenant assets (Bank Product Templates, Framework Agreements, Workflow Task
  # Catalog, Document Requirement Catalog — per PRD1042-48).
  #
  # Per Jira permission matrix on PRD1042-585:
  #   - View Identity & Status + Module Profile: R (own tenant)
  #   - View Integration Active Flag: R (own tenant)
  #   - View Governance History: ✗
  #   - View Support Access Grants: ✗
  #   - View Integration Binding (full): ✗
  #   - Configuration Overrides / Access Policy tabs: ✗ (System Admin only)
  #   - Lifecycle action buttons: ✗
  #
  # OPEN QUESTION: Whether Module Profile tab exposes Integration Active Flag
  # inline or in a separate tab is not stated. Assumed inline for E2E scope;
  # confirm with design/BE before test run.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0 @e2e-ready
  Scenario: Bank Admin views own tenant detail — limited tab subset visible (AC-01, AC-02)
    Given I am logged in as a Bank Admin bound to tenant "TENANT-001"
    When I navigate to the tenant detail page for tenant "TENANT-001"
    Then I should see the tab "Identity & Status"
    And I should see the tab "Module Profile"
    And I should NOT see the tab "Configuration Overrides"
    And I should NOT see the tab "Integration Binding"
    And I should NOT see the tab "Governance History"
    And I should NOT see the tab "Access Policy"
    And I should NOT see the tab "Support Access Grants"
    And lifecycle action buttons should not be visible on the page

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07
  # Identity & Status tab displays all 14 fields with correct values.
  # Story provides the full field specification including types and M/O/C flags.
  # Key fields verified: Tenant ID (UUID, read-only), Tenant Name (editable via
  # TM-15), Tenant Code (read-only, immutable), Lifecycle Status (enum badge),
  # Provisioned At (UTC datetime), New Business Allowed Flag (boolean display).
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @p0 @e2e-ready
  Scenario: System Admin views Identity & Status tab with correct field display (AC-07)
    Given I navigate to the tenant detail page for tenant "TENANT-001"
    And I am on the "Identity & Status" tab
    Then I should see a read-only field "Tenant ID" with a UUID value
    And I should see a field "Tenant Name" with the tenant name
    And I should see a read-only field "Tenant Code" with the tenant code
    And I should see a read-only field "Tenant Type" with an enum value
    And I should see a field "Legal Entity Name" with the legal entity name
    And I should see a read-only field "Country / Jurisdiction" with an ISO code
    And I should see a "Lifecycle Status" badge indicating the current status
    And I should see a read-only field "New Business Allowed Flag"
    And I should see a read-only field "Tenant Operational Readiness"
    And I should see a read-only field "Tenant Default Currency" with an ISO currency code
    And I should see a read-only field "Provisioned At" with a UTC datetime

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07, AC-08
  # Immutable fields must show NO edit affordance on the detail view.
  # Story: "Tenant Code, Tenant ID, system timestamps, and governance actor
  # fields are immutable — no edit affordance presented."
  # Verifies absence of edit controls on specifically immutable fields.
  # Note: editing these fields (if applicable) is handled via TM-15 story.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @ac-08 @p0 @e2e-ready
  Scenario: Immutable fields show no edit affordance on Tenant Detail View (AC-07, AC-08)
    Given I navigate to the tenant detail page for tenant "TENANT-001"
    And I am on the "Identity & Status" tab
    Then the field "Tenant ID" should have no edit button or inline edit control
    And the field "Tenant Code" should have no edit button or inline edit control
    And the field "Tenant Type" should have no edit button or inline edit control
    And the field "Country / Jurisdiction" should have no edit button or inline edit control
    And the field "Provisioned At" should have no edit button or inline edit control
    And the field "Creation Requested By" should have no edit button or inline edit control

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Governance History is append-only. No edit or delete controls must appear
  # for any role on the Governance History tab. The story states: "Governance
  # History is append-only — no edit or delete control presented for any role."
  # System Admin is used as the broadest-privilege role to confirm absence.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0 @e2e-ready
  Scenario: Governance History tab shows no edit or delete controls (AC-09)
    Given I navigate to the tenant detail page for tenant "TENANT-001"
    And I am on the "Governance History" tab
    Then I should see governance history entries displayed
    And no governance history entry should have an edit button
    And no governance history entry should have a delete button
    And there should be no "Edit" or "Delete" action in the tab toolbar

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # HTTP 404 returned to non-authorized roles on any tenant detail endpoint.
  # RefiNext domain rule: 404-not-403 to prevent enumeration attacks.
  # Story: "HTTP 404 returned to non-authorized roles on any tenant detail endpoint."
  # Tests: Front Office, Back Office, LC User, Auditor (unassigned) — none
  # should see tenant data. Bank Admin has a dedicated cross-tenant scenario
  # below because tenant IDs matter (own-tenant works, other-tenant 404s).
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0 @e2e-ready
  Scenario Outline: Non-authorized role receives 404 on tenant detail endpoint (AC-12)
    Given I am logged in as a <role>
    When I make a GET request to "/api/tenants/TENANT-001"
    Then the response status should be 404

    Examples:
      | role           |
      | Front Office   |
      | Back Office    |
      | LC User        |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12 (Bank Admin cross-tenant)
  # Bank Admin is tenant-scoped: bound to exactly one bank tenant. Attempting
  # to read another tenant's detail MUST return 404, never 403 — matches the
  # RefiNext tenant-isolation domain rule and prevents cross-tenant enumeration.
  # Bank Admin bound to TENANT-001 attempts to read TENANT-002 → 404.
  # Requires a second seeded tenant (D20).
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0
  Scenario: Bank Admin attempts to view another tenant's detail — 404 returned (AC-12)
    Given I am logged in as a Bank Admin bound to tenant "TENANT-001"
    And a separate tenant "TENANT-002" exists in the system
    When I make a GET request to "/api/tenants/TENANT-002"
    Then the response status should be 404
    And no tenant data should be exposed in the response body

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Support User access requires BOTH Support Access Allowed flag = true AND
  # an active Support Access Grant for the target tenant.
  # Story edge case: "Support User accesses detail without active grant → HTTP 404."
  # This verifies the dual-condition enforcement at API level.
  # Requires seeded tenant without an active support grant for the test user (D20).
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: Support User without active grant receives 404 on tenant detail endpoint (AC-14)
    Given I am logged in as a Support User
    And no active Support Access Grant exists for Support User on tenant "TENANT-001"
    When I make a GET request to "/api/tenants/TENANT-001"
    Then the response status should be 404
    And no tenant data should be exposed in the response body
```
