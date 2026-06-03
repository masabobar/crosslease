# PRD1042-69 — US 28.25 | USER MANAGEMENT | Secure Logout

Generated: 2026-06-03
Story: PRD1042-69 — US 28.25 | USER MANAGEMENT | Secure Logout
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (9 ACs, description present, stakeholder-reviewed, QA Ready)
ACs with Gherkin scenarios: 5 of 9 | Blocked: 1 (D-R1/PRD1042-76) | Excluded: 3 (edge-case or separate-feature — scope filter table only)
Figma design: None — no Figma URL found on PRD1042-69 or children PRD1042-492/493/494 (Stage 2 FAILED — backend security story, consistent with PRD1042-46 and PRD1042-47 pattern)

---

## Blocked ACs (no scenarios generated)

| AC | Reason | Blocking dependency |
|----|--------|---------------------|
| AC-08 | Federated SSO logout requires IdP End Session Endpoint and SAML SLO integration; untestable until SSO provider is selected and PRD1042-76 scope is confirmed | R1 — Auth provider unconfirmed; PRD1042-76 — SSO/IdP story not yet resolved |

---

## AC Scope Filter

| AC | Description | Classification | Rationale |
|----|-------------|----------------|-----------|
| AC-01 | Logout availability — accessible to all authenticated users regardless of role/tenant | `happy-path` | Primary UI affordance; testable via role-matrix Scenario Outline confirming logout control is visible and functional for every role |
| AC-02 | Session termination — server-side, role/scope invalidated, server-authoritative | `main-error` | Direct security guarantee; testable by probing the API with a saved session token after logout and asserting 401 |
| AC-03 | Server-side token invalidation — reused tokens return 401; refresh tokens invalidated; no reuse until natural expiry | `main-error` | Core security contract; testable by capturing access and refresh tokens before logout and attempting reuse after logout |
| AC-04 | Redirect to login screen after logout; browser back navigation cannot restore authenticated state | `happy-path` | Core UX flow; directly testable at E2E layer — verify URL after logout and verify back navigation does not restore the authenticated view |
| AC-05 | Audit logging — full event fields; immutable records | `edge-case` | Internal record format and immutability require DB-layer inspection; no UI to assert against at E2E layer |
| AC-06 | Distributed session invalidation — synchronized across all microservices; failures audit traceable | `edge-case` | Multi-service synchronization requires a multi-service test harness beyond the scope of single-app E2E; not testable at this layer |
| AC-07 | Centralized logout enforcement — same invalidation rules for all logout pathways | `separate-feature` | Each trigger pathway (password reset → PRD1042-45; account deactivation → PRD1042-60; admin termination → PRD1042-46) has its own story and spec file |
| AC-08 | Federated SSO logout — OIDC End Session + SAML SLO; 5-second timeout | `Blocked` | Requires PRD1042-76 (SSO/IdP) and auth provider selection (R1) before testable |
| AC-09 | Logout from all devices — available from profile/security settings; invalidates all sessions | `happy-path` | Distinct UI affordance with a separate trigger flow; testable at E2E layer as a second happy-path action |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-09
**Blocked (no Gherkin, no pending stub):** AC-08
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06, AC-07

---

## Scenarios summary

| Tag | Scenario | AC | Priority |
|-----|----------|----|----------|
| `@happy-path` | Logout control is visible and accessible for all roles (Scenario Outline — 6 variants) | AC-01 | P0 |
| `@happy-path` | Successful logout terminates session and redirects to login (Scenario Outline — 2 variants) | AC-01, AC-04 | P0 |
| `@main-error` | Access token is rejected after logout | AC-02, AC-03 | P0 |
| `@main-error` | Refresh token is rejected after logout | AC-03 | P0 |
| `@happy-path` | Logout from all devices invalidates all active sessions | AC-09 | P1 |

Active scenario blocks: 5 (3 Outlines + 2 Scenarios)

---

## Feature file

