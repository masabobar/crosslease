# PRD1042-44 — US 28.8 | User Management | Invitation-based Onboarding

Generated: 2026-06-12
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin (User Type `bank_tenant`) is now the only role authorized to invite bank tenant users. System Admin (`system_admin`) invitations are restricted to platform-level users (System Admin, Support, Auditor). Bank Admin can select any bank tenant role EXCEPT `bank_admin` (which is assigned at creation only, not via the invitation dialog).
Story: PRD1042-44 — US 28.8 | User Management | Invitation-based Onboarding
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (17 ACs, description present, stakeholder-reviewed, UAT ready)
ACs with Gherkin scenarios: 5 of 17 | Blocked: 8 (D19, D21, M2-design) | Excluded: 4 (edge-case or separate-feature — scope filter table only)
Figma design: Node 396-21006, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "Account Activation / Password Setup" (Stage 2 PARTIAL — node 396-21006 not fetchable this run; only admin-side node 96:71636 verified; activation/password-setup screen unverified)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                          | Blocking dependency                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| AC-04 | Valid invitation link → password setup page requires a live, extractable activation token; activation screen design unverified  | D19 — Throwaway user with extractable token   |
| AC-05 | Invalid/expired/used token block + no-info-leak + rate-limit needs a real token to manipulate                                   | D19 — Throwaway user with extractable token   |
| AC-06 | Password + confirmation → activation requires reaching the activation page via a live token                                     | D19 — Throwaway user with extractable token   |
| AC-07 | Password policy/mismatch validation on the activation form requires reaching that form via a live token                         | D19 — Throwaway user with extractable token   |
| AC-08 | Activation success → status Active + token marked used requires completing the live activation flow                             | D19 — Throwaway user with extractable token   |
| AC-09 | Used-token reuse rejection requires consuming then replaying a live token                                                       | D19 — Throwaway user with extractable token   |
| AC-13 | Admin revokes invitation → token invalid immediately; Revoke affordance absent from design + needs token to verify invalidation | M2 (design) + D19                             |
| AC-15 | Auditor activation only if validity period active requires a live token AND auditor-validity clock control                      | D19 + D21 — AUDITOR_VALIDITY_MINUTES override |

---

## AC Scope Filter

| AC    | Description                                                                                         | Classification     | Rationale                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Admin creates invitation (email, role, scope) → token generated + email sent                        | `happy-path`       | Core admin success flow; role-authority split enforced (System Admin invites platform users; Bank Admin invites bank tenant users)  |
| AC-02 | Token generated securely; raw token NOT stored plain, NOT in API response body                      | `edge-case`        | Internal security property; not UI-observable. Drives D19 (token not extractable from API)                                          |
| AC-03 | Token expires after configurable period (default 48h, tenant-configurable)                          | `edge-case`        | Timing/TTL behaviour; no TTL-config UI; not E2E-observable without clock control                                                    |
| AC-04 | Valid link → access to password setup page; server-side validation                                  | `Blocked`          | D19 — no extractable token; activation screen design unverified                                                                     |
| AC-05 | Invalid/expired/used token blocked; no info leak; rate-limited                                      | `Blocked`          | D19 — requires a real token to manipulate into invalid/used states                                                                  |
| AC-06 | Valid password + confirmation → account activated, password hashed                                  | `Blocked`          | D19 — must reach activation page via a live token                                                                                   |
| AC-07 | Password fails policy / mismatch → validation error, no activation                                  | `Blocked`          | D19 — activation form only reachable via live token                                                                                 |
| AC-08 | Activation success → status Active; activation timestamp; token marked used; scope applied          | `Blocked`          | D19 — requires completing the live activation flow                                                                                  |
| AC-09 | Used token reused → rejected; no reactivation                                                       | `Blocked`          | D19 — requires consuming then replaying a live token                                                                                |
| AC-10 | Unactivated user attempts to log in → access prevented; no active session token                     | `main-error`       | Testable now: a seeded Invited/Pending user can attempt UI login and be blocked. No token needed                                    |
| AC-11 | Role/scope predefined, applied on activation; one tenant; LC assigned; FO/BO mutually exclusive     | `happy-path`       | Admin-create side design-verified; covered by the AC-01 role Outline + Four-Eyes privileged variant + Bank Admin role-selector rule |
| AC-12 | Invitation/activation events audit-logged (actor, user, timestamp, role, status, action type)       | `edge-case`        | Audit log format/persistence is backend; not E2E-observable                                                                         |
| AC-13 | Admin revokes pending invitation → token invalid immediately; revoked status visible                | `Blocked`          | M2 — Revoke affordance absent from design; also needs D19 to verify token invalidation                                              |
| AC-14 | Admin resends expired/pending invitation → new token, old invalidated; new expiry                   | `main-error`       | Resend action affordance design-verified (context menu + profile panel); UI-testable. Old-token invalidation needs D19              |
| AC-15 | Auditor activation only if validity period active; expired/missing engagement blocks activation     | `Blocked`          | D19 + D21 — requires live token and auditor-validity clock override                                                                 |
| AC-16 | LC User activation only with valid LC assignment; LC user must NOT access User Management modules   | `separate-feature` | Activation-gating needs D19; the LC-cannot-access-User-Management rule is owned by PRD1042-51. 1 RBAC negative auto-applied here    |
| AC-17 | API role/scope/tenant/token/validity checks server-authoritative; direct API manipulation prevented | `main-error`       | Role-authority split (System Admin vs Bank Admin) and cross-tenant isolation are directly testable via UI/API negatives             |

