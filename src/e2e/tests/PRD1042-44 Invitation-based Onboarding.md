# PRD1042-44 — US 28.8 | USER MANAGEMENT | Invitation-based Onboarding

Generated: 2026-06-02
Story: PRD1042-44 — US 28.8 | USER MANAGEMENT | Invitation-based Onboarding
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (17 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 3 of 17 | Blocked: 9 (D19/D21/M2) | Excluded: 5 (edge-case or separate-feature — scope filter table only)
Figma design: Node 96:71636, file j5hq5cQgHWdOtzLvSX0jvj — Screen "User invitation" (Stage 2 PARTIAL — admin invitation management screens complete; activation/password-setup page not in this node)

---

## Blocked ACs (no scenarios generated)

| AC | Reason | Blocking dependency |
|----|--------|---------------------|
| AC-04 | Activation link test requires a valid invitation token; AC-02 prohibits the raw token in the API response, so the token cannot be retrieved programmatically — email test infra or throwaway user API with known token state is required | D19 — Throwaway user creation/deletion API (invitation provisioning with extractable token) |
| AC-05 | Expired/invalid/revoked token error screen requires provisioning a token in a specific invalid state | D19 — Throwaway user creation/deletion API |
| AC-06 | Password setup page is only reachable via a valid invitation token link | D19 — Throwaway user creation/deletion API |
| AC-07 | Password validation on activation page requires first reaching that page via a valid token | D19 — Throwaway user creation/deletion API |
| AC-08 | Account activation status change (Invited → Active) requires completing the AC-04 + AC-06 token-based flow | D19 — Throwaway user creation/deletion API |
| AC-09 | Single-use token reuse test requires using the invitation token once and then attempting to reuse the same URL | D19 — Throwaway user creation/deletion API |
| AC-10 | Login-before-activation test requires seeding a user in "Invited" status with no password — no credentials exist for such a user, making a login attempt untestable without D19 | D19 — Throwaway user creation/deletion API |
| AC-13 | Revoke invitation has no unambiguous UI element; design shows "Deactivate user" but no explicit "Revoke invitation" action (Stage 3 mismatch M2 unresolved — requires designer/BA clarification before a scenario can be written) | M2 — Design gap: revoke vs deactivate action ambiguous; needs design update + D19 for invited-state user |
| AC-15 | Auditor engagement validation on activation requires provisioning an auditor invitation with an expired or missing engagement window; also depends on completing the blocked AC-04/AC-06 activation flow | D19 + D21 — Throwaway user API + AUDITOR_VALIDITY_MINUTES env override |

---

## AC Scope Filter

| AC | Description | Classification | Rationale |
|----|-------------|----------------|-----------|
| AC-01 | Admin creates invitation with email, role, and scope → invitation email sent; user appears as "Invited" | `happy-path` | Core admin action; "Create & invite user" dialog fully present in design |
| AC-02 | System generates unique secure token not exposed in API response body | `edge-case` | Backend security implementation; no UI assertion possible; token exposure is a backend integration test concern |
| AC-03 | Token expires after a configurable TTL | `separate-feature` | Token TTL timing behaviour; covered by token-lifecycle spec using D16 (TEST_TOKEN_TTL_SECONDS) |
| AC-04 | User clicks valid invitation link → redirected to password setup page | `Blocked` | D19 — valid token required; not obtainable via API (prohibited by AC-02); activation page not in this Figma frame |
| AC-05 | Expired, invalid, or revoked token blocks activation with appropriate message | `Blocked` | D19 — requires provisioning a token in an invalid state |
| AC-06 | User enters valid password + confirmation → account activated | `Blocked` | D19 — requires valid token to reach the activation page |
| AC-07 | Password policy or confirmation mismatch → validation error prevents submission | `Blocked` | D19 — requires valid token to reach the activation page |
| AC-08 | After password setup, account status changes to Active and invitation token is marked used | `Blocked` | D19 — requires completing the AC-04 + AC-06 flow |
| AC-09 | Used invitation token cannot be reused | `Blocked` | D19 — requires provisioning a previously-used invitation token |
| AC-10 | User in Pending Activation state cannot log in | `Blocked` | D19 — requires seeding an Invited user with no password for a login-attempt test |
| AC-11 | Role and scope predefined and applied on activation; Front Office and Back Office mutually exclusive | `edge-case` | Role is visible in the table row after invitation (covered by AC-01 happy path assertion); role exclusivity is server-enforced and not assertable as a standalone E2E UI check |
| AC-12 | Audit events logged for invitation creation, use, expiry, revocation | `edge-case` | Backend-only audit trail; no E2E-assertable audit API in scope for this story |
| AC-13 | Admin revokes pending invitation → token immediately invalid | `Blocked` | M2 — design gap: "Revoke invitation" UI element absent; only "Deactivate user" visible (Stage 3 mismatch M2) |
| AC-14 | Admin resends invitation to expired/pending user → new token issued, previous token invalidated | `happy-path` | "Resend invitation" present in context menu and user profile panel; testable as an admin action |
| AC-15 | Auditor activation only succeeds if access validity period is active and assigned | `Blocked` | D19 + D21 — throwaway auditor user + AUDITOR_VALIDITY_MINUTES override required |
| AC-16 | Leasing Company User activation only succeeds if valid Leasing Company assignment exists | `edge-case` | Backend validation enforced server-side; no separate UI error screen in design; LC User access restriction is covered by the RBAC domain scenario below |
| AC-17 | Backend/API validation rejects invalid invitation or activation requests server-authoritatively | `edge-case` | Server-side enforcement; not visible or assertable at the E2E UI layer |

**Gherkin generated for:** AC-01, AC-14
**Blocked (no Gherkin):** AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-13, AC-15
**No Gherkin (edge-case or separate-feature):** AC-02, AC-03, AC-11, AC-12, AC-16, AC-17

---

## Scenarios summary

| Tag | Scenario | AC | Priority |
|-----|----------|----|----------|
| `@happy-path` | Admin creates invitation for standard platform and tenant roles (Scenario Outline — 3 roles) | AC-01 | P0 |
| `@happy-path` | Admin invites a privileged role — Four-Eyes approval alert shown, user created as Pending | AC-01 | P0 |
| `@main-error` | Missing required Email field prevents invitation form submission | AC-01 | P0 |
| `@happy-path` | Admin resends invitation to a pending user via context menu | AC-14 | P0 |
| `@main-error` | Leasing Company User cannot access User Management (RBAC domain rule) | Visibility rules | P0 |

Active scenario blocks: 5 (1 Outline + 4 Scenarios)

---

## Feature file

```gherkin
@user-management @us-28.8 @p0
Feature: Invitation-based User Onboarding (US 28.8 — PRD1042-44)
  As a system administrator
  I want to invite new users to the RefiNext platform via a secure invitation link
  So that they can activate their accounts with the correct role and tenant scope

  Background:
    Given I am logged in as "system_admin"
    And I am on the User Management page

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Verifies the core admin invitation creation flow for three representative role
  # types: a platform-level role (no tenant required), a tenant-level operational
  # role (tenant required), and a Leasing Company User (tenant + LC assignment
  # required). After submission, the dialog closes, a "User created" toast
  # appears, and the new row is visible in the table with status "Invited".
  # Note: email delivery is not directly assertable at E2E layer — the test
  # asserts on the UI outcome only (status "Invited" + success notification).
  # Design source: "Create & invite user" dialog, ADMIN section of Figma node.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario Outline: Admin creates invitation for standard platform and tenant roles (AC-01)
    When I click the "Invite user" button
    And I fill in the "Email" field with "<email>"
    And I select "<role>" from the "Role" dropdown
    And I <scope_action>
    And I click the "Create & invite user" submit button
    Then the "Create & invite user" dialog should close
    And a success notification with title "User created" should be visible
    And a user row with email "<email>" should appear in the user table
    And that user's status should be "Invited"
    And that user's role badge should display "<role_label>"

    Examples:
      | role                 | email                      | scope_action                                           | role_label       |
      | support_user         | support@refinext-test.com  | proceed without selecting a tenant                     | Support          |
      | front_office         | fo@refinext-test.com       | select "Tenant A" from the "Tenant" field              | Front Office     |
      | leasing_company_user | lc@refinext-test.com       | select "Tenant A" and then select "LC-01" as the leasing company | Leasing Co. User |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01 (Four-Eyes domain rule)
  # When a privileged role (system_admin / auditor) is selected, the dialog
  # shows an amber advisory alert: "This role requires a second authorized admin
  # to approve before the account activates. User remains in Pending Activation."
  # The form can still be submitted, but the created user appears with status
  # "Pending" (not "Invited") and requires a second admin approval before
  # activation. This is the Four-Eyes enforcement visible in the design.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario: Admin invites a privileged role — Four-Eyes approval alert appears and user is Pending (AC-01)
    When I click the "Invite user" button
    And I fill in the "Email" field with "admin2@refinext-test.com"
    And I select "system_admin" from the "Role" dropdown
    Then an advisory alert should be visible containing "This role requires a second authorized admin to approve before the account activates"
    When I click the "Create & invite user" submit button
    Then the "Create & invite user" dialog should close
    And a success notification should be visible
    And a user row with email "admin2@refinext-test.com" should appear in the user table
    And that user's status should be "Pending"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01 (form validation)
  # Verifies that the invitation form blocks submission when the mandatory Email
  # field is empty. The "Create & invite user" button must not submit the form
  # and a validation error must appear on the Email field.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0
  Scenario: Missing Email field prevents invitation form submission (AC-01)
    When I click the "Invite user" button
    And I leave the "Email" field empty
    And I select "support_user" from the "Role" dropdown
    And I click the "Create & invite user" submit button
    Then the form should not be submitted
    And the "Create & invite user" dialog should remain open
    And a validation error should be visible for the "Email" field

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-14
  # Verifies the resend invitation flow via the row context menu (ellipsis-vertical
  # icon → "Resend invitation" option). A new invitation token is issued and the
  # previous token is invalidated. The user's "Invitation sent" timestamp in the
  # profile panel should be refreshed. Precondition: a user in "Invited" status
  # exists (provisioned in test setup by running the AC-01 invitation creation
  # or via a pre-seeded fixture user).
  # ---------------------------------------------------------------------------

  @happy-path @ac-14 @p0
  Scenario: Admin resends invitation to a pending user via context menu (AC-14)
    Given a user with email "pending@refinext-test.com" exists with status "Invited"
    When I open the action menu for the user row with email "pending@refinext-test.com"
    And I click "Resend invitation" in the action menu
    Then a success notification or confirmation should be visible
    And the "Invitation sent" timestamp for "pending@refinext-test.com" should be more recent than before

  # ---------------------------------------------------------------------------
  # MAIN ERROR — Visibility rules (RBAC domain rule)
  # Per story visibility rules, invitation management screens, routes, APIs, and
  # navigation entries must be completely invisible to Leasing Company Users.
  # This scenario verifies that a leasing_company_user cannot access the
  # User Management route and does not see the invitation controls.
  # ---------------------------------------------------------------------------

  @main-error @p0
  Scenario: Leasing Company User cannot access User Management page (visibility rules)
    Given I am logged in as "leasing_company_user"
    When I navigate to the User Management page
    Then I should NOT see the User Management page content
    And I should NOT see an "Invite user" button
    And I should be redirected away from the page or shown an access-denied response
```

---

## Blockers and Gaps Summary

| Severity | Item | AC | Resolution required from |
|----------|------|----|--------------------------|
| BLOCKER (D19) | Throwaway user creation/deletion API — blocks all activation-side scenarios (valid link, expired token, password setup, password validation, activation confirmation, single-use enforcement, login-before-activation, auditor engagement validation) | AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-15 | Dev team — provide API endpoint for seeding users in specific invitation/activation states with extractable or pre-set token |
| BLOCKER (M2) | Design gap: "Revoke invitation" UI action absent from design; only "Deactivate user" visible in context menu and profile panel — cannot write AC-13 scenario until the two actions are disambiguated | AC-13 | Designer + BA — confirm whether "Deactivate user" is the revocation mechanism or whether a separate "Revoke invitation" action is required; update Figma node 96:71636 accordingly |
| BLOCKER (D21) | AUDITOR_VALIDITY_MINUTES env override — required for auditor engagement expiry test (AC-15) in addition to D19 | AC-15 | Dev team — provide alongside D19 resolution |
| MAJOR | Activation page (password setup screen) not found in Figma node 96:71636 — ACs AC-04 through AC-09 have no design coverage in this frame | AC-04, AC-05, AC-06, AC-07, AC-08, AC-09 | Designer — provide Figma frame URL for the activation / password-setup screen so Stage 2 + Stage 3 can be re-run for those ACs |
| MAJOR | "Create & invite user" dialog form field labels not extractable at Figma node depth — cannot verify all required fields (Email, Role, Tenant, Access Validity Period, Leasing Company) are present in the rendered form | AC-01 | Designer — ensure Default Input component instances have explicit label overrides visible in the Figma design tree |
| MAJOR | Support role section in Figma shows "Invite user" button, but story Visibility Rules explicitly state Support Users cannot create invitations — potential design error | AC-01 | Designer + BA — confirm whether the SUPPORT section of node 96:71636 incorrectly shows the invite button or whether Support access was intentionally widened |
| INFO | Password policy rules (minimum length, character requirements) are referenced in AC-06/AC-07 but not specified in the story — test values for password validation scenarios (AC-07, when unblocked) depend on this | AC-07 | BA / PO — document the configured password policy so valid and invalid test passwords can be specified |
