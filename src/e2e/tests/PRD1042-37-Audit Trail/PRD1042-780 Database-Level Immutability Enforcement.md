# PRD1042-780 — US 26.3 | AUDIT TRAIL | Database-Level Immutability Enforcement

Generated: 2026-07-10
Story: PRD1042-780 — US 26.3 | AUDIT TRAIL | Database-Level Immutability Enforcement
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (14 derived ACs, description present, permission matrix included, stakeholder-reviewed, Jira status "Ready for DEV Review")
ACs with Gherkin scenarios: 9 of 14 | Blocked: 1 (OQ-3 — audit.migration.executed emission) | Excluded: 4 (edge-case or separate-feature — scope filter table only)
Figma design: N/A — backend/infrastructure story governing DB permissions and DDL role separation; no UI surface. Stage 2 SKIPPED, Stage 3 comparison SKIPPED (no design object).

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                           | Blocking dependency                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| AC-09 | Story description requires `audit.migration.executed` events at infrastructure level; Marko Mrdja comment (2026-06-18) proposes dropping this in favour of alembic+git tracking. Architectural decision pending. | OQ-3 — architectural resolution on infrastructure-level migration event emission |

---

## AC Scope Filter

| AC    | Description                                                                                           | Classification     | Rationale                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| AC-01 | `audit_app_role` holds INSERT+SELECT only on all audit tables — no UPDATE/DELETE grant exists         | `happy-path`       | Positive path — DB permission inspection verifies grant matrix at the role level                                |
| AC-02 | A separate `audit_migration_role` executes DDL only and is never used for application DML             | `happy-path`       | Positive path — role separation and role-purpose inspection                                                     |
| AC-03 | Soft-delete columns (`is_deleted`, `deleted_at`, `active/inactive`) prohibited on audit tables        | `main-error`       | Schema inspection — presence of any such column on an audit table is a defect                                   |
| AC-04 | Physical deletion may occur only via privileged DB role outside app path (legally-governed order)     | `edge-case`        | Out-of-band, legally-governed process — not exercisable via app-path E2E                                        |
| AC-05 | DB permission inspection confirms `audit_app_role` has no UPDATE/DELETE grant                         | `happy-path`       | Merged with AC-01 — same test surface (grant matrix inspection)                                                 |
| AC-06 | Any attempted UPDATE via app role is rejected by DB layer, not application layer                      | `main-error`       | Core immutability guarantee — DB-level enforcement                                                              |
| AC-07 | Any attempted DELETE via app role is rejected by DB layer, not application layer                      | `main-error`       | Core immutability guarantee — DB-level enforcement                                                              |
| AC-08 | All audit writes are atomic INSERTs; no in-place mutation path exists                                 | `happy-path`       | Positive path — a legitimate audit event lands and can be selected                                              |
| AC-09 | Schema migrations to audit tables tracked as platform governance ops, audited at infrastructure level | `Blocked`          | OQ-3 architectural decision pending (Marko Mrdja proposes dropping infrastructure-level app-emitted event)      |
| AC-10 | Immutability enforced at DB permission layer — application compromise cannot grant mutation           | `edge-case`        | Threat-model assertion; empirically covered by AC-06/AC-07 (DB rejects even a compromised app path)             |
| AC-11 | Migration role credentials segregated and not available to the runtime application service            | `main-error`       | Credential scope inspection — runtime service must NOT hold migration credentials                               |
| AC-12 | INSERT-only write model sustains platform-configured peak audit event throughput                      | `separate-feature` | NFR performance/load test — separate suite; requires golden peak-throughput value from Platform Engineering     |
| AC-13 | Developer adds soft-delete column → prohibited in migration governance review                         | `main-error`       | Governance gate — migration containing a forbidden column pattern must be rejected before it reaches production |
| AC-14 | Migration role used for application DML → configuration defect flagged                                | `main-error`       | Runtime configuration guard — service starting up with migration credentials must fail startup / raise an alert |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-06, AC-07, AC-08, AC-11, AC-13, AC-14
**Blocked (no Gherkin):** AC-09
**No Gherkin (edge-case or separate-feature):** AC-04, AC-05 (merged into AC-01), AC-10, AC-12

---

## Scenarios summary

