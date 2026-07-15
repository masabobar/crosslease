# PRD1042-61 — US 28.17 | USER MANAGEMENT | User Suspension

Generated: 2026-06-05
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Story description confirms (correction dated 6 July 2026): System Admin suspends platform-level users; Power User (Bank Admin) suspends users within its own bank tenant only. Wire value `power_user` replaced with `bank_admin` across Outlines. AC-15 last-admin guard now explicitly covers both platform (System Admin) and tenant-level (Bank Admin) exhaustion.

Story: PRD1042-61 — US 28.17 | USER MANAGEMENT | User Suspension
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (15 ACs, description present, stakeholder-reviewed by Philipp Maute 2026-05-13, UAT ready)
ACs with Gherkin scenarios: 5 of 15 | Blocked: 0 | Excluded: 10 (edge-case or separate-feature — scope filter table only)
Figma design: None — no Figma URL found in story or child tickets (Stage 2 SKIPPED — backend security story, consistent with PRD1042-46/47/69)

---

## AC Scope Filter

| AC    | Description                                                                                                                                                       | Classification     | Rationale                                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Suspension form accessible only to authorized admins; server-side auth; scope-limited                                                                             | `happy-path`       | Core entry point for the suspension flow; role access negative is auto-applied as RefiNext domain rule                                                            |
| AC-02 | Reason field mandatory; Comment mandatory when Reason = Other; failed attempts traceable                                                                          | `main-error`       | Directly blocks form submission; the "Other + mandatory comment" branch is a key validation gate                                                                  |
| AC-03 | Status changes to Suspended; sessions revoked; audit logged; immediate or per Effective From                                                                      | `happy-path`       | Primary success outcome — collapses with AC-01 into the happy-path Outline                                                                                        |
| AC-04 | Four-Eyes required for Highly Privileged & Privileged users; Workflow Engine banner; status unchanged until approval                                              | `main-error`       | Blocks suspension from taking effect for most admin roles; RefiNext Four-Eyes domain rule; directly observable in UI                                              |
| AC-05 | Suspended user blocked from login; no session tokens; API auth blocked; audit logged                                                                              | `separate-feature` | Covered by US 28.1 (User Login) AC-09; login layer, not suspension form                                                                                           |
| AC-06 | Active sessions revoked on suspension; UI + API; audit traceable                                                                                                  | `separate-feature` | Covered by US 28.10 (Session Management); session layer, not suspension form                                                                                      |
| AC-07 | Historical audit records, workflow history, role-at-time preserved                                                                                                | `edge-case`        | Backend invariant; no UI gesture to assert against; covered by backend integration tests                                                                          |
| AC-08 | Future-dated Effective From schedules suspension; user stays active until then; server-side                                                                       | `edge-case`        | Timing/scheduling behaviour; requires time-travel seam (D21-equivalent) not confirmed available; boundary condition                                               |
| AC-09 | Full audit record fields; immutable; failed attempts traceable                                                                                                    | `edge-case`        | Audit system implementation detail; not assertable through suspension form UI                                                                                     |
| AC-10 | All validation server-authoritative; frontend alone insufficient; partial suspension blocked                                                                      | `edge-case`        | Architecture invariant; not a discrete UI-testable action; covered by backend API tests                                                                           |
| AC-11 | UI, API, direct URL, export, document, workflow all blocked for suspended users                                                                                   | `separate-feature` | Cross-cutting enforcement; partly in US 28.10/28.16/28.25 specs; full API-layer blocking is a security spec concern                                               |
| AC-12 | Auto-restore when Effective Until reached; system-triggered; no additional Four-Eyes; audit logged                                                                | `separate-feature` | Background-job/scheduling behaviour; belongs to a Restore Access or time-boxed suspension expiry spec; requires clock override                                    |
| AC-13 | Authorized admin can restore; checks current role/scope/validity; backend-enforced; audit logged                                                                  | `separate-feature` | Restore Access is a distinct admin action — belongs in a Restore Access user story                                                                                |
| AC-14 | In-flight workflow items flagged for reassignment; progression blocked until reassignment; audit logged                                                           | `edge-case`        | Requires seeded in-flight workflow items; heavily dependent on Workflow Engine state (D-series); not a suspension-form E2E concern                                |
| AC-15 | Self-suspension blocked if would leave platform without active System Admin OR tenant with no active Bank Admin; generic error; backend-enforced; audit traceable | `main-error`       | Hard guard returning a distinct validation error; directly observable in the UI response; dual-tier — platform-level (System Admin) and tenant-level (Bank Admin) |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-15
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14

---

## Scenarios summary

