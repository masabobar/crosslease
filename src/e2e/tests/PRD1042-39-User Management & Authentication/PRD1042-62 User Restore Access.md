# PRD1042-62 — US 28.18 | User Management | User Restore Access

Generated: 2026-06-05
Story: PRD1042-62 — US 28.18 | User Management | User Restore Access
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (12 ACs, description present, stakeholder-reviewed by Vesna Plakalovic + Philipp Maute, UAT ready)
ACs with Gherkin scenarios: 5 of 12 | Blocked: 0 | Excluded: 7 (edge-case or separate-feature — scope filter table only)
Figma design: Node 424:3848, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "REACTIVATE" (Stage 2 PARTIAL — Figma MCP rate-limited; form fields confirmed from story description; button copy, error states, and success confirmation unverified)

---

## AC Scope Filter

| AC     | Description                                                                                                                        | Classification     | Rationale                                                                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01  | Authorized admin opens Restore Access form; form displayed with correct fields; Reason=Other makes Comment mandatory               | `happy-path`       | Core success entry point; conditional Comment mandatory logic is part of the same form interaction                                          |
| AC-02  | Non-Suspended users (Deactivated, Expired, Active, Invited) blocked from restore                                                   | `main-error`       | Directly blocks the restore workflow for ineligible lifecycle states                                                                        |
| AC-03  | Missing or inactive role blocks restore                                                                                            | `edge-case`        | Backend invariant triggered before submission; not the primary user-facing error path; surfaced only in tampered or stale-config scenarios  |
| AC-04  | Invalid tenant or Leasing Company scope blocks restore                                                                             | `edge-case`        | Backend invariant; same reasoning as AC-03; not a distinct UI-level interaction                                                             |
| AC-05  | All validations pass → status transitions to Active; timestamp recorded; audit logged                                              | `happy-path`       | Core success completion; collapses into the AC-01 Scenario Outline (same flow)                                                              |
| AC-06a | Four-Eyes gate: first authorized submitter → status stays Suspended; WF banner shown on user detail; no temporary lifecycle status | `main-error`       | Four-Eyes is a mandatory workflow gate for Highly Privileged and Privileged tiers; status invariant during approval is a hard business rule |
| AC-06b | Login allowed after reactivation; new sessions generated; revoked sessions remain invalid                                          | `separate-feature` | Post-reactivation authentication belongs in US 28.1 (PRD1042-43); not this spec's scope                                                     |
| AC-07  | Previously assigned role and scope remain unchanged after restore                                                                  | `edge-case`        | Backend invariant; no distinct UI interaction; verified by checking user profile post-restore in the AC-01 happy-path                       |
| AC-08  | Audit logging: actor, reason, timestamp, scope, status transition recorded and immutable                                           | `edge-case`        | Audit trail verification requires test-seam access to audit log API; not E2E UI scope                                                       |
| AC-09  | Backend/API enforcement: server rejects manipulated requests; frontend restrictions not sufficient                                 | `edge-case`        | API-level enforcement tested at integration test layer; not E2E UI                                                                          |
| AC-10  | Auditor role with expired validity window → restore blocked                                                                        | `separate-feature` | Auditor validity window is a cross-cutting concern; belongs with Auditor access spec (US 28.x)                                              |
| AC-11  | Session and token revalidation after restore; revoked sessions stay invalid                                                        | `separate-feature` | Cross-cutting session management; covered in US 28.10 (PRD1042-47)                                                                          |
| AC-12  | Unauthorized user (wrong role or out-of-scope admin) cannot initiate Restore Access                                                | `main-error`       | RefiNext role-based access domain rule; auto-applied negative scenario                                                                      |

**Gherkin generated for:** AC-01, AC-02, AC-05, AC-06a, AC-12
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04, AC-06b, AC-07, AC-08, AC-09, AC-10, AC-11

---

## Scenarios summary

| Tag           | Scenario                                                                                                           | AC           | Priority | E2E          |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------ | -------- | ------------ |
| `@happy-path` | Authorized admin opens Restore Access form and submits (Scenario Outline — 2 admin roles)                          | AC-01, AC-05 | P0       | ⚙️ needs D19 |
| `@happy-path` | Restore Access Reason "Other" makes Comment field mandatory (Scenario — conditional field)                         | AC-01        | P0       | ⚙️ needs D19 |
| `@main-error` | Four-Eyes gate: first submitter keeps user Suspended and WF banner is shown (Scenario Outline — 2 privilege tiers) | AC-06a       | P0       | ✅           |
| `@main-error` | Non-suspended user cannot be reactivated (Scenario Outline — 4 ineligible statuses)                                | AC-02        | P0       | ⚙️ needs D19 |
| `@main-error` | Unauthorized role cannot initiate Restore Access (Scenario)                                                        | AC-12        | P0       | ✅           |

