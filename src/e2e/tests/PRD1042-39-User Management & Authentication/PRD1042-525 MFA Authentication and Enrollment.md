# PRD1042-525 — US 28.2 | USER MANAGEMENT | MVP MFA Authentication & Enrollment (TOTP + Recovery Codes)

Generated: 2026-06-12
Story: PRD1042-525 — US 28.2 | USER MANAGEMENT | MVP MFA Authentication & Enrollment (TOTP + Recovery Codes)
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (16 ACs + AC-04b proposed addition, description present, stakeholder-reviewed by Philipp Maute and Vesna Plakalovic, Ready for Staging)
ACs with Gherkin scenarios: 9 of 17 | Blocked: 4 (AC-04b, AC-06, AC-08, AC-16) | Excluded: 4 (edge-case or separate-feature — scope filter table only)
Figma design: Not provided — Stage 2 SKIPPED (no Figma URL in PRD1042-525 description, attachments, comments, or child stories PRD1042-527/528/529)

---

## Blocked ACs (no scenarios generated)

| AC     | Reason                                                                                                                                                                                                       | Blocking dependency                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| AC-04b | Policy-triggered MFA enrollment at next login for already-active users requires flipping tenant/role policy mid-session via admin API and forcing re-evaluation on next login. No such endpoint provisioned. | D-NEW — policy override endpoint + per-user policy-revaluation hook |
| AC-06  | Tenant-level MFA policy override needs a second seeded Bank Tenant B plus a tenant-policy admin API to toggle MFA from off → on and observe enforcement.                                                     | D20 (second Bank Tenant B) + tenant policy admin API                |
| AC-08  | API/SSO consistency requires forging API requests with mid-flight MFA state and an SSO test-double. SSO integration is reserved for later phase (R1 family).                                                 | R1 (auth provider TBD) + test-forge endpoint for partial-MFA tokens |
| AC-16  | Recovery flow rate limit (3 / 24h) requires a throttle-reset endpoint mirroring D18 to repeat the test deterministically. Not currently provisioned.                                                         | D-NEW — recovery-attempt throttle reset endpoint                    |

---

## AC Scope Filter

| AC     | Description                                                                 | Classification     | Rationale                                                                                                           |
| ------ | --------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| AC-01  | MFA Enforcement after password before session                               | `happy-path`       | Core success flow — login + OTP → session created                                                                   |
| AC-02  | Session creation only after MFA verification + scope inheritance            | `happy-path`       | Verifiable by accessing role-scoped landing page after successful TOTP                                              |
| AC-03  | Failed MFA verification denies access                                       | `main-error`       | Primary error path; covers invalid OTP rejection without exposing details                                           |
| AC-04  | First-login enrollment enforcement (TOTP setup before access)               | `happy-path`       | Core onboarding flow for security-sensitive roles                                                                   |
| AC-04b | Policy-triggered enrollment at next login for already-active users          | `Blocked`          | Requires policy override admin endpoint not provisioned (D-NEW)                                                     |
| AC-05  | Mandatory MFA per role (Admin/Auditor/BO mandatory; Support recommended)    | `happy-path`       | Role-grade enforcement covered via seeded users per role; uses Philipp Maute's 2026-06-01 confirmed role list       |
| AC-06  | Tenant policy MFA enforcement                                               | `Blocked`          | Requires D20 + tenant policy admin API                                                                              |
| AC-07  | MFA reset invalidates prior config and forces re-enrollment                 | `main-error`       | Reset blocks access until re-enrollment — testable via admin reset                                                  |
| AC-08  | API / SSO enforcement parity with UI                                        | `Blocked`          | R1 (auth provider TBD) + SSO test double + forged-token endpoint                                                    |
| AC-09  | OTP expiry rejected                                                         | `edge-case`        | Timing-dependent; requires D16 (TTL override) to deterministically observe                                          |
| AC-10  | Failed OTP threshold lockout / rate limit                                   | `separate-feature` | Lockout owned by US 28.9 (PRD1042-46); D18 lockout reset blocker                                                    |
| AC-11  | No MFA secret exposure (encryption at rest, response scrubbing)             | `edge-case`        | Implementation detail — payload inspection and at-rest encryption, not E2E UI flow                                  |
| AC-12  | Session integrity — incomplete MFA cannot reach privileged ops              | `main-error`       | Direct negative — protected routes 401/redirect during pending MFA                                                  |
| AC-13  | Audit logging of all MFA events                                             | `separate-feature` | Audit log inspection owned by US 28.6 (User Detail Auth & Security) and Auditor access stories                      |
| AC-14  | TOTP primary; Email OTP recovery-only; FIDO2/SMS reserved with warning copy | `happy-path`       | Verifiable via UI: only TOTP offered at enrollment; Email OTP option visible only as recovery with explicit warning |
| AC-15  | Recovery codes — exactly 10, single-use, regenerate on use                  | `happy-path`       | Core recovery flow — UI displays 10 codes; reuse attempt fails; new set is generated after successful recovery      |
| AC-16  | Recovery flow rate limit (3 attempts / 24h)                                 | `Blocked`          | Throttle reset endpoint not provisioned                                                                             |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-07, AC-12, AC-14, AC-15
**Blocked (no Gherkin):** AC-04b, AC-06, AC-08, AC-16
**No Gherkin (edge-case or separate-feature):** AC-09, AC-10, AC-11, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                  | AC                  | Priority | E2E                                  |
| ------------- | ----------------------------------------------------------------------------------------- | ------------------- | -------- | ------------------------------------ |
| `@happy-path` | Mandatory-MFA role authenticates with TOTP and reaches role dashboard (Outline — 3 roles) | AC-01, AC-02, AC-05 | P0       | ⚙️ needs TOTP fixture                |
| `@happy-path` | First-login MFA enrollment completes before platform access (Scenario Outline — 3 roles)  | AC-04               | P0       | ⚙️ needs D19 + TOTP fixture          |
| `@happy-path` | Enrollment screen offers TOTP only; Email OTP appears under Recovery with warning copy    | AC-14               | P0       | ⚙️ needs D19 (fresh enrolling user)  |
| `@happy-path` | Recovery code list contains exactly 10 single-use codes; using one regenerates the set    | AC-15               | P0       | ⚙️ needs D19 + recovery-code capture |
| `@main-error` | Invalid TOTP denies access; no authenticated session created                              | AC-03               | P0       | ⚙️ needs TOTP fixture                |
| `@main-error` | Pending-MFA session cannot reach role-scoped landing page                                 | AC-12               | P0       | ⚙️ needs partial-MFA session probe   |
| `@main-error` | MFA reset by authorized admin invalidates prior TOTP and forces re-enrollment             | AC-07               | P0       | ⚙️ needs D19 + admin reset endpoint  |

