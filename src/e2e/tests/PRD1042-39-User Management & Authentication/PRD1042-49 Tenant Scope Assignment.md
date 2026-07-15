# PRD1042-49 — US 28.11 | USER MANAGEMENT | Tenant & Scope Assignment

Generated: 2026-06-12
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin is a tenant-level role (user_type `bank_tenant`) bound to exactly one tenant at creation; tenant scope is immutable after creation and cannot be reached via role transition. System Admin can no longer assign or modify bank user tenant scope — that authority moves to Bank Admin for its own tenant.
Story: PRD1042-49 — US 28.11 | USER MANAGEMENT | Tenant & Scope Assignment
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (13 ACs, description present, stakeholder-reviewed by Philipp Maute & Vesna Plakalovic, Ready for Staging)
ACs with Gherkin scenarios: 5 of 13 | Blocked: 2 (AC-07, AC-11) | Excluded: 6 (separate-feature: AC-02, AC-04, AC-05, AC-12; edge-case: AC-08, AC-13)
Figma design: Node 9:113, file 18XTZEeaxrGDhi4DzZ2QnJ — Stage 2 FAILED (Figma MCP rate-limited; same tooling blocker as PRD1042-44, PRD1042-48, PRD1042-77)

---

## Tenant-Scoped Roles Matrix (Updated 2026-07-08)

| Role (wire value)         | user_type         | Tenant scope required             | Multiplicity                        | Assignment moment     | Mutability after creation                       | Who assigns                               |
| ------------------------- | ----------------- | --------------------------------- | ----------------------------------- | --------------------- | ----------------------------------------------- | ----------------------------------------- |
| `bank_admin` (Power User) | `bank_tenant`     | Yes                               | Exactly one tenant                  | At user creation only | **Immutable** — cannot change tenant scope      | System Admin (initial bootstrap) then N/A |
| `front_office`            | `bank_tenant`     | Yes                               | Exactly one tenant                  | At user creation      | Mutable (Four-Eyes for privileged targets)      | Bank Admin (own tenant)                   |
| `back_office`             | `bank_tenant`     | Yes                               | Exactly one tenant                  | At user creation      | Mutable (Four-Eyes for privileged targets)      | Bank Admin (own tenant)                   |
| `leasing_company_user`    | `leasing_company` | Yes + exactly one LC              | Exactly one tenant + exactly one LC | At user creation      | Mutable (reason mandatory per AC-12 PRD1042-48) | Bank Admin (own tenant)                   |
| `auditor`                 | `platform`        | Yes (time-limited)                | Exactly one tenant                  | At user creation      | Mutable (Four-Eyes for privileged targets)      | System Admin                              |
| `support_user`            | `platform`        | Optional / cross-tenant read-only | N/A                                 | At user creation      | Mutable                                         | System Admin                              |
| `system_admin`            | `platform`        | Platform-wide (no tenant)         | N/A                                 | At user creation      | N/A                                             | System Admin                              |

**Bank Admin key constraints:**

- Tenant scope is **assigned once at creation** — no UI or API path exists to change it later
- **Cannot be reached via role transition** — a user cannot be promoted from `front_office` / `back_office` / `leasing_company_user` into `bank_admin`; Bank Admin is created directly as `bank_admin`
- Administers configuration and users within its own tenant only — **no cross-tenant scope**
- System Admin creates the first Bank Admin for a new tenant (bootstrap); after that, Bank Admin manages its own tenant users

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

**Gherkin generated for:** AC-01, AC-03, AC-06, AC-09, AC-10 (plus AC-01/AC-10 Bank Admin immutability sub-cases added 2026-07-08)
**Blocked (no Gherkin):** AC-07 (D21), AC-11 (D16 + D19)
**No Gherkin (edge-case or separate-feature):** AC-02, AC-04, AC-05, AC-08, AC-12, AC-13

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.**

