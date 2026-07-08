# PRD1042-43 — US 28.1 | USER MANAGEMENT | User Login

Generated: 2026-05-25
Story: PRD1042-43 — US 28.1 | USER MANAGEMENT | User Login
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (17 ACs, description present, stakeholder-reviewed, UAT ready)
ACs with Gherkin scenarios: 6 of 17 | Blocked: 6 (D16/D17/D18/D19) | Excluded: 5 (edge-case or separate-feature — scope filter table only)
Figma design: Node 319:163, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "Sign in" (Stage 2 COMPLETE)

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin is a tenant-level role (`user_type: bank_tenant`) and is now the ONLY role that can assign/change bank user roles — `system_admin` is now platform-only and NO LONGER manages bank users. Landing page for `bank_admin` is not yet specified in the Jira ticket or Figma design — used `/dashboard/admin` as best-inference placeholder pending design verification. See Open Questions below.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                         | Blocking dependency                          |
| ----- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| AC-10 | Account lockout requires admin API to reset lockout counter per email between test runs                        | D18 — Admin API reset lockout endpoint       |
| AC-11 | Negative scenario (no valid role) requires throwaway user creation API to seed a roleless user                 | D19 — Throwaway user creation/deletion API   |
| AC-12 | Negative scenario (invalid tenant/LC scope) requires throwaway user creation API to seed an invalid-scope user | D19 — Throwaway user creation/deletion API   |
| AC-15 | JWT validation enforcement requires ability to forge expired/tampered/wrong-issuer tokens                      | D17 — TEST_JWT_SECRET or test-forge endpoint |
| AC-16 | Token tampering protection requires same token-forge capability as AC-15                                       | D17 — TEST_JWT_SECRET or test-forge endpoint |
| AC-17 | Session timeout requires configurable TTL override to avoid 30-min real-time wait                              | D16 — TEST_TOKEN_TTL_SECONDS env override    |

---

## AC Scope Filter

| AC    | Description                                          | Classification     | Rationale                                                                                          |
| ----- | ---------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| AC-01 | Login form validation (required fields)              | `main-error`       | Directly blocks submission — core error path                                                       |
| AC-02 | Email format validation                              | `edge-case`        | Input format rule — covered implicitly by AC-08 path; separate validation unit test                |
| AC-03 | Successful login + session creation                  | `happy-path`       | Core success flow                                                                                  |
| AC-04 | MFA-governed session creation                        | `edge-case`        | Conditional on auth provider (R1); no design frame; not testable E2E until resolved                |
| AC-05 | Restricted access before auth completion             | `edge-case`        | Backend enforcement; testable via redirect behavior; rolled into happy-path post-auth assertion    |
| AC-06 | Session initialization (role/scope/permissions load) | `happy-path`       | Verified via role-based redirect behavior — same scenario as AC-07                                 |
| AC-07 | Role-based redirect                                  | `happy-path`       | Core success variant — 1 Scenario Outline covering all 6 roles                                     |
| AC-08 | Invalid credentials — generic error                  | `main-error`       | Directly blocks the user; primary security error state                                             |
| AC-09 | Account status validation (blocked accounts)         | `main-error`       | Directly blocks legitimate-credential users; key lifecycle gate                                    |
| AC-10 | Failed login attempts / lockout                      | `Blocked`          | D18 — lockout counter reset API required                                                           |
| AC-11 | Role validation (no valid role)                      | `Blocked`          | D19 — auto-applied domain negative; would generate 1 scenario once throwaway user API is available |
| AC-12 | Scope validation (invalid tenant/LC scope)           | `Blocked`          | D19 — auto-applied domain negative; would generate 1 scenario once throwaway user API is available |
| AC-13 | Permission enforcement                               | `separate-feature` | Covered by auth-guard specs across all feature stories; not login-specific                         |
| AC-14 | Audit logging                                        | `separate-feature` | Backend-only assertion; no E2E-assertable audit API; covered by backend integration tests          |
| AC-15 | JWT validation enforcement                           | `Blocked`          | D17 — TEST_JWT_SECRET or test-forge endpoint required                                              |
| AC-16 | Token tampering protection                           | `Blocked`          | D17 — TEST_JWT_SECRET or test-forge endpoint required                                              |
| AC-17 | Session timeout enforcement                          | `Blocked`          | D16 — TEST_TOKEN_TTL_SECONDS env override required                                                 |

**Gherkin generated for:** AC-01, AC-03, AC-06, AC-07, AC-08, AC-09
**Blocked (no Gherkin):** AC-10, AC-11, AC-12, AC-15, AC-16, AC-17
**No Gherkin (edge-case or separate-feature):** AC-02, AC-04, AC-05, AC-13, AC-14

---

## Scenarios summary

