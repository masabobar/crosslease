# PRD1042-592 — US 29.11 | Tenant Management | Tenant Integration Binding Management

Generated: 2026-07-07
Story: PRD1042-592 — US 29.11 | Tenant Management | Tenant Integration Binding Management
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (13 derived ACs, description present with permission matrix + field spec + validation rules + audit spec + security block + edge cases, QA ready)
ACs with Gherkin scenarios: 6 of 13 | Blocked: 1 (TM-09 archiving flow) | Excluded: 6 (edge-case or separate-feature — scope filter table only)
Figma design: No Figma URL linked to story; backend/integration story with no dedicated screen frame (Stage 2 FAILED — design-blind; pattern matches [[project-prd1042-46]], [[project-prd1042-47]], [[project-prd1042-69]] backend security stories)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                    | Blocking dependency                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| AC-03 | Archived tenant binding decommission + credential invalidation + inbound reject is a TM-09 side effect; requires archiving flow trigger + credential-invalidation fixture | TM-09 (archiving flow) + D-Integration (credential-invalidation observability) |

---

## AC Scope Filter

| AC    | Description                                                                                                        | Classification     | Rationale                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| AC-01 | One integration binding per tenant (V1); multiple bindings not supported                                           | `main-error`       | Covered via AC-04 (409 on second binding attempt) — same rule expressed as validation                            |
| AC-02 | Suspended tenant: inbound event processing continues; outbound triggers blocked                                    | `separate-feature` | Event routing behavior owned by Integration / Disbursement epic; requires event-bus fixture harness (D-EventBus) |
| AC-03 | Archived tenant: binding decommissioned, credentials invalidated, inbound rejected                                 | `Blocked`          | Decommission is a TM-09 side effect requiring archiving trigger + credential-invalidation observability          |
| AC-04 | Only one binding per tenant → 409 on second creation attempt                                                       | `main-error`       | Direct uniqueness constraint; blocks core workflow                                                               |
| AC-05 | Binding creation/modification only permitted on Active tenants (Draft/Suspended/Archived rejected)                 | `main-error`       | State-guard validation; blocks core workflow                                                                     |
| AC-06 | Archived tenant binding is read-only; modification returns 422                                                     | `main-error`       | Immutability guard; blocks modification attempts                                                                 |
| AC-07 | Endpoint URL must be valid HTTPS URL                                                                               | `edge-case`        | Client-side format validation; standard URL parser test — not core workflow                                      |
| AC-08 | Governance Justification required on create/modify, min 20 chars                                                   | `edge-case`        | Standard field-validation rule; short-input rejection well-covered by other governance-justification stories     |
| AC-09 | Only System Admin can create/modify binding; other roles rejected                                                  | `main-error`       | RBAC enforcement; 404-not-403 pattern for tenant-scoped resource                                                 |
| AC-10 | System Admin + Support can view binding; Support view masks Endpoint URL + Credential Scope                        | `happy-path`       | Core view flow with role-conditional response shaping (positive assertion for both roles + masked-field check)   |
| AC-11 | Cross-tenant access denied — Tenant B admin cannot view/modify Tenant A binding (tenant isolation)                 | `main-error`       | RefiNext tenant-isolation rule: 404-not-403 on out-of-tenant read                                                |
| AC-12 | Audit events INTEGRATION_BINDING_CREATED / MODIFIED / DECOMMISSIONED emitted with actor, changed fields, timestamp | `separate-feature` | Audit-log delivery + schema owned by Audit epic; requires D-Audit fixture harness                                |
| AC-13 | Inbound event for Archived tenant → HTTP 4xx + operational alert raised                                            | `separate-feature` | Event routing + alerting owned by Integration/Disbursement epic + observability stack                            |

**Gherkin generated for:** AC-04, AC-05, AC-06, AC-09, AC-10, AC-11
**Blocked (no Gherkin):** AC-03
**No Gherkin (edge-case or separate-feature):** AC-01, AC-02, AC-07, AC-08, AC-12, AC-13

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.** Never interleave.

