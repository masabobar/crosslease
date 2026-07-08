# PRD1042-598 — US 29.17 | Tenant Management | Cross-Tenant Allow-List Governance & Audit

Generated: 2026-07-07
Story: PRD1042-598 — US 29.17 | Tenant Management | Cross-Tenant Allow-List Governance & Audit
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (16 ACs derived from Functional/Security/Edge sections, permission matrix present, stakeholder-reviewed by Philipp Maute comment 36037 + Vesna alignment 36042, QA ready)
ACs with Gherkin scenarios: 6 of 16 | Blocked: 2 (TM-04 Governance History UI) | Excluded: 8 (edge-case or separate-feature — scope filter table only)
Figma design: No Figma URL on story or FE subtask PRD1042-699 (Stage 2 FAILED — backend governance/enforcement story; Governance History UI belongs to TM-04)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                              | Blocking dependency                      |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| AC-10 | Governance History tab filter for CROSS_TENANT_ACCESS_PERMITTED/BLOCKED events is TM-04's rendering responsibility. | TM-04 — Governance History tab rendering |
| AC-13 | Security classification indicator on blocked events is TM-04's UI concern; enforcement here is event write only.    | TM-04 — Governance History tab rendering |

---

## AC Scope Filter

| AC    | Description                                                                                                        | Classification     | Rationale                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Allow-list is a closed set; operations not on the list are prohibited by default.                                  | `happy-path`       | Positive proof: whitelisted System Admin platform-admin op permitted; PERMITTED event emitted.                                          |
| AC-02 | Every cross-tenant attempt — permitted or blocked — produces an immutable audit event.                             | `main-error`       | Verified via blocked attempts producing CROSS_TENANT_ACCESS_BLOCKED events; PERMITTED path covered in AC-01 outline.                    |
| AC-03 | Cross-tenant write operations prohibited for all roles in V1.                                                      | `main-error`       | Every write role attempt (System Admin, Support, Auditor, Front Office, Back Office, LC) blocked with 404 + BLOCKED event.              |
| AC-04 | Adding a new cross-tenant operation to the allow-list requires formal governance approval (no inline add).         | `separate-feature` | Governance workflow is out of V1 scope; described as future-add requirement with Four-Eyes, not a current runtime API surface.          |
| AC-05 | System Admin: platform admin ops (tenant lifecycle, module activation) — Two-Actor Approval, no biz data.          | `happy-path`       | Positive path for the SysAdmin allow-list entry; Two-Actor / Four-Eyes verified via PRD1042-77 flow; no tenant business data access.    |
| AC-06 | Support User: cross-tenant diagnostic read requires active Support Access Grant + banner + KYC/AML masking.        | `happy-path`       | Positive path with active grant; without grant → AC-09 blocked path. TM-16 grant fixture required.                                      |
| AC-07 | Auditor: read-only, assigned tenant only, engagement window applies, audit-of-audit logging.                       | `happy-path`       | Positive path within engagement window on assigned tenant; access outside assignment → AC-09 blocked path.                              |
| AC-08 | System Admin: cross-tenant aggregated reporting (platform-level aggregated views only, no tenant detail).          | `separate-feature` | Owned by Reporting epic; this story establishes the allow-list entry only.                                                              |
| AC-09 | Missing/invalid/unverifiable/archived/non-existent tenant context → HTTP 404, no state distinction exposed.        | `main-error`       | The core tenant-existence-inference protection; verified across all five variants with identical 404 body.                              |
| AC-10 | Cross-tenant access events filtered and displayed in Governance History tab.                                       | `Blocked`          | TM-04 owns the Governance History UI; this story writes the events, TM-04 renders them.                                                 |
| AC-11 | CROSS_TENANT_ACCESS_PERMITTED event fields (op type, role, actor, source/target tenant, access type, ts).          | `edge-case`        | Audit event payload schema — verified at data layer, not observable via user-facing E2E. Field-level check belongs in BE integration.   |
| AC-12 | CROSS_TENANT_ACCESS_BLOCKED event fields including block reason and security classification indicator.             | `edge-case`        | Same as AC-11 — schema-level verification, out of E2E scope.                                                                            |
| AC-13 | Blocked events shown in Governance History with security classification indicator.                                 | `Blocked`          | TM-04 UI concern.                                                                                                                       |
| AC-14 | Enforcement implemented at authorization enforcement layer AND API gateway (defense-in-depth).                     | `edge-case`        | Architectural placement — not observable per-request beyond the 404 already asserted in AC-09.                                          |
| AC-15 | Tenant context: verified, non-malleable, JWT claim, server-side verification, client-asserted context not trusted. | `main-error`       | Tampered/forged JWT tenant claim rejection is the observable outcome — 404, no scope broadening. OQ-10 resolved: JWT-claim-with-tenant. |
| AC-16 | Data access layer applies mandatory tenant filter; missing/invalid context → request rejection.                    | `edge-case`        | Enforcement detail — indirectly asserted by AC-09 outcomes.                                                                             |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-05, AC-06, AC-07, AC-09, AC-15
**Blocked (no Gherkin):** AC-10, AC-13
**No Gherkin (edge-case or separate-feature):** AC-04, AC-08, AC-11, AC-12, AC-14, AC-16

