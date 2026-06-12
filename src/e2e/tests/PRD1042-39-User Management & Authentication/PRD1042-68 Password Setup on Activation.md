# PRD1042-68 — US 28.24 | User Management | Password Setup on Activation

Generated: 2026-06-12
Story: PRD1042-68 — US 28.24 | User Management | Password Setup on Activation
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (14 ACs, description present, stakeholder-reviewed by Philipp Maute 2026-05-13, Ready for Staging)
ACs with Gherkin scenarios: 9 of 14 | Blocked: 1 (AC-13 — HIBP/breach-database test fixture) | Excluded: 4 (edge-case — scope filter table only)
Figma design: File 18XTZEeaxrGDhi4DzZ2QnJ — Stage 2 SKIPPED (file content-protected at organization level; Figma REST API returns 403 "File not exportable"; MCP rate-limited on Professional View seat)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                                       | Blocking dependency                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| AC-13 | Compromised-password validation requires a controlled breach-database fixture (or HIBP k-anonymity API stub) so the test can submit a password known to be in the breach corpus without leaking real compromised credentials | D19 (throwaway user) + dedicated breach-database test endpoint |

---

## AC Scope Filter

| AC    | Description                                                                                                                                  | Classification | Rationale                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Mandatory Fields — empty fields prevent submission; Set Password disabled until valid                                                        | `happy-path`   | Form gating asserted in happy path (button enabled when all fields filled and matching) and main-error empty submission |
| AC-02 | Password Policy Validation — weak password rejected, server-enforced                                                                         | `main-error`   | Blocks activation when password fails policy; covered by Scenario Outline with policy violations                        |
| AC-03 | Password Match Validation — confirm mismatch blocks setup                                                                                    | `main-error`   | Directly blocks activation completion; single targeted scenario                                                         |
| AC-04 | Successful Password Setup — hashed storage, token invalidated, audit logged, scope preserved                                                 | `happy-path`   | Primary success flow                                                                                                    |
| AC-05 | Login Eligibility — only fully activated users can authenticate                                                                              | `happy-path`   | Asserted as the closing step of happy path (login after activation succeeds)                                            |
| AC-06 | Audit Logging — actor, timestamp, outcome, tenant context recorded; passwords never in logs                                                  | `edge-case`    | Backend log inspection; not directly E2E-observable; covered at BE/integration layer                                    |
| AC-07 | Invitation Token Validation — token must be active, unused, not expired                                                                      | `main-error`   | Expired/inactive token blocks user; testable via seeded expired token                                                   |
| AC-08 | Backend/API Enforcement — server-authoritative; manipulated requests rejected                                                                | `edge-case`    | Implementation guarantee; covered indirectly by every server-validation main-error scenario                             |
| AC-09 | Password Secrecy Protection — no plain text in logs, APIs, browser state, audit                                                              | `edge-case`    | Code/log inspection concern; outside E2E UI assertion scope                                                             |
| AC-10 | Token Reuse Prevention — used or invalidated tokens rejected on retry                                                                        | `main-error`   | Single-use token replay attempt blocks user; testable                                                                   |
| AC-11 | Scope Preservation — role, tenant scope, LC scope, validity unchanged after activation                                                       | `happy-path`   | Asserted as a final attestation of the happy-path Outline                                                               |
| AC-12 | Concrete Password Policy Enforcement — min 12 chars, 3-of-4 classes (or passphrase ≥ 16), history of 5, max age 90d privileged / 365d others | `main-error`   | Specific policy rules; covered by Scenario Outline of policy violations attached to AC-02                               |
| AC-13 | Compromised Password Validation — HIBP or equivalent breach-database check for Power User / Auditor / Back Office / Risk                     | `Blocked`      | Needs breach-database test fixture; not available — listed in Blocked ACs table                                         |
| AC-14 | Password Strength Indicator — zxcvbn or equivalent, advisory feedback                                                                        | `edge-case`    | UX advisory; story says "should" / "may"; non-blocking; backend validation is the source of truth                       |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-07, AC-10, AC-11, AC-12
**Blocked (no Gherkin):** AC-13
**No Gherkin (edge-case or separate-feature):** AC-06, AC-08, AC-09, AC-14

