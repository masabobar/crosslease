# PRD1042-765 — US 13.19 | Partner Management | Counter-Confirm Risk-Sensitive Role Assignment

Generated: 2026-07-08
Story: PRD1042-765 — US 13.19 | Partner Management | Counter-Confirm Risk-Sensitive Role Assignment
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (9 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review — NOTE: functional duplicate of US 13.06 / PRD1042-752; suite mirrors the 752 scenarios)
ACs with Gherkin scenarios: 6 of 9 | Blocked: 0 | Excluded: 3 (edge-case — scope filter table only)
Figma design: Node 235:28545, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #3)" (Stage 2 PARTIAL — node is the third E13 scope-legend card, not a screen frame; BO/Risk role counter-confirmation queue not enumerable — real screen frames live under 21:xxxxx nodes)

---

## AC Scope Filter

| AC    | Description                                                                                                 | Classification | Rationale                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| AC-01 | BO/Risk counter-confirms an FO-initiated risk-sensitive role assignment; flag operational only after (CP-5) | `happy-path`   | Core success flow; counter-confirm makes the flag operational                       |
| AC-02 | Decision (Approve/Reject) required; optional Note                                                           | `happy-path`   | Field capture asserted within the counter-confirm flow (Approve)                    |
| AC-03 | Same-user counter-confirmation rejected (Four-Eyes independence)                                            | `main-error`   | Four-Eyes domain rule → 1 auto negative scenario (initiator cannot counter-confirm) |
| AC-04 | Flag non-operational until approved                                                                         | `happy-path`   | Pre-state (non-operational) asserted as the Given in the happy-path scenario        |
| AC-05 | Only BO/Risk may counter-confirm; all other roles rejected                                                  | `main-error`   | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403) |
| AC-06 | Reject → flag remains non-operational; audit recorded                                                       | `main-error`   | Reject branch — flag stays non-operational                                          |
| AC-07 | Notification routed to BO/Risk queue (E31 Part A)                                                           | `edge-case`    | Event routing to a queue — integration-level                                        |
| AC-08 | Emits RiskRoleCounterConfirmed event                                                                        | `edge-case`    | Internal event emission — integration-level                                         |
| AC-09 | Independence evidence persisted with the decision                                                           | `edge-case`    | Non-functional persistence guarantee — system/audit-layer                           |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-03, AC-05, AC-06
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-07, AC-08, AC-09 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                                    | AC                  | Priority | E2E                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ----------------------------------------- |
| `@happy-path` | BO/Risk counter-confirms a risk-sensitive role and it becomes operational (Scenario Outline — 3 role types) | AC-01, AC-02, AC-04 | P0       | ⚙️ needs seeded role-assignment fixture   |
| `@main-error` | Same user cannot initiate and counter-confirm the same role (Four-Eyes)                                     | AC-03               | P0       | ⚙️ needs seeded role-assignment fixture   |
| `@main-error` | Only BO/Risk may counter-confirm a risk-sensitive role (Scenario Outline — 5 roles)                         | AC-05               | P0       | ⚙️ needs seeded assignment + role mapping |
| `@main-error` | Rejecting leaves the risk-sensitive role flag non-operational                                               | AC-06               | P0       | ⚙️ needs seeded role-assignment fixture   |

Active scenario blocks: 4 (2 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.19 @p0
Feature: Counter-Confirm Risk-Sensitive Role Assignment (US 13.19 — PRD1042-765)
  As a Back Office / Risk reviewer
  I want to counter-confirm a risk-sensitive role assignment
  So that Four-Eyes governance is satisfied before the role flag becomes operational

  Background:
    Given I am authenticated in an active tenant with the Partner Management module enabled
    And a Partner has a risk-sensitive role assignment initiated by a Front Office case worker

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-04
  # A risk-sensitive role flag is non-operational until a BO/Risk reviewer
  # counter-confirms it (Approve, optional note); on approval it becomes
  # operational. Covers all three risk-sensitive role types.
  # Note: functional duplicate of US 13.06 (PRD1042-752); shares one API.
  # Design note: BO/Risk counter-confirmation queue frame is PARTIAL in Figma; steps driven from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-04 @p0
  Scenario Outline: BO/Risk counter-confirms a risk-sensitive role and it becomes operational (AC-01, AC-02, AC-04)
    Given the risk-sensitive role "<risk_role>" is assigned but not yet counter-confirmed
    And the role flag is non-operational
    And I am authenticated as a Back Office / Risk reviewer who did not initiate the assignment
    When I counter-confirm the role with decision "Approve" and an optional note
    Then the counter-confirmation is recorded with independence evidence
    And the risk-sensitive role flag becomes operational

    Examples:
      | risk_role          |
      | Leasing Company    |
      | Bank Entity        |
      | UBO-Related Person |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (Four-Eyes independence, auto-applied domain rule)
  # The actor who initiated the assignment can never counter-confirm it, even
  # with BO/Risk capability — evaluated server-side.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Same user cannot initiate and counter-confirm the same role (AC-03)
    Given a risk-sensitive role assignment was initiated by user "U1"
    And I am authenticated as user "U1"
    When I attempt to counter-confirm that same role assignment
    Then the counter-confirmation is rejected for Four-Eyes independence
    And the role flag remains non-operational

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (role-based access, auto-applied domain rule)
  # Counter-confirmation authority is backend-enforced and limited to BO/Risk;
  # every other role is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Only BO/Risk may counter-confirm a risk-sensitive role (AC-05)
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
  # MAIN ERROR — AC-06 (reject branch)
  # Rejecting the counter-confirmation leaves the role flag non-operational and
  # records audit evidence.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Rejecting leaves the risk-sensitive role flag non-operational (AC-06)
    Given a risk-sensitive role assignment is pending counter-confirmation
    And I am authenticated as a Back Office / Risk reviewer who did not initiate the assignment
    When I counter-confirm with decision "Reject" and a rationale note
    Then the role flag remains non-operational
    And the rejection is recorded with audit evidence
```
