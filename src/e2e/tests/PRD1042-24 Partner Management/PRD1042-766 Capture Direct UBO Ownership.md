# PRD1042-766 — US 13.20 | Partner Management | Capture Direct UBO Ownership

Generated: 2026-07-08
Story: PRD1042-766 — US 13.20 | Partner Management | Capture Direct UBO Ownership
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (8 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 5 of 8 | Blocked: 0 | Excluded: 3 (1 separate-feature + 2 edge-case — scope filter table only)
Figma design: Node 235:28523, file PQVvNvRcoFac0zdHGaLWCg — Screen "E13 · Partner Management (scope-legend card #2)" (Stage 2 PARTIAL — node is the second E13 scope-legend card, not a screen frame; UBO capture panel not enumerable, but the "ADD UBO OWNER" entry-point action is confirmed present in the real design frame node 21:11234)

---

## AC Scope Filter

| AC    | Description                                                                                                                                | Classification     | Rationale                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------- |
| AC-01 | FO links a Confirmed natural-person Partner as a direct UBO of a legal-entity Partner with ownership % + Type=Direct → UBO record captured | `happy-path`       | Core success flow; the direct-UBO capture (GwG §3 disclosure)                       |
| AC-02 | UBO Partner (natural-person ref, must be Confirmed) M; Ownership % M; Ownership Type=Direct M; Indirect Notes O                            | `happy-path`       | Field capture asserted within the capture flow                                      |
| AC-03 | UBO target must be a Confirmed natural-person Partner; if not Confirmed → blocked until confirmed                                          | `main-error`       | Precondition guard — blocks capture until the UBO Partner is Confirmed              |
| AC-04 | Indirect / multi-layer ownership captured as structured notes only, not auto-traversed (November; OQ-03 deferred)                          | `main-error`       | Scope-limit behavior — system must NOT auto-traverse; records notes instead         |
| AC-05 | Only Front Office may capture direct UBO ownership; Sys Admin / BO/Risk / LC / Power User / Auditor rejected                               | `main-error`       | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403) |
| AC-06 | UBO record feeds UBO Completeness computation (US 13.21)                                                                                   | `separate-feature` | UBO completeness owned/tested by US 13.21                                           |
| AC-07 | Emits UBOCaptured event (consumers: UBO completeness, Audit Trail)                                                                         | `edge-case`        | Internal event emission — integration-level                                         |
| AC-08 | UBO capture persisted with capturing actor and timestamp                                                                                   | `edge-case`        | Non-functional persistence/audit guarantee — system-level                           |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-06 (separate-feature → US 13.21); AC-07, AC-08 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                    | AC           | Priority | E2E                                     |
| ------------- | ------------------------------------------------------------------------------------------- | ------------ | -------- | --------------------------------------- |
| `@happy-path` | FO captures a direct UBO by linking a Confirmed natural person with an ownership percentage | AC-01, AC-02 | P0       | ⚙️ needs seeded Confirmed Partners      |
| `@main-error` | A UBO target that is not Confirmed is blocked                                               | AC-03        | P0       | ⚙️ needs seeded non-Confirmed Partner   |
| `@main-error` | Indirect / multi-layer ownership is captured as structured notes only, not auto-traversed   | AC-04        | P0       | ⚙️ needs seeded Confirmed Partners      |
| `@main-error` | Only Front Office may capture direct UBO ownership (Scenario Outline — 5 roles)             | AC-05        | P0       | ⚙️ needs seeded Partners + role mapping |

Active scenario blocks: 4 (1 Outline + 3 Scenarios)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.20 @p0
Feature: Capture Direct UBO Ownership (US 13.20 — PRD1042-766)
  As a Front Office case worker
  I want to capture direct UBO ownership for a legal-entity Partner by linking a natural-person Partner with an ownership percentage
  So that GwG §3 UBO disclosure obligations are recorded

  Background:
    Given I am authenticated as a Front Office case worker in an active tenant with the Partner Management module enabled
    And a Confirmed legal-entity Partner is open on the UBO capture panel

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # FO uses the ADD UBO OWNER action to link a Confirmed natural-person Partner
  # as a direct UBO with an ownership percentage and Ownership Type = Direct; a
  # UBO ownership record is captured on the legal-entity Partner.
  # Design note: UBO capture panel is PARTIAL in Figma; ADD UBO OWNER action confirmed in frame 21:11234.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario: FO captures a direct UBO by linking a Confirmed natural person with an ownership percentage (AC-01, AC-02)
    Given a Confirmed natural-person Partner exists
    When I add a UBO owner linking that natural-person Partner with an ownership percentage and Ownership Type "Direct"
    Then a UBO ownership record is captured on the legal-entity Partner
    And the record shows the UBO Partner reference, the ownership percentage, and Ownership Type "Direct"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (Confirmed-target precondition)
  # A natural-person Partner must be Confirmed before it can be linked as a UBO;
  # an unconfirmed target is blocked until confirmed.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: A UBO target that is not Confirmed is blocked (AC-03)
    Given the natural-person Partner to link as UBO is not yet Confirmed
    When I attempt to capture it as a direct UBO
    Then the capture is blocked
    And I am required to confirm the natural-person Partner before it can be linked as a UBO

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (November scope limit)
  # Indirect / multi-layer ownership is recorded as structured notes only; the
  # ownership chain is NOT automatically traversed or computed (deferred, OQ-03).
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Indirect / multi-layer ownership is captured as structured notes only, not auto-traversed (AC-04)
    Given the ownership structure has an indirect / multi-layer chain
    When I record the indirect ownership
    Then it is captured as structured Indirect-ownership Notes on the UBO record
    And the ownership chain is not automatically traversed or computed

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (role-based access, auto-applied domain rule)
  # Capturing direct UBO ownership is backend-enforced and limited to Front
  # Office; every other role is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Only Front Office may capture direct UBO ownership (AC-05)
    Given a Confirmed legal-entity Partner and a Confirmed natural-person Partner
    And I am authenticated as a "<role>" user
    When I attempt to capture a direct UBO ownership record
    Then the request is rejected with HTTP 403
    And no UBO ownership record is captured

    Examples:
      | role                    |
      | System Admin            |
      | BO/Risk                 |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |
```
