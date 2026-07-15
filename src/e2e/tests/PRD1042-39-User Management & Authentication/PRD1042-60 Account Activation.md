# PRD1042-60 — US 28.16 | USER MANAGEMENT | Account Activation

Generated: 2026-06-12
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin activates bank tenant users in own tenant; System Admin no longer activates bank users. `bank_admin` added as an activator role variant in the AC-04 Outline.
Story: PRD1042-60 — US 28.16 | USER MANAGEMENT | Account Activation
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (13 ACs, description present, stakeholder-reviewed by Philipp Maute, UAT ready)
ACs with Gherkin scenarios: 8 of 13 | Blocked: 0 | Excluded: 5 (edge-case — scope filter table only)
Figma design: Node 485:1714, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "Account Activation" (Stage 2 FAILED — Figma REST API not reachable via WebFetch auth, MCP rate-limited; copy/state assertions kept generic)

---

## AC Scope Filter

| AC    | Description                                                                                                                 | Classification | Rationale                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| AC-01 | Valid invitation token → activation form displayed (server-side validated, unused, active, account Invited)                 | `happy-path`   | Core entry flow; UI assertion of form visibility on valid token                                |
| AC-02 | Expired invitation blocks activation; no sensitive token state exposed in error                                             | `main-error`   | Blocks core workflow; primary error path                                                       |
| AC-03 | Password and confirm password mismatch blocks activation; validation error shown                                            | `main-error`   | Blocks core workflow; primary input validation error                                           |
| AC-04 | Successful activation — token marked used, timestamp recorded, role/tenant/LC scope/access validity preserved, audit logged | `happy-path`   | Core success path; multi-role coverage via Outline                                             |
| AC-05 | Lifecycle Pending Activation → Active                                                                                       | `edge-case`    | Internal lifecycle state machine; verified server-side as part of AC-04 success path           |
| AC-06 | Role preserved after activation (server-authoritative)                                                                      | `edge-case`    | Server-authoritative invariant; no separate UI affordance; covered implicitly by AC-04         |
| AC-07 | Tenant + LC scope preserved after activation (server-authoritative)                                                         | `edge-case`    | Server-authoritative invariant; covered implicitly by AC-04                                    |
| AC-08 | Deactivated/expired/revoked/already-active account blocked                                                                  | `main-error`   | Blocks core workflow; multiple invalid lifecycle states                                        |
| AC-09 | Audit logging for all outcomes (immutable, includes actor/timestamp/role/tenant/outcome)                                    | `edge-case`    | Backend audit trail; requires admin/audit endpoint to observe (D9); not a UI-visible behaviour |
| AC-10 | Backend/API enforcement — server-authoritative; frontend alone cannot determine eligibility                                 | `edge-case`    | Cross-cutting principle; implicitly verified across all main-error scenarios                   |
| AC-11 | Auditor activation requires active valid-from/valid-until; expired validity blocks activation                               | `main-error`   | Blocks core workflow for Auditor role; role-specific gating                                    |
| AC-12 | LC user activation requires valid tenant + LC scope; invalid combinations blocked                                           | `main-error`   | Blocks core workflow for LC user; tenant isolation rule                                        |
| AC-13 | Already-used activation token rejected; single-use enforcement                                                              | `main-error`   | Blocks core workflow; security-critical token reuse protection                                 |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-08, AC-11, AC-12, AC-13
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06, AC-07, AC-09, AC-10

---

## Scenarios summary

| Tag           | Scenario                                                                                           | AC    | Priority | E2E                |
| ------------- | -------------------------------------------------------------------------------------------------- | ----- | -------- | ------------------ |
| `@happy-path` | Activation form displayed when valid invitation link opened                                        | AC-01 | P0       | ⚙️ needs D19       |
| `@happy-path` | Successful activation activates account and redirects to landing page (Outline — 4 roles)          | AC-04 | P0       | ⚙️ needs D19       |
| `@main-error` | Expired invitation token blocks activation                                                         | AC-02 | P0       | ⚙️ needs D19       |
| `@main-error` | Password and confirm-password mismatch blocks activation                                           | AC-03 | P0       | ⚙️ needs D19       |
| `@main-error` | Invalid account state blocks activation (Outline — 3 states: deactivated, expired, already-active) | AC-08 | P0       | ⚙️ needs D19       |
| `@main-error` | Auditor with expired access validity cannot activate                                               | AC-11 | P0       | ⚙️ needs D19 + D21 |
| `@main-error` | LC user with missing/invalid tenant or LC scope cannot activate                                    | AC-12 | P0       | ⚙️ needs D19 + D20 |
| `@main-error` | Already-used activation token is rejected on re-open                                               | AC-13 | P0       | ⚙️ needs D19       |

Active scenario blocks: 7 (2 Outlines + 5 Scenarios) — note: AC-13 lives in the same family as AC-02/AC-08 but is testable as a distinct re-open flow → kept as a separate Scenario; total table rows = 8
E2E automation candidates: 0 of 8 scenarios ✅ — all require D19 (throwaway user/invitation creation) at minimum

---

## Feature file

