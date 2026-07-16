# PRD1042-778 — US 26.1 | AUDIT TRAIL | Unified Audit Event Schema Definition & Enforcement

Generated: 2026-07-10
Story: PRD1042-778 — US 26.1 | AUDIT TRAIL | Unified Audit Event Schema Definition & Enforcement
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (15 ACs parsed from prose, description present, stakeholder-reviewed — Client Approved per Philipp Maute 2026-06-16 comment 37245; Ready for DEV Review)
ACs with Gherkin scenarios: 6 of 15 | Blocked: 2 (AC-03, AC-11 — governance apparatus unresolved per Marko Mrdja comment 37407 2026-06-17) | Excluded: 7 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:11090, file 7EkiVhANXOkn65k0jG4uEJ — Canvas "E26 -- Audit Trail" (Stage 2 FAILED — Figma MCP plan quota exhausted; story explicitly declares "No operational UI — governance console for schema version inspection is read-mostly, outside this US"; backend/schema story tested at API layer)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                     | Blocking dependency                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-03 | Schema additions/enum expansions require governance approval + are themselves audited — governance approval workflow not in November scope | D-Governance — Marko Mrdja 2026-06-17 proposal (comment 37407) to drop AuditSchemaRegistry + approval workflow is unresolved vs Client Approved spec |
| AC-11 | AUDIT_SCHEMA_CHANGED event emitted on governance changes (version, actor, change summary, UTC timestamp)                                   | Same dependency as AC-03 — no governance workflow means no schema-change event                                                                       |

---

## AC Scope Filter

| AC    | Description                                                                                                                                                                                                                                                                              | Classification     | Rationale                                                                                                                             |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Unified schema is the ONLY permitted audit structure platform-wide; no substitute history tables (CC-3)                                                                                                                                                                                  | `edge-case`        | Architectural invariant verified through code review + repo grep — not observable at runtime                                          |
| AC-02 | Schema defines core fields, closed enumerations, required/conditional semantics per Epic §6.1                                                                                                                                                                                            | `separate-feature` | Descriptive contract; observable behaviour verified via AC-06/07 rejection scenarios                                                  |
| AC-03 | Schema additions/enum expansions require governance approval AND are themselves audited                                                                                                                                                                                                  | `Blocked`          | Governance apparatus (AuditSchemaRegistry, approval workflow) unresolved — Marko Mrdja proposes deferral to code-review + Alembic     |
| AC-04 | Every emitting epic constructs conforming payloads; non-conforming rejected at reception                                                                                                                                                                                                 | `separate-feature` | Reception/validation is scope of sibling story US 26.02 (PRD1042-779)                                                                 |
| AC-05 | Core fields present: auditId, tenantId, entityType, entityId, actionType, actor_type, principal_id (M for manual_user), actorRoleAtTimeOfAction (M for manual_user, immutable), timestamp (server-assigned), retentionCategory, oldValue/newValue, financingVersionRef (M for Financing) | `happy-path`       | Testable end-to-end: emit conforming payload → 200/201 + all core fields persisted immutably                                          |
| AC-06 | Missing mandatory field → rejection (fail-closed); business transaction does not commit                                                                                                                                                                                                  | `main-error`       | Core validation — directly blocks the emitting epic's business action                                                                 |
| AC-07 | Unknown enumerated value on any closed-enum field → rejection                                                                                                                                                                                                                            | `main-error`       | Closed-enumeration enforcement — actionType, entityType, actor_type, retentionCategory                                                |
| AC-08 | Free-text actor attribution prohibited; actor_type MUST come from closed enumeration only                                                                                                                                                                                                | `main-error`       | Directly testable: submit `actor_type: "custom_manual_val"` → rejection with enum-violation code                                      |
| AC-09 | Schema version recorded per record; records interpretable across schema evolution                                                                                                                                                                                                        | `edge-case`        | Cross-version interpretability tested during a future schema migration, not this US                                                   |
| AC-10 | Schema published as versioned platform contract consumed by all emitting epics                                                                                                                                                                                                           | `edge-case`        | Delivery-artifact concern (OpenAPI publication), not runtime behaviour                                                                |
| AC-11 | AUDIT_SCHEMA_CHANGED event emitted on governance changes                                                                                                                                                                                                                                 | `Blocked`          | Same D-Governance dependency as AC-03                                                                                                 |
| AC-12 | No DML path exists to alter a persisted audit record's structure after write                                                                                                                                                                                                             | `main-error`       | Testable via DB permission assertion — application role has INSERT+SELECT only, UPDATE/DELETE rejected (per Philipp comment 34102 §1) |
| AC-13 | Schema governance endpoints restricted to Platform Architect / System Admin; all other roles → HTTP 404                                                                                                                                                                                  | `main-error`       | RefiNext 404-not-403 rule; testable across all 7 roles                                                                                |
| AC-14 | Backend validation is server-authoritative; UI conformance is not sufficient                                                                                                                                                                                                             | `edge-case`        | Non-observable outside AC-06/07/08 behaviour; tested implicitly through those scenarios                                               |
| AC-15 | Schema validation adds no more than platform-configured maximum latency                                                                                                                                                                                                                  | `edge-case`        | Non-functional requirement (performance/latency budget) — not covered by functional E2E                                               |

