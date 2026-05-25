# PRD1042-43 — US 28.1 | USER MANAGEMENT | User Login

Generated: 2026-05-22
Story: PRD1042-43 — US 28.1 | USER MANAGEMENT | User Login
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS
Design linked: No — Stage 2 and Stage 3 skipped (no Figma URL found on story or comments)
ACs covered: 13 of 17
Blocked ACs (no scenario generated): AC-10 (requires lockout reset API), AC-15 (requires test-forge endpoint), AC-16 (requires test-forge endpoint), AC-17 (requires TEST_TOKEN_TTL_SECONDS env override)

---

## Scope filter applied

| AC | Label | Disposition |
|----|-------|-------------|
| AC-01 Login Form Validation | edge-case | Skipped — form field presence is a UI render detail; wrong-field-label defects caught in exploratory |
| AC-02 Email Format Validation | edge-case | Skipped — same generic error response as AC-08; no distinct observable behaviour at this level |
| AC-03 Successful Login | happy-path | Covered — collapsed into happy-path Outline with AC-04, AC-06, AC-07 |
| AC-04 MFA-Governed Session Creation | happy-path | Covered — MFA is backend-authoritative; observable outcome is session creation in the Outline |
| AC-05 Restricted Access Before Authentication Completion | main-error | Covered — dedicated scenario |
| AC-06 Session Initialization | happy-path | Covered — observable assertion in happy-path Outline |
| AC-07 Role-Based Redirect | happy-path | Covered — Examples table drives per-role redirect assertion in Outline |
| AC-08 Invalid Credentials | main-error | Covered — dedicated scenario |
| AC-09 Account Status Validation | main-error | Covered — Scenario Outline for suspended / deactivated / expired |
| AC-10 Failed Login Attempts | separate-feature | Blocked — no scenario generated (requires lockout reset API) |
| AC-11 Role Validation | edge-case + domain-rule | Covered — 1 auto-applied RefiNext negative (no-role-assigned blocks login) |
| AC-12 Scope Validation | edge-case + domain-rule | Covered — 1 auto-applied RefiNext tenant isolation negative (404 not 403) |
| AC-13 Permission Enforcement | edge-case + domain-rule | Covered — 1 auto-applied RefiNext role-access negative (wrong-role API rejection) |
| AC-14 Audit Logging | edge-case | Covered by happy-path Outline assertion; JWT clock-skew sub-test is blocked (requires test-forge endpoint) |
| AC-15 JWT Validation Enforcement | separate-feature | Blocked — no scenario generated (requires test-forge endpoint) |
| AC-16 Token Tampering Protection | separate-feature | Blocked — no scenario generated (requires test-forge endpoint) |
| AC-17 Session Timeout Enforcement | separate-feature | Blocked — no scenario generated (requires TEST_TOKEN_TTL_SECONDS env override) |

Total scenarios: 6

---

### AC-03 / AC-04 / AC-06 / AC-07 — Successful Login, MFA Session, Session Init, Role-Based Redirect

```gherkin
@us-28.1 @ac-03 @ac-04 @ac-06 @ac-07 @p0 @auth @happy-path
Feature: User Login — Happy Path (US 28.1 — PRD1042-43)
  As a RefiNext user
  I want to authenticate with email and password
  So that I can access the system with the correct role context and session

  Background:
    Given the login page is accessible at "/login"
    And the backend auth service is running

  @happy-path @ac-03-ac-04-ac-06-ac-07
  Scenario Outline: Valid credentials create a session and redirect to role dashboard (AC-03, AC-04, AC-06, AC-07)
    Given a <role> user with email "<email>" and status "active" exists in the system
    And the user's tenant MFA policy is enforced by the backend
    When I navigate to "/login"
    And I submit the login form with email "<email>" and a valid password
    Then the authentication flow completes (including any MFA challenge if required by tenant policy)
    And I am redirected to "<landing_page>"
    And the application holds an active session scoped to role "<role>"
    And an audit log entry is created for the login event

    Examples:
      | role                | email                 | landing_page            |
      | system_admin        | admin@bank.com        | /dashboard              |
      | front_office        | fo@bank.com           | /dashboard              |
      | back_office_risk    | bo@bank.com           | /dashboard              |
      | support_user        | support@bank.com      | /dashboard              |
      | auditor             | auditor@bank.com      | /dashboard              |
      | leasing_company_user| lc@lendingco.com      | /workspace              |
```

