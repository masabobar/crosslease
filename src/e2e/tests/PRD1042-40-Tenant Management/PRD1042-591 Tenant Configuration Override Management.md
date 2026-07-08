# PRD1042-591 — US 29.10 | Tenant Management | Tenant Configuration Override Management

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin owns bank-side configuration for own tenant; System Admin retains platform-level overrides. Per the story's permission matrix, Bank Admin (formerly "Power User") has READ-ONLY access to overrides for own tenant (`R (own tenant)` in permission matrix). Create/modify remains System-Admin-only; Bank Admin write attempts and cross-tenant reads → 404 (RefiNext 404-not-403). Philipp Maute comment 38524 (2026-07-03) explicitly flagged the Bank Power User / System Admin terminology alignment for this story.

Generated: 2026-07-07
Story: PRD1042-591 — US 29.10 | Tenant Management | Tenant Configuration Override Management
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (16 ACs synthesized from Functional Requirements, Field Spec, Validation Rules, System Behavior, Security, Edge Cases; description present, stakeholder-reviewed, Jira status "Dev in progress")
ACs with Gherkin scenarios: 10 of 16 | Blocked: 3 (D-Audit, Seed-Harness, PRD1042-77) | Excluded: 5 (edge-case or separate-feature — scope filter table only)
Figma design: none linked — story description and child tickets (PRD1042-677 BE / PRD1042-678 FE / PRD1042-679 QA) contain no Figma URL. Stage 2 FAILED design-blind. No design coverage for override create/modify screens, stale reference warning UI, or role-gated navigation. Assertions target HTTP contract, error codes, and audit event shape only — no verbatim copy verification possible. Backend-heavy configuration story; UI likely deferred per Philipp Maute comment 38524 flagging external dependencies on Product Templates / Workflow Definitions / Document Policy Sets not yet built.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                              | Blocking dependency                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| AC-10 | Stale reference warning requires seeding a platform object, creating an override, then bumping the platform object version — no seed harness exists | Seed-Harness — platform-object versioning fixture for Product Template / Workflow Definition / Document Policy Set   |
| AC-15 | Audit event verification (CONFIG_OVERRIDE_CREATED, CONFIG_OVERRIDE_MODIFIED) requires audit-log read fixture; parity with US 29.9 AC-17 Blocker     | D-Audit — audit log inspection fixture                                                                               |
| AC-05 | "Inherit by reference" is a runtime resolution behaviour of the child config services (Product Template epic, Rate Table epic), not TM-10 storage   | Delegates to child services — not observable at TM-10 endpoint boundary; also depends on Rate Tables (post-November) |

---

## AC Scope Filter

