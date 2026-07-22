# PRD1042-760 — US 13.14 | Partner Management | Propose Identity Change on Confirmed Partner

Generated: 2026-07-08
Story: PRD1042-760 — US 13.14 | Partner Management | Propose Identity Change on Confirmed Partner
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (11 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 7 of 11 | Blocked: 0 | Excluded: 4 (3 edge-case + 1 separate-feature — scope filter table only)
Figma design: Node 235:28523, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #2)" (Stage 2 PARTIAL — node is the second E13 scope-legend card, not a screen frame; identity-change form + pre-change impact preview frame not enumerable, MCP truncated to legend cards)

---

## AC Scope Filter

| AC    | Description                                                                                                                                                        | Classification     | Rationale                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------- |
| AC-01 | FO proposes a change to one or more legal Identity Anchors on a Confirmed Partner; recorded as a governed append-only Identity Change Event                        | `happy-path`       | Core success flow; the governed proposal                                                      |
| AC-02 | Target Anchor(s), Proposed Value(s), and Change Reason (mandatory) captured                                                                                        | `happy-path`       | Field capture asserted within the propose flow                                                |
| AC-03 | Non-high-risk anchor change → committed under single-actor governance                                                                                              | `happy-path`       | Commit outcome for the low-risk branch of the happy-path Outline                              |
| AC-04 | High-risk anchor change (driving role Leasing Company / Bank Entity) → pre-change impact preview + held for BO/Risk counter-confirmation (US 13.15), not committed | `happy-path`       | High-risk branch of the happy-path Outline; impact preview is UI-observable                   |
| AC-05 | Only Front Office may propose; Sys Admin / BO/Risk / LC / Power User / Auditor rejected                                                                            | `main-error`       | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403)           |
| AC-06 | Identity anchors are locked in Confirmed/Active; changeable only via this governed path                                                                            | `main-error`       | Anchor-lock guard — direct edit outside the governed path is blocked                          |
| AC-07 | Proposed LEI (ISO 17442) / HRB (Country=DE) format failure → field-level validation error                                                                          | `main-error`       | Invalid anchor format blocks the governed proposal from being recorded (story-critical input) |
| AC-08 | Identity Change Events are append-only; never deleted (CP-9)                                                                                                       | `edge-case`        | Append-only immutability invariant — verified at the data/audit layer                         |
| AC-09 | Emits IdentityChangeProposed event (BO/Risk queue for high-risk, Audit Trail, dedup detection)                                                                     | `edge-case`        | Internal event emission — integration-level                                                   |
| AC-10 | Impact assessment reflects current linkage state at proposal time                                                                                                  | `edge-case`        | Non-functional currency guarantee for the impact assessment — system-level                    |
| AC-11 | Commit re-runs deterministic matching (US 13.03); a new duplicate candidate routes to dedup governance (US 13.08)                                                  | `separate-feature` | Post-commit re-matching + dedup routing owned/tested by US 13.03 / US 13.08                   |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-08, AC-09, AC-10 (edge-case); AC-11 (separate-feature → US 13.08)

---

## Scenarios summary

| Tag           | Scenario                                                                                              | AC                         | Priority | E2E                                              |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------------------------- | -------- | ------------------------------------------------ |
| `@happy-path` | FO proposes a governed identity change, routed by risk (Scenario Outline — non-high-risk + high-risk) | AC-01, AC-02, AC-03, AC-04 | P0       | ⚙️ needs seeded Confirmed Partner                |
| `@main-error` | Only Front Office may propose an identity change (Scenario Outline — 5 roles)                         | AC-05                      | P0       | ⚙️ needs seeded Confirmed Partner + role mapping |
| `@main-error` | Confirmed Partner anchors are locked outside the governed change path                                 | AC-06                      | P0       | ⚙️ needs seeded Confirmed Partner                |
| `@main-error` | Invalid anchor format is rejected with a field-level error (Scenario Outline — LEI, HRB)              | AC-07                      | P0       | ⚙️ needs seeded Confirmed Partner                |

Active scenario blocks: 4 (3 Outlines + 1 Scenario)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.14 @p0
Feature: Propose Identity Change on Confirmed Partner (US 13.14 — PRD1042-760)
  As a Front Office case worker
  I want to propose an Identity Change on a Confirmed Partner's legal anchors
  So that legal identity corrections and updates are governance-recorded

  Background:
    Given I am authenticated in an active tenant with the Partner Management module enabled
    And a Confirmed Partner exists whose legal Identity Anchors are locked

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-03, AC-04
  # FO proposes a change to one or more legal anchors (target anchor, proposed
  # value, mandatory reason). A non-high-risk change commits under single-actor
  # governance; a high-risk change (driving role LC / Bank Entity) shows a
  # pre-change impact preview and is held for BO/Risk counter-confirmation (US 13.15).
  # Design note: identity-change form + impact-preview frames are PARTIAL in Figma; steps from ACs.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-03 @ac-04 @p0
  Scenario Outline: FO proposes a governed identity change, routed by risk (AC-01, AC-02, AC-03, AC-04)
    Given I am authenticated as a Front Office case worker
    When I propose an identity change to a "<risk>" legal anchor with a target anchor, proposed value, and change reason
    Then the proposal is recorded as an append-only Identity Change Event
    And the change is "<commit_state>"
    And "<followup>"

    Examples:
      | risk          | commit_state                                         | followup                                           |
      | non-high-risk | committed under single-actor governance              | no counter-confirmation is required                |
      | high-risk     | held pending BO/Risk counter-confirmation (US 13.15) | a pre-change downstream impact preview is shown    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (role-based access, auto-applied domain rule)
  # Proposing an identity change is backend-enforced and limited to Front Office;
  # every other role is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Only Front Office may propose an identity change (AC-05)
    Given a Confirmed Partner exists
    And I am authenticated as a "<role>" user
    When I attempt to propose an identity change
    Then the request is rejected with HTTP 403
    And no Identity Change Event is recorded

    Examples:
      | role                    |
      | System Admin            |
      | BO/Risk                 |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (anchor locks)
  # A Confirmed Partner's legal anchors are locked; they cannot be edited
  # directly and may change only by proposing a governed Identity Change.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Confirmed Partner anchors are locked outside the governed change path (AC-06)
    Given a Confirmed Partner with locked legal Identity Anchors
    And I am authenticated as a Front Office case worker
    When I attempt to edit a legal anchor directly outside the identity-change proposal path
    Then the edit is blocked
    And the anchor can only be changed by proposing a governed Identity Change

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (anchor format validation)
  # Proposed anchor values are format-validated: an invalid LEI (ISO 17442) or an
  # invalid HRB where Country = DE is rejected field-level and nothing is recorded.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario Outline: Invalid anchor format is rejected with a field-level error (AC-07)
    Given I am a Front Office case worker proposing an identity change
    When I submit "<anchor>" with an invalid format ("<condition>")
    Then a field-level validation error is shown for "<anchor>"
    And no Identity Change Event is recorded

    Examples:
      | anchor | condition                                          |
      | LEI    | fails ISO 17442 length/check-digit validation      |
      | HRB    | invalid Handelsregister format where Country = DE  |
```