| Tag           | Scenario                                                                                                     | AC    | Priority | E2E          |
| ------------- | ------------------------------------------------------------------------------------------------------------ | ----- | -------- | ------------ |
| `@happy-path` | Scope-required roles cannot be saved without tenant assignment (Scenario Outline — 4 roles incl. Bank Admin) | AC-01 | P0       | ✅           |
| `@happy-path` | Bank Admin creation is bound to exactly one tenant — multi-tenant scope invalid                              | AC-01 | P0       | ⚙️ needs D19 |
| `@happy-path` | LC User creation requires exactly one Leasing Company assignment                                             | AC-03 | P0       | ⚙️ needs D19 |
| `@happy-path` | Invalid tenant/LC combination is rejected on LC User creation                                                | AC-03 | P0       | ⚙️ needs D19 |
| `@happy-path` | Auditor creation requires tenant scope and valid date range (Scenario Outline — 2 missing-field cases)       | AC-06 | P0       | ✅           |
| `@main-error` | User with missing scope cannot log in or access scoped modules                                               | AC-09 | P0       | ⚙️ needs D19 |
| `@main-error` | Admin scope change applies immediately and previous scope access is revoked                                  | AC-10 | P0       | ⚙️ needs D19 |
| `@main-error` | Bank Admin tenant scope is immutable — change attempt after creation returns error                           | AC-10 | P0       | ⚙️ needs D19 |
| `@main-error` | Bank Admin cannot be reached via role transition — promoting a tenant user to bank_admin is rejected         | AC-10 | P0       | ⚙️ needs D19 |

Active scenario blocks: 9 (2 Outlines + 7 Scenarios)
E2E automation candidates: 2 of 9 scenarios ✅

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
  # Scope assignment is role-gated: Bank Admin (Power User), FO, BO/Risk, and
  # Auditor roles must have a tenant scope before the form can be saved. The
  # save button must remain blocked and a validation error must be shown when
  # the required scope field is left empty for any of these roles.
  # Updated 2026-07-08: Bank Admin (`bank_admin`) added as a tenant-level role
  # bound to exactly one tenant at creation (per PRD1042-48 decision by Ivan
  # Mladenovic 2026-07-06).
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
      | role                     |
      | Bank Admin (Power User)  |
      | Front Office             |
      | Back Office / Risk       |
      | Auditor                  |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01 (Bank Admin single-tenant binding)
  # Bank Admin (`bank_admin`, user_type `bank_tenant`) MUST be bound to exactly
  # one tenant at creation. Attempting to save a Bank Admin without a tenant
  # OR with multiple tenants selected must be rejected. This is the Bank-Admin
  # equivalent of the LC-User "exactly one LC" rule in AC-03.
  # Requires D19 (throwaway user API) to create and clean up a Bank Admin user.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario: Bank Admin creation is bound to exactly one tenant — multi-tenant scope invalid (AC-01)
    Given I open the create user form
    And I select the role "Bank Admin (Power User)"
    When I attempt to select more than one tenant in the Tenant / Bank Entity field
    Then the form must reject the selection
    And the Tenant / Bank Entity field must accept exactly one tenant value
    And an inline hint must indicate that Bank Admin is bound to exactly one tenant

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

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (Bank Admin tenant scope immutability)
  # Bank Admin (`bank_admin`) tenant scope is assigned at creation and is
  # IMMUTABLE thereafter. Any attempt to modify the tenant scope of an existing
  # Bank Admin — via UI edit form OR direct API call — must be rejected.
  # This is a stronger constraint than the standard scope-change rule in AC-10
  # (which allows changes for FO/BO/LC users with Four-Eyes for privileged).
  # Requires D19 (throwaway user API) to create a Bank Admin bound to Tenant A
  # and then attempt reassignment.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Bank Admin tenant scope is immutable — change attempt after creation returns error (AC-10)
    Given a "Bank Admin (Power User)" user "bank-admin@tenant-a.com" is bound to "Tenant A"
    When I open the user's edit form
    Then the Tenant / Bank Entity field must be read-only or disabled
    And an inline hint must indicate that Bank Admin tenant scope cannot be changed after creation

    When I attempt to change the tenant assignment to "Tenant B" via direct API call
    Then the API must reject the request with a validation error
    And the error must indicate that Bank Admin tenant scope is immutable
    And the user's tenant assignment must remain "Tenant A"
    And no scope change entry must be written to the audit log for this rejected attempt

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (No role transition into Bank Admin)
  # Bank Admin cannot be reached via role transition — a user cannot be
  # promoted from `front_office`, `back_office`, or `leasing_company_user`
  # into `bank_admin`. Bank Admin must be created directly with role
  # `bank_admin` at user creation time.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Bank Admin cannot be reached via role transition — promoting a tenant user to bank_admin is rejected (AC-10)
    Given a "Front Office" user "fo-user@tenant-a.com" is assigned to "Tenant A"
    When I open the user's edit form
    Then the role selector must NOT offer "Bank Admin (Power User)" as a target role for role change

    When I attempt to change the user's role to "bank_admin" via direct API call
    Then the API must reject the request with a validation error
    And the error must indicate that Bank Admin cannot be reached via role transition
    And the user's role must remain "front_office"
```