| AC     | Description                                                                                                                                                                                                    | Classification     | Rationale                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01  | System Admin creates override on Active tenant for a supported override type (Product Template / Workflow Definition / Document Policy)                                                                        | `happy-path`       | Core success flow — POST /api/tenants/{id}/overrides returns 201 with override record populated by System Admin actor                                 |
| AC-02  | System Admin modifies existing override with justification (min 20 chars)                                                                                                                                      | `happy-path`       | Core success flow — PUT /api/tenants/{id}/overrides/{overrideId} returns 200; second happy path pairs with AC-01 create                               |
| AC-03  | Override stores only parameter diffs; references platform default by reference (no full copy)                                                                                                                  | `edge-case`        | Storage-shape implementation detail, not observable via HTTP contract at E2E layer                                                                    |
| AC-04  | Changes to one tenant's override do not affect defaults or other tenants                                                                                                                                       | `main-error`       | Tenant isolation invariant — collapsed into AC-14 cross-tenant 404 Outline; separate positive check would require full multi-tenant seed harness      |
| AC-05  | Tenants without override inherit current platform-default behavior by reference                                                                                                                                | `Blocked`          | Runtime resolution is child-service concern (Product Template epic, Workflow Definition epic); TM-10 does not expose an inheritance query endpoint    |
| AC-06  | Override Type enum limited to {Product Template, Rate Table, Workflow Definition, Document Policy Set}; other values rejected                                                                                  | `edge-case`        | Zod / enum validation returns 400; standard schema-level rejection, covered by contract test at BE layer                                              |
| AC-07  | Platform object reference must be active/valid at creation; invalid or non-existent reference rejected                                                                                                         | `main-error`       | Validation directly blocks the create workflow — user cannot proceed with a broken reference                                                          |
| AC-08  | Governance Justification < 20 chars → validation error                                                                                                                                                         | `main-error`       | Directly blocks modification submit — user cannot proceed                                                                                             |
| AC-09  | Override Type is immutable after creation — PUT that changes type rejected                                                                                                                                     | `main-error`       | Immutability guard blocks a destructive edit; parity with US 29.14 Seed Package Assignment immutability pattern                                       |
| AC-10  | Stale reference warning displayed when referenced platform object version superseded post-creation                                                                                                             | `Blocked`          | Requires platform-object version-bump fixture (Seed-Harness); no way to reproduce stale state deterministically in E2E without harness                |
| AC-11  | Create override on Suspended tenant → 422                                                                                                                                                                      | `main-error`       | Lifecycle-gated action — main workflow blocker; collapsed with AC-12 into a single Outline                                                            |
| AC-12  | Create override on Archived tenant → 422                                                                                                                                                                       | `main-error`       | Lifecycle-gated action — merged with AC-11 Outline (both are non-Active states returning 422)                                                         |
| AC-13  | Non-System-Admin roles receive 404 on all override endpoints (Front Office, Back Office/Risk, LC User, Support, Auditor); Bank Admin write attempts return 404 (view-only on own tenant per permission matrix) | `main-error`       | RefiNext 404-not-403 role pattern — critical security invariant; Bank Admin split into READ-happy-path (AC-13a) + WRITE-404 (AC-13b) per PRD1042-48   |
| AC-13a | Bank Admin can VIEW overrides on OWN tenant (permission matrix: `R (own tenant)`)                                                                                                                              | `happy-path`       | New per PRD1042-48 — Bank Admin owns bank-side configuration visibility for own tenant; GET returns 200 with override list                            |
| AC-13b | Bank Admin cannot CREATE / MODIFY overrides (permission matrix column is `✗` for Create + Modify)                                                                                                              | `main-error`       | New per PRD1042-48 — RefiNext 404-not-403; Bank Admin write attempts on override endpoint indistinguishable from role denial for non-privileged roles |
| AC-13c | Bank Admin cross-tenant override read attempts return 404 (tenant scope validation, cannot view other bank tenants)                                                                                            | `main-error`       | New per PRD1042-48 — Bank Admin tenant-binding is immutable; cross-tenant read leaks tenant existence otherwise                                       |
| AC-14  | Cross-tenant override modification returns 404 (tenant scope validation)                                                                                                                                       | `main-error`       | Tenant isolation invariant — RefiNext 404-not-403 cross-tenant pattern; covers AC-04 leakage-prevention as its dual                                   |
| AC-15  | Audit events CONFIG_OVERRIDE_CREATED / CONFIG_OVERRIDE_MODIFIED emitted with tenant, type, object ref, actor, params diff, justification, timestamp                                                            | `Blocked`          | Audit log read fixture unavailable — same D-Audit blocker as US 29.9 AC-17                                                                            |
| AC-16  | Rate Table override type support                                                                                                                                                                               | `separate-feature` | Rate Tables deferred post-November per Vesna Plakalovic comment 37034 on parent epic PRD1042-40 (2026-06-12) — excluded from current sprint entirely  |

**Gherkin generated for:** AC-01, AC-02, AC-07, AC-08, AC-09, AC-11 (+ AC-12), AC-13, AC-13a, AC-13b, AC-13c, AC-14
**Blocked (no Gherkin):** AC-05, AC-10, AC-15
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04 (rolled into AC-14), AC-06, AC-16

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.** Never interleave.

