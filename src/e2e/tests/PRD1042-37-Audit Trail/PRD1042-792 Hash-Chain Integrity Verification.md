# PRD1042-792 — US 26.15 | Audit Trail | Hash-Chain Integrity Verification (Optional MVP)

Generated: 2026-07-10
Story: PRD1042-792 — US 26.15 | AUDIT TRAIL | Hash-Chain Integrity Verification (Optional MVP)
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (21 derived ACs, description present, spec v1.2 stakeholder-approved by Philipp 2026-05-29 + grooming decision 12.06, Ready for DEV Review → Client Approved 16.06)
ACs with Gherkin scenarios: 8 of 21 | Blocked: 6 (D-Audit, D-EventBus, D-Alert-Queue, PRD1042-793 US 26.08 integrityProtectedFlag, PRD1042-1027 FE view, backend hash-forge harness) | Excluded: 7 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:11090, file 7EkiVhANXOkn65k0jG4uEJ — Screen "E26 -- Audit Trail" (Stage 2 FAILED — Figma MCP Professional-plan quota exhausted; extraction blind; FE surface per description is single read-only Platform Auditor integrity-verification result view — MAJOR design gap logged)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                     | Blocking dependency                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| AC-05 | Hash-chain gap alert propagation to Security/Compliance queue requires event-bus + alert-queue harness untestable at E2E layer             | D-EventBus + D-Alert-Queue                                |
| AC-07 | Modified-record hash-mismatch scenario requires test-forge endpoint to bypass INSERT-only DB permission for controlled tamper simulation   | Backend hash-forge harness (post-November per grooming)   |
| AC-09 | Immediate alert to platform Security/Compliance queue requires alert-queue read API + audit event dispatcher                               | D-Alert-Queue + D-Audit                                   |
| AC-14 | Non-functional hash-computation write-latency ceiling requires performance-benchmark harness, not E2E scope                                | D-Performance-Harness                                     |
| AC-20 | Emits `audit.integrity.tamper.detected` event — requires EventBus consumer read API                                                        | D-EventBus                                                |
| AC-21 | TAMPER_DETECTED audit entry (Regulatory Critical) — requires audit-log read API for verification of INSERT-only regulatory-critical record | PRD1042-37 audit-log query API (Epic 26 dependency chain) |

---

## AC Scope Filter

| AC    | Description                                                                                                     | Classification     | Rationale                                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | On INSERT: `chainSequence = prev_max_for_entity + 1`                                                            | `edge-case`        | Internal DB-write mechanic; verified indirectly via AC-06 valid chain response — no separate E2E surface                   |
| AC-02 | On INSERT: `recordHash = SHA-256` of immutable record fields in canonical order                                 | `edge-case`        | SHA-256 hashing algorithm implementation detail; verified indirectly via AC-06/AC-07 verification outcomes                 |
| AC-03 | On INSERT: `previousRecordHash = hash of prior record for same entity`                                          | `edge-case`        | Internal chain-linkage DB mechanic; not a user-visible surface                                                             |
| AC-04 | Verification API `GET /audit/integrity/verify/{entityId}` allows platform-level Auditors to validate chain      | `happy-path`       | Primary API surface — Auditor endpoint invocation is core success flow                                                     |
| AC-05 | Hash-chain gaps (missing `chainSequence`) treated as tamper events; raise compliance alert                      | `Blocked`          | Alert propagation requires event-bus + alert-queue harness — see Blocked ACs table                                         |
| AC-06 | Verification for untampered entity returns 'chain valid' result (AC-AT-H1)                                      | `happy-path`       | Happy-path validation-rule; directly testable via API response                                                             |
| AC-07 | Modified record detected as hash mismatch → tamper alert (AC-AT-H2)                                             | `Blocked`          | Requires backend hash-forge test-harness to bypass INSERT-only DB permission — see Blocked ACs                             |
| AC-08 | Deleted record detected as chain gap → tamper alert (AC-AT-H3)                                                  | `main-error`       | Testable via chain gap simulation using test-fixture audit records; behavioral outcome observable in API response          |
| AC-09 | Tamper detection raises immediate alert to platform Security/Compliance queue                                   | `Blocked`          | Alert-queue observability requires downstream infra — see Blocked ACs                                                      |
| AC-10 | `integrityProtectedFlag = true` marks records under chain verification (US 26.08)                               | `separate-feature` | Flag semantics owned by US 26.08 (PRD1042-785) — cross-epic dependency                                                     |
| AC-11 | Activation configurable at tenant level; infra mandatory in MVP, activation optional                            | `main-error`       | Tenant-level toggle enforcement testable via API response when chaining disabled                                           |
| AC-12 | Verification API restricted to platform-level Auditors                                                          | `main-error`       | Role-based access control — RefiNext domain rule triggers negative scenario for non-Auditor roles                          |
| AC-13 | Chain construction is server-side; clients cannot supply hashes                                                 | `edge-case`        | API surface acceptance — client hash payload rejection is a validation-rule edge case, not a primary flow                  |
| AC-14 | Hash computation on INSERT must not exceed platform-configured max write latency                                | `Blocked`          | Non-functional performance requirement — see Blocked ACs                                                                   |
| AC-15 | Chaining disabled for tenant → records carry `integrityProtectedFlag=false`; API reports "chaining not enabled" | `main-error`       | Tenant-level activation off-state directly observable via verification API                                                 |
| AC-16 | System/Power User: Compute hash chain on INSERT (system-driven); Invoke verification API                        | `edge-case`        | System-initiated INSERT tested indirectly via AC-06; System/Power-User API invocation folded into Auditor Scenario Outline |
| AC-17 | Auditor (platform-level): Invoke verification API (allowed)                                                     | `happy-path`       | Same as AC-04 — Auditor invocation is the happy-path role                                                                  |
| AC-18 | Front Office / Back Office / Support / LC User: Cannot invoke verification API                                  | `main-error`       | Role-based negative scenario — collapses with AC-12                                                                        |
| AC-19 | Nobody can modify a hash-chain node (immutable)                                                                 | `main-error`       | Application-layer immutability enforcement (write attempts rejected); backend permission also enforces at DB layer         |
| AC-20 | Emits event `audit.integrity.tamper.detected`                                                                   | `Blocked`          | EventBus surface — see Blocked ACs                                                                                         |
| AC-21 | TAMPER_DETECTED audit entry (Regulatory Critical)                                                               | `Blocked`          | Requires audit-log query API — see Blocked ACs                                                                             |

