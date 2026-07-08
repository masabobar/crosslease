# PRD1042-587 — US 29.6 | TENANT MANAGEMENT | Module Deactivation per Tenant

Generated: 2026-07-07
Story: PRD1042-587 — US 29.6 | TENANT MANAGEMENT | Module Deactivation per Tenant
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (16 ACs, description present, stakeholder-reviewed, QA in progress)
ACs with Gherkin scenarios: 9 of 16 | Blocked: 4 (AC-03/04 governance drift + AC-12/14 D-Enforcement) | Excluded: 3 (AC-05/13/15 edge-case or separate-feature — scope filter table only)
Figma design: Nodes 93:20741 (MODULE DEACTIVATION) + 93:20742 (DEPENDENCY CONFLICTS), file 7pygkopuqyeEhUTMVp9lrP — Canvas "Module Activation/Deactivation" (Stage 2 SUCCESS — design-verified re-run, supersedes design-blind v1)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                                                                                                                         | Blocking dependency                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| AC-03 | Governance drift: story says "no countersignature" but Ivan Mladenovic (2026-06-03) mandated Four-Eyes symmetric with US 29.5 activation. Vesna Plakalovic "confirmed update" 2026-06-05 but AC wording was never rewritten. No Gherkin until PO updates AC text and PRD1042-77 is wired.                      | Governance ambiguity + PRD1042-77 (Four-Eyes Approval Validation) |
| AC-04 | Governance drift: story says "immediately to Inactive, no intermediate state" but Four-Eyes decision implies a Pending Deactivation state. Blocked same as AC-03. Design confirms fail-open UX (no pending indicator on success) — validates Vesna 2026-06-05 rule but conflicts with Four-Eyes decision text. | Governance ambiguity + PRD1042-77 (Four-Eyes Approval Validation) |
| AC-12 | `module-profile-changed` event published to authorization enforcement layer — not observable at E2E layer without enforcement layer test seam.                                                                                                                                                                 | D-Enforcement — authorization enforcement layer event integration |
| AC-14 | Async enforcement removal with retry — background process not observable at UI layer; requires enforcement layer test hook to verify retry behaviour. Design-verified: success card shows no sync-pending indicator, confirming fail-open UX contract.                                                         | D-Enforcement — authorization enforcement layer async retry seam  |

---

## AC Scope Filter

| AC    | Description                                                                    | Classification     | Rationale                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System Admin may deactivate Active module after dependency check passes        | `happy-path`       | Core success flow — primary action of this story; design-verified modal title "Deactivate module" and success copy "Deactivation confirmed" |
| AC-02 | Deactivation blocked if active workflows depend on module; conflict list shown | `main-error`       | Directly blocks deactivation; design-verified "Dependency check result" panel present in 93:20742                                           |
| AC-03 | [DRIFT] No countersignature — overridden by Four-Eyes decision 2026-06-03      | `Blocked`          | AC wording contradicts PO governance decision; awaits rewrite + PRD1042-77 wiring                                                           |
| AC-04 | [DRIFT] Immediately Inactive — overridden by Four-Eyes pending state           | `Blocked`          | Same governance drift as AC-03; no Gherkin until resolved                                                                                   |
| AC-05 | Module Activation Records append-only; deactivation creates new record         | `separate-feature` | BE data-integrity assertion; belongs in BE integration suite, not E2E                                                                       |
| AC-06 | Module field (Enum, Mandatory, read-only in modal)                             | `happy-path`       | Design-verified: "Module name" label with read-only value "Reporting & dashboards"                                                          |
| AC-07 | Justification (Long text, Mandatory, min 20 chars)                             | `happy-path`       | Design gap: Justification field NOT visible in extracted modal frames (MAJOR gap); API-level test still valid                               |
| AC-08 | Dependency check result displayed; Confirm disabled if conflicts exist         | `happy-path`       | Design-verified: "Dependency check result" label present with helper "Required for Auditor users only"                                      |
| AC-09 | Module must be Active before deactivation can be submitted                     | `main-error`       | State guard — blocks entire deactivation flow if module not Active                                                                          |
| AC-10 | Dependency check must return no conflicts before deactivation proceeds         | `main-error`       | Merged with AC-02/AC-11 conflict scenario; same observable outcome                                                                          |
| AC-11 | Dependency check runs before deactivation; conflicts block; Confirm disabled   | `main-error`       | Merged with AC-02/AC-10; design-verified DEPENDENCY CONFLICTS section (93:20742)                                                            |
| AC-12 | Module → Inactive on submission; `module-profile-changed` event published      | `Blocked`          | D-Enforcement: enforcement layer event not observable at E2E layer                                                                          |
| AC-13 | Re-check at confirmation time catches race-condition new conflicts             | `edge-case`        | Not deterministically triggerable without a test hook to inject conflict mid-flow                                                           |
| AC-14 | Enforcement removal async with retry; module stays Inactive if removal fails   | `Blocked`          | D-Enforcement: async retry behaviour not observable at UI layer                                                                             |
| AC-15 | Audit events: MODULE_DEACTIVATION_REQUESTED, MODULE_DEACTIVATED                | `separate-feature` | Audit event assertions belong in BE/audit integration suite (PRD1042-37)                                                                    |
| AC-16 | Non-System Admin roles receive HTTP 404                                        | `main-error`       | RBAC 404-not-403 rule; Outline covering 4 non-admin role variants; @e2e-ready                                                               |

