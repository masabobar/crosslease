# PRD1042-596 — US 29.15 | TENANT MANAGEMENT | Tenant Edit (Non-Lifecycle Fields)

Generated: 2026-07-06
Story: PRD1042-596 — US 29.15 | TENANT MANAGEMENT | Tenant Edit (Non-Lifecycle Fields)
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (14 ACs, description present, stakeholder-reviewed, Jira status "QA in progress")
ACs with Gherkin scenarios: 8 of 14 | Blocked: 1 (PRD1042-1103 open product question) | Excluded: 5 (edge-case or separate-feature — scope filter table only)
Figma design: Node 52:1806, file 7pygkopuqyeEhUTMVp9lrP — Screen "Tenant details page + edit" (Stage 2 PARTIAL — canvas sections ADMIN/SUPPORT/AUDITOR read-only views + EDIT - Tenant identity + EDIT - Licence limits all confirmed; read-only field inventory confirmed; deep field-level data, error states, governance justification dialog copy not extractable due to Figma MCP rate limit; design-verified re-run, supersedes design-blind v1)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                        | Blocking dependency                                   |
| ----- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| AC-15 | Draft tenant editability is an open product question — no decision exists; no AC text defined | PRD1042-1103 — Draft (and Expired?) tenant edit scope |

---

## AC Scope Filter

| AC    | Description                                                                                                                                    | Classification     | Rationale                                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Editable fields (Tenant Name, Legal Entity Name, Tenant Description, Legal Hold Flag) updatable by System Admin on Active or Suspended tenants | `happy-path`       | Core success flow — Scenario Outline covers Legal Entity Name edits across Active, Suspended, and Rejected states (AC-14 merged as variant row)    |
| AC-02 | Governance Justification mandatory (min 20 chars) only when Tenant Name is changed — confirmed by PRD1042-1096                                 | `happy-path`       | Positive path (name change with justification succeeds) is a critical product rule; pairs with a main-error negative for the no-justification case |
| AC-03 | Immutable fields (Tenant ID, Tenant Code, Tenant Type, timestamps, governance actor fields) are read-only with lock icon, no edit affordance   | `main-error`       | ADMIN view design confirms read-only rendering for Code, Type, Country, Provisioned fields; UI-level assertion is @e2e-ready                       |
| AC-04 | Tenant Code modification via API returns 422 Immutable field error                                                                             | `main-error`       | Backend must reject immutable-field mutations regardless of source; direct API test                                                                |
| AC-05 | Tenant Name uniqueness validated across all states including Archived — PRD1042-1095 requests descriptive error message                        | `main-error`       | Duplicate name blocks the save action; Scenario Outline covers three existing-tenant states                                                        |
| AC-06 | Edit not permitted on Archived tenants — returns 422                                                                                           | `main-error`       | Terminal lifecycle state blocks the core edit workflow                                                                                             |
| AC-07 | Edit endpoint returns HTTP 404 to non-System Admin roles                                                                                       | `main-error`       | RefiNext 404-not-403 domain rule auto-applied; Scenario Outline covers 5 non-admin roles                                                           |
| AC-08 | Legal Hold Flag warning shown on set with specific copy                                                                                        | `edge-case`        | Copy-only assertion; warning dialog copy unverified against Figma (Stage 3 MAJOR gap); belongs in design QA and component test, not E2E            |
| AC-09 | Legal Hold set/clear each produce a separate TENANT_MODIFIED audit event                                                                       | `separate-feature` | Backend audit behavior; verified by BE unit tests and audit log spec, not E2E UI                                                                   |
| AC-10 | TENANT_MODIFIED audit event schema (tenant ID, actor, changed fields old/new, justification, timestamp UTC)                                    | `separate-feature` | Backend contract — out of E2E UI scope; covered by BE story PRD1042-692                                                                            |
| AC-11 | Field length validation: Tenant Name max 200, Legal Entity Name max 300, Tenant Description max 1000                                           | `edge-case`        | Boundary validation — component/unit test scope; character counter design state not confirmed                                                      |
| AC-12 | Governance Justification min 20 chars validation                                                                                               | `edge-case`        | Boundary validation — component test scope; min-length error state not confirmed in design                                                         |
| AC-13 | Legal Hold cleared while retention schedule triggered → retention re-evaluates from cleared state                                              | `separate-feature` | Retention pipeline behavior — covered by retention policy spec, not tenant edit E2E                                                                |
| AC-14 | Rejected tenant is editable — confirmed by PRD1042-1097 (Done)                                                                                 | `happy-path`       | Folded into AC-01 Outline as a Rejected-state Examples row; not a separate scenario block                                                          |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-14
**Blocked (no Gherkin):** AC-15
**No Gherkin (edge-case or separate-feature):** AC-08, AC-09, AC-10, AC-11, AC-12, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                                     | AC           | Priority | E2E                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------ | ------------ | -------- | --------------------------------------- |
| `@happy-path` | System Admin edits Legal Entity Name on Active/Suspended/Rejected tenant (Scenario Outline — 3 variants)     | AC-01, AC-14 | P0       | ✅                                      |
| `@happy-path` | System Admin changes Tenant Name with governance justification on Active tenant                              | AC-01, AC-02 | P0       | ✅                                      |
| `@main-error` | Tenant Name change without governance justification is rejected                                              | AC-02        | P0       | ✅                                      |
| `@main-error` | Immutable fields have no edit affordance in the UI                                                           | AC-03        | P0       | ✅                                      |
| `@main-error` | Tenant Code modification via API returns 422 Immutable field error                                           | AC-04        | P0       | ✅                                      |
| `@main-error` | Duplicate Tenant Name across all lifecycle states returns 422 (Scenario Outline — 3 existing-state variants) | AC-05        | P0       | ⚙️ needs seeded Archived tenant fixture |
| `@main-error` | Edit attempt on Archived tenant returns 422                                                                  | AC-06        | P0       | ⚙️ needs seeded Archived tenant fixture |
| `@main-error` | Non-System Admin roles receive 404 on tenant edit endpoint (Scenario Outline — 5 role variants)              | AC-07        | P0       | ✅                                      |

