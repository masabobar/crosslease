# PRD1042-59 — US 28.15 | User Management | User Provisioning

Generated: 2026-06-10
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Provisioning actor for bank tenant users moved from System Admin to Bank Admin; System Admin now provisions platform-level users only. RBAC role matrix expanded to 7 roles.

Story: PRD1042-59 — US 28.15 | User Management | User Provisioning
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (14 ACs, description present, stakeholder-reviewed by Philipp Maute, UAT ready)
ACs with Gherkin scenarios: 6 of 14 | Blocked: 0 | Excluded: 8 (edge-case or separate-feature — scope filter table only)
Figma design: Node N/A, file N/A — Screen "Create User form" (Stage 2 PARTIAL — UI/UX subtask PRD1042-521 Done but Figma URL not linked to parent story; no frames extractable, conditional field display rules unverified)

---

## RBAC Role Matrix (7 roles — updated 2026-07-08)

| Role                 | Wire value             | User Type         | Provisioning capability                                                                                                                                |
| -------------------- | ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| System Admin         | `system_admin`         | `platform`        | Provisions platform-level users only (System Admin, Support User, Auditor). Cannot provision bank tenant users.                                        |
| Support User         | `support_user`         | `platform`        | Cannot provision users.                                                                                                                                |
| Auditor              | `auditor`              | `platform`        | Cannot provision users.                                                                                                                                |
| Bank Admin           | `bank_admin`           | `bank_tenant`     | Provisions bank tenant users within own tenant only (Front Office, Back Office). Cannot provision another Bank Admin, platform users, or cross-tenant. |
| Front Office         | `front_office`         | `bank_tenant`     | Cannot provision users.                                                                                                                                |
| Back Office          | `back_office`          | `bank_tenant`     | Cannot provision users.                                                                                                                                |
| Leasing Company User | `leasing_company_user` | `leasing_company` | Cannot provision users.                                                                                                                                |

**Bank Admin assignment:** Bank Admin role is assigned only at tenant creation time via System Admin (see US 29.x Tenant Management). Bank Admin cannot self-provision or provision another Bank Admin.

---

## AC Scope Filter

| AC    | Description                                                                 | Classification     | Rationale                                                                                                                                                    |
| ----- | --------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | Mandatory Field Validation — missing mandatory fields block submission      | `main-error`       | Blocks core provisioning action; backend-authoritative validation testable at API layer.                                                                     |
| AC-02 | Unique Email Validation — duplicate email prevents creation, no info leak   | `main-error`       | Blocks creation; security-relevant (must not leak existing-user info). One focused scenario.                                                                 |
| AC-03 | Role Assignment — exactly one role assigned on creation                     | `happy-path`       | Core success flow — Bank Admin and System Admin each provision within their allowed scope. Covered by happy-path Outline.                                    |
| AC-04 | Hybrid Role Prevention — multi-role assignment rejected                     | `main-error`       | Blocks creation; backend-authoritative. One negative scenario.                                                                                               |
| AC-05 | Tenant Scope Validation — missing tenant scope (operational role) blocks    | `main-error`       | Blocks creation when role requires tenant scope. Folded into conditional-scope validation Outline.                                                           |
| AC-06 | Leasing Company Scope Validation — missing LC (LC User) blocks; LC ⊂ tenant | `main-error`       | Blocks creation for LC User; LC must belong to tenant. Folded into conditional-scope validation Outline.                                                     |
| AC-07 | Auditor Validity Window — missing Access Valid Until (Auditor) blocks       | `main-error`       | Blocks Auditor creation. Folded into conditional-scope validation Outline.                                                                                   |
| AC-08 | User Lifecycle State — created user stored as Invited / Pending Activation  | `happy-path`       | Observable outcome of successful provisioning. Asserted in the happy-path Outline.                                                                           |
| AC-09 | Invitation Sending — invitation email sent on completion                    | `separate-feature` | Requires inbox/email access and invitation-token extraction; delivery not observable at E2E UI/API layer without email.                                      |
| AC-10 | Audit Logging — actor, user, role, scope, timestamp, validity logged        | `edge-case`        | Internal audit log format/immutability; not observable via UI or standard API response for E2E.                                                              |
| AC-11 | Unauthorized Provisioning Prevention — role & scope boundaries enforced     | `main-error`       | RefiNext role-access domain rule — expanded to cover System Admin→bank users, Bank Admin→platform users, Bank Admin→Bank Admin, and Bank Admin cross-tenant. |
| AC-12 | Backend/API Provisioning Enforcement — manipulated payload rejected         | `main-error`       | Server-side enforcement; manipulated role/scope payload rejected. One negative scenario.                                                                     |
| AC-13 | Session & Permission Activation — permissions activate after onboarding     | `separate-feature` | Post-onboarding activation flow; depends on activation/onboarding completion (US 28.16 / 28.8), not provisioning itself.                                     |
| AC-14 | Mandatory Four-Eyes Validation for Privileged Roles                         | `separate-feature` | Approval workflow owned by PRD1042-77; provisioning side only sets pending state. Approval action tested in that spec.                                       |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-11, AC-12
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-09, AC-10, AC-13, AC-14

