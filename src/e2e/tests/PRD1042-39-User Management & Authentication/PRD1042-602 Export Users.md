# PRD1042-602 — US 28.30 | USER MANAGEMENT | Export Users

Generated: 2026-06-12
Story: PRD1042-602 — US 28.30 | USER MANAGEMENT | Export Users
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (multi-section ACs across Functional, Validation, System Behavior, Security, NFR, Edge Cases; description present; Jira status Ready for Staging)
ACs with Gherkin scenarios: 8 of 22 distinct ACs | Blocked: 4 (PRD1042-37 Audit Trail, D21 AUDITOR_VALIDITY_MINUTES, D-NEW Audit-service kill switch) | Excluded: 10 (edge-case, separate-feature, or covered by merged scenarios — scope filter table only)
Figma design: No Figma URL provided or linked in Jira (Stage 2 SKIPPED — no FE subtask description, no attachments, no comments referencing Figma)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                        | Blocking dependency                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| VR-02 | Auditor export denied when engagement window expired requires forcing the auditor session past validity; clock/TTL override is not exposed    | D21 — `AUDITOR_VALIDITY_MINUTES` env override       |
| SB-02 | Audit event USER_LIST_EXPORTED with full payload (actor, role-at-time, tenant, filter, rows, columns, format, UTC) cannot be read back at E2E | PRD1042-37 Audit Trail — no test-side read endpoint |
| SB-03 | Auditor-specific audit fields (engagement window reference) cannot be observed at E2E without audit read endpoint                             | PRD1042-37 Audit Trail + D21                        |
| EC-10 | Audit-service-unavailable fail-closed path requires toggling AuditTrailService availability mid-test                                          | D-NEW — Audit-service kill-switch test endpoint     |

---

## AC Scope Filter