| Tag           | Scenario                                                                                                                                   | AC           | Priority | E2E                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------- | -------------------------------------- |
| `@happy-path` | Authorized admin opens suspension form for a user within scope (Scenario Outline — 2 roles: System Admin, Bank Admin)                      | AC-01, AC-03 | P0       | ⚙️ needs D19                           |
| `@happy-path` | Valid suspension form submission changes status and audit-logs the event                                                                   | AC-01, AC-03 | P0       | ⚙️ needs D19                           |
| `@main-error` | Missing suspension reason blocks form submission (UI + backend)                                                                            | AC-02        | P0       | ✅                                     |
| `@main-error` | Suspension reason "Other" without comment blocks form submission                                                                           | AC-02        | P0       | ✅                                     |
| `@main-error` | Four-Eyes gate — suspension of Highly Privileged user remains pending until approval (Scenario Outline — 2 tiers: Bank Admin, Back Office) | AC-04        | P0       | ✅                                     |
| `@main-error` | Unauthorized role cannot access the Suspend User action                                                                                    | AC-01        | P0       | ✅                                     |
| `@main-error` | Last active System Admin self-suspension is rejected with validation error (platform-level guard)                                          | AC-15        | P0       | ⚙️ needs controlled single-admin state |
| `@main-error` | Last active Bank Admin self-suspension in a tenant is rejected with validation error (tenant-level guard)                                  | AC-15        | P0       | ⚙️ needs controlled single-admin state |

