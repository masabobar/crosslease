# PRD1042-589 — US 29.8 | Tenant Management | Tenant Reactivation Flow

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin cannot reactivate tenants (platform-only).

Generated: 2026-07-07
Story: PRD1042-589 — US 29.8 | Tenant Management | Tenant Reactivation Flow
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (12 ACs synthesized from Functional Requirements + Field Spec + Validation Rules + Security + Architectural Notes, description present, stakeholder-reviewed, Jira status "UAT ready")
ACs with Gherkin scenarios: 7 of 12 | Blocked: 2 (TM-05, D-Enforcement) | Excluded: 3 (edge-case — scope filter table only)
Figma design: Node 84:5369 (REACTIVATE section), file 7pygkopuqyeEhUTMVp9lrP, canvas 78:7403 — Screen "Tenant Suspend, Reactivate, Archive" (Stage 2 SUCCESS — design-verified re-run, supersedes design-blind v1)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                      | Blocking dependency                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| AC-04 | Module enforcement re-confirmation is an async backend orchestration; E2E cannot deterministically observe re-confirmation of each previously Active module | TM-05 — module enforcement synchronization service           |
| AC-05 | Fail-closed revert to Pending Enforcement requires injecting a module enforcement failure at reactivation time — no fixture exists to force this state      | D-Enforcement — module enforcement failure injection fixture |

---

## AC Scope Filter

| AC    | Description                                                                 | Classification | Rationale                                                                                                                                            |
| ----- | --------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System Admin initiates reactivation on Suspended tenant only                | `happy-path`   | Core success flow: Reactivate action available on Suspended tenant, opens "Reactivate tenant" modal (design-verified)                                |
| AC-02 | Two-Actor Approval via PRD1042-77 with governance justification             | `happy-path`   | Countersignature completes the reactivation flow — design copy "A second admin must approve before it takes effect" confirms Four-Eyes               |
| AC-03 | On countersign: tenant → Active, New Business Allowed Flag = true           | `happy-path`   | Terminal assertion of happy-path Outline (status = Active, NBA = true)                                                                               |
| AC-04 | Module re-confirmation for all previously Active modules                    | `Blocked`      | Async backend orchestration via TM-05; E2E cannot deterministically observe each module re-confirmation                                              |
| AC-05 | Modules failing re-confirmation revert to Pending Enforcement (fail-closed) | `Blocked`      | Requires module enforcement failure injection fixture (D-Enforcement) to force failure at reactivation time                                          |
| AC-06 | Governance Justification: mandatory long text, min 20 chars                 | `main-error`   | Blocks initiation when validation fails — Submit disabled or error shown. Note: Justification field NOT visible in extracted modal frame (MAJOR gap) |
| AC-07 | Tenant must be Suspended; Active/Archived rejected (422)                    | `main-error`   | Invalid transition — API returns 422; Current status badge in modal confirms precondition is UI-observable                                           |
| AC-08 | Actor independence enforced server-side (Four-Eyes)                         | `main-error`   | Same user cannot countersign own initiation — reinforced by design copy "A second admin must approve"                                                |
| AC-09 | module.profile.changed events republished per active module                 | `edge-case`    | Backend event mechanics — not E2E observable at UI                                                                                                   |
| AC-10 | Audit event TENANT_REACTIVATED emitted with full payload                    | `edge-case`    | Audit backend detail — not E2E observable at UI unless audit trail UI is in scope (separate feature)                                                 |
| AC-11 | Reactivate action available to System Admin only                            | `main-error`   | 404-not-403 for other roles per RefiNext domain rule; auto-applied negative                                                                          |
| AC-12 | API endpoint: POST /api/tenants/{id}/reactivate                             | `edge-case`    | Endpoint contract detail — exercised implicitly by happy-path scenarios                                                                              |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-06, AC-07, AC-08, AC-11
**Blocked (no Gherkin):** AC-04, AC-05
**No Gherkin (edge-case or separate-feature):** AC-09, AC-10, AC-12

---

## Scenarios summary