---

## Scenarios summary

| Tag           | Scenario                                                                          | AC           | Priority | E2E                                          |
| ------------- | --------------------------------------------------------------------------------- | ------------ | -------- | -------------------------------------------- |
| `@happy-path` | System Admin platform-admin op is allow-listed and permitted (AC-01, AC-05)       | AC-01, AC-05 | P0       | ⚙️ needs D-Enforcement + PRD1042-77          |
| `@happy-path` | Support User cross-tenant diagnostic read with active grant (AC-06)               | AC-06        | P0       | ⚙️ needs TM-16 grant fixture                 |
| `@happy-path` | Auditor read on assigned tenant within engagement window (AC-07)                  | AC-07        | P0       | ⚙️ needs Auditor engagement fixture          |
| `@main-error` | Cross-tenant write blocked for all roles (V1 prohibition) (AC-02, AC-03)          | AC-02, AC-03 | P0       | ⚙️ needs D20 (second tenant) + D-Enforcement |
| `@main-error` | Tenant-existence inference protected: 404 for all invalid contexts (AC-02, AC-09) | AC-02, AC-09 | P0       | ⚙️ needs D20 + D-Enforcement                 |
| `@main-error` | Tampered JWT tenant claim rejected — no scope broadening (AC-15)                  | AC-15        | P0       | ⚙️ needs D17 (test-forge JWT)                |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 0 of 6 scenarios ✅ (all require infra fixtures)

---

## Feature file