**Gherkin generated for:** AC-01, AC-11, AC-10, AC-14, AC-16 (RBAC negative), AC-17 (role-authority + cross-tenant)
**Blocked (no Gherkin):** AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-13, AC-15
**No Gherkin (edge-case or separate-feature):** AC-02, AC-03, AC-12, AC-16 (activation-gating)

---

## Scenarios summary

| Tag           | Scenario                                                                                  | AC           | Priority | E2E |
| ------------- | ----------------------------------------------------------------------------------------- | ------------ | -------- | --- |
| `@happy-path` | System Admin creates invitation for platform-level roles (Scenario Outline — 3 roles)     | AC-01, AC-11 | P0       | ✅  |
| `@happy-path` | Bank Admin creates invitation for bank tenant users within own tenant (Outline — 3 roles) | AC-01, AC-11 | P0       | ✅  |
| `@happy-path` | Privileged platform-role invitation requires Four-Eyes approval (Outline — 2 roles)       | AC-11        | P0       | ✅  |
| `@main-error` | Invitation form rejects submission with missing required Email field                      | AC-01        | P0       | ✅  |
| `@main-error` | System Admin cannot invite bank tenant users                                              | AC-01, AC-17 | P0       | ✅  |
| `@main-error` | Bank Admin cannot invite platform-level users                                             | AC-01, AC-17 | P0       | ✅  |
| `@main-error` | Bank Admin cannot invite users into another tenant (cross-tenant 404)                     | AC-17        | P0       | ✅  |
| `@main-error` | Bank Admin role selector excludes `bank_admin` (assigned at creation only)                | AC-11        | P0       | ✅  |
| `@main-error` | Unactivated user cannot log in (Scenario Outline — 2 statuses)                            | AC-10        | P0       | ✅  |
| `@main-error` | Admin resends a pending invitation via the row context menu                               | AC-14        | P0       | ✅  |
| `@main-error` | Leasing Company User cannot access the User Management module                             | AC-16        | P0       | ✅  |

