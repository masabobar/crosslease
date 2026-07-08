# PRD1042-599 — US 29.18 | TENANT MANAGEMENT | Tenant Context Propagation

Generated: 2026-07-07
Story: PRD1042-599 — US 29.18 | TENANT MANAGEMENT | Tenant Context Propagation
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (21 ACs, description present, stakeholder-reviewed by Iva Marković + Philipp Maute 404-alignment pass 2026-06-02, QA ready)
ACs with Gherkin scenarios: 5 of 21 | Blocked: 5 (D17 / D20 / TM-17 / audit-inspection API) | Excluded: 11 (edge-case or separate-feature — scope filter table only)
Figma design: N/A — backend/security enforcement story, no UI surface (Stage 2 SKIPPED — design-blind mode, consistent with PRD1042-46 / PRD1042-47 / PRD1042-50 / PRD1042-51 pattern)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                     | Blocking dependency                                             |
| ----- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| AC-08 | Missing tenant_id claim cannot be produced from an authenticated UI session                | D17 — test-forge endpoint to strip/manipulate JWT claims        |
| AC-09 | Tampered/expired/unrecognised tenant_id requires JWT-secret access or forge endpoint       | D17 — TEST_JWT_SECRET or test-forge endpoint (per CLAUDE.md)    |
| AC-11 | Requires seeded Archived tenant with token that references it; needs fixture + forge       | D20 + Archived-tenant fixture + D17 token construction          |
| AC-15 | Cross-tenant System Admin operation depends on TM-17 (cross-tenant allow-list) not shipped | TM-17 (Cross-Tenant Allow-List) + audit-log inspection API      |
| AC-18 | TENANT_CONTEXT_VALIDATION_FAILED audit event assertion requires audit-log inspection API   | PRD1042-37 (Audit Trail) audit-log query API + trigger from D17 |

---

## AC Scope Filter

| AC    | Description                                                                         | Classification     | Rationale                                                                                                              |
| ----- | ----------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Every authenticated request carries verified tenant context                         | `happy-path`       | Testable via API round-trip on an authenticated session — own-tenant list succeeds, positive baseline for the story    |
| AC-02 | Tenant context established at auth; propagated through call chain                   | `edge-case`        | Internal service-to-service mechanics; not observable via E2E surface                                                  |
| AC-03 | System Admin/ops users operate within session-derived context; no explicit select   | `happy-path`       | Testable via UI — no tenant selector visible; own-tenant resources returned automatically                              |
| AC-04 | Tenant context matches Tenant Management registration                               | `edge-case`        | Internal validation detail; observable indirectly via AC-01 pass                                                       |
| AC-05 | tenant_id field spec (M, UUID/Tenant Code, immutable)                               | `edge-case`        | Field-spec implementation detail — token payload structure not visible at E2E boundary                                 |
| AC-06 | tenant_context_type enum (user_session / service_admin)                             | `edge-case`        | Field-spec internal claim structure                                                                                    |
| AC-07 | originating_actor propagated unchanged                                              | `edge-case`        | Field-spec internal; observable only via audit event contents (separate audit-log spec)                                |
| AC-08 | Missing tenant_id → HTTP 404                                                        | `Blocked`          | Requires D17 test-forge endpoint to produce authenticated request with stripped tenant claim                           |
| AC-09 | Tampered/expired tenant_id → HTTP 404                                               | `Blocked`          | Requires D17 (TEST_JWT_SECRET or test-forge) — same pattern as PRD1042-43 AC-14                                        |
| AC-10 | Client-asserted tenant context must not be trusted                                  | `main-error`       | Testable at UI/API layer — inject `X-Tenant-Id` header on authenticated request; server-side session value authorative |
| AC-11 | Archived/non-existent tenant → HTTP 404                                             | `Blocked`          | Requires D20 second tenant + Archived-tenant fixture + D17 token construction                                          |
| AC-12 | DAL applies mandatory tenant filter                                                 | `separate-feature` | BE unit/integration test — not observable at E2E surface                                                               |
| AC-13 | Missing tenant context at DAL aborts query                                          | `separate-feature` | BE unit/integration test — not observable at E2E surface                                                               |
| AC-14 | Service-to-service propagation via inter-service token; independent validation      | `separate-feature` | Backend internal service mesh — not observable at E2E                                                                  |
| AC-15 | Cross-tenant System Admin op requires explicit claim + CROSS_TENANT_ADMIN_OPERATION | `Blocked`          | Depends on TM-17 (cross-tenant allow-list) not shipped; audit inspection API also required                             |
| AC-16 | Integration tests verify zero cross-tenant leakage across ≥2 seeded tenants         | `main-error`       | Testable at E2E — Tenant A user cannot see Tenant B resources; requires D20 second seeded tenant                       |
| AC-17 | PostgreSQL RLS on every multi-tenant table                                          | `separate-feature` | DB-layer safety net; unit-level DB test — not observable at E2E                                                        |
| AC-18 | TENANT_CONTEXT_VALIDATION_FAILED audit event on failure                             | `Blocked`          | Requires audit-log inspection API (PRD1042-37) + trigger from D17-forged requests                                      |
| AC-19 | HTTP 404 (not 401/403) for all tenant-context validation failures                   | `happy-path`       | Umbrella assertion — standalone verifiable via cross-tenant list attempt (AC-16 pattern) and header-injection (AC-10)  |
| AC-20 | ≤5ms p99 latency per hop                                                            | `edge-case`        | Performance NFR — separate performance test suite, not functional E2E                                                  |
| AC-21 | Cross-tenant leakage tests in CI/CD, not bypassable                                 | `separate-feature` | CI/CD infrastructure concern; not user-facing behaviour                                                                |

