# PRD1042-773 — US 13.26 | Partner Management | Reject Hard Delete of Referenced Partner

Generated: 2026-07-09
Story: PRD1042-773 — US 13.26 | Partner Management | Reject Hard Delete of Referenced Partner
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (9 ACs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 5 of 9 | Blocked: 0 | Excluded: 4 (edge-case / separate-feature — scope filter table only)
Figma design: N/A — no Figma node supplied (system/delete-guard story; the only UI-observable surface per arch notes is the Delete control being disabled/blocked with an explanatory message for referenced Partners. Substance is the backend delete guard + security audit event. Stage 2 N/A.)

---

## AC Scope Filter

| AC    | Description                                                                                                          | Classification     | Rationale                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Hard-delete of a Partner with historical operational references is rejected; the canonical identity is never removed | `happy-path`       | Core guard success flow — the rejection Scenario Outline (across operational reference types)                       |
| AC-02 | HardDeleteAttempted security audit event is emitted on every delete attempt                                          | `happy-path`       | Central security deliverable of this story — asserted in its own Scenario                                           |
| AC-03 | Referenced Partners can only be archived, not hard-deleted (archival path)                                           | `separate-feature` | The archival path is US 13.25 (PRD1042-772); this story only rejects the delete                                     |
| AC-04 | Delete Attempt Outcome enum = Rejected (always, for referenced Partners)                                             | `happy-path`       | Deterministic outcome asserted within the AC-01 rejection flow                                                      |
| AC-05 | Fail-closed, backend-enforced, no override path (even privileged roles cannot force the delete)                      | `main-error`       | Security guard — verifies there is no bypass even for a privileged actor                                            |
| AC-06 | FE Delete control is disabled/blocked for referenced Partners with an explanatory message                            | `happy-path`       | The only UI-observable surface — control-disabled state + explanatory message                                       |
| AC-07 | GDPR erasure defers to GwG/MaRisk retention precedence (CP-12); conflict resolution is audit-recorded                | `separate-feature` | Erasure execution mechanics owned by the Löschkonzept epic; Partner Management enforces precedence only; OQ-08 open |
| AC-08 | Rejection is deterministic and immediate (NFR)                                                                       | `edge-case`        | Non-functional performance/determinism requirement, not a discrete E2E functional assertion                         |
| AC-09 | Audit-trail-only references must NOT block hard-delete — only OPERATIONAL references block                           | `edge-case`        | Boundary pending an OPEN rule confirmation (Philipp Maute); asserting it now would encode an unconfirmed rule       |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-05, AC-06
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-03, AC-07, AC-08, AC-09

---

## Scenarios summary

| Tag           | Scenario                                                                                   | AC           | Priority | E2E                                             |
| ------------- | ------------------------------------------------------------------------------------------ | ------------ | -------- | ----------------------------------------------- |
| `@happy-path` | Hard-delete of a Partner with an operational reference is rejected (Outline — 5 ref types) | AC-01, AC-04 | P0       | ⚙️ needs seeded referenced Partner fixtures     |
| `@happy-path` | Every hard-delete attempt emits a HardDeleteAttempted security audit event                 | AC-02        | P0       | ⚙️ needs seeded referenced Partner + audit read |
| `@happy-path` | Delete control is disabled with an explanatory message for a referenced Partner            | AC-06        | P1       | ⚙️ needs seeded referenced Partner fixture      |
| `@main-error` | No override path — even a privileged Sys Admin cannot hard-delete a referenced Partner     | AC-05        | P0       | ⚙️ needs seeded referenced Partner + sys admin  |

Active scenario blocks: 4 (1 Outline + 3 Scenarios)
E2E automation candidates: 0 of 4 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.26 @p0
Feature: Reject Hard Delete of Referenced Partner (US 13.26 — PRD1042-773)
  As the system
  I want to reject hard delete of any Partner with historical operational references
  So that referential integrity and regulatory retention are protected per CP-12

  Background:
    Given a Partner "P-200" exists with a historical operational reference

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-04
  # The core delete guard: a hard-delete attempt on a Partner that carries any
  # operational reference (contract / financing / request / KYC / regulatory
  # reporting) is rejected. The canonical identity is never removed and the
  # deterministic outcome is "Rejected".
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-04 @p0
  Scenario Outline: Hard-delete of a Partner with an operational reference is rejected (AC-01, AC-04)
    Given Partner "P-200" has an active "<reference_type>" reference
    When a hard-delete of "P-200" is attempted
    Then the delete should be rejected
    And the Delete Attempt Outcome should be "Rejected"
    And the Partner "P-200" should still exist

    Examples:
      | reference_type       |
      | Contract             |
      | Financing            |
      | Request              |
      | KYC                  |
      | Regulatory Reporting |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # Security audit: every hard-delete attempt — including a rejected one —
  # emits a HardDeleteAttempted event recording the attempting actor, the
  # target Partner, the rejection, and the reference evidence.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0
  Scenario: Every hard-delete attempt emits a HardDeleteAttempted security audit event (AC-02)
    When a hard-delete of "P-200" is attempted
    Then a "HardDeleteAttempted" security audit event should be emitted
    And the event should record the attempting actor and the target Partner "P-200"
    And the event should record the rejection and the reference evidence

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # The only UI-observable surface: for a referenced Partner the Delete control
  # is disabled/blocked and an explanatory message is shown. (No Figma node
  # supplied — behaviour taken from the architectural notes.)
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p1
  Scenario: Delete control is disabled with an explanatory message for a referenced Partner (AC-06)
    Given I am viewing the detail of the referenced Partner "P-200"
    Then the Delete control should be disabled
    And an explanatory message should indicate the Partner cannot be deleted while references exist

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (fail-closed, no override)
  # There is no override path: even a privileged Sys Admin attempting the delete
  # directly (bypassing the disabled UI) is rejected fail-closed by the backend,
  # and the attempt is still audited.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario: No override path — even a privileged Sys Admin cannot hard-delete a referenced Partner (AC-05)
    Given I am logged in as a System Administrator
    When I POST to "/api/partners/P-200/hard-delete"
    Then the delete should be rejected
    And the Partner "P-200" should still exist
    And a "HardDeleteAttempted" security audit event should be emitted
```