---

## Scenarios summary

| Tag           | Scenario                                                                               | AC                  | Priority | E2E          |
| ------------- | -------------------------------------------------------------------------------------- | ------------------- | -------- | ------------ |
| `@happy-path` | System Admin provisions platform-level users (Scenario Outline — 2 roles)              | AC-03, AC-08        | P0       | ⚙️ needs D19 |
| `@happy-path` | Bank Admin provisions bank tenant users within own tenant (Scenario Outline — 3 roles) | AC-03, AC-08        | P0       | ⚙️ needs D19 |
| `@main-error` | Missing mandatory fields block submission                                              | AC-01               | P0       | ⚙️ needs D19 |
| `@main-error` | Duplicate email prevents creation without leaking existing-user info                   | AC-02               | P0       | ⚙️ needs D19 |
| `@main-error` | Assigning more than one role is rejected                                               | AC-04               | P0       | ⚙️ needs D19 |
| `@main-error` | Missing conditional scope/validity blocks creation (Scenario Outline — 3 roles)        | AC-05, AC-06, AC-07 | P0       | ⚙️ needs D19 |
| `@main-error` | Unauthorized role cannot provision users (Scenario Outline — 4 roles)                  | AC-11               | P0       | ✅           |
| `@main-error` | System Admin cannot provision bank tenant users (platform-only boundary)               | AC-11               | P0       | ⚙️ needs D19 |
| `@main-error` | Bank Admin cannot provision another Bank Admin (assigned at tenant creation only)      | AC-11               | P0       | ⚙️ needs D19 |
| `@main-error` | Bank Admin cannot provision platform-level users                                       | AC-11               | P0       | ⚙️ needs D19 |
| `@main-error` | Bank Admin cannot provision cross-tenant (own tenant only)                             | AC-11               | P0       | ⚙️ needs D19 |
| `@main-error` | Manipulated payload bypassing role/scope rules is rejected                             | AC-12               | P0       | ⚙️ needs D19 |

Active scenario blocks: 12 (3 Outlines + 9 Scenarios)
E2E automation candidates: 1 of 12 scenarios ✅

---

## Feature file