**Gherkin generated for:** AC-05, AC-06, AC-07, AC-08, AC-12, AC-13
**Blocked (no Gherkin):** AC-03, AC-11
**No Gherkin (edge-case or separate-feature):** AC-01, AC-02, AC-04, AC-09, AC-10, AC-14, AC-15

---

## Scenarios summary

| Tag           | Scenario                                                                                                      | AC    | Priority | E2E                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ----- | -------- | ------------------------ |
| `@happy-path` | Conforming audit payload is accepted and all mandatory fields persisted (Scenario Outline — 3 actor variants) | AC-05 | P0       | ⚙️ needs D-Audit-API     |
| `@main-error` | Missing mandatory field rejected fail-closed (Scenario Outline — 4 field variants)                            | AC-06 | P0       | ⚙️ needs D-Audit-API     |
| `@main-error` | Unknown closed-enum value rejected (Scenario Outline — 4 enum-field variants)                                 | AC-07 | P0       | ⚙️ needs D-Audit-API     |
| `@main-error` | Free-text actor_type rejected — closed enumeration enforced                                                   | AC-08 | P0       | ⚙️ needs D-Audit-API     |
| `@main-error` | Persisted audit record cannot be altered post-write — UPDATE and DELETE blocked at DB layer                   | AC-12 | P0       | ⚙️ needs D-Audit-DB-Role |
| `@main-error` | Schema governance endpoint returns 404 for all non-System-Admin roles (Scenario Outline — 6 roles)            | AC-13 | P0       | ⚙️ needs D-Governance    |

Active scenario blocks: 6 (5 Outlines + 1 Scenario)
E2E automation candidates: 0 of 6 scenarios ✅ (all require backend fixtures: D-Audit-API emission harness, D-Audit-DB-Role permission fixture, D-Governance endpoint)

---

## Feature file

