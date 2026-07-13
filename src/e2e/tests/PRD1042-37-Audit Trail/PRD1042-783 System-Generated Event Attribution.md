# PRD1042-783 — US 26.6 | AUDIT TRAIL | System-Generated Event Attribution

Generated: 2026-07-10
Story: PRD1042-783 — US 26.6 | AUDIT TRAIL | System-Generated Event Attribution
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (15 ACs derived from Functional Requirements + Validation Rules + System Behavior + Edge Cases, description present, stakeholder-reviewed by Philipp Maute + Marko Mrdja + Iva Marković, Jira status: Ready for DEV Review)
ACs with Gherkin scenarios: 5 of 15 | Blocked: 5 (US 26.02 idempotency, US 26.15 investigation surface, US 26.16 Financing coverage, US 26.20 outbox, D-Audit-Read-API) | Excluded: 5 (edge-case implementation-detail or separate-feature per Marko 37521 + Philipp 35591 smart-cuts)
Figma design: Node 1:11090 in file 7EkiVhANXOkn65k0jG4uEJ ("E26 -- Audit Trail") — Stage 2 FAILED (Figma quota exhausted on Professional View seat; MCP tool limit reached). Design-blind proceed — US 26.6 is a **backend attribution/provenance story** with no UI surface in MVP per Marko Mrdja comment 37521 (2026-06-18) "attribution is a convention, not infrastructure — any automated process sets actor_type + trigger_source when calling the audit service".

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                               | Blocking dependency                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| AC-02 | DD counter threshold events (`system_dd_counter` → `payment_default_flag_raised`) — DD-Counter engine not built in MVP; enum value reserved but not emitted per Philipp smart-cut #5 (comment 35591, approved 35785) | US 26.16/17 backlog — DD-Counter engine (post-November)                                       |
| AC-03 | Risk/score propagation cascades (`system_propagation`) — Risk-Propagation engine not built in MVP; enum value reserved but not emitted per Philipp smart-cut #5 (comment 35591)                                      | US 26.16 backlog — Risk-Propagation engine (post-November)                                    |
| AC-14 | Integration callback arrives twice → idempotency via `correlationId`, duplicate rejected                                                                                                                             | US 26.02 — Idempotency infrastructure (Audit Trail companion story)                           |
| AC-15 | Propagation cascade exceeds synchronous capacity → routed via durable outbox, ordering preserved by `chainSequence`                                                                                                  | US 26.20 backlog — Durable Outbox Pattern (post-November hardening per Philipp comment 37245) |
| AC-11 | `payment_default_flag_raised` retrieval query (must not surface as `manual_user`) — requires Audit-Read API from US 26.15 Investigation Surface                                                                      | US 26.15 Investigation Surface + D-Audit-Read-API                                             |

---

## AC Scope Filter

