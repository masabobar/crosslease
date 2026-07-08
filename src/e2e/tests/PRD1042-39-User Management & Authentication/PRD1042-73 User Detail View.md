# PRD1042-73 — US 28.6 | USER MANAGEMENT | User Detail View

Generated: 2026-06-03
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).
Story: PRD1042-73 — US 28.6 | USER MANAGEMENT | User Detail View
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (16 ACs, description present, stakeholder-reviewed, UAT ready)
ACs with Gherkin scenarios: 6 of 16 | Blocked: 0 | Excluded: 10 (edge-case or separate-feature — scope filter table only)
Figma design: Node 9:113, file j5hq5cQgHWdOtzLvSX0jvj — Screen "User list & user DETAILS" (Stage 2 PARTIAL — Authentication & Security section and Governance Lineage section absent from design frames; email change flow not designed)

**Role terminology update (2026-07-08):** Jira story description (updated 2026-07-06) formally splits the former combined "Power User / System Admin" into two distinct roles:

- **System Admin** (`system_admin`) — platform-level, cross-tenant. Can view/manage platform users and all tenants. Sees "Change role" action ONLY for platform users.
- **Bank Admin** (`bank_admin`, user_type `bank_tenant`) — tenant-scoped bank administrator. Can view/manage users within its own bank tenant only. Sees "Change role" action for tenant users within its scope.

Displayed role values in ROLE & SCOPE section (7 roles total): `system_admin`, `bank_admin`, `support_user`, `auditor`, `front_office`, `back_office`, `leasing_company_user`.

Viewer roles authorized to open User Detail View (5 roles): `system_admin` (all tenants), `bank_admin` (own tenant only), `support_user` (limited diagnostic), `auditor` (read-only during active engagement), and the user's own self-profile (any authenticated role). `front_office` and `back_office` retain limited operational visibility within own tenant per AC-01 general rule; `leasing_company_user` has zero access per AC-16.

---

## AC Scope Filter

