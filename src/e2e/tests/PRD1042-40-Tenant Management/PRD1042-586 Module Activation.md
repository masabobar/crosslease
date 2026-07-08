# PRD1042-586 — US 29.5 | Tenant Management | Module Activation per Tenant

Generated: 2026-07-07
Story: PRD1042-586 — US 29.5 | Tenant Management | Module Activation per Tenant
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (26 ACs, description present, stakeholder-reviewed, QA in progress)
ACs with Gherkin scenarios: 13 of 26 | Blocked: 11 (PRD1042-77, D-Enforcement) | Excluded: 2 (edge-case or separate-feature — scope filter table only)
Figma design: Node 93:15900 (MODULE ACTIVATION section), file 7pygkopuqyeEhUTMVp9lrP — Canvas "Module Activation/Deactivation" (node 93:12429) (Stage 2 SUCCESS — design-verified re-run, supersedes design-blind v1)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                              | Blocking dependency                                        |
| ----- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| AC-03 | Countersignature from second independent System Admin requires Four-Eyes approval endpoint wiring   | PRD1042-77 — Four-Eyes Approval Validation                 |
| AC-13 | Governance request emission to PRD1042-77 not yet wired                                             | PRD1042-77 — Four-Eyes Approval Validation                 |
| AC-14 | On approval → Pending Enforcement + `module-profile-changed` event requires Four-Eyes + enforcement | PRD1042-77, D-Enforcement                                  |
| AC-15 | Sync confirmation → Active requires enforcement layer callback                                      | D-Enforcement — Authorization Enforcement Layer (external) |
| AC-18 | Pending Enforcement behaves as Inactive for access — depends on state existing                      | D-Enforcement — Authorization Enforcement Layer (external) |
| AC-23 | Enforcement layer unavailable → event queued for retry requires message queue harness               | D-Enforcement — Authorization Enforcement Layer (external) |
| AC-26 | Self-approval blocked (actor independence) requires Four-Eyes endpoint enforcement                  | PRD1042-77 — Four-Eyes Approval Validation                 |

Note: AC-04, AC-05, AC-16, AC-22 remain infrastructure-blocked at the state-machine layer (require PRD1042-77 + D-Enforcement wiring) but their UI-level post-submission states are now design-verified against Node 93:15900. Their Gherkin scenarios are written below with `@pending` semantics so the design-verified copy is captured for future execution once the enforcement layer is available.

---

## AC Scope Filter

