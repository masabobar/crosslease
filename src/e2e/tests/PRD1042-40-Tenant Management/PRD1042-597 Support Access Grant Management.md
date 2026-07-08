# PRD1042-597 — US 29.16 | Tenant Management | Support Access Grant Management

Generated: 2026-07-07
Story: PRD1042-597 — US 29.16 | Tenant Management | Support Access Grant Management
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (21 ACs derived from Functional Requirements + Field Specs + Validation Rules + Edge Cases, description present, stakeholder-reviewed by Philipp Maute + Vesna Plakalovic on 2026-06-02, Jira status QA ready)
ACs with Gherkin scenarios: 10 of 21 | Blocked: 3 (D-Notification, D-Session-Signal, D-Scheduler) | Excluded: 8 (edge-case or separate-feature — scope filter table only)
Figma design: NOT LINKED (Stage 2 FAILED — no Figma URL in story description, FE subtask PRD1042-696, or attachments; design-blind generation; Grant Creation Form UI, Emergency confirmation dialog, Support session banner all unverified)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                               | Blocking dependency                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| AC-07 | Auto-flag review timer + configurable window (default 24h) requires clock override to test overdue escalation        | D-Scheduler (clock override / job trigger)                        |
| AC-08 | All System Admins notified on Emergency grant creation — notification delivery/emission requires inspection harness  | D-Notification (notification event capture API)                   |
| AC-17 | Session invalidation immediately on expiry during active session requires clock override to force expiry mid-session | D-Session-Signal (session inspection + D16-analog clock override) |

---

## AC Scope Filter

| AC    | Description                                                                                                     | Classification | Rationale                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| AC-01 | Support Access Allowed flag must be true before any grant can be created (TM-12)                                | `happy-path`   | Precondition gate for the core create-grant flow                                                   |
| AC-02 | Grants created by System Admin only; Support User cannot create/extend/revoke own grant                         | `main-error`   | Role-based access control on grant creation endpoint                                               |
| AC-03 | Grants expire automatically at valid-until; no open-ended grants                                                | `edge-case`    | Scheduled job auto-expiry — internal timing behavior; validation "not open-ended" covered by AC-13 |
| AC-04 | Revocation is immediate; active sessions for the revoked grant are invalidated                                  | `happy-path`   | Core System Admin action; session invalidation observable via subsequent access attempt            |
| AC-05 | Renewal/extension requires creation of new grant with new justification                                         | `edge-case`    | Business rule — implemented as forbidden PATCH endpoint; scope-filter only                         |
| AC-06 | Emergency Incident Response grants — single System Admin, no countersignature at creation                       | `happy-path`   | Distinct success flow — bypasses Four-Eyes at creation                                             |
| AC-07 | Emergency grant auto-flagged for post-access governance review within configurable window (default 24h)         | `Blocked`      | Requires D-Scheduler / clock override to test window elapse and overdue escalation                 |
| AC-08 | All System Admins notified on Emergency grant creation                                                          | `Blocked`      | Requires D-Notification event capture harness                                                      |
| AC-09 | Post-access reviewer must be different System Admin than grant creator (reviewer != grant creator) — Four-Eyes  | `main-error`   | Auto-applied Four-Eyes domain rule; merged with AC-19 negative scenario                            |
| AC-10 | Support access via active grant is always read-only regardless of any other configuration                       | `main-error`   | Enforced at API layer; validates write rejection                                                   |
| AC-11 | Persistent read-only mode banner identifying tenant context displayed throughout Support session                | `happy-path`   | User-visible session state indicator (design unverified — Stage 2 FAILED)                          |
| AC-12 | Grant Creation Form fields — Grantee, Target Tenant, Access Reason, Valid From, Valid Until, Additional Context | `happy-path`   | Form submit with valid values; happy-path covers happy submission                                  |
| AC-13 | Valid Until must be future datetime; past → 422                                                                 | `main-error`   | Direct validation failure blocking grant creation                                                  |
| AC-14 | Max grant duration 30 days from Valid From (platform-configurable); Valid Until > 30 days → 422                 | `main-error`   | Direct validation failure blocking grant creation                                                  |
| AC-15 | Support Access Allowed = false → grant creation blocked with 422                                                | `main-error`   | Direct precondition failure                                                                        |
| AC-16 | Multiple active grants per grantee/tenant allowed                                                               | `edge-case`    | Absence of a rule; asserting "no error" adds low value                                             |
| AC-17 | Grant expires during active session → session invalidated immediately, GRANT_EXPIRED event                      | `Blocked`      | Requires D-Session-Signal + clock override to force expiry mid-session                             |
| AC-18 | Support User attempts write operation → rejected at API layer regardless of grant                               | `main-error`   | Absolute security invariant; merged with AC-10 read-only rejection                                 |
| AC-19 | Grant creator attempts emergency post-access review → 403 (reviewer must be different)                          | `main-error`   | Auto-applied Four-Eyes domain rule; merged with AC-09                                              |
| AC-20 | Grant Record fields (read view) — Grantee, Target Tenant, Access Reason, Valid From, Valid Until, Status, ...   | `edge-case`    | Read-view field display; covered implicitly by happy-path Then-clauses                             |
| AC-21 | Audit events emitted: GRANT_CREATED, GRANT_REVOKED, GRANT_EXPIRED, SUPPORT_TENANT_ACCESS, EMERGENCY_REVIEW      | `edge-case`    | Audit log emission — internal observability, not user-facing behavior                              |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-06, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-18, AC-19
**Blocked (no Gherkin):** AC-07, AC-08, AC-17
**No Gherkin (edge-case or separate-feature):** AC-03, AC-05, AC-16, AC-20, AC-21