**Gherkin generated for:** AC-04, AC-06, AC-08, AC-11, AC-12, AC-15, AC-18, AC-19
**Blocked (no Gherkin):** AC-05, AC-07, AC-09, AC-14, AC-20, AC-21
**No Gherkin (edge-case or separate-feature):** AC-01, AC-02, AC-03, AC-10, AC-13, AC-16, AC-17

---

## Scenarios summary

| Tag           | Scenario                                                                                               | AC           | Priority | E2E                              |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------ | -------- | -------------------------------- |
| `@happy-path` | Platform Auditor verifies untampered entity chain returns 'chain valid' (Scenario Outline — 2 rows)    | AC-04, AC-06 | P0       | ⚙️ needs PRD1042-1027 FE view    |
| `@happy-path` | Verification API accepts entityId path parameter and returns integrity result payload                  | AC-04        | P0       | ⚙️ needs D-Audit + FE view       |
| `@main-error` | Chain gap (deleted record) detected as tamper event in API response                                    | AC-08        | P0       | ⚙️ needs backend test-fixture    |
| `@main-error` | Chaining disabled for tenant — API responds 'chaining not enabled' with `integrityProtectedFlag=false` | AC-11, AC-15 | P0       | ⚙️ needs D-Audit + tenant toggle |
| `@main-error` | Non-Auditor roles cannot invoke verification API (Scenario Outline — 4 rows)                           | AC-12, AC-18 | P0       | ✅                               |
| `@main-error` | Client-supplied hash-chain node modification attempt rejected                                          | AC-19        | P0       | ⚙️ needs D-Audit                 |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 1 of 6 scenarios ✅

---

## Feature file