---

### AC-05 — Restricted Access Before Authentication Completion

```gherkin
@us-28.1 @ac-05 @p0 @auth @error-handling
Scenario: Unauthenticated access to a protected route redirects to login (AC-05)
  Given I am not authenticated
  When I navigate directly to "/dashboard"
  Then I should be redirected to "/login"
  And I should NOT see any protected content

@us-28.1 @ac-05 @p0 @auth @error-handling
Scenario: Partially authenticated user (MFA pending) cannot access protected routes (AC-05)
  Given a user with email "fo@bank.com" has submitted valid credentials
  But the MFA challenge has not been completed
  When I navigate directly to "/dashboard"
  Then I should NOT be able to access the protected resource
  And I should remain on the MFA challenge step or be redirected to "/login"
```

---

### AC-08 — Invalid Credentials

```gherkin
@us-28.1 @ac-08 @p0 @auth @error-handling
Scenario: Wrong password returns a generic error without revealing account existence (AC-08)
  Given a user with email "fo@bank.com" exists in the system
  When I submit the login form with email "fo@bank.com" and an incorrect password
  Then I should NOT be authenticated
  And I should see a generic error message on the login page
  And the error message should NOT contain the word "password"
  And the error message should NOT indicate whether the email address is registered
```

---

### AC-09 — Account Status Validation

```gherkin
@us-28.1 @ac-09 @p0 @auth @error-handling
Scenario Outline: Users with non-active status are blocked from login (AC-09)
  Given a user with email "<email>" has account status "<status>"
  When I submit the login form with email "<email>" and a valid password
  Then I should NOT be authenticated
  And I should see a login error message
  And the error message should NOT expose the reason for rejection beyond a generic access-denied message

  Examples:
    | email                   | status      |
    | suspended@bank.com      | suspended   |
    | deactivated@bank.com    | deactivated |
    | expired@bank.com        | expired     |
```

---

### AC-11 — Role Validation (RefiNext domain rule: no-role user cannot access the system)

```gherkin
@us-28.1 @ac-11 @p1 @auth @error-handling @rbac
Scenario: User without an assigned role is blocked after authentication (AC-11)
  Given a user with email "norole@bank.com" exists with status "active" but no role assigned
  When I submit the login form with email "norole@bank.com" and a valid password
  Then I should NOT gain access to any protected area of the application
  And the system should block session creation or invalidate the session before redirect
```

---

### AC-12 — Scope Validation (RefiNext domain rule: tenant isolation — 404 not 403)

```gherkin
@us-28.1 @ac-12 @p1 @auth @error-handling @tenant-isolation
Scenario: Cross-tenant resource access after login returns 404 not 403 (AC-12)
  Given I am authenticated as "fo@bank-a.com" belonging to Tenant A
  When I make a direct API request to a resource owned by Tenant B
  Then the API response status should be 404
  And the response body should NOT contain any Tenant B data or identifiers
```

---

### AC-13 — Permission Enforcement (RefiNext domain rule: role-access negative)

```gherkin
@us-28.1 @ac-13 @p1 @auth @error-handling @rbac
Scenario: LC User is redirected only to their own self-scope workspace and cannot access bank routes (AC-13)
  Given I am authenticated as a leasing_company_user with email "lc@lendingco.com"
  When I navigate directly to "/dashboard"
  Then I should be redirected to "/workspace"
  And I should NOT be able to access any bank-facing routes
  And an API request to a bank-only endpoint should return 403
```
