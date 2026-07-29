# PRD1042-803 — US 11.4 | Framework Agreement | Framework Agreement Detail View

Generated: 2026-07-24
Story: PRD1042-803 — US 11.4 | Framework Agreement | Framework Agreement Detail View
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (16 derived ACs + 1 CR-derived AC, description present with permission matrix + field specs, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 9 of 17 | Blocked: 2 (D-LimitMgmt-Degraded, D-DocMgmt-FileMissing) | Excluded: 6 (edge-case, separate-feature, or NFR — scope filter table only; AC-CR-A4 bundled into AC-01)
Figma design: Node 24:948 (DETAIL PAGE) on canvas 10:15285, file aQGn5OLEjEGJO7xGzFikP5 — frame render available in fixtures (see "Design references" below). REST + MCP were quota-exhausted on 2026-07-24; frame was manually PNG-exported from Figma. Chip row and IDENTITY section content in the exported PNG shows Bank entity — the exported frame is pre-CR; treat the Bank entity affordance as `pre-CR design — refresh needed` per CR PRD1042-1495 A4.
Updated per CR PRD1042-1495 (2026-07-24): Bank Entity hidden from chip row and IDENTITY section (A4/1495) — assertion inverted from "present" to "not present in the DOM" for ALL roles (previously only LC user had this exclusion at AC-07).
Updated per CR PRD1042-22 Reconciliation v10 (2026-07-27): PRICING section narrowed to single `effective_rate` + `edit_version_counter` per A1/A3 (v10) — `base_rate`, `spread`, `rate_type`, `rate_lock_period_months` REMOVED from the detail response and NOT displayed; `lg_coverage_rate_override` field REMOVED (A4/v10). Background updated to reflect the new field set. AC-03 role Outline `lg_override_visible` column REMOVED. State model 4-values reinforced (Draft/Active/Suspended/Terminated); derived-Expired read applies to LIFECYCLE section (per v10 §4 B2). AC-08/AC-09/AC-10 role Outlines marked [CR-PENDING B5] pending Philipp Maute's decision on 4 contested permission-matrix cells.

---

## Design references

| File                                                                         | Content                                                                                                                 | Applies to                                             |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `src/e2e/fixtures/figma-e11/rendered-nodes/frame-24-948__DETAIL-PAGE.png`    | 4 tab variants of the FA Detail page (Overview, Envelope & Pricing, Templates/Documents, Utilization/Linked Financings) | AC-01, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-11 |
| `src/e2e/fixtures/figma-e11/rendered-nodes/page-1-2__FA-list-and-create.png` | Adjacent Create flow — useful for verifying navigation entry points into the Detail page                                | AC-01 (entry)                                          |

Use these to verify verbatim tab labels, field labels, action-button copy, role-visibility affordances (hidden-not-disabled per AC-08), and 404-not-403 tenant-isolation affordance (AC-09) against the Gherkin scenarios below.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                         | Blocking dependency                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| AC-13 | Requires Limit Management degraded-mode test harness to simulate — no way to force "—" utilization state via UI or API stub in E2E environment | D-LimitMgmt-Degraded — Limit Mgmt degraded-mode simulator   |
| AC-14 | Requires Document Management to be forced into missing-file integrity fault — no admin API to corrupt document reference                       | D-DocMgmt-FileMissing — Document Mgmt integrity fault forge |

---

## AC Scope Filter

| AC       | Description                                                                                                                  | Classification     | Rationale                                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-01    | Tabbed layout: Overview, Envelope & Pricing, Templates, Documents, Utilization, Linked Financings, Audit / Lifecycle History | `happy-path`       | Core render — Power User (Bank Admin) opens FA and sees all 7 tabs                                                                                           |
| AC-02    | Overview tab shows identity, LC, bank entity, lifecycle status, timestamps                                                   | `happy-path`       | Consolidated into AC-01 render (implicit — testing tab presence covers Overview content)                                                                     |
| AC-03    | Envelope & Pricing tab fields per role visibility rules                                                                      | `happy-path`       | Role-visibility Outline covering pricing hidden/visible across roles                                                                                         |
| AC-04    | Utilization tab surfaces 8 fields with explicit "sourced from Limit Management" label                                        | `happy-path`       | Utilization data live-read from Limit Management — happy path with source label validation                                                                   |
| AC-05    | Linked Financings tab (lazy-loaded on activation) lists Financings                                                           | `happy-path`       | Lazy-load click + assert list — happy path                                                                                                                   |
| AC-06    | Audit / Lifecycle History tab lazy-loaded, timestamp desc default, 50/page                                                   | `happy-path`       | Lazy-load click + sort order + first-page cap — happy path                                                                                                   |
| AC-07    | Field-level visibility per role (pricing, LG Override, Special Conditions, timestamps)                                       | `main-error`       | Role-based access domain rule — negative check that LC sees no pricing/timestamps                                                                            |
| AC-08    | Action buttons hidden (not disabled) for unpermitted roles / states                                                          | `main-error`       | UX invariant — hidden-not-disabled affordance                                                                                                                |
| AC-09    | LC cross-LC access returns HTTP 404 (tenant isolation, not 403)                                                              | `main-error`       | Tenant isolation domain rule — 404-not-403 pattern                                                                                                           |
| AC-10    | Front Office accessing Draft-state FA returns HTTP 404                                                                       | `main-error`       | Lifecycle-state gate — FO cannot see Drafts                                                                                                                  |
| AC-11    | Document download signed 5-min TTL URL + FA_DOCUMENT_DOWNLOADED audit event                                                  | `happy-path`       | Download happy path + audit event assertion                                                                                                                  |
| AC-12    | Auditor detail access emits AUDITOR_FA_DETAIL_ACCESS audit event                                                             | `separate-feature` | Audit event assertion belongs to Epic 26 audit event schema tests (US 26.x); FE detail render still testable but audit-event verification is Epic 26's scope |
| AC-13    | Limit Management degraded — utilization "—" with retry, financings still render                                              | `Blocked`          | D-LimitMgmt-Degraded — no way to force Limit Mgmt into degraded state in E2E                                                                                 |
| AC-14    | Missing document file displays "file unavailable" + ops audit alert                                                          | `Blocked`          | D-DocMgmt-FileMissing — no admin API to corrupt document reference                                                                                           |
| AC-15    | Detail API p95 ≤ 2s; total render p95 ≤ 3s                                                                                   | `separate-feature` | Performance NFR — belongs to performance / load-test suite, not manual/E2E functional tests                                                                  |
| AC-16    | Audit history > 10,000 events — cursor pagination + CSV export (Auditor only)                                                | `edge-case`        | Scale-boundary condition + Auditor-only export UX — CSV export gate belongs to Epic 26 audit-export tests                                                    |
| AC-CR-A4 | [CR A4] Bank Entity hidden from FA Detail chip row + IDENTITY section for ALL roles (was only LC-hidden via AC-07)           | `happy-path`       | Bundled into AC-01 render (assertion inverted from "present" to "not present in the DOM") + AC-07 already had it hidden for LC                               |

**Gherkin generated for:** AC-01, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11
**Blocked (no Gherkin):** AC-13, AC-14
**No Gherkin (edge-case or separate-feature):** AC-02 (rolled into AC-01), AC-12, AC-15, AC-16, AC-CR-A4 (bundled into AC-01)

---

## Scenarios summary

| Tag           | Scenario                                                                                 | AC           | Priority | E2E                   |
| ------------- | ---------------------------------------------------------------------------------------- | ------------ | -------- | --------------------- |
| `@happy-path` | Power User (Bank Admin) opens FA detail and sees all 5 tabs (AC-01, AC-02)               | AC-01, AC-02 | P0       | ✅                    |
| `@happy-path` | Agreement details tab reveals PRICING section per role (Outline — 3 roles)               | AC-03        | P0       | ✅                    |
| `@happy-path` | Utilization tab surfaces Limit-Management-sourced metrics with attribution               | AC-04        | P0       | ✅                    |
| `@happy-path` | Financings tab lazy-loads on activation                                                  | AC-05        | P0       | ✅                    |
| `@happy-path` | Audit history tab lazy-loads with newest-first sort, 50-per-page cap                     | AC-06        | P0       | ✅                    |
| `@happy-path` | Authorized document download from Templates and documents tab produces signed URL        | AC-11        | P0       | ⚙️ needs D-AuditQuery |
| `@main-error` | LC user sees no PRICING section on Agreement details tab                                 | AC-07        | P0       | ✅                    |
| `@main-error` | Non-permitted role does not see Edit / Suspend / Terminate buttons (Outline — 4 roles)   | AC-08        | P0       | ✅                    |
| `@main-error` | LC user accessing FA bound to different LC returns 404 (Outline — cross-LC + cross-role) | AC-09        | P0       | ⚙️ needs D20          |
| `@main-error` | Front Office accessing a Draft-state FA returns 404                                      | AC-10        | P0       | ✅                    |

Active scenario blocks: 10 (3 Outlines + 7 Scenarios)
E2E automation candidates: 8 of 10 scenarios ✅

---

## Design specification (source of truth)

Framework Agreement Detail as built in Figma frame `24:948`. Scenarios below anchor to this specification. Where the AC Scope Filter table (below) shows AC text from Jira that does not match this design, the design takes precedence for test assertions.

**Layout — 5 tabs, in this order:**

| Tab                           | Content                                                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Agreement details` (default) | Sectioned view with headers `IDENTITY`, `LIFECYCLE`, `CREDIT ENVELOPE`, `PRICING`, `SPECIAL CONDITIONS`. PRICING and SPECIAL CONDITIONS are hidden for LC/Front Office roles                                                            |
| `Templates and documents`     | Section `Allowed product templates` (table: Template / Version / Status) + Section `Framework documents` (table: File name / Type / Label / File size / Uploaded at / Uploaded by) with `Attach documents` button in the section header |
| `Utilization`                 | Live Limit-Management-sourced metrics with `*Sourced from Limit Management` attribution + `Last refreshed <time> ago` indicator + `Refresh` button                                                                                      |
| `Financings`                  | Section `Linked financings` with subtitle `Financings referencing this framework agreement.` (table: Financing ID / State / Disbursement amount / Disbursed at)                                                                         |
| `Audit history`               | `Search` input + `Event type` filter + `Date range` filter + segmented toggle `Event log` / `Reconstruct` (default: `Event log`)                                                                                                        |

**Header:** page heading is the agreement name (e.g. `RV-SSKM-2026-001`) with an inline lifecycle status badge (`Active`), a chip row (`ID FA-2026-00041` with copy affordance / `Leasing company New Group Trade`), and three top-right action buttons (`Edit`, `Suspend`, `Terminate`) — hidden for non-permitted roles. **Per CR PRD1042-1495 A4:** the `Bank entity` chip is hidden from the chip row (previously showed `Bank entity Sparkasse`; the exported PNG in `rendered-nodes/` reflects the pre-CR state).

**Utilization field labels (verbatim):** `Disbursed volume`, `Redeemed volume`, `Available volume`, `Net exposure against credit envelope`, `Utilization`, `Limit available`, `Limit breach`.

**Utilization risk legend (verbatim):** `Under 70% normal / 70 to 80% elevated / 90% and above breach risk`.

**Financing state badges (verbatim):** `Active`, `Draft`, `Pending`. When `Disbursed at` is not applicable the cell reads `Not yet disbursed`.

---

## Feature file

```gherkin
@framework-agreement @us-11.4 @p0
Feature: Framework Agreement Detail View (US 11.4 — PRD1042-803)
  As a Power User (Bank Admin), Back Office / Risk user, or Front Office user
  I want to view the full detail of a Framework Agreement
  So that I can review envelope, pricing, validity, allowed templates, attached documents, utilization, linked Financings, and lifecycle history

  Background:
    Given the RefiNext platform is up and healthy
    And a Framework Agreement with agreement name "RV-SSKM-2026-001" and ID "FA-2026-00041" exists in Active state bound to Leasing Company "New Group Trade" (Bank entity "Sparkasse" — hidden per CR 1495 A4)
    # Per CR PRD1042-22 v10 A1/A2/A3/A4: pricing is a single Effective rate stored-as-entered.
    # `base_rate`, `spread`, `rate_type`, `rate_lock_period_months`, `lg_coverage_rate_override`
    # are NOT part of the API contract or the detail response.
    And "FA-2026-00041" has Max volume EUR 25,000,000.00 and Effective rate 4.75% (stored as entered, no derivation)
    And "FA-2026-00041" has 3 framework documents attached (1 Original agreement "Framework agreement_signed.pdf" 2.4 MB, 1 Addendum 480 KB, 1 Side letter 310 KB)
    And "FA-2026-00041" has 3 linked Financings (1 Active, 1 Draft, 1 Pending)
    And "FA-2026-00041" audit history contains at least 6 lifecycle events (Agreement created, Base rate updated, Document attached, Max volume updated, Product template removed, Agreement suspended)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # Power User (Bank Admin) opens the detail view and sees the 5 tabs shown in
  # the design (see Design findings above for reconciliation with AC-01's 7-tab spec).
  # Persistent header shows agreement name, lifecycle status badge, chip row with
  # ID + LC + Bank entity, and the three governance action buttons top-right.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0 @e2e-ready
  Scenario: Power User (Bank Admin) opens FA detail and sees all 5 tabs (AC-01, AC-02)
    Given I am logged in as Power User (Bank Admin)
    When I navigate to the Framework Agreement detail page for "FA-2026-00041"
    Then the breadcrumb should read "Home > Business configuration > Framework agreements > RV-SSKM-2026-001"
    And the page header should display heading "RV-SSKM-2026-001" with a lifecycle status badge "Active"
    And the chip row should show "ID FA-2026-00041" (with a copy affordance), "Leasing company New Group Trade"
    And the chip row should NOT contain a "Bank entity" chip (per CR PRD1042-1495 A4)
    And the top-right action buttons "Edit", "Suspend", and "Terminate" should be visible
    And I should see exactly the following tabs in this order: "Agreement details", "Templates and documents", "Utilization", "Financings", "Audit history"
    And the "Agreement details" tab should be active by default
    And the "Agreement details" tab should display sections: "IDENTITY", "LIFECYCLE", "CREDIT ENVELOPE", "PRICING", "SPECIAL CONDITIONS"
    And the "IDENTITY" section should show fields: Agreement ID, Agreement name, Leasing company, Currency
    And the "IDENTITY" section should NOT contain a "Bank entity" field (per CR PRD1042-1495 A4)
    And the "LIFECYCLE" section should show fields: Status, Created at, Created by, Activated at, Activated by, Valid from, Valid until

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # PRICING section on the Agreement details tab reveals per-role.
  # Power User (Bank Admin) and Back Office see all sections; Front Office sees
  # Envelope but not Pricing / LG-specific override / Special conditions.
  # (In the design, sections are on the same tab — visibility is section-level, not tab-level.)
  # ---------------------------------------------------------------------------

  # CR PRD1042-22 v10 A1/A3/A4 amendments:
  #  - PRICING section content narrowed to `effective_rate` + `edit_version_counter`.
  #  - `base_rate`, `spread`, `rate_type`, `rate_lock_period_months` REMOVED from
  #    the detail response and MUST NOT be present in the DOM.
  #  - `lg_coverage_rate_override` REMOVED (A4/v10) — the entire `lg_override_visible`
  #    Outline column removed.
  #  - [CR-PENDING B5] — v10 §5 flags Front Office pricing visibility as contested
  #    (v9 lets FO see pricing; code blanks it). Current "FO hidden" row retained
  #    pending Philipp Maute confirmation.

  @happy-path @ac-03 @p0 @e2e-ready @cr-pending-b5
  Scenario Outline: Agreement details tab reveals PRICING section per role (AC-03)
    Given I am logged in as <role>
    When I open "FA-2026-00041" detail on the "Agreement details" tab
    Then I should see the "CREDIT ENVELOPE" section with Max volume "€ 25.000.000,00" and Currency "EUR"
    And I should see the "LIFECYCLE" section with Valid from "13 Jun 2026" and Valid until "Open ended"
    And the "PRICING" section visibility should be <pricing_visible>
    And when the PRICING section is visible, it should show only the "Effective rate" field with value "4,75%" and the `edit_version_counter` reference
    And the PRICING section should NOT contain any of the following fields in the DOM (per v10 A1/A4): "Base rate", "Spread", "Rate type", "Rate lock period", "LG-specific coverage rate override"
    And the "SPECIAL CONDITIONS" section visibility should be <special_conditions_visible>

    Examples:
      | role                     | pricing_visible | special_conditions_visible |
      | Power User (Bank Admin)  | visible         | visible                    |
      | Back Office              | visible         | visible                    |
      | Front Office             | hidden          | hidden                     |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # Utilization tab surfaces live Limit Management data with a source-of-truth
  # attribution and a manual refresh affordance.
  # Verbatim design labels captured from frame 24:948.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0 @e2e-ready
  Scenario: Utilization tab surfaces Limit-Management-sourced metrics with attribution (AC-04)
    Given I am logged in as Power User (Bank Admin)
    When I open "FA-2026-00041" detail and click the "Utilization" tab
    Then a "*Sourced from Limit Management" attribution label should be visible at the top of the tab
    And I should see a "Last refreshed <time> ago" indicator and a "Refresh" button in the tab header
    And the tab should display the following metric fields with values (verbatim labels):
      | field                                  |
      | Disbursed volume                       |
      | Redeemed volume                        |
      | Available volume                       |
      | Net exposure against credit envelope   |
      | Utilization                            |
      | Limit available                        |
      | Limit breach                           |
    And the "Net exposure against credit envelope" field should render a progress bar over the Max volume "€ 25.000.000,00"
    And a legend "Under 70% normal / 70 to 80% elevated / 90% and above breach risk" should be visible
    And the "Utilization" percentage should be color-coded per the risk legend thresholds
    And the "Limit available" badge should read "Available" or "Unavailable"
    And the "Limit breach" badge should read "Within limit" or "In breach"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Financings tab (labeled "Financings" in design; header inside reads
  # "Linked financings") is lazy-loaded on activation and lists linked Financings
  # in a 4-column table (design shows 4 columns, not 5 as originally specced).
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0 @e2e-ready
  Scenario: Financings tab lazy-loads on activation (AC-05)
    Given I am logged in as Power User (Bank Admin)
    And I am viewing "FA-2026-00041" detail on the "Agreement details" tab
    When I click the "Financings" tab
    Then a network request to "GET /api/framework-agreements/FA-2026-00041/financings" should be issued exactly once
    And the tab should display a section header "Linked financings" with subtitle "Financings referencing this framework agreement."
    And the tab should display exactly 3 Financing rows
    And each row should show columns: "Financing ID" (as a link), "State" (badge), "Disbursement amount", "Disbursed at"
    And the "State" badge values should be one of "Active", "Draft", "Pending"
    And when the "Disbursed at" value is not applicable the cell should read "Not yet disbursed"
    And clicking a "Financing ID" link (e.g. "FIN-2024-00188") should navigate to the Financing detail page

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # Audit history tab (renamed from "Audit / Lifecycle History") is lazy-loaded,
  # sorted timestamp desc by default, server-paginated at 50 events per page.
  # Design adds Search + Event type + Date range filters and an
  # Event log ⇄ Reconstruct sub-toggle inside the tab.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0 @e2e-ready
  Scenario: Audit history tab lazy-loads with newest-first sort and 50-per-page cap (AC-06)
    Given I am logged in as Power User (Bank Admin)
    And "FA-2026-00041" has 75 audit events in its history
    And I am viewing "FA-2026-00041" detail on the "Agreement details" tab
    When I click the "Audit history" tab
    Then a network request to "GET /api/framework-agreements/FA-2026-00041/audit-history" should be issued exactly once
    And a Search input, an "Event type" filter, and a "Date range" filter should be visible in the tab header
    And a segmented toggle labeled "Event log" / "Reconstruct" should be visible with "Event log" selected by default
    And the tab should display exactly 50 audit event entries on the first page
    And the entries should be sorted by timestamp descending (newest first)
    And each entry should show: event title (e.g. "Agreement suspended"), actor name, absolute timestamp, optional reason quote, and a structured "Previous value" → "New value" diff panel when applicable
    And a "Next page" affordance should be visible

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-11
  # Authorized document download from "Templates and documents" tab
  # (Framework documents section) produces a signed short-lived URL and
  # emits FA_DOCUMENT_DOWNLOADED audit event.
  # ---------------------------------------------------------------------------

  @happy-path @ac-11 @p0
  Scenario: Authorized document download produces signed URL and audit event (AC-11)
    Given I am logged in as Power User (Bank Admin)
    And I am viewing "FA-2026-00041" detail on the "Templates and documents" tab
    And the "Framework documents" section table shows columns: "File name", "Type", "Label", "File size", "Uploaded at", "Uploaded by"
    When I click the download icon on the row for "Framework agreement_signed.pdf"
    Then a network request to "GET /api/framework-agreements/FA-2026-00041/documents/{docId}/download" should be issued
    And the response should return a signed URL with TTL of 5 minutes
    And the download should complete successfully
    And an audit event "FA_DOCUMENT_DOWNLOADED" should be emitted with actor, faId, docId, and timestamp

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Role-based section visibility on "Agreement details" tab (RefiNext domain rule).
  # LC user MUST NOT see PRICING section, LIFECYCLE timestamps, or Created by / Activated by
  # identity fields, but retains CREDIT ENVELOPE (max volume + currency) and Valid from / until.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready
  Scenario: LC user sees no PRICING section on Agreement details tab (AC-07)
    Given I am logged in as an LC user bound to "New Group Trade"
    When I open "FA-2026-00041" detail on the "Agreement details" tab
    Then the "CREDIT ENVELOPE" section should be visible with Max volume and Currency
    And the "LIFECYCLE" section should show Status, Valid from, Valid until (with value "Open ended" when applicable)
    And the "PRICING" section should NOT be present in the DOM
    And within LIFECYCLE, "Created at", "Created by", "Activated at", "Activated by" fields should NOT be present in the DOM
    And within IDENTITY, the "Bank entity" field should NOT be present in the DOM (per CR PRD1042-1495 A4 — Bank entity is now hidden for ALL roles, not just LC)
    And the "SPECIAL CONDITIONS" section should NOT be present in the DOM

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Governance action buttons (Edit / Suspend / Terminate) are hidden — not
  # disabled — for unpermitted roles. Same hidden-not-disabled rule applies to
  # the "Attach documents" button inside the Templates and documents tab.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0 @e2e-ready
  Scenario Outline: Non-permitted role does not see governance action buttons (AC-08)
    Given I am logged in as <role>
    When I open "FA-2026-00041" (Active state) detail page
    Then the top-right "Edit" button should NOT be present in the DOM
    And the top-right "Suspend" button should NOT be present in the DOM
    And the top-right "Terminate" button should NOT be present in the DOM
    When I click the "Templates and documents" tab
    Then within the "Framework documents" section, the "Attach documents" button should <attach_visibility>

    Examples:
      | role         | attach_visibility            |
      | Front Office | NOT be present in the DOM    |
      | Back Office  | NOT be present in the DOM    |
      | LC User      | NOT be present in the DOM    |
      | Auditor      | NOT be present in the DOM    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Tenant isolation (RefiNext CRITICAL domain rule).
  # LC user accessing FA bound to a DIFFERENT LC returns HTTP 404, NOT 403.
  # Also covers cross-role: unauthorized role attempting arbitrary FA ID.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario Outline: Cross-LC access returns 404 not 403 (AC-09)
    Given a Framework Agreement "FA-Beta-001" exists bound to Leasing Company "Beta Leasing GmbH"
    And I am logged in as <role> bound to <bound_lc>
    When I attempt to GET "/api/framework-agreements/FA-Beta-001"
    Then the HTTP response status should be 404
    And the response body should NOT include the string "FA-Beta-001" or "Beta Leasing GmbH"
    And the response body should NOT include the string "403" or "Forbidden"

    Examples:
      | role         | bound_lc          |
      | LC User      | New Group Trade   |
      | Front Office | (none)            |
      | Back Office  | (none)            |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Lifecycle-state gate: Front Office cannot see Draft FAs.
  # Draft FAs are pre-activation configuration, not yet visible to originators.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0 @e2e-ready
  Scenario: Front Office accessing a Draft-state FA returns 404 (AC-10)
    Given a Framework Agreement "FA-Draft-001" exists in Draft state
    And I am logged in as Front Office
    When I attempt to GET "/api/framework-agreements/FA-Draft-001"
    Then the HTTP response status should be 404
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