---

## Scenarios summary

| Tag           | Scenario                                                                            | AC                         | Priority | E2E          |
| ------------- | ----------------------------------------------------------------------------------- | -------------------------- | -------- | ------------ |
| `@happy-path` | Successful password setup activates account and preserves scope (Outline — 3 roles) | AC-01, AC-04, AC-05, AC-11 | P0       | ⚙️ needs D19 |
| `@main-error` | Empty mandatory fields prevent submission                                           | AC-01                      | P0       | ⚙️ needs D19 |
| `@main-error` | Password and confirmation mismatch blocks activation                                | AC-03                      | P0       | ⚙️ needs D19 |
| `@main-error` | Password policy violations rejected (Outline — 4 violation types)                   | AC-02, AC-12               | P0       | ⚙️ needs D19 |
| `@main-error` | Expired or inactive invitation token rejected                                       | AC-07                      | P0       | ⚙️ needs D19 |
| `@main-error` | Reused activation token rejected after successful setup                             | AC-10                      | P0       | ⚙️ needs D19 |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 0 of 6 scenarios ✅ (all require D19 throwaway user/invitation API)

---

## Feature file

```gherkin
@auth @us-28.24 @p0
Feature: Password Setup on Activation (US 28.24 — PRD1042-68)
  As an invited user
  I want to set my password during account activation
  So that I can securely establish my credentials before first login

  Background:
    Given the platform password policy is configured per tenant security policy
    And the activation page is accessible at "/activate"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-04, AC-05, AC-11
  # A user with a valid, unused activation token enters a policy-compliant
  # password, submits the setup form, and the account is activated:
  # password is securely stored, token is invalidated, scope/role/validity
  # are preserved, and the user can subsequently authenticate. Asserts that
  # the Set Password button is enabled only when both inputs are filled and
  # matching. Covers the three primary activation-eligible roles.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-04 @ac-05 @ac-11 @p0
  Scenario Outline: Successful password setup activates account and preserves scope (AC-01, AC-04, AC-05, AC-11)
    Given an invited <role> user with email <email>, tenant scope <tenant>, LC scope <lc_scope>, and valid activation token <token> exists
    And the user's status is "invited"
    When I navigate to "/activate?token=<token>"
    Then the password setup form should be displayed with email <email> as non-editable
    And the "Set Password" button should be disabled
    When I enter "<password>" in the new password field
    And I enter "<password>" in the confirm password field
    Then the "Set Password" button should be enabled
    When I submit the password setup form
    Then I should see an activation success confirmation
    And the user's status should transition to "active"
    And the user's role should remain <role>
    And the user's tenant scope should remain <tenant>
    And the user's LC scope should remain <lc_scope>
    And the activation token <token> should be marked as used
    When I subsequently log in with email <email> and password "<password>"
    Then I should be successfully authenticated

    Examples:
      | role         | email                  | tenant   | lc_scope  | token           | password               |
      | front_office | fo.invite@bank.com     | Bank-A   | none      | tok-fo-valid    | SecurePass!2026A       |
      | auditor      | auditor.invite@bank.com| Bank-A   | none      | tok-au-valid    | AuditCorrect#7Phrase   |
      | lc_user      | lc.invite@lender.com   | Bank-A   | LC-Lender1| tok-lc-valid    | LeasingPass$2026X      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01 (Mandatory Fields)
  # The Set Password button must remain disabled while any mandatory field
  # is empty; submission attempts via the API with empty fields must be
  # rejected and must not activate the account.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0
  Scenario: Empty mandatory fields prevent submission (AC-01)
    Given an invited user with a valid activation token "tok-empty-test" exists
    When I navigate to "/activate?token=tok-empty-test"
    Then the password setup form should be displayed
    And the "Set Password" button should be disabled
    When I leave the new password field empty
    And I leave the confirm password field empty
    Then the "Set Password" button should remain disabled
    When I submit the password setup request via API with empty password fields
    Then the response status should be 4xx indicating validation failure
    And the user's status should remain "invited"
    And the activation token "tok-empty-test" should remain valid and unused

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (Password Match Validation)
  # When the password and confirmation values diverge, the system must
  # block activation. Validation is server-authoritative — the test exercises
  # the submission path, not just client-side checks. Error message must
  # not echo the password values.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Password and confirmation mismatch blocks activation (AC-03)
    Given an invited user with email "mismatch.invite@bank.com" and valid activation token "tok-mismatch" exists
    When I navigate to "/activate?token=tok-mismatch"
    And I enter "SecurePass!2026A" in the new password field
    And I enter "SecurePass!2026B" in the confirm password field
    And I submit the password setup form
    Then I should see a password mismatch validation error
    And the error message should NOT contain "SecurePass!2026A"
    And the error message should NOT contain "SecurePass!2026B"
    And the user's status should remain "invited"
    And the activation token "tok-mismatch" should remain valid and unused

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-12 (Password Policy Violations)
  # The system rejects passwords that fail the configured policy:
  # minimum length 12, at least 3-of-4 character classes (upper/lower/
  # digit/special) OR passphrase mode ≥ 16 characters, no reuse of the last
  # 5 passwords. Error responses must be generic and must not expose
  # which specific rule failed (AC-02 + AC-13 design pattern).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-12 @p0
  Scenario Outline: Password policy violations rejected (AC-02, AC-12)
    Given an invited user with email <email> and valid activation token <token> exists
    When I navigate to "/activate?token=<token>"
    And I enter <weak_password> in the new password field
    And I enter <weak_password> in the confirm password field
    And I submit the password setup form
    Then I should see a password policy validation error
    And the error message should NOT disclose which specific rule failed
    And the user's status should remain "invited"
    And the activation token <token> should remain valid and unused

    Examples:
      | violation_type           | email                       | token            | weak_password   |
      | below_min_length         | short.invite@bank.com       | tok-short        | Sh0rt!1         |
      | missing_character_class  | classes.invite@bank.com     | tok-classes      | alllowercase123 |
      | passphrase_too_short     | phrase.invite@bank.com      | tok-phrase       | shortphraseword |
      | common_weak_password     | common.invite@bank.com      | tok-common       | Password1234!   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (Invitation Token Validation)
  # Activation must be blocked when the invitation token is expired or
  # otherwise inactive. The user must not be able to set a password, and
  # the account must not be created or modified.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Expired or inactive invitation token rejected (AC-07)
    Given an invited user with email "expired.invite@bank.com" exists
    And the activation token "tok-expired" is expired
    When I navigate to "/activate?token=tok-expired"
    Then I should see an invalid or expired token error
    And the password setup form should NOT be submittable
    When I submit the password setup request via API with token "tok-expired" and a policy-compliant password
    Then the response status should be 4xx indicating token validation failure
    And the user's status should remain "invited"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (Token Reuse Prevention)
  # An activation token is single-use. After successful activation the token
  # is invalidated; any subsequent attempt to reuse the same token — whether
  # via UI or API — must be rejected to prevent replay attacks.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Reused activation token rejected after successful setup (AC-10)
    Given an invited user with email "reuse.invite@bank.com" and valid activation token "tok-reuse" exists
    And the user has successfully completed password setup with token "tok-reuse"
    And the activation token "tok-reuse" is now marked as used
    When I navigate to "/activate?token=tok-reuse"
    Then I should see a token already used or invalid error
    And the password setup form should NOT be submittable
    When I submit the password setup request via API with token "tok-reuse" and a policy-compliant password
    Then the response status should be 4xx indicating token reuse rejection
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