**Gherkin generated for:** AC-01, AC-02, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-16
**Blocked (no Gherkin):** AC-03, AC-04, AC-12, AC-14
**No Gherkin (edge-case or separate-feature):** AC-05, AC-13, AC-15

---

## Scenarios summary

| Tag           | Scenario                                                                       | AC                         | Priority | E2E                                                                                           |
| ------------- | ------------------------------------------------------------------------------ | -------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `@happy-path` | System Admin deactivates Active module with no conflicts (Outline — 1 variant) | AC-01, AC-06, AC-07, AC-08 | P0       | ⚙️ needs module in Active state + no active dependent workflows                               |
| `@main-error` | Justification below minimum length blocks submission (AC-07)                   | AC-07                      | P0       | ⚙️ needs module in Active state precondition + Justification field visible in UI (design gap) |
| `@main-error` | Active workflow dependency blocks deactivation and disables Confirm (AC-02)    | AC-02, AC-10, AC-11        | P0       | ⚙️ needs module with active dependent workflow seeded                                         |
| `@main-error` | Deactivation of non-Active module is rejected (AC-09)                          | AC-09                      | P0       | ⚙️ needs module in non-Active state seeded                                                    |
| `@main-error` | Non-System Admin roles receive 404 on deactivation API (Outline — 4 variants)  | AC-16                      | P0       | ✅                                                                                            |