Active scenario blocks: 7 (3 Outlines + 4 Scenarios)
E2E automation candidates: 0 of 7 scenarios ✅ (all require infra: live TOTP secret generation, throwaway users D19, or admin reset/test-forge endpoints)

---

## Feature file

```gherkin
@auth @mfa @us-28.2 @p0
Feature: MVP MFA Authentication & Enrollment (US 28.2 — PRD1042-525)
  As a system
  I want to enforce MFA / 2FA based on security policy and user role
  So that unauthorized access risks are reduced and sensitive banking operations are protected

  Background:
    Given the login page is accessible at "/login"
    And TOTP is the enforcing MFA method for all MVP roles
    And TOTP is provisioned per RFC 6238 (HMAC-SHA1, 30-second step, 6-digit code)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-05
  # Successful password authentication followed by valid TOTP verification must
  # be required before any authenticated session is created. Covers the three
  # roles where MFA is mandatory per Philipp Maute's 2026-06-01 confirmation:
  # Power User / System Admin, Auditor, Back Office / Risk.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-05 @p0
  Scenario Outline: Mandatory-MFA role authenticates with TOTP and reaches role dashboard (AC-01, AC-02, AC-05)
    Given a <role> user with email <email> exists with MFA enabled and a known TOTP secret
    When I submit email <email> and a valid password
    Then I should be prompted for an MFA verification code
    And no authenticated session should exist yet
    When I enter the currently valid 6-digit TOTP code
    Then an authenticated session should be created with role <role>
    And the session should inherit the user's tenant and Leasing Company ownership scope
    And I should be redirected to <landing_page>

    Examples:
      | role                       | email                | landing_page         |
      | Power User / System Admin  | admin@bank.com       | /dashboard/admin     |
      | Auditor                    | auditor@bank.com     | /audit/trail         |
      | Back Office / Risk         | bo@bank.com          | /dashboard/bo        |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # On first login for a security-sensitive role, the platform must force MFA
  # enrollment to complete (TOTP setup + verification challenge + recovery code
  # generation) before granting access. Users cannot bypass enrollment.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0
  Scenario Outline: First-login MFA enrollment completes before platform access (AC-04)
    Given a freshly activated <role> user with email <email> has never enrolled in MFA
    When I submit email <email> and the valid password
    Then I should be presented with the MFA enrollment screen
    And no authenticated session should exist yet
    When I scan the displayed QR code with a TOTP authenticator
    And I enter the first valid 6-digit TOTP code as the verification challenge
    And I confirm I have saved the displayed recovery codes
    Then MFA enrollment status should become "Active"
    And an authenticated session should be created with role <role>
    And I should be redirected to <landing_page>

    Examples:
      | role                       | email                  | landing_page         |
      | Power User / System Admin  | new-admin@bank.com     | /dashboard/admin     |
      | Auditor                    | new-auditor@bank.com   | /audit/trail         |
      | Back Office / Risk         | new-bo@bank.com        | /dashboard/bo        |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-14
  # MVP exposes only TOTP as the primary MFA method. Email OTP is offered only
  # as a recovery option and must display an explicit security warning when
  # configured. FIDO2/WebAuthn and SMS OTP must remain hidden from the UI.
  # ---------------------------------------------------------------------------

  @happy-path @ac-14 @p0
  Scenario: Enrollment screen offers TOTP only; Email OTP appears under Recovery with warning copy (AC-14)
    Given a freshly activated Back Office / Risk user reaches the MFA enrollment screen
    Then the only primary MFA method offered should be "Authenticator App (TOTP)"
    And the UI should not offer "FIDO2 / WebAuthn" as a primary method
    And the UI should not offer "SMS OTP" as a primary method
    When I open the Recovery options
    Then "Email OTP" should be visible as a recovery-only option
    And a security warning should be displayed next to "Email OTP" indicating it is recovery-only and reduces assurance

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-15
  # Recovery codes must be generated as exactly 10 single-use codes during
  # enrollment. Using one code authenticates the user once, invalidates that
  # code, and regenerates the full set — invalidating all previously generated
  # codes.
  # ---------------------------------------------------------------------------

  @happy-path @ac-15 @p0
  Scenario: Recovery code list contains exactly 10 single-use codes; using one regenerates the set (AC-15)
    Given a Back Office / Risk user completes MFA enrollment
    Then the recovery code list shown to the user should contain exactly 10 codes
    And each code should be displayed as a one-time use code
    When the user logs out
    And the user logs in again with the valid password
    And selects "Use a recovery code" instead of the TOTP prompt
    And enters the first recovery code from the captured list
    Then an authenticated session should be created
    And the same recovery code should not be reusable on a subsequent login attempt
    And the system should present a newly generated set of 10 recovery codes
    And all 9 previously generated unused codes should be invalidated

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Invalid TOTP entry must deny access. No authenticated session may be
  # created. Error messaging must not expose verification details (e.g. "code
  # was off by one digit", "secret mismatch") that would help an attacker.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Invalid TOTP denies access; no authenticated session created (AC-03)
    Given a Back Office / Risk user with email "bo@bank.com" exists with MFA enabled
    When I submit email "bo@bank.com" and a valid password
    And I am prompted for an MFA verification code
    And I enter an invalid 6-digit code "000000"
    Then I should see a generic MFA verification error
    And the message should NOT contain "expected code"
    And the message should NOT contain "secret"
    And no authenticated session should exist
    And I should remain on the MFA verification screen

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # Until MFA is successfully verified, the authentication session is incomplete
  # and must not grant access to any protected platform area. Direct navigation
  # to a role-scoped route must be blocked.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0
  Scenario: Pending-MFA session cannot reach role-scoped landing page (AC-12)
    Given a Back Office / Risk user with email "bo@bank.com" exists with MFA enabled
    When I submit email "bo@bank.com" and a valid password
    And I am prompted for an MFA verification code
    And I attempt to navigate directly to "/dashboard/bo" before entering any TOTP code
    Then I should be redirected back to the MFA verification screen
    And no authenticated session should be available
    And the role-scoped landing page should not render any protected data

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # An authorized admin-initiated MFA reset must invalidate the user's prior
  # TOTP secret and recovery codes, terminate any sessions associated with the
  # previous MFA state, and force the user to re-enroll before regaining
  # access.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: MFA reset by authorized admin invalidates prior TOTP and forces re-enrollment (AC-07)
    Given a Back Office / Risk user with email "bo@bank.com" has completed MFA enrollment and has an active session
    When an authorized Power User / System Admin triggers an MFA reset on "bo@bank.com"
    Then the user's prior TOTP secret should be invalidated
    And the user's previously generated recovery codes should be invalidated
    And any active sessions for "bo@bank.com" should be terminated
    When the user logs in again with the valid password
    Then the user should be presented with the MFA enrollment screen
    And the previously valid TOTP code should not authenticate the user
    And no authenticated session should be created until enrollment is completed
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
