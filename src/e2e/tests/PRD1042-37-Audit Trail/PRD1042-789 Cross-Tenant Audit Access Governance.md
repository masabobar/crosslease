# PRD1042-789 — US 26.12 | AUDIT TRAIL | Cross-Tenant Audit Access Governance

Generated: 2026-07-10
Story: PRD1042-789 — US 26.12 | AUDIT TRAIL | Cross-Tenant Audit Access Governance
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (19 synthesized ACs, description present, Client Approved 2026-06-16 by Philipp Maute per Vesna email of 15 June, Jira status Ready for DEV Review; child FE/BE stories in QA ready)
ACs with Gherkin scenarios: 6 of 19 | Blocked: 8 (TM-17 + D-Audit-Query-Endpoint + D20 + D-Time-Bound-Expiry + D-Session-Revalidation-Signal) | Excluded: 5 (edge-case or separate-feature — scope filter table only)
Figma design: File 7EkiVhANXOkn65k0jG4uEJ node 1:11090 — Stage 2 FAILED (Figma MCP quota exhausted on Professional View seat; Bash tool disabled in session so REST helper unavailable; WebFetch cannot pass X-Figma-Token). Precedent-aligned decision: proceed design-blind — this is a backend governance/enforcement story; only UI surface is a tenant-scope selector on the US 26.10 Investigation view (US 26.10 owns that primary UI).

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                         | Blocking dependency                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| AC-02 | Allow-list CUD lives in Tenant Management (TM-17); write side not testable from Audit Trail spec — belongs to TM-17 spec       | TM-17 — Tenant Management allow-list ownership                                 |
| AC-07 | Per-query re-validation requires forcing a mid-session state change; no test seam documented for session revalidation signal   | D-Session-Revalidation-Signal (parallel to D-Session-Signal PRD1042-597 AC-17) |
| AC-08 | Dual-tenant audit event emission requires inspection of tenant-B audit log; blocked on D20 + audit-log read API                | D20 (second tenant) + D-Audit-Read-API                                         |
| AC-10 | Time-bound allow-list expiry requires override to shorten grant TTL for test purposes                                          | D-Time-Bound-Expiry (env override to fast-forward expiry)                      |
| AC-11 | Non-functional latency assertion — outside E2E scope (perf test suite)                                                         | Separate perf harness                                                          |
| AC-13 | Mid-session allow-list expiry: requires D-Time-Bound-Expiry to force expiry + D-Session-Revalidation-Signal to trigger recheck | D-Time-Bound-Expiry + D-Session-Revalidation-Signal                            |
| AC-18 | Event emission verification requires event-bus inspection; no E2E hook to `audit.crosstenant.*` events                         | D-EventBus-Inspection                                                          |
| AC-19 | `CROSS_TENANT_AUDIT_ACCESS` / `CROSS_TENANT_ACCESS_BLOCKED` audit record contents require audit-log read API                   | D-Audit-Read-API + PRD1042-37 audit-log API                                    |

---

## AC Scope Filter