Active scenario blocks: 8 (3 Outlines + 5 Scenarios)
E2E automation candidates: 6 of 8 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.15 @p0
Feature: Tenant Edit — Non-Lifecycle Fields (US 29.15 — PRD1042-596)
  As a System Admin
  I want to edit permitted non-lifecycle fields on an Active, Suspended, or Rejected tenant
  So that I can maintain accurate administrative data without triggering a lifecycle transition

  Background:
    Given I am logged in as a System Admin
    And the tenant edit endpoint is at "PATCH /api/tenants/{id}"
    And the tenant detail UI is accessible at "/admin/tenants/{id}"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-14
  # System Admin can update non-name editable fields on Active, Suspended, and
  # Rejected tenants. Rejected editability is confirmed by PRD1042-1097 (Done).
  # Non-name field updates must NOT require governance justification per
  # PRD1042-1096 (Done) — justification is mandatory only on Tenant Name change.
  # Design confirms EDIT - Tenant identity section present as distinct canvas frame.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-14 @p0 @e2e-ready
  Scenario Outline: System Admin edits Legal Entity Name on <lifecycle_state> tenant without justification (AC-01, AC-14)
    Given a tenant "TEN-EDIT-001" exists with lifecycle state "<lifecycle_state>"
    And its Legal Entity Name is "Original Entity GmbH"
    When I navigate to the tenant detail page for "TEN-EDIT-001"
    And I open the tenant identity edit form
    And I update the Legal Entity Name to "Updated Entity GmbH"
    And I do NOT enter a governance justification
    And I submit the edit form
    Then the response status should be 200
    And the tenant's Legal Entity Name should display "Updated Entity GmbH"
    And a TENANT_MODIFIED audit event should be logged for tenant "TEN-EDIT-001"

    Examples:
      | lifecycle_state |
      | Active          |
      | Suspended       |
      | Rejected        |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # Tenant Name is the only field requiring governance justification (min 20 chars).
  # PRD1042-1096 (Done) confirms this scoping. Positive path: name change WITH
  # valid justification must succeed and record the justification in the audit event.
  # Design: EDIT - Tenant identity section confirmed; justification field/dialog
  # present but conditional rendering mechanics not confirmed at field level.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0 @e2e-ready
  Scenario: System Admin changes Tenant Name with governance justification on Active tenant (AC-01, AC-02)
    Given a tenant "TEN-EDIT-002" exists with lifecycle state "Active"
    And its Tenant Name is "Original Tenant Name"
    When I navigate to the tenant detail page for "TEN-EDIT-002"
    And I open the tenant identity edit form
    And I update the Tenant Name to "Renamed Tenant Ltd"
    And I enter governance justification "Corporate merger completed on 2026-06-30; legal name change effective immediately"
    And I submit the edit form
    Then the response status should be 200
    And the tenant's Tenant Name should display "Renamed Tenant Ltd"
    And a TENANT_MODIFIED audit event should include the governance justification text

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Governance justification is mandatory ONLY when Tenant Name is changed.
  # Submitting a Tenant Name change without a justification must be blocked
  # at validation — the save must not proceed and the name must remain unchanged.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Tenant Name change without governance justification is rejected (AC-02)
    Given a tenant "TEN-EDIT-003" exists with lifecycle state "Active"
    And its Tenant Name is "Unchanged Tenant Name"
    When I navigate to the tenant detail page for "TEN-EDIT-003"
    And I open the tenant identity edit form
    And I update the Tenant Name to "Attempted New Name"
    And I do NOT enter a governance justification
    And I submit the edit form
    Then I should see a validation error indicating governance justification is required
    And the tenant's Tenant Name should still display "Unchanged Tenant Name"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Immutable fields (Tenant Code, Tenant ID, Tenant Type, Provisioned date) must
  # be rendered as non-interactive read-only controls with no edit affordance.
  # Design confirms: Code "CL-DE001", Type "Bank entity", Country "Germany",
  # Provisioned "12 Aug 2025, 14:38" all shown as read-only in ADMIN view.
  # Lock icon presence is a design assertion confirmed at structural level.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario: Immutable fields have no edit affordance in the tenant identity UI (AC-03)
    Given a tenant "TEN-EDIT-004" exists with lifecycle state "Active"
    When I navigate to the tenant detail page for "TEN-EDIT-004"
    Then the "Tenant Code" field should be read-only
    And the "Tenant Code" field should not be focusable as an input
    And the "Tenant Type" field should be read-only
    And the "Country" field should be read-only
    And the "Provisioned" date field should be read-only
    And no edit control should be present for any immutable field

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Backend must reject any PATCH payload that includes immutable fields,
  # regardless of how the request is constructed. This verifies that the
  # read-only UI enforcement is backed by server-side validation.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario: Tenant Code modification via API returns 422 Immutable field error (AC-04)
    Given a tenant "TEN-EDIT-005" exists with lifecycle state "Active"
    And its Tenant Code is "TC-005"
    When I send a PATCH request to "/api/tenants/TEN-EDIT-005" with body {"tenant_code": "TC-HIJACKED"}
    Then the response status should be 422
    And the response error code should indicate an immutable field violation
    And a GET to "/api/tenants/TEN-EDIT-005" should return Tenant Code "TC-005"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Tenant Name must be unique across ALL tenant states, including Archived.
  # Bug PRD1042-1095 (Ready for Staging) requests a descriptive error:
  # "A record with this name already exists. Please choose a different name."
  # Test asserts a distinguishable error (not a generic 500) containing
  # a meaningful conflict message.
  # NOTE: Requires seeded tenants in Archived state — ⚙️ for Archived variant.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Duplicate Tenant Name across any lifecycle state returns 422 (AC-05)
    Given a tenant "TEN-EXISTING" exists with Tenant Name "Existing Tenant AG" and lifecycle state "<existing_state>"
    And a separate tenant "TEN-EDIT-006" exists with lifecycle state "Active"
    When I navigate to the tenant detail page for "TEN-EDIT-006"
    And I open the tenant identity edit form
    And I update the Tenant Name to "Existing Tenant AG"
    And I enter governance justification "Attempting rename to align with parent brand structure"
    And I submit the edit form
    Then the response status should be 422
    And I should see an error message indicating the name is already in use
    And the tenant "TEN-EDIT-006" Tenant Name should remain unchanged

    Examples:
      | existing_state |
      | Active         |
      | Suspended      |
      | Archived       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Archived is a terminal lifecycle state. Edits are permanently blocked to
  # preserve data integrity for regulatory retention. Attempting to PATCH an
  # Archived tenant must return 422 regardless of which fields are included.
  # NOTE: Requires seeded Archived tenant — ⚙️ needs Archived tenant fixture.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Edit attempt on Archived tenant returns 422 (AC-06)
    Given a tenant "TEN-EDIT-007" exists with lifecycle state "Archived"
    When I send a PATCH request to "/api/tenants/TEN-EDIT-007" with body {"legal_entity_name": "Attempted Update"}
    Then the response status should be 422
    And the response error message should indicate that Archived tenants cannot be edited
    And a GET to "/api/tenants/TEN-EDIT-007" should return the original Legal Entity Name unchanged

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # RefiNext domain rule: privilege-gated resources return 404 (not 403) to
  # prevent tenant enumeration by unprivileged roles. All non-System Admin roles
  # must receive 404 on the tenant edit endpoint regardless of tenant existence.
  # Design confirms SUPPORT and AUDITOR read-only views as distinct role frames.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready @rbac
  Scenario Outline: Non-System Admin role receives 404 on tenant edit endpoint (AC-07)
    Given a tenant "TEN-EDIT-008" exists with lifecycle state "Active"
    And I am logged in as a <role>
    When I send a PATCH request to "/api/tenants/TEN-EDIT-008" with body {"legal_entity_name": "Unauthorized Update"}
    Then the response status should be 404
    And the response status should NOT be 403
    And a GET to "/api/tenants/TEN-EDIT-008" should return the original Legal Entity Name unchanged

    Examples:
      | role         |
      | Front Office |
      | Back Office  |
      | LC User      |
      | Support User |
      | Auditor      |
```
