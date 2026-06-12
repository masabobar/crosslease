# PRD1042-67 — US 28.23 | USER MANAGEMENT | Resend Invitation

Generated: 2026-06-12
Story: PRD1042-67 — US 28.23 | USER MANAGEMENT | Resend Invitation
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (15 ACs, description present, stakeholder-reviewed by Philipp Maute & Vesna Plakalovic, Ready for Staging)
ACs with Gherkin scenarios: 6 of 15 | Blocked: 4 (AC-05, AC-09, AC-10, AC-13) | Excluded: 5 (edge-case: AC-04, AC-07, AC-12, AC-15; separate-feature: AC-14)
Figma design: Node 9:113, file 18XTZEeaxrGDhi4DzZ2QnJ — Stage 2 FAILED (Figma MCP rate-limited; same tooling blocker as PRD1042-44, PRD1042-48, PRD1042-49, PRD1042-77)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                           | Blocking dependency                                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| AC-05 | Verifying that a new onboarding email is sent with the latest valid activation link requires inbox access or email delivery hook | Email inbox infra / delivery webhook (no test endpoint)    |
| AC-09 | Single-active-token enforcement requires capturing both old and new tokens to verify old immediately invalidated                 | D19 — throwaway user create/delete + token capture hook    |
| AC-10 | Token reuse prevention requires capturing the activation token and replaying it after a successful activation or resend          | D19 — throwaway user create/delete + token capture hook    |
| AC-13 | Resend throttling (3/hour, 5-min cooldown) requires resetting the throttle counter per test run                                  | D19 + admin API to reset throttle counter per invited user |

---

## AC Scope Filter

| AC    | Description                                                                                                                                | Classification     | Rationale                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Eligible user (Invited / Pending Activation) can be resent an invitation                                                                   | `happy-path`       | Core success flow — admin resends invitation to eligible user; observable via dialog flow and confirmation message        |
| AC-02 | Active / Suspended / Deactivated / Expired users cannot be resent an invitation                                                            | `main-error`       | Primary error type — blocks the resend action for ineligible lifecycle states; observable in UI and API response          |
| AC-03 | Previous invitation link is immediately invalidated after resend                                                                           | `main-error`       | Security-critical — old link must not activate; observable by attempting activation with the old link path post-resend    |
| AC-04 | New cryptographically secure, single-use invitation token + expiry generated                                                               | `edge-case`        | Token cryptographic strength, uniqueness, and expiry policy are backend implementation details — out of E2E scope         |
| AC-05 | A new onboarding email is sent with the latest valid activation link                                                                       | `Blocked`          | Verifying email delivery requires inbox access or a delivery webhook — no test infra available                            |
| AC-06 | Assigned role, tenant scope, and LC scope are preserved after resend                                                                       | `main-error`       | Critical — prevents privilege escalation through resend; observable in user record before vs after resend                 |
| AC-07 | Audit log captures actor, affected user, timestamp, and resend reason                                                                      | `edge-case`        | Audit log inspection requires backend log access — out of E2E scope                                                       |
| AC-08 | Backend/API enforcement — manipulated API requests with invalid lifecycle or scope are rejected                                            | `main-error`       | API-layer enforcement — directly testable via direct API call assertion                                                   |
| AC-09 | Single active token enforcement — only the newest token is valid; older tokens immediately expire                                          | `Blocked`          | Requires capturing both old and new tokens to verify the old is immediately invalid — needs D19 + token-capture infra     |
| AC-10 | Token reuse prevention — used or invalidated tokens are rejected on replay                                                                 | `Blocked`          | Requires capturing the activation token and replaying after use or resend — needs D19 + token-capture infra               |
| AC-11 | Scope-aware administration — cross-tenant or cross-LC resend is blocked unless authorized                                                  | `main-error`       | Tenant/LC isolation — RefiNext domain rule auto-applied; expects 404 not 403 per architecture constraint #5               |
| AC-12 | Invitation enumeration prevention — responses remain generic regardless of user/token/scope existence                                      | `edge-case`        | Response-shape genericness — implementation detail; UI shows the same generic message regardless                          |
| AC-13 | Resend throttling — max 3/hour per invited user, 5-minute cooldown, generic success above threshold                                        | `Blocked`          | Requires backend throttle counter reset between tests and rapid resend loop — no admin endpoint to reset counter          |
| AC-14 | Email delivery state handling — delivered/bounced/deferred states tracked, UI flag for bounced, blocks auto-resend until address corrected | `separate-feature` | Bounced-state handling requires email-delivery webhook integration and UI flag rendering — separate spec, separate ticket |
| AC-15 | Invitation token TTL consistency with PRD1042-44 (same configured TTL applies)                                                             | `edge-case`        | TTL value verification is timing-dependent (likely 48h) and requires D16 clock override — out of E2E scope                |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-06, AC-08, AC-11
**Blocked (no Gherkin):** AC-05, AC-09, AC-10, AC-13
**No Gherkin (edge-case or separate-feature):** AC-04, AC-07, AC-12, AC-14, AC-15