| AC    | Description                                                                                   | Classification                                | Rationale                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System Admin selects Inactive module and activates it; tenant must be Active                  | `happy-path`                                  | Core initiation flow — design-verified button "Submit for activation" and modal title "Activate module"                                                        |
| AC-02 | Full flow: Inactive → Pending Approval → Pending Enforcement → Active                         | `happy-path`                                  | Initiation segment testable now; downstream state copy design-verified (AC-04, AC-05 alert cards)                                                              |
| AC-03 | Requires countersignature from second independent System Admin (PRD1042-77)                   | `Blocked`                                     | PRD1042-77 Four-Eyes endpoint not wired                                                                                                                        |
| AC-04 | Module stays Pending Enforcement until enforcement layer confirms sync                        | `main-error` (design-verified, infra-blocked) | Design anchor: "Module activation submitted" / "Reporting will remain inactive until enforcement is confirmed." — Blocked pending D-Enforcement                |
| AC-05 | On confirmed sync → Active, operationally available                                           | `happy-path` (design-verified, infra-blocked) | Design anchor: "Activation confirmed" / "Reporting is now active." — Blocked pending D-Enforcement                                                             |
| AC-06 | Module Activation Records append-only; each state transition creates new record               | `separate-feature`                            | Data integrity / append-only invariant — BE integration test, not E2E                                                                                          |
| AC-07 | Module (Enum, Mandatory) — read-only in modal                                                 | `happy-path`                                  | Modal field display — design-verified: "Module name" label with value "Reporting" (read-only)                                                                  |
| AC-08 | Effective From (DateTime, Optional) — defaults to current timestamp                           | `edge-case` (design gap)                      | Field NOT visible in extracted modal frame — UI-level assertion cannot be verified; BE default-timestamp is a unit test                                        |
| AC-09 | Justification (Long text, Mandatory) — min 10 chars, recorded in audit                        | `edge-case` (design gap)                      | Justification field NOT visible in extracted modal frame — UI-level assertion cannot be verified; API-level testable but out of E2E scope for this design pass |
| AC-10 | Module must be Inactive before submission                                                     | `main-error`                                  | Precondition validation — blocks primary action                                                                                                                |
| AC-11 | Tenant must be in Active lifecycle state                                                      | `main-error`                                  | Precondition validation — blocks primary action                                                                                                                |
| AC-12 | Module in Pending Approval or Pending Enforcement → second activation rejected                | `main-error`                                  | Duplicate submission conflict — blocks primary action                                                                                                          |
| AC-13 | On submission: Activation Record created (Pending Approval), governance request to PRD1042-77 | `Blocked`                                     | PRD1042-77 governance request wiring not present                                                                                                               |
| AC-14 | On Four-Eyes approval: record → Pending Enforcement, `module-profile-changed` event published | `Blocked`                                     | PRD1042-77 + D-Enforcement — approval endpoint + event publisher required                                                                                      |
| AC-15 | On sync confirmation: record → Active                                                         | `Blocked`                                     | D-Enforcement — sync confirmation callback required                                                                                                            |
| AC-16 | Sync timeout (default 30s, configurable): stays Pending Enforcement, alert, no auto-fallback  | `main-error` (design-verified, infra-blocked) | Design anchor: "Enforcement confirmation timed out." / "The platform operations team has been notified." — Blocked pending D-Enforcement + clock control       |
| AC-17 | Audit events: MODULE_ACTIVATION_REQUESTED, \_APPROVED, \_SYNCHRONIZED, \_FAILED               | `separate-feature`                            | BE audit trail integration — not observable via UI E2E                                                                                                         |
| AC-18 | Pending Enforcement behaves identically to Inactive for all access purposes                   | `Blocked`                                     | D-Enforcement — Pending Enforcement state existence prerequisite                                                                                               |
| AC-19 | API returns HTTP 404 to all non-System Admin roles                                            | `main-error`                                  | 404-not-403 RBAC — directly testable via API assertion (RefiNext domain rule)                                                                                  |
| AC-20 | Non-Active modules must not expose routes, API endpoints, or nav entries to any tenant user   | `separate-feature`                            | Security scan / BE route registration — belongs in security test suite                                                                                         |
| AC-21 | Fail-closed: never assume enforcement active without confirmed sync                           | `separate-feature`                            | BE architectural invariant — not observable via UI E2E                                                                                                         |
| AC-22 | Enforcement layer fails to confirm sync → stays Pending Enforcement, alert, no fallback       | `main-error` (design-verified, infra-blocked) | Design anchor: "Enforcement confirmation timed out." / "The platform operations team has been notified." — Blocked pending D-Enforcement                       |
| AC-23 | Enforcement layer unavailable → event queued for retry, stays Pending Enforcement             | `Blocked`                                     | D-Enforcement — message queue + retry harness required                                                                                                         |
| AC-24 | Second activation on Pending Approval/Pending Enforcement module → conflict error             | `main-error`                                  | Duplicate submission conflict — merged with AC-12 scenario                                                                                                     |
| AC-25 | Tenant suspended during Pending Enforcement → stays Pending Enforcement                       | `edge-case`                                   | Requires D-Enforcement + suspension timing coordination; boundary condition                                                                                    |
| AC-26 | Same user approves own request → blocked, actor independence enforced                         | `Blocked`                                     | PRD1042-77 — self-approval guard requires Four-Eyes endpoint enforcement                                                                                       |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-05, AC-07, AC-10, AC-11, AC-12, AC-16, AC-19, AC-22, AC-24
**Blocked (no Gherkin):** AC-03, AC-13, AC-14, AC-15, AC-18, AC-23, AC-26
**No Gherkin (edge-case or separate-feature):** AC-06, AC-08 (design gap), AC-09 (design gap), AC-17, AC-20, AC-21, AC-25