| Tag           | Scenario                                                                                                       | AC             | Priority | E2E                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- | -------------- | -------- | ------------------------------------------------------------ |
| `@happy-path` | System Admin creates a Product Template override on an Active tenant                                           | AC-01          | P0       | ⚙️ needs Seed-Harness (Product Template fixture)             |
| `@happy-path` | System Admin modifies existing Workflow Definition override with justification                                 | AC-02          | P0       | ⚙️ needs Seed-Harness (existing override fixture)            |
| `@happy-path` | Bank Admin views overrides on own tenant (permission matrix `R (own tenant)`)                                  | AC-13a         | P0       | ⚙️ needs Seed-Harness (existing override on own tenant)      |
| `@main-error` | Invalid platform object reference at creation rejected                                                         | AC-07          | P0       | ⚙️ needs Seed-Harness                                        |
| `@main-error` | Governance Justification below 20 characters is rejected on modification                                       | AC-08          | P0       | ⚙️ needs Seed-Harness (existing override)                    |
| `@main-error` | Attempt to change Override Type on existing record is rejected (immutable)                                     | AC-09          | P0       | ⚙️ needs Seed-Harness (existing override)                    |
| `@main-error` | Override create on non-Active tenant (Suspended, Archived) returns 422 (Scenario Outline — 2 lifecycle states) | AC-11, AC-12   | P0       | ⚙️ needs Seed-Harness (Suspended + Archived tenant fixtures) |
| `@main-error` | Non-System-Admin roles receive 404 on override endpoints (Scenario Outline — 5 roles)                          | AC-13          | P0       | ✅ @e2e-ready                                                |
| `@main-error` | Bank Admin CREATE / MODIFY override attempts return 404 (permission matrix: write not permitted)               | AC-13b         | P0       | ⚙️ needs Seed-Harness (bank_admin session on own tenant)     |
| `@main-error` | Bank Admin cross-tenant override read returns 404 (tenant-scope isolation, immutable tenant binding)           | AC-13c         | P0       | ⚙️ needs D20 (second bank tenant with override)              |
| `@main-error` | Cross-tenant override modification returns 404 (tenant scope isolation)                                        | AC-14 (+AC-04) | P0       | ⚙️ needs D20 (second seeded tenant with override)            |

