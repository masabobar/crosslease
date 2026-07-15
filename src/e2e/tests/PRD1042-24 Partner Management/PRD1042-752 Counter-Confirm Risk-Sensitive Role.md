# PRD1042-752 — US 13.6 | Partner Management | Counter-Confirm Risk-Sensitive Role (Four-Eyes)

Generated: 2026-07-08
Story: PRD1042-752 — US 13.6 | Partner Management | Counter-Confirm Risk-Sensitive Role (Four-Eyes)
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (11 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 7 of 11 | Blocked: 0 | Excluded: 4 (edge-case — scope filter table only)
Figma design: Node 235:28545, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #3)" (Stage 2 PARTIAL — node is a third E13 scope-legend card, not a screen frame; BO/Risk counter-confirmation queue-item frame not enumerable, MCP truncated to legend cards)

---

## AC Scope Filter

| AC    | Description                                                                                                                          | Classification | Rationale                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| AC-01 | Risk-sensitive role flags (LG / Bank Entity / UBO-Related Person) require BO/Risk counter-confirmation; Approve → operational (CP-5) | `happy-path`   | Core success flow; counter-confirm makes the flag operational                                  |
| AC-02 | Counter-Confirmation Decision (Approve/Reject) required; optional Review Note captured                                               | `happy-path`   | Field capture asserted within the counter-confirm flow (Approve decision)                      |
| AC-03 | Initiating actor and counter-confirming actor must be distinct; actor-independence evaluated server-side                             | `main-error`   | Four-Eyes domain rule → 1 auto negative scenario (same user cannot initiate + counter-confirm) |
| AC-04 | Same-user counter-confirmation is rejected (Four-Eyes independence)                                                                  | `main-error`   | Concrete negative of AC-03; covered by the same Four-Eyes scenario                             |
| AC-05 | Until counter-confirmed, the risk-sensitive role flag is non-operational                                                             | `happy-path`   | The pre-state (non-operational) asserted as the Given in the happy-path scenario               |
| AC-06 | Four-Eyes independence evaluated at the moment of counter-confirmation, not at request time                                          | `edge-case`    | Timing/implementation detail of when independence is checked — not a manual UI assertion       |
| AC-07 | Only BO/Risk may counter-confirm; all other roles rejected (backend-enforced)                                                        | `main-error`   | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403)            |
| AC-08 | Counter-confirming a withdrawn assignment is blocked (invalid state)                                                                 | `main-error`   | State-transition guard — invalid state blocked                                                 |
| AC-09 | Notification event routed to BO/Risk queue (E31 Part A)                                                                              | `edge-case`    | Event routing to a queue — integration-level, not an observable manual-UI assertion            |
| AC-10 | Decision and independence evidence persisted transactionally                                                                         | `edge-case`    | Non-functional transactional-persistence guarantee — system-level                              |
| AC-11 | Emits RiskRoleCounterConfirmed event (Notification bus, Audit Trail)                                                                 | `edge-case`    | Internal event emission — integration-level                                                    |

**Gherkin generated for:** AC-01, AC-02, AC-05, AC-03, AC-04, AC-07, AC-08
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-06, AC-09, AC-10, AC-11 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                                    | AC                  | Priority | E2E                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ----------------------------------------- |
| `@happy-path` | BO/Risk counter-confirms a risk-sensitive role and it becomes operational (Scenario Outline — 3 role types) | AC-01, AC-02, AC-05 | P0       | ⚙️ needs seeded role-assignment fixture   |
| `@main-error` | Same user cannot initiate and counter-confirm the same role (Four-Eyes)                                     | AC-03, AC-04        | P0       | ⚙️ needs seeded role-assignment fixture   |
| `@main-error` | Only BO/Risk may counter-confirm a risk-sensitive role (Scenario Outline — 5 roles)                         | AC-07               | P0       | ⚙️ needs seeded assignment + role mapping |
| `@main-error` | Counter-confirming a withdrawn assignment is blocked                                                        | AC-08               | P0       | ⚙️ needs seeded withdrawn assignment      |

Active scenario blocks: 4 (2 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.6 @p0
Feature: Counter-Confirm Risk-Sensitive Role — Four-Eyes (US 13.6 — PRD1042-752)
  As a Back Office / Risk reviewer
  I want to counter-confirm a risk-sensitive role assignment
  So that Four-Eyes governance is satisfied before the role flag becomes operational

  Background:
    Given I am authenticated in an active tenant with the Partner Management module enabled
    And a Partner has a risk-sensitive role assignment initiated by a Front Office case worker

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-05
  # A risk-sensitive role flag is non-operational until a BO/Risk reviewer
  # counter-confirms it (Approve, optional note); on approval it becomes
  # operational. Covers all three risk-sensitive role types.
  # Design note: BO/Risk counter-confirmation queue frame is PARTIAL in Figma; steps driven from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-05 @p0
  Scenario Outline: BO/Risk counter-confirms a risk-sensitive role and it becomes operational (AC-01, AC-02, AC-05)
    Given the risk-sensitive role "<risk_role>" is assigned but not yet counter-confirmed
    And the role flag is non-operational
    And I am authenticated as a Back Office / Risk reviewer who did not initiate the assignment
    When I counter-confirm the role with decision "Approve" and an optional review note
    Then the counter-confirmation is recorded with independence evidence
    And the risk-sensitive role flag becomes operational

    Examples:
      | risk_role          |
      | Leasing Company    |
      | Bank Entity        |
      | UBO-Related Person |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03, AC-04 (Four-Eyes independence, auto-applied domain rule)
  # Actor-independence is evaluated server-side at decision time: the actor who
  # initiated the assignment can never counter-confirm it, even if they hold the
  # BO/Risk capability.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @ac-04 @p0
  Scenario: Same user cannot initiate and counter-confirm the same role (AC-03, AC-04)
    Given a risk-sensitive role assignment was initiated by user "U1"
    And I am authenticated as user "U1"
    When I attempt to counter-confirm that same role assignment
    Then the counter-confirmation is rejected for Four-Eyes independence
    And a Four-Eyes violation audit event is raised
    And the role flag remains non-operational

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (role-based access, auto-applied domain rule)
  # Counter-confirmation authority is backend-enforced and limited to BO/Risk;
  # every other role is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario Outline: Only BO/Risk may counter-confirm a risk-sensitive role (AC-07)
    Given a risk-sensitive role assignment is pending counter-confirmation
    And I am authenticated as a "<role>" user
    When I attempt to counter-confirm the role
    Then the request is rejected with HTTP 403
    And the role flag remains non-operational

    Examples:
      | role                    |
      | Front Office            |
      | System Admin            |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08 (state transition)
  # A counter-confirmation is only valid against a live pending assignment; a
  # withdrawn assignment cannot be counter-confirmed.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Counter-confirming a withdrawn assignment is blocked (AC-08)
    Given a risk-sensitive role assignment has been withdrawn
    And I am authenticated as a Back Office / Risk reviewer
    When I attempt to counter-confirm the withdrawn assignment
    Then the counter-confirmation is blocked as an invalid state
    And no role flag becomes operational
```