| AC    | Description                                                                                                  | Classification | Rationale                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Cross-tenant audit access requires platform-Auditor role AND explicit allow-list entry                       | `happy-path`   | Core success + core deny path — happy path with allow-list present; two roles (Auditor with/without allow-list)                                                     |
| AC-02 | Allow-list is owned by Tenant Management (TM-17); Audit Trail enforces at query time                         | `Blocked`      | CUD lives in TM-17 spec; enforcement side covered by AC-01/04/05/12                                                                                                 |
| AC-03 | Cross-tenant access recorded as audit event at BOTH requesting and target tenant                             | `main-error`   | Dual-log emission verification; requires seeded second tenant + audit-log peek — synthesized as happy-path assert alongside AC-01                                   |
| AC-04 | Absent allow-list entry → cross-tenant queries blocked at API layer                                          | `main-error`   | Direct block — covered by AC-01 negative Outline row (Auditor no-allow-list) merged with security-audit-event assertion                                             |
| AC-05 | Platform-Auditor without allow-list → blocked + security audit event                                         | `main-error`   | Same as AC-04 with audit-event side effect; single scenario with dual assertion                                                                                     |
| AC-06 | No non-platform role may query audit records of a different tenant under any condition                       | `main-error`   | 404 uniform mask across 5 non-platform roles (System Admin, Support, Front Office, Back Office, LC User); Bank Admin excluded (no audit read per Permission Matrix) |
| AC-07 | Allow-list validation at session registration AND re-validated per query                                     | `Blocked`      | Session re-validation seam not testable without D-Session-Revalidation-Signal                                                                                       |
| AC-08 | Cross-tenant access events are Regulatory Critical, dual-logged                                              | `Blocked`      | Dual-log verification requires audit-log peek on tenant-B                                                                                                           |
| AC-09 | Tenant isolation default; cross-tenant visibility forbidden unless explicitly governed                       | `happy-path`   | Foundational contract — asserted implicitly by AC-01/04 Outline (default tenant scope only)                                                                         |
| AC-10 | Allow-list grants are time-bound where TM policy specifies expiry                                            | `Blocked`      | Time-boundedness not testable without D-Time-Bound-Expiry                                                                                                           |
| AC-11 | Allow-list checks add negligible latency to query authorization                                              | `edge-case`    | Non-functional — perf-suite territory, not E2E                                                                                                                      |
| AC-12 | Edge: Platform Auditor without allow-list → blocked at API, security audit event, no data returned           | `main-error`   | Duplicate of AC-05 with data-null assertion — merged into AC-05 scenario                                                                                            |
| AC-13 | Edge: Allow-list expires mid-session → next query fails; session-close audit record written                  | `Blocked`      | Mid-session expiry requires D-Time-Bound-Expiry + D-Session-Revalidation-Signal                                                                                     |
| AC-14 | Edge: Non-platform role attempts cross-tenant query → blocked, security audit event                          | `main-error`   | Merged with AC-06 (uniform 404 across all non-Auditor roles + security-audit-event side effect)                                                                     |
| AC-15 | Backend: `GET /audit/investigation?tenantScope=…` allow-list gated                                           | `happy-path`   | Endpoint contract — asserted by AC-01 Outline (allowed) and AC-05 (blocked)                                                                                         |
| AC-16 | Backend: Services `CrossTenantAccessService`, `AllowListValidator` (TM-owned list)                           | `edge-case`    | Internal service composition — not observable at E2E layer                                                                                                          |
| AC-17 | Frontend: Tenant-scope selector available only to platform-level Auditors with allow-list entries            | `main-error`   | UI role gating — selector visibility only for platform-Auditor with allow-list; scenario covers presence + absence                                                  |
| AC-18 | Events: emits `audit.crosstenant.access.granted` / `.blocked` (dual-tenant)                                  | `Blocked`      | Requires D-EventBus-Inspection                                                                                                                                      |
| AC-19 | Audit records `CROSS_TENANT_AUDIT_ACCESS` / `CROSS_TENANT_ACCESS_BLOCKED` — Regulatory Critical, dual-logged | `Blocked`      | Requires audit-log read API to assert record type                                                                                                                   |

**Gherkin generated for:** AC-01, AC-03, AC-04, AC-05, AC-06, AC-09, AC-12, AC-14, AC-15, AC-17
**Blocked (no Gherkin):** AC-02, AC-07, AC-08, AC-10, AC-13, AC-18, AC-19
**No Gherkin (edge-case or separate-feature):** AC-11, AC-16

---

## Scenarios summary

| Tag           | Scenario                                                                                                                                  | AC                         | Priority | E2E                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------- | ------------------------------------ |
| `@happy-path` | Platform Auditor with allow-list entry queries target tenant audit records — 200 with data (Scenario Outline — 1 role × allow-list state) | AC-01, AC-03, AC-09, AC-15 | P0       | ⚙️ needs D20 + D-Audit-Read-API      |
| `@happy-path` | Platform Auditor without cross-tenant scope defaults to own-tenant audit records only                                                     | AC-09, AC-15               | P0       | ✅                                   |
| `@happy-path` | Tenant-scope selector visible only to platform-Auditor with active allow-list entries                                                     | AC-17                      | P1       | ⚙️ needs D20 + TM-17 allow-list seed |
| `@main-error` | Platform Auditor without allow-list entry — cross-tenant query returns 404 + security audit event                                         | AC-04, AC-05, AC-12        | P0       | ⚙️ needs D20 + D-Audit-Read-API      |
| `@main-error` | Non-platform roles cannot query cross-tenant audit records — uniform 404 (Scenario Outline — 5 roles)                                     | AC-06, AC-14               | P0       | ⚙️ needs D20 + D-Audit-Read-API      |
| `@main-error` | Tenant-scope selector hidden for non-Auditor roles and for Auditor without allow-list                                                     | AC-17                      | P1       | ⚙️ needs D20 + TM-17 allow-list seed |

Active scenario blocks: 6 (2 Outlines + 4 Scenarios)
E2E automation candidates: 1 of 6 scenarios ✅

---

## Feature file

