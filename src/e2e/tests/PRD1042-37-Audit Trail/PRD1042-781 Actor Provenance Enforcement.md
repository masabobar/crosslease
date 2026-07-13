# PRD1042-781 — US 26.4 | Audit Trail | Actor Provenance Enforcement & Misattribution Prevention

Generated: 2026-07-10
Story: PRD1042-781 — US 26.4 | Audit Trail | Actor Provenance Enforcement & Misattribution Prevention
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (13 ACs derived from Functional Requirements + Validation Rules + System Behavior + Security Requirements + Edge Cases, description present, stakeholder-reviewed by Philipp Maute / Marko Mrdja, Ready for DEV Review)
ACs with Gherkin scenarios: 8 of 13 | Blocked: 2 (D-AuditQuery, D-SystemHarness) | Excluded: 3 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:11090, file 7EkiVhANXOkn65k0jG4uEJ — Screen "Audit Trail Table (Investigation Surface)" (Stage 2 PARTIAL — read-only table columns Timestamp/Status confirmed; actor_type + principal_id column presence not verifiable within fetched depth; enforcement mechanics are backend-only, no UI surface)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                              | Blocking dependency                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| AC-09 | Verifying that `misattribution_rejected` records persist permanently as evidence requires a read-side audit query API to fetch and assert on the persisted record   | D-AuditQuery — Audit read API surface not yet exposed (US 26.10/26.11 UI)     |
| AC-11 | Simulating a system process attempting to submit `actor_type = manual_user` requires a test harness that impersonates a system service identity at the API boundary | D-SystemHarness — dedicated system-identity test client / service-token forge |

---

## AC Scope Filter

| AC    | Description                                                                                                                                                                                                     | Classification     | Rationale                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| AC-01 | `actor_type` is a closed enumeration: `manual_user`, `system_scheduler`, `system_dd_counter`, `system_propagation`, `integration_callback`, `system_lifecycle`, `migration`                                     | `happy-path`       | Core provenance guarantee — writes with each enum value succeed; unknown values rejected                              |
| AC-02 | `manual_user` events require a `principal_id` resolving to a registered human user; `actorRoleAtTimeOfAction` captured at event time                                                                            | `happy-path`       | Happy path for human-attributed audit records; principal resolution + role capture                                    |
| AC-03 | System events carry appropriate system `actor_type` + system service identity as `principal_id`; must never carry `manual_user`                                                                                 | `happy-path`       | System-service attribution correctness — asserts the positive contract for automated events                           |
| AC-04 | Enumeration expansion requires formal governance approval; undocumented values are a compliance defect                                                                                                          | `separate-feature` | Governance workflow / schema change process — covered by governance-approval story, not this enforcement story        |
| AC-05 | Validation: `actor_type` must be a member of the closed enumeration; unknown values rejected                                                                                                                    | `main-error`       | Directly blocks unauthorized audit write; regulatory-critical validation                                              |
| AC-06 | Validation: if `actor_type = manual_user`, `principal_id` must resolve to a registered human; unresolvable → reject                                                                                             | `main-error`       | Blocks misattribution via unresolvable human principal; primary provenance defense                                    |
| AC-07 | Validation: system process submitting `actor_type = manual_user` → event rejected + `misattribution_rejected` evidence record written (`actor_type = system_lifecycle`, `actionType = misattribution_rejected`) | `main-error`       | Core misattribution defense; happy-path-of-error — the write itself must fail AND persist a permanent evidence record |
| AC-08 | Canonical example: `payment_default_flag_raised` stored with `actor_type = system_dd_counter`, never retrievable as `manual_user` (AC-AT-P1)                                                                    | `main-error`       | Provenance-sensitive canonical case; asserts read-side that a system event is never returned as human                 |
| AC-09 | Misattribution-attempt records persist permanently as evidence                                                                                                                                                  | `Blocked`          | Depends on D-AuditQuery (audit read API to fetch persisted evidence)                                                  |
| AC-10 | Provenance validation is server-authoritative; emitting epics cannot override `actor_type` assignment rules                                                                                                     | `main-error`       | Client-injected `actor_type` on FE-controlled request is ignored / overridden by server                               |
| AC-11 | System service identities are segregated from human principal identifiers                                                                                                                                       | `Blocked`          | Depends on D-SystemHarness (a test client capable of authenticating as a system service identity)                     |
| AC-12 | Provenance resolution adds negligible latency; must not exceed platform-configured maximum write latency                                                                                                        | `edge-case`        | Non-functional performance requirement — verified by load/perf tests, not E2E BDD                                     |
| AC-13 | Rate lock expiry → `system_scheduler`; disbursement confirmation callback → `integration_callback`; risk/score cascade → `system_propagation`                                                                   | `edge-case`        | Internal service wiring — each producer is verified in its own story (US 26.6 system-generated attribution consumer)  |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-05, AC-06, AC-07, AC-08, AC-10
**Blocked (no Gherkin):** AC-09, AC-11
**No Gherkin (edge-case or separate-feature):** AC-04, AC-12, AC-13

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.** Never interleave.