| AC    | Description                                                                                                                                                              | Classification     | Rationale                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Scheduler-triggered events (rate lock expiry, pre-expiry notification, retention evaluation) carry `actor_type = system_scheduler`                                       | `happy-path`       | Active MVP actor_type — scheduler jobs run; assertion via audit-record read after triggering scheduler event                                                     |
| AC-02 | DD return counter threshold events carry `actor_type = system_dd_counter` (canonical `payment_default_flag_raised`)                                                      | `Blocked`          | Enum value reserved but not emitted in MVP (DD-Counter engine deferred to V2 per Philipp smart-cut #5 approved 35785); reactivate when US 26.16/17 lands         |
| AC-03 | Risk/score propagation cascades carry `actor_type = system_propagation`                                                                                                  | `Blocked`          | Enum value reserved but not emitted in MVP (Risk-Propagation engine deferred to V2 per Philipp smart-cut #5); reactivate when US 26.16 lands                     |
| AC-04 | External integration callbacks (core banking disbursement confirmation, KYC screening callback, payment receipt) carry `actor_type = integration_callback`               | `happy-path`       | Active MVP actor_type — integration callbacks land; assertion via audit-record read after callback POST                                                          |
| AC-05 | Internal lifecycle automation (Completion Eligible auto-transition, Conditions Pending auto-advance, automatic version creation) carries `actor_type = system_lifecycle` | `happy-path`       | Active MVP actor_type — lifecycle transitions fire; assertion via audit-record read after triggering event                                                       |
| AC-06 | `principal_id` is set to the triggering system service identity, never a human principal (enforced by US 26.04)                                                          | `main-error`       | Negative invariant: no `manual_user` masquerade — testable by asserting `principal_id` on emitted audit records is a system service reference, not a user UUID   |
| AC-07 | `triggerSourceCode` identifies the specific automated source (e.g., `system_dd_counter_job`)                                                                             | `edge-case`        | Implementation detail — string format of trigger source code is validated by BE unit tests; E2E only asserts presence, covered implicitly in AC-01 happy-path    |
| AC-08 | `financingVersionRef` is present on all Financing-domain system events                                                                                                   | `separate-feature` | Explicitly dropped by Marko Mrdja comment 37521 (2026-06-18) — "Financing module doesn't exist yet, add when it ships"; returns with US 26.16 Financing coverage |
| AC-09 | `payment_default_flag_raised` on DD counter threshold stored with `system_dd_counter`, not retrievable as `manual_user` (AC-AT-P1)                                       | `Blocked`          | Same DD-Counter engine dependency as AC-02; reactivate with US 26.16/17                                                                                          |
| AC-10 | Rate lock expiry transition stored with `system_scheduler` (AC-AT-P2)                                                                                                    | `happy-path`       | Subsumed into AC-01 Scheduler Outline (rate lock expiry variant)                                                                                                 |
| AC-11 | Disbursement confirmation callback stored with `integration_callback` (AC-AT-P3), retrieved and asserted                                                                 | `Blocked`          | Retrieval assertion needs Audit-Read API from US 26.15 Investigation Surface + D-Audit-Read-API                                                                  |
| AC-12 | System service identities are authenticated and segregated; no automated path can assume a human session                                                                 | `main-error`       | Negative security invariant: system service token cannot produce audit record with `actor_type = manual_user`                                                    |
| AC-13 | Edge: Scheduler event without resolvable service identity → rejected; provenance enforcement (US 26.04); operations alerted                                              | `main-error`       | Rejection path — unresolved service identity triggers audit-record refusal and ops alert                                                                         |
| AC-14 | Edge: Integration callback arrives twice → idempotency via `correlationId`; duplicate rejected (US 26.02)                                                                | `Blocked`          | Depends on US 26.02 idempotency store — not shipped in this story                                                                                                |
| AC-15 | Edge: Propagation cascade exceeds synchronous capacity → routed via durable outbox (US 26.20); ordering preserved by `chainSequence`                                     | `Blocked`          | Depends on US 26.20 outbox — post-November per Philipp comment 37245                                                                                             |

**Gherkin generated for:** AC-01, AC-04, AC-05, AC-06/AC-12 (merged security invariant), AC-13
**Blocked (no Gherkin):** AC-02, AC-03, AC-09, AC-11, AC-14, AC-15
**No Gherkin (edge-case or separate-feature):** AC-07 (edge-case implementation detail), AC-08 (separate-feature — dropped for MVP), AC-10 (subsumed into AC-01)

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.**

| Tag           | Scenario                                                                                                     | AC           | Priority | E2E                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------ | ------------ | -------- | ----------------------------------------------- |
| `@happy-path` | System-scheduler event carries `actor_type = system_scheduler` (Scenario Outline — 2 scheduler variants)     | AC-01, AC-10 | P0       | ⚙️ needs D-Audit-Read-API + scheduler harness   |
| `@happy-path` | Integration callback carries `actor_type = integration_callback` (Scenario Outline — 2 callback variants)    | AC-04        | P0       | ⚙️ needs D-Audit-Read-API + integration harness |
| `@happy-path` | Lifecycle automation event carries `actor_type = system_lifecycle` (Scenario Outline — 2 lifecycle variants) | AC-05        | P0       | ⚙️ needs D-Audit-Read-API + lifecycle trigger   |
| `@main-error` | System event never carries `manual_user` — `principal_id` is a system service reference                      | AC-06, AC-12 | P0       | ⚙️ needs D-Audit-Read-API                       |
| `@main-error` | Scheduler event without resolvable service identity is rejected and ops-alerted                              | AC-13        | P0       | ⚙️ needs scheduler harness with identity-strip  |

Active scenario blocks: 5 (3 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 5 scenarios ✅ (all require BE test hooks and Audit-Read API — see US 26.15)

---

## Feature file

```gherkin
@audit-trail @us-26.6 @p0
Feature: System-Generated Event Attribution (US 26.6 — PRD1042-783)
  As an Auditor
  I want all scheduler, DD-counter, propagation, integration-callback and lifecycle automation events
    to carry the correct system actor_type
  So that automated state changes are never attributed to human users

  Background:
    Given the Audit Trail service is running and accepting audit-record writes
    And the actor_type enumeration is the closed set defined in US 26.04
      | manual_user           |
      | system_scheduler      |
      | system_dd_counter     |
      | system_propagation    |
      | integration_callback  |
      | system_lifecycle      |
      | migration             |
    And a system service identity exists for each active MVP actor_type
    And the Audit-Read API from US 26.15 Investigation Surface is available for read-back verification

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-10
  # Verifies scheduler-triggered events (rate lock expiry, pre-expiry notification,
  # retention evaluation per US 26.13 / US 26.15 domains) carry actor_type = system_scheduler
  # and a service-identity principal_id, not a human user. Rate lock expiry is called
  # out as AC-AT-P2 and is subsumed here as a scheduler variant.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-10 @p0
  Scenario Outline: Scheduler-triggered event carries actor_type = system_scheduler (AC-01, AC-10)
    Given the "<scheduler_job>" scheduler job is scheduled to fire
    And its triggering service identity is "<service_identity>"
    When the scheduler job fires and emits its state-change event
    And the Audit Trail service records the event
    Then an audit record exists for the "<event_type>" event
    And the audit record's "actor_type" is "system_scheduler"
    And the audit record's "principal_id" equals the service identity "<service_identity>"
    And the audit record's "trigger_source" identifies "<trigger_source_code>"
    And the audit record's "timestamp" is immutable and set at emission time
    And the audit record is INSERT-only at DB level (per Epic 26 §Core Audit Architecture)

    Examples:
      | scheduler_job              | service_identity          | event_type              | trigger_source_code           |
      | rate_lock_expiry_job       | svc.scheduler.ratelock    | rate_lock_expiry        | system_scheduler_rate_lock    |
      | retention_evaluation_job   | svc.scheduler.retention   | retention_evaluation    | system_scheduler_retention    |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # Verifies external integration callbacks (core banking disbursement confirmation
  # per AC-AT-P3, KYC screening callback, payment receipt) carry
  # actor_type = integration_callback and a service-identity principal_id.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0
  Scenario Outline: Integration callback carries actor_type = integration_callback (AC-04)
    Given the "<integration_source>" integration is registered with service identity "<service_identity>"
    When the "<integration_source>" system POSTs a "<callback_event>" callback to RefiNext
    And the callback is authenticated as the registered service identity
    And the Audit Trail service records the callback event
    Then an audit record exists for the "<callback_event>" event
    And the audit record's "actor_type" is "integration_callback"
    And the audit record's "principal_id" equals the service identity "<service_identity>"
    And the audit record's "trigger_source" identifies "<trigger_source_code>"
    And the audit record's "correlation_id" is present for idempotency lookups

    Examples:
      | integration_source     | service_identity            | callback_event            | trigger_source_code                |
      | core_banking_gateway   | svc.integration.corebanking | disbursement_confirmed    | integration_callback_disbursement  |
      | kyc_vendor_gateway     | svc.integration.kyc         | kyc_screening_completed   | integration_callback_kyc           |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Verifies internal lifecycle automation (Completion Eligible auto-transition,
  # Conditions Pending auto-advance, automatic version creation) carries
  # actor_type = system_lifecycle and a service-identity principal_id.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0
  Scenario Outline: Lifecycle automation carries actor_type = system_lifecycle (AC-05)
    Given a business entity is in a state that permits automatic "<transition>"
    And the lifecycle-automation service identity is "svc.lifecycle.automation"
    When the lifecycle engine automatically executes "<transition>"
    And the Audit Trail service records the transition event
    Then an audit record exists for the "<transition>" event
    And the audit record's "actor_type" is "system_lifecycle"
    And the audit record's "principal_id" equals "svc.lifecycle.automation"
    And the audit record's "trigger_source" identifies "<trigger_source_code>"
    And the audit record's "old_value" and "new_value" both reflect the state change

    Examples:
      | transition                     | trigger_source_code                       |
      | completion_eligible_transition | system_lifecycle_completion_eligible      |
      | conditions_pending_auto_advance| system_lifecycle_conditions_pending       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06, AC-12
  # Security invariant: no automated path can produce an audit record attributed to
  # a human user. principal_id on any system-emitted audit record MUST be a system
  # service reference (svc.*), never a user UUID. Enforced application-side per
  # US 26.04 provenance rule; asserted here for every active MVP actor_type.
  # This is Marko Mrdja's "attribution is a convention, not infrastructure" contract
  # (comment 37521, 2026-06-18) — each emitter sets actor_type + trigger_source
  # when calling record(), and the audit service rejects mismatches.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @ac-12 @p0
  Scenario Outline: System-emitted event never carries manual_user attribution (AC-06, AC-12)
    Given the audit service receives a write with "actor_type = <system_actor>"
    When the write is committed and the audit record is emitted
    Then the audit record's "actor_type" is "<system_actor>"
    And the audit record's "actor_type" is NOT "manual_user"
    And the audit record's "principal_id" matches the pattern "svc.*" (service identity)
    And the audit record's "principal_id" is NOT a user UUID from the User Management domain
    And no filter query with "actor_type = manual_user" returns this record

    Examples:
      | system_actor          |
      | system_scheduler      |
      | integration_callback  |
      | system_lifecycle      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Provenance enforcement per US 26.04: a scheduler event whose triggering service
  # identity cannot be resolved (identity missing, revoked, or unregistered) MUST be
  # rejected. Rejection is fail-closed — the audit record is not written, the
  # underlying state change is not committed, and operations are alerted so the
  # broken identity is investigated. Prevents "orphan" system events with no
  # attributable actor.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario: Scheduler event without resolvable service identity is rejected (AC-13)
    Given the "rate_lock_expiry_job" scheduler job is scheduled to fire
    And its expected service identity "svc.scheduler.ratelock" has been revoked or is unregistered
    When the scheduler job fires and attempts to emit its state-change event
    Then the Audit Trail service refuses to write the audit record
    And the response body indicates a provenance-enforcement rejection
    And no audit record with "actor_type = system_scheduler" is created for this event
    And the underlying state change is not committed
    And an operations alert is raised identifying the unresolved service identity
```