**Gherkin generated for:** AC-01, AC-03, AC-10, AC-16, AC-19
**Blocked (no Gherkin):** AC-08, AC-09, AC-11, AC-15, AC-18
**No Gherkin (edge-case or separate-feature):** AC-02, AC-04, AC-05, AC-06, AC-07, AC-12, AC-13, AC-14, AC-17, AC-20, AC-21

---

## Scenarios summary

| Tag           | Scenario                                                                                                      | AC           | Priority | E2E                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ------------ | -------- | -------------------------------------------------- |
| `@happy-path` | Authenticated user request returns own-tenant resources without explicit tenant selection (Outline — 3 roles) | AC-01, AC-03 | P0       | `⚙️` needs D20 for cross-tenant assertion baseline |
| `@main-error` | Client-injected X-Tenant-Id header is ignored; server enforces session-bound tenant                           | AC-10        | P0       | `✅`                                               |
| `@main-error` | Cross-tenant resource access returns 404, not 403 (Outline — Tenant A → Tenant B resources, 3 resource types) | AC-16, AC-19 | P0       | `⚙️` needs D20                                     |
| `@main-error` | Cross-tenant list scope isolation — Tenant A user sees only Tenant A records                                  | AC-16, AC-01 | P0       | `⚙️` needs D20                                     |
| `@main-error` | Direct URL manipulation to cross-tenant resource ID returns 404 (existence not disclosed)                     | AC-16, AC-19 | P0       | `⚙️` needs D20                                     |

Active scenario blocks: 5 (2 Outlines + 3 Scenarios)
E2E automation candidates: 1 of 5 scenarios `✅` (4 need D20 second seeded tenant)

---

## Feature file