| Tag           | Scenario                                                                                                    | AC    | Priority | E2E                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ----- | -------- | --------------------------------------- |
| `@happy-path` | Every closed-enum `actor_type` is accepted on audit write (Scenario Outline — 7 variants)                   | AC-01 | P0       | ⚙️ needs D-SystemHarness                |
| `@happy-path` | Manual user action persists `principal_id` + `actorRoleAtTimeOfAction` (Scenario Outline — 3 role variants) | AC-02 | P0       | ⚙️ needs D-AuditQuery                   |
| `@happy-path` | System-emitted event carries system service identity as `principal_id`                                      | AC-03 | P0       | ⚙️ needs D-AuditQuery + D-SystemHarness |
| `@main-error` | Audit write with `actor_type` outside closed enumeration is rejected                                        | AC-05 | P0       | ⚙️ needs D-SystemHarness                |
| `@main-error` | `manual_user` write with unresolvable `principal_id` is rejected                                            | AC-06 | P0       | ⚙️ needs D-AuditQuery                   |
| `@main-error` | System process attempting `actor_type = manual_user` is rejected and misattribution evidence is written     | AC-07 | P0       | ⚙️ needs D-SystemHarness + D-AuditQuery |
| `@main-error` | `payment_default_flag_raised` is never retrievable as `manual_user`                                         | AC-08 | P0       | ⚙️ needs D-AuditQuery                   |
| `@main-error` | Client-supplied `actor_type` on FE-controlled request cannot override server-assigned value                 | AC-10 | P0       | ✅                                      |

Active scenario blocks: 8 (2 Outlines + 6 Scenarios)
E2E automation candidates: 1 of 8 scenarios ✅

---

## Feature file

