# PRD1042-593 — US 29.12 | TENANT MANAGEMENT | Tenant Access Policy Management

Generated: 2026-07-07
Story: PRD1042-593 — US 29.12 | Tenant Management | Tenant Access Policy Management
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (8 ACs, description present, stakeholder-reviewed, QA ready)
ACs with Gherkin scenarios: 7 of 8 | Blocked: 0 | Excluded: 1 (edge-case — scope filter table only)
Figma design: No Figma URL linked to story or child tickets (BE/FE/QA subtasks empty). FE PRD1042-684 is Done — design not bubbled to parent (recurring bubble-up gap). Stage 2 FAILED — design-blind mode; Tenant Detail canvas 52:1806 used as closest cached sibling pattern reference. Design unverified.

---

## AC Scope Filter

| AC    | Description                                                                                                          | Classification | Rationale                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System Admin may set three access policy flags on a tenant; changes take effect immediately on save                  | `happy-path`   | Core success flow — single-actor mutation of three booleans with justification, verified via GET after PUT           |
| AC-02 | Support Read-Only Access Allowed = false blocks new Support Access Grant creation; existing active grants unaffected | `main-error`   | Cross-tenant enforcement contract validated at grant-creation call site; happy path is the flag mutation itself      |
| AC-03 | Auditor Access Allowed = false blocks Auditor provisioning at User Management layer                                  | `main-error`   | Cross-service enforcement — User Management provisioning must be blocked when flag is false                          |
| AC-04 | LC Portal Enabled = false makes LC Portal unavailable for tenant users                                               | `main-error`   | LC User login/portal-access gated by tenant flag — 404-not-403 on portal access                                      |
| AC-05 | Governance Justification required on every flag change (min 20 chars)                                                | `main-error`   | Direct blocker on save — validation enforced at PUT endpoint                                                         |
| AC-06 | Flag modification not permitted on Archived tenants → returns 422                                                    | `main-error`   | Lifecycle gate — Archived tenants cannot have policy mutated; matches TM-11 terminal state contract                  |
| AC-07 | Audit event ACCESS_POLICY_MODIFIED emitted — one event per flag changed with actor + justification + timestamp UTC   | `happy-path`   | Governance evidence trail — verified via audit log query after happy-path save                                       |
| AC-08 | Access Policy endpoint returns HTTP 404 to all non-System Admin roles                                                | `main-error`   | 404-not-403 pattern (canonical RefiNext role gating on privileged endpoints)                                         |
| N/A   | Existing grants remain active until expiry/revocation when Support flag set to false (edge case)                     | `edge-case`    | State-transition timing of pre-existing grants belongs in TM-16 Support Access Grant spec, not policy-mutation story |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** grant-persistence edge case

---

## Scenarios summary

| Tag           | Scenario                                                                                   | AC           | Priority | E2E                                              |
| ------------- | ------------------------------------------------------------------------------------------ | ------------ | -------- | ------------------------------------------------ |
| `@happy-path` | System Admin updates all three access policy flags with valid justification (AC-01, AC-07) | AC-01, AC-07 | P0       | ⚙️ needs audit-log query fixture (D-Audit)       |
| `@happy-path` | GET /access-policy returns current flags for System Admin (AC-01)                          | AC-01        | P0       | ✅                                               |
| `@main-error` | Justification shorter than 20 characters is rejected (AC-05)                               | AC-05        | P0       | ✅                                               |
| `@main-error` | Flag modification on Archived tenant returns 422 (AC-06)                                   | AC-06        | P0       | ⚙️ needs PRD1042-1100 Archived fixture           |
| `@main-error` | Non-System Admin roles receive 404 on Access Policy endpoint (AC-08)                       | AC-08        | P0       | ✅                                               |
| `@main-error` | Support Read-Only flag = false blocks new Support Access Grant creation (AC-02)            | AC-02        | P0       | ⚙️ needs TM-16 grant-creation endpoint           |
| `@main-error` | Auditor flag = false blocks Auditor provisioning at User Management (AC-03)                | AC-03        | P0       | ⚙️ needs D19 (throwaway user) + provisioning API |
| `@main-error` | LC Portal Enabled = false blocks LC User portal access with 404 (AC-04)                    | AC-04        | P0       | ⚙️ needs LC Portal fixture (D-LCPortal)          |

