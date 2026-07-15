# PRD1042-751 — US 13.5 | Partner Management | Confirm Pending Partner (Governed Confirmation)

Generated: 2026-07-08
Story: PRD1042-751 — US 13.5 | Partner Management | Confirm Pending Partner (Governed Confirmation)
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (11 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 7 of 11 | Blocked: 0 | Excluded: 4 (edge-case or separate-feature — scope filter table only)
Figma design: Node 235:28523, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #2)" (Stage 2 PARTIAL — node is a second E13 scope-legend card, not a screen frame; Confirm action + confirmation-history frames not enumerable, MCP truncated to legend cards)

---

## AC Scope Filter

| AC    | Description                                                                                                   | Classification     | Rationale                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| AC-01 | FO confirms a Pending Confirmation Partner → Confirmation Record appended, Partner transitions to Confirmed   | `happy-path`       | Core success flow; the governed confirmation and state transition                              |
| AC-02 | Confirmation Decision (Confirm/Reject) required; optional Confirmation Note captured on the record            | `happy-path`       | Field capture asserted within the confirm flow (Confirm decision)                              |
| AC-03 | On Confirmed the Partner becomes referenceable for downstream Contract / Financing / approval (CP-6)          | `happy-path`       | Referenceability is the business outcome; asserted in the happy-path scenario                  |
| AC-04 | Only System Admin + Front Office may confirm; backend-enforced; BO/Risk, LC, Power User, Auditor cannot       | `main-error`       | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403)            |
| AC-05 | A Partner in Rejected / Merged / Archived cannot be confirmed (invalid transition)                            | `main-error`       | State-transition guard — invalid transition blocked                                            |
| AC-06 | Confirming an already-Confirmed Partner is idempotent (no-op; no duplicate confirmation record)               | `main-error`       | Idempotency guard on re-confirm — blocks duplicate records                                     |
| AC-07 | Confirmation persists transactionally with the appended record                                                | `edge-case`        | Non-functional transactional-persistence guarantee — system-level, not a manual UI assertion   |
| AC-08 | Confirmed-state transition emits PartnerConfirmed event (Refinancing gating, Notification bus, Audit Trail)   | `edge-case`        | Internal event emission — integration-level, not an observable manual-UI concern               |
| AC-09 | Confirmation history list records confirming actor, decision, note, resulting state (append-only)             | `edge-case`        | Audit/history record content — verified at the audit layer                                     |
| AC-10 | Before confirmation the Partner is non-referenceable (CP-6)                                                   | `separate-feature` | The non-referenceable-while-Pending behavior is owned/tested by US 13.4 (PRD1042-750)          |
| AC-11 | Confirmation Records are append-only/immutable; edit/delete attempts rejected + critical security audit event | `main-error`       | Security control blocking record tampering; the rejection is observable and a hard requirement |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-11
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-07, AC-08, AC-09 (edge-case); AC-10 (separate-feature)

---

## Scenarios summary

| Tag           | Scenario                                                                                             | AC                  | Priority | E2E                                 |
| ------------- | ---------------------------------------------------------------------------------------------------- | ------------------- | -------- | ----------------------------------- |
| `@happy-path` | Authorized user confirms a Pending Partner and it becomes referenceable (Scenario Outline — 2 roles) | AC-01, AC-02, AC-03 | P0       | ⚙️ needs seeded Pending Partner     |
| `@main-error` | Unauthorized roles cannot confirm a Partner (Scenario Outline — 4 roles)                             | AC-04               | P0       | ⚙️ needs seeded Pending Partner     |
| `@main-error` | Confirming a Partner in a non-confirmable state is blocked (Scenario Outline — 3 states)             | AC-05               | P0       | ⚙️ needs seeded Partner states      |
| `@main-error` | Re-confirming an already-Confirmed Partner is idempotent                                             | AC-06               | P0       | ⚙️ needs seeded Confirmed Partner   |
| `@main-error` | Editing or deleting a Confirmation Record is rejected and raises a critical security audit event     | AC-11               | P0       | ⚙️ needs seeded Confirmation Record |

Active scenario blocks: 5 (3 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 5 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.5 @p0
Feature: Confirm Pending Partner — Governed Confirmation (US 13.5 — PRD1042-751)
  As a Front Office case worker
  I want to confirm a Pending Confirmation Partner through the governed confirmation workflow
  So that the Partner becomes referenceable for Contract / Financing / approval progression

  Background:
    Given I am authenticated in an active tenant with the Partner Management module enabled

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-03
  # An authorized user (Front Office or System Admin) confirms a Pending Partner:
  # a Confirmation Record is appended, the Partner moves to Confirmed, and it
  # becomes referenceable downstream.
  # Design note: Confirm action + confirmation-history frames are PARTIAL in Figma; steps driven from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-03 @p0
  Scenario Outline: Authorized user confirms a Pending Partner and it becomes referenceable (AC-01, AC-02, AC-03)
    Given a Partner is in "Pending Confirmation"
    And I am authenticated as a "<role>" user
    When I confirm the Partner with decision "Confirm" and an optional confirmation note
    Then a Partner Confirmation Record is appended
    And the Partner transitions to "Confirmed"
    And the Partner becomes referenceable for downstream Contract / Financing / approval progression

    Examples:
      | role         |
      | Front Office |
      | System Admin |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (role-based access, auto-applied domain rule)
  # Confirmation authority is backend-enforced: only System Admin and Front
  # Office may confirm; every other role is rejected and the Partner stays Pending.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario Outline: Unauthorized roles cannot confirm a Partner (AC-04)
    Given a Partner is in "Pending Confirmation"
    And I am authenticated as a "<role>" user
    When I attempt to confirm the Partner
    Then the request is rejected with HTTP 403
    And the Partner remains in "Pending Confirmation"

    Examples:
      | role                    |
      | BO/Risk                 |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (state transition)
  # Confirmation is only valid from Pending Confirmation; a Partner already in a
  # terminal/other state (Rejected / Merged / Archived) cannot be confirmed and
  # no record is appended.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Confirming a Partner in a non-confirmable state is blocked (AC-05)
    Given a Partner is in "<state>"
    And I am authenticated as a Front Office case worker
    When I attempt to confirm the Partner
    Then the confirmation is blocked as an invalid transition
    And no Partner Confirmation Record is appended

    Examples:
      | state    |
      | Rejected |
      | Merged   |
      | Archived |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (idempotency)
  # Re-confirming a Partner that is already Confirmed is a no-op; the append-only
  # record set gains no duplicate entry beyond the original confirmation event.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Re-confirming an already-Confirmed Partner is idempotent (AC-06)
    Given a Partner is already in "Confirmed"
    And I am authenticated as a Front Office case worker
    When I confirm the Partner again
    Then the operation is a no-op
    And no duplicate Partner Confirmation Record is appended beyond the one for the original event

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (append-only immutability + security audit)
  # Confirmation Records are append-only and immutable; any modify/delete attempt
  # is rejected and raises a critical security audit event.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Editing or deleting a Confirmation Record is rejected and raises a critical security audit event (AC-11)
    Given a Partner has an existing Partner Confirmation Record
    And I am authenticated as a Front Office case worker
    When I attempt to modify or delete the Confirmation Record
    Then the attempt is rejected because the record is append-only and immutable
    And a critical security audit event is raised
```