Active scenario blocks: 11 (4 Outlines + 7 Scenarios)
E2E automation candidates: 11 of 11 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.8 @p0
Feature: Invitation-based Onboarding (US 28.8 — PRD1042-44)
  As an authorized admin
  I want to invite users by email with a predefined role and scope
  So that new users can securely activate accounts with the correct access context

  # Role authority split (per PRD1042-48, Ivan Mladenovic 2026-07-06):
  #   - System Admin (system_admin, User Type: platform) invites platform-level users only
  #     (System Admin, Support, Auditor).
  #   - Bank Admin (bank_admin, User Type: bank_tenant) is the only role authorized to
  #     invite bank tenant users (Front Office, Back Office, Support scoped to tenant, Auditor
  #     scoped to tenant), within its own tenant only. bank_admin cannot invite platform users
  #     and cannot invite bank_admin itself (bank_admin is assigned at creation only).

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-11 (System Admin, platform-level invitations)
  # System Admin creates invitations for platform-level roles. The system
  # generates a token, sends an invitation email, and predefines role/scope
  # that are applied on activation. Standard (non-privileged) platform roles
  # are created in the Invited state directly from the Create & invite dialog.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-11 @p0 @e2e-ready
  Scenario Outline: System Admin creates invitation for platform-level roles (AC-01, AC-11)
    Given I am logged in as a System Admin
    And I am on the User Management page
    And the "Create & invite user" dialog is open
    When I enter email "<email>"
    And I select role "<role>"
    And I submit the invitation
    Then I should see a confirmation that the user was created
    And the confirmation should state an invitation is on its way to "<email>"
    And the new user should appear in the User Management table with status "Invited"
    And the new user should have role "<role>"

    Examples:
      | role          | email                              |
      | Support       | invite.support@platform.example    |
      | Auditor       | invite.auditor@platform.example    |
      | System Admin  | invite.sysadmin@platform.example   |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-11 (Bank Admin, tenant-level invitations)
  # Bank Admin creates invitations for bank tenant users within its own tenant.
  # The scope is implicitly the Bank Admin's own tenant (Bank Admin cannot
  # assign a different tenant). Role selector offers all bank tenant roles
  # EXCEPT bank_admin.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-11 @p0 @e2e-ready
  Scenario Outline: Bank Admin creates invitation for bank tenant users within own tenant (AC-01, AC-11)
    Given I am logged in as a Bank Admin for "Bank Tenant A"
    And I am on the User Management page
    And the "Create & invite user" dialog is open
    When I enter email "<email>"
    And I select role "<role>"
    And I submit the invitation
    Then I should see a confirmation that the user was created
    And the confirmation should state an invitation is on its way to "<email>"
    And the new user should appear in the User Management table with status "Invited"
    And the new user should have role "<role>"
    And the new user should be scoped to "Bank Tenant A"

    Examples:
      | role                  | email                          |
      | Front Office          | invite.fo@bank-a.example       |
      | Back Office           | invite.bo@bank-a.example       |
      | Leasing Company User  | invite.lc@leaseco-one.example  |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-11 (Four-Eyes privileged path)
  # Privileged platform roles (System Admin, Auditor) require a second
  # authorized admin to approve. The dialog shows an amber Four-Eyes alert
  # and the user is created in the Pending state rather than Invited.
  # Design-verified in node 96:71636.
  # ---------------------------------------------------------------------------

  @happy-path @ac-11 @p0 @e2e-ready
  Scenario Outline: Privileged platform-role invitation requires Four-Eyes approval (AC-11)
    Given I am logged in as a System Admin
    And the "Create & invite user" dialog is open
    When I select role "<role>"
    Then I should see an alert that this role requires a second authorized admin to approve
    When I enter email "<email>"
    And I submit the invitation
    Then the new user should appear in the User Management table with status "Pending"

    Examples:
      | role          | email                              |
      | System Admin  | invite.sysadmin@platform.example   |
      | Auditor       | invite.auditor@platform.example    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01
  # The invitation form must block submission when a required field is missing.
  # Email is mandatory; submitting without it shows a validation error and no
  # invitation is created.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0 @e2e-ready
  Scenario: Invitation form rejects submission with missing required Email field (AC-01)
    Given I am logged in as a Bank Admin for "Bank Tenant A"
    And the "Create & invite user" dialog is open
    And I select role "Front Office"
    When I submit the invitation without entering an email
    Then I should see a validation error on the email field
    And no invitation should be created
    And the dialog should remain open

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01, AC-17 (Role-authority split enforcement)
  # System Admin authority is restricted to platform-level user invitations.
  # Attempting to invite a bank tenant user (Front Office, Back Office, LC User)
  # from a System Admin session must be rejected. Per Jira description:
  # "System Admin (platform) Cannot: administer bank (tenant) user onboarding —
  # that belongs to the Power User (Bank Admin)."
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @ac-17 @rbac @p0 @e2e-ready
  Scenario: System Admin cannot invite bank tenant users (AC-01, AC-17)
    Given I am logged in as a System Admin
    And the "Create & invite user" dialog is open
    Then the role selector should NOT offer bank tenant roles
    And the role selector should NOT offer "Front Office"
    And the role selector should NOT offer "Back Office"
    And the role selector should NOT offer "Leasing Company User"
    And the role selector should NOT offer "Bank Admin"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01, AC-17 (Role-authority split enforcement, mirror)
  # Bank Admin authority is restricted to bank tenant user invitations within
  # its own tenant. Attempting to invite a platform-level user must be blocked.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @ac-17 @rbac @p0 @e2e-ready
  Scenario: Bank Admin cannot invite platform-level users (AC-01, AC-17)
    Given I am logged in as a Bank Admin for "Bank Tenant A"
    And the "Create & invite user" dialog is open
    Then the role selector should NOT offer platform-level roles
    And the role selector should NOT offer "System Admin"
    And the role selector should NOT offer "Support" scoped to platform
    And the role selector should NOT offer "Auditor" scoped to platform

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-17 (Tenant isolation on invitation creation)
  # A Bank Admin's tenant scope is fixed to its own tenant. Any attempt to
  # invite a user into a different tenant — via direct API manipulation of
  # tenant_scope — must be rejected with a 404 (RefiNext tenant-isolation
  # rule: cross-tenant → 404, not 403, to prevent tenant enumeration).
  # ---------------------------------------------------------------------------

  @main-error @ac-17 @rbac @tenant-isolation @p0 @e2e-ready
  Scenario: Bank Admin cannot invite users into another tenant (AC-17)
    Given I am logged in as a Bank Admin for "Bank Tenant A"
    When I POST an invitation to "/api/users/invitations" with tenant_scope "Bank Tenant B" and role "Front Office"
    Then the response status should be 404
    And no invitation should be created for "Bank Tenant B"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (Bank Admin role selector rule)
  # `bank_admin` is assigned at creation only — never available in the
  # invitation dialog's role selector. Even a Bank Admin cannot invite another
  # Bank Admin via the invitation flow.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready
  Scenario: Bank Admin role selector excludes bank_admin (AC-11)
    Given I am logged in as a Bank Admin for "Bank Tenant A"
    And the "Create & invite user" dialog is open
    Then the role selector should NOT offer "Bank Admin"
    And the role selector should offer "Front Office"
    And the role selector should offer "Back Office"
    And the role selector should offer "Leasing Company User"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # A user who has been invited but has not completed onboarding must not be
  # able to log in. Pending/Invited users must not receive an active session.
  # Testable with a seeded user in the Invited or Pending state — no activation
  # token required.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0 @e2e-ready
  Scenario Outline: Unactivated user cannot log in (AC-10)
    Given a "<status>" user with email "<email>" exists
    When I log in with email "<email>" and a valid password
    Then I should NOT be authenticated
    And I should NOT receive an active session
    And I should remain blocked from protected platform areas

    Examples:
      | status   | email                          |
      | Invited  | pending.fo@bank-a.example      |
      | Pending  | pending.admin@bank-a.example   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # An authorized Admin can resend an invitation that is still pending. The
  # resend action is reachable from the row context menu (design-verified).
  # This scenario covers the resend ACTION only; verifying the previous token
  # was invalidated requires D19 and is tracked as Blocked.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0 @e2e-ready
  Scenario: Admin resends a pending invitation via the row context menu (AC-14)
    Given I am logged in as a Bank Admin for "Bank Tenant A"
    And a "Invited" user with email "invite.fo@bank-a.example" exists in the User Management table
    When I open the row context menu for that user
    And I select "Resend invitation"
    Then I should see a confirmation that the invitation was resent
    And the user should remain in status "Invited"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16 (RefiNext RBAC domain negative)
  # A Leasing Company User must not have access to the User Management module.
  # Auto-applied role-access negative; the broader LC access restrictions are
  # owned by PRD1042-51.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @rbac @p0 @e2e-ready
  Scenario: Leasing Company User cannot access the User Management module (AC-16)
    Given I am logged in as a Leasing Company User
    When I attempt to navigate to the User Management page
    Then I should NOT see the User Management module in navigation
    And I should be denied access to the User Management page
```
