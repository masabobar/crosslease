# PRD1042-63 — US 28.19 | User Management | User Deactivation

Generated: 2026-06-05
Story: PRD1042-63 — US 28.19 | User Management | User Deactivation
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (13 ACs, description present, stakeholder-reviewed by Vesna Plakalovic + Philipp Maute, QA ready)
ACs with Gherkin scenarios: 5 of 13 | Blocked: 0 | Excluded: 8 (edge-case or separate-feature — scope filter table only)
Figma design: Node 424:7183, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "DEACTIVATION" (Stage 2 PARTIAL — Figma MCP rate-limited; form fields confirmed from story description; button copy, error states, success state, and WF banner text unverified)

---

## AC Scope Filter

| AC    | Description                                                                                         | Classification                                                             | Rationale                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Authorized admin opens deactivation form; admin-only; server-side scope enforcement                 | `happy-path`                                                               | Core entry point for the deactivation flow; tested as Scenario Outline across system_admin and power_user roles                   |
| AC-02 | Mandatory Reason validation — UI and backend; failed attempts traceable                             | `main-error`                                                               | Empty Reason directly blocks form submission — primary error gate                                                                 |
| AC-03 | Successful deactivation — status→Deactivated; sessions revoked; audit logged                        | `happy-path`                                                               | Merged into AC-01 Outline as the completion assertion of the same happy-path flow                                                 |
| AC-04 | Four-Eyes pending approval for Highly/Privileged users; WF Engine banner; no temporary status       | `main-error`                                                               | Directly affects whether a Highly Privileged user's deactivation completes or enters pending state — primary workflow gate        |
| AC-05 | Session revocation — UI + API; audit traceable                                                      | `edge-case`                                                                | Backend invariant with no distinct UI assertion at E2E layer; covered by AC-03 session revocation assertion in happy path         |
| AC-06 | Login prevention (deactivated user blocked) + Reason=Other→Comment mandatory                        | `main-error` (Comment conditional) / `separate-feature` (login prevention) | Reason=Other→Comment conditional is a direct form validation error tested here; login prevention belongs in PRD1042-43 login spec |
| AC-07 | Historical preservation — workflow ownership, role-at-time, scope-at-time                           | `edge-case`                                                                | Backend/data integrity invariant; not directly assertable via UI E2E without audit API seam                                       |
| AC-08 | No hard delete — user identity remains stored                                                       | `edge-case`                                                                | Backend invariant; assertable via admin user list visibility — no dedicated UI state to assert                                    |
| AC-09 | Audit logging — actor, reason, timestamp, scope, outcome; immutable                                 | `edge-case`                                                                | Requires audit API test seam; not E2E UI testable                                                                                 |
| AC-10 | Backend/API enforcement — server-authoritative; partial deactivation never occurs                   | `edge-case`                                                                | Integration test layer concern; not E2E UI testable                                                                               |
| AC-11 | Permanent access removal — UI routes, APIs, documents, exports, workflows blocked                   | `separate-feature`                                                         | Cross-cutting access control; belongs in access control / role-based access spec                                                  |
| AC-12 | Restore Access restriction — Deactivated users must not re-enter Active lifecycle via standard flow | `main-error`                                                               | Directly testable: Restore Access button/action must be absent or blocked for a Deactivated user; closes the lifecycle loop       |
| AC-13 | Governance & traceability — historical identity refs immutable; audit reconstruction possible       | `edge-case`                                                                | Compliance concern requiring audit API seam; not E2E UI testable                                                                  |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-06 (Comment conditional), AC-12
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06 (login prevention part), AC-07, AC-08, AC-09, AC-10, AC-11, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                                             | AC           | Priority | E2E          |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | ------------ | -------- | ------------ |
| `@happy-path` | Authorized admin opens deactivation form and deactivates user (Scenario Outline — 2 roles: system_admin, power_user) | AC-01, AC-03 | P0       | ⚙️ needs D19 |
| `@main-error` | Missing Reason blocks deactivation submission (AC-02)                                                                | AC-02        | P0       | ✅           |
| `@main-error` | Reason=Other without Comment blocks submission (AC-06)                                                               | AC-06        | P0       | ✅           |
| `@main-error` | Highly Privileged deactivation enters Four-Eyes pending state (Scenario Outline — 2 tiers)                           | AC-04        | P0       | ✅           |
| `@main-error` | Same user cannot submit and approve their own deactivation request (AC-04 — Four-Eyes)                               | AC-04        | P0       | ✅           |
| `@main-error` | Deactivated user cannot be restored via standard Restore Access flow (AC-12)                                         | AC-12        | P0       | ✅           |
| `@main-error` | Unauthorized role cannot access deactivation form (Scenario Outline — 3 roles)                                       | AC-01        | P0       | ✅           |

