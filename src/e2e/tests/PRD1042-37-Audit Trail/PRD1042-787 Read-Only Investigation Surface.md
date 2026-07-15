# PRD1042-787 — US 26.10 | AUDIT TRAIL | Read-Only Investigation Surface for Authorized Roles

Generated: 2026-07-10
Story: PRD1042-787 — US 26.10 | AUDIT TRAIL | Read-Only Investigation Surface for Authorized Roles
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (17 ACs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 8 of 17 | Blocked: 1 (PRD1042-786 US 26.09 audit-of-audit read path) | Excluded: 8 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:11090, file 7EkiVhANXOkn65k0jG4uEJ — Screen "E26 — Audit Trail — Investigation Surface" (Stage 2 FAILED — Figma MCP quota exhausted and REST API auth unavailable in this session; MVP scope derived from story description + grooming decisions 2026-06-16 Philipp Maute)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                             | Blocking dependency                                         |
| ----- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| AC-07 | Every query must emit an Audit Log Access Record (US 26.09); no audit-of-audit read path available | PRD1042-786 US 26.09 — access logging (blocking dependency) |

---

## AC Scope Filter

| AC    | Description                                                                                                                      | Classification     | Rationale                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | Tenant-scoped investigation surface accessible to System/Power User, Auditor, Support                                            | `happy-path`       | Core RBAC — verified via Outline: authorized roles land on surface; unauthorized roles → 404                                   |
| AC-02 | Filter by entityType, entityId, actionType, actor, dateRange (MVP basic-table set per grooming 2026-06-16)                       | `happy-path`       | Basic-table filters only — advanced filters (triggerSourceCode, deltaType, retentionCategory) DEFERRED to backlog per grooming |
| AC-03 | Pre-built views: Contract history, Financing history, document actions, system default flags, override actions, Auditor sessions | `separate-feature` | DEFERRED to backlog per grooming decision (Philipp Maute 2026-06-16); MVP = basic-table layout only                            |
| AC-04 | Investigation Bookmarks — name a case                                                                                            | `separate-feature` | DEFERRED to backlog per grooming decision (Philipp Maute 2026-06-16)                                                           |
| AC-05 | Surface is strictly read-only: no edit/delete/export/bulk-action affordance at UI or API                                         | `happy-path`       | Verified by absence-of-UI-controls + API mutation rejection (main-error branch in AC-10 scenario merges the API leg)           |
| AC-06 | Sensitive fields masked in standard view; unmasking via privileged Auditor path                                                  | `separate-feature` | Masking behaviour owned by US 26.05 (masking); this surface only renders whatever the masked query returns                     |
| AC-07 | Every query produces an Audit Log Access Record (US 26.09)                                                                       | `Blocked`          | Requires US 26.09 (PRD1042-786) audit-of-audit read path — no way to assert record creation without downstream API             |
| AC-08 | Results are paginated; queries are tenant-filtered server-side                                                                   | `happy-path`       | Pagination visible in UI; cross-tenant filter enforced server-side (verified via cross-tenant 404 in main-error branch)        |
| AC-09 | Archived records remain fully queryable                                                                                          | `separate-feature` | Owned by US 26.13 (retention governance / archived storage); this story assumes archived rows are already query-visible        |
| AC-10 | Backend authorization mandatory on every query; read-only server-authoritative; fail-open prohibited                             | `main-error`       | 404 for unauthorized roles + tampered mutation attempts on GET-only endpoint                                                   |
| AC-11 | No anonymous / shared-credential access; invalidated/expired sessions cannot query                                               | `main-error`       | Expired session → 401 + re-auth prompt (needs D16 TEST_TOKEN_TTL_SECONDS override)                                             |
| AC-12 | Export affordance absent in V1; export permission cannot be self-granted                                                         | `main-error`       | No export button in UI; attempting to POST self-grant → 404/403 (merged with AC-17)                                            |
| AC-13 | Filter queries over 10-year full record set within platform-configured SLA (AC-AT-Perf2)                                         | `edge-case`        | Performance NFR — not an E2E functional concern; measured via load-test suite, not Playwright                                  |
| AC-14 | Edge: Edit/delete attempt — no affordance; API rejects mutation                                                                  | `main-error`       | Merged into AC-10 API-rejection scenario                                                                                       |
| AC-15 | Edge: Expired session query — blocked; re-auth required                                                                          | `main-error`       | Merged into AC-11 expired-session scenario                                                                                     |
| AC-16 | Edge: Very large result set — paginated; resultCount logged                                                                      | `edge-case`        | Pagination boundary detail; `resultCount` logged is internal audit-log field owned by US 26.09                                 |
| AC-17 | Edge: Self-grant of export permission — rejected                                                                                 | `main-error`       | Merged into AC-12 export-affordance scenario                                                                                   |

**Gherkin generated for:** AC-01, AC-02, AC-05, AC-08, AC-10, AC-11, AC-12
**Blocked (no Gherkin):** AC-07
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04, AC-06, AC-09, AC-13, AC-14 (merged), AC-15 (merged), AC-16, AC-17 (merged)

---

## Scenarios summary

| Tag           | Scenario                                                                                         | AC                  | Priority | E2E          |
| ------------- | ------------------------------------------------------------------------------------------------ | ------------------- | -------- | ------------ |
| `@happy-path` | Authorized roles access the investigation surface (Scenario Outline — 3 authorized roles)        | AC-01, AC-08        | P0       | ✅           |
| `@happy-path` | Filter by allowed dimensions returns filtered results (Scenario Outline — 5 basic-table filters) | AC-02               | P0       | ✅           |
| `@happy-path` | Investigation surface exposes no mutation or export affordance                                   | AC-05, AC-12        | P0       | ✅           |
| `@main-error` | Unauthorized roles cannot access the investigation surface (Scenario Outline — 3 denied roles)   | AC-01, AC-10        | P0       | ✅           |
| `@main-error` | Cross-tenant query returns 404, not 403                                                          | AC-08, AC-10        | P0       | ⚙️ needs D20 |
| `@main-error` | Mutation attempts on the investigation API are rejected                                          | AC-05, AC-10, AC-14 | P0       | ✅           |
| `@main-error` | Expired session is blocked and re-authentication is required                                     | AC-11, AC-15        | P0       | ⚙️ needs D16 |
| `@main-error` | Self-grant of export permission is rejected                                                      | AC-12, AC-17        | P0       | ✅           |

Active scenario blocks: 8 (5 Outlines + 3 Scenarios)
E2E automation candidates: 6 of 8 scenarios ✅

---

## Feature file

```gherkin
@audit-trail @us-26.10 @p0
Feature: Read-Only Investigation Surface for Authorized Roles (US 26.10 — PRD1042-787)
  As an Auditor / Support / Power User
  I want a tenant-scoped, read-only investigation surface with filtering
  So that I can reconstruct entity history without any ability to alter the evidence record

  Background:
    Given the investigation surface is exposed at "/audit/investigation"
    And the surface is scoped to the caller's tenant server-side

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-08
  # Verifies the RBAC access matrix: System/Power User, Auditor, and Support
  # each land on the investigation surface with a paginated results grid.
  # Confirms tenant-scoping is applied server-side (results contain only the
  # caller's tenant rows). Pre-built views and Bookmarks are DEFERRED per
  # grooming (Philipp Maute 2026-06-16) — MVP renders the basic-table layout.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-08 @p0 @e2e-ready
  Scenario Outline: Authorized roles access the investigation surface (AC-01, AC-08)
    Given an <role> user with email <email> exists
    When I log in as <email>
    And I navigate to "/audit/investigation"
    Then I should see the investigation surface with a results grid
    And the results grid should be paginated
    And every result row should belong to my tenant

    Examples:
      | role              | email                                              |
      | System Admin      | dejan.nikolic+admin@holycode.com                   |
      | Auditor           | dejan.nikolic+automationauditor@holycode.com       |
      | Support           | dejan.nikolic+automationsupport@holycode.com       |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # Basic-table filter set locked by grooming 2026-06-16: entityType,
  # entityId, actionType, actor, dateRange. Advanced filters
  # (triggerSourceCode, deltaType, retentionCategory) are DEFERRED to the
  # backlog and MUST NOT appear in the MVP UI. Full-text narrative search
  # is V2 (OQ-AT-09 default).
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0 @e2e-ready
  Scenario Outline: Filter by allowed MVP dimensions returns filtered results (AC-02)
    Given I am logged in as Auditor
    And I am on the investigation surface
    When I apply the filter "<filter_field>" with value "<filter_value>"
    Then the results grid should only contain rows where <filter_field> equals <filter_value>
    And the pagination control should reflect the filtered row count

    Examples:
      | filter_field | filter_value                     |
      | entityType   | Contract                         |
      | entityId     | CNTR-000123                      |
      | actionType   | STATE_TRANSITION                 |
      | actor        | dejan.nikolic+admin@holycode.com |
      | dateRange    | 2026-06-01..2026-06-30           |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05, AC-12
  # Read-only invariant verified by ABSENCE of mutation and export UI.
  # No edit, delete, bulk-action, or export button may exist anywhere on the
  # surface. This is a UI-affordance check; the API leg is exercised
  # separately in the main-error group (AC-10 mutation rejection).
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @ac-12 @p0 @e2e-ready
  Scenario: Investigation surface exposes no mutation or export affordance (AC-05, AC-12)
    Given I am logged in as Auditor
    And I am on the investigation surface
    Then I should NOT see an "Edit" button on any row
    And I should NOT see a "Delete" button on any row
    And I should NOT see an "Export" button anywhere on the page
    And I should NOT see a bulk-action selection column
    And I should NOT see any row-context menu offering mutation actions

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01, AC-10
  # RBAC negative path. Front Office, Back Office/Risk, and LC User are
  # explicitly denied by the permission matrix. Per RefiNext §5 tenant
  # isolation rule, denied roles receive 404 (not 403) so that the surface
  # cannot be enumerated by role.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @ac-10 @p0 @e2e-ready
  Scenario Outline: Unauthorized roles cannot access the investigation surface (AC-01, AC-10)
    Given a <role> user with email <email> exists
    When I log in as <email>
    And I navigate to "/audit/investigation"
    Then I should receive a 404 response
    And I should NOT see the investigation surface

    Examples:
      | role         | email                                          |
      | Front Office | dejan.nikolic+automationfo@holycode.com        |
      | Back Office  | dejan.nikolic+automationbo@holycode.com        |
      | LC User      | dejan.nikolic+automationlco@holycode.com       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08, AC-10
  # Cross-tenant query must return 404, never 403 or partial data. The
  # server-side tenant filter is authoritative; a user cannot see or
  # enumerate another tenant's rows even by supplying an explicit tenantId
  # filter or crafting the request directly. Blocks on D20 (second seeded
  # tenant) until the fixture lands.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @ac-10 @p0
  Scenario: Cross-tenant query returns 404, not 403 (AC-08, AC-10)
    Given I am logged in as Auditor on tenant "Bank Tenant A"
    And an audit record "AUD-999" exists on tenant "Bank Tenant B"
    When I send a GET to "/audit/investigation?entityId=AUD-999"
    Then the response status should be 404
    And the response should NOT reveal the existence of Bank Tenant B
    And no rows from Bank Tenant B should appear in the results

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05, AC-10, AC-14
  # Read-only enforcement at the API layer. The investigation endpoint only
  # exposes GET; any mutation verb (POST/PUT/PATCH/DELETE) must be rejected
  # with 405 Method Not Allowed or 404 (endpoint not exposed). Fail-open is
  # explicitly prohibited by AC-AT-S1.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @ac-10 @ac-14 @p0 @e2e-ready
  Scenario Outline: Mutation attempts on the investigation API are rejected (AC-05, AC-10)
    Given I am logged in as Auditor
    When I send a <method> request to "/audit/investigation"
    Then the response status should be <status>
    And the audit record set should be unchanged

    Examples:
      | method | status |
      | POST   | 405    |
      | PUT    | 405    |
      | PATCH  | 405    |
      | DELETE | 405    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11, AC-15
  # Session invalidation is authoritative. Once a session expires or is
  # invalidated, further queries against the investigation surface must be
  # blocked with 401 and the user must be prompted to re-authenticate.
  # Blocks on D16 (TEST_TOKEN_TTL_SECONDS override) so the test can force
  # session expiry without waiting real time.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @ac-15 @p0
  Scenario: Expired session is blocked and re-authentication is required (AC-11, AC-15)
    Given I am logged in as Auditor
    And I am on the investigation surface
    When my session token expires
    And I attempt to submit a filter query
    Then the query should return a 401 response
    And I should be prompted to re-authenticate
    And I should NOT see any audit records

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12, AC-17
  # Export permission cannot be self-granted from within the surface. Even a
  # privileged Auditor cannot escalate to gain export capability by calling
  # the permission API directly — AC-AT-S3 makes this an explicit hard rule
  # backed by governance approval outside the audit surface.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @ac-17 @p0 @e2e-ready
  Scenario: Self-grant of export permission is rejected (AC-12, AC-17)
    Given I am logged in as Auditor
    And I am on the investigation surface
    When I send a POST to "/permissions/self" with role "audit_export"
    Then the response status should be 403
    And I should NOT be granted the "audit_export" permission
    And no "Export" button should appear on the investigation surface
```
