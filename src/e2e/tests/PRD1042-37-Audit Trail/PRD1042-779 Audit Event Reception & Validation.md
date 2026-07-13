# PRD1042-779 — US 26.2 | AUDIT TRAIL | Audit Event Reception & Validation

Generated: 2026-07-10
Story: PRD1042-779 — US 26.2 | AUDIT TRAIL | Audit Event Reception & Validation
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (functional + validation + security + edge-case ACs present, description present, stakeholder-reviewed by Philipp Maute + Marko Mrdja + Vesna Plakalovic, Ready for DEV Review)
ACs with Gherkin scenarios: 5 of 14 | Blocked: 3 (D-AuditEmitter, D-CircuitBreaker, D17) | Excluded: 6 (edge-case, separate-feature, or dropped per architecture pivot — scope filter table only)
Figma design: SKIPPED — story is backend service-to-service only ("Frontend: None" per Architectural Notes); no UI surface; shared E26 Audit Trail canvas (node 1:11090) covers UI-facing stories (US 26.10 List, US 26.11 Detail, US 26.15 Filters), not the internal `POST /audit/events` reception endpoint. Stage 2 SKIPPED design-blind.

---

## Blocked ACs (no scenarios generated)

| AC                                                                                                 | Reason                                                                                                                                                                                                           | Blocking dependency                                                                             |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| AC-FR-04 (fail-closed rollback of business transaction on audit validation failure)                | Requires ability to force an audit event validation failure inside a governed business transaction — no E2E-observable API surface without a test-forge that injects a malformed audit event on the emitter side | D-AuditEmitter (test harness to inject validation-failing audit event mid-transaction)          |
| AC-EC-04 (audit infrastructure unavailable → fail-closed via circuit breaker per US 26.14)         | Circuit breaker belongs to US 26.14 (separate story, backlog per Philipp comment 37245); requires infrastructure-level fault injection unavailable in E2E                                                        | US 26.14 (Fail-Closed Audit Circuit Breaker) + D-InfraFaultInjection                            |
| AC-VR-03 (tenantId mismatch vs authenticated session → reject + cross-tenant security audit event) | Architecturally unreachable from application code per Marko Mrdja architecture pivot (tenantId derived server-side, never trusted from client); only reachable via forged JWT or bypass tool                     | D17 (TEST_JWT_SECRET / test-forge for tampered tenant claims) + D20 (second seeded Bank Tenant) |

---

## AC Scope Filter

