# PRD1042-750 — US 13.4 | Partner Management | Ambiguous Resolution → Pending Confirmation Block

Generated: 2026-07-08
Story: PRD1042-750 — US 13.4 | Partner Management | Ambiguous Resolution → Pending Confirmation Block
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (10 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 5 of 10 | Blocked: 0 | Excluded: 5 (edge-case — scope filter table only)
Figma design: Node 235:28513, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope legend / cover)" (Stage 2 PARTIAL — FE surfaces are a Pending Confirmation badge + FO candidate-comparison view (LC simplified Pending only); frames not enumerable, MCP truncated to cover slide)

---

## AC Scope Filter

| AC    | Description                                                                                                       | Classification | Rationale                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| AC-01 | On Ambiguous classification the Partner is placed in Pending Confirmation (Lifecycle State)                       | `happy-path`   | Core state outcome; observable via the Pending Confirmation badge                                   |
| AC-02 | Candidate Set (all matched candidates + evidence) surfaced to FO via candidate-comparison view                    | `happy-path`   | Observable FO view content; asserted alongside AC-01                                                |
| AC-03 | Consuming workflows (Refinancing Request Stage 1/2) receive a Validation Engine Defer surfaced from Partner state | `main-error`   | Blocks downstream progression; the Defer outcome is observable in the consuming workflow            |
| AC-04 | Validation & Gating Engine evaluates and emits Defer; Partner Management only surfaces state (ownership boundary) | `edge-case`    | Internal service ownership boundary / Defer emission mechanics — system/integration, not manual UI  |
| AC-05 | Notification event routed to FO confirmation queue (E31 Part A)                                                   | `edge-case`    | Event routing to a queue — integration-level, not observable as a manual UI assertion here          |
| AC-06 | State visible to bank-internal roles; LC sees simplified Pending status only                                      | `main-error`   | Role-based-access domain rule → 1 auto negative scenario (LC simplified vs bank-internal full)      |
| AC-07 | State transition recorded synchronously with resolution outcome                                                   | `edge-case`    | Non-functional synchronous-recording guarantee — system-level, not a deterministic manual assertion |
| AC-08 | Emits PartnerPendingConfirmation event                                                                            | `edge-case`    | Internal event emission — integration-level, not an observable manual-UI concern                    |
| AC-09 | Audit records trigger evidence, candidate set, and time of state entry                                            | `edge-case`    | Audit log content/format — verified at the audit layer, not a manual UI test                        |
| AC-10 | Downstream reference attempts on a Pending Confirmation Partner are blocked (CP-6)                                | `main-error`   | Hard block on referencing an unconfirmed identity; observable when a downstream attach is attempted |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-06, AC-10
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-04, AC-05, AC-07, AC-08, AC-09 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                | AC           | Priority | E2E                                                  |
| ------------- | --------------------------------------------------------------------------------------- | ------------ | -------- | ---------------------------------------------------- |
| `@happy-path` | Ambiguous match places the Partner in Pending Confirmation with a visible candidate set | AC-01, AC-02 | P0       | ⚙️ needs seeded ambiguous-match Partner              |
| `@main-error` | Downstream reference to a Pending Confirmation Partner is blocked                       | AC-10        | P0       | ⚙️ needs seeded Pending Partner                      |
| `@main-error` | Consuming Refinancing Request workflow surfaces a Validation Engine Defer               | AC-03        | P0       | ⚙️ needs seeded Pending Partner + refinancing gating |
| `@main-error` | Pending Confirmation visibility differs by role (Scenario Outline — 4 roles)            | AC-06        | P0       | ⚙️ needs seeded Pending Partner                      |

Active scenario blocks: 4 (1 Outline + 3 Scenarios)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.4 @p0
Feature: Ambiguous Resolution — Pending Confirmation Block (US 13.4 — PRD1042-750)
  As a bank-internal user handling ambiguous Partner resolution
  I want an ambiguous match to place the Partner in Pending Confirmation and block downstream use
  So that no operational entity references an unconfirmed identity until governance resolves it

  Background:
    Given I am authenticated as a Front Office case worker in an active tenant with the Partner Management module enabled

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # An ambiguous classification places the Partner into Pending Confirmation
  # (shown via the badge) and the FO candidate-comparison view lists every
  # matched candidate with its evidence.
  # Design note: badge + candidate-comparison frames are PARTIAL in Figma; steps driven from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario: Ambiguous match places the Partner in Pending Confirmation with a visible candidate set (AC-01, AC-02)
    Given a submission produced an "Ambiguous" classification with multiple matched candidates
    When I open the Partner
    Then the Partner lifecycle state is "Pending Confirmation"
    And a Pending Confirmation badge is shown on the Partner
    And the candidate-comparison view lists all matched candidates with their match evidence

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # A Partner in Pending Confirmation must not be referenceable by any downstream
  # operational entity; an attach attempt is blocked so no unconfirmed identity
  # leaks into operational data (CP-6).
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Downstream reference to a Pending Confirmation Partner is blocked (AC-10)
    Given a Partner is in "Pending Confirmation"
    When a downstream operation attempts to reference the Partner (for example, attaching it to a Contract)
    Then the reference is blocked
    And no operational entity is linked to the Partner

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # The consuming Refinancing Request workflow reads the Partner state and
  # surfaces a Validation Engine Defer outcome, blocking progression until
  # governance resolves the Partner.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Consuming Refinancing Request workflow surfaces a Validation Engine Defer (AC-03)
    Given a Partner is in "Pending Confirmation"
    When I proceed through Refinancing Request Stage 1 or Stage 2 referencing that Partner
    Then the consuming workflow surfaces a "Validation Engine Defer" outcome derived from the Partner state
    And progression is blocked until governance resolves the Partner

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (role-based access, auto-applied domain rule)
  # Bank-internal roles see the full Pending Confirmation state and candidate
  # set; a Leasing Company user sees only a simplified Pending status, never the
  # candidate set or evidence.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario Outline: Pending Confirmation visibility differs by role (AC-06)
    Given a Partner is in "Pending Confirmation"
    When I view the Partner as a "<role>" user
    Then I see "<visible_detail>"

    Examples:
      | role         | visible_detail                                                      |
      | Front Office | the full Pending Confirmation state and the candidate set           |
      | BO/Risk      | the full Pending Confirmation state and the candidate set           |
      | Auditor      | the full Pending Confirmation state and the candidate set           |
      | LC User      | a simplified Pending status only, without candidate set or evidence |
```