```gherkin
@tenant-isolation @us-29.18 @p0
Feature: Tenant Context Propagation (US 29.18 — PRD1042-599)
  As a System Admin
  I want every service in the platform to propagate and validate tenant context on every request
  So that tenant isolation is structurally enforced at every service boundary and a missing or manipulated tenant context is always rejected

  Background:
    Given the platform is running with tenant context validation middleware enabled
    And Tenant A "acme-bank" is seeded and Active
    And Tenant B "beta-bank" is seeded and Active

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03
  # An authenticated user's request carries a session-bound tenant context that
  # the server derives without any client input. No tenant selector, no per-
  # request tenant parameter — the user simply asks for a resource and the
  # server scopes to their tenant automatically. Positive baseline: things work
  # for the legitimate case.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @p0
  Scenario Outline: Authenticated user retrieves own-tenant resources without explicit tenant selection (AC-01, AC-03)
    Given a <role> user "<email>" belongs to Tenant A "acme-bank"
    And the user is logged in
    When the user requests "<endpoint>"
    Then the response status should be 200
    And the response payload should contain only records where tenant_id equals Tenant A's id
    And no request from the client carried a tenant_id header or body field
    And no UI element prompted the user to select a tenant

    Examples:
      | role           | email             | endpoint      |
      | System Admin   | admin@acme-bank   | /api/users    |
      | Front Office   | fo@acme-bank      | /api/users    |
      | Back Office    | bo@acme-bank      | /api/users    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Client-asserted tenant context must not be trusted. If the frontend attempts
  # to upgrade or switch tenant scope by sending X-Tenant-Id in the request
  # header, the server IGNORES it — the session-bound tenant is authoritative.
  # This is the frontend-boundary contract: no way to escalate via headers.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0 @e2e-ready
  Scenario: Client-injected X-Tenant-Id header is ignored; server enforces session-bound tenant (AC-10)
    Given a System Admin user "admin@acme-bank" belongs to Tenant A "acme-bank"
    And the user is logged in
    When the client sends a request to "/api/users" with header "X-Tenant-Id: <Tenant B id>"
    Then the response status should be 200
    And the response payload should contain only records where tenant_id equals Tenant A's id
    And no record belonging to Tenant B should appear in the payload
    And the request should be handled as if no X-Tenant-Id header were present

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16, AC-19
  # Cross-tenant resource access must return HTTP 404, never 403. Returning 403
  # would confirm that a resource with that id exists in another tenant —
  # disclosure via response code. 404 is the only acceptable answer regardless
  # of whether the resource exists in the other tenant or nowhere at all.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @ac-19 @p0
  Scenario Outline: Cross-tenant resource fetch returns 404, not 403 (AC-16, AC-19)
    Given a System Admin user "admin@acme-bank" belongs to Tenant A "acme-bank"
    And the user is logged in
    And a "<resource_type>" with id "<tenant_b_resource_id>" exists in Tenant B "beta-bank"
    When the user requests "<endpoint_with_id>"
    Then the response status should be 404
    And the response status should NOT be 403
    And the response body should NOT reveal that the resource exists in another tenant
    And no record from Tenant B should appear in the response payload

    Examples:
      | resource_type | tenant_b_resource_id                   | endpoint_with_id                          |
      | user          | 11111111-2222-3333-4444-tenantBuser001 | /api/users/11111111-2222-3333-4444-tenantBuser001 |
      | user role     | 22222222-3333-4444-5555-tenantBrole002 | /api/users/22222222-3333-4444-5555-tenantBrole002 |
      | invitation    | 33333333-4444-5555-6666-tenantBinv0003 | /api/invitations/33333333-4444-5555-6666-tenantBinv0003 |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16, AC-01
  # List endpoints must scope to the caller's tenant. A Tenant A user listing
  # "all users" must see only Tenant A users — never a mixed set, never a
  # broader default scope. This is the query-time DAL enforcement (the
  # complement of the resource-fetch check above).
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @ac-01 @p0
  Scenario: List endpoint scopes strictly to caller tenant — no cross-tenant leakage (AC-16, AC-01)
    Given a System Admin user "admin@acme-bank" belongs to Tenant A "acme-bank"
    And 5 users are seeded in Tenant A
    And 3 users are seeded in Tenant B "beta-bank"
    And the user is logged in
    When the user requests "/api/users"
    Then the response status should be 200
    And the response payload should contain exactly 5 records
    And every record in the payload should have tenant_id equal to Tenant A's id
    And no record in the payload should have tenant_id equal to Tenant B's id

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16, AC-19
  # Direct URL manipulation — the classic IDOR attack pattern. User guesses or
  # constructs a URL pointing to a resource id that exists in another tenant.
  # Response must be indistinguishable from "id does not exist anywhere." The
  # 404 response body must not include tenant metadata, resource type
  # confirmation, or any signal that the id is real.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @ac-19 @p0
  Scenario: Direct URL manipulation to cross-tenant resource id returns undistinguishable 404 (AC-16, AC-19)
    Given a Front Office user "fo@acme-bank" belongs to Tenant A "acme-bank"
    And a user with id "cccccccc-dddd-eeee-ffff-tenantBuser999" exists in Tenant B "beta-bank"
    And a user id "cccccccc-dddd-eeee-ffff-nowhere00000" does not exist in any tenant
    And the user is logged in
    When the user requests "/api/users/cccccccc-dddd-eeee-ffff-tenantBuser999"
    And also requests "/api/users/cccccccc-dddd-eeee-ffff-nowhere00000"
    Then both responses should return HTTP 404
    And both response bodies should be identical in shape and content
    And neither response body should contain the string "tenant"
    And neither response body should indicate that either id refers to a real resource
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