```gherkin
@audit-trail @us-26.15 @p0
Feature: Hash-Chain Integrity Verification (US 26.15 — PRD1042-792)
  As a Platform-Level Auditor
  I want optional per-entity hash-chaining with a verification API
  So that tampering or deletion of audit records can be independently detected

  Background:
    Given the RefiNext platform is running with the Audit Trail service active
    And the Hash-Chain Integrity Verification module is enabled for the current test tenant
    And the verification API endpoint is exposed at "/audit/integrity/verify/{entityId}"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04, AC-06
  # Platform Auditor invokes the verification API against an entityId that has
  # an untampered chain and receives a 'chain valid' result. The scenario is
  # parameterised across the two System-side actors permitted by the Permission
  # Matrix (Auditor = platform-level, System/Power User = system-invocation).
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @ac-06 @p0
  Scenario Outline: Platform Auditor verifies untampered entity chain returns 'chain valid' (AC-04, AC-06)
    Given I am logged in as <role>
    And an entity with entityId "ENT-INT-0001" has an intact hash chain in the audit log
    When I invoke GET "/audit/integrity/verify/ENT-INT-0001"
    Then the API should respond with HTTP 200
    And the response payload should contain integrity result "chain valid"
    And the response should include chainSequence, recordHash, previousRecordHash markers proving continuity

    Examples:
      | role                 |
      | platform-Auditor     |
      | System/Power User    |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # Verification API accepts a valid entityId path parameter and returns the
  # canonical integrity result payload shape. This scenario nails the response
  # contract independent of the tampered/untampered outcome.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0
  Scenario: Verification API accepts entityId path parameter and returns integrity result payload (AC-04)
    Given I am logged in as platform-Auditor
    And an entity "ENT-INT-0002" exists with an integrity-protected audit chain
    When I invoke GET "/audit/integrity/verify/ENT-INT-0002"
    Then the API should respond with HTTP 200
    And the response body should include field "entityId" equal to "ENT-INT-0002"
    And the response body should include field "integrityStatus"
    And the response body should include field "chainSequence"
    And the response body should include field "verifiedAt"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08 (AC-AT-H3 — chain gap detection)
  # A record has been deleted from the audit chain in the test environment;
  # the verification API detects the missing chainSequence as a chain gap and
  # returns a tamper indicator on the entity. Alert emission to the Security/
  # Compliance queue is covered by AC-05/AC-09 (blocked pending D-Alert-Queue).
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Chain gap (deleted record) detected as tamper event in API response (AC-08)
    Given I am logged in as platform-Auditor
    And an entity "ENT-INT-0003" has an audit chain with a deleted record at chainSequence 3 (test-env only)
    When I invoke GET "/audit/integrity/verify/ENT-INT-0003"
    Then the API should respond with HTTP 200
    And the response payload should contain integrity result "tamper detected"
    And the response should identify the tamper type as "chain gap"
    And the response should reference chainSequence 3 as the missing node

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11, AC-15
  # Chaining is configurable per tenant. When a tenant has integrity chaining
  # disabled, the verification API must not report false-positive tampering —
  # it must report "chaining not enabled" and records must carry
  # integrityProtectedFlag = false.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @ac-15 @p0
  Scenario: Chaining disabled for tenant — API reports 'chaining not enabled' (AC-11, AC-15)
    Given I am logged in as platform-Auditor
    And the tenant "TENANT-CHAIN-OFF" has hash-chain integrity chaining disabled at tenant configuration
    And an entity "ENT-INT-0004" belongs to tenant "TENANT-CHAIN-OFF"
    When I invoke GET "/audit/integrity/verify/ENT-INT-0004"
    Then the API should respond with HTTP 200
    And the response payload should contain integrity result "chaining not enabled"
    And every audit record for entity "ENT-INT-0004" should carry integrityProtectedFlag = false
    And the response should NOT be classified as a tamper event

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12, AC-18
  # The verification API is restricted to platform-level Auditors (per the
  # Permission Matrix). Non-Auditor roles must be rejected before reaching
  # the chain-validation logic. Follows the RefiNext role-based access
  # domain rule — cross-role access returns 403.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @ac-18 @p0 @e2e-ready
  Scenario Outline: Non-Auditor roles cannot invoke verification API (AC-12, AC-18)
    Given I am logged in as <role>
    And an entity "ENT-INT-0005" exists with an integrity-protected audit chain
    When I invoke GET "/audit/integrity/verify/ENT-INT-0005"
    Then the API should respond with HTTP 403
    And the response body should indicate the role lacks integrity-verification permission
    And no chain-validation logic should be executed for this request

    Examples:
      | role         |
      | Front Office |
      | Back Office  |
      | Support User |
      | LC User      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-19
  # Hash-chain nodes are immutable. Any client-facing attempt to write to the
  # chain (patch a recordHash, submit a chainSequence override, POST a
  # pre-computed previousRecordHash) must be rejected at the application
  # layer. The database also enforces INSERT-only via DB permissions
  # (per Epic 26 §4 acceptance criteria + Philipp's 2026-05-08 review).
  # ---------------------------------------------------------------------------

  @main-error @ac-19 @p0
  Scenario: Client-supplied hash-chain node modification attempt rejected (AC-19)
    Given I am logged in as platform-Auditor
    And an entity "ENT-INT-0006" exists with an integrity-protected audit chain
    When I attempt to submit a client-computed hash to modify a hash-chain node for entity "ENT-INT-0006"
    Then the API should reject the request with HTTP 4xx
    And the chain for entity "ENT-INT-0006" should remain unchanged
    And a subsequent verification call should return integrity result "chain valid"
```