Active scenario blocks: 8 (2 Scenarios + 3 Outlines + 3 Scenarios)
E2E automation candidates: 3 of 8 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.12 @p0
Feature: Tenant Access Policy Management (US 29.12 — PRD1042-593)
  As a System Admin
  I want to configure the access policy flags for a tenant
  So that I can govern which types of cross-functional access are permitted for that tenant

  Background:
    Given a System Admin user is authenticated
    And a tenant "acme-bank" exists in status "Active"
    And the Access Policy endpoint is accessible at "/api/tenants/acme-bank/access-policy"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-07
  # System Admin sets all three flags with a valid governance justification.
  # Verifies immediate effect via GET after PUT, and confirms one audit event
  # per flag changed with the required payload fields.
  # Design unverified — form layout, per-flag save vs batch save UI unresolved
  # (ambiguity Q1).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-07 @p0
  Scenario: System Admin updates all three access policy flags with valid justification (AC-01, AC-07)
    Given the current access policy flags for "acme-bank" are all false
    When I PUT to "/api/tenants/acme-bank/access-policy" with body:
      | field                              | value                                                        |
      | supportReadOnlyAccessAllowed       | true                                                         |
      | auditorAccessAllowed               | true                                                         |
      | lcPortalEnabled                    | true                                                         |
      | governanceJustification            | Enabling all cross-functional access flags for Q3 onboarding |
    Then the response status should be 200
    And a GET to "/api/tenants/acme-bank/access-policy" returns:
      | field                              | value |
      | supportReadOnlyAccessAllowed       | true  |
      | auditorAccessAllowed               | true  |
      | lcPortalEnabled                    | true  |
    And three "ACCESS_POLICY_MODIFIED" audit events should be emitted
    And each audit event should contain fields "tenant", "flag", "previousValue", "newValue", "actor", "governanceJustification", "timestamp"
    And each audit event "actor" should equal the System Admin user id
    And each audit event "timestamp" should be in UTC ISO-8601 format

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario: GET returns current access policy flags for System Admin (AC-01)
    Given the current access policy flags for "acme-bank" are:
      | field                              | value |
      | supportReadOnlyAccessAllowed       | true  |
      | auditorAccessAllowed               | false |
      | lcPortalEnabled                    | true  |
    When I GET "/api/tenants/acme-bank/access-policy"
    Then the response status should be 200
    And the response body should contain field "supportReadOnlyAccessAllowed" with value "true"
    And the response body should contain field "auditorAccessAllowed" with value "false"
    And the response body should contain field "lcPortalEnabled" with value "true"
    And the response body should contain read-only field "lastModifiedBy" for each flag
    And the response body should contain read-only field "lastModifiedAt" for each flag

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Governance justification below the 20-character minimum is rejected.
  # Field-spec-driven: "Required on every flag change. Min 20 chars."
  # Design unverified — inline error copy for the counter is unknown.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @e2e-ready
  Scenario Outline: Justification shorter than 20 characters is rejected (AC-05)
    When I PUT to "/api/tenants/acme-bank/access-policy" with body:
      | field                              | value                |
      | supportReadOnlyAccessAllowed       | true                 |
      | governanceJustification            | <justification>      |
    Then the response status should be <status>
    And the response should indicate justification validation failure

    Examples:
      | justification            | status |
      |                          | 400    |
      | too short                | 400    |
      | still under twenty       | 400    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Archived tenants are a terminal state; policy mutation must return 422.
  # Aligns with TM-11 terminal-state contract (parity with PRD1042-590).
  # Requires PRD1042-1100 Archived-tenant seed fixture.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Flag modification on Archived tenant returns 422 (AC-06)
    Given a tenant "archived-bank" exists in status "Archived"
    When I PUT to "/api/tenants/archived-bank/access-policy" with body:
      | field                              | value                                       |
      | auditorAccessAllowed               | true                                        |
      | governanceJustification            | Attempting policy change on archived tenant |
    Then the response status should be 422
    And no "ACCESS_POLICY_MODIFIED" audit event should be emitted

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Role-gating uses 404-not-403 to prevent endpoint enumeration by unprivileged
  # roles (canonical RefiNext tenant-management pattern; matches PRD1042-582,
  # PRD1042-583, PRD1042-585).
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0 @e2e-ready
  Scenario Outline: Non-System Admin roles receive 404 on Access Policy endpoint (AC-08)
    Given a <role> user is authenticated
    When I GET "/api/tenants/acme-bank/access-policy"
    Then the response status should be 404

    Examples:
      | role          |
      | Front Office  |
      | Back Office   |
      | LC User       |
      | Support User  |
      | Auditor       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Cross-service enforcement: with Support Read-Only Access Allowed = false,
  # any attempt to create a new Support Access Grant for that tenant must be
  # blocked. TM-16 is the grant-creation surface; this scenario asserts the
  # policy contract at that call site.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0
  Scenario: Support Read-Only flag = false blocks new Support Access Grant creation (AC-02)
    Given the access policy for "acme-bank" has "supportReadOnlyAccessAllowed" = false
    And a Support User exists
    When a System Admin attempts to create a Support Access Grant for "acme-bank"
    Then the grant creation should be rejected
    And the rejection reason should reference the tenant access policy

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Cross-service enforcement: User Management provisioning must consult the
  # Auditor Access Allowed flag. When false, provisioning an Auditor user
  # scoped to the tenant is blocked.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Auditor flag = false blocks Auditor provisioning at User Management (AC-03)
    Given the access policy for "acme-bank" has "auditorAccessAllowed" = false
    When a System Admin attempts to provision an Auditor user scoped to tenant "acme-bank"
    Then the provisioning should be rejected
    And the rejection reason should reference the tenant access policy

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # LC Portal gating: with lcPortalEnabled = false, LC Users belonging to the
  # tenant cannot reach the LC Portal. Uses 404-not-403 to avoid tenant-scope
  # enumeration (consistent with 29.x tenant isolation patterns).
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: LC Portal Enabled = false blocks LC User portal access (AC-04)
    Given the access policy for "acme-bank" has "lcPortalEnabled" = false
    And an LC User belonging to tenant "acme-bank" is authenticated
    When the LC User navigates to the LC Portal
    Then the LC Portal should not be accessible
    And the response status should be 404
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