```gherkin
@tenant-management @cross-tenant @us-29.17 @p0
Feature: Cross-Tenant Allow-List Governance & Audit (US 29.17 — PRD1042-598)
  As a System Admin
  I want cross-tenant operations to be governed by an explicit allow-list and every violation attempt to be blocked and audit logged
  So that tenant boundary integrity is enforced and observable

  Background:
    Given two seeded Bank Tenants "Bank-A" and "Bank-B" exist and are Active
    And the cross-tenant allow-list is the closed set defined in US 29.17
    And CROSS_TENANT_ACCESS_PERMITTED and CROSS_TENANT_ACCESS_BLOCKED events are persisted to Audit Trail (PRD1042-37)
    And tenant context is propagated via signed JWT tenant_id claim (OQ-10 resolved)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-05
  # System Admin executing a whitelisted platform-admin operation (tenant
  # lifecycle / module activation) is the positive proof that the allow-list is
  # a closed but non-empty set. Two-Actor Approval (Four-Eyes per PRD1042-77)
  # gates the write; no tenant business data is disclosed by the operation.
  # Design unverified: no Figma provided; Governance History rendering by TM-04.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-05 @p0
  Scenario: System Admin platform-admin op is allow-listed and permitted (AC-01, AC-05)
    Given I am authenticated as "System Admin" bound to platform scope
    And a second System Admin has approved the pending platform-admin change per Four-Eyes (PRD1042-77)
    When I execute a platform-admin operation on tenant "Bank-B" (module activation via TM-05)
    Then the response status is 200
    And no tenant business data of "Bank-B" appears in the response
    And a CROSS_TENANT_ACCESS_PERMITTED event is written with fields:
      | operation_type    | PLATFORM_ADMIN                                  |
      | requesting_role   | SYSTEM_ADMIN                                    |
      | actor             | <actor user id>                                 |
      | source_tenant     | PLATFORM                                        |
      | target_tenant     | Bank-B                                          |
      | access_type       | READ_WRITE                                      |
      | timestamp         | <iso8601>                                       |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # Support User with an active Support Access Grant (TM-16) may read diagnostic
  # data cross-tenant. The persistent banner must be shown, KYC/AML/pricing/risk
  # fields must be masked regardless of grant, and the session must be audit
  # logged per-session.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0
  Scenario: Support User cross-tenant diagnostic read with active grant (AC-06)
    Given I am authenticated as "Support User"
    And an active Support Access Grant (TM-16) for target tenant "Bank-B" is issued to me
    When I open a diagnostic read view of "Bank-B"
    Then the response status is 200
    And a persistent cross-tenant context banner is displayed identifying "Bank-B"
    And KYC/AML fields are masked
    And pricing fields are masked
    And risk score fields are masked
    And a CROSS_TENANT_ACCESS_PERMITTED event is written with operation_type "SUPPORT_DIAGNOSTIC_READ"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07
  # Auditor reads audit trail on the assigned tenant within the engagement
  # window. Cross-tenant read outside the assignment collapses to the AC-09
  # 404 path. Audit-of-audit logging is required — the auditor's own read is
  # logged as a PERMITTED event.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @p0
  Scenario: Auditor read on assigned tenant within engagement window (AC-07)
    Given I am authenticated as "Auditor"
    And I am assigned to tenant "Bank-B" with an engagement window that includes the current time
    When I read audit trail of "Bank-B"
    Then the response status is 200
    And a CROSS_TENANT_ACCESS_PERMITTED event is written with operation_type "AUDIT_READ_FOR_ENGAGEMENT"
    And the audit-of-audit event references the Auditor's read

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-03
  # Cross-tenant WRITE is prohibited for ALL roles in V1, regardless of
  # permission claims. Enforcement is at the authorization layer AND the API
  # gateway (defense-in-depth). Every blocked attempt returns HTTP 404 (not
  # 403) to prevent tenant-existence inference, and emits a
  # CROSS_TENANT_ACCESS_BLOCKED event tagged as a security event.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-03 @p0
  Scenario Outline: Cross-tenant write blocked for all roles in V1 (AC-02, AC-03)
    Given I am authenticated as <role> bound to tenant "Bank-A"
    When I attempt a cross-tenant write operation on tenant "Bank-B" (<write_operation>)
    Then the response status is 404
    And the response body does not distinguish "not found" from "forbidden"
    And a CROSS_TENANT_ACCESS_BLOCKED event is written with:
      | operation_type   | <write_operation> |
      | requesting_role  | <role>            |
      | source_tenant    | Bank-A            |
      | target_tenant    | Bank-B            |
      | access_type      | WRITE             |
      | block_reason     | CROSS_TENANT_WRITE_PROHIBITED |
    And the event is classified as a security event

    Examples:
      | role          | write_operation             |
      | System Admin  | POST /api/tenants/Bank-B/... |
      | Front Office  | POST /api/tenants/Bank-B/... |
      | Back Office   | POST /api/tenants/Bank-B/... |
      | LC User       | POST /api/tenants/Bank-B/... |
      | Support User  | POST /api/tenants/Bank-B/... |
      | Auditor       | POST /api/tenants/Bank-B/... |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-09
  # Tenant-existence inference must not leak. Every invalid tenant-context
  # variant — missing, invalid identifier, unverifiable, archived, or
  # non-existent — must return the identical HTTP 404 with no discriminating
  # body. Per Philipp Maute comment 36037 and Vesna alignment 36042, the
  # 404-everywhere rule is uniform across US 29.17 and US 29.18.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-09 @p0
  Scenario Outline: 404 for all invalid tenant-context variants — no existence inference (AC-02, AC-09)
    Given I am authenticated as "Front Office" bound to tenant "Bank-A"
    When I issue a request to a tenant-scoped endpoint with tenant context "<context_variant>"
    Then the response status is 404
    And the response body is identical for all variants (no distinguishing state)
    And a CROSS_TENANT_ACCESS_BLOCKED event is written with block_reason "<expected_block_reason>"
    And the event is classified as a security event

    Examples:
      | context_variant                                    | expected_block_reason         |
      | (missing tenant claim)                             | TENANT_CONTEXT_MISSING        |
      | Bank-Z-nonexistent                                 | TENANT_NOT_FOUND              |
      | Bank-B-archived                                    | TENANT_NOT_FOUND              |
      | not-a-uuid                                         | TENANT_CONTEXT_INVALID        |
      | (unverifiable/expired-signature tenant claim)      | TENANT_CONTEXT_UNVERIFIABLE   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15
  # Tenant context must be non-malleable. A client-forged or tampered JWT
  # claim substituting Bank-B for the caller's real Bank-A binding must be
  # rejected server-side — no scope broadening, no fallback to broader scope,
  # 404 identical to AC-09. Requires D17 (JWT test-forge) to generate a
  # signature-verifying JWT with a modified tenant_id claim, or an equivalent
  # signed-mismatch fixture.
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @p0
  Scenario: Tampered JWT tenant claim rejected — no scope broadening (AC-15)
    Given I authenticate as a "Front Office" user bound to tenant "Bank-A"
    And I obtain a forged JWT where the tenant_id claim is rewritten to "Bank-B" (via D17 test-forge)
    When I issue a request to a Bank-B-scoped endpoint with the forged JWT
    Then the response status is 404
    And the response body does not disclose "Bank-B" exists
    And the data access layer applies no fallback to a broader or empty scope
    And a CROSS_TENANT_ACCESS_BLOCKED event is written with block_reason "TENANT_CONTEXT_UNVERIFIABLE"
    And the event is classified as a security event
```
