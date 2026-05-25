# PRD1042-43 — US 28.1 | USER MANAGEMENT | User Login

Generated: 2026-05-25
Story: PRD1042-43 — US 28.1 | USER MANAGEMENT | User Login
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (17 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 6 of 17 | Blocked: 4 (D16/D17/D18) | Excluded: 7 (edge-case or separate-feature — scope filter table only)
Figma design: Node 319:163, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "Sign in" (Stage 2 COMPLETE)

---

## Blocked ACs (no scenarios generated)

| AC | Reason | Blocking dependency |
|----|--------|---------------------|
| AC-10 | Account lockout requires admin API to reset lockout counter per email between test runs | D18 — Admin API reset lockout endpoint |
| AC-15 | JWT validation enforcement requires ability to forge expired/tampered/wrong-issuer tokens | D17 — TEST_JWT_SECRET or test-forge endpoint |
| AC-16 | Token tampering protection requires same token-forge capability as AC-15 | D17 — TEST_JWT_SECRET or test-forge endpoint |
| AC-17 | Session timeout requires configurable TTL override to avoid 30-min real-time wait | D16 — TEST_TOKEN_TTL_SECONDS env override |

---

## AC Scope Filter

| AC | Description | Classification | Rationale |
|----|-------------|----------------|-----------|
| AC-01 | Login form validation (required fields) | `main-error` | Directly blocks submission — core error path |
| AC-02 | Email format validation | `edge-case` | Input format rule — covered implicitly by AC-08 path; separate validation unit test |
| AC-03 | Successful login + session creation | `happy-path` | Core success flow |
| AC-04 | MFA-governed session creation | `edge-case` | Conditional on auth provider (R1); no design frame; not testable E2E until resolved |
| AC-05 | Restricted access before auth completion | `edge-case` | Backend enforcement; testable via redirect behavior; rolled into happy-path post-auth assertion |
| AC-06 | Session initialization (role/scope/permissions load) | `happy-path` | Verified via role-based redirect behavior — same scenario as AC-07 |
| AC-07 | Role-based redirect | `happy-path` | Core success variant — 1 Scenario Outline covering all 6 roles |
| AC-08 | Invalid credentials — generic error | `main-error` | Directly blocks the user; primary security error state |
| AC-09 | Account status validation (blocked accounts) | `main-error` | Directly blocks legitimate-credential users; key lifecycle gate |
| AC-10 | Failed login attempts / lockout | `Blocked` | D18 — lockout counter reset API required |
| AC-11 | Role validation (no valid role) | `edge-case` | Needs seeded user with no role (D19 dependency); auto-applied domain negative |
| AC-12 | Scope validation (invalid tenant/LC scope) | `edge-case` | Needs seeded user with invalid scope (D19 dependency); auto-applied domain negative |
| AC-13 | Permission enforcement | `separate-feature` | Covered by auth-guard specs across all feature stories; not login-specific |
| AC-14 | Audit logging | `separate-feature` | Backend-only assertion; no E2E-assertable audit API; covered by backend integration tests |
| AC-15 | JWT validation enforcement | `Blocked` | D17 — TEST_JWT_SECRET or test-forge endpoint required |
| AC-16 | Token tampering protection | `Blocked` | D17 — TEST_JWT_SECRET or test-forge endpoint required |
| AC-17 | Session timeout enforcement | `Blocked` | D16 — TEST_TOKEN_TTL_SECONDS env override required |

**Gherkin generated for:** AC-01, AC-03, AC-06, AC-07, AC-08, AC-09
**Blocked (pending stubs only):** AC-10, AC-15, AC-16, AC-17
**No Gherkin (edge-case or separate-feature):** AC-02, AC-04, AC-05, AC-11, AC-12, AC-13, AC-14

---

## Scenarios summary

| Tag | Scenario | AC | Priority |
|-----|----------|----|----------|
| `@happy-path` | Valid login redirects to role-specific dashboard (Scenario Outline — 6 roles) | AC-03, AC-06, AC-07 | P0 |
| `@main-error` | Missing required field prevents form submission | AC-01 | P0 |
| `@main-error` | Invalid credentials show generic error message | AC-08 | P0 |
| `@main-error` | Blocked account status prevents login (Scenario Outline — 4 statuses) | AC-09 | P0 |

Active scenario blocks: 4 (2 Outlines + 2 Scenarios)

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

  @happy-path @ac-03 @ac-06 @ac-07 @p0
  Scenario Outline: Valid credentials redirect to role-specific landing page (AC-03, AC-06, AC-07)
    Given a "<role>" user with email "<email>" and a valid password exists and is active
    When I enter "<email>" in the "Email address" field
    And I enter the valid password in the "Password" field
    And I click the "Sign in" button
    Then I should be redirected to "<landing_page>"
    And a session should be active with role "<role>"
    And the user's role context should be loaded from the server

    Examples:
      | role                  | email                      | landing_page |
      | system_admin          | admin@refinext-test.com    | /dashboard   |
      | front_office          | fo@refinext-test.com       | /dashboard   |
      | back_office_risk      | bo@refinext-test.com       | /dashboard   |
      | support_user          | support@refinext-test.com  | /dashboard   |
      | auditor               | auditor@refinext-test.com  | /dashboard   |
      | leasing_company_user  | lc@refinext-test.com       | /workspace   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01
  # Empty-field submission must show validation errors and prevent form submit.
  # Verifies the Sign in button is disabled / shows errors when fields are empty.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0
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

  @main-error @ac-08 @p0
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

---

## Blockers and Gaps Summary

| Severity | Item | AC | Resolution required from |
|----------|------|----|--------------------------|
| MAJOR | Email-only field vs Email/Username dual-mode — confirm scope | Story description | PO / BA — confirm Sprint 1 login identifier |
| MAJOR | Error state for invalid credentials not shown in Figma design | AC-08 | Designer — add error state frame to Sign in screen |
| MAJOR | MFA challenge screen absent from Figma design | AC-04 | Designer + Auth provider decision (R1) |
| MAJOR | Blocked account screen absent from Figma design | AC-09 | Designer — add blocked-account state frame |
| MINOR | "Sign in" button label vs story's "Login button" wording | AC-01, AC-03 | No action — use "Sign in" per design; POM locator confirmed |
| MINOR | "Email address" label exact text not in story spec | AC-01, AC-02 | No action — use design label; record for POM |
| BLOCKER (D17) | TEST_JWT_SECRET / test-forge endpoint | AC-15, AC-16 | Dev team — provide test token forge mechanism |
| BLOCKER (D16) | TEST_TOKEN_TTL_SECONDS env override | AC-17 | Dev team — provide configurable TTL override |
| BLOCKER (D18) | Admin API to reset lockout counter | AC-10 | Dev team — provide lockout reset endpoint |
| BLOCKER (D19) | Throwaway user creation/deletion API | AC-09, AC-11, AC-12 | Dev team — provide seeding API for test users |
| INFO | "Forgot password?" link present — flow is in PRD1042-45 | — | No action — scope confirmed as separate story |
| INFO | AC-09 exact blocked-account error message wording not specified | AC-09 | Designer / BA — confirm per-status message text |