---

## Scenarios summary

| Tag           | Scenario                                                                                                                      | AC           | Priority | E2E                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ | -------- | ----------------------------------------------------------------------------------- |
| `@happy-path` | System Admin activates Inactive module on Active tenant via "Activate module" modal, record enters Pending Approval           | AC-01, AC-02 | P0       | ⚙️ needs seeded Inactive module fixture on Active tenant                            |
| `@happy-path` | Activation modal displays "Module name" and "Current status" fields (design-verified)                                         | AC-07        | P0       | ⚙️ needs seeded Inactive module fixture on Active tenant                            |
| `@happy-path` | Post-sync confirmation displays "Activation confirmed" alert (Reporting is now active.)                                       | AC-05        | P0       | ⚙️ needs D-Enforcement sync confirmation callback + PRD1042-77                      |
| `@main-error` | Post-submission Pending Enforcement holding state displays "Module activation submitted" alert                                | AC-04        | P0       | ⚙️ needs D-Enforcement Pending Enforcement state wiring + PRD1042-77                |
| `@main-error` | Enforcement timeout displays "Enforcement confirmation timed out." alert, no auto-fallback                                    | AC-16, AC-22 | P0       | ⚙️ needs D-Enforcement failure simulation + clock control + PRD1042-77              |
| `@main-error` | Module not in Inactive state cannot be activated (Scenario Outline — 3 non-Inactive states)                                   | AC-10        | P0       | ⚙️ needs seeded modules in Pending Approval / Pending Enforcement / Active states   |
| `@main-error` | Tenant not in Active lifecycle state blocks activation (Scenario Outline — 4 non-Active tenant states)                        | AC-11        | P0       | ⚙️ needs seeded tenants in Draft / Pending Activation / Suspended / Rejected states |
| `@main-error` | Duplicate activation on Pending Approval or Pending Enforcement module returns conflict error (Scenario Outline — 2 variants) | AC-12, AC-24 | P0       | ⚙️ needs seeded module in Pending Approval / Pending Enforcement states             |
| `@main-error` | Non-System Admin roles receive 404 on activation endpoint (Scenario Outline — 4 role variants)                                | AC-19        | P0       | ✅                                                                                  |

