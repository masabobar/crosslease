# PRD1042-805 — US 11.6 | Framework Agreement | Framework Agreement Reactivation

Generated: 2026-07-24
Story: PRD1042-805 — US 11.6 | Framework Agreement | Framework Agreement Reactivation
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (17 derived ACs, description present with permission matrix + modal field spec + validation rules + edge cases, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 10 of 17 | Blocked: 3 (D-CR-B5-Rollback, D-MFA-StepUp, D-EventBus-Inspection) | Excluded: 4 (edge-case, separate-feature, or bundled — scope filter table only)
Figma design: Node 29:3780 (Suspension, Reactivation, Termination) on file aQGn5OLEjEGJO7xGzFikP5 — REST + MCP quota-exhausted on 2026-07-24, no pre-exported fixture PNG discoverable for the REACTIVATE section. Extraction proceeded design-blind, spec-anchored per the user directive. Verbatim modal copy (labels, error strings) is NOT anchored; scenarios assert behavioural outcomes (state transition, HTTP status, event emission, error-message keyword presence) rather than exact copy.

---

## Design references

| File                                        | Content                                                                                                                                                                                                                                                             | Applies to                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| _(no fixture available — design-blind run)_ | REACTIVATE modal on canvas 29:3780 (Suspension, Reactivation, Termination page). Sibling frame naming pattern from prior E11 batch: `frame-<node-id>__REACTIVATE.png`. When exported, place under `src/e2e/fixtures/figma-e11/rendered-nodes/` and update this row. | All AC-01, AC-02, AC-03, AC-15, AC-16, AC-17 modal-copy assertions |

Once the frame is exported, upgrade behavioural assertions in AC-02 / AC-03 / AC-15 / AC-16 / AC-17 scenarios to verbatim-copy asserts. Until then, tests assert error-message keyword presence (`LC`, `Valid Until`, `template`) rather than exact strings. AC-04 single-Power-User pattern already differs from US 29.8 Tenant Reactivation Four-Eyes — do NOT reuse Two-Actor copy from that sibling story.

**CR PRD1042-1495 B5 note (2026-07-20, Philipp Maute + Laurence Ahrabian, FE-merged Nevena 2026-07-23):** Reactivation entry-point (sidebar button on FA Detail page) is currently HIDDEN in the UI, code retained. Interpretation applied here: POST `/api/framework-agreements/{id}/reactivate` remains active and role-gated; UI happy-path via clicking Reactivate is not currently reachable in-build. UI-click scenarios are marked ⚙️ needs `D-CR-B5-Rollback`; API-level scenarios remain @e2e-ready.

**CR PRD1042-22 Reconciliation v10 note (2026-07-27):** §4.3 confirms Suspended → Active transition is "retained in model; hidden from MVP UI (Suspended is a UI dead-end in November)". §6 US 11.6/11.17 confirms "No reactivation control and no four-eyes step in the MVP UI; both retained in the model; absence is not a defect." No behaviour changes required in this suite — `D-CR-B5-Rollback` remains the tracked dependency for future UI re-enablement. State model 4 stored values reinforced (Draft/Active/Suspended/Terminated). **[CR-PENDING B5]** on AC-11 5-role Outline pending Philipp Maute's decision on 4 contested permission-matrix cells.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                              | Blocking dependency                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| AC-10 | Notification Center emit to Power User (Bank Admin) + Back Office / Risk — requires event-bus inspection to verify subscribers received event; no test hook                                         | D-EventBus-Inspection — event-bus emission inspection harness  |
| AC-12 | MFA freshness window enforcement — requires ability to expire MFA freshness on demand without full re-authentication                                                                                | D-MFA-StepUp — MFA freshness override endpoint                 |
| AC-UI | Full UI click-path (open FA Detail → click Reactivate button → fill modal → confirm) currently unreachable because CR B5 hid the entry point. Verify when CR B5 is rolled back or a flag is flipped | D-CR-B5-Rollback — Reactivate UI entry-point visibility toggle |

---

## AC Scope Filter

| AC    | Description                                                                                                                              | Classification | Rationale                                                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Power User (Bank Admin) opens Suspended FA and clicks Reactivate → modal opens                                                           | `Blocked`      | Requires UI entry point which is hidden by CR B5 — see AC-UI row. Covered by AC-04 API-level happy path.                                                                                 |
| AC-02 | Modal requires Justification (long text, min 20 chars, mandatory)                                                                        | `happy-path`   | Verified via POST body — client-side modal field is the origin, but server-side rule (min 20 chars) is what tests assert. Bundled into AC-04 happy path + AC-04-neg short-justification. |
| AC-03 | Modal requires Re-Validation Confirmation checkbox                                                                                       | `happy-path`   | POST body includes `reValidationConfirmed: true`. Server rejects `false` → covered in AC-03-neg.                                                                                         |
| AC-04 | Single Power User (Bank Admin) reactivation; agreement transitions Suspended → Active on confirmation                                    | `happy-path`   | Core success flow — POST /reactivate on Suspended FA → 200 + status flip to Active                                                                                                       |
| AC-05 | Reactivation-time validation: LC must still be Active in Partner Management                                                              | `main-error`   | Blocking validation — LC-suspended-during-FA-suspension case (redundant with AC-15; consolidated there)                                                                                  |
| AC-06 | Reactivation-time validation: Valid Until must be ≥ now (UTC) or null                                                                    | `main-error`   | Blocking validation — Valid Until expired case (redundant with AC-16; consolidated there)                                                                                                |
| AC-07 | Reactivation-time validation: all referenced Product Templates must be in Published state                                                | `main-error`   | Blocking validation — deprecated-template case (redundant with AC-17; consolidated there)                                                                                                |
| AC-08 | On success: FA transitions Suspended → Active; audit event `fa.reactivated` emitted with faId, tenantId, actor, justification, timestamp | `happy-path`   | Bundled into AC-04 happy path — assertions on state + audit event                                                                                                                        |
| AC-09 | Validation & Gating Engine notified — resumes accepting new Financings against the FA                                                    | `happy-path`   | Bundled into AC-04 happy path — post-reactivate, a new Financing assembly POST against this FA succeeds (previously blocked)                                                             |
| AC-10 | Notification Center emits to Power User (Bank Admin) + Back Office / Risk                                                                | `Blocked`      | D-EventBus-Inspection — no test hook to inspect subscribers                                                                                                                              |
| AC-11 | Only Power User (Bank Admin) can reactivate — 5 other roles → 404                                                                        | `main-error`   | Role-based access domain rule — 404-not-403 pattern, Outline across FO / BO-Risk / LC / Support / Auditor                                                                                |
| AC-12 | MFA-validated session required for POST reactivate                                                                                       | `Blocked`      | D-MFA-StepUp — no way to expire MFA freshness on demand                                                                                                                                  |
| AC-13 | FA must be in Suspended state — Draft / Active / Terminated → 409 with explicit error                                                    | `main-error`   | Lifecycle-state guard — Outline across 3 non-Suspended states                                                                                                                            |
| AC-14 | Cross-tenant reactivate returns 404 (tenant isolation)                                                                                   | `main-error`   | Tenant isolation domain rule — 404-not-403                                                                                                                                               |
| AC-15 | LC Suspended in Partner Management → blocked with explicit error referencing LC status                                                   | `main-error`   | Explicit edge-case from spec — merges AC-05 into a full error scenario                                                                                                                   |
| AC-16 | Valid Until has passed during Suspension → blocked; admin must edit Valid Until (US 11.10) or terminate                                  | `main-error`   | Explicit edge-case from spec — merges AC-06 into a full error scenario                                                                                                                   |
| AC-17 | Deprecated Product Template during Suspension → blocked; admin must remove/replace via US 11.10                                          | `main-error`   | Explicit edge-case from spec — merges AC-07 into a full error scenario                                                                                                                   |
| AC-UI | UI entry-point (Reactivate button on FA Detail sidebar) currently hidden by CR B5                                                        | `Blocked`      | D-CR-B5-Rollback — cannot exercise UI click-path until the CR-B5 gate is toggled                                                                                                         |

**Gherkin generated for:** AC-02, AC-03, AC-04, AC-08, AC-09, AC-11, AC-13, AC-14, AC-15, AC-16, AC-17
**Blocked (no Gherkin):** AC-01/AC-UI (CR B5 gate), AC-10 (event-bus), AC-12 (MFA freshness)
**No Gherkin (edge-case or separate-feature):** AC-05, AC-06, AC-07 (all consolidated into AC-15/16/17 error scenarios)

---

## Scenarios summary

| Tag           | Scenario                                                                                               | AC            | Priority | E2E          |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------- | -------- | ------------ |
| `@happy-path` | Power User (Bank Admin) reactivates Suspended FA via API → Suspended → Active + audit event            | AC-04, AC-08  | P0       | ✅           |
| `@happy-path` | Post-reactivation, new Financing assembly against the FA succeeds (Validation & Gating Engine resumed) | AC-09         | P0       | ✅           |
| `@main-error` | Justification below 20 chars → 400                                                                     | AC-02         | P0       | ✅           |
| `@main-error` | Re-Validation Confirmation not checked (`reValidationConfirmed: false`) → 400                          | AC-03         | P0       | ✅           |
| `@main-error` | Non-Power-User role attempts POST /reactivate → 404 (Outline — 5 roles)                                | AC-11         | P0       | ✅           |
| `@main-error` | FA not in Suspended state → 409 with lifecycle-state error (Outline — 3 states)                        | AC-13         | P0       | ✅           |
| `@main-error` | Cross-tenant reactivate returns 404                                                                    | AC-14         | P0       | ⚙️ needs D20 |
| `@main-error` | LC Suspended in Partner Mgmt during FA Suspension → 422 with LC-status error                           | AC-15 (AC-05) | P0       | ✅           |
| `@main-error` | Valid Until has passed during Suspension → 422 with Valid-Until error                                  | AC-16 (AC-06) | P0       | ✅           |
| `@main-error` | Referenced Product Template deprecated during Suspension → 422 with template-status error              | AC-17 (AC-07) | P0       | ✅           |

Active scenario blocks: 10 (2 Outlines + 8 Scenarios)
E2E automation candidates: 9 of 10 scenarios ✅

---

## Design specification (source of truth — spec-anchored)

Framework Agreement Reactivation as specified in PRD1042-805 with CR PRD1042-1495 B5 applied. Because the REACTIVATE Figma frame is not available in this session, verbatim modal copy is not anchored — scenarios assert behavioural outcomes. Once the frame is exported, upgrade AC-02 / AC-03 / AC-15 / AC-16 / AC-17 assertions to verbatim strings.

Key facts encoded below:

- **Actor:** Only Power User (Bank Admin). Explicitly single-actor for November 2026 release (Four-Eyes deferred per SCOPE note in the story). Do NOT reuse Two-Actor pattern from US 29.8 Tenant Reactivation.
- **Precondition:** FA is in `Suspended` state.
- **Modal fields:** Justification (long text, min 20 chars, mandatory); Re-Validation Confirmation (checkbox, mandatory).
- **API contract:** `POST /api/framework-agreements/{id}/reactivate` with body `{ justification, reValidationConfirmed }`.
- **Success:** 200 → FA transitions Suspended → Active; audit event `fa.reactivated` emitted; Validation & Gating Engine resumes new-Financing acceptance.
- **Reactivation-time validation (all three must pass):** LC still Active in Partner Mgmt, Valid Until ≥ now (UTC) or null, all referenced Product Templates in Published state. Any failing → 422 with explicit error.
- **Lifecycle-state guard:** FA must be Suspended — Draft/Active/Terminated → 409.
- **Role gate:** POST is Bank Admin only. FO / BO-Risk / LC / Support / Auditor → 404 (not 403 — tenant/domain isolation pattern established across Epic 11).
- **Tenant isolation:** cross-tenant `{faId}` → 404.
- **UI note:** CR B5 currently hides the Reactivate button on the FA Detail sidebar; POST endpoint remains active.

---

## Feature file

```gherkin
@framework-agreement @us-11.6 @p0
Feature: Framework Agreement Reactivation (US 11.6 — PRD1042-805)
  As a Power User (Bank Admin)
  I want to reactivate a Suspended Framework Agreement
  So that new Financings may again be created against it once the suspension reason has been resolved

  Background:
    Given tenant "tenant-1" has a Framework Agreement "FA-2026-00041" (RV-SSKM-2026-001) with LC "New Group Trade" (LC still Active in Partner Mgmt)
    And "FA-2026-00041" is currently in "Suspended" state
    And "FA-2026-00041" has Valid Until in the future (or null)
    And "FA-2026-00041" references only Product Templates in "Published" state
    And the current user has a valid MFA-fresh session

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02, AC-03, AC-04, AC-08
  # Power User (Bank Admin) posts a valid reactivation: justification ≥ 20 chars
  # + reValidationConfirmed=true; FA transitions Suspended → Active and audit
  # event fa.reactivated is emitted with the full attributes. This is the core
  # success flow — API-level because CR B5 currently hides the UI Reactivate
  # button (POST endpoint remains active per prior E11 batch confirmation).
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @ac-08 @ac-02 @ac-03 @p0 @e2e-ready
  Scenario: Power User (Bank Admin) reactivates Suspended FA — Suspended → Active + audit event (AC-04, AC-08)
    Given I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | true                                                                  |
    Then the response status should be 200
    And the "FA-2026-00041" status should be "Active"
    And an audit event "fa.reactivated" should be recorded for "FA-2026-00041" with fields "faId, tenantId, actor, justification, timestamp"
    And the actor on the audit event should be the current user
    And the justification on the audit event should match the submitted justification

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-09
  # Post-reactivation, the Validation & Gating Engine resumes accepting new
  # Financing assembly against this FA. Assert by attempting to create a
  # Financing that would have been rejected while Suspended (Suspended blocks
  # new-Financing per US 11.5 spec) and expecting success.
  # ---------------------------------------------------------------------------

  @happy-path @ac-09 @p0 @e2e-ready
  Scenario: After reactivation, new Financing assembly against FA succeeds (Validation & Gating Engine resumed) (AC-09)
    Given "FA-2026-00041" was reactivated in the previous step
    And I am logged in as "front_office" bound to "tenant-1"
    When I POST to "/api/financings" with body
      | field                | value             |
      | frameworkAgreementId | FA-2026-00041     |
      | leasingContractId    | LC-CONTRACT-001   |
    Then the response status should be 201
    And the created Financing should reference "FA-2026-00041"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Justification below the 20-character minimum → 400 with validation error.
  # Server-side enforcement — assertion is on HTTP status + error field name
  # rather than verbatim copy (design-blind).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Justification below 20 chars is rejected (AC-02)
    Given I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                  |
      | justification            | LC KYC ok              |
      | reValidationConfirmed    | true                   |
    Then the response status should be 400
    And the error response should identify the field "justification"
    And the "FA-2026-00041" status should remain "Suspended"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Re-Validation Confirmation not checked (reValidationConfirmed=false) → 400.
  # The checkbox exists to force Bank Admin to explicitly acknowledge that
  # LC / Valid Until / templates have been verified before pressing the button.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario: Re-Validation Confirmation not checked is rejected (AC-03)
    Given I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | false                                                                 |
    Then the response status should be 400
    And the error response should identify the field "reValidationConfirmed"
    And the "FA-2026-00041" status should remain "Suspended"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Only Power User (Bank Admin) may reactivate. Non-permitted roles (Front
  # Office, Back Office / Risk, LC User, Support, Auditor) receive 404 rather
  # than 403 — the 404-not-403 pattern is the established Epic 11 role-gate
  # affordance (matches PRD1042-803/807/809/812 sibling stories).
  # ---------------------------------------------------------------------------

  # [CR-PENDING B5] — CR PRD1042-22 v10 §5 flags 4 contested permission-matrix
  # cells. Current 5-role 404 Outline retained pending Philipp Maute decision.

  @main-error @ac-11 @p0 @e2e-ready @cr-pending-b5
  Scenario Outline: Non-permitted role attempts reactivate — 404 (AC-11)
    Given I am logged in as <role> bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | true                                                                  |
    Then the response status should be 404
    And the "FA-2026-00041" status should remain "Suspended"
    And no audit event "fa.reactivated" should be recorded

    Examples:
      | role                 |
      | front_office         |
      | back_office          |
      | leasing_company_user |
      | support_user         |
      | auditor              |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Lifecycle-state guard. Reactivate is only valid FROM Suspended.
  # Draft / Active / Terminated → 409 with explicit lifecycle-state error.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0 @e2e-ready
  Scenario Outline: Reactivate rejected on non-Suspended FA (AC-13)
    Given "FA-2026-00041" is in "<current_state>" state
    And I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | true                                                                  |
    Then the response status should be 409
    And the error response should reference "<current_state>"
    And the "FA-2026-00041" status should remain "<current_state>"

    Examples:
      | current_state |
      | Draft         |
      | Active        |
      | Terminated    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Tenant isolation. Cross-tenant faId lookup returns 404 (not 403), matching
  # the Epic 11 uniform pattern. Requires seeded second Bank Tenant B (D20).
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: Cross-tenant reactivate returns 404 (AC-14)
    Given a Framework Agreement "FA-TENANT-B-001" exists in "tenant-b" in "Suspended" state
    And I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-TENANT-B-001/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | true                                                                  |
    Then the response status should be 404
    And the "FA-TENANT-B-001" status should remain "Suspended" in "tenant-b"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15 (merges AC-05)
  # LC is not Active in Partner Management at reactivation time. This is one of
  # the three reactivation-time validations. Server returns 422 with an error
  # explicitly referencing LC status — behavioural assertion on keyword
  # presence rather than verbatim copy (design-blind).
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @ac-05 @p0 @e2e-ready
  Scenario: LC Suspended in Partner Management blocks reactivation (AC-15 / AC-05)
    Given LC "New Group Trade" is now in "Suspended" state in Partner Management
    And I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | true                                                                  |
    Then the response status should be 422
    And the error response should reference the LC status
    And the "FA-2026-00041" status should remain "Suspended"
    And no audit event "fa.reactivated" should be recorded

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16 (merges AC-06)
  # Valid Until has passed during Suspension → blocked. Spec: admin must edit
  # Valid Until (US 11.10) or terminate the agreement. Server returns 422.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @ac-06 @p0 @e2e-ready
  Scenario: Valid Until has passed blocks reactivation (AC-16 / AC-06)
    Given "FA-2026-00041" has Valid Until in the past
    And I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | true                                                                  |
    Then the response status should be 422
    And the error response should reference "Valid Until"
    And the "FA-2026-00041" status should remain "Suspended"
    And no audit event "fa.reactivated" should be recorded

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-17 (merges AC-07)
  # A referenced Product Template was deprecated during Suspension → blocked.
  # Spec: admin must remove or replace the template (US 11.10) before
  # reactivating. Server returns 422 with a template-status error.
  # ---------------------------------------------------------------------------

  @main-error @ac-17 @ac-07 @p0 @e2e-ready
  Scenario: Deprecated Product Template blocks reactivation (AC-17 / AC-07)
    Given "FA-2026-00041" references Product Template "TPL-ASSET-A" in "Deprecated" state
    And I am logged in as "power_user" bound to "tenant-1"
    When I POST to "/api/framework-agreements/FA-2026-00041/reactivate" with body
      | field                    | value                                                                 |
      | justification            | LC resumed KYC coverage and delivered updated compliance certificate  |
      | reValidationConfirmed    | true                                                                  |
    Then the response status should be 422
    And the error response should reference the deprecated Product Template
    And the "FA-2026-00041" status should remain "Suspended"
    And no audit event "fa.reactivated" should be recorded
```
