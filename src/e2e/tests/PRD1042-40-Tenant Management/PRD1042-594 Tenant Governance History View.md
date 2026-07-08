# PRD1042-594 — US 29.13 | Tenant Management | Tenant Governance History View

Generated: 2026-07-07
Story: PRD1042-594 — US 29.13 | Tenant Management | Tenant Governance History View
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (14 ACs, description present, stakeholder-reviewed by Iva Marković, Jira status "QA ready")
ACs with Gherkin scenarios: 8 of 14 | Blocked: 0 | Excluded: 6 (edge-case or separate-feature — scope filter table only)
Figma design: No Figma URL linked to the story. Stage 2 FAILED (design-blind); closest sibling analog is Tenant Detail canvas 52:1806 from PRD1042-585 (US 29.4) — Governance History tab lives inside that canvas but no cached section is available. Design evidence unverified; copy citations noted as "design unverified" where applicable.

---

## AC Scope Filter

| AC    | Description                                                                                                                                | Classification     | Rationale                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| AC-01 | Governance History tab displays immutable, append-only event log for the tenant                                                            | `happy-path`       | Core view — System Admin loads tab, sees event list; primary user-visible behavior                               |
| AC-02 | Events shown in reverse-chronological order by default                                                                                     | `happy-path`       | Default sort verified in same load scenario as AC-01                                                             |
| AC-03 | No edit, delete, or modify controls presented for any role                                                                                 | `main-error`       | Read-only enforcement — negative assertion that write controls are absent for every role that can view           |
| AC-04 | System Admin views full governance history for any tenant                                                                                  | `happy-path`       | Covered by AC-01 happy-path Outline (System Admin role variant)                                                  |
| AC-05 | Auditor: view Governance History tab for their assigned tenant only, within active engagement window                                       | `happy-path`       | Auditor with active engagement sees tab — covered in AC-01 role Outline                                          |
| AC-06 | Events for Archived tenants remain accessible and immutable                                                                                | `happy-path`       | Read-only history survives lifecycle transitions — scenario proves Archived tenant still returns events          |
| AC-07 | Event Log columns: Event Type, Actor, Countersignatory (C), Previous State (C), New State (C), Governance Justification (C), Timestamp (M) | `happy-path`       | Column presence + UTC timestamp format verified in AC-01 happy-path scenario                                     |
| AC-08 | Filter controls: Event Type multi-select, Date Range, Actor text search (all optional)                                                     | `happy-path`       | Filter behavior — apply filter, verify subset returned; combined with server pagination                          |
| AC-09 | Pagination: max 50 events per page, server cursor tokens                                                                                   | `edge-case`        | Boundary/implementation — page-size cap is a backend contract, not an E2E user journey concern                   |
| AC-10 | Auditor access writes AUDITOR_GOVERNANCE_ACCESS audit event                                                                                | `separate-feature` | Audit-log write is a backend side effect verified in Audit Trail Service story (PRD1042-37), not E2E             |
| AC-11 | Governance History endpoint returns HTTP 404 (not 403) to Support, FO, BO, LC Users                                                        | `main-error`       | RefiNext domain rule (404-not-403) — Scenario Outline across four denied roles                                   |
| AC-12 | Sensitive fields (Countersignatory identity, Governance Justification) excluded from Auditor view where not relevant to their engagement   | `main-error`       | Role-conditional column visibility — Auditor sees redacted columns for out-of-scope events                       |
| AC-13 | Auditor engagement expires mid-session → next API call returns 403; access to tab revoked                                                  | `main-error`       | Engagement-window enforcement — testable if Auditor validity override (D21) available; otherwise clock-dependent |
| AC-14 | Archived tenant history accessed — all historical events remain accessible, read-only                                                      | `happy-path`       | Same guarantee as AC-06 — covered by the Archived-tenant scenario                                                |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-11, AC-12, AC-13, AC-14
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-09 (pagination boundary), AC-10 (audit-write side effect owned by PRD1042-37)

---

## Scenarios summary

| Tag           | Scenario                                                                                             | AC                                | Priority | E2E                                     |
| ------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------- | -------- | --------------------------------------- |
| `@happy-path` | Authorized role opens Governance History tab and sees event log (Scenario Outline — 2 role variants) | AC-01, AC-02, AC-04, AC-05, AC-07 | P0       | ✅                                      |
| `@happy-path` | Filters narrow the event list (Scenario Outline — 3 filter variants)                                 | AC-08                             | P0       | ✅                                      |
| `@happy-path` | Archived tenant governance history remains accessible                                                | AC-06, AC-14                      | P0       | ✅                                      |
| `@main-error` | Governance History endpoint returns 404 for unauthorized roles (Scenario Outline — 4 role variants)  | AC-11                             | P0       | ✅                                      |
| `@main-error` | No edit, delete, or modify controls appear for any role                                              | AC-03                             | P0       | ✅                                      |
| `@main-error` | Auditor view redacts Countersignatory and Justification for events outside engagement scope          | AC-12                             | P0       | ⚙️ needs D21 (engagement-scope fixture) |
| `@main-error` | Auditor engagement expires mid-session — next API call returns 403 and tab access is revoked         | AC-13                             | P0       | ⚙️ needs D21                            |