---

## Scenarios summary

| Tag           | Scenario                                                                                  | AC    | Priority | E2E                           |
| ------------- | ----------------------------------------------------------------------------------------- | ----- | -------- | ----------------------------- |
| `@happy-path` | Authorized admin resends invitation to eligible user (Scenario Outline — 2 variants)      | AC-01 | P0       | ⚙️ needs D19                  |
| `@main-error` | Resend Invitation blocked for ineligible lifecycle states (Scenario Outline — 4 variants) | AC-02 | P0       | ⚙️ needs D19                  |
| `@main-error` | Old invitation link is invalidated after resend                                           | AC-03 | P0       | ⚙️ needs D19 + token capture  |
| `@main-error` | Resend preserves role, tenant scope, and LC scope                                         | AC-06 | P0       | ⚙️ needs D19                  |
| `@main-error` | Backend rejects manipulated resend request for ineligible user                            | AC-08 | P0       | ⚙️ needs D19                  |
| `@main-error` | Cross-tenant resend returns 404 (tenant isolation)                                        | AC-11 | P0       | ⚙️ needs D19 + D20 (Tenant B) |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 0 of 6 scenarios ✅ — all require throwaway-user infra (D19) before running against the dev environment

---

## Feature file

```gherkin
@user-management @us-28.23 @p0
Feature: Resend Invitation (US 28.23 — PRD1042-67)
  As a Power User / System Admin
  I want to resend an onboarding invitation to an invited user
  So that users who did not receive or use the original invitation can still activate their account

  Background:
    Given the User Management module is accessible at "/users"
    And I am logged in as a Power User / System Admin

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # An authorized admin opens the Resend Invitation flow on a user whose
  # lifecycle state is Invited (Pending Activation), selects a Resend Reason
  # from the mandatory dropdown, and confirms. The system completes the resend
  # and the user record stays in Invited state with refreshed invitation
  # metadata. Resend Reason options are taken from spec verbatim.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario Outline: Authorized admin resends invitation to eligible user (AC-01)
    Given a user "<email>" exists in lifecycle state "Invited"
    And the user has an original invitation sent date and expiry date
    When I open the Resend Invitation action for "<email>"
    Then the User, Email Address, Current Status, Invitation Sent Date, and Invitation Expiry Date fields should be visible and non-editable
    And the Resend Reason dropdown should be visible and required
    When I select Resend Reason "<reason>"
    And I click "Resend Invitation"
    Then I should see a confirmation that the invitation was resent
    And the user "<email>" should remain in lifecycle state "Invited"
    And the Invitation Sent Date should be updated to the current timestamp

    Examples:
      | email                          | reason                  |
      | invited.user1@bank-tenant.com  | Invitation Expired      |
      | invited.user2@bank-tenant.com  | Invitation Not Received |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Only users in Invited / Pending Activation lifecycle state may receive a
  # resent invitation. Resend must be blocked for Active, Suspended,
  # Deactivated, and Expired users. The action should either be unavailable
  # in the UI or rejected server-side when invoked.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario Outline: Resend Invitation is blocked for ineligible lifecycle states (AC-02)
    Given a user "<email>" exists in lifecycle state "<state>"
    When I attempt to open the Resend Invitation action for "<email>"
    Then the Resend Invitation action should not be available
    Or the system should reject the resend attempt with a generic error
    And the user "<email>" should remain in lifecycle state "<state>"

    Examples:
      | state       | email                              |
      | active      | active.user@bank-tenant.com        |
      | suspended   | suspended.user@bank-tenant.com     |
      | deactivated | deactivated.user@bank-tenant.com   |
      | expired     | expired.user@bank-tenant.com       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Once a resend invitation completes, the previously issued invitation link
  # must be immediately invalidated. Activation attempted with the old link
  # must fail. This is the user-observable manifestation of single-active-token
  # enforcement and protects against parallel valid invitations.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Old invitation link is invalidated after resend (AC-03)
    Given a user "invited.user@bank-tenant.com" exists in lifecycle state "Invited"
    And I have captured the original activation link
    When I open the Resend Invitation action for "invited.user@bank-tenant.com"
    And I select Resend Reason "Invitation Expired"
    And I click "Resend Invitation"
    Then I should see a confirmation that the invitation was resent
    When the original activation link is opened in a fresh browser session
    Then the activation should be rejected
    And the rejection message should not disclose whether the token previously existed

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Resend Invitation must preserve the originally assigned role, tenant scope,
  # Leasing Company scope, access validity window, and governance restrictions.
  # No privilege escalation may occur through the resend flow.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Resend preserves role, tenant scope, and LC scope (AC-06)
    Given a user "lc.invited@leasing-co.com" exists in lifecycle state "Invited"
    And the user has role "Leasing Company User"
    And the user has tenant scope "Bank Tenant A"
    And the user has LC scope "Leasing Company X"
    And the user has access validity window from "2026-06-01" to "2026-12-31"
    When I open the Resend Invitation action for "lc.invited@leasing-co.com"
    And I select Resend Reason "User Request"
    And I click "Resend Invitation"
    Then I should see a confirmation that the invitation was resent
    And the user record should still show role "Leasing Company User"
    And the user record should still show tenant scope "Bank Tenant A"
    And the user record should still show LC scope "Leasing Company X"
    And the user record should still show access validity window from "2026-06-01" to "2026-12-31"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Backend/API enforcement must remain server-authoritative. A manipulated API
  # request that bypasses the UI lifecycle-state guard must still be rejected
  # by the server. Frontend restrictions alone must not determine eligibility.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Backend rejects manipulated resend request for ineligible user (AC-08)
    Given a user "active.user@bank-tenant.com" exists in lifecycle state "active"
    And I have a valid admin session
    When I send a direct API request to resend invitation for "active.user@bank-tenant.com"
    Then the response status should be 4xx
    And the response should not expose internal invitation token values
    And the user "active.user@bank-tenant.com" should remain in lifecycle state "active"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Tenant and LC isolation are enforced architecture-wide (constraint #5). A
  # resend attempt that crosses tenant or LC boundaries must be blocked. Per
  # RefiNext architecture, cross-tenant access returns 404 (not 403) to prevent
  # enumeration. Requires D20 (second seeded Bank Tenant B) for E2E coverage.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Cross-tenant resend returns 404 (AC-11)
    Given a user "invited.user@bank-tenant-b.com" exists in tenant "Bank Tenant B" in lifecycle state "Invited"
    And I am logged in as a Power User scoped to "Bank Tenant A"
    When I send a direct API request to resend invitation for "invited.user@bank-tenant-b.com"
    Then the response status should be 404
    And the response should not disclose whether the user exists
    And the user "invited.user@bank-tenant-b.com" in "Bank Tenant B" should remain unchanged
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