| Tag           | Scenario                                                                                    | AC           | Priority | E2E                                           |
| ------------- | ------------------------------------------------------------------------------------------- | ------------ | -------- | --------------------------------------------- |
| `@happy-path` | System Admin creates integration binding on Active tenant                                   | AC-05, AC-10 | P0       | ⚙️ needs binding fixture                      |
| `@happy-path` | View binding: System Admin sees full fields; Support sees masked fields (Outline — 2 roles) | AC-10        | P0       | ⚙️ needs binding fixture                      |
| `@main-error` | Second binding creation attempt on same tenant returns 409                                  | AC-04, AC-01 | P0       | ⚙️ needs binding fixture                      |
| `@main-error` | Binding creation rejected on non-Active tenants (Outline — Draft, Suspended, Archived)      | AC-05        | P0       | ⚙️ needs tenant-state fixtures                |
| `@main-error` | Modification on Archived tenant returns 422                                                 | AC-06        | P0       | ⚙️ needs Archived tenant with binding fixture |
| `@main-error` | Non-System-Admin roles cannot create/modify binding (Outline — 5 roles)                     | AC-09        | P0       | ✅                                            |
| `@main-error` | Cross-tenant access returns 404 not 403 (tenant isolation)                                  | AC-11        | P0       | ⚙️ needs [[D20]] Tenant B                     |

