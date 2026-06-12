# PRD1042-46 — US 28.9 | USER MANAGEMENT | Account Lockout & Failed Login Handling

Generated: 2026-06-03
Story: PRD1042-46 — US 28.9 | USER MANAGEMENT | Account Lockout & Failed Login Handling
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (13 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 4 of 13 | Blocked: 0 | Excluded: 9 (edge-case or separate-feature — scope filter table only)
Figma design: None — Stage 2 PARTIAL (backend security story; no dedicated design frames provided or linked in story; lockout message text sourced from story AC-05; manual unlock UI not designed)

---

## AC Scope Filter

| AC    | Description                                                                               | Classification     | Rationale                                                                                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System increments failed login attempt counter on each failed authentication              | `separate-feature` | Server-side counter state — no E2E UI assertion possible; observable only as outcome of AC-03 lockout trigger                                                                                           |
| AC-02 | Failed attempt counter resets to zero on successful login                                 | `main-error`       | Failure to reset causes illegitimate lockout of valid users after prior failures — directly testable: fail threshold−1 times, succeed, fail again without triggering lockout                            |
| AC-03 | Account locks after the configured failed attempt threshold is reached                    | `happy-path`       | Core security behavior of this story — N consecutive failed attempts trigger account lockout; AC-04 enforcement and AC-05 message are verified as assertions within this scenario                       |
| AC-04 | Locked account blocks all login attempts during lockout period                            | `edge-case`        | Lockout enforcement detail — verified as nested assertion within the AC-03 happy-path scenario                                                                                                          |
| AC-05 | Locked account displays a generic lockout message                                         | `edge-case`        | Message text explicitly specified in story: "Your account is temporarily locked. Please try again later or contact support." — verified as assertion within AC-03 scenario; no separate scenario needed |
| AC-06 | Lockout expires automatically after the configured duration                               | `separate-feature` | Timing-based auto-expiry — clock/time-manipulation dependency; belongs in an isolated time-control test suite per timing classification rule                                                            |
| AC-07 | Failed login response must not reveal whether email or password was incorrect             | `main-error`       | Core anti-enumeration security property — generic error message must not expose credential or account existence details; directly testable on the login page                                            |
| AC-08 | API login attempts enforce identical lockout behavior as UI                               | `separate-feature` | API-level consistency — API integration tests, not E2E UI scope                                                                                                                                         |
| AC-09 | Locking one account must not affect other user accounts                                   | `edge-case`        | Multi-user isolation — side-effect verification, not the primary user's authentication flow                                                                                                             |
| AC-10 | Repeated failed attempts from the same IP trigger IP-level throttling                     | `separate-feature` | Network/infrastructure layer concern — not observable via application UI                                                                                                                                |
| AC-11 | Repeated lockouts trigger a security event escalation flag visible to Power Users         | `separate-feature` | Backend alerting — no confirmed admin UI surface in this story; escalation flag visibility belongs in a Security Events spec                                                                            |
| AC-12 | All failed attempts, lockouts, and unlock events must be audit logged                     | `separate-feature` | Backend audit log — no UI representation; verified by log/API inspection tests, not E2E UI                                                                                                              |
| AC-13 | Admin can manually unlock a locked account; only authorized roles may perform this action | `happy-path`       | Clear E2E admin UI action with observable outcome; RefiNext RBAC rule auto-generates 1 negative scenario (non-admin cannot unlock) — DESIGN GAP: manual unlock UI not yet designed                      |

**Gherkin generated for:** AC-02, AC-03, AC-07, AC-13
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-01, AC-04, AC-05, AC-06, AC-08, AC-09, AC-10, AC-11, AC-12

---

## Scenarios summary

| Tag           | Scenario                                                                    | AC    | Priority | E2E              |
| ------------- | --------------------------------------------------------------------------- | ----- | -------- | ---------------- |
| `@happy-path` | Account locked after reaching the configured failed login attempt threshold | AC-03 | P0       | ⚙️ needs D18     |
| `@happy-path` | Admin manually unlocks a locked account — user can log in immediately       | AC-13 | P1       | ⚙️ needs D18/D19 |
| `@main-error` | Failed login attempt counter resets on successful authentication            | AC-02 | P0       | ⚙️ needs D18     |
| `@main-error` | Failed login response is generic and does not reveal credential details     | AC-07 | P0       | ✅               |
| `@main-error` | Non-admin role cannot perform manual account unlock                         | AC-13 | P0       | ⚙️ needs D18/D19 |

Active scenario blocks: 5 (0 Outlines + 5 Scenarios)
E2E automation candidates: 1 of 5 scenarios ✅

---

## Feature file

```gherkin
@security @us-28.9 @p0
Feature: Account Lockout and Failed Login Handling (US 28.9 — PRD1042-46)
  As the system
  I want to track failed login attempts and lock accounts at the configured threshold
  So that unauthorized access and brute-force attacks are prevented

  Background:
    Given the login page is accessible at "/login"
    And the system lockout threshold is configured to 5 consecutive failed attempts
    And a user "John Smith" with email "john.smith@bank.com" exists with account status "Active"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # Core lockout behavior: N consecutive failed login attempts must lock the
  # account. Also asserts enforcement (AC-04): correct password is still blocked
  # during lockout. Message text (AC-05) sourced verbatim from story:
  # "Your account is temporarily locked. Please try again later or contact support."
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario: Account locked after reaching the configured failed login attempt threshold (AC-03)
    Given "john.smith@bank.com" has an active account with no prior failed login attempts
    When I submit 5 consecutive failed login attempts for "john.smith@bank.com"
    Then the account must be locked
    And the system must display "Your account is temporarily locked. Please try again later or contact support."
    And a subsequent login attempt using the correct password must also be blocked

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Counter reset protects legitimate users from accumulated lockout. After a
  # successful login, all prior failed attempts must be cleared. If the counter
  # is not reset, a valid user who previously made mistakes would hit lockout
  # despite authenticating successfully in between.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario: Failed login attempt counter resets on successful authentication (AC-02)
    Given "john.smith@bank.com" has made 4 consecutive failed login attempts
    When the user successfully logs in with correct credentials
    Then the user must be authenticated and redirected to their dashboard
    When the user makes 4 more consecutive failed login attempts after logging out
    Then the account must NOT be locked
    And the user must see a generic failed login error, not the lockout message

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Pre-lockout failed login errors must not expose whether the email address
  # exists or whether the password was wrong. Both cases must return an
  # identical generic message to prevent account enumeration attacks.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready
  Scenario: Failed login response is generic and does not reveal credential details (AC-07)
    Given "john.smith@bank.com" exists as an active user
    When I submit a login attempt with the correct email and an incorrect password
    Then I must see a generic authentication error message
    And the message must NOT contain the words "password" or "incorrect" in reference to the password field
    And the message must NOT confirm or deny that the email address exists in the system
    When I submit a login attempt with a non-existent email address
    Then I must see the same generic authentication error message as for the wrong password case

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-13
  # Admin manual unlock restores an active account immediately. Only Power User
  # roles are authorized to perform this action. DESIGN GAP (MAJOR): manual
  # unlock UI not designed — test derives from story AC requirements. Expected
  # location: User Detail View (PRD1042-73).
  # ---------------------------------------------------------------------------

  @happy-path @ac-13 @p1
  Scenario: Admin manually unlocks a locked account and user can log in immediately (AC-13)
    Given "john.smith@bank.com" has a locked account
    And I am logged in as a "Power User" administrator
    When I navigate to the User Detail View for "john.smith@bank.com"
    And I perform the manual unlock action on the account
    Then the account status must change to "Active"
    And "john.smith@bank.com" must be able to log in successfully with correct credentials immediately

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13 (RBAC auto-negative)
  # Only Power User / System Admin roles may manually unlock accounts. Support
  # User, Auditor, Front Office, and Back Office roles must not be able to
  # access or invoke the unlock action. Auto-generated per RefiNext role-access
  # domain rule.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario: Non-admin role cannot perform manual account unlock (AC-13)
    Given "john.smith@bank.com" has a locked account
    And I am logged in as a "Support User"
    When I navigate to the User Detail View for "john.smith@bank.com"
    Then the manual unlock action must not be visible or accessible in the UI
    And a direct API request to unlock the account must be rejected with an unauthorized response
```