| Tag           | Scenario                                                                       | AC           | Priority | E2E                       |
| ------------- | ------------------------------------------------------------------------------ | ------------ | -------- | ------------------------- |
| `@happy-path` | `audit_app_role` grant matrix is INSERT+SELECT only across all audit tables    | AC-01, AC-05 | P0       | ⚙️ needs D-DB-Introspect  |
| `@happy-path` | `audit_migration_role` grant matrix is DDL only, disjoint from app-role grants | AC-02        | P0       | ⚙️ needs D-DB-Introspect  |
| `@happy-path` | Legitimate audit INSERT succeeds and is retrievable via scoped SELECT          | AC-08        | P0       | ⚙️ needs D-Audit-Fixture  |
| `@main-error` | UPDATE attempted through `audit_app_role` is rejected by the DB layer          | AC-06        | P0       | ⚙️ needs D-DB-Direct      |
| `@main-error` | DELETE attempted through `audit_app_role` is rejected by the DB layer          | AC-07        | P0       | ⚙️ needs D-DB-Direct      |
| `@main-error` | Migration inspection rejects soft-delete columns on audit tables (Outline × 3) | AC-03, AC-13 | P0       | ⚙️ needs D-Migration-Lint |
| `@main-error` | Runtime application service must not hold `audit_migration_role` credentials   | AC-11        | P0       | ⚙️ needs D-Cred-Scope     |
| `@main-error` | Application service configured with migration role credentials fails startup   | AC-14        | P0       | ⚙️ needs D-Startup-Guard  |

Active scenario blocks: 8 (1 Outline + 7 Scenarios)
E2E automation candidates: 0 of 8 scenarios ✅ — all require DB-introspection or migration-governance harness dependencies not yet in the E2E project

---

## Feature file