---

## Scenarios summary

| Tag           | Scenario                                                                                 | AC           | Priority | E2E                                |
| ------------- | ---------------------------------------------------------------------------------------- | ------------ | -------- | ---------------------------------- |
| `@happy-path` | System Admin creates a standard Support Access grant (AC-01, AC-12)                      | AC-01, AC-12 | P0       | `⚙️ needs D19`                     |
| `@happy-path` | System Admin creates Emergency Incident Response grant without countersignature (AC-06)  | AC-06        | P0       | `⚙️ needs D19`                     |
| `@happy-path` | Support User sees persistent read-only tenant banner throughout session (AC-11)          | AC-11        | P0       | `⚙️ needs D19` (design unverified) |
| `@happy-path` | System Admin revokes active grant; Support User immediately loses access (AC-04)         | AC-04        | P0       | `⚙️ needs D19 + D-Session-Signal`  |
| `@main-error` | Non-System-Admin roles cannot create Support Access grants (AC-02)                       | AC-02        | P0       | `✅`                               |
| `@main-error` | Grant creation blocked when Support Access Allowed = false on tenant (AC-15)             | AC-15        | P0       | `✅`                               |
| `@main-error` | Valid Until in the past rejected with 422 (AC-13)                                        | AC-13        | P0       | `✅`                               |
| `@main-error` | Valid Until further than 30 days from Valid From rejected with 422 (AC-14)               | AC-14        | P0       | `✅`                               |
| `@main-error` | Support User attempting a write operation is rejected regardless of grant (AC-10, AC-18) | AC-10, AC-18 | P0       | `⚙️ needs D19`                     |
| `@main-error` | Emergency grant creator cannot perform own post-access review — Four-Eyes (AC-09, AC-19) | AC-09, AC-19 | P0       | `⚙️ needs D19`                     |

Active scenario blocks: 10 (0 Outlines + 10 Scenarios)
E2E automation candidates: 4 of 10 scenarios `✅`

---

## Feature file

