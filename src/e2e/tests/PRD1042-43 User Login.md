# BDD Test Suite — PRD1042-43 | US 28.1 | User Login

Generated: 2026-05-21
Story: PRD1042-43 — US 28.1 | USER MANAGEMENT | User Login
Epic: PRD1042-39 — Epic 28: User Management & Authentication
Sprint: Sprint 1
DoR status: PASS (17 ACs, status "Approved by Client")
Design linked: No — [GAP] No Figma URL on story. UI copy, form layout, redirect targets, and error message wording cannot be verified against design. Visual/UI scenarios are authored from requirements text only.
Stages completed: 1 (Jira extraction), 2 (design — skipped, no Figma link), 3 (comparison — warnings only), 4 (BDD generation)

---

## Scope Filter — AC Classification

| AC | Title | Label | Reasoning |
|----|-------|-------|-----------|
| AC-01 | Login form validation (empty fields, button disabled) | `edge-case` | UI detail; does not block a valid user from completing login |
| AC-02 | Email format validation | `edge-case` | Email/password format validation rule applies directly |
| AC-03 | Successful login — credentials → session + token + role context | `happy-path` | Core action: user authenticates and receives a session |
| AC-04 | MFA-governed session creation | `edge-case` | MFA provider unresolved (R1); infrastructure/timing concern |
| AC-05 | Restricted access before authentication completion | `edge-case` | Derivative of AC-04; only active when MFA path is in use |
| AC-06 | Session initialization (role/tenant/LC context loaded) | `happy-path` | Observable extension of AC-03; merged into the same Scenario Outline |
| AC-07 | Role-based redirect to landing page | `happy-path` | Direct observable outcome of a successful login |
| AC-08 | Invalid credentials → generic error (no enumeration) | `main-error` | Wrong credentials directly block login |
| AC-09 | Account status validation (suspended/deactivated/expired) | `main-error` | Inactive account statuses directly block login |
| AC-10 | Failed login attempts → account lockout | `separate-feature` | Lockout-after-N-attempts rule applies directly |
| AC-11 | Role validation (no role / FO+BO hybrid rejected) | `edge-case` | RefiNext domain rule trigger — 1 auto-applied negative only |
| AC-12 | Scope validation (missing tenant/LC/Auditor validity) | `main-error` | Missing scope is an operational blocker for real users |
| AC-13 | Permission enforcement (cross-tenant 404) | `edge-case` | RefiNext domain rule trigger — 1 auto-applied negative only |
| AC-14 | Audit logging | `edge-case` | Internal implementation detail; does not affect user completing login |
| AC-15 | JWT validation enforcement | `edge-case` | Internal JWT flag/key-management detail |
| AC-16 | Token tampering protection | `edge-case` | Internal JWT validation; not part of the primary login flow |
| AC-17 | Session timeout enforcement | `separate-feature` | Timing/timeout/clock behaviour rule applies directly |

**In-scope for scenario generation:** AC-03, AC-06 (merged), AC-07 (`happy-path`); AC-08, AC-09, AC-12 (`main-error`); AC-11, AC-13 (1 auto-applied negative each).
**Excluded from this file:** AC-01, AC-02, AC-04, AC-05, AC-10, AC-14, AC-15, AC-16, AC-17 — deferred to separate feature files or edge-case regression suites.
**Total scenarios:** 9

---

## Scenarios

### AC-03 + AC-06 + AC-07 — Successful Login, Session Initialization, Role-Based Redirect

```gherkin
@us-28.1 @ac-03 @ac-06 @ac-07 @p0 @happy-path
Feature: Successful Login with Role Context and Redirect

  Scenario Outline: A user with valid credentials logs in and is directed to their role-specific landing page
    Given a user with role "<role>" exists with active status, valid credentials, and a valid scope assignment
    When I log in with correct email and password
    Then I am authenticated and hold a valid session
    And my session contains the correct role context "<role>"
    And my session contains the correct tenant or LC scope
    And I am on the landing page "<landing_page>"

    Examples:
      | role                  | landing_page             |
      | front_office          | Bank dashboard           |
      | back_office_risk      | Bank dashboard           |
      | support_user          | Support dashboard        |
      | system_admin          | Admin dashboard          |
      | auditor               | Audit dashboard          |
      | leasing_company_user  | LC self-scope workspace  |
```

---

### AC-08 — Invalid Credentials (Enumeration Prevention)

```gherkin
@us-28.1 @ac-08 @p0 @error-handling
Feature: Invalid Credentials — Generic Error and Enumeration Prevention

  Scenario: Wrong password for a registered email returns a generic error
    Given a registered user email exists in the system
    When I log in with that email and an incorrect password
    Then I am not authenticated
    And the error message is "Invalid email or password."
    And the response does not indicate whether the email exists

  Scenario: Non-existent email returns the same generic error as a wrong password
    Given an email address that does not exist in the system
    When I log in with that email and any password
    Then I am not authenticated
    And the error message is "Invalid email or password."
    And the response body does not reference the email not being found
```

---

### AC-09 — Account Status Validation

```gherkin
@us-28.1 @ac-09 @p0 @error-handling
Feature: Blocked Login for Inactive Account Statuses

  Scenario Outline: An account with an inactive status cannot log in
    Given a user account with status "<status>" exists and the credentials are otherwise valid
    When I log in with those credentials
    Then I am not authenticated
    And no session is created

    Examples:
      | status      |
      | suspended   |
      | deactivated |
      | expired     |
      | invited     |
```

---

### AC-12 — Scope Validation

```gherkin
@us-28.1 @ac-12 @p0 @error-handling
Feature: Blocked Login for Missing or Invalid Scope

  Scenario: A bank user with no valid tenant assignment cannot log in
    Given a bank user account exists with no tenant assigned
    When I log in with valid credentials
    Then I am not authenticated
    And no session is created

  Scenario: A Leasing Company User with no LC scope assigned cannot log in
    Given a Leasing Company User account exists with no LC scope assigned
    When I log in with valid credentials
    Then I am not authenticated
    And no session is created
```

---

### AC-11 — Auto-Applied Negative: MaRisk FO/BO Role Disjunct

```gherkin
@us-28.1 @ac-11 @p0 @error-handling @compliance
Feature: Role Conflict Rejected at Login (MaRisk BTO 1.1)

  Scenario: A user assigned both Front Office and Back Office roles simultaneously cannot log in
    Given a user account has both "front_office" and "back_office_risk" roles assigned simultaneously
    When I log in with valid credentials
    Then I am not authenticated
    And no session is created
```

> Compliance note: The FO/BO disjunct enforces MaRisk BTO 1.1 separation of duties. This scenario must never pass. It is a hard regulatory boundary, not an edge case or optional hardening.

---

### AC-13 — Auto-Applied Negative: Tenant Isolation (Cross-Tenant 404)

```gherkin
@us-28.1 @ac-13 @p0 @error-handling @compliance
Feature: Cross-Tenant Access Returns 404 (Enumeration Prevention)

  Scenario: An authenticated user requesting a resource belonging to another tenant receives 404
    Given user A is authenticated for Tenant A
    And a resource exists that belongs to Tenant B
    When user A requests that resource
    Then the response status is 404
    And the response body does not reference Tenant B or indicate the resource exists elsewhere
```

> Architecture constraint: Tenant isolation returns 404, not 403, to prevent cross-tenant enumeration (architecture principle #5). This must be a dedicated test, not merged with general authorization tests.

