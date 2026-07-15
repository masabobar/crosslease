# PRD1042-737 — US 29.19 | Tenant Management | Tenant License Limit Management

Generated: 2026-07-07
Story: PRD1042-737 — US 29.19 | Tenant Management | Tenant License Limit Management
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (24 ACs, description present, stakeholder-reviewed by Philipp Maute + Vesna Plakalovic, QA ready)
ACs with Gherkin scenarios: 10 of 24 | Blocked: 3 (D-Audit, D-Concurrency, D-EnvOverride) | Excluded: 11 (edge-case or separate-feature — scope filter table only)
Figma design: No Figma URL linked to parent story or subtasks — Stage 2 FAILED (design-blind; UI touchpoints assumed to extend Tenant Detail View PRD1042-585 node 52:1806 pattern — copy unverified)

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin cannot modify license limits (platform-only); may have view access to own tenant. Bank Admin (`bank_admin`, User Type `bank_tenant`) is a tenant-level role — license limits are a platform-level commercial configuration reserved to System Admin. Bank Admin therefore joins the 404-not-403 write-attempt Outline (AC-11/AC-16/AC-18) and is added as a candidate viewer for own-tenant read (AC-05) — see OQ-BA-01 below since the Jira permission matrix on PRD1042-737 does not yet list Bank Admin as an authorized viewer.

**OQ-BA-01 (Bank Admin view access):** The Permission Matrix on PRD1042-737 lists System Admin (write + view), Support (view), and Auditor (view) — Bank Admin is not listed. User-provided context on 2026-07-08 states Bank Admin "may have view access to own tenant." The AC-05 Outline below includes Bank Admin conditionally; if PO confirms Bank Admin is NOT a viewer, drop the Bank Admin row from AC-05 and instead add Bank Admin to the 404-on-read scope in AC-16.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                              | Blocking dependency                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| AC-14 | TENANT_LICENSE_LIMIT_CHANGED audit event field-level assertion requires audit log query API                         | D-Audit — no PRD1042-37 audit query harness at E2E layer                   |
| AC-15 | First-deployment env-var default seeding requires REFINEXT*DEFAULT_MAX*\* env override + service restart at runtime | D-EnvOverride — no fixture to swap env vars mid-suite                      |
| AC-22 | Concurrent atomic creation at exact limit boundary requires racing two POSTs at millisecond timing                  | D-Concurrency — no parallel-request fixture; verify at BE integration tier |

---

## AC Scope Filter