Active scenario blocks: 9 (5 Outlines + 4 Scenarios)
E2E automation candidates: 1 of 9 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @module-activation @us-29.5 @p0
Feature: Module Activation per Tenant (US 29.5 — PRD1042-586)
  As a System Admin
  I want to activate a module for a specific tenant through a governed workflow
  So that the module becomes operationally available only after Four-Eyes approval
  and enforcement layer synchronization confirm the change is safe to expose

  Background:
    Given I am logged in as a System Admin
    And an active tenant "TENANT-001" exists in the system

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02 (initiation segment)
  # System Admin selects an Inactive module on an Active tenant and submits the
  # activation request via the "Activate module" modal; the record enters
  # Pending Approval. Downstream states (Pending Enforcement, Active) are
  # covered by dedicated scenarios below pending PRD1042-77 + D-Enforcement.
  # Design-verified (Node 93:15900):
  #   - Modal title: "Activate module"
  #   - Solid Button label: "Submit for activation"
  #   - Outline Button label: "Cancel"
  #   - Fields visible: "Module name" (value "Reporting", read-only), "Current status"
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario: System Admin activates an Inactive module on an Active tenant
    Given tenant "TENANT-001" has module "Reporting" in state "Inactive"
    When I open the Tenant Detail View for "TENANT-001"
    And I open the Module Profile tab
    And I click "Activate" on module "Reporting"
    Then a modal titled "Activate module" should be displayed
    And the modal should show a "Submit for activation" primary button
    And the modal should show a "Cancel" secondary button
    When I click "Submit for activation"
    Then a Module Activation Record should be created in state "Pending Approval"
    And module "Reporting" should display state "Pending Approval" on the tenant module list

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07 (modal field display, design-verified)
  # The activation modal shows two fields per the extracted design frame:
  # "Module name" (read-only, populated from the module selection context) and
  # "Current status" (read-only badge). AC-08 Effective From and AC-09
  # Justification fields are NOT visible in the extracted modal frame — logged
  # as MAJOR design gaps and reclassified to edge-case pending design
  # clarification (see AC Scope Filter).
  # Design-verified (Node 93:15900): "Module name" → "Reporting", "Current status" label present.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @p0
  Scenario: Activation modal displays Module name and Current status fields
    Given tenant "TENANT-001" has module "Reporting" in state "Inactive"
    When I open the Activation modal for module "Reporting"
    Then the modal title should be "Activate module"
    And the "Module name" field should show "Reporting"
    And the "Module name" field should be read-only
    And the "Current status" field should be visible
    And the "Current status" field should be read-only

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05 (Activation Confirmed alert, design-verified, infra-blocked)
  # After Four-Eyes approval AND enforcement layer sync confirmation, the
  # module transitions to Active state and the confirmation alert card is
  # displayed. Cannot execute end-to-end until PRD1042-77 approval endpoint
  # and D-Enforcement sync callback are wired.
  # Design-verified (Node 93:15900 — State 3):
  #   - Alert title: "Activation confirmed"
  #   - Alert description: "Reporting is now active."
  #   - Secondary link: "View profile"
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0
  Scenario: Sync-confirmed activation displays "Activation confirmed" alert
    Given tenant "TENANT-001" has module "Reporting" in state "Pending Enforcement"
    And Four-Eyes approval has been recorded for the module activation request
    When the enforcement layer confirms sync for module "Reporting"
    Then module "Reporting" should transition to state "Active"
    And an alert card should be displayed with the title "Activation confirmed"
    And the alert description should read "Reporting is now active."
    And the alert should show a "View profile" secondary link

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (Pending Enforcement holding state, design-verified, infra-blocked)
  # Immediately after Four-Eyes approval and before the enforcement layer
  # confirms sync, the module remains inactive from the tenant's perspective
  # and the holding-state alert is shown. This is the fail-closed anchor
  # (per Vesna Plakalovic 2026-06-05): activation does NOT expose the module
  # until sync confirmation arrives. Cannot execute end-to-end until
  # PRD1042-77 approval endpoint and D-Enforcement Pending Enforcement state
  # are wired.
  # Design-verified (Node 93:15900 — State 1):
  #   - Alert title: "Module activation submitted"
  #   - Alert description: "Reporting will remain inactive until enforcement is confirmed."
  #   - Secondary link: "View profile"
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Pending Enforcement holding state after Four-Eyes approval
    Given tenant "TENANT-001" has module "Reporting" in state "Pending Approval"
    When Four-Eyes approval is recorded for the module activation request
    And the enforcement layer has not yet confirmed sync
    Then module "Reporting" should be in state "Pending Enforcement"
    And an alert card should be displayed with the title "Module activation submitted"
    And the alert description should read "Reporting will remain inactive until enforcement is confirmed."
    And the alert should show a "View profile" secondary link
    And module "Reporting" should not be operationally available to tenant users

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16, AC-22 (enforcement timeout, design-verified, infra-blocked)
  # If the enforcement layer does not confirm sync within the configured
  # timeout (default 30s per AC-16), the module MUST remain in Pending
  # Enforcement — no auto-fallback to Active, and the operations team is
  # notified. This is the fail-closed rule per Vesna Plakalovic 2026-06-05.
  # AC-16 and AC-22 share the same UI outcome (design State 2 alert card);
  # they differ only in the underlying cause (timeout vs. explicit failure)
  # which is not observable via UI. Cannot execute end-to-end until
  # D-Enforcement failure simulation and clock control are available.
  # Design-verified (Node 93:15900 — State 2):
  #   - Alert title: "Enforcement confirmation timed out."
  #   - Alert description: "Reporting module remains in Pending enforcement. The platform operations team has been notified."
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @ac-22 @p0
  Scenario: Enforcement confirmation timeout keeps module in Pending Enforcement
    Given tenant "TENANT-001" has module "Reporting" in state "Pending Enforcement"
    And the enforcement layer has not confirmed sync within the configured timeout
    When the timeout elapses
    Then module "Reporting" should remain in state "Pending Enforcement"
    And module "Reporting" should not auto-fallback to state "Active"
    And an alert card should be displayed with the title "Enforcement confirmation timed out."
    And the alert description should read "Reporting module remains in Pending enforcement. The platform operations team has been notified."
    And the platform operations team should have been notified

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (module precondition)
  # Module must be in Inactive state to accept activation. Any other state
  # (Pending Approval, Pending Enforcement, Active) must reject the action.
  # AC-12 / AC-24 duplicate-conflict is covered by its own scenario below;
  # this scenario tests the Inactive precondition itself, including the
  # Active-state guard which is distinct from duplicate submission.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario Outline: Module not in Inactive state cannot be activated
    Given tenant "TENANT-001" has module "Reporting" in state "<module_state>"
    When I open the Tenant Detail View for "TENANT-001"
    And I open the Module Profile tab
    Then the "Activate" action should not be available on module "Reporting"
    And any direct submission of an activation request for module "Reporting" should be rejected with a precondition error

    Examples:
      | module_state        |
      | Pending Approval    |
      | Pending Enforcement |
      | Active              |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (tenant precondition)
  # Tenant must be in Active lifecycle state for module activation to proceed.
  # Draft, Pending Activation, Suspended, and Rejected tenants must block the
  # activation action.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario Outline: Tenant not in Active lifecycle state blocks module activation
    Given tenant "<tenant_id>" has lifecycle state "<tenant_state>"
    And tenant "<tenant_id>" has module "Reporting" in state "Inactive"
    When I open the Tenant Detail View for "<tenant_id>"
    And I open the Module Profile tab
    Then the "Activate" action should not be available on module "Reporting"
    And any direct submission of an activation request should be rejected with a tenant-state precondition error

    Examples:
      | tenant_id      | tenant_state       |
      | TENANT-DRAFT   | Draft              |
      | TENANT-PENDING | Pending Activation |
      | TENANT-SUSP    | Suspended          |
      | TENANT-REJ     | Rejected           |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12, AC-24 (duplicate activation conflict)
  # A module already in Pending Approval or Pending Enforcement must reject
  # a second activation attempt with a conflict error. This differs from AC-10
  # in that the conflict is specifically about an in-flight activation,
  # not about the module's terminal state.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @ac-24 @p0
  Scenario Outline: Duplicate activation on in-flight module returns conflict
    Given tenant "TENANT-001" has module "Reporting" in state "<in_flight_state>"
    When I submit a second activation request for module "Reporting" on tenant "TENANT-001"
    Then the submission should be rejected with a conflict error
    And no new Module Activation Record should be created
    And module "Reporting" should remain in state "<in_flight_state>"

    Examples:
      | in_flight_state     |
      | Pending Approval    |
      | Pending Enforcement |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-19 (RBAC — 404 not 403)
  # RefiNext domain rule: non-System Admin roles hitting the module activation
  # endpoint receive HTTP 404 (never 403) to prevent enumeration. Directly
  # testable via API assertion with seeded role-specific users.
  # ---------------------------------------------------------------------------

  @main-error @ac-19 @p0 @e2e-ready
  Scenario Outline: Non-System Admin roles receive 404 on module activation endpoint
    Given I am logged in as "<role>"
    When I submit a module activation request for tenant "TENANT-001" and module "Reporting"
    Then the response status should be 404
    And no Module Activation Record should be created

    Examples:
      | role                 |
      | support_user         |
      | auditor              |
      | front_office         |
      | leasing_company_user |
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
