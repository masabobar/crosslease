# PRD1042-759 — US 13.13 | Partner Management | Reconstruct Full Merge History

Generated: 2026-07-08
Story: PRD1042-759 — US 13.13 | Partner Management | Reconstruct Full Merge History
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (9 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 6 of 9 | Blocked: 0 | Excluded: 3 (edge-case — scope filter table only)
Figma design: Node 235:28523, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #2)" (Stage 2 PARTIAL — node is the second E13 scope-legend card, not a screen frame; Auditor read-only merge-history tab frame not enumerable, MCP truncated to legend cards)

---

## AC Scope Filter

| AC    | Description                                                                                                                                                             | Classification | Rationale                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Auditor reconstructs the complete merge history from the Audit Trail alone: source anchor snapshots, reason codes, Four-Eyes actor evidence, integrity outcomes (CP-13) | `happy-path`   | Core success flow; the audit reconstruction                                                                                |
| AC-02 | Merge Lineage Chain (survivor ↔ merged-source(s) with snapshots) reconstructed, including multi-source 1:N                                                              | `happy-path`   | Lineage content asserted in the happy-path Outline (single-source + multi-source variants)                                 |
| AC-03 | Four-Eyes Evidence (initiator + counter-confirmer per merge) present in the reconstruction                                                                              | `happy-path`   | Governance evidence asserted alongside AC-01/AC-02                                                                         |
| AC-04 | Reconstruction is read-only; no state mutation                                                                                                                          | `main-error`   | Integrity guarantee — the view exposes no mutating actions and leaves state unchanged                                      |
| AC-05 | Role gating per matrix: only Auditor + System Admin (read-only) + Power User (diagnostic) may reconstruct; FO/BO/LC denied                                              | `main-error`   | Role-based-access domain rule → 1 auto negative scenario (denied roles → 403); based on the MATRIX (design not yet locked) |
| AC-06 | Querying a merged-source Partner directly returns Merged state + forward reference to the survivor                                                                      | `main-error`   | Alternative query outcome; blocks direct use of the stale source record                                                    |
| AC-07 | Reconstruction must not depend on live operational state; append-only invariants protected                                                                              | `edge-case`    | System invariant — verified at the audit/data layer, not a manual UI assertion                                             |
| AC-08 | Auditor scoped to assigned tenant within engagement window; access session-audited                                                                                      | `edge-case`    | Tenant/engagement-window scoping + session-audit logging — integration-level, needs time/tenant setup                      |
| AC-09 | Reconstruction query returns within report-generation SLA                                                                                                               | `edge-case`    | Non-functional performance/timing target — not a deterministic manual assertion                                            |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-07, AC-08, AC-09 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                                    | AC                  | Priority | E2E                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ------------------------------------- |
| `@happy-path` | Auditor reconstructs the full merge history from the Audit Trail (Scenario Outline — single + multi-source) | AC-01, AC-02, AC-03 | P0       | ⚙️ needs seeded merge-history fixture |
| `@main-error` | Only Auditor / System Admin / Power User may reconstruct merge history (Scenario Outline — 3 denied roles)  | AC-05               | P0       | ⚙️ needs seeded merge-history fixture |
| `@main-error` | Querying a merged-source Partner directly returns Merged state + forward reference                          | AC-06               | P0       | ⚙️ needs seeded merged-source fixture |
| `@main-error` | Merge-history reconstruction is read-only and mutates no state                                              | AC-04               | P0       | ⚙️ needs seeded merge-history fixture |

Active scenario blocks: 4 (2 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.13 @p0
Feature: Reconstruct Full Merge History (US 13.13 — PRD1042-759)
  As an auditor
  I want to reconstruct the full merge history of a Partner from the Audit Trail
  So that compliance reconstruction is independent of live operational state

  Background:
    Given I am authenticated in an active tenant with the Partner Management module enabled
    And a surviving Partner has a completed merge lineage recorded in the Audit Trail

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-03
  # An auditor opens the read-only merge-history view and reconstructs the full
  # lineage from the Audit Trail alone: survivor↔source chain with anchor
  # snapshots, merge reason codes, Four-Eyes actor evidence, and integrity
  # outcomes — for both single-source and multi-source (1:N) survivors.
  # Design note: merge-history tab frame is PARTIAL in Figma; steps driven from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-03 @p0
  Scenario Outline: Auditor reconstructs the full merge history from the Audit Trail (AC-01, AC-02, AC-03)
    Given a surviving Partner was formed from a "<lineage>" merge
    And I am authenticated as an Auditor
    When I open the read-only merge-history view for the surviving Partner
    Then the full merge lineage chain is reconstructed from the Audit Trail
    And each merged source shows its Identity Anchor snapshot and merge reason code
    And each merge shows Four-Eyes evidence (initiating and counter-confirming actors)
    And integrity outcomes are shown for the reconstruction

    Examples:
      | lineage                    |
      | single-source (1:1)        |
      | multi-source (1:N)         |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (role-based access, auto-applied domain rule)
  # Reconstruction is scoped by the 13.13 matrix to Auditor + System Admin
  # (read-only) + Power User (diagnostic). Front Office, BO/Risk and LC User are
  # denied. NOTE: the current Figma tab visibility (FO/BO/Admin) does NOT match
  # this matrix — visibility is an open design question; scenarios follow the MATRIX.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Disallowed roles cannot reconstruct merge history (AC-05)
    Given a surviving Partner has a completed merge lineage
    And I am authenticated as a "<role>" user
    When I attempt to open the merge-history reconstruction
    Then the request is rejected with HTTP 403
    And no merge-history data is returned

    Examples:
      | role         |
      | Front Office |
      | BO/Risk      |
      | LC User      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (merged-source direct query)
  # Querying a merged (non-survivor) source Partner directly does not return the
  # full active record; it returns the Merged state plus a forward reference to
  # the surviving Partner.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Querying a merged-source Partner directly returns Merged state and a forward reference (AC-06)
    Given a Partner was merged into a surviving Partner
    And I am authenticated as an Auditor
    When I query the merged-source Partner directly
    Then the response reports the Partner as "Merged"
    And it includes a forward reference to the surviving Partner

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (read-only integrity)
  # The reconstruction is strictly read-only: the view offers no mutating actions
  # and reconstructing the history changes no Partner or lineage state.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Merge-history reconstruction is read-only and mutates no state (AC-04)
    Given I am authenticated as an Auditor viewing a surviving Partner's merge history
    When I reconstruct the merge history
    Then the view offers no actions that mutate Partner or lineage state
    And no Partner, lineage, or Audit Trail record is modified by the reconstruction
```