Active scenario blocks: 5 (2 Outlines + 3 Scenarios)
E2E automation candidates: 1 of 5 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.6 @p0
Feature: Module Deactivation per Tenant (US 29.6 — PRD1042-587)
  As a System Admin
  I want to deactivate an Active module for a tenant
  So that the module's functionality is immediately removed from the tenant scope
  without affecting other tenants

  Background:
    Given I am authenticated as a System Admin
    And tenant "TENANT-001" exists in the system with at least one Active module

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-06, AC-07, AC-08
  # System Admin opens the deactivation modal for an Active module with no
  # dependent workflows. Design-verified copy (node 93:20741):
  #   - Modal card title: "Deactivate module"
  #   - Module name field: read-only, populated (design example "Reporting & dashboards")
  #   - Current status field: displays current state badge
  #   - Dependency check result: labeled field with helper "Required for Auditor users only"
  #   - Cancel button: "Cancel"
  #   - Submit button: "Submit for deactivation"
  # On submit, success card shows "Deactivation confirmed" / "Reporting is now inactive."
  # NO "View profile" link (unlike activation) — validates fail-open UX contract
  # (Vesna Plakalovic 2026-06-05): module → Inactive immediately, no sync-pending
  # indicator, enforcement cleanup runs async in background.
  # Design gap (MAJOR): Justification field (AC-07) not visible in extracted
  # modal frame — may live on separate step or be missing from design.
  # Four-Eyes governance (AC-03/AC-04) is Blocked — this scenario tests the
  # single-actor flow as currently implemented pending PO AC rewrite.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-06 @ac-07 @ac-08 @p0
  Scenario Outline: System Admin deactivates Active module with no conflicts (AC-01, AC-06, AC-07, AC-08)
    Given module "<module_name>" is in "Active" state for tenant "TENANT-001"
    And module "<module_name>" has no active dependent workflows
    When I navigate to the module management page for tenant "TENANT-001"
    And I initiate deactivation for module "<module_name>"
    Then a modal titled "Deactivate module" is displayed
    And the "Module name" field shows "<module_name>" as read-only
    And the "Current status" field is visible
    And the "Dependency check result" field shows no blocking workflows
    And the "Submit for deactivation" button is enabled
    When I enter a justification of at least 20 characters
    And I click the "Submit for deactivation" button
    Then a confirmation card titled "Deactivation confirmed" is displayed
    And the confirmation card shows the description "<module_name> is now inactive."
    And the confirmation card does not display a "View profile" link
    And module "<module_name>" transitions to "Inactive" state
    And the module management page reflects the updated "Inactive" status

    Examples:
      | module_name            |
      | Reporting & dashboards |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Justification textarea requires a minimum of 20 characters for deactivation
  # (note: LONGER than activation's 10-char minimum in PRD1042-586 — confirmed
  # asymmetry, flagged for PO verification). Submitting with empty or
  # under-threshold text must be blocked.
  # Design gap (MAJOR): Justification field NOT visible in extracted modal
  # frame (nodes 93:20741 / 93:20742 show only Module name + Current status +
  # Dependency check result). This scenario validates AC-07 at API/logic level;
  # UI-level assertion of validation error copy is deferred until design gap
  # is closed (confirm whether Justification lives on separate step or missing).
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Justification below minimum length blocks submission (AC-07)
    Given module "Reporting & dashboards" is in "Active" state for tenant "TENANT-001"
    And module "Reporting & dashboards" has no active dependent workflows
    When I navigate to the module management page for tenant "TENANT-001"
    And I initiate deactivation for module "Reporting & dashboards"
    Then a modal titled "Deactivate module" is displayed
    When I enter a justification of fewer than 20 characters
    And I attempt to click the "Submit for deactivation" button
    Then the submission is blocked
    And a validation error is shown indicating the justification is too short
    And the module remains in "Active" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-10, AC-11
  # When active workflows within the tenant depend on the module, deactivation
  # is blocked. Design-verified (node 93:20742 DEPENDENCY CONFLICTS section):
  # the "Dependency check result" panel is present in the same modal shell
  # ("Deactivate module" title, same fields, same "Cancel" / "Submit for
  # deactivation" buttons). Difference vs clean state: Dependency check result
  # section populated with conflict information — the Submit button is
  # disabled while conflicts exist. This is a hard block, not a warning.
  # Design gap (MAJOR): specific conflict-list rendering copy (per-conflict
  # row content) was not captured in text extraction — may be dynamic content
  # or sub-component. UI-level assertion of exact conflict row copy is
  # deferred; scenario asserts the observable outcome (Submit disabled,
  # module stays Active).
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-10 @ac-11 @p0
  Scenario: Active workflow dependency blocks deactivation and disables Submit (AC-02, AC-10, AC-11)
    Given module "Reporting & dashboards" is in "Active" state for tenant "TENANT-001"
    And at least one active workflow within tenant "TENANT-001" depends on "Reporting & dashboards"
    When I navigate to the module management page for tenant "TENANT-001"
    And I initiate deactivation for module "Reporting & dashboards"
    Then a modal titled "Deactivate module" is displayed
    And the "Dependency check result" field shows a list of blocking workflows
    And the "Submit for deactivation" button is disabled
    When I attempt to click the "Submit for deactivation" button
    Then the deactivation is not submitted
    And module "Reporting & dashboards" remains in "Active" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Deactivation can only be initiated for a module in Active state. If the
  # module is Inactive or in any other non-Active state, the deactivation
  # action must be blocked. Tests the state guard at the entry point (before
  # the modal is opened). No design change needed — the deactivation entry
  # point (button/menu) simply must not be reachable for non-Active modules.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0
  Scenario: Deactivation of non-Active module is rejected (AC-09)
    Given module "Reporting & dashboards" is in "Inactive" state for tenant "TENANT-001"
    When I navigate to the module management page for tenant "TENANT-001"
    And I attempt to initiate deactivation for module "Reporting & dashboards"
    Then the deactivation action is not available or is blocked
    And module "Reporting & dashboards" remains in "Inactive" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16
  # All non-System Admin roles must receive HTTP 404 (not 403) when attempting
  # the module deactivation API. This follows the 404-not-403 tenant isolation
  # pattern established across Epic 29 — 404 prevents role enumeration.
  # Seeded role users are available in the test environment; no D-ID required.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @p0 @e2e-ready
  Scenario Outline: Non-System Admin roles receive 404 on deactivation API (AC-16)
    Given I am authenticated as a "<role>" user
    And module "Reporting & dashboards" is in "Active" state for tenant "TENANT-001"
    When I send a DELETE or PATCH request to the module deactivation endpoint for tenant "TENANT-001" and module "Reporting & dashboards"
    Then the response status code is 404
    And the response does not expose module state or tenant details

    Examples:
      | role          |
      | Front Office  |
      | Back Office   |
      | Support User  |
      | Auditor       |
```
