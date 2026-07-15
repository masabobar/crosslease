# PRD1042-767 — US 13.21 | Partner Management | Compute UBO Completeness Status

Generated: 2026-07-08
Story: PRD1042-767 — US 13.21 | Partner Management | Compute UBO Completeness Status
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (8 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 5 of 8 | Blocked: 0 | Excluded: 3 (edge-case — scope filter table only)
Figma design: None supplied — Stage 2 N/A (system/computation story; the only FE surface is a Complete/Partial/Missing UBO completeness badge on the Partner detail; substance is the computation + Validation Engine consumption)

---

## AC Scope Filter

| AC    | Description                                                                                                                 | Classification | Rationale                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| AC-01 | System computes UBO Completeness Status (Complete / Partial / Missing) from captured direct-ownership records               | `happy-path`   | Core computation; observable via the completeness badge across the three outcomes   |
| AC-02 | No UBO captured for a legal entity requiring it → Status = Missing → Validation Engine Hard Block where required            | `main-error`   | Blocks downstream; Missing → Hard Block is the required-unmet outcome               |
| AC-03 | Partial direct ownership → Status = Partial → Validation Engine Defer where required                                        | `main-error`   | Blocks downstream progression; Partial → Defer                                      |
| AC-04 | Completeness computed from direct ownership only; indirect-ownership notes do NOT satisfy automated completeness            | `main-error`   | Key rule — notes must not raise the computed status (OQ-03)                         |
| AC-05 | Status recomputed on UBO capture/change (near-real-time); badge updates                                                     | `happy-path`   | Recompute-on-change is observable via the badge transitioning                       |
| AC-06 | Status visible to bank-internal roles + Auditor (LC excluded)                                                               | `edge-case`    | Read-only badge visibility; the compute action itself is system ("—" for all roles) |
| AC-07 | Status surfaced to the Validation Engine via service interface (ownership boundary: Partner surfaces, Validation evaluates) | `edge-case`    | Internal service-interface integration — not a manual UI assertion                  |
| AC-08 | Emits UBOCompletenessChanged event (consumers: Validation & Gating Engine, Audit Trail)                                     | `edge-case`    | Internal event emission — integration-level                                         |

**Gherkin generated for:** AC-01, AC-05, AC-02, AC-03, AC-04
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-06, AC-07, AC-08 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                                    | AC           | Priority | E2E                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ------------ | -------- | -------------------------------------------- |
| `@happy-path` | UBO completeness status is computed from direct-ownership records (Scenario Outline — 3 outcomes)           | AC-01        | P0       | ⚙️ needs seeded UBO-ownership fixtures       |
| `@happy-path` | Completeness status is recomputed when UBO ownership changes                                                | AC-05        | P0       | ⚙️ needs seeded Partner + UBO capture        |
| `@main-error` | Validation Engine Defers or Hard Blocks per UBO completeness where required (Scenario Outline — 2 outcomes) | AC-02, AC-03 | P0       | ⚙️ needs seeded fixtures + Validation gating |
| `@main-error` | Indirect-ownership notes do not satisfy automated completeness                                              | AC-04        | P0       | ⚙️ needs seeded partial+notes fixture        |

Active scenario blocks: 4 (2 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.21 @p0
Feature: Compute UBO Completeness Status (US 13.21 — PRD1042-767)
  As the system, surfaced to bank-internal users via a completeness badge
  I want to compute UBO Completeness Status (Complete / Partial / Missing) for a legal-entity Partner
  So that the Validation Engine can Defer or Hard Block where UBO completeness is required and unmet

  Background:
    Given a legal-entity Partner that requires UBO disclosure
    And I am a bank-internal user viewing the Partner detail with the UBO completeness badge

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # The system computes the completeness status from captured direct-ownership
  # records; the badge reflects Complete / Partial / Missing accordingly.
  # Design note: only FE surface is the completeness badge (no design node supplied); steps from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario Outline: UBO completeness status is computed from direct-ownership records (AC-01)
    Given the Partner has "<direct_ownership>" direct UBO ownership captured
    When the UBO completeness status is computed
    Then the completeness badge shows "<status>"

    Examples:
      | direct_ownership              | status   |
      | fully meeting the requirement | Complete |
      | partially captured            | Partial  |
      | none                          | Missing  |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # The status is recomputed near-real-time when UBO ownership is captured or
  # changed; the badge transitions to reflect the new computation.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0
  Scenario: Completeness status is recomputed when UBO ownership changes (AC-05)
    Given the Partner's UBO Completeness Status is "Missing"
    When a direct UBO ownership record is captured that meets the requirement
    Then the status is recomputed
    And the completeness badge updates to "Complete"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-03 (Validation Engine consumption)
  # Where UBO completeness is required, the Validation Engine consumes the status
  # and Hard Blocks on Missing and Defers on Partial.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-03 @p0
  Scenario Outline: Validation Engine Defers or Hard Blocks per UBO completeness where required (AC-02, AC-03)
    Given UBO completeness is required for the Partner
    And the UBO Completeness Status is "<status>"
    When a consuming workflow validates the Partner
    Then the Validation Engine produces "<outcome>"

    Examples:
      | status  | outcome    |
      | Missing | Hard Block |
      | Partial | Defer      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (direct-only computation rule)
  # Completeness is computed from direct-ownership records only; indirect-
  # ownership notes are recorded but must NOT raise the computed status (OQ-03).
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Indirect-ownership notes do not satisfy automated completeness (AC-04)
    Given the Partner has only partial direct ownership plus indirect-ownership notes
    When the UBO completeness status is computed
    Then only the direct-ownership records are counted
    And the indirect-ownership notes do not raise the status to "Complete"
```