| Tag           | Scenario                                                                           | AC                  | Priority | E2E                                                           |
| ------------- | ---------------------------------------------------------------------------------- | ------------------- | -------- | ------------------------------------------------------------- |
| `@happy-path` | System Admin reactivates Suspended tenant with valid justification and countersign | AC-01, AC-02, AC-03 | P0       | ⚙️ needs bug fix PRD1042-1104 + Two-Actor countersign fixture |
| `@main-error` | Governance justification below 20 chars is rejected                                | AC-06               | P0       | ✅                                                            |
| `@main-error` | Governance justification empty is rejected                                         | AC-06               | P0       | ✅                                                            |
| `@main-error` | Reactivate action not available on non-Suspended tenants (Active, Archived)        | AC-07               | P0       | ✅                                                            |
| `@main-error` | Same actor cannot initiate and countersign reactivation (Four-Eyes)                | AC-08               | P0       | ⚙️ needs bug fix PRD1042-1104                                 |
| `@main-error` | Non-System-Admin roles receive 404 on reactivation endpoint (role gating)          | AC-11               | P0       | ✅                                                            |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 4 of 6 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.8 @p0
Feature: Tenant Reactivation Flow (US 29.8 — PRD1042-589)
  As a System Admin
  I want to reactivate a Suspended tenant with Two-Actor governance approval
  So that the tenant can resume full operational capability

  Background:
    Given I am authenticated as a System Admin
    And the Tenant Management module is accessible at "/tenants"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-03
  # Verifies the primary reactivation flow: initiate on a Suspended tenant,
  # provide governance justification (>=20 chars), submit for approval, and
  # complete Two-Actor countersignature via PRD1042-77. On countersign:
  # tenant → Active and New Business Allowed flag flips to true.
  #
  # Design-verified copy (Figma node 84:5369 — REACTIVATE section):
  #   - Modal title: "Reactivate tenant"
  #   - Field label: "Tenant" (read-only, value populated from context)
  #   - Field label: "Current status" (shows current lifecycle badge)
  #   - Cancel button: "Cancel" (outline)
  #   - Submit button: "Submit for reactivation" (solid)
  #   - Post-submission title: "Reactivation submitted for approval"
  #   - Post-submission body: "<Tenant name>'s reactivation has been
  #     submitted. A second admin must approve before it takes effect."
  #   - Secondary link: "View profile"
  #
  # Actor model — CORRECTED from v1: this is STANDARD Four-Eyes (two different
  # System Admins) per design copy "A second admin must approve", NOT one
  # admin doing both. Matches PRD1042-77 pattern and Vesna 2026-06-05
  # activation pattern. Initiator and countersignatory must both hold the
  # System Admin role but must be different users (AC-08).
  #
  # ⚙️ Blocked by open bug PRD1042-1104 — Reactivate action does not work
  # from Tenant Management list page. Verify happy-path from detail view
  # once bug is resolved.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-03 @p0
  Scenario: System Admin reactivates Suspended tenant with valid justification and countersign (AC-01, AC-02, AC-03)
    Given a tenant "New Group Trade" exists in "Suspended" state
    And modules "Refinancing" and "Reporting" were "Active" at time of suspension
    When I open the tenant detail view for "New Group Trade"
    And I click "Reactivate"
    Then the "Reactivate tenant" modal should be displayed
    And the "Tenant" field should show "New Group Trade" as read-only
    And the "Current status" field should show the "Suspended" lifecycle badge
    And the Governance Justification field should be marked mandatory
    And the modal should show a "Cancel" outline button
    And the modal should show a "Submit for reactivation" solid button
    When I enter "Compliance review complete; tenant may resume operations." in the Governance Justification field
    And I click "Submit for reactivation"
    Then the "Reactivation submitted for approval" confirmation should be displayed
    And the confirmation body should contain "A second admin must approve before it takes effect"
    And a "View profile" link should be available
    And the reactivation request should be created with status "Pending Countersignature"
    When a different System Admin countersigns the reactivation request
    Then the tenant "New Group Trade" status should transition to "Active"
    And the "New Business Allowed" flag for "New Group Trade" should be true
    And an audit event "TENANT_REACTIVATED" should be recorded

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (Governance justification validation)
  # Governance Justification is mandatory and must be at least 20 characters.
  # Submissions below this threshold must be rejected before reaching the
  # countersignature stage. Consistent with PRD1042-587 (Module Deactivation)
  # 20-char justification minimum.
  #
  # DESIGN GAP (MAJOR): The Governance Justification field is NOT visible in
  # the extracted REACTIVATE modal frame (node 84:5369). Only "Tenant" and
  # "Current status" labels were captured. Design team must confirm whether:
  #   (a) Justification is on a subsequent step (not extracted), OR
  #   (b) Justification is missing from the current design (design defect).
  # These scenarios are written assuming the Justification field exists per
  # AC-06 and Field Spec. Update once design is verified.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: Governance justification below 20 characters is rejected (AC-06)
    Given a tenant "New Group Trade" exists in "Suspended" state
    When I open the tenant detail view for "New Group Trade"
    And I click "Reactivate"
    And the "Reactivate tenant" modal is displayed
    And I enter "Too short" in the Governance Justification field
    And I click "Submit for reactivation"
    Then a validation error should be displayed for the Governance Justification field
    And the reactivation request should NOT be submitted
    And the tenant "New Group Trade" status should remain "Suspended"

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: Empty governance justification is rejected (AC-06)
    Given a tenant "New Group Trade" exists in "Suspended" state
    When I open the tenant detail view for "New Group Trade"
    And I click "Reactivate"
    And the "Reactivate tenant" modal is displayed
    And I leave the Governance Justification field empty
    And I click "Submit for reactivation"
    Then a mandatory-field validation error should be displayed for the Governance Justification field
    And the reactivation request should NOT be submitted
    And the tenant "New Group Trade" status should remain "Suspended"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (Invalid state transition)
  # Reactivation is only valid from Suspended. Attempting to reactivate an
  # Active or Archived tenant must be rejected. UI enforcement: Reactivate
  # action should not be visible/enabled on non-Suspended tenants; API
  # enforcement: POST /api/tenants/{id}/reactivate returns 422.
  #
  # Design-verified: the "Current status" field in the "Reactivate tenant"
  # modal shows the tenant's current lifecycle badge — this makes the
  # precondition observable in the UI. If the tenant is not Suspended,
  # the Reactivate action should not be exposed in the first place.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready
  Scenario Outline: Reactivate action not available on non-Suspended tenants (AC-07)
    Given a tenant "<tenant>" exists in "<state>" state
    When I open the tenant detail view for "<tenant>"
    Then the "Reactivate" action should NOT be available

    Examples:
      | tenant               | state    |
      | Beta Bank Tenant     | Active   |
      | Gamma Bank Tenant    | Archived |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08 (Four-Eyes actor independence)
  # PRD1042-77 enforces server-side that the countersignatory must be a
  # different System Admin from the initiator. Same-user countersign
  # must be blocked with a clear error.
  #
  # Design reinforcement: post-submission copy states "A second admin must
  # approve before it takes effect." — this makes the two-actor requirement
  # visible to the initiator immediately after submission.
  #
  # ⚙️ Blocked by open bug PRD1042-1104 (Reactivate action does not work from
  # Tenant Management list page) — verify list-page + detail-page paths once
  # bug is resolved.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Same actor cannot initiate and countersign the same reactivation (AC-08)
    Given a tenant "New Group Trade" exists in "Suspended" state
    And I have initiated a reactivation request for "New Group Trade" with a valid governance justification
    And the "Reactivation submitted for approval" confirmation was displayed
    When I attempt to countersign the same reactivation request as the same System Admin user
    Then the countersign action should be rejected
    And an actor-independence error should be displayed
    And the tenant "New Group Trade" status should remain "Suspended"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (Role gating — 404-not-403)
  # Reactivate action is System Admin only per Permission Matrix. All other
  # roles must be blocked. Per RefiNext domain rule, unauthorized access to
  # the endpoint returns 404 (not 403) to prevent tenant enumeration.
  #
  # Bank Admin (bank_admin, bank_tenant user_type) is explicitly unauthorized:
  # tenant reactivation is a PLATFORM-level operation (System Admin only) and
  # Bank Admin's scope is limited to bank tenant user management. Confirmed by
  # PRD1042-48 (Ivan Mladenovic decision 2026-07-06).
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles receive 404 on reactivation endpoint (AC-11)
    Given a tenant "New Group Trade" exists in "Suspended" state
    And I am authenticated as a <role>
    When I POST to "/api/tenants/{new-group-trade-id}/reactivate" with a valid governance justification
    Then the response status should be 404
    And the tenant "New Group Trade" status should remain "Suspended"

    Examples:
      | role                  |
      | Bank Admin            |
      | Front Office          |
      | Back Office           |
      | Support User          |
      | Auditor               |
      | Leasing Company User  |
```
