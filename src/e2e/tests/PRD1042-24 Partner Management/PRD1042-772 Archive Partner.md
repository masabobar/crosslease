# PRD1042-772 — US 13.25 | Partner Management | Archive Partner (Referential Integrity Preserved)

Generated: 2026-07-09
Story: PRD1042-772 — US 13.25 | Partner Management | Archive Partner (Referential Integrity Preserved)
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (12 ACs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 9 of 12 | Blocked: 0 | Excluded: 3 (edge-case / separate-feature — scope filter table only)
Figma design: Node 235:28534, file PQVvNvRcoFac0zdHGaLWCg — Screen "Archive Partner action + reference-check panel" (Stage 2 PARTIAL — linked node is the 5th E13 scope-legend card, not a screen frame; the ARCHIVE action, "Active references found", and DOWNSTREAM IMPACT (Contracts/Financings affected) cluster are corroborated in the real 764 frame at node 21:11234. Scenarios driven from ACs.)

---

## AC Scope Filter

| AC    | Description                                                                                                | Classification     | Rationale                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| AC-01 | FO archives a Partner with reference check = Clear and an Archival Reason → transitions to Archived        | `happy-path`       | Core success flow — the archival Scenario                                                                 |
| AC-02 | Archived state preserves historical references and audit trail (no hard delete)                            | `happy-path`       | Asserted in the happy-path Scenario (references still resolve, audit entry written)                       |
| AC-03 | Archival Reason is mandatory and recorded on the lifecycle event                                           | `happy-path`       | Captured and asserted within the AC-01 happy-path flow                                                    |
| AC-04 | Active-Reference Check Result enum (Clear / Blocked), system-computed at archival time                     | `happy-path`       | Clear branch covered in AC-01; Blocked branch covered in AC-05                                            |
| AC-05 | Archival blocked where active operational references exist (check = Blocked); blocking reasons surfaced    | `main-error`       | Referential-integrity guard — directly blocks the core action                                             |
| AC-06 | Archiving a risk-sensitive-role-bearing Partner is held for BO/Risk Four-Eyes counter-confirmation         | `main-error`       | Governance guard — single-actor archival of a risk-role Partner is not permitted                          |
| AC-07 | Four-Eyes: counter-confirmer must differ from the initiator (same actor cannot initiate + counter-confirm) | `main-error`       | RefiNext Four-Eyes domain rule — auto-applied SoD negative; traces to AC-06                               |
| AC-08 | Re-archiving an already-Archived Partner is idempotent (no-op)                                             | `main-error`       | Invalid/redundant state transition — must not double-archive or error hard                                |
| AC-09 | Role gating: only FO initiates archival; only BO/Risk counter-confirms; all others → 403                   | `main-error`       | RefiNext role-based access domain rule — auto-applied negative                                            |
| AC-10 | PartnerArchived event emitted → Notification bus + Audit Trail (E31 Part A)                                | `edge-case`        | System/event emission — internal, asserted indirectly via the audit assertion in AC-02; no dedicated E2E  |
| AC-11 | Reference check reflects the current linkage state at archival time (NFR)                                  | `edge-case`        | Non-functional consistency/timing requirement, not a discrete E2E functional assertion                    |
| AC-12 | Hard-delete of an Archived Partner is rejected                                                             | `separate-feature` | Belongs to US 13.26 (hard-delete rejection); Archive Partner only preserves — it does not test the reject |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-10, AC-11, AC-12

---

## Scenarios summary

| Tag           | Scenario                                                                        | AC                         | Priority | E2E                                                         |
| ------------- | ------------------------------------------------------------------------------- | -------------------------- | -------- | ----------------------------------------------------------- |
| `@happy-path` | FO archives a Partner with no active references and an Archival Reason          | AC-01, AC-02, AC-03, AC-04 | P0       | ⚙️ needs seeded Confirmed Partner with zero active refs     |
| `@main-error` | Archival is blocked when active references exist; blocking reasons surfaced     | AC-05, AC-04               | P0       | ⚙️ needs seeded Partner with active Contract/Financing refs |
| `@main-error` | Risk-role Partner is held for BO/Risk Four-Eyes, not archived by a single actor | AC-06                      | P0       | ⚙️ needs seeded risk-role-bearing Partner                   |
| `@main-error` | Same user cannot both initiate and counter-confirm archival (Four-Eyes SoD)     | AC-07                      | P0       | ⚙️ needs seeded risk-role Partner + initiated archival      |
| `@main-error` | Re-archiving an already-Archived Partner is idempotent (no-op)                  | AC-08                      | P1       | ⚙️ needs seeded Archived Partner                            |
| `@main-error` | Unauthorised roles cannot archive or counter-confirm (403)                      | AC-09                      | P0       | ⚙️ needs seeded Partner fixture                             |

Active scenario blocks: 6 (1 Outline + 5 Scenarios)
E2E automation candidates: 0 of 6 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.25 @p0
Feature: Archive Partner — Referential Integrity Preserved (US 13.25 — PRD1042-772)
  As a Front Office case worker
  I want to archive a Partner that has no active operational references
  So that lifecycle termination preserves referential integrity per CP-12

  Background:
    Given I am logged in as a Front Office case worker
    And a Confirmed Partner "P-100" exists in my tenant

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-03, AC-04
  # FO archives a Partner whose pre-archival active-reference check returns Clear.
  # A mandatory Archival Reason is captured on the lifecycle event; the Partner
  # transitions to Archived; historical references and the audit trail remain
  # intact (Archived is a lifecycle state, not a hard delete).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-03 @ac-04 @p0
  Scenario: FO archives a Partner with no active references and an Archival Reason (AC-01, AC-02, AC-03, AC-04)
    Given Partner "P-100" bears no risk-sensitive role
    And the pre-archival active-reference check for "P-100" returns "Clear"
    When I archive "P-100" with Archival Reason "Counterparty relationship ended"
    Then the Partner status should become "Archived"
    And the Archival Reason "Counterparty relationship ended" should be recorded on the lifecycle event
    And the historical references of "P-100" should still resolve
    And an audit entry recording the archiving actor, reason, and reference-check result should exist

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05, AC-04
  # The referential-integrity guard: when the pre-archival check finds active
  # operational references (Contracts / Financings / Requests), archival is
  # blocked and the blocking reasons are surfaced to the user.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @ac-04 @p0
  Scenario: Archival is blocked when active references exist (AC-05, AC-04)
    Given Partner "P-100" has an active Contract reference
    And the pre-archival active-reference check for "P-100" returns "Blocked"
    When I attempt to archive "P-100" with Archival Reason "Cleanup"
    Then the archival should be rejected
    And the Partner status should remain unchanged
    And the blocking active references should be surfaced

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (RefiNext Four-Eyes, auto-applied)
  # A Partner bearing a risk-sensitive role cannot be archived by a single actor.
  # The FO request is held for BO/Risk counter-confirmation — the Partner is not
  # archived until the second actor approves.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Risk-role Partner is held for BO/Risk Four-Eyes, not archived by a single actor (AC-06)
    Given Partner "P-100" bears a risk-sensitive role
    And the pre-archival active-reference check for "P-100" returns "Clear"
    When I archive "P-100" with Archival Reason "Relationship ended"
    Then the archival should be held for BO/Risk counter-confirmation
    And the Partner status should not yet be "Archived"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (RefiNext Four-Eyes SoD, auto-applied)
  # Segregation of duties: the same user cannot both initiate and counter-confirm
  # the archival of a risk-role Partner. Same FO-initiates / BO-Risk-counter-
  # confirms split as US 13.06 / 13.11 / 13.15.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Same user cannot both initiate and counter-confirm archival (AC-07)
    Given Partner "P-100" bears a risk-sensitive role
    And I have initiated the archival of "P-100" as Front Office
    When the same user attempts to counter-confirm the archival
    Then the counter-confirmation should be rejected
    And the Partner status should not become "Archived"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Idempotency: re-archiving a Partner that is already Archived is a no-op —
  # it does not double-archive, does not emit a second lifecycle event, and does
  # not raise a hard error.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p1
  Scenario: Re-archiving an already-Archived Partner is idempotent (AC-08)
    Given Partner "P-100" is already in status "Archived"
    When I attempt to archive "P-100" again
    Then the request should be treated as a no-op
    And the Partner status should remain "Archived"
    And no second PartnerArchived event should be emitted

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09 (RefiNext role-based access, auto-applied)
  # Only FO may initiate archival; only BO/Risk may counter-confirm. Every other
  # role is rejected with 403 at the backend regardless of the UI.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario Outline: Unauthorised roles cannot archive or counter-confirm (AC-09)
    Given I am logged in as <role>
    And a Confirmed Partner "P-100" exists in my tenant
    When I POST to "<endpoint>" for "P-100"
    Then the response status should be 403

    Examples:
      | role         | endpoint                                  |
      | system_admin | /api/partners/P-100/archive               |
      | auditor      | /api/partners/P-100/archive               |
      | back_office  | /api/partners/P-100/archive               |
      | front_office | /api/partners/P-100/archive/counter-confirm |
```
