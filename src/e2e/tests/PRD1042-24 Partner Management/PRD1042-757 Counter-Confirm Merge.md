# PRD1042-757 — US 13.11 | Partner Management | Counter-Confirm Merge (Four-Eyes, No-Loss)

Generated: 2026-07-08
Story: PRD1042-757 — US 13.11 | Partner Management | Counter-Confirm Merge (Four-Eyes, No-Loss)
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (11 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 7 of 11 | Blocked: 0 | Excluded: 4 (1 separate-feature + 3 edge-case — scope filter table only)
Figma design: Node 235:28556, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #4)" (Stage 2 PARTIAL — node is a fourth E13 scope-legend card, not a screen frame; counter-confirmation panel (manifest / conflict flags / decision) frame not enumerable, MCP truncated to legend cards)

---

## AC Scope Filter

| AC    | Description                                                                                                              | Classification     | Rationale                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------- |
| AC-01 | BO/Risk reviews the reference-preservation manifest + conflict status, Approves → authorises atomic execution (US 13.12) | `happy-path`       | Core success flow; approval authorises the no-loss merge                                       |
| AC-02 | Decision (Approve/Reject) required; optional Note captured                                                               | `happy-path`       | Field capture asserted within the approve flow                                                 |
| AC-03 | Conflict Acknowledgement (boolean) required where a survivor/source outcome conflict exists; blocks approval             | `main-error`       | Unacknowledged conflict blocks the primary action until acknowledged                           |
| AC-04 | Initiator and counter-confirmer must differ (Four-Eyes independence)                                                     | `main-error`       | Four-Eyes domain rule → 1 auto negative scenario (same user cannot initiate + counter-confirm) |
| AC-05 | Only BO/Risk may counter-confirm the merge; all other roles rejected (backend-enforced)                                  | `main-error`       | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403)            |
| AC-06 | Self-merge and cross-tenant merge are rejected at this gate (defence in depth; CP-10)                                    | `main-error`       | Tenant-isolation + self-merge guard enforced at the counter-confirmation gate                  |
| AC-07 | Reject cancels the merge; sources remain distinct; audit evidence recorded                                               | `main-error`       | Reject branch blocks execution; post-reject pair status is UNPINNED (open design question)     |
| AC-08 | On approval, atomic merge execution is triggered                                                                         | `separate-feature` | The atomic merge execution itself is owned/tested by US 13.12                                  |
| AC-09 | Decision persisted with independence evidence transactionally                                                            | `edge-case`        | Non-functional transactional-persistence guarantee — system-level                              |
| AC-10 | Emits MergeCounterConfirmed / MergeRejected events                                                                       | `edge-case`        | Internal event emission — integration-level                                                    |
| AC-11 | Audit records initiating + counter-confirming actors, independence evidence, conflict status, decision                   | `edge-case`        | Audit log content/format — verified at the audit layer                                         |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-08 (separate-feature → US 13.12); AC-09, AC-10, AC-11 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                  | AC           | Priority | E2E                                       |
| ------------- | ----------------------------------------------------------------------------------------- | ------------ | -------- | ----------------------------------------- |
| `@happy-path` | BO/Risk approves a merge after reviewing the manifest and authorises execution            | AC-01, AC-02 | P0       | ⚙️ needs seeded merge-candidate fixture   |
| `@main-error` | Unacknowledged outcome conflict blocks merge approval                                     | AC-03        | P0       | ⚙️ needs seeded conflicting merge fixture |
| `@main-error` | Same user cannot initiate and counter-confirm the same merge (Four-Eyes)                  | AC-04        | P0       | ⚙️ needs seeded merge + two-user setup    |
| `@main-error` | Only BO/Risk may counter-confirm a merge (Scenario Outline — 5 roles)                     | AC-05        | P0       | ⚙️ needs seeded merge + role mapping      |
| `@main-error` | Illegal merges are rejected at the counter-confirmation gate (Scenario Outline — 2 types) | AC-06        | P0       | ⚙️ needs seeded illegal-merge + D20       |
| `@main-error` | Rejecting a merge cancels it and keeps the sources distinct                               | AC-07        | P0       | ⚙️ needs seeded merge-candidate fixture   |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 0 of 6 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.11 @p0
Feature: Counter-Confirm Merge — Four-Eyes, No-Loss (US 13.11 — PRD1042-757)
  As a Back Office / Risk reviewer
  I want to counter-confirm a merge after reviewing the reference-preservation manifest and conflict status
  So that no-loss merge governance (CP-8) is satisfied before atomic execution

  Background:
    Given I am authenticated in an active tenant with the Partner Management module enabled
    And a merge operation was initiated by another actor and is pending counter-confirmation

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # A BO/Risk reviewer (independent of the initiator) reviews the reference-
  # preservation manifest with no unresolved conflict, approves with an optional
  # note, and the merge is authorised for atomic execution (US 13.12).
  # Design note: counter-confirmation panel frame is PARTIAL in Figma; steps driven from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario: BO/Risk approves a merge after reviewing the manifest and authorises execution (AC-01, AC-02)
    Given I am a Back Office / Risk reviewer who did not initiate the merge
    And the reference-preservation manifest shows no unresolved survivor/source conflict
    When I review the manifest and counter-confirm with decision "Approve" and an optional note
    Then the merge is counter-confirmed with independence evidence recorded
    And atomic merge execution is authorised (US 13.12)

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (conflict acknowledgement gate)
  # Where a survivor/source KYC/credit outcome conflict exists, approval is
  # blocked until the reviewer sets the Conflict Acknowledgement flag.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Unacknowledged outcome conflict blocks merge approval (AC-03)
    Given a survivor/source KYC/credit outcome conflict exists on the merge
    And I am a Back Office / Risk reviewer who did not initiate the merge
    When I attempt to approve the merge without setting Conflict Acknowledgement
    Then the approval is blocked
    And I am required to acknowledge the outcome conflict before approval can proceed

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (Four-Eyes independence, auto-applied domain rule)
  # Actor-independence is enforced server-side: the actor who initiated the merge
  # can never counter-confirm it.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Same user cannot initiate and counter-confirm the same merge (AC-04)
    Given a merge was initiated by user "U1"
    And I am authenticated as user "U1"
    When I attempt to counter-confirm that same merge
    Then the counter-confirmation is rejected for Four-Eyes independence
    And the merge is not executed

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (role-based access, auto-applied domain rule)
  # Counter-confirmation authority is backend-enforced and limited to BO/Risk;
  # every other role is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Only BO/Risk may counter-confirm a merge (AC-05)
    Given a merge is pending counter-confirmation
    And I am authenticated as a "<role>" user
    When I attempt to counter-confirm the merge
    Then the request is rejected with HTTP 403
    And the merge is not executed

    Examples:
      | role                    |
      | Front Office            |
      | System Admin            |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (tenant isolation + self-merge, defence in depth)
  # Even at the counter-confirmation gate, a self-merge (survivor == source) and
  # a cross-tenant merge are rejected (CP-10).
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario Outline: Illegal merges are rejected at the counter-confirmation gate (AC-06)
    Given a merge of type "<merge_type>" is presented for counter-confirmation
    And I am a Back Office / Risk reviewer who did not initiate the merge
    When I attempt to counter-confirm the merge
    Then the counter-confirmation is rejected
    And the merge is not executed

    Examples:
      | merge_type                                    |
      | self-merge (survivor equals source)           |
      | cross-tenant merge (source in another tenant) |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (reject branch)
  # Rejecting cancels the merge and leaves both Partners distinct, with audit
  # evidence. NOTE: the resulting pair status after a reject is UNDEFINED in the
  # design (open question) — do not assert a specific post-reject status here.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Rejecting a merge cancels it and keeps the sources distinct (AC-07)
    Given a merge is pending counter-confirmation
    And I am a Back Office / Risk reviewer who did not initiate the merge
    When I counter-confirm with decision "Reject" and a rationale note
    Then the merge is cancelled
    And the survivor and source Partners remain distinct
    And the rejection is recorded with audit evidence
```