Active scenario blocks: 7 (4 Outlines + 3 Scenarios)
E2E automation candidates: 5 of 7 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.13 @p0
Feature: Tenant Governance History View (US 29.13 — PRD1042-594)
  As a System Admin or Auditor
  I want to view the complete, immutable governance event history for a tenant
  So that I can audit and verify all governance actions taken

  Background:
    Given the RefiNext platform is available
    And tenant "Corporate Leasing DE" (id "CL-DE001") exists with governance events
    And the Governance History tab is reachable at "/tenants/CL-DE001/governance-history"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-04, AC-05, AC-07
  # System Admin and Auditor are the only roles authorized to see this tab.
  # Verifies the tab loads, presents required columns, and defaults to reverse-
  # chronological order. Design unverified (Stage 2 failed) — column labels are
  # anchored to the AC field spec, not Figma copy.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-04 @ac-05 @ac-07 @e2e-ready
  Scenario Outline: Authorized role opens Governance History tab and sees event log (AC-01, AC-02, AC-04, AC-05, AC-07)
    Given I am logged in as <role>
    And tenant "CL-DE001" has at least 3 governance events across at least 2 event types
    When I open the Governance History tab on the tenant detail view
    Then the event log is displayed
    And the list is sorted by "Timestamp" descending by default
    And the following columns are visible: "Event Type", "Actor", "Timestamp"
    And every visible "Timestamp" value is rendered in UTC
    And no "Edit", "Delete", or "Modify" control appears on any row

    Examples:
      | role                                                     |
      | System Admin                                             |
      | Auditor with active engagement scoped to tenant "CL-DE001" |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-08
  # Filter controls narrow the visible event set. The three filters
  # (Event Type multi-select, Date Range, Actor text search) are all optional
  # and combine additively. Verifies filter application only — pagination
  # boundaries (AC-09) are edge-case and excluded.
  # ---------------------------------------------------------------------------

  @happy-path @ac-08 @e2e-ready
  Scenario Outline: Filters narrow the event list (AC-08)
    Given I am logged in as System Admin
    And tenant "CL-DE001" has events of types "TENANT_ACTIVATED", "MODULE_DEACTIVATED", and "SUPPORT_TENANT_ACCESS"
    And the Governance History tab is loaded
    When I apply the filter <filter_type> with value <filter_value>
    Then only events matching <filter_value> are visible
    And the total count reflects the filtered subset

    Examples:
      | filter_type   | filter_value                       |
      | "Event Type"  | "TENANT_ACTIVATED"                 |
      | "Date Range"  | from "2026-06-01" to "2026-06-30"  |
      | "Actor"       | "ivan.mladenovic@holycode.com"     |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06, AC-14
  # Archived tenants retain full governance history. The record survives
  # lifecycle transitions and remains read-only. No write controls appear.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @ac-14 @e2e-ready
  Scenario: Archived tenant governance history remains accessible (AC-06, AC-14)
    Given tenant "Legacy Bank DE" (id "LB-DE099") is in status "Archived"
    And "LB-DE099" has 5 historical governance events
    And I am logged in as System Admin
    When I open the Governance History tab for "LB-DE099"
    Then all 5 historical events are displayed
    And every row is read-only
    And no "Edit", "Delete", or "Modify" control appears on any row

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (RefiNext 404-not-403 rule)
  # Governance History endpoint must return 404 (not 403) to unauthorized
  # roles to prevent tenant-existence enumeration. Applies to Support, FO, BO,
  # and LC Users per the permission matrix.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @e2e-ready
  Scenario Outline: Governance History endpoint returns 404 for unauthorized roles (AC-11)
    Given I am logged in as <role>
    When I request "GET /api/tenants/CL-DE001/governance-history"
    Then the response status is 404
    And the response body does not reveal whether tenant "CL-DE001" exists

    Examples:
      | role          |
      | Support User  |
      | Front Office  |
      | Back Office   |
      | LC User       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Explicit assertion that the view is fully read-only. This guards against
  # regression where an inline edit control is accidentally rendered when a
  # role gains new privileges elsewhere in the system.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @e2e-ready
  Scenario: No edit, delete, or modify controls appear on the Governance History tab (AC-03)
    Given I am logged in as System Admin
    And the Governance History tab is loaded for tenant "CL-DE001"
    Then no button labelled "Edit", "Delete", "Modify", or "Remove" is present in the event log
    And no context menu offering edit or delete actions is available on any row
    And no inline editable field is present on any row

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # Auditor view redacts sensitive governance fields (Countersignatory identity
  # and Governance Justification) for events that fall outside the Auditor's
  # engagement scope. Requires seeded Auditor with a scoped engagement window
  # covering only a subset of tenant events — hence D21 dependency.
  # ---------------------------------------------------------------------------

  @main-error @ac-12
  Scenario: Auditor sees Countersignatory and Justification only for in-scope events (AC-12)
    Given tenant "CL-DE001" has two governance events:
      | event_id | type              | timestamp            |
      | EV-100   | TENANT_ACTIVATED  | 2026-05-10T10:00:00Z |
      | EV-200   | MODULE_DEACTIVATED| 2026-07-01T14:00:00Z |
    And I am logged in as an Auditor whose engagement window is "2026-06-15" to "2026-07-15"
    When I open the Governance History tab for "CL-DE001"
    Then row "EV-200" shows the "Countersignatory" and "Governance Justification" columns populated
    And row "EV-100" shows the "Countersignatory" and "Governance Justification" columns as redacted or blank

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Auditor engagement expiry mid-session must revoke access on the next API
  # call — the tab is no longer served and follow-up requests receive 403.
  # Requires AUDITOR_VALIDITY_MINUTES override (D21) to expire the engagement
  # deterministically inside a test run.
  # ---------------------------------------------------------------------------

  @main-error @ac-13
  Scenario: Auditor engagement expiry mid-session revokes tab access (AC-13)
    Given I am logged in as an Auditor with active engagement on tenant "CL-DE001"
    And the Governance History tab is loaded successfully
    When the Auditor engagement window expires
    And I trigger a refresh or apply a filter that issues a new API call
    Then the API response status is 403
    And the Governance History tab is no longer accessible from the tenant detail view
```