| AC        | Description                                                                                       | Classification     | Rationale                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| FR-01     | User can export list as CSV/XLSX of currently visible result set                                  | `happy-path`       | Core success flow — Power User exports unfiltered list in both formats                                |
| FR-02     | Export honors active filter/search state (exported subset matches visible rows exactly)           | `happy-path`       | Direct extension of core flow — apply filter, export, verify subset                                   |
| FR-03     | Export honors requesting user's tenant/scope context                                              | `main-error`       | Tenant isolation is a CRITICAL RefiNext domain rule — verified together with VR-03/SR-02 cross-tenant |
| FR-04     | Export reflects role-authorized column set; restricted attributes absent                          | `main-error`       | Role-based column projection verified in exported file content                                        |
| FR-05     | Export generated server-side from fresh authorized query                                          | `edge-case`        | Internal implementation; cannot be observed at E2E beyond response format                             |
| FR-06     | Excluded: passwords, hashes, MFA secrets, session tokens, JWT, KYC/AML                            | `main-error`       | File content verification — exported file must not contain any excluded attribute                     |
| VR-01     | Export rejected for unauthorized roles (Support, FO, BO/Risk, LC denied)                          | `main-error`       | RBAC denial — Scenario Outline across all denied roles                                                |
| VR-02     | Auditor export rejected if engagement expired or target tenant out of scope                       | `Blocked`          | Requires D21 (`AUDITOR_VALIDITY_MINUTES`) to force expired engagement window                          |
| VR-03     | Crafted filter for out-of-scope data returns in-scope intersection only (no existence disclosure) | `main-error`       | Tenant-isolation negative path — covered together with FR-03/SR-02                                    |
| VR-04     | Empty filtered result produces valid file with headers + zero rows (not error)                    | `main-error`       | File integrity check on empty result set                                                              |
| SB-01     | Sync export within threshold; async above threshold                                               | `separate-feature` | OQ-01 unresolved (threshold value unknown); async export is its own user story                        |
| SB-02     | USER_LIST_EXPORTED audit event with full payload                                                  | `Blocked`          | Audit Trail upstream (PRD1042-37) — no test-side read endpoint to verify audit record content         |
| SB-03     | Auditor audit additionally records engagement window reference                                    | `Blocked`          | Depends on SB-02 + D21                                                                                |
| SB-04     | No business state mutated by export                                                               | `edge-case`        | Read-only operation; nothing observable beyond response status equality                               |
| SR-01     | Authorization server-authoritative; UI control hiding is UX only                                  | `main-error`       | Direct API call without UI control covered by VR-01 / VR-03 / SR-04 merged scenarios                  |
| SR-02     | Tenant isolation enforced; no cross-tenant rows in any single export                              | `main-error`       | Same scenario as FR-03/VR-03 (cross-tenant negative)                                                  |
| SR-03     | Restricted attributes omitted server-side, not just UI-hidden                                     | `main-error`       | Same as FR-06 (file content omission)                                                                 |
| SR-04     | Unauthorized direct API call denied with platform's standard non-disclosing response              | `main-error`       | Same as VR-01 at API layer (Scenario Outline includes API-direct invocation)                          |
| SR-05     | Deactivated/suspended/expired users cannot invoke export                                          | `main-error`       | Lifecycle-state negative — suspended-user export attempt                                              |
| NFR-01    | Sync export completes within seconds                                                              | `edge-case`        | Performance NFR; covered implicitly by automation timeout                                             |
| NFR-02    | Files not persisted in publicly reachable location                                                | `edge-case`        | Storage/auth architecture; not testable at E2E without infra access                                   |
| NFR-03    | Export must not degrade list-view responsiveness                                                  | `edge-case`        | Performance/concurrency; not E2E scope                                                                |
| EC-01..03 | Filter applied / no filter / empty filtered result                                                | covered            | Merged into FR-01, FR-02, VR-04                                                                       |
| EC-04     | Unauthorized role direct API call                                                                 | covered            | Merged into VR-01/SR-04                                                                               |
| EC-05     | Auditor expired engagement                                                                        | `Blocked`          | Same as VR-02                                                                                         |
| EC-06     | Crafted cross-tenant filter                                                                       | covered            | Merged into FR-03/VR-03/SR-02                                                                         |
| EC-07     | Requesting user suspended mid-session                                                             | covered            | Merged into SR-05                                                                                     |
| EC-08     | Result exceeds sync threshold (async generation)                                                  | `separate-feature` | Same as SB-01                                                                                         |
| EC-09     | Concurrent identical export requests                                                              | `edge-case`        | Concurrency/race; independent file generation not core E2E                                            |
| EC-10     | Audit Trail unavailable — fail-closed                                                             | `Blocked`          | Requires audit-service kill-switch endpoint                                                           |

**Gherkin generated for:** FR-01, FR-02, FR-03/SR-02, FR-04, FR-06/SR-03, VR-01/SR-04, VR-04, SR-05
**Blocked (no Gherkin):** VR-02, SB-02, SB-03, EC-10
**No Gherkin (edge-case or separate-feature):** FR-05, SB-01, SB-04, SR-01 (merged), NFR-01, NFR-02, NFR-03, EC-08, EC-09

---

## Scenarios summary

| Tag           | Scenario                                                                                         | AC                  | Priority | E2E          |
| ------------- | ------------------------------------------------------------------------------------------------ | ------------------- | -------- | ------------ |
| `@happy-path` | Power User exports full user list in both formats (Scenario Outline — 2 variants)                | FR-01               | P0       | ✅           |
| `@happy-path` | Filter applied then export — exported subset matches visible rows exactly                        | FR-02               | P0       | ✅           |
| `@main-error` | Export denied for unauthorized roles (Scenario Outline — 4 variants: Support, FO, BO, LC)        | VR-01, SR-04        | P0       | ✅           |
| `@main-error` | Export denied for suspended requester                                                            | SR-05               | P0       | ⚙️ needs D19 |
| `@main-error` | Cross-tenant filter returns in-scope intersection only — no cross-tenant rows in file            | FR-03, VR-03, SR-02 | P0       | ⚙️ needs D20 |
| `@main-error` | Export excludes sensitive columns regardless of role (Scenario Outline — 6 forbidden attributes) | FR-06, SR-03        | P0       | ✅           |
| `@main-error` | Role-authorized column set — restricted columns absent for non-privileged exporters              | FR-04               | P0       | ✅           |
| `@main-error` | Empty filtered result produces valid file with headers and zero data rows                        | VR-04               | P0       | ✅           |

