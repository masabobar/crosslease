# PRD1042-49 — US 28.11 | USER MANAGEMENT | Tenant & Scope Assignment

Generated: 2026-06-12
Story: PRD1042-49 — US 28.11 | USER MANAGEMENT | Tenant & Scope Assignment
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (13 ACs, description present, stakeholder-reviewed by Philipp Maute & Vesna Plakalovic, Ready for Staging)
ACs with Gherkin scenarios: 5 of 13 | Blocked: 2 (AC-07, AC-11) | Excluded: 6 (separate-feature: AC-02, AC-04, AC-05, AC-12; edge-case: AC-08, AC-13)
Figma design: Node 9:113, file 18XTZEeaxrGDhi4DzZ2QnJ — Stage 2 FAILED (Figma MCP rate-limited; same tooling blocker as PRD1042-44, PRD1042-48, PRD1042-77)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                        | Blocking dependency                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| AC-07 | Auditor expiry requires a very short validity window to expire during the test run; cannot set without clock/TTL manipulation | D21 — `AUDITOR_VALIDITY_MINUTES` env override                      |
| AC-11 | Session revalidation on scope change requires an active session and the ability to assert token invalidation server-side      | D16 — `TEST_TOKEN_TTL_SECONDS` + D19 — throwaway user creation API |

---

## AC Scope Filter

| AC    | Description                                                               | Classification     | Rationale                                                                                             |
| ----- | ------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| AC-01 | Scope required by role — save blocked if mandatory scope is missing       | `happy-path`       | Core provisioning form enforcement; tests that FO, BO/Risk, and Auditor cannot be saved without scope |
| AC-02 | Tenant assignment — user sees only data within their tenant scope         | `separate-feature` | Runtime data isolation; covered by PRD1042-50 (RBAC) and PRD1042-51 (LC Access Restrictions) specs    |
| AC-03 | LC assignment mandatory for LC User — exactly one LC belonging to tenant  | `happy-path`       | Core provisioning path for LC User role; distinct form field enforcement from AC-01                   |
| AC-04 | LC scope enforcement — LC User sees only their assigned LC data           | `separate-feature` | Runtime enforcement; covered by PRD1042-51 (US 28.13 LC Access Restrictions)                          |
| AC-05 | Bank user scope restricted to assigned tenant/bank context                | `separate-feature` | Runtime enforcement; covered by PRD1042-50 (RBAC) and PRD1042-51                                      |
| AC-06 | Auditor requires tenant scope + valid-from + valid-until dates            | `happy-path`       | Core provisioning path for Auditor role; Auditor-specific required date fields                        |
| AC-07 | Auditor expiry blocks login and access immediately                        | `Blocked`          | Requires D21 (`AUDITOR_VALIDITY_MINUTES`) to set a short window that expires during E2E run           |
| AC-08 | Support User gets read-only cross-tenant access + audit log written       | `edge-case`        | Support User diagnostic visibility is platform-level; no distinct provisioning UI form required       |
| AC-09 | Missing/invalid scope blocks login and scoped module access               | `main-error`       | Directly blocks user from accessing the platform — core error path for misconfigured scope            |
| AC-10 | Scope change applied immediately; old scope revoked; change audit logged  | `main-error`       | Core admin workflow for scope modification; validates immediate effect + historical traceability      |
| AC-11 | Session revalidation or termination when scope changes for logged-in user | `Blocked`          | Requires D16 + D19 to assert active session invalidation server-side                                  |
| AC-12 | Backend rejects direct API access outside assigned scope                  | `separate-feature` | Backend enforcement only; covered by PRD1042-50 and PRD1042-51 spec files                             |
| AC-13 | Audit logging for all scope assignment, change, removal, expiry events    | `edge-case`        | Audit log is backend/database output; no distinct E2E UI assertion; covered by compliance audit       |