| AC    | Description                                                                                                                                                                 | Classification     | Rationale                                                                                                                                                                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Authorized user opens User Detail View and sees role-appropriate content; self-profile always accessible regardless of cross-role restrictions                              | `happy-path`       | Core success flow — covered by Scenario Outline across Admin, Support, Auditor roles plus dedicated self-profile scenario; includes read-only enforcement assertions (AC-09)                                                                                                                                                    |
| AC-02 | Unauthorized or unauthenticated user direct URL access must be denied; system must not reveal whether hidden users exist                                                    | `main-error`       | Directly blocks unauthorized user from the core action; critical access-control gate                                                                                                                                                                                                                                            |
| AC-03 | Role badge and platform/tenant classification displayed correctly; System Admin and Bank Admin shown as distinct roles; Front Office + Back Office role combination blocked | `happy-path`       | Explicit Scenario Outline added 2026-07-08 covering all 7 supported role values (system_admin, bank_admin, support_user, auditor, front_office, back_office, leasing_company_user) and their Platform-level vs Tenant-level classification; role exclusivity (Front Office + Back Office block) remains in Role Management spec |
| AC-04 | Tenant assignment visible according to permissions; cross-tenant data must not be exposed                                                                                   | `edge-case`        | Display detail — tenant field validated within AC-01 happy-path assertions                                                                                                                                                                                                                                                      |
| AC-05 | Leasing Company assignment shown for LC-scoped users; LC Users themselves cannot access User Detail View                                                                    | `edge-case`        | LC User access prevention covered by AC-16; Leasing Company field has a MINOR design gap (not found in full detail frames) — BA/Designer to confirm                                                                                                                                                                             |
| AC-06 | Lifecycle status, timestamps, and reasons displayed correctly; Locked and Archived statuses supported                                                                       | `edge-case`        | Field-level lifecycle display — covered within AC-01 happy-path assertions; Locked/Archived badge variants are a MINOR design gap                                                                                                                                                                                               |
| AC-07 | Email change requires re-verification via new address; previous email preserved as recovery anchor; users cannot self-service edit own email                                | `main-error`       | Two distinct blocking rules: re-verification gates the email-change completion; self-service edit is explicitly forbidden — MAJOR design gap noted (email change flow absent from design); tests derive from story ACs                                                                                                          |
| AC-08 | Historical role, tenant, scope, and permission changes must remain reconstructible; governance lineage immutable                                                            | `edge-case`        | Audit history tab — read-only display, not blocking core view; tab labels unconfirmed in design (ambiguity logged in Blockers & Gaps)                                                                                                                                                                                           |
| AC-09 | Support and Auditor users must not be able to edit restricted fields                                                                                                        | `edge-case`        | Read-only enforcement is a display property validated within AC-01 Scenario Outline (Edit button visibility differs by role)                                                                                                                                                                                                    |
| AC-10 | Direct API requests for unauthorized fields must be rejected server-side                                                                                                    | `separate-feature` | Backend/API enforcement — out of E2E UI scope; belongs in API integration test suite                                                                                                                                                                                                                                            |
| AC-11 | Expired audit engagement immediately revokes Auditor access                                                                                                                 | `separate-feature` | Engagement expiry is a time/state-machine trigger — belongs in a dedicated Auditor Access Lifecycle spec                                                                                                                                                                                                                        |
| AC-12 | User Detail access and modifications must be audit logged with full context                                                                                                 | `separate-feature` | Backend audit log concern — no UI representation; verified by API/log inspection tests                                                                                                                                                                                                                                          |
| AC-13 | Platform-level and tenant-level roles distinguished in display; System Admin is platform-level, Bank Admin is tenant-level                                                  | `happy-path`       | Explicit Scenario Outline added 2026-07-08 asserting "Platform-level" vs "Tenant-level operational role" classification for each of the 7 supported role values; also asserted implicitly via the "Change role" visibility Outline (System Admin only for platform users; Bank Admin for tenant users)                          |
| AC-14 | Front Office and Back Office/Risk role combination must be rejected server-side                                                                                             | `separate-feature` | Role assignment conflict belongs in the User Edit / Role Management spec (separate ticket)                                                                                                                                                                                                                                      |
| AC-15 | Governance lineage records preserved point-in-time; governance approval reference visible to Admin/Auditor                                                                  | `edge-case`        | Backend immutability concern — Governance Approval Reference section absent from design (MAJOR gap); no E2E UI test possible without design                                                                                                                                                                                     |
| AC-16 | LC User sees no User Detail View navigation entries, routes, or administration APIs                                                                                         | `main-error`       | Core business rule: LC Users are completely excluded from User administration — verified via navigation inspection and direct route access attempt                                                                                                                                                                              |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-07, AC-13, AC-16
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-04, AC-05, AC-06, AC-08, AC-09, AC-10, AC-11, AC-12, AC-14, AC-15

---

## Scenarios summary

| Tag           | Scenario                                                                                                                                                    | AC           | Priority | E2E                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------- | --------------------- |
| `@happy-path` | Authorized role opens User Detail View with role-appropriate sections (Scenario Outline — 4 role variants: System Admin, Bank Admin, Support User, Auditor) | AC-01        | P0       | ✅                    |
| `@happy-path` | "Change role" action visibility by viewer role and target user type (Scenario Outline — 3 variants)                                                         | AC-01, AC-13 | P0       | ✅                    |
| `@happy-path` | Role badge and classification displayed correctly for each supported role (Scenario Outline — 7 role variants)                                              | AC-03, AC-13 | P0       | ✅                    |
| `@happy-path` | Authenticated user opens their own self-profile                                                                                                             | AC-01        | P0       | ✅                    |
| `@main-error` | Unauthorized direct URL access to User Detail View is blocked                                                                                               | AC-02        | P0       | ✅                    |
| `@main-error` | Admin changes a user's email address — re-verification triggered                                                                                            | AC-07        | P1       | ⚙️ needs email access |
| `@main-error` | Authenticated user cannot self-service edit their own email address                                                                                         | AC-07        | P1       | ✅                    |
| `@main-error` | Leasing Company User sees no User Detail View navigation or accessible routes                                                                               | AC-16        | P0       | ✅                    |