Active scenario blocks: 8 (3 Outlines + 5 Scenarios)
E2E automation candidates: 6 of 8 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.30 @p0
Feature: Export Users (US 28.30 — PRD1042-602)
  As a Power User / System Admin
  I want to export the user list — full or as currently filtered —
  So that I can produce user-access records for governance, audit support, and access review

  Background:
    Given the user-list view is accessible at "/users"
    And the export endpoint is "GET /api/users/export"
    And the export endpoint accepts the same filter/search/scope query parameters as the user-list endpoint
    And the export endpoint accepts a "format" parameter with values "csv" or "xlsx"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — FR-01
  # Core success flow: a Power User with no filter applied exports the full
  # in-scope user list in both supported formats. Verifies that the response
  # is a downloadable file with the role-authorized header row.
  # ---------------------------------------------------------------------------

  @happy-path @ac-fr-01 @p0 @e2e-ready
  Scenario Outline: Power User exports full user list in <format> (FR-01)
    Given I am logged in as a Power User in tenant "Bank Tenant A"
    And the user list contains seeded users in my tenant
    And no filter or search is applied to the list view
    When I trigger the Export action and choose format "<format>"
    Then the response status should be 200
    And a file with content-type matching "<content_type>" should be downloaded
    And the file name should end with ".<format>"
    And the file should contain a header row with at least the columns "User ID", "Display Name", "Email", "Role", "Tenant", "Lifecycle State"
    And the file should contain one data row for every in-scope user visible in the list view

    Examples:
      | format | content_type                                                       |
      | csv    | text/csv                                                           |
      | xlsx   | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet  |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — FR-02
  # Filter-aware export: when filters are applied, the exported subset matches
  # the on-screen result set exactly — no fewer, no extra rows.
  # ---------------------------------------------------------------------------

  @happy-path @ac-fr-02 @p0 @e2e-ready
  Scenario: Filter applied — exported subset matches visible rows exactly (FR-02)
    Given I am logged in as a Power User in tenant "Bank Tenant A"
    And the user list contains seeded users in my tenant including roles "front_office" and "back_office"
    And I apply a role filter "front_office" in the list view
    And the list view displays N rows matching the filter
    When I trigger the Export action and choose format "csv"
    Then the response status should be 200
    And the downloaded file should contain exactly N data rows
    And every data row should have the "Role" column equal to "front_office"
    And no row in the file should have a "Role" value other than "front_office"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — VR-01, SR-04
  # Roles without export permission must be denied at the API layer regardless
  # of whether a UI control is visible. The response uses the platform's
  # standard non-disclosing pattern so the caller cannot infer hidden users.
  # ---------------------------------------------------------------------------

  @main-error @ac-vr-01 @ac-sr-04 @p0 @e2e-ready
  Scenario Outline: Export denied for unauthorized role <role> (VR-01, SR-04)
    Given I am logged in as a <role> user in tenant "Bank Tenant A"
    When I invoke "GET /api/users/export?format=csv" directly
    Then the response status should be 403
    And the response body should NOT contain a count of users
    And the response body should NOT contain any user identifiers or emails
    And no file should be downloaded

    Examples:
      | role                  |
      | support_user          |
      | front_office          |
      | back_office           |
      | leasing_company_user  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — SR-05
  # A user whose lifecycle state transitions to suspended must lose the export
  # capability on the next authorization check, even if their session is still
  # otherwise valid.
  # ---------------------------------------------------------------------------

  @main-error @ac-sr-05 @p0
  Scenario: Suspended Power User cannot invoke export (SR-05)
    Given a throwaway Power User account "tmp-pu-export@bank.com" exists and is active
    And I am logged in as "tmp-pu-export@bank.com"
    And an administrator suspends my account
    When I invoke "GET /api/users/export?format=csv" directly
    Then the response status should be 401 or 403
    And no export file should be returned

  # ---------------------------------------------------------------------------
  # MAIN ERROR — FR-03, VR-03, SR-02 (Tenant Isolation — RefiNext CRITICAL rule)
  # A Power User in Tenant A who crafts a filter referencing Tenant B must
  # receive only the in-scope intersection. The exported file must contain
  # zero rows from Tenant B, and the response must not disclose that Tenant
  # B exists or has users.
  # ---------------------------------------------------------------------------

  @main-error @ac-fr-03 @ac-vr-03 @ac-sr-02 @p0
  Scenario: Crafted cross-tenant filter returns only in-scope intersection (FR-03, VR-03, SR-02)
    Given a second tenant "Bank Tenant B" is seeded with at least one user "tenantB-user@bank.com"
    And I am logged in as a Power User in tenant "Bank Tenant A"
    When I invoke "GET /api/users/export?tenant_id=<tenant_b_id>&format=csv" directly
    Then the response status should be 200
    And the downloaded file should contain zero rows referencing tenant "Bank Tenant B"
    And the file should contain zero rows with email "tenantB-user@bank.com"
    And the response should not differ in structure or status from a same-tenant filter that yields zero rows

  # ---------------------------------------------------------------------------
  # MAIN ERROR — FR-06, SR-03
  # Hard exclusion list: passwords, password hashes, MFA secrets/seeds,
  # session tokens, JWT material, and any KYC/AML detail must never appear in
  # any export under any role. Verifies omission server-side, not just hiding
  # in the UI.
  # ---------------------------------------------------------------------------

  @main-error @ac-fr-06 @ac-sr-03 @p0 @e2e-ready
  Scenario Outline: Sensitive column "<forbidden_column>" never appears in any export (FR-06, SR-03)
    Given I am logged in as a Power User in tenant "Bank Tenant A"
    When I trigger the Export action and choose format "csv"
    Then the response status should be 200
    And the downloaded file header row should NOT contain a column named "<forbidden_column>"
    And no data row in the file should contain a value plausibly matching "<forbidden_column>"

    Examples:
      | forbidden_column |
      | password         |
      | password_hash    |
      | mfa_secret       |
      | session_token    |
      | jwt              |
      | kyc              |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — FR-04
  # Column projection follows the role-authorized user-list column set.
  # An export performed by an Auditor (who has restricted attribute visibility
  # in the list view) must not include attributes that the role cannot see in
  # the list view itself.
  # ---------------------------------------------------------------------------

  @main-error @ac-fr-04 @p0
  Scenario: Auditor export reflects role-authorized column subset (FR-04)
    Given I am logged in as an Auditor with an active engagement on tenant "Bank Tenant A"
    And the user-list view for my role hides the column "MFA Status"
    When I trigger the Export action and choose format "csv"
    Then the response status should be 200
    And the downloaded file header row should NOT contain a column named "MFA Status"
    And the downloaded file should contain only users from tenant "Bank Tenant A"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — VR-04
  # An empty filtered result set must not produce an error. The export is a
  # valid file with the standard header row and zero data rows.
  # ---------------------------------------------------------------------------

  @main-error @ac-vr-04 @p0 @e2e-ready
  Scenario: Empty filtered result produces a valid file with headers and zero rows (VR-04)
    Given I am logged in as a Power User in tenant "Bank Tenant A"
    And I apply a search query "no_such_user_zzz_does_not_exist" in the list view
    And the list view displays zero rows
    When I trigger the Export action and choose format "csv"
    Then the response status should be 200
    And a file with content-type "text/csv" should be downloaded
    And the file should contain the standard header row
    And the file should contain zero data rows
    And no error message should be displayed
```