**Gherkin generated for:** AC-01, AC-03, AC-06, AC-09, AC-10
**Blocked (no Gherkin):** AC-07 (D21), AC-11 (D16 + D19)
**No Gherkin (edge-case or separate-feature):** AC-02, AC-04, AC-05, AC-08, AC-12, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                               | AC    | Priority | E2E          |
| ------------- | ------------------------------------------------------------------------------------------------------ | ----- | -------- | ------------ |
| `@happy-path` | Scope-required roles cannot be saved without tenant assignment (Scenario Outline — 3 roles)            | AC-01 | P0       | ✅           |
| `@happy-path` | LC User creation requires exactly one Leasing Company assignment                                       | AC-03 | P0       | ⚙️ needs D19 |
| `@happy-path` | Invalid tenant/LC combination is rejected on LC User creation                                          | AC-03 | P0       | ⚙️ needs D19 |
| `@happy-path` | Auditor creation requires tenant scope and valid date range (Scenario Outline — 2 missing-field cases) | AC-06 | P0       | ✅           |
| `@main-error` | User with missing scope cannot log in or access scoped modules                                         | AC-09 | P0       | ⚙️ needs D19 |
| `@main-error` | Admin scope change applies immediately and previous scope access is revoked                            | AC-10 | P0       | ⚙️ needs D19 |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 2 of 6 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.11 @p0
Feature: Tenant & Scope Assignment (US 28.11 — PRD1042-49)
  As a System Admin
  I want to assign users to the correct tenant, bank, or leasing company scope
  So that each user can access only the data and actions relevant to their organization and role

  Background:
    Given I am logged in as a System Admin
    And the user management section is accessible at "/users"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Scope assignment is role-gated: FO, BO/Risk, and Auditor roles must have
  # a tenant scope before the form can be saved. The save button must remain
  # blocked and a validation error must be shown when the required scope field
  # is left empty for any of these roles.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario Outline: Scope-required roles cannot be saved without tenant assignment (AC-01)
    Given I open the create user form
    And I select the role "<role>"
    And I leave the Tenant / Bank Entity field empty
    When I attempt to save the user
    Then the form must not be submitted
    And I should see a validation error on the Tenant / Bank Entity field
    And the error must indicate that tenant assignment is required for this role

    Examples:
      | role               |
      | Front Office       |
      | Back Office / Risk |
      | Auditor            |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # LC User creation requires exactly one Leasing Company assignment that belongs
  # to the selected tenant. The form must reject: (a) missing LC assignment,
  # (b) an LC that does not belong to the selected tenant.
  # Note: needs D19 (throwaway user API) so the LC User can be created and
  # cleaned up without polluting the seeded dataset.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario: LC User creation requires exactly one Leasing Company assignment (AC-03)
    Given I open the create user form
    And I select the role "Leasing Company User"
    And I select a valid tenant from the Tenant / Bank Entity field
    And I leave the Leasing Company field empty
    When I attempt to save the user
    Then the form must not be submitted
    And I should see a validation error on the Leasing Company field
    And the error must indicate that a Leasing Company assignment is required for this role

  @happy-path @ac-03 @p0
  Scenario: Invalid tenant/LC combination is rejected on LC User creation (AC-03)
    Given I open the create user form
    And I select the role "Leasing Company User"
    And I select tenant "Tenant A" from the Tenant / Bank Entity field
    And I select a Leasing Company that belongs to "Tenant B" (different tenant)
    When I attempt to save the user
    Then the form must not be submitted
    And I should see a validation error indicating the Leasing Company does not belong to the selected tenant

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # Auditor role requires tenant scope plus both valid-from and valid-until dates.
  # Missing either date must block save. Two sub-cases: missing valid-from alone,
  # missing valid-until alone. Both are modelled in the Outline.
  # Note: Auditor date-range fields are visible only when Auditor role is selected.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0 @e2e-ready
  Scenario Outline: Auditor creation is blocked when required date fields are missing (AC-06)
    Given I open the create user form
    And I select the role "Auditor"
    And I select a valid tenant from the Tenant / Bank Entity field
    And I leave the "<missing_field>" field empty
    When I attempt to save the user
    Then the form must not be submitted
    And I should see a validation error on the "<missing_field>" field
    And the error must indicate that this date is required for the Auditor role

    Examples:
      | missing_field     |
      | Access Valid From |
      | Access Valid Until |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # If a user's scope is missing, inactive, or invalid at login time, the system
  # must block access and show no fallback. This is a critical access-gate error.
  # Requires D19 to provision a user with a deliberately misconfigured scope.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario: User with missing scope cannot log in or access scoped modules (AC-09)
    Given a user exists with role "Front Office" and no tenant scope assigned
    When that user attempts to log in
    Then the system must block access
    And the user must NOT be redirected to the Front Office dashboard
    And no fallback access to any scoped module must be granted

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # When an admin changes a user's tenant or LC scope, the new scope must take
  # effect immediately and the previous scope must be revoked. The change must
  # be recorded in the audit log. This validates immediate effect + traceability.
  # Requires D19 to create a user that can be safely modified during the test.
  # Four-Eyes is required when the affected user has a privileged role — tested
  # here with a standard FO user (no Four-Eyes gate) for the baseline case.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Admin scope change applies immediately and old scope access is revoked (AC-10)
    Given a "Front Office" user "scope-test-user@bank.com" is assigned to "Tenant A"
    And that user is currently able to access Tenant A data
    When I change their tenant assignment to "Tenant B" and save
    Then the scope change must be saved successfully
    And the user's previous Tenant A scope must be immediately revoked
    And the user must now be scoped to Tenant B only
    And the audit log must contain a scope change entry with the previous scope, new scope, admin identity, and timestamp
```