```gherkin
@auth @us-28.25 @p0
Feature: Secure Logout (US 28.25 — PRD1042-69)
  As a user
  I want to securely log out of the platform
  So that my session is terminated and unauthorized reuse of my authenticated access is prevented

  Background:
    Given the application is running and accessible
    And the login page is accessible at "/login"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Verifies that the logout control is present and accessible for every
  # supported role, regardless of tenant context. There is no Figma design for
  # this story — the logout control location (nav bar / profile menu) must be
  # confirmed with the FE team before the Playwright selector is written.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario Outline: Logout control is visible and accessible for all roles (AC-01)
    Given I am authenticated as a <role> user
    When I navigate to the authenticated application
    Then a logout control must be visible in the UI
    And the logout control must be interactable regardless of current page context

    Examples:
      | role                |
      | system_admin        |
      | front_office        |
      | back_office_risk    |
      | support_user        |
      | auditor             |
      | leasing_company_user |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-04
  # Verifies that triggering logout completes successfully, redirects the user
  # to the login screen, and prevents back navigation from restoring the
  # authenticated state. Covers two roles as representative samples — full
  # role matrix is in the AC-01 Outline above.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-04 @p0
  Scenario Outline: Successful logout redirects to login and clears authenticated state (AC-01, AC-04)
    Given I am authenticated as a <role> user
    When I trigger logout
    Then I should be redirected to the login page
    And I should not be authenticated
    And navigating back in browser history should not restore the authenticated view

    Examples:
      | role             |
      | system_admin     |
      | front_office     |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-03
  # Verifies that the access token captured before logout is rejected by the
  # API after logout completes. This is the core server-side invalidation
  # guarantee. Requires the test to capture the access token before triggering
  # logout and probe an authenticated endpoint afterward.
  # Note: auth provider (R1) affects how tokens are captured in the test setup.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-03 @p0
  Scenario: Access token is rejected after logout (AC-02, AC-03)
    Given I am authenticated as a "front_office" user
    And I have captured my current access token
    When I trigger logout
    And I send an authenticated API request using the captured access token
    Then the response status should be 401
    And the response body should indicate the session is no longer valid

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Verifies that the refresh token is also invalidated after logout. A captured
  # refresh token must not be usable to obtain a new access token after logout.
  # This closes the token-refresh path that would otherwise allow re-entry
  # after single-device logout.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Refresh token is rejected after logout (AC-03)
    Given I am authenticated as a "front_office" user
    And I have captured my current refresh token
    When I trigger logout
    And I attempt to obtain a new access token using the captured refresh token
    Then the response status should be 401
    And the response body should indicate the refresh token is invalid or revoked

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-09
  # Verifies the "Logout from all devices" action is available in profile or
  # security settings and that triggering it invalidates a second active session
  # opened concurrently. Requires two simultaneous sessions for the same user.
  # No Figma design exists for the security settings panel — selector must be
  # confirmed with FE team once the panel is implemented.
  # ---------------------------------------------------------------------------

  @happy-path @ac-09 @p1
  Scenario: Logout from all devices invalidates all active sessions (AC-09)
    Given I am authenticated as a "system_admin" user in session A
    And the same user is also authenticated in session B on a different device or browser context
    When I navigate to profile or security settings in session A
    And I trigger "logout from all devices"
    Then session A should be terminated
    And a subsequent authenticated API request from session B should return 401
    And the audit log should record a global logout event distinct from a single-session logout
```

---

## Blockers and Gaps Summary

| Severity | Item | AC | Resolution required from |
|----------|------|----|--------------------------|
| BLOCKER (R1 / PRD1042-76) | AC-08 Federated SSO logout cannot be tested until the auth provider is selected (R1) and PRD1042-76 (SSO/IdP story) is scoped and implemented; OIDC End Session Endpoint and SAML SLO integration are untestable without a resolved IdP | AC-08 | Dev team / PO — resolve auth provider selection (R1) and confirm PRD1042-76 scope before scheduling AC-08 scenarios |
| MAJOR | No Figma design for the authenticated UI shell showing logout control placement (nav bar vs. profile dropdown vs. sidebar); Playwright selector for the logout button cannot be finalized until FE implements and confirms the control location | AC-01, AC-04 | FE team / Designer — confirm logout control location and preferred test selector (data-testid or ARIA role) once implemented |
| MAJOR | No Figma design for the profile / security settings panel showing the "Logout from all devices" affordance; selector and exact control label cannot be confirmed | AC-09 | FE team / Designer — confirm control placement and label in security settings panel |
| MAJOR | Token capture mechanism for AC-02/AC-03 test setup depends on the auth provider (R1); if tokens are HttpOnly cookies rather than localStorage, the Playwright test setup for capturing and replaying tokens requires a dedicated test endpoint or a test-forge helper | AC-02, AC-03 | Dev team — confirm token storage mechanism and provide test-forge endpoint or `TEST_JWT_SECRET` (D17) if needed |
| INFO | AC-07 (centralized enforcement) covers credential revocation as a logout trigger; it is unclear whether credential revocation has its own user story and spec. If not, a gap exists in logout pathway coverage | AC-07 | BA / PO — confirm whether credential revocation has a dedicated story or should be added to this story's scope |
| INFO | The "logout confirmation" dialog mentioned in the story description as optional has no AC backing it; if the FE team implements a confirmation dialog, a scenario for dismissing/confirming it should be added to this spec | AC-01, AC-04 | BA / PO / FE team — confirm whether a confirmation dialog will be implemented and whether it requires test coverage |
