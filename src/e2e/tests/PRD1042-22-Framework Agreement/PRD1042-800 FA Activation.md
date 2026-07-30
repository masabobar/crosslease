# PRD1042-800 — US 11.2 | Framework Agreement | Framework Agreement Activation (Draft → Active)

Generated: 2026-07-23
Story: PRD1042-800 — US 11.2 | Framework Agreement | Framework Agreement Activation (Draft → Active)
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (14 ACs, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 7 of 14 | Blocked: 0 | Excluded: 7 (edge-case or separate-feature — scope filter table only)
Figma design: Node 28:4119 (ACTIVATE agreement) — sub-frames 27:5706 (activation dialog) + 28:3688 (post-activation success), file aQGn5OLEjEGJO7xGzFikP5. Dialog verbatim: "Activate framework agreement" / "Effective from (optional)" / "Defaults to now. Set a future date if the agreement becomes effective later" / "Activation justification" (min 20 characters) / "I confirm that all signed framework documents have been attached." Success alert: "Framework agreement activated." + "{FA_ID} is now active." Stage 2 COMPLETE via REST /nodes fallback.
Updated per CR PRD1042-1495 (2026-07-23): Optional "Valid Until" field confirmed in activation modal (B6/1495) — DESIGN GAP: not yet visible in current Figma dialog 27:5706, FE needs to add. Reactivation hidden from UI, sidebar shows only Edit/Suspend/Terminate post-activation per B5/1495 (confirmed in success frame 28:3688).
Updated per CR PRD1042-22 Reconciliation v10 (2026-07-27): Single-admin activation reinforced (B7/v10) — `framework_agreements/CLAUDE.md` corrected to single-admin activation, not two-admin four-eyes; the machinery-retained-in-model / disabled-in-UI pattern is preserved for post-November four-eyes re-enablement. State model corrected to 4 stored values (Draft, Active, Suspended, Terminated) per v10 §4 — Expired is DERIVED from `valid_until`, not stored. AC-08 5-role Outline marked [CR-PENDING B5] pending Philipp Maute's decision on 4 contested permission-matrix cells (FO authoring, SA least-privilege, BO activation-review, FO pricing view).

---

## AC Scope Filter

| AC    | Description                                                                                             | Classification | Rationale                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | Power User opens Draft FA, clicks Activate; activation modal displayed                                  | `happy-path`   | Core flow initiation; gate for activation                                                                                            |
| AC-02 | Single Power User activates without countersignature [November]; FA transitions immediately to Active   | `happy-path`   | Primary success flow; Four-Eyes deferred to post-November                                                                            |
| AC-03 | Activation-time validations re-run (LC Active, Templates Published, Max Volume, pricing, validity, doc) | `edge-case`    | Implementation-level validation; re-run logic tested via individual error scenarios (AC-11–AC-13); no standalone E2E scenario needed |
| AC-04 | Published to downstream consumers on success (Financing, Limit Management, Gating Engine)               | `edge-case`    | Backend integration / event emission; no UI surface to assert downstream consumption at E2E layer                                    |
| AC-05 | Activation irreversible; reverting to Draft not permitted                                               | `edge-case`    | State machine invariant; post-activation state tested implicitly by AC-14 (409 on re-activation)                                     |
| AC-06 | Effective From optional (defaults now, may be future ≥ Valid From); Valid Until optional (CR B6)        | `happy-path`   | Part of activation modal; B6 confirms Valid Until is present in the modal alongside Effective From                                   |
| AC-07 | Activation Justification: min 20 chars; whitespace-only rejected                                        | `main-error`   | Directly blocks activation; form validation error returned to user                                                                   |
| AC-08 | POST /activate requires Power User only; all other roles → HTTP 404                                     | `main-error`   | RBAC enforcement; 404-not-403 tenant isolation pattern                                                                               |
| AC-09 | MFA-validated session required for activating Power User                                                | `edge-case`    | Auth policy enforced at session layer (US 28.1); separate auth story                                                                 |
| AC-10 | Cross-tenant activation blocked at API layer; audit-logged as security event                            | `edge-case`    | Requires second seeded tenant (D20); cross-epic security concern                                                                     |
| AC-11 | LC suspended between Draft and activation → blocked with explicit error                                 | `edge-case`    | Complex pre-condition (LC state changes post-creation); low-frequency operational path                                               |
| AC-12 | Product Template deprecated between Draft and activation → blocked; lists affected templates            | `edge-case`    | Complex pre-condition (template state changes post-creation); low-frequency operational path                                         |
| AC-13 | No Framework Document attached at activation → blocked                                                  | `main-error`   | Most common activation validation failure; directly blocks the user                                                                  |
| AC-14 | Activation on already-Active or Suspended FA → HTTP 409 conflict                                        | `main-error`   | Prevents double-activation; lifecycle integrity; common operator mistake                                                             |

**Gherkin generated for:** AC-01, AC-02, AC-06, AC-07, AC-08, AC-13, AC-14
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04, AC-05, AC-09, AC-10, AC-11, AC-12

---

## Scenarios summary

| Tag           | Scenario                                                                         | AC                  | Priority | E2E |
| ------------- | -------------------------------------------------------------------------------- | ------------------- | -------- | --- |
| `@happy-path` | Power User activates Draft FA with valid justification and Effective From        | AC-01, AC-02, AC-06 | P0       | ✅  |
| `@main-error` | Activation without any attached document is blocked                              | AC-13               | P0       | ✅  |
| `@main-error` | Justification below 20 characters blocks activation                              | AC-07               | P0       | ✅  |
| `@main-error` | Activation on already-Active FA returns HTTP 409                                 | AC-14               | P0       | ✅  |
| `@main-error` | Unauthorized roles cannot activate FA — HTTP 404 (Scenario Outline — 5 variants) | AC-08               | P0       | ✅  |

Active scenario blocks: 5 (4 Scenarios + 1 Outline)
E2E automation candidates: 5 of 5 scenarios ✅

---

## Feature file

```gherkin
@framework-agreement @us-11.2 @p0
Feature: Framework Agreement Activation — Draft to Active (US 11.2 — PRD1042-800)
  As a Power User (Bank Admin)
  I want to activate a Draft Framework Agreement
  So that it becomes the authoritative credit envelope under which new Financings
  between the bank and the Leasing Company may be created

  Background:
    Given the Framework Agreement module is active for the tenant
    And I am authenticated as a Power User (Bank Admin) with an MFA-validated session

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-06
  # Power User opens a Draft FA that has at least one signed PDF attached,
  # fills in the activation modal (Justification ≥ 20 chars; Effective From
  # defaults to now; Valid Until is optional per CR B6), and confirms.
  # For November: single Power User activates without countersignature.
  # FA transitions immediately to Active state.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-06 @p0 @e2e-ready
  Scenario: Power User activates Draft FA with valid justification and Effective From (AC-01, AC-02, AC-06)
    Given a Framework Agreement "RV-SSKM-2026-001" exists in Draft state
    And at least one PDF document is attached to "RV-SSKM-2026-001"
    When I navigate to the detail view of "RV-SSKM-2026-001"
    And I click "Activate"
    Then the dialog titled "Activate framework agreement" is displayed
    And the dialog shows "Current status: Draft" for the agreement
    And the "Effective from (optional)" field defaults to the current date and time
    And a "Valid Until" field is present as optional alongside Effective From
    When I enter "Activating after legal review and document verification complete" in the "Activation justification" field
    And I check the confirmation "I confirm that all signed framework documents have been attached."
    And I confirm the activation by clicking on "Activate" button in the dialog
    Then the Framework Agreement "RV-SSKM-2026-001" transitions to Active state
    And a success alert "Framework agreement activated." is displayed
    And the alert body contains "RV-SSKM-2026-001 is now active."
    And the "Activate" button is no longer visible in the detail sidebar
    And the sidebar shows the actions "Edit", "Suspend", "Terminate"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # At least one signed framework document must be attached before activation.
  # Missing documents block activation with an explicit error. This is the most
  # common activation validation failure encountered by operators.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0 @e2e-ready
  Scenario: Activation without any attached document is blocked (AC-13)
    Given a Framework Agreement "RV-NO-DOCS-001" exists in Draft state
    And no documents are attached to "RV-NO-DOCS-001"
    When I click "Activate" on "RV-NO-DOCS-001"
    And I fill in a valid Justification and check the confirmation checkbox
    And I click "Confirm Activation"
    Then I see an error "At least one signed framework document must be attached before activation"
    And the Framework Agreement remains in Draft state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Activation Justification must be at least 20 characters. Whitespace-only
  # text is also rejected. This ensures meaningful audit evidence is captured.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready
  Scenario Outline: Short or blank justification blocks activation (AC-07)
    Given a Framework Agreement "RV-SSKM-2026-001" exists in Draft state with a document attached
    When I click "Activate" on "RV-SSKM-2026-001"
    And I enter "<justification>" in the Justification field
    And I click "Activate" buttonm in the dialog
    Then I see a validation error on the Justification field
    And the Framework Agreement remains in Draft state

    Examples:
      | justification        |
      | Too short            |
      |                      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # An already-Active or Archived FA cannot be re-activated. The API returns
  # HTTP 409 referencing the current lifecycle state. This prevents accidental
  # double-activation by concurrent administrators.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0 @e2e-ready
  Scenario: Activation attempt on an already-Active FA returns HTTP 409 (AC-14)
    Given a Framework Agreement "RV-ALREADY-ACTIVE-001" is in Active state
    When I POST to "/api/framework-agreements/RV-ALREADY-ACTIVE-001/activate" with a valid payload
    Then the response status should be 409
    And the response body references the current lifecycle state "Active"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # POST /api/framework-agreements/{id}/activate is restricted to Power User
  # (Bank Admin). All other roles receive HTTP 404 per the 404-not-403 tenant
  # isolation pattern. Backend authorization is mandatory.
  #
  # [CR-PENDING B5] — CR PRD1042-22 v10 §5 flags 4 contested cells in the
  # permission matrix; specifically for activation: v9 gives Back Office
  # review authority on activation while code = Bank Admin only. Current
  # 5-role Outline is retained as-is pending Philipp Maute's confirmation.
  # Do NOT pre-emptively add BO-review-on-activation scenarios.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0 @e2e-ready @cr-pending-b5
  Scenario Outline: Unauthorized roles cannot activate a Framework Agreement — HTTP 404 (AC-08)
    Given a Framework Agreement "RV-SSKM-2026-001" exists in Draft state
    And I am authenticated as a <role> user
    When I POST to "/api/framework-agreements/RV-SSKM-2026-001/activate" with a valid payload
    Then the response status should be 404

    Examples:
      | role         |
      | Front Office |
      | Back Office  |
      | LC User      |
      | Support      |
      | Auditor      |
```