Active scenario blocks: 11 (3 Scenarios in happy-path + 8 Scenarios/Outlines in main-error; count reflects distinct scenario blocks after Bank Admin split)
E2E automation candidates: 1 of 11 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.10 @p0
Feature: Tenant Configuration Override Management (US 29.10 — PRD1042-591)
  As a System Admin
  I want to create and modify tenant-specific configuration overrides
  So that a tenant can operate with parameters that differ from platform defaults without affecting other tenants

  Background:
    Given a System Admin user is authenticated
    And a Bank Admin user "bank-admin-alpha@bank.com" (role "bank_admin", user_type "bank_tenant", tenant_scope "tenant-alpha") exists
    And an Active tenant "tenant-alpha" exists
    And platform-default configuration objects (Product Template, Workflow Definition, Document Policy Set) exist and are active

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # System Admin can create a new override for a supported override type on an
  # Active tenant, and can modify an existing override provided the governance
  # justification meets the 20-character minimum. Design is unverified (no
  # Figma link on story or children); assertions target HTTP contract shape
  # only — copy, layout, and stale-reference banner UX not covered.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario: System Admin creates a Product Template override on an Active tenant (AC-01)
    Given the platform-default Product Template "PT-001" is active
    When the System Admin sends POST "/api/tenants/tenant-alpha/overrides" with:
      | field                     | value                                          |
      | override_type             | PRODUCT_TEMPLATE                               |
      | platform_object_reference | PT-001                                         |
      | override_parameters       | { "max_ltv": 0.85 }                            |
      | governance_justification  | Tenant Alpha requires higher LTV per contract  |
    Then the response status should be 201
    And the response body should include a non-empty "id"
    And "override_type" should be "PRODUCT_TEMPLATE"
    And "platform_object_reference" should be "PT-001"
    And "created_by" should be the System Admin user id
    And "created_at" should be a UTC ISO-8601 timestamp
    And the override should be scoped to tenant "tenant-alpha"

  @happy-path @ac-02 @p0
  Scenario: System Admin modifies an existing Workflow Definition override with a valid justification (AC-02)
    Given a Workflow Definition override "OV-1001" exists on tenant "tenant-alpha" referencing platform object "WF-050"
    When the System Admin sends PUT "/api/tenants/tenant-alpha/overrides/OV-1001" with:
      | field                    | value                                                       |
      | override_parameters      | { "approval_step": "back-office-review" }                   |
      | governance_justification | Aligning approval step with tenant compliance policy update |
    Then the response status should be 200
    And "last_modified_by" should be the System Admin user id
    And "last_modified_at" should be a UTC ISO-8601 timestamp
    And "override_type" should still be "WORKFLOW_DEFINITION"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-13a (Bank Admin READ own tenant)
  # Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06) and the story's
  # permission matrix ("Power User (Bank Admin)" column = `R (own tenant)`),
  # Bank Admin has read-only visibility into overrides on the bank tenant they
  # own. GET returns 200 with the override list. Bank Admin does NOT have
  # create or modify rights on this endpoint — those are covered by AC-13b.
  # ---------------------------------------------------------------------------

  @happy-path @ac-13a @p0
  Scenario: Bank Admin views overrides on own tenant (AC-13a)
    Given a Product Template override "OV-5001" exists on tenant "tenant-alpha"
    And the Bank Admin session is scoped to tenant "tenant-alpha"
    When the Bank Admin sends GET "/api/tenants/tenant-alpha/overrides"
    Then the response status should be 200
    And the response body should include override "OV-5001"
    And each returned override should be scoped to tenant "tenant-alpha"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (invalid platform object reference)
  # Platform Object Reference must resolve to an active, valid object at
  # creation. Design copy for the rejection message is unverified.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Invalid platform object reference at creation is rejected (AC-07)
    Given no platform object exists with reference "PT-NOT-FOUND"
    When the System Admin sends POST "/api/tenants/tenant-alpha/overrides" with:
      | field                     | value                                     |
      | override_type             | PRODUCT_TEMPLATE                          |
      | platform_object_reference | PT-NOT-FOUND                              |
      | override_parameters       | { "max_ltv": 0.85 }                       |
      | governance_justification  | Attempt to override a non-existent object |
    Then the response status should be 400
    And no override record should be created for tenant "tenant-alpha"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08 (short justification)
  # Governance Justification is mandatory on modification and must be at least
  # 20 characters. Enforcement is at the API boundary, not just UI.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario Outline: Governance Justification below 20 characters is rejected on modification (AC-08)
    Given a Product Template override "OV-2001" exists on tenant "tenant-alpha"
    When the System Admin sends PUT "/api/tenants/tenant-alpha/overrides/OV-2001" with:
      | field                    | value                    |
      | override_parameters      | { "max_ltv": 0.9 }       |
      | governance_justification | <justification>          |
    Then the response status should be 400
    And the override record should NOT be modified

    Examples:
      | justification        |
      |                      |
      | Too short            |
      | Only 19 chars ok yes |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09 (Override Type immutable after creation)
  # Once created, the override_type field cannot change. Matches the seed
  # package assignment immutability pattern from US 29.14.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario: Attempt to change Override Type on an existing record is rejected (AC-09)
    Given a Product Template override "OV-3001" exists on tenant "tenant-alpha"
    When the System Admin sends PUT "/api/tenants/tenant-alpha/overrides/OV-3001" with:
      | field                    | value                                                |
      | override_type            | WORKFLOW_DEFINITION                                  |
      | governance_justification | Attempting to change type from PT to WF for tenant   |
    Then the response status should be 400
    And the override's "override_type" should still be "PRODUCT_TEMPLATE"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11, AC-12 (non-Active tenant lifecycle)
  # Override create/modify only permitted on Active tenants. Suspended and
  # Archived tenants return 422. Draft tenant behavior is unspecified in the
  # story and flagged as an ambiguity — not scenarioed here until BA confirms.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @ac-12 @p0
  Scenario Outline: Override create on non-Active tenant returns 422 (AC-11, AC-12)
    Given a tenant "tenant-<state>" exists in lifecycle state "<state>"
    When the System Admin sends POST "/api/tenants/tenant-<state>/overrides" with:
      | field                     | value                                                       |
      | override_type             | PRODUCT_TEMPLATE                                            |
      | platform_object_reference | PT-001                                                      |
      | override_parameters       | { "max_ltv": 0.85 }                                         |
      | governance_justification  | Attempt to override on non-Active tenant lifecycle state    |
    Then the response status should be 422
    And no override record should be created for tenant "tenant-<state>"

    Examples:
      | state     |
      | Suspended |
      | Archived  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13 (RBAC: non-System-Admin roles get 404)
  # RefiNext 404-not-403 pattern for role-gated resource visibility. Applies
  # equally to GET, POST, and PUT — endpoint must not disclose its existence
  # to roles outside the System Admin permission matrix.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles receive 404 on override endpoints (AC-13)
    Given a user "<user>" is authenticated with role "<role>"
    When the user sends "<method>" to "<path>"
    Then the response status should be 404

    Examples:
      | role                    | user             | method | path                                         |
      | Front Office            | fo@bank.com      | GET    | /api/tenants/tenant-alpha/overrides          |
      | Back Office / Risk      | bo@bank.com      | POST   | /api/tenants/tenant-alpha/overrides          |
      | LC User                 | lc@lender.com    | GET    | /api/tenants/tenant-alpha/overrides          |
      | Support                 | support@bank.com | POST   | /api/tenants/tenant-alpha/overrides          |
      | Auditor                 | auditor@bank.com | PUT    | /api/tenants/tenant-alpha/overrides/OV-9999  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13b (Bank Admin cannot CREATE / MODIFY)
  # Per PRD1042-48 and the story's permission matrix, Bank Admin is READ-ONLY
  # for overrides on own tenant. Both POST (create) and PUT (modify) attempts
  # return 404 — RefiNext 404-not-403 pattern, indistinguishable from role
  # denial for other non-privileged roles. Applies even when Bank Admin is
  # scoped to the tenant in the URL path.
  # ---------------------------------------------------------------------------

  @main-error @ac-13b @p0
  Scenario Outline: Bank Admin CREATE / MODIFY override attempts on own tenant return 404 (AC-13b)
    Given the Bank Admin session is scoped to tenant "tenant-alpha"
    And a Product Template override "OV-6001" exists on tenant "tenant-alpha"
    When the Bank Admin sends "<method>" to "<path>" with:
      | field                     | value                                             |
      | override_type             | PRODUCT_TEMPLATE                                  |
      | platform_object_reference | PT-001                                            |
      | override_parameters       | { "max_ltv": 0.9 }                                |
      | governance_justification  | Bank Admin attempt to modify override own tenant  |
    Then the response status should be 404
    And the override "OV-6001" on tenant "tenant-alpha" should be unchanged

    Examples:
      | method | path                                                |
      | POST   | /api/tenants/tenant-alpha/overrides                 |
      | PUT    | /api/tenants/tenant-alpha/overrides/OV-6001         |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13c (Bank Admin cross-tenant READ → 404)
  # Bank Admin tenant-binding is immutable (PRD1042-48). A Bank Admin scoped to
  # tenant-alpha cannot view overrides on tenant-beta — even the READ that
  # would succeed on their own tenant returns 404 when the path targets a
  # different tenant. Prevents tenant-existence enumeration across bank
  # tenants.
  # ---------------------------------------------------------------------------

  @main-error @ac-13c @p0
  Scenario: Bank Admin cross-tenant override read returns 404 (AC-13c)
    Given the Bank Admin session is scoped to tenant "tenant-alpha"
    And tenant "tenant-beta" exists and is Active
    And a Product Template override "OV-7001" exists on tenant "tenant-beta"
    When the Bank Admin sends GET "/api/tenants/tenant-beta/overrides"
    Then the response status should be 404
    And the response body should NOT disclose the existence of tenant "tenant-beta"
    And the response body should NOT disclose the existence of override "OV-7001"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14 (cross-tenant scope isolation)
  # A System Admin scoped to one tenant cannot modify another tenant's
  # override — the endpoint returns 404, not 403, per the RefiNext tenant
  # isolation pattern (never leak resource existence across tenants). Also
  # satisfies AC-04 (one tenant's override changes do not reach another).
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: Cross-tenant override modification returns 404 (AC-14, AC-04)
    Given tenant "tenant-alpha" has a Product Template override "OV-4001"
    And tenant "tenant-beta" exists and is Active
    And the System Admin session is scoped to tenant "tenant-beta"
    When the System Admin sends PUT "/api/tenants/tenant-alpha/overrides/OV-4001" with:
      | field                    | value                                                     |
      | override_parameters      | { "max_ltv": 0.7 }                                        |
      | governance_justification | Attempt to modify another tenant's override from beta scope |
    Then the response status should be 404
    And the override "OV-4001" on tenant "tenant-alpha" should be unchanged
```