```gherkin
@audit-trail @us-26.1 @p0 @backend
Feature: Unified Audit Event Schema Definition & Enforcement (US 26.1 — PRD1042-778)
  As a Platform Architect / System Admin
  I want a single canonical Audit Record schema enforced platform-wide
  So that every operational epic emits regulatory evidence in one consistent, validated, non-bypassable structure

  Background:
    Given the platform has a single Unified Audit Record schema published as the versioned platform contract
    And the AuditValidationService is active at every audit reception boundary
    And validation is server-authoritative (UI conformance is not sufficient — AC-14)
    And the audit persistence layer runs under an application role with INSERT + SELECT permissions only (no UPDATE / DELETE)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Emit a fully-conforming Unified Audit Record payload for each actor_type
  # variant covered in November scope (manual_user, system_scheduler,
  # integration_callback per Philipp Maute 5+2 reserved actor_type reduction,
  # comment 35591). The record is accepted, tenantId is enforced, timestamp is
  # server-assigned, and all mandatory fields are persisted immutably.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0
  Scenario Outline: Conforming audit payload is accepted and all mandatory fields persisted (AC-05)
    Given a business transaction is emitted with actor_type <actor_type>
    And the payload includes tenantId, entityType <entityType>, entityId, actionType <actionType>
    And the payload includes <principal_reference_field> resolvable to <principal_kind>
    And when actor_type is "manual_user" the payload includes actorRoleAtTimeOfAction "<actor_role>" (immutable) and principal_id
    And the payload includes retentionCategory "<retention_category>"
    And the payload omits timestamp (server MUST assign it)
    When the audit event is submitted to the audit reception boundary
    Then the response status should be 201
    And an audit record should be persisted with a system-generated auditId (UUID)
    And the persisted timestamp should be UTC and server-assigned
    And the persisted actor_type should equal "<actor_type>"
    And the persisted tenantId should scope the record for RLS filtering
    And the persisted retentionCategory should equal "<retention_category>" and be immutable
    And when the business object is Financing or FinancingComponent the persisted record should include a financingVersionRef

    Examples:
      | actor_type            | entityType | actionType       | principal_reference_field | principal_kind        | actor_role       | retention_category   |
      | manual_user           | Partner    | Create           | principal_id              | registered user       | System Admin     | Standard             |
      | system_scheduler      | Contract   | StatusTransition | principal_id              | registered service    | (n/a — omitted)  | Regulatory Critical  |
      | integration_callback  | Document   | Update           | principal_id              | integration service   | (n/a — omitted)  | Standard             |

  # ---------------------------------------------------------------------------
  # MAIN ERROR #1 — AC-06 (fail-closed on missing mandatory)
  # Any mandatory field absent from the payload causes rejection at reception.
  # The business transaction that triggered the emission MUST NOT commit
  # (fail-closed). No audit record is persisted, no downstream side effects.
  # Verifies the "fail-closed" invariant referenced in the Edge Cases block.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario Outline: Missing mandatory field is rejected fail-closed (AC-06)
    Given a business transaction attempts to emit an audit event
    And the payload omits the mandatory field "<missing_field>"
    When the audit event is submitted to the audit reception boundary
    Then the response status should be 400 or 422
    And the error code should indicate a mandatory-field validation failure
    And no audit record should be persisted for this attempt
    And the governing business transaction should NOT commit (fail-closed)

    Examples:
      | missing_field  |
      | tenantId       |
      | entityType     |
      | actionType     |
      | actor_type     |

  # ---------------------------------------------------------------------------
  # MAIN ERROR #2 — AC-07 (closed-enumeration enforcement)
  # Any closed-enum field (entityType, actionType, actor_type,
  # retentionCategory) containing a value outside its closed enumeration is
  # rejected. Free-text or "new" enum values require the (currently Blocked)
  # governance workflow — AC-03 / AC-11.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario Outline: Unknown value on a closed-enum field is rejected (AC-07)
    Given a business transaction attempts to emit an audit event
    And the payload sets closed-enum field "<enum_field>" to "<unknown_value>"
    When the audit event is submitted to the audit reception boundary
    Then the response status should be 400 or 422
    And the error code should indicate an enum-value validation failure
    And the error detail should identify the field "<enum_field>"
    And no audit record should be persisted for this attempt
    And the governing business transaction should NOT commit

    Examples:
      | enum_field         | unknown_value              |
      | entityType         | InvestmentPortfolio        |
      | actionType         | Sunset                     |
      | actor_type         | robot_manual               |
      | retentionCategory  | ShortTermInvestigative     |

  # ---------------------------------------------------------------------------
  # MAIN ERROR #3 — AC-08 (free-text actor attribution prohibited)
  # actor_type MUST come from the closed enumeration; free-text is prohibited
  # because auditors trace "who acted" first and free-text drift breaks
  # queryability. Anchored explicitly by Philipp Maute recommendation
  # (comment 34102 §2, 2026-05-08).
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Free-text actor attribution is rejected — actor_type must come from closed enumeration (AC-08)
    Given a business transaction attempts to emit an audit event
    And the payload sets actor_type to the free-text value "Ana from support desk"
    When the audit event is submitted to the audit reception boundary
    Then the response status should be 400 or 422
    And the error code should indicate a closed-enum-violation on actor_type
    And no audit record should be persisted for this attempt
    And the response should NOT include a suggestion to auto-create the actor_type value

  # ---------------------------------------------------------------------------
  # MAIN ERROR #4 — AC-12 (DB-layer immutability, INSERT-only)
  # No DML path exists to alter a persisted audit record. Application service
  # accounts have INSERT + SELECT permissions only; UPDATE and DELETE are
  # rejected at the database layer, not just at the application layer.
  # Anchored by Philipp Maute recommendation (comment 34102 §1, 2026-05-08)
  # and Epic 26 §4 "Audit tables are enforced INSERT-only at DB level".
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0
  Scenario: Persisted audit record cannot be altered post-write — UPDATE and DELETE blocked at DB layer (AC-12)
    Given a valid audit record has been persisted with auditId <existing_audit_id>
    And the current DB connection uses the application service role
    When the application role attempts an UPDATE on the audit record
    Then the database should reject the UPDATE with a permission-denied error
    And the persisted audit record should be unchanged
    When the application role attempts a DELETE on the audit record
    Then the database should reject the DELETE with a permission-denied error
    And the persisted audit record should be unchanged
    And no exception path in the application layer should be able to bypass this constraint (server-authoritative — AC-14)

  # ---------------------------------------------------------------------------
  # MAIN ERROR #5 — AC-13 (RBAC on schema governance endpoints, 404-not-403)
  # Schema governance endpoints (the read-mostly console referenced in the
  # story) are restricted to Platform Architect / System Admin. All other
  # roles receive HTTP 404 — the RefiNext 404-not-403 rule prevents endpoint
  # enumeration by unauthorized principals.
  # Bank Admin (bank_admin, tenant-level) has no platform-level governance
  # authority; per PRD1042-48 (Ivan Mladenovic 2026-07-06) — treated same as
  # non-privileged roles for platform endpoints.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario Outline: Schema governance endpoint returns 404 for all non-System-Admin roles (AC-13)
    Given I am authenticated as <role>
    When I GET the audit schema governance endpoint (schema version inspection)
    Then the response status should be 404
    And the response body should NOT distinguish between "endpoint exists" and "you lack access"
    And no audit record should be leaked to me via this endpoint

    Examples:
      | role                  |
      | Bank Admin            |
      | Front Office          |
      | Back Office           |
      | Support User          |
      | Auditor               |
      | Leasing Company User  |
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