| AC        | Description                                                                                                                                    | Classification     | Rationale                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-FR-01  | Audit Trail receives event payloads synchronously within originating business transaction scope (Flow A)                                       | `happy-path`       | Observable via governed action (e.g., user login) producing an audit record atomically with the business transaction — testable end-to-end                                                                 |
| AC-FR-02  | Payload validated against Unified Event Model — mandatory fields, enums, tenantId matches session, timestamp server-assigned                   | `happy-path`       | Successful governed action → audit record contains required fields with server-assigned timestamp; validation success is observable via Auditor read path                                                  |
| AC-FR-03  | On validation pass, record proceeds to immutable persistence (US 26.03) with retention fields co-persisted (US 26.08)                          | `separate-feature` | US 26.03 (immutable persistence) and US 26.08 (retention) own their own scenarios; here we only confirm the record IS persisted after successful reception                                                 |
| AC-FR-04  | On validation failure, error returned and originating business transaction does NOT commit (CC-6, fail-closed)                                 | `Blocked`          | Requires ability to force a validation failure inside a governed transaction — no test-forge available                                                                                                     |
| AC-VR-01  | Mandatory-field completeness check — null or missing mandatory field → reject                                                                  | `edge-case`        | Backend unit test concern — typed parameters (Pydantic) + DB NOT NULL constraints per architecture pivot; not observable at E2E API level                                                                  |
| AC-VR-02  | Closed-enum membership check on entityType, actionType, actor_type, deltaType                                                                  | `edge-case`        | Backend unit test concern — Python Enum types enforce membership at parameter binding; not observable at E2E API level                                                                                     |
| AC-VR-03  | tenantId must equal authenticated session tenant; mismatch → reject + security audit event (cross-tenant write attempt)                        | `Blocked`          | Architecturally unreachable from application code per Marko Mrdja pivot (server-derived tenantId); requires D17 forge to construct a tampered token                                                        |
| AC-VR-04  | If actor_type = manual_user, principal_id must resolve to a registered human user (US 26.04)                                                   | `edge-case`        | Backend unit test — FK constraint or service-level check; not directly observable at E2E API surface                                                                                                       |
| AC-VR-05  | Duplicate detection via correlationId uniqueness; duplicate → reject + duplicate-detection audit record                                        | `separate-feature` | **DROPPED per Marko Mrdja comment 37516 (2026-06-18)** — multiple audit events per request are legitimate (e.g., login = OTP event + login event sharing correlationId); no uniqueness constraint enforced |
| AC-SB-01  | Validation executes in-transaction for sync emitters; async emitters use durable outbox path (US 26.20)                                        | `separate-feature` | Outbox path is US 26.20 (backlog per Philipp comment 37245); sync path is covered by AC-FR-01 happy-path                                                                                                   |
| AC-SB-02  | Rejected events in sync path roll back business transaction; outbox path routes to DLQ                                                         | `separate-feature` | **Outbox/DLQ DROPPED per Marko architecture pivot**; sync rollback is AC-FR-04 (Blocked); no separate scenario                                                                                             |
| AC-SB-03  | Misattribution or cross-tenant attempt produces its own immutable audit record as evidence                                                     | `main-error`       | CROSS_TENANT_WRITE_BLOCKED audit event on read path is the only remaining evidence; MISATTRIBUTION_REJECTED dropped per architecture pivot                                                                 |
| AC-SR-01  | Reception endpoint internal service-to-service only; not exposed to operational user roles or LC tokens                                        | `main-error`       | Testable — any operational user/LC calling `POST /audit/events` gets 404 (RefiNext tenant-isolation pattern per constraint #5); confirms endpoint is not reachable                                         |
| AC-SR-02  | tenantId derived from server session context, never trusted from client payload                                                                | `edge-case`        | Backend/security-architecture concern — enforced by AuditService signature (no tenantId parameter); not observable at operational E2E surface                                                              |
| AC-NFR-01 | Synchronous validation + write adds no more than platform-configured maximum latency to governed action                                        | `edge-case`        | Performance/NFR — belongs to performance suite, not functional BDD                                                                                                                                         |
| AC-NFR-02 | Reception is idempotent under retry via correlationId                                                                                          | `separate-feature` | **DROPPED per Marko** — sync recording has no retry semantics; rollback + caller-side retry is the model                                                                                                   |
| AC-EC-01  | Audit event with missing mandatory field → rejected (sync: tx doesn't commit / outbox: DLQ); compliance defect in emitting epic                | `edge-case`        | Backend unit test (typed parameter enforcement) + emitting-epic compliance concern; not E2E surface                                                                                                        |
| AC-EC-02  | Duplicate event same correlationId → second rejected; duplicate-detection audit record; original retained                                      | `separate-feature` | **DROPPED per Marko architecture pivot** — duplicates cannot occur with sync in-transaction recording                                                                                                      |
| AC-EC-03  | tenantId mismatch vs session → rejected; cross-tenant write security audit event                                                               | `Blocked`          | Same as AC-VR-03 — architecturally unreachable without D17 forge                                                                                                                                           |
| AC-EC-04  | Audit infrastructure unavailable → fail-closed via circuit breaker (US 26.14); governed action does not commit                                 | `Blocked`          | US 26.14 dependency; requires infrastructure fault injection                                                                                                                                               |
| AC-AR-01  | Emitted audit event types: MISATTRIBUTION_REJECTED, DUPLICATE_EVENT_DETECTED, CROSS_TENANT_WRITE_BLOCKED — each immutable, Regulatory Critical | `main-error`       | Only CROSS_TENANT_WRITE_BLOCKED remains per architecture pivot; testable on read path via Auditor read attempt against cross-tenant filter                                                                 |

**Gherkin generated for:** AC-FR-01, AC-FR-02, AC-SB-03, AC-SR-01, AC-AR-01
**Blocked (no Gherkin):** AC-FR-04, AC-EC-04, AC-VR-03 (which merges AC-EC-03)
**No Gherkin (edge-case, separate-feature, or dropped per architecture pivot):** AC-FR-03, AC-VR-01, AC-VR-02, AC-VR-04, AC-VR-05, AC-SB-01, AC-SB-02, AC-SR-02, AC-NFR-01, AC-NFR-02, AC-EC-01, AC-EC-02

---

## Scenarios summary

| Tag           | Scenario                                                                                                                     | AC                 | Priority | E2E          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------- | ------------ |
| `@happy-path` | Governed user action emits audit event synchronously with business transaction (Scenario Outline — 6 roles)                  | AC-FR-01, AC-FR-02 | P0       | ✅           |
| `@happy-path` | Audit event carries server-assigned timestamp and Unified Event Model fields (post-emit read via Auditor)                    | AC-FR-02           | P0       | ✅           |
| `@main-error` | Reception endpoint `POST /audit/events` is not exposed to operational roles or LC — returns 404 (Scenario Outline — 6 roles) | AC-SR-01           | P0       | ✅           |
| `@main-error` | Cross-tenant read attempt against Audit Trail returns 404 and emits CROSS_TENANT_WRITE_BLOCKED audit event                   | AC-SB-03, AC-AR-01 | P0       | ⚙️ needs D20 |
| `@main-error` | CROSS_TENANT_WRITE_BLOCKED audit records are immutable and visible only to Auditor + Compliance                              | AC-AR-01           | P0       | ⚙️ needs D20 |

Active scenario blocks: 5 (2 Outlines + 3 Scenarios)
E2E automation candidates: 3 of 5 scenarios ✅

---

## Feature file

```gherkin
@audit-trail @us-26.2 @p0
Feature: Audit Event Reception & Validation (US 26.2 — PRD1042-779)
  As a System (Audit Trail service)
  I want to receive and validate every audit event payload from operational epics
  So that only schema-conformant, provenance-correct events are persisted and non-conforming events fail closed

  Background:
    Given the Audit Trail service is available
    And the AuditService is configured with in-transaction recording (per v1.2 architecture)
    And the following seeded users exist across all 7 platform roles:
      | role          | email                                              |
      | system_admin  | dejan.nikolic+admin@holycode.com                   |
      | bank_admin    | dejan.nikolic+automationbankadmin@holycode.com     |
      | front_office  | dejan.nikolic+automationfo@holycode.com            |
      | back_office   | dejan.nikolic+automationbo@holycode.com            |
      | support_user  | dejan.nikolic+automationsupport@holycode.com       |
      | auditor       | dejan.nikolic+automationauditor@holycode.com       |
      | lc_user       | dejan.nikolic+automationlco@holycode.com           |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-FR-01, AC-FR-02
  # Every governed user action (login is the canonical example) synchronously
  # emits an audit event within the business transaction. Success is observable
  # on the Auditor read path — the audit record must exist AFTER the business
  # action completes, and must carry a server-assigned timestamp plus the
  # Unified Event Model fields (auditId, entityType, entityId, actionType,
  # changedBy, actor_type, timestamp, tenant_scope, correlationId).
  # Per architecture pivot (Marko Mrdja 2026-06-18): reception is a single
  # AuditService.record() call in the same DB transaction as the governed
  # action — no separate reception service, no outbox in the sync path.
  # ---------------------------------------------------------------------------

  @happy-path @ac-fr-01 @ac-fr-02 @p0 @e2e-ready
  Scenario Outline: Governed user action emits audit event synchronously with business transaction (AC-FR-01, AC-FR-02)
    Given a <role> user with email <email> is a valid operational actor
    When the user performs a governed action (successful login)
    And the business transaction commits
    Then an audit record should exist for the action
    And the audit record actionType should be "USER_LOGIN"
    And the audit record actor_type should be "manual_user"
    And the audit record principal_id should reference the <role> user's ID
    And the audit record tenant_scope should equal the user's session tenant
    And the audit record timestamp should be server-assigned (within 5 seconds of the action)
    And the audit record correlationId should equal the login request correlationId

    Examples:
      | role          | email                                              |
      | system_admin  | dejan.nikolic+admin@holycode.com                   |
      | bank_admin    | dejan.nikolic+automationbankadmin@holycode.com     |
      | front_office  | dejan.nikolic+automationfo@holycode.com            |
      | back_office   | dejan.nikolic+automationbo@holycode.com            |
      | support_user  | dejan.nikolic+automationsupport@holycode.com       |
      | auditor       | dejan.nikolic+automationauditor@holycode.com       |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-FR-02 (server-assigned timestamp + Unified Event Model)
  # Validates that the client CANNOT influence the timestamp and that all
  # mandatory Unified Event Model fields are present on the persisted record.
  # Client-supplied timestamp (if any) must be ignored — server assignment
  # is the audit-integrity guarantee per BAIT AT 7.2.
  # ---------------------------------------------------------------------------

  @happy-path @ac-fr-02 @p0 @e2e-ready
  Scenario: Audit event carries server-assigned timestamp and Unified Event Model fields (AC-FR-02)
    Given a "system_admin" user is logged in
    And an authorized "auditor" user is available for read verification
    When the "system_admin" user performs a governed action at approximately "10:00:00 UTC"
    And the "auditor" user reads the audit record for that action
    Then the audit record should contain all mandatory Unified Event Model fields:
      | field         |
      | auditId       |
      | entityType    |
      | entityId      |
      | actionType    |
      | changedBy     |
      | actor_type    |
      | tenant_scope  |
      | timestamp     |
      | correlationId |
    And the audit record timestamp should be within 5 seconds of "10:00:00 UTC"
    And the audit record actor_type should be one of the closed enumeration:
      | value               |
      | manual_user         |
      | system_scheduler    |
      | integration_callback|
      | system_lifecycle    |
      | migration           |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-SR-01 (reception endpoint not exposed to operational users)
  # The `POST /audit/events` endpoint is internal service-to-service only.
  # No operational user role (SA, BA, FO, BO, Support, Auditor) and no LC
  # token may reach it. Per RefiNext tenant-isolation constraint #5, the
  # response MUST be 404 (not 403) so the endpoint's existence cannot be
  # probed. This is the E2E-visible surface of AC-SR-01.
  # ---------------------------------------------------------------------------

  @main-error @ac-sr-01 @p0 @e2e-ready
  Scenario Outline: Reception endpoint POST /audit/events is not exposed to operational roles or LC — returns 404 (AC-SR-01)
    Given a <role> user with email <email> is authenticated
    When the user sends "POST /audit/events" with a well-formed audit event payload
    Then the response status should be 404
    And the response body should NOT indicate the endpoint exists
    And no audit record should be persisted from the operational user's attempt

    Examples:
      | role          | email                                              |
      | system_admin  | dejan.nikolic+admin@holycode.com                   |
      | bank_admin    | dejan.nikolic+automationbankadmin@holycode.com     |
      | front_office  | dejan.nikolic+automationfo@holycode.com            |
      | back_office   | dejan.nikolic+automationbo@holycode.com            |
      | support_user  | dejan.nikolic+automationsupport@holycode.com       |
      | auditor       | dejan.nikolic+automationauditor@holycode.com       |
      | lc_user       | dejan.nikolic+automationlco@holycode.com           |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-SB-03, AC-AR-01 (cross-tenant detection on read path)
  # Per Marko Mrdja architecture pivot: since tenantId is server-derived
  # from the session, a cross-tenant WRITE cannot be constructed by
  # application code. The remaining detection surface is the READ path —
  # an actor from Tenant A attempting to query Tenant B's audit records
  # must be blocked AND must produce a CROSS_TENANT_WRITE_BLOCKED
  # immutable audit event as evidence. Response is 404 (tenant-isolation
  # constraint #5), not 403.
  # ---------------------------------------------------------------------------

  @main-error @ac-sb-03 @ac-ar-01 @p0
  Scenario: Cross-tenant read attempt against Audit Trail returns 404 and emits CROSS_TENANT_WRITE_BLOCKED audit event
    Given a "bank_admin" user from "Tenant A" is authenticated
    And an audit record exists in "Tenant B"
    When the "bank_admin" from "Tenant A" attempts to read the audit record from "Tenant B" by its known auditId
    Then the response status should be 404
    And a new immutable audit event should be persisted in "Tenant A" audit scope with:
      | field       | value                       |
      | actionType  | CROSS_TENANT_WRITE_BLOCKED  |
      | actor_type  | manual_user                 |
      | principal_id| the Tenant A bank_admin ID  |
      | tenant_scope| Tenant A                    |
    And the original audit record in "Tenant B" should remain unchanged and readable only within "Tenant B"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-AR-01 (immutability + access-scope of security audit records)
  # CROSS_TENANT_WRITE_BLOCKED is Regulatory Critical (per Epic 26 §Retention).
  # It MUST be immutable at DB level (INSERT-only, no UPDATE/DELETE for the
  # application service account) and its visibility MUST be restricted to
  # Auditor + Compliance roles per BAIT AT 9. Operational users must not
  # see these security events even inside their own tenant scope.
  # ---------------------------------------------------------------------------

  @main-error @ac-ar-01 @p0
  Scenario: CROSS_TENANT_WRITE_BLOCKED audit records are immutable and visible only to Auditor + Compliance
    Given a CROSS_TENANT_WRITE_BLOCKED audit record exists in "Tenant A" audit scope
    When a "front_office" user from "Tenant A" attempts to view the audit record via any operational-cockpit surface
    Then the record should NOT appear in the operational user's view
    When an "auditor" user from "Tenant A" attempts to view the audit record via the Audit Trail investigation view
    Then the record should appear
    And the actionType should be "CROSS_TENANT_WRITE_BLOCKED"
    When any authorized actor attempts "UPDATE" or "DELETE" on the audit table row directly at the database level using the application service account
    Then the database operation should be rejected with an INSUFFICIENT_PRIVILEGE error
    And the audit record should remain unchanged
```
