# PRD1042-799 — US 11.1 | Framework Agreement | Framework Agreement Creation (Draft)

Generated: 2026-07-23
Story: PRD1042-799 — US 11.1 | Framework Agreement | Framework Agreement Creation (Draft)
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (17 ACs + 1 CR-derived AC, description present, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 8 of 18 | Blocked: 3 (B1 asset-type PENDING, B8/OQ-11-02 term location PENDING, B2-VFE-BE-pending) | Excluded: 8 (edge-case, separate-feature, or [CR-REMOVED per v10 A1] — scope filter table only)
Figma design: Nodes 9:13370 (CREATE AGREEMENT) + 9:13722 (CREATE - documents optional), file aQGn5OLEjEGJO7xGzFikP5 — 6-step wizard: Identity / Envelope & pricing / Validity & templates / Conditions (docs) / Review & save. Stage 2 COMPLETE via REST /nodes fallback (primary /files endpoint quota-exhausted; /nodes bucket independent).
Updated per CR PRD1042-1495 (2026-07-23): Bank Entity hidden (A4/1495); EUR fixed display-only (A5/1495); pricing on FA confirmed (B1/1495); VFE field blocked — BE-pending (B2/1495).
Updated per CR PRD1042-22 Reconciliation v10 (2026-07-27): Pricing narrowed to single `effective_rate` + `vfe_rate` (A1/v10); rate derivation removed — value stored as entered, resolves prior OQ-11.01-B on AC-16 (A2/v10); `lg_coverage_rate_override` removed from create/edit contracts (A4/v10); `rate_table_ref`, `predecessor_fa_id`, `countersignatory_id` remain null/unwritten (A5/v10); state model corrected to 4 stored values (Draft, Active, Suspended, Terminated) — Expired is DERIVED from `valid_until`, not stored (B2/v10); AC-15 asset-type uniqueness marked [CR-PENDING B1] pending Philipp; AC-17 term location marked [CR-PENDING B8] pending OQ-11-02; AC-09/AC-10 [CR-REMOVED per v10 A1] — obsolete pricing fields dropped from API contract.

---

## Blocked ACs (no scenarios generated)

| AC     | Reason                                                                                                                                             | Blocking dependency                                                                                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-15  | Asset type / uniqueness rule contested — v10 §7 pending decision: multiple-agreements-per-LC mechanism vs dedicated field + uniqueness change      | **[CR-PENDING B1]** — pending Philipp Maute per CR PRD1042-22 v10 §7. Bank Entity enum values also unresolved (OQ-11.01-A) but Bank Entity is hidden per 1495 A4 / v10 §8.2 |
| AC-17  | Term location undecided — v10 §7 pending decision: deal-only vs prefilled FA default field. Do NOT reuse `rate_lock_period_months` (removed by A1) | **[CR-PENDING B8]** — OQ-11-02 pending Philipp Maute per CR PRD1042-22 v10 §7                                                                                               |
| AC-VFE | VFE (early-repayment penalty) field added per CR PRD1042-1495 B2 — BE implementation pending. v10 retains `vfe_rate` alongside `effective_rate`    | B2-VFE-BE-pending — Nevena 2026-07-23: BE build gap; FE hidden until BE ships                                                                                               |

**Resolved by CR PRD1042-22 v10 (previously Blocked):**

- **AC-16** — Effective Rate auto-derivation vs user-entered behaviour: v10 A2 resolves as **user-entered, stored-as-entered, no derivation**. Assertion now bundled into AC-01/AC-02 happy path (the value the user enters equals the stored `effective_rate`).

---

## AC Scope Filter

| AC       | Description                                                                                                    | Classification                 | Rationale                                                                                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01    | Power User opens FA Cockpit, initiates Create; system loads active LCs                                         | `happy-path`                   | Core flow initiation; gate for all downstream actions                                                                                                                                                                               |
| AC-02    | Power User fills identity, pricing, validity, templates, documents; FA persisted Draft                         | `happy-path`                   | Core creation flow; all mandatory fields covered in happy-path scenario                                                                                                                                                             |
| AC-03    | FA invisible to downstream consumers (Financing assembly, Limit Management) while Draft                        | `edge-case`                    | Backend state assertion; no UI surface to verify Draft isolation from downstream at E2E layer                                                                                                                                       |
| AC-04    | Draft fully editable by Power User; hard delete permitted pre-activation                                       | `happy-path`                   | Hard delete is a user-visible action within this story's scope                                                                                                                                                                      |
| AC-05    | Agreement Name unique within (Tenant, Bank Entity, LC) across non-Terminated FAs                               | `main-error`                   | Directly blocks creation; conflict error returned to user                                                                                                                                                                           |
| AC-06    | LC must be Active; Suspended or Archived LC rejected at draft creation                                         | `main-error`                   | Directly blocks creation; explicit LC-status error returned                                                                                                                                                                         |
| AC-07    | Every referenced Product Template must be Published; deprecated templates rejected                             | `edge-case`                    | Requires seeding deprecated-template state; complex pre-condition; low-frequency path                                                                                                                                               |
| AC-08    | Max Volume EUR > 0; zero or negative rejected                                                                  | `main-error`                   | Inline field validation; directly blocks form submission                                                                                                                                                                            |
| AC-09    | ~~Pricing field ranges: Base Rate 0–25%, Spread -5%–15%, Rate Lock 1–360 months~~                              | **[CR-REMOVED per v10 A1]**    | Obsolete — `base_rate`, `spread`, `rate_lock_period_months` removed from API contract per CR PRD1042-22 v10 A1 (2026-07-27). Only `effective_rate` and `vfe_rate` retained. No boundary validation scenario needed                  |
| AC-10    | ~~Effective Rate consistency (Fixed/Floating); EURIBOR+Spread indicative (soft warning only)~~                 | **[CR-REMOVED per v10 A1+A2]** | Obsolete — `rate_type` removed from API contract per A1; Effective Rate is now stored-as-entered per A2 (no derivation, no Fixed/Floating consistency check, no EURIBOR+Spread indicative warning)                                  |
| AC-11    | POST /api/framework-agreements: Power User only; all other roles → HTTP 404                                    | `main-error`                   | RBAC enforcement; 404-not-403 tenant isolation pattern. **[CR-PENDING B5]** — v10 §5 flags 4 contested cells (FO create/enrich? SA least-privilege? BO review? FO sees pricing?); current Outline retained pending Philipp decision |
| AC-12    | Tenant ID bound from session JWT; non-overridable by request parameters                                        | `edge-case`                    | Security implementation detail; requires JWT forge tooling (D17); not observable via standard UI                                                                                                                                    |
| AC-13    | Audit event fa.created emitted on save with full Draft snapshot reference                                      | `edge-case`                    | Backend audit assertion; requires audit query API (D-Audit-Read-API); no E2E surface                                                                                                                                                |
| AC-14    | Hard delete pre-activation permitted; audit record fa.draft.deleted retained                                   | `happy-path`                   | Merged into AC-04 happy-path scenario — same user action                                                                                                                                                                            |
| AC-15    | Asset type / uniqueness — Bank Entity enum values pending (OQ-11.01-A) + multiple-agreements mechanism pending | **[CR-PENDING B1]**            | v10 §7 blocker — Philipp Maute decision required                                                                                                                                                                                    |
| AC-16    | Effective Rate stored as user-entered (no derivation) per v10 A2 — resolves OQ-11.01-B                         | `happy-path`                   | **Resolved by v10 A2** — bundled into AC-01/AC-02 happy path (stored value = entered value)                                                                                                                                         |
| AC-17    | Term location (deal-only vs prefilled FA default) — do NOT reuse `rate_lock_period_months`                     | **[CR-PENDING B8]**            | v10 §7 blocker — OQ-11-02 pending Philipp Maute                                                                                                                                                                                     |
| AC-VFE   | VFE (Vorfälligkeitsentschädigung) optional field as early-redemption calculation input                         | `Blocked`                      | BE implementation pending per PRD1042-1495 Nevena 2026-07-23; v10 retains `vfe_rate`; FE hidden until BE ships                                                                                                                      |
| AC-CR-A5 | `rate_table_ref`, `predecessor_fa_id`, `countersignatory_id` remain null after full lifecycle run              | `edge-case`                    | v10 A5 verification — no code path sets these fields; bundled into AC-01/AC-02 happy path assertion + AC-04 hard-delete audit record inspection                                                                                     |

**Gherkin generated for:** AC-01, AC-02, AC-04, AC-05, AC-06, AC-08, AC-11, AC-14, AC-16 (bundled), AC-CR-A5 (bundled)
**Blocked (no Gherkin):** AC-15 [CR-PENDING B1], AC-17 [CR-PENDING B8], AC-VFE
**[CR-REMOVED per v10 A1]:** AC-09, AC-10 — obsolete pricing fields dropped from API contract
**No Gherkin (edge-case or separate-feature):** AC-03, AC-07, AC-12, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                       | AC           | Priority | E2E |
| ------------- | ------------------------------------------------------------------------------ | ------------ | -------- | --- |
| `@happy-path` | Power User creates FA Draft with valid data (Scenario — 1 variant)             | AC-01, AC-02 | P0       | ✅  |
| `@happy-path` | Power User hard-deletes a Draft FA before activation                           | AC-04, AC-14 | P0       | ✅  |
| `@main-error` | Duplicate Agreement Name rejected with conflict error                          | AC-05        | P0       | ✅  |
| `@main-error` | Creating FA against a Suspended LC is rejected                                 | AC-06        | P0       | ✅  |
| `@main-error` | Non-positive Max Volume EUR rejected (Scenario Outline — 2 variants)           | AC-08        | P0       | ✅  |
| `@main-error` | Unauthorized roles cannot create FA — HTTP 404 (Scenario Outline — 5 variants) | AC-11        | P0       | ✅  |

Active scenario blocks: 6 (2 Scenarios + 2 Outlines + 2 single Scenarios)
E2E automation candidates: 6 of 6 scenarios ✅

---

## Feature file

```gherkin
@framework-agreement @us-11.1 @p0
Feature: Framework Agreement Creation — Draft (US 11.1 — PRD1042-799)
  As a Power User (Bank Admin)
  I want to create a new Framework Agreement in Draft state for a specific Leasing Company
  So that the bilateral credit-envelope agreement is captured as a governed configuration object
  that downstream Financings will reference

  Background:
    Given the Framework Agreement module is active for the tenant
    And I am authenticated as a Power User (Bank Admin) with an MFA-validated session

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-16, AC-CR-A5
  # Power User opens the creation wizard and fills all mandatory fields:
  # Agreement Name, Leasing Company (Active), Max Volume EUR, ≥1 Published
  # Product Template, single Effective Rate, Valid From. Bank Entity is hidden
  # from the form per CR 1495 A4 (backend defaults to "OTHER"). Currency is
  # EUR fixed and displayed read-only per CR 1495 A5. Draft is persisted.

  @happy-path @ac-01 @ac-02 @ac-16 @ac-cr-a5 @p0 @e2e-ready
  Scenario: Power User creates Framework Agreement Draft with valid data (AC-01, AC-02, AC-16, AC-CR-A5)
    Given a Leasing Company "LC Test GmbH" exists and is Active in Partner Management
    And a Bank Product Template "Standard Lease Template" exists in Published state
    When I navigate to "Framework agreements" from the Business configuration menu
    And I click "Create agreement"
    Then the 6-step wizard is displayed starting on step "Identity"
    And the creation form loads with a list of active Leasing Companies
    And the Bank Entity field is not visible on the form
    And the Currency field displays "EUR" as read-only
    And the following fields are NOT present on the form (per CR PRD1042-22 v10 A1/A4):
      | field                             |
      | Base Rate                         |
      | Spread                            |
      | Rate Type                         |
      | Rate Lock Period                  |
      | LG-Specific Coverage Rate Override|
    When I fill in the following fields:
      | Field                     | Value             |
      | Agreement Name            | RV-SSKM-2026-001  |
      | Leasing Company           | LC Test GmbH      |
      | Max Volume EUR            | 5000000.00        |
      | Allowed Product Templates | Standard Lease Template |
      | Effective Rate (%)        | 4.7500            |
      | Valid From                | 2026-08-01        |
    And I click "Save as draft"
    Then the Framework Agreement "RV-SSKM-2026-001" is created in Draft state
    And I am navigated to the detail view of the new Framework Agreement
    And the agreement appears in the FA list with status badge "Draft"
    And the persisted `effective_rate` equals 4.7500 exactly (stored as entered, no derivation per v10 A2)
    And the persisted record has `rate_table_ref` null, `predecessor_fa_id` null, `countersignatory_id` null (per v10 A5)


  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Agreement Name must be unique within (Tenant, Bank Entity, LC) across all
  # non-Terminated FAs. Submitting a duplicate name returns a conflict error
  # and the Draft is NOT created.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @e2e-ready
  Scenario: Duplicate Agreement Name within same tenant and LC context is rejected (AC-05)
    Given a Framework Agreement "RV-SSKM-2026-001" already exists and is Active for LC "LC Test GmbH"
    When I attempt to create a new Framework Agreement with Agreement Name "RV-SSKM-2026-001" for LC "LC Test GmbH"
    And I click "Save as draft"
    Then I see a conflict error indicating the Agreement Name is already in use
    And no new Framework Agreement Draft is created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # LC must be Active in Partner Management at draft creation time. Attempting
  # to create an FA against a Suspended or Archived LC is rejected immediately
  # with an explicit LC-status error referencing the LC's current state.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: Creating FA against a Archived Leasing Company is rejected (AC-06)
    Given a Leasing Company "LC Suspended GmbH" is Suspended/Archived in Partner Management
    When I open the Framework Agreement creation form
    And I opened Leasing Company drop down list.
    Then Leasing Company "LC Suspended Gmbh" should not be visible in the list.


  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Max Volume EUR must be strictly positive. Zero and negative values are
  # rejected with an inline field validation error before or on save.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0 @e2e-ready
  Scenario Outline: Non-positive Max Volume EUR is rejected with inline validation error (AC-08)
    Given I am on the Framework Agreement creation form with all other fields valid
    When I enter "<value>" in the Max Volume EUR field
    And I click "Save as draft"
    Then I see a validation error on the Max Volume EUR field
    And no Framework Agreement Draft is created

    Examples:
      | value |
      | 0     |
      | -100  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # POST /api/framework-agreements is restricted to Power User (Bank Admin).
  # All other roles receive HTTP 404 per the 404-not-403 tenant isolation
  # pattern. UI visibility is NOT a permission boundary — backend enforces this.
  #
  # [CR-PENDING B5] — CR PRD1042-22 v10 §5 flags 4 contested cells in the
  # permission matrix (FO create/enrich? SA least-privilege? BO review?
  # FO sees pricing?). The current 5-role Outline is retained as-is pending
  # Philipp Maute's decision. Do NOT pre-emptively add FO-authoring rows —
  # granting FO create/enrich touches MaRisk BTO 1.1 front/back-office separation.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready @cr-pending-b5
  Scenario Outline: Unauthorized roles cannot create a Framework Agreement — HTTP 404 (AC-11)
    Given I am authenticated as a <role> user
    When I POST to "/api/framework-agreements" with a valid FA creation payload
    Then the response status should be 404

    Examples:
      | role         |
      | Front Office |
      | Back Office  |
      | LC User      |
      | Support      |
      | Auditor      |
```