| Tag           | Scenario                                                                      | AC                  | Priority | E2E          |
| ------------- | ----------------------------------------------------------------------------- | ------------------- | -------- | ------------ |
| `@happy-path` | Valid login redirects to role-specific dashboard (Scenario Outline — 7 roles) | AC-03, AC-06, AC-07 | P0       | ✅           |
| `@main-error` | Missing required field prevents form submission                               | AC-01               | P0       | ✅           |
| `@main-error` | Invalid credentials show generic error message                                | AC-08               | P0       | ✅           |
| `@main-error` | Blocked account status prevents login (Scenario Outline — 4 statuses)         | AC-09               | P0       | ⚙️ needs D19 |

Active scenario blocks: 4 (2 Outlines + 2 Scenarios)
E2E automation candidates: 3 of 4 scenarios ✅

---

## Feature file

```gherkin
@auth @us-28.1 @p0
Feature: User Login (US 28.1 — PRD1042-43)
  As a user of the RefiNext platform
  I want to authenticate with my email address and password
  So that I can access the system with my assigned role and tenant context

  Background:
    Given the login page is accessible at "/login"
    And the "Sign in" button is visible

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03, AC-06, AC-07
  # Tests role-based redirect for all 6 roles in a single Outline.
  # Session initialization (AC-06) is verified implicitly by the presence of
  # the landing page content tied to the role — no generic /dashboard redirect.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @ac-06 @ac-07 @p0 @e2e-ready
  Scenario Outline: Valid credentials redirect to role-specific landing page (AC-03, AC-06, AC-07)
    Given a "<role>" user with email "<email>" and a valid password exists and is active
    When I enter "<email>" in the "Email address" field
    And I enter the valid password in the "Password" field
    And I click the "Sign in" button
    Then I should be redirected to "<landing_page>"
    And a session should be active with role "<role>"
    And the user's role context should be loaded from the server

    # NOTE (2026-07-08): `bank_admin` landing page is a best-inference placeholder
    # (`/dashboard/admin`) — design has NOT confirmed the actual route. Update
    # once the Bank Admin landing screen is added to Figma or specified in Jira.
    # `system_admin` is now platform-only per PRD1042-48 (2026-07-06) — retained
    # here because platform admins still log in to the same login screen.
    Examples:
      | role                  | email                      | landing_page     |
      | system_admin          | admin@refinext-test.com    | /dashboard       |
      | bank_admin            | bankadmin@refinext-test.com| /dashboard/admin |
      | front_office          | fo@refinext-test.com       | /dashboard       |
      | back_office_risk      | bo@refinext-test.com       | /dashboard       |
      | support_user          | support@refinext-test.com  | /dashboard       |
      | auditor               | auditor@refinext-test.com  | /dashboard       |
      | leasing_company_user  | lc@refinext-test.com       | /workspace       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01
  # Empty-field submission must show validation errors and prevent form submit.
  # Verifies the Sign in button is disabled / shows errors when fields are empty.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0 @e2e-ready
  Scenario: Empty form submission shows validation errors and does not submit (AC-01)
    Given no credentials have been entered
    When I click the "Sign in" button
    Then the form should not be submitted
    And a validation error should be visible for the "Email address" field
    And a validation error should be visible for the "Password" field

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Wrong credentials must show exactly "Invalid email or password." — no more.
  # Message must NOT reveal whether the email exists or whether the password
  # was wrong. This is the primary security control on account enumeration.
  # Note: exact message wording per AC-08. If design provides a different
  # string, update this scenario and log a COPY_MISMATCH defect.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0 @e2e-ready
  Scenario: Invalid credentials show generic non-revealing error message (AC-08)
    Given a user with email "valid@refinext-test.com" exists and is active
    When I enter "valid@refinext-test.com" in the "Email address" field
    And I enter "wrong-password-xyz" in the "Password" field
    And I click the "Sign in" button
    Then I should see the error message "Invalid email or password."
    And no session should be created
    And the error message should not contain "password"
    And the error message should not contain "account"
    And the error message should not contain "does not exist"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Blocked account states. Each state is a distinct business rule.
  # Uses Scenario Outline to cover all four blocked statuses efficiently.
  # Note: exact error message wording is not specified in the story or design.
  # Scenarios assert only that no session is created (behavioral assertion).
  # Update with copy assertions once designer confirms blocked-account state.
  # D19 dependency: seeded throwaway users required for each status.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario Outline: Blocked account status prevents login and creates no session (AC-09)
    Given a "<status>" user with email "<email>" exists
    When I enter "<email>" in the "Email address" field
    And I enter the valid password in the "Password" field
    And I click the "Sign in" button
    Then I should not be authenticated
    And no session should be created
    And the login attempt should be recorded in the audit log

    Examples:
      | status        | email                          |
      | suspended     | suspended@refinext-test.com    |
      | deactivated   | deactivated@refinext-test.com  |
      | expired       | expired@refinext-test.com      |
      | not_activated | invited@refinext-test.com      |

```