```gherkin
@audit-trail @us-26.3 @p0 @backend @db-immutability
Feature: Database-Level Immutability Enforcement (US 26.3 — PRD1042-780)
  As a Platform Architect / System Admin
  I want audit tables to be INSERT + SELECT only at the database permission layer
  So that no application role can ever update or delete a persisted audit record
  under any circumstance — even if the application layer is compromised.

  Background:
    Given the RefiNext test database is provisioned with the audit schema
    And role "audit_app_role" is the runtime application role for audit tables
    And role "audit_migration_role" is the privileged DDL role for audit tables
    And the runtime application service is configured to connect as "audit_app_role"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-05
  # Positive verification that the application role's grant matrix on every
  # audit table is exactly INSERT + SELECT — never UPDATE, never DELETE, never
  # TRUNCATE. This is the foundational check: immutability is a permission
  # constraint, not a code convention.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-05 @p0
  Scenario: audit_app_role grant matrix is INSERT+SELECT only across all audit tables (AC-01, AC-05)
    Given the audit schema contains at least one table matching pattern "audit_%"
    When I query "information_schema.role_table_grants" for grantee "audit_app_role" on every audit table
    Then every audit table should have privilege "INSERT" granted to "audit_app_role"
    And every audit table should have privilege "SELECT" granted to "audit_app_role"
    And no audit table should have privilege "UPDATE" granted to "audit_app_role"
    And no audit table should have privilege "DELETE" granted to "audit_app_role"
    And no audit table should have privilege "TRUNCATE" granted to "audit_app_role"
    And no audit table should have privilege "REFERENCES" granted to "audit_app_role"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # The privileged migration role owns DDL and only DDL. Its grants must be
  # disjoint from the runtime app role's DML grants — no overlap ensures
  # least-privilege segregation.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0
  Scenario: audit_migration_role grant matrix is DDL only, disjoint from app-role grants (AC-02)
    Given role "audit_migration_role" is provisioned as the audit-schema owner
    When I inspect the privileges held by "audit_migration_role"
    Then "audit_migration_role" should own the audit schema (schema owner)
    And "audit_migration_role" should have DDL privileges (CREATE, ALTER, DROP) on the audit schema
    And "audit_migration_role" should NOT be granted to "audit_app_role"
    And "audit_app_role" should NOT be a member of "audit_migration_role"
    And no runtime connection pool should authenticate as "audit_migration_role"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-08
  # Positive control: a legitimate audit event, written through the standard
  # audit repository as "audit_app_role", must land in the table and be
  # retrievable via scoped SELECT. Confirms the INSERT path itself works and
  # anchors the negative UPDATE/DELETE scenarios below.
  # ---------------------------------------------------------------------------

  @happy-path @ac-08 @p0
  Scenario: Legitimate audit INSERT succeeds and record is retrievable via scoped SELECT (AC-08)
    Given I am connected to the database as "audit_app_role"
    And no audit record exists for correlation ID "test-corr-001"
    When the audit repository emits an audit event with correlation ID "test-corr-001", actor_type "manual_user", and action_type "USER_LOGIN_SUCCESS"
    Then the INSERT should succeed and return exactly one new audit record
    And a SELECT by correlation ID "test-corr-001" should return the same record with its original values
    And the audit record's timestamp should be immutable and set by the database (not the client)

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # The core immutability guarantee: any UPDATE issued through the runtime
  # app role must be rejected by the database engine itself — surfacing as a
  # permission-denied error at the DB layer, NOT as an application-level
  # exception intercepted before the SQL is sent. If this test passes only
  # because the app repository has no update() method, the assertion is void.
  # The test issues raw SQL directly through the runtime connection.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: UPDATE attempted through audit_app_role is rejected by the DB layer (AC-06)
    Given I am connected to the database as "audit_app_role"
    And at least one audit record exists in table "audit_events"
    When I execute raw SQL "UPDATE audit_events SET action_type = 'TAMPERED' WHERE id = <existing_id>"
    Then the database should reject the statement with a permission error
    And the error code should indicate insufficient privilege (e.g. PostgreSQL SQLSTATE "42501")
    And the error message should reference the missing UPDATE privilege on "audit_events"
    And the original audit record should be unchanged when re-read

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Same guarantee for DELETE. The DB rejects, not the application.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: DELETE attempted through audit_app_role is rejected by the DB layer (AC-07)
    Given I am connected to the database as "audit_app_role"
    And at least one audit record exists in table "audit_events"
    When I execute raw SQL "DELETE FROM audit_events WHERE id = <existing_id>"
    Then the database should reject the statement with a permission error
    And the error code should indicate insufficient privilege (e.g. PostgreSQL SQLSTATE "42501")
    And the error message should reference the missing DELETE privilege on "audit_events"
    And the audit record should still exist when re-read via SELECT
    And a subsequent "TRUNCATE audit_events" as "audit_app_role" should also be rejected

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03, AC-13
  # Soft-delete is an application-layer mutation pattern disguised as a
  # column. The migration governance lint must reject any migration that
  # introduces such a column onto an audit table. Outline covers the three
  # canonical forbidden patterns named in the story.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @ac-13 @p0
  Scenario Outline: Migration governance rejects soft-delete columns on audit tables (AC-03, AC-13)
    Given a candidate migration adds column "<column>" of type "<column_type>" to table "audit_events"
    When the migration governance lint is executed against the candidate
    Then the lint should reject the migration
    And the rejection reason should reference "soft-delete pattern prohibited on audit tables"
    And the migration should not proceed to any environment
    And the rejection should be recorded in the governance review log

    Examples:
      | column       | column_type |
      | is_deleted   | boolean     |
      | deleted_at   | timestamptz |
      | active       | boolean     |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # The runtime application service must not carry credentials for the
  # migration role. This is a deployment/configuration invariant — if the
  # runtime process could authenticate as the migration role, DB-layer
  # immutability collapses because that role holds DDL and can drop tables.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Runtime application service must not hold audit_migration_role credentials (AC-11)
    Given the runtime application service configuration is loaded
    When I inspect the database credentials available to the running application process
    Then the runtime credentials should authenticate as "audit_app_role" only
    And no runtime configuration key should contain credentials for "audit_migration_role"
    And no environment variable available to the runtime should contain the migration role's password or connection string
    And attempting to open a connection as "audit_migration_role" from the runtime process should fail with an authentication error

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Defense-in-depth: even if a misconfiguration accidentally hands the
  # migration role's credentials to the runtime service, the service must
  # refuse to start rather than silently run with over-privileged DB access.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: Application service configured with migration role credentials fails startup (AC-14)
    Given the application service is misconfigured with database credentials for "audit_migration_role"
    When the application service attempts to start
    Then the service startup should fail
    And the startup error should reference "audit role misconfiguration" or an equivalent guard message
    And no application connection should be established as "audit_migration_role"
    And an alert should be raised to the platform governance channel
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