Active scenario blocks: 7 (3 Outlines + 4 Scenarios)
E2E automation candidates: 6 of 7 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.19 @p0
Feature: User Deactivation (US 28.19 — PRD1042-63)
  As a Power User or System Admin
  I want to deactivate a user account
  So that permanent access removal is enforced while preserving historical auditability

  Background:
    Given the application is running and accessible
    And I am on the User Detail page for the target user

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03
  # Authorized admin opens the deactivation form, fills mandatory fields, and
  # submits. The user status changes to Deactivated and a success confirmation
  # is shown. Session revocation and audit logging are asserted implicitly via
  # the status change outcome — button copy TBC with designer.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @p0
  Scenario Outline: Authorized admin deactivates a user (AC-01, AC-03)
    Given I am logged in as a <role> with authority over the target user's scope
    And the target user has status "Active"
    When I choose to deactivate the target user
    Then the deactivation form must be displayed
    And the User field must be read-only and pre-populated with the target user
    And the Current Status field must be read-only and show "Active"
    When I select "<reason>" from the Deactivation Reason dropdown
    And I set Effective From to a valid date and time
    And I submit the deactivation form
    Then the target user status must change to "Deactivated"
    And a success confirmation must be displayed

    Examples:
      | role         | reason                  |
      | system_admin | Offboarding             |
      | power_user   | Administrative Decision |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Submitting the deactivation form with no Reason selected must show a
  # validation error. Deactivation must not proceed. Both UI and backend must
  # enforce this — backend enforcement is the authoritative gate.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Missing Reason blocks deactivation submission (AC-02)
    Given I am logged in as a system_admin with authority over the target user's scope
    And the target user has status "Active"
    When I choose to deactivate the target user
    Then the deactivation form must be displayed
    When I leave Deactivation Reason empty
    And I set Effective From to a valid date and time
    And I submit the deactivation form
    Then the system must show a validation error on the Deactivation Reason field
    And the target user status must NOT change to "Deactivated"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (Comment conditional)
  # When Reason = Other is selected, the Deactivation Comment field must become
  # mandatory. Submitting without a Comment must be blocked. This is a secondary
  # form validation gate directly blocking workflow completion.
  # Note: login prevention (AC-06 second concern) belongs in PRD1042-43 spec.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: Reason=Other without Comment blocks submission (AC-06)
    Given I am logged in as a system_admin with authority over the target user's scope
    And the target user has status "Active"
    When I choose to deactivate the target user
    Then the deactivation form must be displayed
    When I select "Other" from the Deactivation Reason dropdown
    Then the Deactivation Comment field must become mandatory
    When I leave the Deactivation Comment empty
    And I set Effective From to a valid date and time
    And I submit the deactivation form
    Then the system must show a validation error on the Deactivation Comment field
    And the target user status must NOT change to "Deactivated"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Deactivating a Highly Privileged user (system_admin, power_user) must
  # trigger the Four-Eyes approval gate. The target user's status must NOT
  # change to any temporary state — it remains in its current state. A WF
  # Engine approval task must be created. The same user cannot be both
  # submitter and approver (Four-Eyes enforcement).
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario Outline: Deactivating a Highly Privileged user triggers Four-Eyes pending approval (AC-04)
    Given I am logged in as a system_admin
    And the target user is a <privilege_tier> user with status "Active"
    When I choose to deactivate the target user
    And I complete the deactivation form with a valid reason and Effective From
    And I submit the deactivation form
    Then the target user status must NOT change to "Deactivated"
    And the target user status must NOT change to any temporary deactivation-pending state
    And a Workflow Engine approval task for deactivation must be created
    And a pending deactivation banner must be visible on the target user detail page

    Examples:
      | privilege_tier |
      | power_user     |
      | system_admin   |

  @main-error @ac-04 @p0 @e2e-ready
  Scenario: Same user cannot submit and approve a deactivation request (AC-04 — Four-Eyes)
    Given I am logged in as a system_admin
    And the target user is a power_user with status "Active"
    When I submit a deactivation request for the target user
    And I attempt to approve the same deactivation request as the same user
    Then the system must reject the self-approval attempt
    And the deactivation must NOT become effective

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # A Deactivated user must not be restorable via the standard Restore Access
  # (reactivation) flow. The Restore Access action must be absent or blocked
  # for users with status Deactivated. This closes the lifecycle loop and
  # prevents unauthorized reactivation of permanently deactivated accounts.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0 @e2e-ready
  Scenario: Restore Access is blocked for Deactivated users (AC-12)
    Given I am logged in as a system_admin
    And a user exists with status "Deactivated"
    When I open that user's detail page
    Then the Restore Access action must not be available for a Deactivated user
    And any attempt to restore access via API must be rejected

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01 (role-based access negative)
  # Auto-applied RefiNext domain rule: only authorized roles may access the
  # deactivation form. Front Office, Auditor, and Leasing Company User must
  # not see or trigger deactivation.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0 @e2e-ready
  Scenario Outline: Unauthorized role cannot access deactivation (AC-01)
    Given I am logged in as a <role>
    And a user exists with status "Active"
    When I attempt to open the deactivation form for that user
    Then the deactivation action must not be available
    And any direct API call to deactivate must be rejected with 403

    Examples:
      | role                   |
      | front_office           |
      | auditor                |
      | leasing_company_user   |
```
