# PRD1042-809 — US 11.10 | Framework Agreement | Framework Agreement Edit (Active & Suspended)

Generated: 2026-07-24
Story: PRD1042-809 — US 11.10 | Framework Agreement | Framework Agreement Edit (Active & Suspended)
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (18 derived ACs, description present with permission matrix + editable/immutable field lists, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 12 of 18 | Blocked: 2 (D-Concurrency-Forge, D-MFA-StepUp) | Excluded: 4 (edge-case, separate-feature, or bundled — scope filter table only)
Figma design: Node 100:6629 (EDIT AGREEMENT) on canvas 10:15285, file aQGn5OLEjEGJO7xGzFikP5 — frame render available in fixtures (see "Design references" below). REST + MCP were quota-exhausted on 2026-07-24; frames were manually PNG-exported from Figma. LIMIT BREACH variant (node 100:10496) is NOT extracted — AC-12 warning-path copy remains design-blind. Exported frame shows the pre-CR two-step edit wizard (`Edit agreement details` → `Review your changes`); per CR B4 the edit flow is being reworked to mirror the 6-step creation wizard — treat the exported frame as `pre-CR design — refresh needed`.
Updated per CR PRD1042-1495 (2026-07-24): Edit flow aligned with the 6-step Creation wizard (including the Special Conditions step) per B4 — the two-step exported frame is stale; the reworked wizard preserves the existing `edit_version_counter` behaviour (each save bumps the version). Immutable-field list (AC-03) is unchanged: Agreement ID / Name / LC / Bank Entity / Tenant ID / Currency / Valid From remain rejected on modification. Bank Entity remains hidden per CR A4 but was already immutable — no additional test surface for A4 in this story.

---

## Design references

| File                                                                                                      | Content                                                                                                                                                                                                                                                                              | Applies to                                                         |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `src/e2e/fixtures/figma-e11/rendered-nodes/frame-100-6629__EDIT-AGREEMENT.png`                            | 4 states of the edit wizard: (1) Step 1 `Edit agreement details` — LOCKED FIELDS + EDITABLE FIELDS, (2) Step 1 populated with edits + `Edit justification` textarea, (3) Step 2 `Review your changes` — CHANGES table + JUSTIFICATION block, (4) Success — `Agreement updated` panel | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-13, AC-14             |
| `src/e2e/fixtures/figma-e11/rendered-nodes/detail__EDIT-AGREEMENT-allowed-product-templates-dropdown.png` | Zoomed-in view of the Allowed Product Templates chip-list + dropdown open state, with template checkmarks and removal chips                                                                                                                                                          | AC-02 (Allowed Templates field), AC-11 (template removal conflict) |

Use these to verify: locked-vs-editable field grouping (AC-03 immutable rejection), Justification textarea ≥30-char guardrail copy (AC-04), diff-preview layout and column labels (AC-06), Allowed Templates chip UX (AC-11), and the "Agreement updated" success confirmation copy. AC-12 limit-breach warning banner + AC-09 optimistic-lock 409 message remain design-blind — see Blocked ACs. Missing frame `100:10496` (EDIT-AGREEMENT-LIMIT-BREACH) can be exported later if AC-12 UX verification is required.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                               | Blocking dependency                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| AC-09 | Requires deterministic race condition between two Power User (Bank Admin) sessions with `expectedVersion` counter drift — no test harness to force interleaved PATCH | D-Concurrency-Forge — optimistic-lock race harness |
| AC-16 | Requires ability to expire the MFA freshness window on demand without re-authenticating from scratch                                                                 | D-MFA-StepUp — MFA freshness override endpoint     |

---

## AC Scope Filter

| AC    | Description                                                                                                            | Classification     | Rationale                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| AC-01 | Power User (Bank Admin) opens Active or Suspended FA and clicks Edit; modal pre-filled                                 | `happy-path`       | Modal open + pre-fill — core success flow                                                                      |
| AC-02 | Editable fields list: Max Volume EUR, pricing, LG Override, Valid Until, Allowed Templates, Special Conditions         | `happy-path`       | Single successful edit with justification (bundled into AC-01 + AC-05)                                         |
| AC-03 | Immutable fields rejected with HTTP 400 referencing the immutable field                                                | `main-error`       | Server-side guard against modifying Agreement ID / Name / LC / Bank Entity / Tenant ID / Currency / Valid From |
| AC-04 | Justification textarea required with ≥30 characters                                                                    | `main-error`       | Client + server validation                                                                                     |
| AC-05 | Multi-field submission is atomic; one justification + one FA_EDITED audit event with structured diff                   | `happy-path`       | Atomic transaction — bundled into AC-01 happy path with multi-field payload                                    |
| AC-06 | Diff preview rendered before submission                                                                                | `happy-path`       | UX before-submit review — happy path assertion                                                                 |
| AC-07 | Edit on Draft FA returns HTTP 409 (Draft uses US 11.01 path)                                                           | `main-error`       | State-gate: PATCH endpoint rejects Draft                                                                       |
| AC-08 | Edit on Terminated FA returns HTTP 409 (immutable terminal state)                                                      | `main-error`       | State-gate: PATCH endpoint rejects Terminated                                                                  |
| AC-09 | Concurrent edit via `expectedVersion` — second submission returns 409 with current state                               | `Blocked`          | D-Concurrency-Forge — no way to force interleaved concurrent PATCH deterministically                           |
| AC-10 | Valid Until shortening rejected; extension accepted                                                                    | `main-error`       | Business-rule guard — shortening path forces Suspension/Termination instead                                    |
| AC-11 | Template removal blocked with conflict list if in-flight Financing draft references it                                 | `main-error`       | Cross-epic dependency check with structured conflict payload                                                   |
| AC-12 | Max Volume reduction below current Net Exposure accepted with warning; Limit Breach Flag set true; audit event emitted | `main-error`       | Governed override — accepts but flags (warning path, not reject)                                               |
| AC-13 | Existing Financings NOT retroactively updated (audit anchor Option B preserved)                                        | `happy-path`       | Immutability of historical Financing pricing — anchored assertion after pricing change                         |
| AC-14 | No-op submissions rejected (at least one field must change)                                                            | `main-error`       | Client + server guard                                                                                          |
| AC-15 | PATCH requires Power User (Bank Admin) role — other roles get HTTP 404                                                 | `main-error`       | Role-based access domain rule — 404-not-403                                                                    |
| AC-16 | MFA-validated session required for PATCH                                                                               | `Blocked`          | D-MFA-StepUp — no way to expire MFA freshness on demand in E2E                                                 |
| AC-17 | LC user cross-LC PATCH returns HTTP 404 (tenant isolation)                                                             | `main-error`       | Bundled into AC-15 role Outline as an additional row (LC user is a role gate + tenant gate concurrently)       |
| AC-18 | fa.edited event emitted to Limit Mgmt, Validation/Gating, Notification Center                                          | `separate-feature` | Event-bus fan-out assertion belongs to Epic 26 audit + notification integration tests                          |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-17
**Blocked (no Gherkin):** AC-09, AC-16
**No Gherkin (edge-case or separate-feature):** AC-18 (Epic 26), AC-02/AC-05 (bundled into AC-01)

---

## Scenarios summary

| Tag           | Scenario                                                                             | AC                  | Priority | E2E                             |
| ------------- | ------------------------------------------------------------------------------------ | ------------------- | -------- | ------------------------------- |
| `@happy-path` | Power User (Bank Admin) completes edit wizard (Details → Review → Save) atomically   | AC-01, AC-02, AC-05 | P0       | ⚙️ needs D-MFA-StepUp           |
| `@happy-path` | Review step shows only changed fields before submission                              | AC-06               | P0       | ✅                              |
| `@happy-path` | Existing Financings retain audit-anchored Effective Rate after FA pricing edit       | AC-13               | P0       | ✅                              |
| `@main-error` | Editing an immutable field (e.g., Currency) returns 400 with field reference         | AC-03               | P0       | ✅                              |
| `@main-error` | Submission with justification < 30 characters is rejected                            | AC-04               | P0       | ✅                              |
| `@main-error` | Edit on Draft FA returns 409                                                         | AC-07               | P0       | ✅                              |
| `@main-error` | Edit on Terminated FA returns 409                                                    | AC-08               | P0       | ✅                              |
| `@main-error` | Shortening Valid Until (past current) is rejected                                    | AC-10               | P0       | ✅                              |
| `@main-error` | Template removal with in-flight Financing draft returns 409 with conflict list       | AC-11               | P0       | ⚙️ needs seeded in-flight draft |
| `@main-error` | Max Volume below Net Exposure accepted with warning and audit event                  | AC-12               | P0       | ✅                              |
| `@main-error` | No-op submission (no fields changed) is rejected                                     | AC-14               | P0       | ✅                              |
| `@main-error` | Non-Power-User (Bank Admin) role PATCH returns 404 (Outline — 5 roles + LC cross-LC) | AC-15, AC-17        | P0       | ⚙️ needs D20                    |

Active scenario blocks: 12 (1 Outline + 11 Scenarios)
E2E automation candidates: 9 of 12 scenarios ✅

---

## Design specification (source of truth)

Framework Agreement Edit as built in Figma frame `100:6629` and detail zoom `detail__EDIT-AGREEMENT-allowed-product-templates-dropdown`. Scenarios below anchor to this specification. Where the AC Scope Filter table (below) shows AC text from Jira that does not match this design, the design takes precedence for test assertions.

**Interaction model:** full-page wizard at route `/framework-agreements/{agreementName}/edit` (from top-right `Edit` button on the FA Detail page).

**Pre-CR baseline** (exported PNG frame `100:6629`, still current in Dev-in-progress build as of 2026-07-24): two-step wizard — `Details` → `Review`.

**Post-CR PRD1042-1495 B4 (2026-07-20, Philipp Maute — confirmed, in-flight rework):** the edit wizard is being aligned with the 6-step Creation wizard (Identity, Envelope & pricing, Validity & templates, Conditions/docs, Special Conditions, Review & save) — matching US 11.1 step order. The existing `edit_version_counter` behaviour (bumps on save) is preserved. The two-step structure below is the pre-CR baseline; the reworked flow adds the Special Conditions step explicitly and re-groups the editable fields into the same wizard chapters as creation. Scenario assertions below remain valid at the behavioural level (LOCKED vs EDITABLE field lists, atomic PATCH, one FA_EDITED audit event, expectedVersion + counter behaviour) — verbatim step count and step titles are `pre-CR design — refresh needed`.

| Step                   | Screen title / heading                                                                                             | Content                                                                                                                                                                             | Footer buttons                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1 — `Details` (pre-CR) | `Edit agreement details` (subtitle: `Update the fields below. Immutable fields are locked and cannot be changed.`) | `LOCKED FIELDS` section + `EDITABLE FIELDS` section + `Edit justification` textarea                                                                                                 | `Cancel` (left), `Next →` (primary, right)                         |
| 2 — `Review` (pre-CR)  | `Review your changes` (subtitle: `Check the changes below before saving.`)                                         | `CHANGES` table (`Field / Current value / New value`) + `JUSTIFICATION` block quoting the entered text                                                                              | `Cancel` (far left), `← Back`, `Save changes` (primary, far right) |
| Success (unchanged)    | `Agreement updated` panel                                                                                          | Green check icon + message: `Your changes to {agreementName} have been saved and will apply to new financings created from this point forward. Existing financings are unaffected.` | `← Back to agreement details` (primary)                            |

**LOCKED FIELDS section** (all read-only, no input controls): Agreement ID, Agreement name, Leasing company, Bank entity, Tenant ID, Currency, Valid from.

**EDITABLE FIELDS section — verbatim field labels (lowercase-t/l):**

| Label                                           | Type                         | Notes                                                                                               |
| ----------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `Max volume`                                    | number input (EUR suffix)    |                                                                                                     |
| `Base rate`                                     | number input (% suffix)      |                                                                                                     |
| `Spread`                                        | number input (% suffix)      |                                                                                                     |
| `Effective rate`                                | number input (% suffix)      |                                                                                                     |
| `Rate type`                                     | dropdown                     | e.g. `Fixed`                                                                                        |
| `Rate lock period`                              | number input (months suffix) |                                                                                                     |
| `LG-specific coverage rate override (optional)` | number input (% suffix)      |                                                                                                     |
| `Allowed product templates`                     | chip list + `+ Add` button   | Helper text begins: `Removing a template is blocked if any in-flight financing draft`               |
| `Valid until`                                   | date picker                  | Helper text begins: `Extension only. The date can only be moved later, not earlier.`                |
| `Special conditions (optional)`                 | textarea                     |                                                                                                     |
| `Edit justification`                            | textarea                     | Counter `Min 30 characters` (right-aligned above); helper `Mandatory. Recorded in the audit trail.` |

**Step-1 gate:** `Next →` is disabled until (a) at least one editable field has changed AND (b) `Edit justification` reaches 30 characters.

**CHANGES table (Step 2):** three columns `Field | Current value | New value` with a `→` arrow between values. Only changed fields appear as rows; unchanged fields are omitted.

**AC-13 confirmation:** the success message verbatim states `"will apply to new financings created from this point forward. Existing financings are unaffected."` — this is the design's explicit statement of the retroactive-immunity rule.

---

## Feature file

```gherkin
@framework-agreement @us-11.10 @p0
Feature: Framework Agreement Edit — Active & Suspended (US 11.10 — PRD1042-809)
  As a Power User (Bank Admin)
  I want to edit governed fields on an Active or Suspended Framework Agreement
  So that I can adjust Max volume, pricing, Valid until, and Allowed product templates without recreating the agreement

  Background:
    Given the RefiNext platform is up and healthy
    And a Framework Agreement "FA-Active-001" (agreement name "RV-SSKM-2026-001", ID "FA-2026-00041") exists in Active state bound to Leasing Company "New Group Trade" (Bank entity "Sparkasse", Tenant ID "TNT-00042")
    And "FA-Active-001" has Max volume "€ 25.000.000,00", Base rate "4,25%", Spread "0,5%", Effective rate "4,75%", Rate type "Fixed", Rate lock period "12 months", Valid from "13 Jun 2026", Valid until "Open ended", version counter 5
    And "FA-Active-001" has Net exposure "€ 8.500.000,00" sourced from Limit Management
    And "FA-Active-001" permits Allowed product templates "Full refinancing v1", "Credit line v2", "True sale v1"
    And an Approved Financing "FIN-001" under "FA-Active-001" was approved at Effective rate "4,75%"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-05
  # Power User (Bank Admin) opens edit, changes multiple fields, reviews, saves.
  # One PATCH transaction, one FA_EDITED audit event; version counter bumps.
  # Pre-CR: two-step wizard (Details → Review) as encoded below.
  # Post-CR PRD1042-1495 B4: reworked to align with the 6-step Creation wizard
  # (Identity, Envelope & pricing, Validity & templates, Conditions, Special
  # Conditions, Review & save). Behavioural assertions (LOCKED vs EDITABLE lists,
  # atomic PATCH, single audit event, expectedVersion, version bump) remain
  # unchanged; the number and titles of visible steps will need refresh once the
  # reworked frame is exported.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-05 @p0
  Scenario: Power User (Bank Admin) edits multiple fields on Active FA atomically (AC-01, AC-02, AC-05)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Active-001" detail
    When I click the top-right "Edit" button
    Then the browser should navigate to the "Edit agreement" route
    And the breadcrumb should read "Home > Business configuration > Framework agreements > RV-SSKM-2026-001 > Edit agreement"
    And a two-step stepper should be visible reading "1 Details — Edit framework agreement" (current) and "2 Review — Confirm and submit"
    And the page heading should read "Edit agreement details" with subtitle "Update the fields below. Immutable fields are locked and cannot be changed."
    And a "LOCKED FIELDS" section should show Agreement ID "FA-2026-00041", Agreement name "RV-SSKM-2026-001", Leasing company "New Group Trade", Bank entity "Sparkasse", Tenant ID "TNT-00042", Currency "EUR", Valid from "13 Jun 2026" — all read-only
    And an "EDITABLE FIELDS" section should show pre-filled inputs: Max volume "25.000.000,00" (EUR), Base rate "4,25" (%), Spread "0,5" (%), Effective rate "4,75" (%), Rate type "Fixed", Rate lock period "12" (months)
    When I change Max volume to "30.000.000,00"
    And I change Base rate to "4,5"
    And I change Effective rate to "5"
    And I enter Edit justification "Approved uplift per Q3 credit committee 2026-07-15 minutes."
    And I click "Next →"
    Then the page heading should read "Review your changes" with subtitle "Check the changes below before saving."
    And the "CHANGES" section should show a table with columns "Field", "Current value", "New value" containing exactly:
      | Field           | Current value    | New value        |
      | Max volume      | € 25.000.000,00  | € 30.000.000,00  |
      | Base rate       | 4,25%            | 4,5%             |
      | Effective rate  | 4,75%            | 5%               |
    And the "JUSTIFICATION" section should quote "Approved uplift per Q3 credit committee 2026-07-15 minutes."
    When I click "Save changes"
    Then the PATCH request to "/api/framework-agreements/FA-Active-001" should include expectedVersion 5 and the 3 changed fields under one justification
    And the response status should be 200
    And a single FA_EDITED audit event should be emitted with structured diff containing all 3 field changes and the justification
    And a success panel should show a green check, heading "Agreement updated", body "Your changes to RV-SSKM-2026-001 have been saved and will apply to new financings created from this point forward. Existing financings are unaffected.", and a "← Back to agreement details" button
    And the FA version counter should have advanced from 5 to 6

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # The Review step (Step 2 of the wizard) renders the CHANGES table.
  # It lists only changed fields; unchanged fields are omitted.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0 @e2e-ready
  Scenario: Review step shows only changed fields before submission (AC-06)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    When I change Max volume to "30.000.000,00"
    And I change Base rate to "4,5"
    And I enter Edit justification "Approved uplift per credit committee 2026-07-15."
    And I click "Next →"
    Then the "CHANGES" table should list exactly:
      | Field           | Current value    | New value        |
      | Max volume      | € 25.000.000,00  | € 30.000.000,00  |
      | Base rate       | 4,25%            | 4,5%             |
    And no other field row should appear in the CHANGES table
    And a "← Back" button should be present alongside "Save changes" so the user can return to Details

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-13
  # Existing Financings retain their audit-anchored Effective rate.
  # The design's success message explicitly confirms this rule verbatim.
  # ---------------------------------------------------------------------------

  @happy-path @ac-13 @p0 @e2e-ready
  Scenario: Existing Financings retain audit-anchored Effective rate after FA pricing edit (AC-13)
    Given "FIN-001" was approved at Effective rate "4,75%" under "FA-Active-001"
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    When I change Effective rate to "5"
    And I enter Edit justification "Approved uplift per credit committee 2026-07-15."
    And I click "Next →" and then "Save changes"
    Then the response status should be 200
    And the success panel body should read verbatim "Your changes to RV-SSKM-2026-001 have been saved and will apply to new financings created from this point forward. Existing financings are unaffected."
    When I click "← Back to agreement details" and navigate to "FIN-001" detail
    Then the Effective rate applied on "FIN-001" should still be "4,75%"
    And the FA reference on "FIN-001" should still point to "FA-Active-001"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Immutable fields are visible in the "LOCKED FIELDS" section of Step 1
  # (design) but not editable via UI. Direct API attempts return HTTP 400.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario: Editing an immutable field (Currency) returns 400 with field reference (AC-03)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    Then within the "LOCKED FIELDS" section, the Currency value "EUR" should be visually locked (no input control present)
    When I attempt to PATCH "/api/framework-agreements/FA-Active-001" with body {"justification": "Attempt to change currency for reasons.", "changes": {"currency": "USD"}, "expectedVersion": 5}
    Then the HTTP response status should be 400
    And the response body should reference the immutable field name "currency"
    And on the FA "Agreement details" tab, Currency should still display "EUR"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Justification must be ≥ 30 characters. The design shows "Min 30 characters"
  # counter alongside the textarea and "Mandatory. Recorded in the audit trail."
  # as the helper text. "Next →" should be disabled until threshold is met.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario: Justification below 30 characters blocks "Next →" and server also rejects (AC-04)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    Then a counter reading "Min 30 characters" should be visible above/beside the "Edit justification" textarea
    And helper text "Mandatory. Recorded in the audit trail." should be visible below the textarea
    When I change Max volume to "30.000.000,00"
    And I enter Edit justification "Uplift" (6 characters)
    Then the "Next →" button should be disabled
    When I bypass the client and attempt to PATCH "/api/framework-agreements/FA-Active-001" with body {"justification": "Uplift", "changes": {"max_volume_eur": 30000000.00}, "expectedVersion": 5}
    Then the HTTP response status should be 400
    And the response body should reference the justification-length rule ("min 30 characters" or equivalent)
    And the FA should remain at Max volume "€ 25.000.000,00" and version counter 5

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Edit on Draft FA uses US 11.01 mechanics; PATCH endpoint here returns 409.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready
  Scenario: Edit on Draft FA returns 409 (AC-07)
    Given a Framework Agreement "FA-Draft-001" exists in Draft state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I attempt to PATCH "/api/framework-agreements/FA-Draft-001" with a valid governed-edit body
    Then the HTTP response status should be 409
    And the response body should reference the incorrect lifecycle state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Terminated FAs are immutable — PATCH returns 409.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0 @e2e-ready
  Scenario: Edit on Terminated FA returns 409 (AC-08)
    Given a Framework Agreement "FA-Terminated-001" exists in Terminated state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I attempt to PATCH "/api/framework-agreements/FA-Terminated-001" with a valid governed-edit body
    Then the HTTP response status should be 409
    And the response body should indicate the FA is immutable due to Terminated state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Valid until: extension only. The design's helper text on the "Valid until"
  # field states verbatim "Extension only. The date can only be moved later,
  # not earlier." — client and server both enforce.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0 @e2e-ready
  Scenario: Shortening Valid until is rejected (AC-10)
    Given "FA-Active-001" has Valid until "31 Dec 2027"
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    Then helper text on the "Valid until" field should begin with "Extension only. The date can only be moved later, not earlier."
    When I attempt to PATCH "/api/framework-agreements/FA-Active-001" with body {"justification": "Shortening validity for compliance review.", "changes": {"valid_until": "2026-12-31"}, "expectedVersion": 5}
    Then the HTTP response status should be 400
    And the response body should explicitly reference "extension only" or "shortening not permitted"
    And on the FA "Agreement details" tab, Valid until should still display "31 Dec 2027"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Allowed product template removal blocked if any in-flight Financing draft
  # references the template. Design helper text on the field starts with
  # "Removing a template is blocked if any in-flight financing draft…".
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Template removal with in-flight Financing draft returns 409 with conflict list (AC-11)
    Given a Financing "FIN-Draft-001" is in Draft state under "FA-Active-001" referencing template "Full refinancing v1"
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    Then within the "Allowed product templates" field, chips should be visible for "Full refinancing v1", "Credit line v2", "True sale v1", each with an "×" remove affordance and a "+ Add" button at the end
    And helper text on the field should begin with "Removing a template is blocked if any in-flight financing draft"
    When I attempt to PATCH "/api/framework-agreements/FA-Active-001" with body {"justification": "Removing template Full refinancing v1 per governance decision.", "changes": {"allowed_product_templates": ["Credit line v2", "True sale v1"]}, "expectedVersion": 5}
    Then the HTTP response status should be 409
    And the response body should include a conflict list containing "FIN-Draft-001"
    And on the FA "Agreement details" tab, Allowed product templates should still list "Full refinancing v1", "Credit line v2", "True sale v1"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # Governed override: Max volume below current Net exposure accepted with warning,
  # Limit breach set to "In breach", audit event fa.max-volume.reduced-below-exposure
  # emitted. Warning banner copy is design-blind — LIMIT BREACH frame not exported.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0 @e2e-ready
  Scenario: Max volume below Net exposure accepted with warning and audit event (AC-12)
    Given "FA-Active-001" has Net exposure "€ 8.500.000,00" sourced from Limit Management
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    When I change Max volume to "7.000.000,00"
    And I enter Edit justification "Governed reduction below current exposure per credit committee override."
    Then a warning banner should appear indicating that Max volume is below current Net exposure
    When I click "Next →" and then "Save changes"
    Then the response status should be 200
    And the FA "Utilization" tab should now show Limit breach badge = "In breach"
    And an audit event "fa.max-volume.reduced-below-exposure" should be emitted with oldMaxVolume 25000000.00, newMaxVolume 7000000.00, currentNetExposure 8500000.00

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # At least one field must be changed. No-op submissions are rejected.
  # Client-side: "Next →" should be disabled if no editable field has been changed.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0 @e2e-ready
  Scenario: No-op submission is rejected (AC-14)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have navigated to "Edit agreement details" for "FA-Active-001"
    When I enter Edit justification "Placeholder justification for no-op submission." without changing any editable field
    Then the "Next →" button should be disabled OR clicking it should surface a "no changes to submit" inline error
    When I bypass the client and attempt to PATCH "/api/framework-agreements/FA-Active-001" with body {"justification": "Placeholder justification for no-op submission.", "changes": {}, "expectedVersion": 5}
    Then the HTTP response status should be 400
    And the response body should indicate that at least one field must be changed
    And the FA version counter should remain at 5

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15, AC-17
  # Role-based access (RefiNext domain rule): only Power User (Bank Admin) may PATCH.
  # Other roles get HTTP 404 (not 403). LC user cross-LC is also 404 (tenant isolation).
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @ac-17 @p0
  Scenario Outline: Non-Power-User (Bank Admin) role PATCH returns 404 (AC-15, AC-17)
    Given <precondition>
    And I am logged in as <role> <scope>
    When I attempt to PATCH "<target_fa>" with a valid governed-edit body
    Then the HTTP response status should be 404
    And the response body should NOT include the string "403" or "Forbidden"

    Examples:
      | role         | scope                        | target_fa                                              | precondition                                                                     |
      | Front Office |                              | /api/framework-agreements/FA-Active-001                | (no additional precondition)                                                     |
      | Back Office  |                              | /api/framework-agreements/FA-Active-001                | (no additional precondition)                                                     |
      | LC User      | bound to "New Group Trade"   | /api/framework-agreements/FA-Active-001                | (no additional precondition)                                                     |
      | Support      |                              | /api/framework-agreements/FA-Active-001                | (no additional precondition)                                                     |
      | Auditor      |                              | /api/framework-agreements/FA-Active-001                | (no additional precondition)                                                     |
      | LC User      | bound to "New Group Trade"   | /api/framework-agreements/FA-Beta-001                  | a Framework Agreement "FA-Beta-001" exists bound to "Beta Leasing GmbH"          |
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
