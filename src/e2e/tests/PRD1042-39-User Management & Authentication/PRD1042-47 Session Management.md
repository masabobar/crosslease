# PRD1042-47 — US 28.10 | USER MANAGEMENT | Session Management

Generated: 2026-06-03
Story: PRD1042-47 — US 28.10 | USER MANAGEMENT | Session Management
Epic: PRD1042 — US 28: User Management (inferred from story title structure)
DoR status: PASS (13 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 4 of 13 | Blocked: 0 | Excluded: 9 (edge-case or separate-feature — scope filter table only)
Figma design: None — Stage 2 PARTIAL (backend security story; no dedicated session management design frames provided or linked in story; logout button placement and session-expired redirect state not confirmed in design)

---

## AC Scope Filter

| AC    | Description                                                                                                       | Classification     | Rationale                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System creates a new session after successful login                                                               | `separate-feature` | Server-side session creation — no E2E UI assertion possible beyond observing post-login authenticated state                                                               |
| AC-02 | Session context includes user role, permissions, and tenant/LG scope                                              | `main-error`       | Tenant isolation domain rule trigger: session scoped to one tenant must not allow cross-tenant resource access; auto-generates 1 negative scenario (returns 404, not 403) |
| AC-03 | Session expires automatically after the configured inactivity duration                                            | `separate-feature` | Timing-based inactivity timeout — per classification rule: timing behaviour → separate-feature; expiry HANDLING tested via AC-04                                          |
| AC-04 | Expired session: any user action redirects to the login page                                                      | `happy-path`       | Core testable UI outcome of session expiry — testable with an expired-session fixture without real waiting                                                                |
| AC-05 | Manual logout terminates the session immediately                                                                  | `happy-path`       | Direct user action with a clear, observable E2E outcome — most fundamental session lifecycle action                                                                       |
| AC-06 | Post-logout and post-expiry access to protected resources must be blocked                                         | `main-error`       | Directly blocks unauthorized session reuse after logout — 2 scenarios: access to protected route + token replay rejection                                                 |
| AC-07 | Password reset must invalidate all existing sessions                                                              | `separate-feature` | Session invalidation is a side-effect of the password reset flow; covered in PRD1042-45 (Password Reset) spec                                                             |
| AC-08 | Account deactivation or suspension must terminate active sessions                                                 | `separate-feature` | Session termination is a side-effect of the admin deactivation action; covered in User Management deactivation spec                                                       |
| AC-09 | API requests with missing or expired sessions must be rejected                                                    | `separate-feature` | API-level session validation — API integration tests, not E2E UI scope                                                                                                    |
| AC-10 | Concurrent session behavior must follow policy configuration                                                      | `separate-feature` | Configuration-dependent behavior; belongs in a dedicated Concurrent Session Policy spec                                                                                   |
| AC-11 | Absolute session timeout must expire session regardless of activity                                               | `separate-feature` | Timing-based absolute timeout — per classification rule: timing behaviour → separate-feature                                                                              |
| AC-12 | Session tokens must use HTTP-only Secure cookies; must not be accessible via JavaScript or stored in localStorage | `edge-case`        | Browser/HTTP security properties — verified via cookie inspection and response headers, not E2E UI behavior                                                               |
| AC-13 | All session events must be audit logged with full context                                                         | `separate-feature` | Backend audit log — no UI representation; verified by log/API inspection tests                                                                                            |

**Gherkin generated for:** AC-02, AC-04, AC-05, AC-06
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-01, AC-03, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                           | AC    | Priority | E2E                             |
| ------------- | ---------------------------------------------------------------------------------- | ----- | -------- | ------------------------------- |
| `@happy-path` | Expired session redirects user to login page on any navigation attempt             | AC-04 | P0       | ⚙️ needs session-expiry fixture |
| `@happy-path` | User clicks logout and session is terminated immediately                           | AC-05 | P0       | ✅                              |
| `@main-error` | After logout, accessing a protected resource requires re-authentication            | AC-06 | P0       | ✅                              |
| `@main-error` | After logout, replaying the invalidated session token is rejected                  | AC-06 | P0       | ✅                              |
| `@main-error` | Session scoped to Tenant A cannot access Tenant B resources — returns 404, not 403 | AC-02 | P0       | ⚙️ needs D20                    |

Active scenario blocks: 5 (0 Outlines + 5 Scenarios)
E2E automation candidates: 3 of 5 scenarios ✅

---

## Feature file

```gherkin
@security @us-28.10 @p0
Feature: Session Management (US 28.10 — PRD1042-47)
  As the system
  I want to manage authenticated user sessions securely
  So that inactive and terminated sessions cannot be reused to access protected resources

  Background:
    Given the login page is accessible at "/login"
    And a protected dashboard is accessible at "/dashboard" for authenticated users only
    And a user "John Smith" with email "john.smith@bank.com" exists with account status "Active" in "Tenant A"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # When a session has expired the system must redirect any navigation attempt
  # to the login page. This tests the expiry-handling outcome, not the timing
  # of expiry itself. Requires an expired-session fixture (pre-set via API
  # or test helper) — no real waiting needed.
  # DESIGN GAP (MAJOR): no session-expired redirect state designed on any page.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0
  Scenario: Expired session redirects user to login page on any navigation attempt (AC-04)
    Given "john.smith@bank.com" is logged in with a valid session
    And the session has been expired server-side via test fixture
    When the user navigates to "/dashboard"
    Then the user must be redirected to "/login"
    And the user must not see any protected dashboard content

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # The logout action must immediately terminate the active session server-side.
  # DESIGN GAP (MAJOR): logout button location not confirmed in design frames
  # (expected in profile/navbar area). Test derives from story AC requirements.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0 @e2e-ready
  Scenario: User clicks logout and session is terminated immediately (AC-05)
    Given "john.smith@bank.com" is logged in and viewing the dashboard
    When the user triggers the logout action
    Then the user must be redirected to "/login"
    And the active session must be invalidated server-side
    And any subsequent request to "/dashboard" must require re-authentication

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (post-logout access)
  # After a session is terminated via logout, any attempt to access a protected
  # resource must require full re-authentication. The browser Back button or
  # direct URL navigation must not restore authenticated state.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: After logout, accessing a protected resource requires re-authentication (AC-06)
    Given "john.smith@bank.com" has logged out and the session is terminated
    When the user navigates directly to "/dashboard"
    Then the user must be redirected to "/login"
    And no protected data must be accessible without re-authentication

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (token replay)
  # A previously valid session token must become invalid after logout. Replaying
  # the old token in a direct API request must be rejected to prevent session
  # hijack scenarios.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: After logout, replaying the invalidated session token is rejected (AC-06)
    Given "john.smith@bank.com" has logged out and the session token has been recorded
    When the invalidated session token is used in a direct request to a protected API endpoint
    Then the request must be rejected with an unauthorized response
    And the system must not return any protected resource data

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02 (tenant isolation auto-negative)
  # Session context must be scoped to the user's assigned tenant. A session
  # authenticated against Tenant A must return 404 (not 403) when attempting
  # to access Tenant B resources — per RefiNext tenant isolation domain rule.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario: Session scoped to Tenant A cannot access Tenant B resources — returns 404 (AC-02)
    Given "john.smith@bank.com" is logged in with a session scoped to "Tenant A"
    And a resource belonging to "Tenant B" exists at a known endpoint
    When the user attempts to access the "Tenant B" resource
    Then the response must return 404 Not Found
    And the response must NOT return 403 Forbidden
    And no "Tenant B" resource data must be exposed in the response
```