Active scenario blocks: 8 (3 Outlines + 5 Scenarios)
E2E automation candidates: 7 of 8 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.6 @p0
Feature: User Detail View (US 28.6 — PRD1042-73)
  As a Power User / System Admin, Support User, or Auditor
  I want to access a detailed user profile view
  So that I can review identity, role assignment, tenant scope, lifecycle status,
  and security-related information within my authorized access scope

  Background:
    Given the application is running and accessible
    And a tenant user "Anna Kowalski" exists with email "anna.kowalski@bank.com", role "support_user", user_type "bank_tenant", tenant "Tenant A", status "Active"
    And a platform user "Peter Platform" exists with email "peter.platform@refinext.com", role "system_admin", user_type "platform", status "Active"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Authorized roles (System Admin, Bank Admin, Support User, Auditor) open a
  # User Detail View for another user and see the correct sections and field
  # editability for their role.
  # - System Admin (platform, cross-tenant): full identity + scope edit; lifecycle
  #   actions visible. "Change role" visible ONLY when viewing a platform user
  #   (updated 2026-07-08 per PRD1042-48).
  # - Bank Admin (tenant-scoped): identity + scope edit for users in own tenant;
  #   lifecycle actions visible; "Change role" visible for tenant users (updated
  #   2026-07-08 per PRD1042-48).
  # - Support User / Auditor: same sections visible, all Edit buttons and
  #   lifecycle actions hidden; "Change role" hidden.
  # Design: ADMIN frame (line 903), SUPPORT frame (line 3276), AUDITOR frame (line 4684).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario Outline: Authorized role opens User Detail View for a tenant user with role-appropriate sections (AC-01)
    Given I am logged in as a "<viewer_role>" user in "Tenant A"
    When I navigate to the User Detail View for "Anna Kowalski"
    Then I should see the "USER IDENTITY" section containing user ID, first name, last name, and email
    And I should see the "ROLE & SCOPE" section containing a role badge, role classification, tenant, and effective tenant scope
    And I should see the lifecycle status section containing account status, invitation sent, activation timestamp, and last login
    And the "Edit" button on "USER IDENTITY" should be "<identity_edit>"
    And the "Edit" button on "ROLE & SCOPE" should be "<scope_edit>"
    And the "Suspend user" action button should be "<lifecycle_actions>"
    And the "Change role" action for this tenant user should be "<change_role_tenant>"

    Examples:
      | viewer_role  | identity_edit | scope_edit | lifecycle_actions | change_role_tenant |
      | system_admin | visible       | visible    | visible           | hidden             |
      | bank_admin   | visible       | visible    | visible           | visible            |
      | support_user | hidden        | hidden     | hidden            | hidden             |
      | auditor      | hidden        | hidden     | hidden            | hidden             |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01 (System Admin viewing platform user — "Change role" visibility)
  # System Admin sees the "Change role" action ONLY when viewing a platform user.
  # When viewing a tenant user, "Change role" is hidden for System Admin (that
  # falls under Bank Admin scope). Bank Admin cannot view platform users at all
  # (out of tenant scope — expected 404-not-403 per RefiNext tenant isolation).
  # Added 2026-07-08 per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario Outline: "Change role" action visibility by viewer role and target user type (AC-01, AC-13)
    Given I am logged in as a "<viewer_role>" user
    When I navigate to the User Detail View for "<target_user>"
    Then the "Change role" action for a "<target_user_type>" user should be "<change_role_action>"

    Examples:
      | viewer_role  | target_user      | target_user_type | change_role_action |
      | system_admin | Peter Platform   | platform         | visible            |
      | system_admin | Anna Kowalski    | bank_tenant      | hidden             |
      | bank_admin   | Anna Kowalski    | bank_tenant      | visible            |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03 / AC-13 (role classification display — 7 role values)
  # The ROLE & SCOPE section must render the correct role badge and classification
  # (Platform-level vs Tenant-level operational role) for each of the 7 supported
  # role values. System Admin is Platform-level; the other 6 are Tenant-level.
  # Updated 2026-07-08 per PRD1042-48 (System Admin and Bank Admin as distinct roles).
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @ac-13 @p0 @e2e-ready
  Scenario Outline: Role badge and classification displayed correctly for each supported role (AC-03, AC-13)
    Given a user "Test User" exists with role "<role_value>"
    And I am logged in as a "system_admin" user
    When I navigate to the User Detail View for "Test User"
    Then the "ROLE & SCOPE" section must display role badge "<role_value>"
    And the role classification must be shown as "<role_classification>"

    Examples:
      | role_value           | role_classification              |
      | system_admin         | Platform-level                   |
      | bank_admin           | Tenant-level operational role    |
      | support_user         | Tenant-level operational role    |
      | auditor              | Tenant-level operational role    |
      | front_office         | Tenant-level operational role    |
      | back_office          | Tenant-level operational role    |
      | leasing_company_user | Tenant-level operational role    |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01 (self-profile sub-rule)
  # Any authenticated user opening their own profile must see their own data
  # regardless of standard cross-role visibility restrictions.
  # Self-profile shows: current role, effective tenant scope, MFA enrollment
  # status, last login, and lifecycle state.
  # Design: SELF PROFILE - support frame (line 10362) used as reference.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario: Authenticated user opens their own self-profile (AC-01)
    Given I am logged in as a "Support User" with email "support@bank.com"
    When I open my own user profile page
    Then I should see my own user identity section with my name and email address
    And I should see my current role and effective tenant scope
    And I should see my MFA enrollment status
    And I should see my last login timestamp
    And I should see my lifecycle state
    And the profile data displayed must correspond only to my own account record

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Unauthenticated requests and requests from roles without access rights
  # must be blocked when attempting to access User Detail View via direct URL.
  # The system must not reveal whether the target user exists (no enumeration).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Unauthorized direct URL access to User Detail View is blocked (AC-02)
    Given I am not authenticated
    When I navigate directly to the User Detail View URL for a known user
    Then I should be redirected to the login page or receive an access-denied response
    And the response must not reveal whether the target user exists
    And no user profile data must be exposed in the response

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (email change re-verification)
  # When a Power User changes another user's email address the system must
  # require re-verification via the new address before the change takes effect.
  # The previous email remains the recovery anchor until verification completes.
  # DESIGN GAP (MAJOR): email change flow not present in design frames —
  # test derives directly from story AC requirements.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p1
  Scenario: Admin changes a user's email address and re-verification is required (AC-07)
    Given I am logged in as a "Power User"
    And I have opened the User Detail View for "Anna Kowalski"
    And I have clicked "Edit" on the "USER IDENTITY" section
    When I change the email address to "anna.new@bank.com" and submit the change
    Then the system must dispatch a verification email to "anna.new@bank.com"
    And "anna.kowalski@bank.com" must remain the active login and recovery email until verification is completed
    And the email address change must be recorded in the audit trail

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (self-service email edit blocked)
  # Authenticated users must not be able to modify their own email address via
  # the self-profile page. The email field on self-profile must be read-only
  # or the edit action must be rejected by the system.
  # DESIGN GAP: email field editability on self-profile not confirmed in design.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p1 @e2e-ready
  Scenario: Authenticated user cannot self-service edit their own email address (AC-07)
    Given I am logged in as a "Support User" with email "support@bank.com"
    When I open my own user profile page and attempt to edit my email address field
    Then the email field must not accept input or must not be interactable
    And any attempt to submit an email change for my own account must be rejected by the system

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16
  # Leasing Company Users must have zero visibility of User Detail View:
  # no navigation entries, no accessible routes, and no related APIs.
  # The system must not expose access-denied placeholders for hidden modules.
  # Design: SELF PROFILE - Leasing Company User frame (line 10795) shows LC
  # self-profile only; no admin User Detail navigation present.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @p0 @e2e-ready
  Scenario: Leasing Company User sees no User Detail View navigation or accessible routes (AC-16)
    Given I am logged in as a "Leasing Company User"
    When I inspect the application navigation menu
    Then I should see no link or menu entry referencing "User management" or user administration
    When I attempt to navigate directly to the User Detail View URL
    Then the route must be blocked without exposing an access-denied placeholder for the administration module
    And any related user administration API endpoint must return an unauthorized response
```