Active scenario blocks: 7 (2 Outlines + 5 Scenarios)
E2E automation candidates: 3 of 6 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.18 @p0
Feature: User Restore Access (US 28.18 — PRD1042-62)
  As a Power User or System Admin
  I want to restore access for a suspended user
  So that temporarily restricted users can regain platform access with their previously assigned role and scope

  Background:
    Given I am authenticated on the RefiNext platform
    And the system has a user "suspended-user@bank.com" with status "Suspended"
    And the user "suspended-user@bank.com" has an active role, valid tenant scope, and valid Leasing Company scope

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-05
  # Authorized admin (system_admin or power_user) opens the Restore Access form
  # on a Suspended user, fills in mandatory fields, submits, and the user status
  # transitions to Active. Both admin roles are tested in a single Outline.
  # Note: exact button label ("Reactivate User" vs "Restore Access") is
  # unverified from design render — test uses accessible role + text pattern.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-05
  Scenario Outline: Authorized admin opens Restore Access form and submits (AC-01, AC-05)
    Given I am logged in as a "<admin_role>" user
    And I am on the user detail page for "suspended-user@bank.com"
    When I initiate the Restore Access action
    Then the Restore Access form must be displayed
    And the "User" field must show "suspended-user@bank.com" and be non-editable
    And the "Current Status" field must show "Suspended" and be non-editable
    And the "Restore Access Reason" dropdown must be present and mandatory
    And the "Effective From" date-time field must be present and mandatory
    When I select restore reason "<reason>" from the dropdown
    And I set "Effective From" to a valid date-time
    And I submit the Restore Access form
    Then the user status must change to "Active"
    And the Restore Access timestamp must be recorded
    And the Restore Access action must be audit logged

    Examples:
      | admin_role   | reason                     |
      | system_admin | Suspension Period Ended     |
      | power_user   | Administrative Decision     |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # When Restore Access Reason = "Other" is selected, the Restore Access Comment
  # text area must become mandatory before the form can be submitted.
  # This conditional mandatory logic is part of the core form behaviour.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01
  Scenario: Restore Access Reason "Other" makes Comment field mandatory (AC-01)
    Given I am logged in as a "system_admin" user
    And I am on the user detail page for "suspended-user@bank.com"
    When I initiate the Restore Access action
    And I select restore reason "Other" from the dropdown
    Then the "Restore Access Comment" text area must become mandatory
    When I attempt to submit the Restore Access form without a comment
    Then the form must not be submitted
    And a validation message must indicate that the comment is required
    When I enter a comment in the "Restore Access Comment" field
    And I set "Effective From" to a valid date-time
    And I submit the Restore Access form
    Then the user status must change to "Active"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06a
  # For Highly Privileged (system_admin, power_user) and Privileged (support_user,
  # back_office) tier users, Four-Eyes approval is MANDATORY.
  # When the first authorized admin submits, the status must remain "Suspended"
  # (never change to any temporary state), and a Workflow Engine approval banner
  # must be visible on the user detail page.
  # The same user who submitted must NOT be able to approve their own request.
  # ---------------------------------------------------------------------------

  @main-error @ac-06a @e2e-ready
  Scenario Outline: Four-Eyes gate: first submitter keeps user Suspended and WF banner is shown (AC-06a)
    Given I am logged in as a "<submitter_role>" user with Four-Eyes required
    And I am on the user detail page for "suspended-user@bank.com"
    When I initiate the Restore Access action
    And I select restore reason "Administrative Decision" from the dropdown
    And I set "Effective From" to a valid date-time
    And I submit the Restore Access form as the first approver
    Then the user status must remain "Suspended"
    And the user status must NOT be "Active"
    And the user status must NOT be "Restore Pending" or any other intermediate status
    And a Workflow Engine approval banner must be visible on the user detail page
    And the pending Restore Access request must be audit logged

    Examples:
      | submitter_role |
      | system_admin   |
      | power_user     |

  @main-error @ac-06a @e2e-ready
  Scenario: Same user cannot submit and approve their own Restore Access request (AC-06a)
    Given I am logged in as a "system_admin" user
    And I have already submitted a Restore Access request for "suspended-user@bank.com"
    When I attempt to approve the pending Restore Access request as the same user
    Then the system must block the approval
    And the user status must remain "Suspended"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Only users in Suspended lifecycle state may be reactivated.
  # Deactivated, Expired, Active, and Invited users must be blocked at the point
  # of action — the form must either not be offered or the backend must reject it.
  # Failed attempts must be audit traceable where required.
  # ---------------------------------------------------------------------------

  @main-error @ac-02
  Scenario Outline: Non-suspended user cannot be reactivated (AC-02)
    Given I am logged in as a "system_admin" user
    And the system has a user "target@bank.com" with status "<ineligible_status>"
    When I attempt to initiate the Restore Access action for "target@bank.com"
    Then the Restore Access action must be blocked
    And the user status must remain "<ineligible_status>"
    And the system must NOT allow the restore to proceed

    Examples:
      | ineligible_status |
      | Active            |
      | Deactivated       |
      | Expired           |
      | Invited           |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # RefiNext role-based access: only Power User and System Admin may initiate
  # Restore Access. All other roles must receive a 403 rejection.
  # Backend/API validation must enforce this — not frontend-only gating.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @e2e-ready
  Scenario: Unauthorized role cannot initiate Restore Access (AC-12)
    Given I am logged in as a "front_office" user
    And the system has a user "suspended-user@bank.com" with status "Suspended"
    When I attempt to POST to the restore access endpoint for "suspended-user@bank.com"
    Then the response status must be 403
    And the user status must remain "Suspended"
```