```gherkin
@audit-trail @us-26.12 @p0
Feature: Cross-Tenant Audit Access Governance (US 26.12 — PRD1042-789)
  As a Platform-Level Auditor
  I want cross-tenant audit access gated by an explicit allow-list enforced at query time
  So that no audit data crosses tenant boundaries without governed authorization, and every cross-tenant access is itself audited

  Background:
    Given the RefiNext platform has at least two seeded tenants: "Tenant-A" and "Tenant-B"
    And the cross-tenant allow-list is owned and managed by Tenant Management (TM-17)
    And the audit investigation endpoint "GET /audit/investigation?tenantScope=..." exists
    And tenant isolation is the platform default — cross-tenant visibility is forbidden unless explicitly governed

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03, AC-09, AC-15
  # Platform Auditor holding an active allow-list entry for the target tenant
  # can query audit records of that tenant. This is the sole authorized
  # cross-tenant read path in the platform. Access is dual-logged at both
  # tenants (AC-03) and enforced at query time by AllowListValidator (AC-15).
  # E2E requires seeded Tenant-B (D20) + audit-log read API to verify dual-log.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @ac-09 @ac-15 @p0
  Scenario: Platform Auditor with active allow-list entry reads target-tenant audit records
    Given I am authenticated as a platform-level Auditor bound to "Tenant-A"
    And Tenant Management has an active cross-tenant allow-list entry granting me access to "Tenant-B"
    And "Tenant-B" has at least one auditable event in its audit log
    When I GET "/audit/investigation?tenantScope=Tenant-B"
    Then the response status should be 200
    And the response body should contain audit records scoped to "Tenant-B"
    And a "CROSS_TENANT_AUDIT_ACCESS" audit event should be written at "Tenant-A" (requesting tenant)
    And a "CROSS_TENANT_AUDIT_ACCESS" audit event should be written at "Tenant-B" (target tenant)
    And both audit events should carry the same correlation ID

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-09, AC-15
  # Default behaviour: an Auditor without a cross-tenant scope parameter sees
  # only their own tenant's audit records — proves tenant isolation is the
  # default and that omitting tenantScope does not implicitly grant cross-tenant
  # visibility. This is the only fully e2e-ready scenario in the story.
  # ---------------------------------------------------------------------------

  @happy-path @ac-09 @ac-15 @p0 @e2e-ready
  Scenario: Platform Auditor without tenant scope sees only own-tenant audit records
    Given I am authenticated as a platform-level Auditor bound to "Tenant-A"
    When I GET "/audit/investigation" without a tenantScope parameter
    Then the response status should be 200
    And every audit record in the response should be scoped to "Tenant-A"
    And no audit record should reference any other tenant

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-17
  # UI role gating: the tenant-scope selector on the Investigation surface
  # (owned by US 26.10) is visible only to platform-level Auditors AND only
  # when they hold at least one active allow-list entry. Requires seeded
  # Tenant-B + TM-17 allow-list entry for the visibility precondition.
  # ---------------------------------------------------------------------------

  @happy-path @ac-17 @p1
  Scenario: Tenant-scope selector is visible to platform-Auditor with active allow-list
    Given I am authenticated as a platform-level Auditor bound to "Tenant-A"
    And Tenant Management has an active cross-tenant allow-list entry granting me access to "Tenant-B"
    When I open the audit investigation view
    Then the tenant-scope selector should be visible
    And "Tenant-A" and "Tenant-B" should be selectable in the scope list

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04, AC-05, AC-12
  # A platform Auditor without an allow-list entry for the target tenant is
  # blocked at the API layer with a uniform 404 response (per RefiNext tenant
  # isolation rule: 404 not 403 to prevent tenant enumeration). A security
  # audit event CROSS_TENANT_ACCESS_BLOCKED is written; no data returned.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @ac-05 @ac-12 @p0
  Scenario: Platform Auditor without allow-list receives 404 and a security audit event
    Given I am authenticated as a platform-level Auditor bound to "Tenant-A"
    And Tenant Management has NO active allow-list entry granting me access to "Tenant-B"
    When I GET "/audit/investigation?tenantScope=Tenant-B"
    Then the response status should be 404
    And the response body should NOT contain any audit records from "Tenant-B"
    And the response body should NOT reveal whether "Tenant-B" exists
    And a "CROSS_TENANT_ACCESS_BLOCKED" security audit event should be written
    And the security audit event should record my principal ID and the target tenant scope

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06, AC-14
  # Non-platform roles have no cross-tenant audit capability under any
  # condition. The API returns a uniform 404 across every non-platform role
  # (System Admin, Support User, Front Office, Back Office, LC User) and
  # writes a security audit event. Bank Admin is excluded because the
  # Permission Matrix does not grant Bank Admin any audit-trail read access.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @ac-14 @p0
  Scenario Outline: Non-platform roles cannot query cross-tenant audit records
    Given I am authenticated as a <role> in "Tenant-A"
    When I GET "/audit/investigation?tenantScope=Tenant-B"
    Then the response status should be 404
    And the response body should NOT contain any audit records from "Tenant-B"
    And a "CROSS_TENANT_ACCESS_BLOCKED" security audit event should be written for my principal ID

    Examples:
      | role          |
      | System Admin  |
      | Support User  |
      | Front Office  |
      | Back Office   |
      | LC User       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-17
  # UI counter-check: the tenant-scope selector must be hidden for every role
  # that is not a platform-Auditor with an active allow-list. Covers both
  # non-Auditor roles and Auditors without any allow-list entry.
  # ---------------------------------------------------------------------------

  @main-error @ac-17 @p1
  Scenario Outline: Tenant-scope selector is hidden when access is not authorized
    Given I am authenticated as a <role_or_state>
    When I open the audit investigation view (if accessible)
    Then the tenant-scope selector should NOT be visible

    Examples:
      | role_or_state                                             |
      | platform-Auditor with no active allow-list entries        |
      | System Admin                                              |
      | Support User                                              |
      | Front Office                                              |
      | Back Office                                               |
      | LC User                                                   |
```