```gherkin
@auth @user-management @us-28.16 @p0
Feature: Account Activation (US 28.16 — PRD1042-60)
  As an invited user
  I want to activate my account from a valid invitation link
  So that I can access the platform with the role and scope provisioned for me

  Background:
    Given the activation page is accessible at the invitation link URL
    And no authenticated session is required to view the activation form

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Verify that opening a valid, unused, non-revoked invitation link for an
  # account in Invited / Pending Activation state displays the activation form
  # with the prefilled email and editable password fields.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario: Activation form displayed when valid invitation link opened (AC-01)
    Given an invited user with a valid, unused, non-revoked activation token exists
    And the user account is in "Pending Activation" state
    When the user opens the activation link
    Then the activation form should be displayed
    And the email field should be prefilled and non-editable
    And the "Set Password" field should be visible and editable
    And the "Confirm Password" field should be visible and editable
    And the "Activate Account" button should be visible

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # Verify that submitting valid activation data activates the account across
  # all four supported roles (bank_admin, front_office, auditor, lc_user).
  # bank_admin (user_type: bank_tenant) is the tenant-level admin role
  # provisioned per PRD1042-48 — Bank Admin activates other bank tenant users,
  # so bank_admin's own account must also be activatable via invitation link.
  # Role, tenant scope, LC scope, and access validity are preserved from
  # provisioning data — none of these are editable during activation. The
  # activated user is redirected to their role-specific landing page on success.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0
  Scenario Outline: Successful activation activates account and redirects to role landing page (AC-04)
    Given an invited <role> user with a valid, unused activation token exists
    And the user account is in "Pending Activation" state
    When the user opens the activation link
    And enters a valid password in "Set Password"
    And enters the matching password in "Confirm Password"
    And submits the activation form
    Then the account should be activated
    And the user should be redirected to <landing_page>
    And the role assigned during provisioning should be preserved
    And the tenant scope assigned during provisioning should be preserved

    Examples:
      | role         | landing_page       |
      | bank_admin   | /dashboard/admin   |
      | front_office | /dashboard/fo      |
      | auditor      | /audit/trail       |
      | lc_user      | /workspace/lc      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Expired invitation tokens must be rejected by the server. The error
  # message must not leak account existence, token state, or other sensitive
  # data (per security rules in the story).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario: Expired invitation token blocks activation (AC-02)
    Given an invited user has an activation token that is past its expiry timestamp
    When the user opens the activation link
    Then activation should be blocked
    And the user should see an "invitation no longer valid" message
    And the message should NOT contain "expired"
    And the message should NOT contain the email address
    And the activation form should NOT be displayed

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Password and confirm password must match. Validation is enforced both in
  # the UI and on the backend. Failed password setup must not activate the
  # account. Password values must never be logged.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Password and confirm-password mismatch blocks activation (AC-03)
    Given an invited user with a valid, unused activation token exists
    And the user has opened the activation form
    When the user enters "ValidPassword123!" in "Set Password"
    And the user enters "DifferentPassword456!" in "Confirm Password"
    And the user submits the activation form
    Then a validation error should be shown
    And the activation form should remain displayed
    And the account should NOT be activated
    And no session should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Accounts that are deactivated, expired, or already active cannot be
  # activated via an old invitation link. The system must not create a
  # session and must audit-log the invalid state attempt.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario Outline: Invalid account state blocks activation (AC-08)
    Given an invited user whose account is in <invalid_state> state exists
    And an old activation link still exists for this account
    When the user opens the activation link
    Then activation should be blocked
    And a generic error message should be displayed
    And the activation form should NOT be displayed
    And no session should be created

    Examples:
      | invalid_state    |
      | deactivated      |
      | expired          |
      | already_active   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Auditor users have a bounded access validity window (access_valid_from /
  # access_valid_until). Activation must be blocked if the validity period
  # is already expired or missing at the time the activation link is opened.
  # The error must not expose the exact validity boundary date.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Auditor with expired access validity cannot activate (AC-11)
    Given an invited auditor user with a valid, unused activation token exists
    And the auditor's access validity window is already in the past
    When the user opens the activation link
    Then activation should be blocked
    And a generic "access configuration" error message should be displayed
    And the activation form should NOT be displayed
    And the account should remain in "Pending Activation" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # Leasing Company users require a valid tenant scope AND a valid Leasing
  # Company scope linked to that tenant. Missing/invalid/unlinked scope must
  # block activation. This is the tenant isolation rule (404-not-403 pattern
  # expected at API level per RefiNext architecture constraint #5).
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0
  Scenario: LC user with missing or invalid tenant or LC scope cannot activate (AC-12)
    Given an invited leasing company user with a valid, unused activation token exists
    And the user's LC scope is missing or not linked to the assigned tenant
    When the user opens the activation link
    Then activation should be blocked
    And a generic "access configuration" error message should be displayed
    And the activation form should NOT be displayed
    And the account should remain in "Pending Activation" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Activation tokens are single-use. Once an activation has completed
  # successfully, the same link reopened must be rejected. No state changes,
  # no new session, audit-logged as token reuse attempt.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario: Already-used activation token is rejected on re-open (AC-13)
    Given an invited user has successfully completed activation
    And the activation token has been marked as used
    When the user reopens the original activation link
    Then activation should be blocked
    And a generic "link is not valid" message should be displayed
    And the activation form should NOT be displayed
    And no new session should be created
    And the previously activated user account should remain in "Active" state unchanged
```
