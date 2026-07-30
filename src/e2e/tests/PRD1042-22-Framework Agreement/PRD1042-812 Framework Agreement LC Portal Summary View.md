# PRD1042-812 — US 11.13 | Framework Agreement | Framework Agreement — LC Portal Summary View

Generated: 2026-07-24
Story: PRD1042-812 — US 11.13 | Framework Agreement | Framework Agreement — LC Portal Summary View
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (21 ACs, description present with LC permission matrix + field visibility spec + edge cases, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 12 of 21 | Blocked: 1 (D-LimitMgmt-Degraded) | Excluded: 8 (edge-case, separate-feature, NFR, or bundled — scope filter table only)
Figma design: Node 109:8688 on canvas 100:10990 (LC Portal summary page), file aQGn5OLEjEGJO7xGzFikP5. Design-blind on this run — Figma MCP is quota-exhausted on the Professional View seat, REST API is unreachable without shell access, and no rendered PNG for this node was present in `src/e2e/fixtures/figma-e11/rendered-nodes/` at generation time. Test copy anchors to the spec (which the pipeline convention treats as authoritative for this run).
Updated per CR PRD1042-22 Reconciliation v10 (2026-07-27): B2/v10 note — LC Portal list is already filtered to Active + Suspended only (Draft/Terminated hidden); past `valid_until` state derivation (Expired) is bank-side (see 801 AC-CR-B2). LC sees only own-LC agreements; the state model 4-values invariant is honoured server-side before DTO assembly. Bank-internal hidden field inventory (AC-04/AC-07) already excludes `Base Rate`, `Spread`, `Rate Type`, `LG-Specific Coverage Rate Override` — all removed from the bank contract per v10 A1/A4; the LC-side hidden inventory remains correct. No new scenarios required.

---

## Design references

| File                                         | Content                                                                                                                                                                                                                                                                              | Applies to    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `src/e2e/fixtures/figma-e11/_manifest.json`  | Image-fill manifest for the full E11 file (rendered assets index) — used to confirm the file key is `aQGn5OLEjEGJO7xGzFikP5`                                                                                                                                                         | Whole story   |
| `src/e2e/fixtures/figma-e11/rendered-nodes/` | Directory of manually-exported node PNGs from prior Epic 11 batches (PRD1042-799 / 800 / 801 / 807 / 803 / 807 / 809). No `109-8688*` rendering exists here at generation time — flagged as **MAJOR design gap** (page 100:10990 "LC Portal summary" has not been PNG-exported yet). | Gap flag only |

When the LC Portal summary frame is later rendered to PNG, use it to verify verbatim card labels, empty-state copy, hidden-fields inventory, and download-affordance placement against the Gherkin scenarios below.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                                | Blocking dependency                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| AC-11 | Requires Limit Management degraded-mode test harness to simulate an "Available Volume unavailable" state and observe the "—" fallback rendering. No admin/test API exists to force Limit Mgmt into degraded response. | D-LimitMgmt-Degraded — Limit Management degraded-mode simulator |

---

## AC Scope Filter

| AC    | Description                                                                                                                                      | Classification     | Rationale                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | LC Portal FA section visible only when tenant `LC Portal Enabled = true`                                                                         | `happy-path`       | Tenant-flag ON path: LC user sees the Framework Agreements navigation item and can enter the section                                                                                 |
| AC-02 | LC sees only own-LC FAs — server-side LC scope filter is fail-closed                                                                             | `main-error`       | Consolidated into AC-09/10/18 cross-LC 404 Outline (test-observable behaviour is identical)                                                                                          |
| AC-03 | Only Active and Suspended FAs are visible; Draft and Terminated are filtered out                                                                 | `happy-path`       | Core LC list render — status filter is server-enforced                                                                                                                               |
| AC-04 | Each FA displays: Agreement Name, Validity window, Max Volume EUR, Available Volume, simplified lifecycle status, allowed Product Template names | `happy-path`       | Consolidated into AC-03 render (testing card content covers field-set)                                                                                                               |
| AC-05 | LC user can download Framework Documents attached to their own FAs (signed URLs)                                                                 | `happy-path`       | Download happy path — signed URL flow                                                                                                                                                |
| AC-06 | No edit, no lifecycle action, no override — strictly read-only                                                                                   | `main-error`       | UX invariant — action controls MUST NOT be present in the DOM (hidden-not-disabled)                                                                                                  |
| AC-07 | Field spec: `Open ended` shown when Valid Until null; templates names-only; bank-internal fields hidden at DTO layer                             | `happy-path`       | Bank-internal fields (Bank Entity, Effective/Base/Spread rates, LG Override, Special Conditions, governance justifications, audit history, linked Financings) MUST NOT be in the DOM |
| AC-08 | Server enforces LC scope filter before returning any data                                                                                        | `main-error`       | Consolidated into AC-09/10/18 (same test-observable 404 behaviour)                                                                                                                   |
| AC-09 | Any FA not bound to the requesting LC returns HTTP 404 (not 403) — no information leakage                                                        | `main-error`       | Tenant isolation domain rule — 404-not-403 pattern                                                                                                                                   |
| AC-10 | Direct API access with manipulated LC reference is blocked at API layer                                                                          | `main-error`       | Consolidated into AC-09 (same 404 return; no client-side manipulation is testable independently at E2E layer)                                                                        |
| AC-11 | Available Volume falls back to "—" when Limit Management is unavailable                                                                          | `Blocked`          | D-LimitMgmt-Degraded — no way to force Limit Mgmt degraded state in E2E environment                                                                                                  |
| AC-12 | Download URLs are tenant-scoped, signed, short-lived (5-minute TTL)                                                                              | `edge-case`        | TTL boundary and signature integrity are server-side integration concerns; belongs to backend contract tests, not E2E manual                                                         |
| AC-13 | LC scope bound from session JWT and non-overridable; non-LC-visible fields excluded at DTO assembly (not present even in debug response)         | `separate-feature` | JWT-tampering and DTO-leak forensics belong to Epic 28 (User Mgmt / JWT) and Epic 26 (Audit / event-payload leak) test suites                                                        |
| AC-14 | `LC_CROSS_LC_ACCESS_BLOCKED` audit event emitted on cross-LC access attempts                                                                     | `separate-feature` | Audit event verification belongs to Epic 26 audit event schema tests (US 26.x)                                                                                                       |
| AC-15 | LC Portal FA list p95 ≤ 1.5 seconds                                                                                                              | `separate-feature` | Performance NFR — belongs to performance / load-test suite                                                                                                                           |
| AC-16 | Tenant `LC Portal Enabled = false` → FA section hidden fail-closed (navigation + API 404)                                                        | `main-error`       | Merged with AC-01 into one flag-driven Outline (visibility + API 404 under one scenario)                                                                                             |
| AC-17 | Empty state copy: "No Framework Agreements are currently active for your company."                                                               | `happy-path`       | Empty-state render — copy anchored to spec (design frame not verifiable)                                                                                                             |
| AC-18 | Attempt to access another LC's FA via direct URL → HTTP 404                                                                                      | `main-error`       | Consolidated into AC-09 (same 404 return)                                                                                                                                            |
| AC-19 | Bank-internal addendum download → HTTP 404 (document not in LC's permitted list)                                                                 | `main-error`       | Document tenant-scope enforcement — separate scenario (different endpoint from FA fetch)                                                                                             |
| AC-20 | FA Terminated during viewing → next refresh excludes it (graceful disappearance)                                                                 | `edge-case`        | Race-condition behaviour — belongs to concurrency / eventual-consistency tests                                                                                                       |
| AC-21 | `LC_PORTAL_FA_LIST_ACCESS` / `LC_PORTAL_FA_DETAIL_ACCESS` audit events (sampled, informational)                                                  | `separate-feature` | Audit events — Epic 26 audit event schema tests                                                                                                                                      |

**Gherkin generated for:** AC-01, AC-03, AC-04 (in AC-03), AC-05, AC-06, AC-07, AC-09 (with AC-02, AC-08, AC-10, AC-18 merged), AC-16 (with AC-01 merged), AC-17, AC-19
**Blocked (no Gherkin):** AC-11
**No Gherkin (edge-case, separate-feature, or NFR):** AC-12, AC-13, AC-14, AC-15, AC-20, AC-21

---

## Scenarios summary

| Tag           | Scenario                                                                                                       | AC                                | Priority | E2E                            |
| ------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------- | ------------------------------ |
| `@happy-path` | LC user opens LC Portal and sees the Framework Agreements section (tenant flag ON)                             | AC-01                             | P0       | ✅                             |
| `@happy-path` | LC portal FA list shows Active and Suspended agreements with core card fields                                  | AC-03, AC-04                      | P0       | ✅                             |
| `@happy-path` | LC portal FA detail shows LC-visible field set only (`Open ended` when Valid Until null, templates names-only) | AC-04, AC-07                      | P0       | ✅                             |
| `@happy-path` | LC user downloads a permitted Framework Document from their own FA                                             | AC-05                             | P0       | ✅                             |
| `@happy-path` | Empty state renders when LC has no Active or Suspended FAs                                                     | AC-17                             | P0       | ✅                             |
| `@main-error` | LC user sees no edit, lifecycle, or override controls on any FA (read-only invariant)                          | AC-06                             | P0       | ✅                             |
| `@main-error` | Cross-LC FA access returns 404 (tenant isolation + LC scope filter, uniform for direct URL and API)            | AC-02, AC-08, AC-09, AC-10, AC-18 | P0       | ⚙️ needs D20                   |
| `@main-error` | Tenant `LC Portal Enabled = false` hides the FA section and the API returns 404 (fail-closed)                  | AC-01, AC-16                      | P0       | ⚙️ needs D-TenantFlag-Toggle   |
| `@main-error` | Bank-internal addendum download returns 404 for LC user (document tenant-scope enforcement)                    | AC-19                             | P0       | ⚙️ needs D-DocMgmt-InternalDoc |

Active scenario blocks: 9 (0 Outlines + 9 Scenarios)
E2E automation candidates: 6 of 9 scenarios ✅

---

## Design specification (source of truth)

Framework Agreement LC Portal summary as specified in PRD1042-812 (US 11.13) description and its Field Specification / Visibility Rules table. Scenarios below anchor to this specification. The design frame at Figma node `109:8688` was not fetchable during this pipeline run — where the AC Scope Filter shows AC text that later disagrees with the design once verifiable, the design becomes the source of truth for future test updates.

**Navigation and gate (spec):**

| Trigger                                     | Effect                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Tenant `LC Portal Enabled = true` (Epic 29) | LC Portal navigation contains a `Framework Agreements` entry visible to LC users   |
| Tenant `LC Portal Enabled = false`          | `Framework Agreements` navigation entry is NOT present in the DOM; API returns 404 |
| LC user has no Active or Suspended FAs      | Empty state: "No Framework Agreements are currently active for your company."      |

**LC-visible field set (spec — DTO exposed to LC):**

| Field                            | Type                 | M/O/C | Notes                                                                                             |
| -------------------------------- | -------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `Agreement Name`                 | text                 | M     | Always visible                                                                                    |
| `Lifecycle Status` (LC-friendly) | enum                 | M     | Values: `Active`, `Suspended`. Draft/Terminated agreements are filtered out — never appear in DTO |
| `Valid From`                     | date                 | M     | Always visible                                                                                    |
| `Valid Until`                    | date                 | O     | When null, display `Open ended`                                                                   |
| `Max Volume EUR`                 | decimal              | M     | LC's own envelope                                                                                 |
| `Available Volume EUR`           | decimal              | M     | Sourced from Limit Management. `—` fallback when Limit Mgmt unavailable (AC-11 blocked)           |
| `Limit Available Flag`           | boolean              | M     | Whether new Financings may be requested under this FA                                             |
| `Allowed Product Templates`      | list of names        | M     | Template names only — internal pricing per template NOT exposed                                   |
| `Framework Documents`            | list of (name, type) | M     | Original agreement always visible to LC; bank-internal addenda filtered by document tenant-scope  |

**Hidden fields (spec — bank-internal, MUST NOT appear on any LC surface):**

Bank Entity, Effective Rate, Base Rate, Spread, LG-Specific Coverage Rate Override, Special Conditions (bank-internal), governance justifications, audit history, linked Financings list, `Created by`, `Activated by`, and any other approver / actor identity fields.

**API endpoints (spec):**

| Endpoint                                                                  | Purpose                                         | 404 conditions                                                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET /api/lc-portal/framework-agreements`                                 | LC-scoped FA list DTO                           | Tenant flag OFF; caller not an LC user                                                             |
| `GET /api/lc-portal/framework-agreements/{id}`                            | LC-scoped FA detail DTO                         | `{id}` not bound to caller's LC; tenant flag OFF; FA in Draft or Terminated state                  |
| `GET /api/lc-portal/framework-agreements/{id}/documents/{docId}/download` | Signed 5-min URL for LC-permitted document only | `{docId}` not in LC's permitted document list (bank-internal addenda); FA not bound to caller's LC |

**Verbatim copy (spec, taken as authoritative for this run):**

- Empty state: `No Framework Agreements are currently active for your company.`
- Valid Until placeholder when null: `Open ended`
- Lifecycle status enum (LC-friendly): `Active`, `Suspended`
- Available Volume fallback (when Limit Mgmt unavailable, AC-11 — blocked): `—` (em dash)

**Role / permission matrix (spec, LC Portal FA Summary View):**

| Action                                     | Power User (Bank Admin) | Front Office | Back Office / Risk | LC User | Support | Auditor |
| ------------------------------------------ | ----------------------- | ------------ | ------------------ | ------- | ------- | ------- |
| View own LC's FA list (Active / Suspended) | —                       | —            | —                  | ✓       | —       | —       |
| View own FA detail (limited summary)       | —                       | —            | —                  | ✓       | —       | —       |
| Download Framework Documents on own FA     | —                       | —            | —                  | ✓       | —       | —       |

For roles marked `—` (Power User, Front Office, Back Office, Support, Auditor), the LC Portal endpoint returns 404-not-403 — the LC Portal surface is not visible to bank-side roles by design.

---

## Feature file

```gherkin
@framework-agreement @lc-portal @us-11.13 @p0
Feature: Framework Agreement — LC Portal Summary View (US 11.13 — PRD1042-812)
  As a Leasing Company user
  I want to see a summary of the Framework Agreements between my LC and the bank
  So that I know my available volume, validity window, and which products are permitted under each agreement

  Background:
    Given the RefiNext platform is up and healthy
    And a Leasing Company "New Group Trade" is provisioned with `LC Portal Enabled = true`
    And "New Group Trade" has the following Framework Agreements bound to it:
      | agreement_name       | lifecycle_status | valid_from  | valid_until | max_volume_eur | available_volume_eur | limit_available | allowed_templates                          |
      | RV-SSKM-2026-001     | Active           | 13 Jun 2026 | (null)      | 25000000.00    | 12500000.00           | true            | Standard Auto Lease, Fleet Leasing Program |
      | RV-SSKM-2026-002     | Suspended        | 01 Feb 2026 | 31 Jan 2027 | 10000000.00    | 4200000.00            | false           | Standard Auto Lease                        |
    And "RV-SSKM-2026-001" has 1 Framework Document attached: name "Framework agreement_signed.pdf", type "Original agreement", 2.4 MB
    And "New Group Trade" is served by an LC user "Nina Berger" with email "nina.berger@newgrouptrade.example"
    And a separate Leasing Company "Beta Leasing GmbH" exists with `LC Portal Enabled = true` and its own Framework Agreement "FA-Beta-001" (Active)
    And "Beta Leasing GmbH" has a bank-internal addendum document "Internal-side-letter.pdf" attached to "FA-Beta-001" that is not in the LC-permitted document list

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # LC user with tenant flag ON sees the Framework Agreements navigation entry
  # in the LC Portal and can enter the section. The section is the read-only
  # summary of the LC's own Framework Agreements.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario: LC user opens LC Portal and sees the Framework Agreements section (AC-01)
    Given I am logged in as LC user "Nina Berger" bound to "New Group Trade"
    When I open the LC Portal
    Then the primary navigation should contain a "Framework Agreements" entry
    When I click the "Framework Agreements" entry
    Then a network request to "GET /api/lc-portal/framework-agreements" should be issued exactly once
    And the response status should be 200
    And the page heading should read "Framework Agreements"
    And the page should render the LC-scoped FA list (no bank-internal columns present in the DOM)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03, AC-04
  # LC portal FA list is filtered to Active and Suspended agreements only.
  # Draft and Terminated are stripped at the API layer — they never reach the
  # DTO and never render. Each card exposes the LC-visible field set.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @ac-04 @p0 @e2e-ready
  Scenario: LC portal FA list shows Active and Suspended agreements with core card fields (AC-03, AC-04)
    Given I am logged in as LC user "Nina Berger" bound to "New Group Trade"
    When I open the LC Portal "Framework Agreements" section
    Then the list should display exactly 2 FA cards
    And exactly one card should show the lifecycle badge "Active"
    And exactly one card should show the lifecycle badge "Suspended"
    And no card should show the lifecycle badge "Draft"
    And no card should show the lifecycle badge "Terminated"
    And each card should display the fields: "Agreement Name", "Valid From", "Valid Until", "Max Volume EUR", "Available Volume", "Limit Available", "Allowed Product Templates"
    And the "RV-SSKM-2026-001" card should show Max Volume "€ 25,000,000.00", Available Volume "€ 12,500,000.00", Limit Available "Yes", Valid From "13 Jun 2026", Valid Until "Open ended"
    And the "RV-SSKM-2026-001" card should list the Allowed Product Templates "Standard Auto Lease" and "Fleet Leasing Program" by name only
    And no card should show any of the following bank-internal fields: "Bank Entity", "Effective Rate", "Base Rate", "Spread", "LG-Specific Coverage Rate Override", "Special Conditions"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04, AC-07
  # LC portal FA detail exposes ONLY the LC-visible field set — with the
  # `Open ended` placeholder rendered when Valid Until is null, allowed
  # templates shown by name only (no pricing), and no bank-internal fields.
  # Hidden field set is verified at DOM level: not-in-DOM, not just not-visible.
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @ac-07 @p0 @e2e-ready
  Scenario: LC portal FA detail shows LC-visible field set only (AC-04, AC-07)
    Given I am logged in as LC user "Nina Berger" bound to "New Group Trade"
    And I am on the LC Portal "Framework Agreements" list
    When I open the detail view for "RV-SSKM-2026-001"
    Then a network request to "GET /api/lc-portal/framework-agreements/RV-SSKM-2026-001" should be issued exactly once
    And the response status should be 200
    And the detail view should show the field "Agreement Name" with value "RV-SSKM-2026-001"
    And the detail view should show the field "Lifecycle Status" with value "Active"
    And the detail view should show the field "Valid From" with value "13 Jun 2026"
    And the detail view should show the field "Valid Until" with value "Open ended"
    And the detail view should show the field "Max Volume EUR" with value "€ 25,000,000.00"
    And the detail view should show the field "Available Volume EUR" with value "€ 12,500,000.00"
    And the detail view should show the field "Limit Available" with value "Yes"
    And the detail view should list "Allowed Product Templates" as "Standard Auto Lease" and "Fleet Leasing Program"
    And the detail view should list "Framework Documents" with an entry "Framework agreement_signed.pdf" of type "Original agreement"
    And the following bank-internal fields should NOT be present in the DOM: "Bank Entity", "Effective Rate", "Base Rate", "Spread", "LG-Specific Coverage Rate Override", "Special Conditions", "Created by", "Activated by", "Audit history", "Linked Financings"
    And the JSON response body should NOT contain any of the keys: `bankEntity`, `effectiveRate`, `baseRate`, `spread`, `lgSpecificCoverageRateOverride`, `specialConditions`, `createdBy`, `activatedBy`, `auditHistory`, `linkedFinancings`

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # LC user can download the Framework Documents attached to their own FA.
  # Download flow issues a signed short-lived URL against the tenant-scoped
  # document endpoint. TTL boundary itself (5 minutes) is a server-side
  # contract concern — excluded here as edge-case (AC-12) and covered by
  # backend integration tests.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0 @e2e-ready
  Scenario: LC user downloads a permitted Framework Document from their own FA (AC-05)
    Given I am logged in as LC user "Nina Berger" bound to "New Group Trade"
    And I am viewing the LC Portal detail view for "RV-SSKM-2026-001"
    And the "Framework Documents" list shows an entry "Framework agreement_signed.pdf" of type "Original agreement"
    When I click the download affordance on the "Framework agreement_signed.pdf" row
    Then a network request to "GET /api/lc-portal/framework-agreements/RV-SSKM-2026-001/documents/{docId}/download" should be issued
    And the response should return a signed URL
    And the browser should initiate the file download for "Framework agreement_signed.pdf"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-17
  # Empty state is a first-class render for an LC that has no Active or
  # Suspended FAs. Copy is spec-authoritative (design frame not verifiable).
  # ---------------------------------------------------------------------------

  @happy-path @ac-17 @p0 @e2e-ready
  Scenario: Empty state renders when LC has no Active or Suspended FAs (AC-17)
    Given a Leasing Company "Empty LC" is provisioned with `LC Portal Enabled = true`
    And "Empty LC" has zero Framework Agreements in Active or Suspended state
    And I am logged in as LC user "Emma Zero" bound to "Empty LC"
    When I open the LC Portal "Framework Agreements" section
    Then the list should not render any FA cards
    And an empty state should be visible with the copy "No Framework Agreements are currently active for your company."

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Read-only invariant: LC MUST NOT see any edit / lifecycle / override
  # affordance anywhere in the LC Portal FA view. Assert on DOM absence,
  # not on `disabled` attribute — the UX rule is hidden-not-disabled.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: LC user sees no edit, lifecycle, or override controls on any FA (AC-06)
    Given I am logged in as LC user "Nina Berger" bound to "New Group Trade"
    And I am on the LC Portal "Framework Agreements" list
    Then no FA card should contain any of the following controls in the DOM: "Edit", "Suspend", "Terminate", "Reactivate", "Amend"
    When I open the detail view for "RV-SSKM-2026-001"
    Then the detail view should NOT contain any of the following controls in the DOM: "Edit", "Suspend", "Terminate", "Reactivate", "Attach documents", "Detach document", "Override"
    And the detail view should NOT contain any control whose text or accessible name includes "edit", "suspend", "terminate", "reactivate", "override"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-08, AC-09, AC-10, AC-18
  # Tenant isolation core rule (RefiNext CRITICAL domain rule).
  # Cross-LC FA access — whether via direct URL, manipulated LC reference,
  # or an FA ID that belongs to another LC — MUST return HTTP 404, NOT 403,
  # to prevent information leakage about the existence of another LC's FAs.
  # The response MUST NOT contain the queried FA ID, the other LC's name,
  # or any language distinguishing "forbidden" from "not found".
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-08 @ac-09 @ac-10 @ac-18 @p0
  Scenario: Cross-LC FA access returns 404 not 403 (AC-02, AC-08, AC-09, AC-10, AC-18)
    Given a Framework Agreement "FA-Beta-001" exists bound to Leasing Company "Beta Leasing GmbH"
    And I am logged in as LC user "Nina Berger" bound to "New Group Trade"
    When I send a GET request to "/api/lc-portal/framework-agreements/FA-Beta-001"
    Then the HTTP response status should be 404
    And the response body should NOT contain the string "FA-Beta-001"
    And the response body should NOT contain the string "Beta Leasing GmbH"
    And the response body should NOT contain the string "403"
    And the response body should NOT contain the string "Forbidden"
    When I attempt to navigate directly to the URL "/lc-portal/framework-agreements/FA-Beta-001"
    Then the page should render a "Framework agreement not found" state
    And the page should NOT reveal the existence of "Beta Leasing GmbH" or "FA-Beta-001"
    When I send a GET request to "/api/lc-portal/framework-agreements?lc=beta-leasing-gmbh"
    Then the response body should list ONLY Framework Agreements bound to "New Group Trade"
    And the response should NOT include any Framework Agreement bound to "Beta Leasing GmbH"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01, AC-16
  # Fail-closed enforcement of the tenant `LC Portal Enabled` flag.
  # When the flag is OFF for the LC, the Framework Agreements section MUST
  # be entirely absent from LC portal navigation AND the API MUST return
  # 404 for direct calls — no shell page, no "coming soon", no 403.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @ac-16 @p0
  Scenario: Tenant LC Portal Enabled = false hides the FA section and the API returns 404 (AC-01, AC-16)
    Given a Leasing Company "Locked LC" is provisioned with `LC Portal Enabled = false`
    And "Locked LC" has one Active Framework Agreement "FA-Locked-001"
    And I am logged in as LC user "Lena Locked" bound to "Locked LC"
    When I open the LC Portal
    Then the primary navigation should NOT contain a "Framework Agreements" entry
    When I send a GET request to "/api/lc-portal/framework-agreements"
    Then the HTTP response status should be 404
    When I send a GET request to "/api/lc-portal/framework-agreements/FA-Locked-001"
    Then the HTTP response status should be 404
    And the response body should NOT contain the string "FA-Locked-001"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-19
  # Document tenant-scope enforcement — a bank-internal addendum attached to
  # an FA is filtered from the LC-permitted document list at the DTO layer
  # AND the download endpoint returns 404 for that doc even if the LC guesses
  # or brute-forces its ID. 404 (not 403) is uniform to prevent leakage of
  # the existence of bank-internal documents.
  # ---------------------------------------------------------------------------

  @main-error @ac-19 @p0
  Scenario: Bank-internal addendum download returns 404 for LC user (AC-19)
    Given a Leasing Company "New Group Trade" has Framework Agreement "RV-SSKM-2026-001" with a bank-internal addendum document "Internal-side-letter.pdf" attached (docId "doc-internal-9001") that is NOT in the LC-permitted document list
    And I am logged in as LC user "Nina Berger" bound to "New Group Trade"
    When I open the LC Portal detail view for "RV-SSKM-2026-001"
    Then the "Framework Documents" list should NOT contain an entry for "Internal-side-letter.pdf"
    When I send a GET request to "/api/lc-portal/framework-agreements/RV-SSKM-2026-001/documents/doc-internal-9001/download"
    Then the HTTP response status should be 404
    And the response body should NOT contain the string "Internal-side-letter.pdf"
    And the response body should NOT contain the string "403"
    And the response body should NOT contain the string "Forbidden"
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
