# PRD1042-761 — US 13.15 | Partner Management | Counter-Confirm High-Risk Identity Change (Four-Eyes)

Generated: 2026-07-08
Story: PRD1042-761 — US 13.15 | Partner Management | Counter-Confirm High-Risk Identity Change (Four-Eyes)
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (10 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 7 of 10 | Blocked: 0 | Excluded: 3 (1 separate-feature + 2 edge-case — scope filter table only)
Figma design: Node 235:28545, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #3)" (Stage 2 PARTIAL — node is the third E13 scope-legend card, not a screen frame; counter-confirmation panel with impact assessment frame not enumerable, MCP truncated to legend cards)

---

## AC Scope Filter

| AC    | Description                                                                                                                                                   | Classification     | Rationale                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| AC-01 | BO/Risk reviews the pre-change downstream impact assessment and Approves → change commits atomically with appended Identity Change Event + pre/post snapshots | `happy-path`       | Core success flow; the governed atomic commit                                           |
| AC-02 | Decision (Approve/Reject) required; Impact Acknowledgement (boolean) mandatory; optional Note                                                                 | `happy-path`       | Field capture asserted within the approve flow (Impact Acknowledgement is the key gate) |
| AC-03 | Approval without Impact Acknowledgement is blocked                                                                                                            | `main-error`       | Mandatory acknowledgement gate blocks the primary action until set                      |
| AC-04 | Proposer and counter-confirmer must differ (Four-Eyes independence)                                                                                           | `main-error`       | Four-Eyes domain rule → 1 auto negative scenario (proposer cannot counter-confirm)      |
| AC-05 | Only BO/Risk may counter-confirm; all other roles rejected (backend-enforced)                                                                                 | `main-error`       | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403)     |
| AC-06 | Reject → change cancelled; anchors unchanged; audit recorded                                                                                                  | `main-error`       | Reject branch blocks the commit and leaves anchors untouched                            |
| AC-07 | Commit and snapshot append occur atomically; commit-transaction failure rolls both back (no partial commit)                                                   | `main-error`       | Atomicity guard — a failed commit must not leave a partial change                       |
| AC-08 | On high-risk commit, KYC re-screening obligation trigger fires where KYC active (US 13.16, Part B); else credit-field re-validation note                      | `separate-feature` | KYC re-screening trigger owned/tested by US 13.16 (Part B)                              |
| AC-09 | Emits IdentityChangeCommitted / IdentityChangeRejected events                                                                                                 | `edge-case`        | Internal event emission — integration-level                                             |
| AC-10 | Audit records proposer + counter-confirmer, impact acknowledgement, pre/post snapshots, decision                                                              | `edge-case`        | Audit log content/format — verified at the audit layer                                  |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-08 (separate-feature → US 13.16); AC-09, AC-10 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                         | AC           | Priority | E2E                                     |
| ------------- | -------------------------------------------------------------------------------- | ------------ | -------- | --------------------------------------- |
| `@happy-path` | BO/Risk approves a high-risk identity change and it commits atomically           | AC-01, AC-02 | P0       | ⚙️ needs seeded pending identity change |
| `@main-error` | Approval without Impact Acknowledgement is blocked                               | AC-03        | P0       | ⚙️ needs seeded pending identity change |
| `@main-error` | The proposer cannot counter-confirm their own identity change (Four-Eyes)        | AC-04        | P0       | ⚙️ needs seeded change + two-user setup |
| `@main-error` | Only BO/Risk may counter-confirm an identity change (Scenario Outline — 5 roles) | AC-05        | P0       | ⚙️ needs seeded change + role mapping   |
| `@main-error` | Rejecting a high-risk identity change cancels it and leaves anchors unchanged    | AC-06        | P0       | ⚙️ needs seeded pending identity change |
| `@main-error` | A failed commit rolls back the anchor update and snapshot together               | AC-07        | P0       | ⚙️ needs commit-failure injection       |

Active scenario blocks: 6 (1 Outline + 5 Scenarios)
E2E automation candidates: 0 of 6 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.15 @p0
Feature: Counter-Confirm High-Risk Identity Change — Four-Eyes (US 13.15 — PRD1042-761)
  As a Back Office / Risk reviewer
  I want to counter-confirm a high-risk Identity Change after reviewing the pre-change impact assessment
  So that Four-Eyes governance is satisfied before the change commits

  Background:
    Given I am authenticated in an active tenant with the Partner Management module enabled
    And a high-risk Identity Change proposed by a Front Office case worker (US 13.14) is pending counter-confirmation

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # An independent BO/Risk reviewer reviews the pre-change downstream impact,
  # acknowledges it (mandatory), and approves — the change commits atomically
  # with an appended Identity Change Event and pre/post snapshots.
  # Design note: counter-confirmation panel + impact assessment frame is PARTIAL in Figma; steps from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario: BO/Risk approves a high-risk identity change and it commits atomically (AC-01, AC-02)
    Given I am a Back Office / Risk reviewer who did not propose the change
    And the pre-change downstream impact assessment is displayed
    When I acknowledge the impact and counter-confirm with decision "Approve" and an optional note
    Then the identity change commits atomically
    And an Identity Change Event is appended with pre/post snapshots
    And the Confirmed Partner's anchors reflect the approved values

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (mandatory impact-acknowledgement gate)
  # Approval is blocked until the reviewer sets the mandatory Impact
  # Acknowledgement confirming review of the affected downstream objects.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Approval without Impact Acknowledgement is blocked (AC-03)
    Given I am a Back Office / Risk reviewer reviewing a high-risk identity change
    When I attempt to approve without setting the mandatory Impact Acknowledgement
    Then the approval is blocked
    And I am required to acknowledge review of the affected downstream objects before approval can proceed

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (Four-Eyes independence, auto-applied domain rule)
  # Actor-independence is enforced server-side: the actor who proposed the
  # identity change (US 13.14) can never counter-confirm it.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: The proposer cannot counter-confirm their own identity change (AC-04)
    Given an identity change was proposed by user "U1"
    And I am authenticated as user "U1"
    When I attempt to counter-confirm that identity change
    Then the counter-confirmation is rejected for Four-Eyes independence
    And the change is not committed

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (role-based access, auto-applied domain rule)
  # Counter-confirmation authority is backend-enforced and limited to BO/Risk;
  # every other role is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Only BO/Risk may counter-confirm an identity change (AC-05)
    Given a high-risk identity change is pending counter-confirmation
    And I am authenticated as a "<role>" user
    When I attempt to counter-confirm the identity change
    Then the request is rejected with HTTP 403
    And the change is not committed

    Examples:
      | role                    |
      | Front Office            |
      | System Admin            |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (reject branch)
  # Rejecting cancels the change and leaves the Confirmed Partner's anchors
  # unchanged, with audit evidence.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Rejecting a high-risk identity change cancels it and leaves anchors unchanged (AC-06)
    Given I am a Back Office / Risk reviewer reviewing a high-risk identity change
    When I counter-confirm with decision "Reject" and a rationale note
    Then the identity change is cancelled
    And the Confirmed Partner's anchors remain unchanged
    And the rejection is recorded with audit evidence

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (atomic commit / rollback)
  # The anchor update and the appended snapshot commit as one transaction; if
  # the commit fails partway, both roll back together with no partial change.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: A failed commit rolls back the anchor update and snapshot together (AC-07)
    Given I am a Back Office / Risk reviewer approving a high-risk identity change
    When the commit transaction fails partway through
    Then the anchor update and the appended snapshot roll back together
    And no partial change is committed
    And the Confirmed Partner's anchors remain unchanged
```