```gherkin
@audit-trail @us-26.4 @p0
Feature: Actor Provenance Enforcement & Misattribution Prevention (US 26.4 — PRD1042-781)
  As an Auditor
  I want every audit record to carry a verified actor_type from a closed enumeration
  So that system-generated events can never be misattributed to human users
    and provenance is legally defensible

  Background:
    Given the audit trail service is running
    And the closed actor_type enumeration is: manual_user, system_scheduler, system_dd_counter, system_propagation, integration_callback, system_lifecycle, migration
    And provenance validation is enforced server-side (not overridable by emitting epics)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Every value in the closed actor_type enumeration is a valid input on an
  # audit write. This locks the enumeration surface: writing with any of the
  # seven approved values must succeed; adding a new value is a governed
  # schema change (AC-04 — out of scope for this story).
  # Design gap: no UI surface — enforcement is at the audit write API.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario Outline: Every closed-enum actor_type is accepted on audit write (AC-01)
    Given the appropriate principal_id or system service identity for <actor_type> is provided
    When an audit event is submitted with actor_type "<actor_type>"
    Then the audit event is accepted and persisted
    And the persisted record carries actor_type "<actor_type>"

    Examples:
      | actor_type            |
      | manual_user           |
      | system_scheduler      |
      | system_dd_counter     |
      | system_propagation    |
      | integration_callback  |
      | system_lifecycle      |
      | migration             |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # A manual_user event MUST resolve principal_id to a registered human and
  # capture actorRoleAtTimeOfAction at the moment of the action. Role at the
  # time of action is captured — role changes after the fact must not
  # retroactively rewrite historical audit records.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0
  Scenario Outline: Manual user action persists principal_id + actorRoleAtTimeOfAction (AC-02)
    Given a registered human user with principal_id "<principal_id>" and role "<role>"
    When that user performs an auditable business action
    And the audit event is written with actor_type "manual_user" and principal_id "<principal_id>"
    Then the audit record is accepted
    And the record's actor_type is "manual_user"
    And the record's principal_id is "<principal_id>"
    And the record's actorRoleAtTimeOfAction is "<role>"

    Examples:
      | principal_id | role         |
      | USR-00001    | system_admin |
      | USR-00042    | front_office |
      | USR-00087    | back_office  |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # A system-emitted event carries the correct system actor_type and a system
  # service identity as principal_id. This is the positive contract: system
  # actors have their own identifier space and MUST NOT reuse a human
  # principal_id (segregation is asserted negatively in AC-11 — blocked).
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario: System-emitted event carries system service identity as principal_id (AC-03)
    Given the risk propagation engine authenticates with system service identity "svc.risk-propagation"
    When the engine emits a score-cascade audit event
    Then the audit event is accepted and persisted
    And the persisted record's actor_type is "system_propagation"
    And the persisted record's principal_id is "svc.risk-propagation"
    And the persisted record's principal_id is NOT a human user identifier
    And the persisted record's actor_type is NOT "manual_user"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # The audit reception surface rejects any actor_type that is not a member
  # of the closed enumeration. This is the schema-level defense: unknown
  # values never make it past validation, regardless of who submitted them.
  # Regulatory-critical — undocumented values are a compliance defect.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Audit write with actor_type outside closed enumeration is rejected (AC-05)
    When an audit event is submitted with actor_type "<invalid_actor_type>"
    Then the audit event is rejected
    And the business transaction does not commit
    And the rejection reason references an invalid actor_type

    Examples:
      | invalid_actor_type |
      | admin              |
      | user               |
      | robot              |
      | system             |
      | anonymous          |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # A manual_user event with an unresolvable principal_id must be rejected.
  # This prevents a human-attributed audit record from being written against
  # a non-existent, deleted, or otherwise unresolvable user identity.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: manual_user write with unresolvable principal_id is rejected (AC-06)
    Given no registered human user exists with principal_id "USR-99999"
    When an audit event is submitted with actor_type "manual_user" and principal_id "USR-99999"
    Then the audit event is rejected
    And the business transaction does not commit
    And the rejection reason indicates the principal_id could not be resolved to a registered human

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (canonical misattribution defense)
  # If a system process submits an event with actor_type = manual_user, the
  # event MUST be rejected AND a permanent evidence record must be written
  # with actor_type = system_lifecycle and actionType = misattribution_rejected.
  # This is the primary provenance safeguard from the spec.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: System process attempting actor_type = manual_user is rejected and misattribution evidence is written (AC-07)
    Given a system process authenticated as system service identity "svc.scheduler"
    When that system process submits an audit event with actor_type "manual_user" and principal_id "USR-00001"
    Then the audit event is rejected
    And the original business transaction does not commit
    And a misattribution-attempt evidence record is written
    And the evidence record's actor_type is "system_lifecycle"
    And the evidence record's actionType is "misattribution_rejected"
    And the evidence record captures the attempted actor_type "manual_user"
    And the evidence record captures the triggering system service identity "svc.scheduler"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08 (canonical provenance-sensitive read-side contract)
  # The payment_default_flag_raised event is stored with actor_type =
  # system_dd_counter and must never be retrievable as manual_user. This
  # asserts the read-side contract: no query filter/lookup can return this
  # record under a human actor_type.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: payment_default_flag_raised is never retrievable as manual_user (AC-08)
    Given the DD-return escalation engine has raised the payment default flag on contract "CTR-0001"
    And the audit trail contains a "payment_default_flag_raised" event for "CTR-0001"
    When the audit query is filtered by actor_type = "manual_user"
    Then the payment_default_flag_raised event for "CTR-0001" is NOT returned
    When the audit query is filtered by actor_type = "system_dd_counter"
    Then the payment_default_flag_raised event for "CTR-0001" IS returned
    And the returned record's principal_id is a system service identity
    And the returned record's principal_id is NOT a human user identifier

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (server-authoritative provenance)
  # A client-supplied actor_type on an FE-controlled request MUST NOT be
  # honored — provenance validation is server-authoritative. Even a manual
  # user with valid credentials cannot inject a system actor_type into a
  # business action they initiate via the UI/API.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0 @e2e-ready
  Scenario: Client-supplied actor_type on FE-controlled request cannot override server-assigned value
    Given I am logged in as a Front Office user with principal_id "USR-00042"
    When I submit a business action to the API with client-supplied actor_type "system_dd_counter"
    Then the persisted audit record's actor_type is "manual_user"
    And the persisted audit record's principal_id is "USR-00042"
    And the persisted audit record's actor_type is NOT "system_dd_counter"
    And the client-supplied actor_type value is discarded by the server
```