```gherkin
@tenant-management @us-29.16 @p0
Feature: Support Access Grant Management (US 29.16 — PRD1042-597)
  As a System Admin
  I want to create, manage, and revoke time-limited Support Access Grants for named Support Users
  So that Support Users may access a specific tenant in read-only mode for a defined and justified purpose within a controlled time window

  Background:
    Given a Bank Tenant "Tenant-A" exists with lifecycle status "Active"
    And a System Admin user "sysadmin1@platform.com" exists
    And a Support User "support1@platform.com" exists

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-12
  # Verifies the primary create-grant flow: System Admin submits a valid grant
  # against a tenant with Support Access Allowed = true. All mandatory form
  # fields present and valid. Copy for form labels and success message is
  # design-unverified (Stage 2 FAILED — no Figma linked); assertions use
  # semantic locators and API response contract only.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-12 @p0
  Scenario: System Admin creates a standard Support Access grant (AC-01, AC-12)
    Given "Tenant-A" has Support Access Allowed set to true
    And I am logged in as System Admin "sysadmin1@platform.com"
    When I navigate to Tenant-A's Support Access Grants tab
    And I open the Create Grant form
    And I fill the form with:
      | Field              | Value                        |
      | Grantee            | support1@platform.com        |
      | Access Reason      | User Access Issue            |
      | Valid From         | now                          |
      | Valid Until        | now + 7 days                 |
      | Additional Context | Diagnosing user login issue  |
    And I submit the form
    Then the grant should be created with status "Active"
    And the grant record should list Granting Admin as "sysadmin1@platform.com"
    And "support1@platform.com" should appear as grantee on Tenant-A's grant list

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # Emergency Incident Response grant is a documented Four-Eyes waiver: a
  # single System Admin creates without countersignature. Governance is
  # preserved by post-access review (AC-09/AC-19). This scenario verifies
  # only the creation path — post-access review scheduling and notification
  # side-effects are Blocked (AC-07, AC-08).
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0
  Scenario: System Admin creates Emergency Incident Response grant without countersignature (AC-06)
    Given "Tenant-A" has Support Access Allowed set to true
    And I am logged in as System Admin "sysadmin1@platform.com"
    When I navigate to Tenant-A's Support Access Grants tab
    And I open the Create Grant form
    And I fill the form with:
      | Field              | Value                            |
      | Grantee            | support1@platform.com            |
      | Access Reason      | Emergency Incident Response      |
      | Valid From         | now                              |
      | Valid Until        | now + 4 hours                    |
      | Additional Context | Production outage — INC-2026-071 |
    And I submit the form
    Then the grant should be created with status "Active"
    And the grant should be flagged as "Emergency"
    And the grant should be flagged for post-access governance review

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-11
  # A persistent tenant-context banner must be displayed throughout the entire
  # Support User session. Design unverified (Stage 2 FAILED); scenario asserts
  # banner presence on entry AND after navigation, not verbatim copy.
  # ---------------------------------------------------------------------------

  @happy-path @ac-11 @p0
  Scenario: Support User sees persistent read-only tenant banner throughout session (AC-11)
    Given "Tenant-A" has Support Access Allowed set to true
    And a grant exists for grantee "support1@platform.com" on "Tenant-A" with status "Active"
    And I am logged in as Support User "support1@platform.com"
    When I enter the Support session for "Tenant-A"
    Then a persistent read-only mode banner should be visible identifying tenant context "Tenant-A"
    When I navigate to any tenant-scoped page within the session
    Then the persistent read-only mode banner should remain visible

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # Revocation must be immediate: active sessions on the revoked grant are
  # invalidated. This scenario opens a Support session, revokes the grant from
  # a second admin browser context, and asserts the Support User's next
  # request fails. Immediate session invalidation is observable at the UI/API
  # boundary. AC-17 (auto-expiry mid-session) is Blocked — different mechanism.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0
  Scenario: System Admin revokes active grant; Support User immediately loses access (AC-04)
    Given "Tenant-A" has Support Access Allowed set to true
    And a grant exists for grantee "support1@platform.com" on "Tenant-A" with status "Active"
    And Support User "support1@platform.com" has an active Support session on "Tenant-A"
    When System Admin "sysadmin1@platform.com" revokes the grant with reason "Investigation concluded, access no longer required"
    Then the grant record should have status "Revoked"
    And the grant record should show revocation reason "Investigation concluded, access no longer required"
    And Support User "support1@platform.com"'s next tenant-scoped request should be unauthorized

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Only System Admin may create Support Access grants. Auto-applied
  # role-based-access domain rule. Cross-role enforcement is expected at API
  # layer (403 for authenticated non-System-Admin roles, not 404, because the
  # tenant itself is not being probed — the endpoint scope is grant CUD).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles cannot create Support Access grants (AC-02)
    Given "Tenant-A" has Support Access Allowed set to true
    And I am logged in as <role>
    When I POST to "/api/tenants/{tenant-a-id}/grants" with a valid grant payload
    Then the response status should be 403

    Examples:
      | role                 |
      | Front Office         |
      | Back Office          |
      | Leasing Company User |
      | Auditor              |
      | Support User         |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15
  # Support Access Allowed = false on the tenant blocks grant creation with
  # 422. This is the TM-12 gate — a hard precondition, checked before other
  # field validation.
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @p0 @e2e-ready
  Scenario: Grant creation blocked when Support Access Allowed = false on tenant (AC-15)
    Given "Tenant-A" has Support Access Allowed set to false
    And I am logged in as System Admin "sysadmin1@platform.com"
    When I POST to "/api/tenants/{tenant-a-id}/grants" with a valid grant payload for grantee "support1@platform.com"
    Then the response status should be 422
    And the response should indicate Support Access Allowed is not enabled for the tenant

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Valid Until in the past is rejected with 422. Direct validation-rule
  # failure. Uses API for deterministic clock control on the boundary value.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0 @e2e-ready
  Scenario: Valid Until in the past rejected with 422 (AC-13)
    Given "Tenant-A" has Support Access Allowed set to true
    And I am logged in as System Admin "sysadmin1@platform.com"
    When I POST to "/api/tenants/{tenant-a-id}/grants" with:
      | Field         | Value                       |
      | Grantee       | support1@platform.com       |
      | Access Reason | User Access Issue           |
      | Valid From    | now - 1 hour                |
      | Valid Until   | now - 1 minute              |
    Then the response status should be 422
    And the response should reference the "validUntil" field
    And no grant record should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Maximum grant duration is 30 days from Valid From (platform-configurable,
  # default 30). Valid Until further than 30 days is rejected with 422.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0 @e2e-ready
  Scenario: Valid Until further than 30 days from Valid From rejected with 422 (AC-14)
    Given "Tenant-A" has Support Access Allowed set to true
    And the platform maximum grant duration configuration is 30 days
    And I am logged in as System Admin "sysadmin1@platform.com"
    When I POST to "/api/tenants/{tenant-a-id}/grants" with:
      | Field         | Value                       |
      | Grantee       | support1@platform.com       |
      | Access Reason | Regulatory Assistance       |
      | Valid From    | now                         |
      | Valid Until   | now + 31 days               |
    Then the response status should be 422
    And the response should reference the maximum grant duration
    And no grant record should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10, AC-18
  # Support access is ALWAYS read-only regardless of grant state. Write
  # operations rejected at API layer even for a fully-valid active grant. This
  # is an absolute security invariant. Choose a representative write endpoint
  # per module; assert 403 (authorization refusal by role attribute, not
  # tenant-scope 404).
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @ac-18 @p0
  Scenario: Support User attempting a write operation is rejected regardless of grant (AC-10, AC-18)
    Given "Tenant-A" has Support Access Allowed set to true
    And a grant exists for grantee "support1@platform.com" on "Tenant-A" with status "Active"
    And I am logged in as Support User "support1@platform.com" within an active Support session on "Tenant-A"
    When I POST to a tenant-scoped write endpoint on "Tenant-A" with a valid payload
    Then the response status should be 403
    And no state change should occur on "Tenant-A"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09, AC-19 (Four-Eyes)
  # The System Admin who created an Emergency grant cannot be the reviewer.
  # Auto-applied Four-Eyes domain rule for the post-access review pattern —
  # preserves Four-Eyes integrity that immediate countersignature waiver gave
  # up at creation. Expected response: 403 with reviewer-must-differ code.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @ac-19 @p0
  Scenario: Emergency grant creator cannot perform own post-access review — Four-Eyes (AC-09, AC-19)
    Given "Tenant-A" has Support Access Allowed set to true
    And I am logged in as System Admin "sysadmin1@platform.com"
    And I have created an Emergency Incident Response grant on "Tenant-A" for grantee "support1@platform.com"
    When I POST to "/api/tenants/{tenant-a-id}/grants/{grant-id}/review" as the same System Admin "sysadmin1@platform.com"
    Then the response status should be 403
    And the response should indicate the reviewer must be different from the grant creator
    And the grant should remain flagged as awaiting post-access review
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