```gherkin
@user-mgmt @us-28.15 @p0
Feature: User Provisioning (US 28.15 — PRD1042-59)
  As a Bank Admin or System Admin
  I want to provision new users with exactly one role and the correct scope
  So that users are created in a governed, time-limited, audit-traceable way

  Background:
    Given the Create User form is accessible to authorized admins

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03, AC-08 (System Admin scope)
  # System Admin provisions platform-level users only (System Admin, Support
  # User, Auditor). Each created user has exactly one role and is stored in
  # Invited / Pending Activation state. Per PRD1042-48 (Ivan Mladenovic
  # 2026-07-06), System Admin no longer provisions bank tenant users.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @ac-08 @p0
  Scenario Outline: System Admin provisions platform-level users (AC-03, AC-08)
    Given I am logged in as a System Admin (system_admin)
    And I provide valid mandatory fields for a <role> user with email <email>
    And I provide the required scope <scope> for that role
    When I submit the Create User form
    Then the user should be created with exactly one role <role>
    And the user should be stored in "Invited / Pending Activation" state
    And the user should not have active permissions yet

    Examples:
      | role         | email                | scope    |
      | Support User | support.new@platform | platform |
      | Auditor      | auditor.new@platform | platform |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03, AC-08 (Bank Admin scope)
  # Bank Admin (bank_admin) provisions bank tenant users within own tenant only
  # (Front Office, Back Office, Leasing Company User). Created users have
  # exactly one role and are in Invited / Pending Activation state. Bank Admin
  # is the only role that can provision bank tenant users.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @ac-08 @p0
  Scenario Outline: Bank Admin provisions bank tenant users within own tenant (AC-03, AC-08)
    Given I am logged in as a Bank Admin (bank_admin) for tenant "Bank A"
    And I provide valid mandatory fields for a <role> user with email <email>
    And I provide the required scope <scope> for that role
    When I submit the Create User form
    Then the user should be created with exactly one role <role>
    And the user should be stored in "Invited / Pending Activation" state
    And the user should not have active permissions yet
    And the user should belong to tenant "Bank A"

    Examples:
      | role                 | email               | scope                |
      | Front Office         | fo.new@bank.com     | tenant: Bank A       |
      | Back Office          | bo.new@bank.com     | tenant: Bank A       |
      | Leasing Company User | lc.new@lender.com   | tenant: Bank A, LC X |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01
  # Mandatory field validation is backend-authoritative; submission with any
  # missing mandatory field is rejected and the user is not created.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0
  Scenario: Missing mandatory fields block submission (AC-01)
    Given I am logged in as a Bank Admin
    And I leave the mandatory field "Email Address" empty
    When I submit the Create User form
    Then submission should be prevented
    And I should see a validation error for the missing field
    And no user should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Duplicate email is backend-enforced and case-insensitive; the error must
  # not reveal that an account with that email already exists (no info leak).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario: Duplicate email prevents creation without leaking existing-user info (AC-02)
    Given I am logged in as a Bank Admin
    And a user with email "existing@bank.com" already exists
    When I submit the Create User form with email "existing@bank.com"
    Then user creation should be prevented
    And I should see a generic validation error
    And the error should NOT reveal that the email belongs to an existing user

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Exactly one role per user; hybrid roles are blocked and must not create
  # partial access. Role validation is backend-authoritative.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Assigning more than one role is rejected (AC-04)
    Given I am logged in as a Bank Admin
    And I attempt to assign more than one role to the new user
    When I submit the Create User form
    Then the request should be rejected
    And no user should be created
    And no partial access should be granted

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05, AC-06, AC-07
  # Conditional scope/validity is required per role: tenant-level operational
  # roles need a tenant, LC Users need an LC belonging to the tenant, Auditors
  # need an Access Valid Until. Missing the required value blocks creation.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @ac-06 @ac-07 @p0
  Scenario Outline: Missing conditional scope or validity blocks creation (AC-05, AC-06, AC-07)
    Given I am logged in as an authorized admin for the <role>
    And I create a <role> user with all other mandatory fields valid
    And I omit the required <missing_field>
    When I submit the Create User form
    Then user creation should be prevented
    And I should see a validation error for the missing <missing_field>

    Examples:
      | role                 | missing_field      |
      | Front Office         | Tenant Scope       |
      | Leasing Company User | Leasing Company    |
      | Auditor              | Access Valid Until |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (RefiNext role-access domain rule — general)
  # Only Bank Admin and System Admin may provision (within their allowed
  # scopes). Support User, Auditor, Front Office, Back Office, and LC User
  # cannot provision at all. Backend/API enforcement is authoritative.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready
  Scenario Outline: Unauthorized role cannot provision users (AC-11)
    Given I am logged in as <unauthorized_role>
    When I POST a valid user-creation payload to "/api/v1/users"
    Then the response status should be 403
    And no user should be created

    Examples:
      | unauthorized_role    |
      | Support User         |
      | Auditor              |
      | Front Office         |
      | Leasing Company User |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (System Admin scope boundary — updated 2026-07-08)
  # Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06), System Admin no
  # longer provisions bank tenant users. Attempting to create a bank tenant
  # user (Bank Admin, Front Office, Back Office, LC User) as System Admin
  # must be rejected. Bank tenant provisioning is Bank Admin's responsibility.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario Outline: System Admin cannot provision bank tenant users (AC-11)
    Given I am logged in as a System Admin (system_admin)
    And I attempt to provision a <bank_tenant_role> user with tenant "Bank A"
    When I submit the Create User form
    Then user creation should be prevented
    And the response status should be 403
    And no user should be created

    Examples:
      | bank_tenant_role     |
      | Bank Admin           |
      | Front Office         |
      | Back Office          |
      | Leasing Company User |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (Bank Admin cannot self-provision — updated 2026-07-08)
  # Bank Admin role is assigned only at tenant creation time via System Admin
  # (US 29.x Tenant Management). A Bank Admin cannot provision another Bank
  # Admin through the standard user provisioning flow.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Bank Admin cannot provision another Bank Admin (AC-11)
    Given I am logged in as a Bank Admin (bank_admin) for tenant "Bank A"
    And I attempt to provision a new Bank Admin user for tenant "Bank A"
    When I submit the Create User form
    Then user creation should be prevented
    And the response status should be 403
    And no user should be created
    And the error should indicate Bank Admin is assigned only at tenant creation

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (Bank Admin cannot cross platform boundary)
  # Bank Admin scope is limited to bank_tenant users. Attempting to provision
  # a platform-level user (System Admin, Support User, Auditor) must be
  # rejected — those are System Admin's responsibility.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario Outline: Bank Admin cannot provision platform-level users (AC-11)
    Given I am logged in as a Bank Admin (bank_admin) for tenant "Bank A"
    And I attempt to provision a <platform_role> user
    When I submit the Create User form
    Then user creation should be prevented
    And the response status should be 403
    And no user should be created

    Examples:
      | platform_role |
      | System Admin  |
      | Support User  |
      | Auditor       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (Bank Admin tenant isolation)
  # Bank Admin may provision only within own tenant. Attempting to provision
  # a user for a different tenant must be rejected. Per RefiNext tenant-
  # isolation domain rule, cross-tenant access should surface as 404 (not 403)
  # to prevent enumeration.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Bank Admin cannot provision cross-tenant (AC-11)
    Given I am logged in as a Bank Admin (bank_admin) for tenant "Bank A"
    And I attempt to provision a Front Office user for tenant "Bank B"
    When I submit the Create User form
    Then user creation should be prevented
    And the response status should be 404
    And no user should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # Server-side enforcement: a manipulated payload that attempts to bypass
  # role or scope validation (e.g. multi-role, invalid tenant/LC combination,
  # tenant-id spoofing) must be rejected; partial or fallback access must
  # never be granted.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0
  Scenario: Manipulated payload bypassing role/scope rules is rejected (AC-12)
    Given I am logged in as a Bank Admin (bank_admin) for tenant "Bank A"
    When I POST a user-creation payload with an invalid tenant/LC combination
    Then the backend should reject the request
    And no user should be created
    And no partial or fallback access should be granted
```