| AC    | Description                                                                                   | Classification     | Rationale                                                                                   |
| ----- | --------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| AC-01 | System Admin can configure max_lc_count, max_bank_user_count, max_users_per_lc per tenant     | `happy-path`       | Core PATCH flow — one Outline covers all three fields                                       |
| AC-02 | max_users_per_lc is single value per tenant (no per-LC overrides in MVP)                      | `edge-case`        | Data-model invariant; verified via BE schema, not observable E2E                            |
| AC-03 | System validates active count against limit at creation boundary (LC / Bank User / LC User)   | `happy-path`       | Merged with AC-04 into main-error creation scenarios below                                  |
| AC-04 | Limit reached → creation rejected with specified user-facing message                          | `main-error`       | Three explicit copy strings — one Outline covering LC/Bank User/LC User                     |
| AC-05 | System Admin and Support can view configured limit + current utilisation                      | `happy-path`       | Read scenario — one Outline for both roles                                                  |
| AC-06 | max_lc_count ≥ 1. Default 25 seeded from REFINEXT_DEFAULT_MAX_LC                              | `edge-case`        | Min-value validation and env-var default seeding — covered by AC-24 minimum boundary        |
| AC-07 | max_bank_user_count ≥ 1. Default 10 seeded from REFINEXT_DEFAULT_MAX_BANK_USERS               | `edge-case`        | Min-value validation and env-var default seeding — covered by AC-24 minimum boundary        |
| AC-08 | max_users_per_lc ≥ 1. Default 2 seeded from REFINEXT_DEFAULT_MAX_USERS_PER_LC                 | `edge-case`        | Min-value validation and env-var default seeding — covered by AC-24 minimum boundary        |
| AC-09 | Reduction of max_lc_count or max_bank_user_count rejected if new value < current active count | `main-error`       | Two rejection scenarios; error must specify current + new                                   |
| AC-10 | Reduction of max_users_per_lc rejected if any LC has more active users than proposed value    | `main-error`       | Rejection scenario; error must name offending LC + counts                                   |
| AC-11 | Limit fields not editable by tenant-level operational users (UI or API)                       | `main-error`       | Merged with AC-16/AC-18 into 404-not-403 role gating scenario                               |
| AC-12 | On LC/Bank User/LC User creation: system checks count < max before proceeding                 | `edge-case`        | Same enforcement path as AC-03/AC-04 — no separate scenario                                 |
| AC-13 | Utilisation counts derived at query time (not stored)                                         | `edge-case`        | Implementation detail; observable through AC-05 read scenario                               |
| AC-14 | On limit change: TENANT_LICENSE_LIMIT_CHANGED audit event written (one per field changed)     | `Blocked`          | D-Audit — no PRD1042-37 audit query harness at E2E layer                                    |
| AC-15 | First-deployment defaults read from env vars at service startup; applied at tenant creation   | `Blocked`          | D-EnvOverride — no fixture to swap env vars mid-suite; verify at BE integration tier        |
| AC-16 | License limit write endpoints return HTTP 404 on all non-System Admin write endpoints         | `main-error`       | 404-not-403 domain rule — canonical negative test; covers AC-11/AC-18 too                   |
| AC-17 | Enforcement checks run server-side at creation boundary (client-side not sufficient)          | `edge-case`        | Architecture assertion — not directly observable E2E; covered by AC-03/AC-04 negative flows |
| AC-18 | Tenant-scoped operational user must never modify license limits through any API path          | `edge-case`        | Merged into AC-16 404-not-403 scenario                                                      |
| AC-19 | Limit set to exactly current active count → allowed. No new creations until raised            | `main-error`       | Boundary allow + subsequent create rejection — high-value scenario                          |
| AC-20 | Reduction below current active count → 422 rejected with details                              | `edge-case`        | Same path as AC-09 — status code assertion added to AC-09 scenario                          |
| AC-21 | max_users_per_lc reduced below existing LC user count → 422, error names offending LC         | `edge-case`        | Same path as AC-10 — status code assertion added to AC-10 scenario                          |
| AC-22 | Concurrent creation at exact limit boundary → atomic; only one succeeds                       | `Blocked`          | D-Concurrency — no parallel-request fixture at E2E layer                                    |
| AC-23 | Tenant has no explicit limit → platform defaults applied retroactively on first access        | `separate-feature` | Migration-time behaviour; covered by data migration validation suite, not per-story E2E     |
| AC-24 | Any limit set to 0 → validation error rejected. Min value 1                                   | `main-error`       | Minimum boundary — one Outline covering all three fields                                    |

**Gherkin generated for:** AC-01, AC-03, AC-04, AC-05, AC-09, AC-10, AC-11, AC-16, AC-18, AC-19, AC-24
**Blocked (no Gherkin):** AC-14, AC-15, AC-22
**No Gherkin (edge-case or separate-feature):** AC-02, AC-06, AC-07, AC-08, AC-12, AC-13, AC-17, AC-20, AC-21, AC-23

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.** Never interleave.

| Tag           | Scenario                                                                                                                          | AC                | Priority | E2E          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------- | ------------ |
| `@happy-path` | System Admin configures license limits for a tenant (Outline — 3 fields)                                                          | AC-01             | P0       | ✅           |
| `@happy-path` | System Admin / Support / Bank Admin view current limits and utilisation (Outline — 3 roles)                                       | AC-05             | P0       | ✅           |
| `@main-error` | Creation blocked with user-facing message at limit (Outline — 3 entity types)                                                     | AC-03,AC-04       | P0       | ⚙️ needs D19 |
| `@main-error` | Reduction below current active count rejected with 422 (Outline — 2 fields)                                                       | AC-09             | P0       | ⚙️ needs D19 |
| `@main-error` | max_users_per_lc reduction below LC's active user count rejected with 422                                                         | AC-10             | P0       | ⚙️ needs D19 |
| `@main-error` | Non-System-Admin roles hit 404-not-403 on license-limit write (Outline — 7 rows: 5 platform-role + 2 Bank Admin own/cross tenant) | AC-11,AC-16,AC-18 | P0       | ✅           |
| `@main-error` | Limit set to exactly current count allowed; subsequent create rejected                                                            | AC-19             | P0       | ⚙️ needs D19 |
| `@main-error` | Limit set to 0 rejected with validation error (Outline — 3 fields)                                                                | AC-24             | P0       | ✅           |