Active scenario blocks: 7 (5 Outlines + 2 Scenarios)
E2E automation candidates: 1 of 7 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @integration-binding @us-29.11 @p0
Feature: Tenant Integration Binding Management (US 29.11 — PRD1042-592)
  As a System Admin
  I want to configure and manage a tenant's core banking integration binding
  So that integration event routing behaves correctly according to the tenant's lifecycle state

  Background:
    Given the RefiNext admin console is running
    And tenant "Alpha Bank" exists in Active status
    And tenant "Alpha Bank" has no existing integration binding

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05, AC-10
  # System Admin creates a binding on an Active tenant, then views the created
  # record with all fields visible. Support user viewing the same binding sees
  # a masked variant (Endpoint URL + Credential Scope hidden per security spec).
  # Design unverified (Stage 2 FAILED — no Figma URL linked to story).
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @ac-10 @p0
  Scenario: System Admin creates integration binding on Active tenant (AC-05, AC-10)
    Given I am logged in as a System Admin
    When I open tenant "Alpha Bank"
    And I navigate to the Integration Binding section
    And I submit a new binding with:
      | field                                | value                                                              |
      | Core Banking Endpoint URL            | https://core.alphabank.example.com/api/v1                          |
      | Integration Active Flag              | false                                                              |
      | Credential Scope Identifier          | tenant-alpha-bank-scope                                            |
      | Governance Justification             | Initial binding setup for core banking integration onboarding.     |
    Then the response status should be 201
    And the binding record should show:
      | Core Banking Endpoint URL   | https://core.alphabank.example.com/api/v1 |
      | Integration Active Flag     | false                                     |
      | Credential Scope Identifier | tenant-alpha-bank-scope                   |
    And the binding should show Created By set to my user identity
    And the binding should show Created At as a valid UTC timestamp

  @happy-path @ac-10 @p0
  Scenario Outline: View binding — System Admin sees full fields, Support sees masked fields (AC-10)
    Given tenant "Alpha Bank" has an integration binding with endpoint "https://core.alphabank.example.com/api/v1"
    And I am logged in as <role>
    When I open the Integration Binding for tenant "Alpha Bank"
    Then the response status should be 200
    And I should see the Integration Active Flag
    And the Core Banking Endpoint URL should be <endpoint_visibility>
    And the Credential Scope Identifier should be <credential_visibility>

    Examples:
      | role         | endpoint_visibility | credential_visibility |
      | System Admin | fully visible       | fully visible         |
      | Support User | masked              | masked                |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04, AC-01
  # V1 supports at most one binding per tenant. A second creation attempt on a
  # tenant that already has a binding must return 409 with no side effects.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @ac-01 @p0
  Scenario: Second binding creation attempt on same tenant returns 409 (AC-04, AC-01)
    Given tenant "Alpha Bank" has an integration binding with endpoint "https://core.alphabank.example.com/api/v1"
    And I am logged in as a System Admin
    When I attempt to create a second integration binding on tenant "Alpha Bank" with:
      | field                                | value                                                        |
      | Core Banking Endpoint URL            | https://backup.alphabank.example.com/api/v1                  |
      | Governance Justification             | Adding secondary endpoint for redundancy in event routing.   |
    Then the response status should be 409
    And the existing binding endpoint should still be "https://core.alphabank.example.com/api/v1"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Binding creation/modification is restricted to Active tenants. Draft
  # (pre-activation), Suspended, and Archived tenants all reject binding
  # writes. Each state produces a distinct rejection (422 or 409-family) —
  # asserted via non-2xx status + no binding created.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Binding creation rejected on non-Active tenants (AC-05)
    Given tenant "<tenant>" exists in <state> status
    And tenant "<tenant>" has no existing integration binding
    And I am logged in as a System Admin
    When I attempt to create an integration binding on tenant "<tenant>" with:
      | field                                | value                                                        |
      | Core Banking Endpoint URL            | https://core.<tenant>.example.com/api/v1                     |
      | Governance Justification             | Setup binding for core integration prior to activation.      |
    Then the response status should NOT be 2xx
    And tenant "<tenant>" should still have no integration binding

    Examples:
      | tenant     | state     |
      | Beta Bank  | Draft     |
      | Gamma Bank | Suspended |
      | Delta Bank | Archived  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Archived tenant bindings are immutable snapshots. Any modification attempt
  # must return 422 with the binding record unchanged.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Modification on Archived tenant binding returns 422 (AC-06)
    Given tenant "Epsilon Bank" is in Archived status
    And tenant "Epsilon Bank" has an integration binding (decommissioned) with endpoint "https://core.epsilon.example.com/api/v1"
    And I am logged in as a System Admin
    When I attempt to modify the integration binding on tenant "Epsilon Bank" with:
      | field                                | value                                                        |
      | Core Banking Endpoint URL            | https://new.epsilon.example.com/api/v1                       |
      | Governance Justification             | Attempting to update endpoint after archiving for audit trace. |
    Then the response status should be 422
    And the binding endpoint should still be "https://core.epsilon.example.com/api/v1"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Only System Admin may create/modify a binding. All other roles (including
  # Support who can VIEW) are rejected on write attempts. RefiNext RBAC rule:
  # tenant-scoped resource — expect 404-not-403 for non-Support write roles
  # that cannot see the binding at all.
  # Support role attempting write returns 403 (has view grant, lacks write).
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles cannot create integration binding (AC-09)
    Given I am logged in as <role>
    When I attempt to create an integration binding on tenant "Alpha Bank" with:
      | field                                | value                                              |
      | Core Banking Endpoint URL            | https://core.alphabank.example.com/api/v1          |
      | Governance Justification             | Attempted binding creation by non-admin role.      |
    Then the response status should be <status>
    And tenant "Alpha Bank" should still have no integration binding

    Examples:
      | role                | status |
      | Front Office        | 404    |
      | Back Office         | 404    |
      | Leasing Company User| 404    |
      | Auditor             | 404    |
      | Support User        | 403    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Tenant isolation — a System Admin scoped to Tenant B must NOT be able to
  # view or modify a binding belonging to Tenant A. RefiNext rule: 404-not-403
  # to prevent tenant enumeration via authorization-error leakage.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Cross-tenant access returns 404 not 403 (AC-11)
    Given tenant "Alpha Bank" has an integration binding
    And a System Admin "beta-admin" is scoped to tenant "Beta Bank" only
    And I am logged in as "beta-admin"
    When I attempt to fetch the integration binding for tenant "Alpha Bank"
    Then the response status should be 404
    And the response status should NOT be 403
```