Active scenario blocks: 8 (2 Outlines + 6 Scenarios)
E2E automation candidates: 4 of 8 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.17 @p0
Feature: User Suspension (US 28.17 — PRD1042-61)
  As a System Admin (platform-level users) or Bank Admin (users within its own bank tenant)
  I want to suspend a user account
  So that temporary access restrictions can be enforced without deleting the user or losing historical audit data

  Background:
    Given the RefiNext application is accessible
    And I am authenticated as a "system_admin" user with email "admin@refinext-test.com"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03
  # Authorized admins can open the suspension form for users within their scope
  # and submit a valid suspension. Tests both the form entry point (AC-01) and
  # the successful status transition (AC-03) in a single Outline covering the
  # two admin roles with suspension authority per corrected story (6 July 2026):
  #   - system_admin: platform-level (platform_admin, support_user, auditor) users
  #   - bank_admin:   users within its own bank tenant (front_office, back_office,
  #                   support_user with tenant scope)
  # Bank Admin authority is tenant-scoped — Bank Admin of Tenant A cannot suspend
  # users of Tenant B (covered by tenant-isolation domain rule via 404-not-403).
  # Note: no Figma design available — copy assertions use story description as
  # source of truth (field labels, dropdown values, button labels).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @p0
  Scenario Outline: Authorized admin opens and submits the suspension form for a user within scope (AC-01, AC-03)
    Given a "<target_role>" user with email "<target_email>" exists and is active
    And I am authenticated as a "<admin_role>" user with suspension authority over "<target_email>"
    When I navigate to the user profile page for "<target_email>"
    And I click the "Suspend User" action
    Then the suspension form should be displayed
    And the "User" field should show "<target_email>" and be non-editable
    And the "Current Status" field should show "Active" and be non-editable
    And the "Suspension Reason" dropdown should be present and required
    And the "Effective From" field should be present and required
    When I select "Security Concern" from the "Suspension Reason" dropdown
    And I set "Effective From" to the current date and time
    And I submit the suspension form
    Then the user status for "<target_email>" should change to "Suspended"
    And a suspension event should be recorded in the audit log for "<target_email>"
    And the suspension event should include the actor, reason, timestamp, and tenant context

    Examples:
      | admin_role   | target_email                  | target_role   |
      | system_admin | support-platform@refinext-test.com | support_user  |
      | bank_admin   | fo@refinext-test.com          | front_office  |
      | bank_admin   | bo@refinext-test.com          | back_office   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Missing reason field must block form submission in both UI and backend.
  # This covers the primary validation gate on the suspension form.
  # The story requires backend-enforced validation — scenario asserts both
  # UI-visible error and that no status change occurs.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Submitting suspension form without a reason shows validation error and does not suspend (AC-02)
    Given a "front_office" user with email "fo@refinext-test.com" exists and is active
    When I navigate to the user profile page for "fo@refinext-test.com"
    And I click the "Suspend User" action
    And the suspension form is displayed
    And I set "Effective From" to the current date and time
    And I submit the suspension form without selecting a "Suspension Reason"
    Then a validation error should be visible on the "Suspension Reason" field
    And the form should not be submitted
    And the user status for "fo@refinext-test.com" should remain "Active"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02 (branch: Reason = Other)
  # When Reason = Other is selected, Suspension Comment becomes mandatory.
  # This is a distinct conditional validation rule specified in the story.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Selecting "Other" as suspension reason without a comment blocks submission (AC-02)
    Given a "front_office" user with email "fo@refinext-test.com" exists and is active
    When I navigate to the user profile page for "fo@refinext-test.com"
    And I click the "Suspend User" action
    And the suspension form is displayed
    And I select "Other" from the "Suspension Reason" dropdown
    And I set "Effective From" to the current date and time
    And I submit the suspension form without entering a "Suspension Comment"
    Then a validation error should be visible on the "Suspension Comment" field
    And the form should not be submitted
    And the user status for "fo@refinext-test.com" should remain "Active"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Four-Eyes approval gate for Highly Privileged and Privileged users.
  # The suspension request is submitted but the status must NOT change to
  # "Suspension Pending" — it stays at the current authoritative status until
  # the Workflow Engine approval completes. A workflow banner must appear.
  # This is a RefiNext domain rule (Four-Eyes enforcement at application layer).
  # Note: Non-Privileged tier (Front Office, Auditor, LC User) is tenant-config-
  # dependent — not tested here as configuration is not established in test env.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario Outline: Suspension of a Highly Privileged or Privileged user enters Four-Eyes pending state (AC-04)
    Given a "<target_role>" user with email "<target_email>" exists and is active
    And I am authenticated as a "system_admin" user with suspension authority over "<target_email>"
    When I navigate to the user profile page for "<target_email>"
    And I click the "Suspend User" action
    And I select "Organizational Change" from the "Suspension Reason" dropdown
    And I set "Effective From" to the current date and time
    And I submit the suspension form
    Then the suspension request should be submitted successfully
    And the user status for "<target_email>" should NOT change to "Suspended"
    And the user status for "<target_email>" should NOT change to "Suspension Pending"
    And a pending suspension approval banner should be visible on the user detail page
    And the banner should indicate that Four-Eyes approval is required
    And the pending suspension request should be recorded in the audit log

    Examples:
      | target_role | target_email                    |
      | bank_admin  | bank-admin-b@refinext-test.com  |
      | back_office | bo@refinext-test.com            |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01 (role-access negative — RefiNext domain rule)
  # Unauthorized roles must not see or access the Suspend User action.
  # Auto-applied RefiNext domain rule: role-based access must be enforced
  # server-side. Tests that the action is absent from the UI and that a direct
  # API call is rejected with a 403 response.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0 @e2e-ready
  Scenario: Unauthorized role cannot access the Suspend User action (AC-01)
    Given a "front_office" user with email "fo@refinext-test.com" exists and is active
    And I am authenticated as a "leasing_company_user" user with email "lc@refinext-test.com"
    When I navigate to the user profile page for "fo@refinext-test.com"
    Then the "Suspend User" action should not be visible on the page
    When I POST to "/api/users/fo@refinext-test.com/suspend" with valid suspension payload
    Then the response status should be 403

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15 (platform-level guard: System Admin)
  # Self-suspension must be blocked when it would leave the platform without any
  # active System Admin. Story wording: "platform must always retain at least one
  # active System Admin". Hard guard returning a generic validation error.
  # Backend-enforced — frontend restriction alone is not sufficient per story spec.
  # Requires test environment staged with exactly one active System Admin
  # (D19-adjacent: throwaway user API needed to ensure single-admin state).
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @p0
  Scenario: Last active System Admin self-suspension is rejected — platform-level guard (AC-15)
    Given the platform has exactly one active "system_admin" user with email "admin@refinext-test.com"
    And I am authenticated as "admin@refinext-test.com"
    When I navigate to my own user profile page
    And I click the "Suspend User" action
    And I select "Administrative Decision" from the "Suspension Reason" dropdown
    And I set "Effective From" to the current date and time
    And I submit the suspension form
    Then the suspension request should be rejected with a validation error
    And the error message should be a generic validation message and should not reveal the last-admin guard logic
    And my user status should remain "Active"
    And the failed self-suspension attempt should be recorded in the audit log

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15 (tenant-level guard: Bank Admin)
  # Symmetric guard at bank-tenant level. Story wording: "each bank tenant at
  # least one active Power User (Bank Admin)". A Bank Admin who is the last
  # active Bank Admin in their own tenant must not be able to self-suspend.
  # Guard is tenant-scoped: other tenants' Bank Admins are irrelevant to this
  # tenant's minimum. Backend-enforced with generic error message. Requires
  # controlled single-Bank-Admin state in the target tenant (D19-adjacent).
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @p0
  Scenario: Last active Bank Admin in tenant self-suspension is rejected — tenant-level guard (AC-15)
    Given tenant "bank-a" has exactly one active "bank_admin" user with email "bank-admin-a@refinext-test.com"
    And I am authenticated as "bank-admin-a@refinext-test.com" scoped to tenant "bank-a"
    When I navigate to my own user profile page
    And I click the "Suspend User" action
    And I select "Administrative Decision" from the "Suspension Reason" dropdown
    And I set "Effective From" to the current date and time
    And I submit the suspension form
    Then the suspension request should be rejected with a validation error
    And the error message should be a generic validation message and should not reveal the last-admin guard logic
    And my user status should remain "Active"
    And the failed self-suspension attempt should be recorded in the audit log
```
