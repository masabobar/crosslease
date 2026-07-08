# PRD1042-583 — US 29.2 | Tenant Management | Tenant Activation

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin cannot activate tenants (platform-only action).

Generated: 2026-07-06
Story: PRD1042-583 — US 29.2 | Tenant Management | Tenant Activation
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (17 ACs derived from Functional Requirements + Validation Rules + System Behavior + Edge Cases + Permission Matrix, description present, stakeholder-reviewed by Iva Marković/Vesna Plakalovic/Dejan Nikolic/Philipp Maute, QA in progress)
ACs with Gherkin scenarios: 8 of 17 | Blocked: 5 (D16, D-Audit, D-EventBus, PRD1042-75 MFA harness, D-Race) | Excluded: 4 (edge-case or separate-feature — scope filter table only)
Figma design: Node 84:5406, file 7pygkopuqyeEhUTMVp9lrP — Screen "Tenant Activation / Countersignature Modal" (Stage 2 SUCCESS — extracted via Figma REST API, 4 sections mapped: pending list, approval flow, rejection flow, notifications)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                | Blocking dependency                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| AC-04 | Approval window expiry requires clock manipulation to force `Expired` state at E2E; design confirms narrative via request chain node ("Initial submission: Expired without approval") | D16 — `APPROVAL_WINDOW_HOURS` override                |
| AC-10 | Same clock-manipulation blocker as AC-04; design shows re-initiation chain but expiry trigger is time-driven                                                                          | D16 — approval window TTL override                    |
| AC-11 | TENANT_ACTIVATED audit event verification requires audit log inspection API; not surfaced in tenant UI                                                                                | D-Audit — admin API for audit log lookup              |
| AC-13 | Concurrent countersignature race requires deterministic parallel-request harness; not deterministic in browser                                                                        | D-Race — parallel POST fixture for optimistic locking |
| AC-16 | Downstream event/queue retry path is backend infrastructure, not E2E scope                                                                                                            | D-EventBus — event bus inspection fixture             |

---

## AC Scope Filter