Active scenario blocks: 8 (6 Outlines + 2 Scenarios)
E2E automation candidates: 3 of 8 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @license-limits @us-29.19 @p0
Feature: Tenant License Limit Management (US 29.19 — PRD1042-737)
  As a Power User / System Admin
  I want to configure and enforce maximum Leasing Company counts, Bank User counts, and users-per-Leasing-Company per tenant
  So that each tenant operates within its licensed capacity and the platform can enforce commercial limits at the creation boundary

  Background:
    Given tenant "acme-bank" exists in the platform
    And I am authenticated as a System Admin

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # System Admin can configure each of the three limit fields independently
  # via PATCH /api/tenants/{id}/license-limits. All three fields are Mandatory
  # integer values with a minimum of 1 and no platform-defined maximum.
  # Design unverified — copy of confirmation toast / success indicator taken
  # from spec, not from Figma frame.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario Outline: System Admin configures license limit field (AC-01)
    Given tenant "acme-bank" currently has "<current_active>" active <entity_scope>
    When I PATCH "/api/tenants/acme-bank/license-limits" with "<field>" set to "<new_value>"
    Then the response status should be 200
    And the tenant "<field>" should be "<new_value>"
    And the response should include the updated utilisation for <entity_scope>

    Examples:
      | field                 | current_active | new_value | entity_scope                |
      | max_lc_count          | 10             | 30        | leasing companies           |
      | max_bank_user_count   | 4              | 15        | bank users                  |
      | max_users_per_lc      | 1              | 5         | users across all leasing companies |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Both System Admin and Support roles can read configured limit + current
  # utilisation. Support is read-only; write is System Admin only (see AC-16
  # 404-not-403 scenario). The GET /api/tenants/{id} response is extended with
  # max_lc_count, max_bank_user_count, max_users_per_lc, lc_utilisation,
  # bank_user_utilisation, and per-LC lc_user_utilisation.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0 @e2e-ready
  Scenario Outline: <role> views tenant license limits and utilisation (AC-05)
    Given tenant "acme-bank" has max_lc_count=25, max_bank_user_count=10, max_users_per_lc=2
    And tenant "acme-bank" currently has 12 active leasing companies, 6 active bank users
    And I am authenticated as <role> with tenant scope "<tenant_scope>"
    When I GET "/api/tenants/acme-bank"
    Then the response status should be 200
    And the response should include max_lc_count of 25
    And the response should include max_bank_user_count of 10
    And the response should include max_users_per_lc of 2
    And the response should include lc_utilisation of 12
    And the response should include bank_user_utilisation of 6
    And the response should include lc_user_utilisation per leasing company

    # Bank Admin row is conditional on OQ-BA-01 resolution. Bank Admin can only
    # ever view its OWN tenant — cross-tenant read returns 404 (see AC-16 rule).
    # If PO confirms Bank Admin is NOT a viewer, delete the bank_admin row and
    # add it to the 404-on-read case below.
    Examples:
      | role         | tenant_scope |
      | System Admin | platform     |
      | Support      | platform     |
      | Bank Admin   | acme-bank    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03, AC-04
  # At the creation boundary the enforcement service checks count < max BEFORE
  # proceeding. On limit reached, creation is rejected with the exact spec copy.
  # The three user-facing messages are copied verbatim from the Jira story
  # (design unverified — Figma quota exhausted, no linked frame). If the
  # implementation diverges from these exact strings, this test will catch it.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @ac-04 @p0
  Scenario Outline: Creation blocked at license limit with user-facing message (AC-03, AC-04)
    Given tenant "acme-bank" has "<field>" set to "<limit>"
    And tenant "acme-bank" currently has "<limit>" active <entity_type>
    When I attempt to create a new <entity_type> under tenant "acme-bank"
    Then the response status should be 422
    And the response error message should be "<expected_message>"
    And the new <entity_type> should NOT be created

    Examples:
      | entity_type      | field              | limit | expected_message                                                                                                    |
      | leasing company  | max_lc_count       | 25    | This tenant has reached its licensed limit of 25 leasing companies. Contact your platform administrator to extend. |
      | bank user        | max_bank_user_count| 10    | This tenant has reached its licensed limit of 10 bank users. Contact your platform administrator to extend.        |
      | LC user          | max_users_per_lc   | 2     | This leasing company has reached its licensed limit of 2 users. Contact your bank administrator to extend.         |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09 (also covers AC-20)
  # A limit reduction is rejected when the new value is lower than the current
  # active count for that entity type. Error message must specify both the
  # current count and the new requested limit so the operator can decide
  # whether to deactivate entities first or keep the higher limit.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario Outline: Reduction below current active count rejected with 422 (AC-09)
    Given tenant "acme-bank" currently has "<current>" active <entity_type>
    When I PATCH "/api/tenants/acme-bank/license-limits" with "<field>" set to "<new_value>"
    Then the response status should be 422
    And the response error message should contain "<current>"
    And the response error message should contain "<new_value>"
    And the tenant "<field>" should remain unchanged

    Examples:
      | field               | current | new_value | entity_type       |
      | max_lc_count        | 12      | 8         | leasing companies |
      | max_bank_user_count | 6       | 3         | bank users        |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (also covers AC-21)
  # Per-LC user limit is validated per Leasing Company. If ANY LC under the
  # tenant currently has more active users than the proposed value, the
  # reduction is rejected. Error message names the offending LC, its active
  # count, and the requested limit.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: max_users_per_lc reduction rejected when an LC exceeds proposed value (AC-10)
    Given tenant "acme-bank" has leasing company "LC-Bravo" with 4 active users
    And tenant "acme-bank" has max_users_per_lc set to 5
    When I PATCH "/api/tenants/acme-bank/license-limits" with max_users_per_lc set to 3
    Then the response status should be 422
    And the response error message should contain "LC-Bravo"
    And the response error message should contain "4"
    And the response error message should contain "3"
    And the tenant max_users_per_lc should remain 5

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11, AC-16, AC-18
  # 404-not-403 domain rule: license limit write endpoint returns HTTP 404
  # (not 403) on all non-System-Admin roles. This prevents role enumeration and
  # tenant-level operational users must never be able to modify limits through
  # any API path.
  #
  # Bank Admin (bank_admin, User Type bank_tenant) is added per PRD1042-48 —
  # license limits are platform-level commercial configuration; Bank Admin is
  # explicitly a tenant-level role and CANNOT modify limits on its own tenant
  # OR any other tenant. Both cases collapse to the same 404 pattern under the
  # AC-18 rule ("must never be able to modify license limits through any API
  # path"). Two Bank Admin rows exercise both surfaces: own tenant + cross
  # tenant.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @ac-16 @ac-18 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles hit 404-not-403 on license-limit write (AC-11, AC-16, AC-18)
    Given I am authenticated as <role> with tenant scope "<tenant_scope>"
    When I PATCH "/api/tenants/<target_tenant>/license-limits" with max_lc_count set to 30
    Then the response status should be 404
    And the response status should NOT be 403
    And the tenant max_lc_count should remain unchanged

    Examples:
      | role         | tenant_scope | target_tenant |
      | Front Office | platform     | acme-bank     |
      | Back Office  | platform     | acme-bank     |
      | LC User      | platform     | acme-bank     |
      | Support      | platform     | acme-bank     |
      | Auditor      | platform     | acme-bank     |
      | Bank Admin   | acme-bank    | acme-bank     |
      | Bank Admin   | other-bank   | acme-bank     |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-19
  # Boundary allow: limit set to EXACTLY the current active count is allowed;
  # subsequent creation is rejected. This is a distinct behaviour from AC-09
  # (which rejects reduction BELOW current). The exact-equal case is the
  # tightest legal state and must be exercised.
  # ---------------------------------------------------------------------------

  @main-error @ac-19 @p0
  Scenario: Limit set to exactly current active count allowed; next creation rejected (AC-19)
    Given tenant "acme-bank" currently has 12 active leasing companies
    When I PATCH "/api/tenants/acme-bank/license-limits" with max_lc_count set to 12
    Then the response status should be 200
    And the tenant max_lc_count should be 12
    When I attempt to create a new leasing company under tenant "acme-bank"
    Then the response status should be 422
    And the response error message should contain "reached its licensed limit of 12 leasing companies"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-24
  # Minimum value validation: any limit field set to 0 is rejected. Minimum
  # value is 1 for all three fields. Covers AC-06/AC-07/AC-08 min-value rules
  # in one Outline.
  # ---------------------------------------------------------------------------

  @main-error @ac-24 @p0 @e2e-ready
  Scenario Outline: Limit set to 0 rejected with validation error (AC-24)
    When I PATCH "/api/tenants/acme-bank/license-limits" with "<field>" set to 0
    Then the response status should be 422
    And the response error message should indicate the minimum value is 1
    And the tenant "<field>" should remain unchanged

    Examples:
      | field                |
      | max_lc_count         |
      | max_bank_user_count  |
      | max_users_per_lc     |
```
