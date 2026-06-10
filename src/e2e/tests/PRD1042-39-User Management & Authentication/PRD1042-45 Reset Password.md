# PRD1042-45 — US 28.3 | USER MANAGEMENT | Password Reset

Generated: 2026-05-25
Story: PRD1042-45 — US 28.3 | USER MANAGEMENT | Password Reset
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (15 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 7 of 15 | Blocked: 2 (D17) | Excluded: 6 (edge-case or separate-feature — scope filter table only)
Figma design: Node 167:18629, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "Set a new password" (Stage 2 PARTIAL — step 3 of 5 only)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                     | Blocking dependency                          |
| ----- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| AC-02 | Token-in-body assertion requires ability to inspect server response body and verify token is never exposed | D17 — TEST_JWT_SECRET or test-forge endpoint |
| AC-06 | Token expiry enforcement requires configurable TTL override to avoid real-time wait for expiry             | D17 — TEST_JWT_SECRET or test-forge endpoint |

---

## AC Scope Filter

| AC    | Description                                                         | Classification     | Rationale                                                                                           |
| ----- | ------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| AC-01 | Reset request returns generic success regardless of email existence | `main-error`       | Account enumeration prevention — primary security behavior at the Forgot Password step              |
| AC-02 | HTTP response + body identical; token never in response body        | `Blocked`          | Server-side assertion; requires D17 (test-forge endpoint); token-in-body is API integration concern |
| AC-03 | Rate limiting — 3/email/hour, IP-based throttle                     | `separate-feature` | Requires dedicated rate-limiting spec and controlled request injection infrastructure               |
| AC-04 | Cryptographically secure token; hashed storage; never in response   | `edge-case`        | Backend implementation detail; API integration test layer                                           |
| AC-05 | Reset link delivered via email only; configurable expiry            | `happy-path`       | Core happy-path step — user receives email with reset link                                          |
| AC-06 | Token expiry enforced server-side                                   | `Blocked`          | Token lifecycle; requires time-manipulation override (D17); separate spec                           |
| AC-07 | Valid token grants access to password reset page                    | `happy-path`       | Core happy-path step — valid token renders "Set a new password" screen                              |
| AC-08 | Invalid/expired/used token blocked; generic error message           | `main-error`       | Primary error branch — directly blocks the flow                                                     |
| AC-09 | Password validation server-side; confirm mismatch blocks submission | `main-error`       | Core UI validation visible in design                                                                |
| AC-10 | Password updated; MFA gate for security-sensitive roles             | `happy-path`       | Core submission step; MFA path bifurcation scoped to one additional scenario                        |
| AC-11 | Old password invalidated post-reset                                 | `edge-case`        | Post-reset consequence; API integration or login-feature test                                       |
| AC-12 | All active sessions terminated                                      | `separate-feature` | Cross-device session invalidation; separate session management spec                                 |
| AC-13 | Single-use token; replay prevented                                  | `edge-case`        | Token lifecycle; backend integration test                                                           |
| AC-14 | Post-reset login with new password only                             | `main-error`       | Core post-reset verification — must be able to log in with new password and be denied with old      |
| AC-15 | Audit logging without sensitive data exposure                       | `edge-case`        | Backend/BAIT compliance; not an E2E UI flow                                                         |

**Gherkin generated for:** AC-01, AC-05, AC-07, AC-08, AC-09, AC-10, AC-14
**Blocked (no Gherkin):** AC-02, AC-06
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04, AC-11, AC-12, AC-13, AC-15

---

## Scenarios summary

| Tag           | Scenario                                                                                        | AC    | Priority | E2E                   |
| ------------- | ----------------------------------------------------------------------------------------------- | ----- | -------- | --------------------- |
| `@main-error` | Forgot Password request returns generic success for any email (Scenario Outline — 3 emails)     | AC-01 | P0       | ✅                    |
| `@happy-path` | Valid reset request triggers email delivery with reset link                                     | AC-05 | P0       | ⚙️ needs email access |
| `@happy-path` | Opening a valid reset link shows the Set a new password screen                                  | AC-07 | P0       | ⚙️ needs D17/D19      |
| `@main-error` | Accessing reset link with a bad token shows a generic error (Scenario Outline — 3 token states) | AC-08 | P0       | ⚙️ needs D17          |
| `@main-error` | Weak password that does not meet policy is rejected                                             | AC-09 | P0       | ⚙️ needs D17/D19      |
| `@main-error` | Mismatched password confirmation blocks submission                                              | AC-09 | P0       | ⚙️ needs D17/D19      |
| `@happy-path` | Standard-role user completes password reset successfully (Scenario Outline — 2 roles)           | AC-10 | P0       | ⚙️ needs D17/D19      |
| `@happy-path` | Security-sensitive role requires MFA verification before password is committed                  | AC-10 | P1       | ⚙️ needs D17/D19/R1   |
| `@main-error` | User can log in with new password after successful reset                                        | AC-14 | P0       | ⚙️ needs D17/D19      |
| `@main-error` | Old password is rejected after successful reset                                                 | AC-14 | P0       | ⚙️ needs D17/D19      |

Active scenario blocks: 10 (3 Outlines + 7 Scenarios)
E2E automation candidates: 1 of 10 scenarios ✅

---

## Feature file

```gherkin
@auth @us-28.3 @p0
Feature: Password Reset (US 28.3 — PRD1042-45)
  As a user of the RefiNext platform
  I want to reset my password via an emailed reset link
  So that I can regain access to my account when I have forgotten my password

  Background:
    Given the application is accessible
    And the Forgot Password page is available at "/forgot-password"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01
  # The Forgot Password form must return the same generic success message for
  # any email — registered, unregistered, or deactivated — to prevent account
  # enumeration. The HTTP 200 response must be indistinguishable across cases.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0 @e2e-ready
  Scenario Outline: Forgot Password request returns generic success for any email (AC-01)
    Given I am on the Forgot Password page
    When I submit a password reset request with email "<email>"
    Then I should see a generic success message
    And the message should NOT reveal whether the email exists in the platform
    And the HTTP response status should be 200

    Examples:
      | email                     |
      | registered@bank.com       |
      | notregistered@nowhere.com |
      | deactivated@bank.com      |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Verifies the end-to-end email delivery for a known registered user.
  # Does not assert the raw token value — only that the link exists and does
  # not expose the token as a plain readable URL parameter (AC-02 scope).
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0
  Scenario: Valid reset request triggers email delivery with reset link (AC-05)
    Given a user with email "testuser@bank.com" exists
    When I submit a password reset request with email "testuser@bank.com"
    Then a password reset email should be sent to "testuser@bank.com"
    And the email should contain a reset link
    And the reset link should not contain the raw reset token in the URL as a human-readable parameter

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07
  # A valid, unexpired reset token must render the "Set a new password" screen.
  # Asserts heading, field label, and CTA button copy per the Figma design.
  # Also confirms the user cannot access platform business features via the
  # token URL — the reset page is an unauthenticated surface.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @p0
  Scenario: Opening a valid reset link shows the Set a new password screen (AC-07)
    Given a valid unexpired reset token exists for "testuser@bank.com"
    When I navigate to the reset link containing the valid token
    Then I should see the heading "Set a new password"
    And I should see the label "Create new password"
    And I should see the "Update password" button
    And I should NOT have access to any platform business features

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Any invalid token state must return the same generic error message.
  # The message must NOT reveal whether the token is expired, already used,
  # or simply invalid — this prevents token enumeration attacks.
  # Uses Scenario Outline to cover all three invalid token states efficiently.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario Outline: Accessing reset link with a bad token shows a generic error (AC-08)
    Given a "<token_state>" reset token
    When I navigate to the reset link containing that token
    Then I should see a generic token validation error message
    And the message should NOT reveal the specific token state (expired / used / invalid)
    And I should NOT be able to access the password reset form

    Examples:
      | token_state  |
      | expired      |
      | already_used |
      | invalid      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Two distinct validation failures: policy non-compliance and confirm mismatch.
  # Both must block form submission without committing the new password.
  # Note: design shows a hardcoded 5-item checklist — see ARCH-01 in Blockers.
  # Exact error message wording is not specified; assert on presence only.
  # Confirm Password field is absent from the provided Figma frame (DG-02).
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario: Weak password that does not meet policy is rejected (AC-09)
    Given I am on the Set a new password screen with a valid token
    When I enter a password that does not meet the password policy
    And I click the "Update password" button
    Then the system should show a validation error
    And the password should NOT be updated
    And the form should remain on the Set a new password screen

  @main-error @ac-09 @p0
  Scenario: Mismatched password confirmation blocks submission (AC-09)
    Given I am on the Set a new password screen with a valid token
    When I enter a policy-compliant password in the "Create new password" field
    And I enter a different value in the "Confirm password" field
    And I click the "Update password" button
    Then I should see a validation error indicating the passwords do not match
    And the password should NOT be updated

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-10
  # Standard-role users complete the reset without an MFA step.
  # Security-sensitive roles (Auditor, Back Office Risk) require MFA
  # verification before the new password is committed to the database.
  # MFA scenario is P1 because it is blocked on auth provider confirmation (R1).
  # Old password invalidation is deferred to AC-11 (edge-case scope).
  # ---------------------------------------------------------------------------

  @happy-path @ac-10 @p0
  Scenario Outline: Standard-role user completes password reset successfully (AC-10)
    Given a <role> user with email <email> has a valid reset token
    When I navigate to the reset link
    And I enter a policy-compliant new password in the "Create new password" field
    And I enter the same password in the "Confirm password" field
    And I click the "Update password" button
    Then the password should be updated successfully
    And the reset token should be permanently invalidated
    And the old password should no longer be valid

    Examples:
      | role            | email            |
      | Front Office    | fo@bank.com      |
      | Leasing Company | lc@leasingco.com |

  @happy-path @ac-10 @p1
  Scenario: Security-sensitive role requires MFA verification before password is committed (AC-10)
    Given an Auditor user with email "auditor@bank.com" has a valid reset token
    When I navigate to the reset link
    And I enter a policy-compliant new password and confirm it
    And I click the "Update password" button
    Then I should be presented with an MFA verification step
    And the password should NOT be committed until MFA verification succeeds
    When I complete MFA verification with a valid code
    Then the password should be updated successfully
    And I should be initialized into an authenticated session within the 5-minute MFA freshness window

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Two complementary assertions after a completed reset:
  # 1. The new password grants access (positive assertion).
  # 2. The old password is rejected — verifies the backend invalidated it.
  # Both scenarios depend on a pre-existing successful reset as precondition.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: User can log in with new password after successful reset (AC-14)
    Given a user "testuser@bank.com" has successfully completed a password reset with new password "NewValidPass#1"
    When I attempt to log in with email "testuser@bank.com" and password "NewValidPass#1"
    Then I should be authenticated successfully

  @main-error @ac-14 @p0
  Scenario: Old password is rejected after successful reset (AC-14)
    Given a user "testuser@bank.com" has successfully completed a password reset
    When I attempt to log in with email "testuser@bank.com" and the old password
    Then I should NOT be authenticated
    And I should see a generic invalid credentials error

```