| AC    | Description                                                                                                                    | Classification     | Rationale                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Second, independent System Admin countersigns pending tenant creation (requester ≠ countersignatory)                           | `happy-path`       | Core success flow — design confirms via "Approve" primary button + post-approval message "Request was approved. New Group Trade has been activated and is now operational." |
| AC-02 | On countersignature: tenant → Active, NewBusinessAllowed=true, tenant.activated event published                                | `happy-path`       | Covered by AC-01 happy-path — same transaction, observable via design post-approval copy                                                                                    |
| AC-03 | On rejection: tenant stays in Draft/Provisioning, TENANT_CREATION_REJECTED audit event, requester notified                     | `main-error`       | Design copy verbatim: "Request was rejected. New Group Trade will remain in Draft until the request is resubmitted." — validates Vesna comment 36741                        |
| AC-04 | Approval window expiry — request → Expired, tenant stays in Draft/Provisioning, requester notified                             | `Blocked`          | Requires clock manipulation / D16 override to force expiry at test time                                                                                                     |
| AC-05 | Governance Justification: long text, mandatory on countersignature and rejection, min 10 chars                                 | `main-error`       | Design confirms field "Your justification" with helper text "Required · stored in audit log"                                                                                |
| AC-06 | Rejection Reason: conditional mandatory when action=Reject, min 10 chars                                                       | `main-error`       | Rejection path validation — blocks rejection when invalid; design shows reject flow but not min-length error                                                                |
| AC-07 | Actor independence enforced by PRD1042-77 — self-approval returns actor-independence error                                     | `main-error`       | Design confirms via self-submission indicator "You submitted this request" (gray #64748b) with no "Review request" CTA on own rows                                          |
| AC-08 | Governance request must be in Pending state and not expired before countersignature is accepted                                | `edge-case`        | State guard; expired path covered by AC-04 (Blocked), already-rejected path is second-order edge                                                                            |
| AC-09 | Approval window default 48 hours, configurable at platform level by System Admin                                               | `separate-feature` | Platform configuration UI is its own module (Platform Config); default value is business config, not E2E flow                                                               |
| AC-10 | Expired window transitions request to Expired, must be resubmitted from scratch                                                | `Blocked`          | Same clock-manipulation blocker as AC-04; design shows request chain node "Re-initiated after expiry"                                                                       |
| AC-11 | Audit event TENANT_ACTIVATED with tenant ID, requester, countersignatory, justification, UTC timestamp                         | `Blocked`          | Audit log inspection needs admin API; not surfaced in tenant UI                                                                                                             |
| AC-12 | Actor independence enforced server-side by PRD1042-77 — UI enforcement alone is not sufficient                                 | `main-error`       | API-level negative test bypassing UI; covered under AC-07 auto-applied Four-Eyes negative                                                                                   |
| AC-13 | Concurrent countersignature attempts — optimistic locking, only one succeeds, second returns 409                               | `Blocked`          | Race requires parallel-request harness; not deterministic in single-browser E2E                                                                                             |
| AC-14 | Same admin attempts countersignature → actor-independence error, request remains Pending                                       | `main-error`       | Same as AC-07 — merged                                                                                                                                                      |
| AC-15 | Two admins countersign concurrently — optimistic locking; first succeeds, second receives 409                                  | `edge-case`        | Duplicate of AC-13 concurrent race case — Blocked classification takes precedence there                                                                                     |
| AC-16 | Downstream service fails to consume tenant.activated event → retry queue handles propagation                                   | `Blocked`          | Event bus infrastructure verification is outside E2E scope                                                                                                                  |
| AC-17 | Permission Matrix — only System Admin can view pending governance / countersign / reject; all others (incl. Bank Admin) cannot | `main-error`       | RBAC negative — auto-applied RefiNext 404-not-403 domain rule; Bank Admin (`bank_admin`) added 2026-07-08 per PRD1042-48 (tenant activation is a platform-only action)      |

**Gherkin generated for:** AC-01 (with AC-02), AC-03, AC-05, AC-06, AC-07 (with AC-12, AC-14), AC-17
**Blocked (no Gherkin):** AC-04, AC-10, AC-11, AC-13, AC-16
**No Gherkin (edge-case or separate-feature):** AC-08, AC-09, AC-15

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.**

| Tag           | Scenario                                                                                                             | AC                  | Priority | E2E                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ----------------------------------------------------------------------------------- |
| `@happy-path` | Independent System Admin countersigns pending tenant → tenant Active (with step-up MFA)                              | AC-01, AC-02        | P0       | ⚙️ needs PRD1042-77 wiring + PRD1042-75 MFA harness + seed pending tenant fixture   |
| `@main-error` | Reject countersignature — tenant remains in Draft until resubmitted (design copy verbatim)                           | AC-03               | P0       | ⚙️ needs seed pending tenant fixture + D-Notification stub + PRD1042-75 MFA harness |
| `@main-error` | Governance Justification validation on countersignature (empty / < 10 chars)                                         | AC-05               | P0       | ⚙️ needs seed pending tenant fixture                                                |
| `@main-error` | Rejection Reason validation when action=Reject (empty / < 10 chars)                                                  | AC-06               | P0       | ⚙️ needs seed pending tenant fixture                                                |
| `@main-error` | Same admin attempts self-countersignature — "You submitted this request" indicator + actor-independence server error | AC-07, AC-12, AC-14 | P0       | ⚙️ needs PRD1042-77 wiring                                                          |
| `@main-error` | RBAC — non-System-Admin roles cannot view or act on pending governance requests (404 pattern)                        | AC-17               | P0       | ✅                                                                                  |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 1 of 6 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @governance @four-eyes @us-29.2 @p0
Feature: Tenant Activation — Four-Eyes Countersignature (US 29.2 — PRD1042-583)
  As a System Admin (second actor)
  I want to review and countersign a pending tenant creation request
  So that the new tenant becomes operationally active only after independent second-actor approval

  Background:
    Given the platform is running on the RefiNext dev environment
    And PRD1042-77 Four-Eyes engine is enabled
    And PRD1042-75 Step-up MFA is configured for governance actions
    And a pending tenant creation request exists for tenant "New Group Trade" (code "CL-DE-001")
    And the pending request was submitted by System Admin "admin.requester@holycode.com" ("Ingrid Bjornstad", Admin role)
    And the pending tenant is in Draft/Provisioning status
    And the governance request is in Pending state within the 48-hour approval window

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # An independent second System Admin (identity ≠ requester) reviews and
  # countersigns the pending tenant creation request. Design (node 84:6693)
  # confirms the flow: request detail panel shows action type "Tenant creation",
  # affected user "New Group Trade", tenant code "CL-DE-001", submitter identity,
  # then step-up MFA dialog ("Step up verification required" — "You're about to
  # approve a sensitive change. Confirm it's really you.") gates the primary
  # "Confirm approval" action. Post-approval message (verbatim from design):
  # "Request was approved. New Group Trade has been activated and is now operational."
  # Tenant transitions to Active, NewBusinessAllowed=true, tenant.activated published.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario: Independent System Admin countersigns pending tenant creation with step-up MFA
    Given I am logged in as System Admin "admin.countersignatory@holycode.com" ("Anna Kowalski", Admin role)
    And my identity is different from the pending request's requester
    When I navigate to the "Pending approvals" page
    Then I should see the page title "Pending approvals"
    And I should see the subtitle "Review and act on requests submitted by other administrators under the four-eyes policy."
    When I select the "Pending" filter tab
    And I open the row "Tenant creation · New Group Trade"
    Then I should see the request detail panel with action type "Tenant creation"
    And I should see the affected user "New Group Trade"
    And I should see the tenant code "CL-DE-001"
    And I should see the tenant type "Bank entity"
    And I should see the country "Germany"
    And I should see the submitter identity "Ingrid Bjornstad" with role "Admin"
    And I should see the pre-approval notice "Approval requires step-up MFA verification"
    When I enter my justification "Countersigned after independent review of due-diligence documents"
    And I click "Review request"
    And I click "Approve"
    Then a step-up verification dialog titled "Step up verification required" should appear
    And the dialog should display the subtitle "You're about to approve a sensitive change. Confirm it's really you."
    When I enter a valid 6-digit MFA code
    And I click "Confirm approval"
    Then I should see the confirmation title "Approved request"
    And I should see the confirmation message "Request was approved. New Group Trade has been activated and is now operational."
    And the tenant "New Group Trade" should transition to "Active" status
    And the "New Business Allowed" flag should be set to true
    And the "Tenant Operational Readiness" flag should be evaluated
    And the requester "Ingrid Bjornstad" should be notified of the activation

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (reject path preserves tenant lifecycle)
  # Design (node 84:8250) confirms the rejection flow ends at the state:
  # Title "Rejected request", message "Request was rejected. New Group Trade will
  # remain in Draft until the request is resubmitted." — this VALIDATES the
  # Vesna Plakalovic comment 36741 rule: Rejected is a state of the GOVERNANCE
  # REQUEST, NOT the tenant. Tenant lifecycle stays Draft/Provisioning; only the
  # governance request transitions to Rejected. Step-up MFA also required for
  # rejection (design subtitle: "You're about to reject a sensitive change.
  # Confirm it's really you." — "Confirm rejection" button).
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Reject countersignature — tenant remains in Draft until resubmitted
    Given I am logged in as System Admin "admin.countersignatory@holycode.com" ("Anna Kowalski", Admin role)
    And my identity is different from the pending request's requester
    When I open the pending tenant activation request for "New Group Trade"
    And I enter a justification "Independent review completed"
    And I enter a rejection reason "Due diligence package incomplete — legal clearance letter missing"
    And I click "Reject"
    Then a step-up verification dialog titled "Step up verification required" should appear
    And the dialog should display the subtitle "You're about to reject a sensitive change. Confirm it's really you."
    When I enter a valid 6-digit MFA code
    And I click "Confirm rejection"
    Then I should see the confirmation title "Rejected request"
    And I should see the confirmation message "Request was rejected. New Group Trade will remain in Draft until the request is resubmitted."
    And the governance request should transition to "Rejected" state
    And the tenant "New Group Trade" lifecycle status should remain "Draft/Provisioning"
    And the requester "Ingrid Bjornstad" should be notified of the rejection

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Governance Justification is mandatory on countersignature AND on rejection,
  # min 10 chars. Design confirms field label "Your justification" with helper
  # text "Required · stored in audit log". Empty or too-short values block the
  # action; validation is server-side + UI-guarded. Note: v1 of this suite had
  # no visible error state in design; validation is inferred from AC text.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Governance Justification validation on countersignature (AC-05)
    Given I am logged in as System Admin "admin.countersignatory@holycode.com"
    And my identity is different from the pending request's requester
    When I open the pending tenant activation request for "New Group Trade"
    And I enter my justification "<justification>"
    And I click "Approve"
    Then the countersignature should be blocked
    And an inline validation error should be displayed on the "Your justification" field
    And no step-up MFA dialog should appear
    And the tenant lifecycle status should remain "Draft/Provisioning"
    And the governance request should remain in Pending state

    Examples:
      | justification |
      |               |
      | too short     |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Rejection Reason is CONDITIONAL — required only when action=Reject, min 10
  # chars. Empty or too-short rejection reason blocks the reject action.
  # Validation is server-side; design does not surface a min-length inline error
  # state. Justification is provided as valid (>= 10 chars) so that the failure
  # isolates to the rejection reason field.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario Outline: Rejection Reason validation when action=Reject (AC-06)
    Given I am logged in as System Admin "admin.countersignatory@holycode.com"
    And my identity is different from the pending request's requester
    When I open the pending tenant activation request for "New Group Trade"
    And I enter my justification "Independent review completed on 2026-07-06"
    And I enter a rejection reason "<reason>"
    And I click "Reject"
    Then the rejection should be blocked
    And an inline validation error should be displayed on the rejection reason field
    And no step-up MFA dialog should appear
    And the tenant lifecycle status should remain "Draft/Provisioning"
    And the governance request should remain in Pending state

    Examples:
      | reason |
      |        |
      | short  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07, AC-12, AC-14 (Four-Eyes actor independence)
  # PRD1042-77 enforces requester ≠ countersignatory at server-side. Design
  # (node 84:5886) surfaces the UI-level guard through the self-submission
  # indicator "You submitted this request" (color #64748b) on rows submitted by
  # the current user, with NO "Review request" CTA — the user cannot even open
  # their own pending request for countersignature. Additionally, direct API
  # POST attempts are rejected server-side (AC-12: UI enforcement alone is not
  # sufficient). Request stays in Pending; no TENANT_ACTIVATED audit event.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @ac-12 @ac-14 @four-eyes @p0
  Scenario: Same admin cannot countersign own pending tenant creation
    Given I am logged in as System Admin "admin.requester@holycode.com" ("Ingrid Bjornstad", Admin role)
    And this admin is also the requester of the pending governance request for "New Group Trade"
    When I navigate to the "Pending approvals" page
    And I locate the row "Tenant creation · New Group Trade"
    Then the row should display the indicator "You submitted this request"
    And no "Review request" call-to-action should be present on this row
    When I attempt to open the request detail panel for my own submission
    Then the "Approve" and "Reject" action buttons should not be available
    When I bypass the UI and POST directly to the countersignature endpoint for this request
    Then the request should be rejected with an actor-independence error
    And the tenant "New Group Trade" lifecycle status should remain "Draft/Provisioning"
    And the governance request should remain in Pending state
    And no audit event of type "TENANT_ACTIVATED" should be written

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-17 (Permission Matrix / RBAC)
  # Per the permission matrix in the story: only System Admin can view pending
  # governance requests, countersign, or reject. Front Office, Back Office/Risk,
  # LC User, Support, Auditor, and Bank Admin (bank_admin) cannot see or act on
  # these requests. Bank Admin was added 2026-07-08 per PRD1042-48 (Ivan
  # Mladenovic decision 2026-07-06): Bank Admin is a bank-tenant-scoped role
  # (user_type = bank_tenant) that manages bank-tenant users only; tenant
  # activation is a platform-level action reserved for System Admin, so
  # Bank Admin gets the same 404 as other non-privileged roles.
  # Applies RefiNext 404-not-403 pattern for cross-role access to prevent
  # enumeration of governance requests by non-privileged roles.
  # ---------------------------------------------------------------------------

  @main-error @ac-17 @rbac @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles cannot view or act on pending governance requests
    Given I am logged in as a <role>
    When I attempt to navigate to the "Pending approvals" page
    Then I should not see the "Pending approvals" navigation entry
    And a direct navigation to the pending approvals URL should return 404
    And a direct POST to "/api/tenants/{id}/activate" as this role should be rejected
    And a direct POST to "/api/tenants/{id}/reject" as this role should be rejected

    Examples:
      | role              |
      | Front Office      |
      | Back Office       |
      | Support User      |
      | Auditor           |
      | LC User           |
      | Bank Admin        |
```
