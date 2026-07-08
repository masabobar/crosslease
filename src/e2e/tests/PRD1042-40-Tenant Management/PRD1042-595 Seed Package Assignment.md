# PRD1042-595 — US 29.14 | TENANT MANAGEMENT | Seed Configuration Package Assignment

Generated: 2026-07-06
Story: PRD1042-595 — US 29.14 | TENANT MANAGEMENT | Seed Configuration Package Assignment
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (15 ACs derived from functional requirements, description present, stakeholder-reviewed by Iva Marković 2026-06-01, Jira status "QA in progress")
ACs with Gherkin scenarios: 9 of 15 | Blocked: 0 | Excluded: 6 (edge-case — scope filter table only)
Figma design: Node 9:6160, file 7pygkopuqyeEhUTMVp9lrP — Screen "E29 Tenant Management — Seed Package selection (Step 3)" (Stage 2 FAILED — Figma MCP rate-limited on View seat, same session tooling blocker previously seen on PRD1042-77, PRD1042-48, PRD1042-582; design signals derived from story description only; wizard step name "SEED PACKAGES" verified via prior PRD1042-582 processing on same file)

---

## AC Scope Filter

| AC    | Description                                                                                                                                | Classification | Rationale                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | Seed package assignment is part of TM-01 tenant creation wizard (Step 3); cannot be changed post-creation in V1                            | `happy-path`   | Core success flow — System Admin selects valid seed package on Step 3 and completes wizard                                     |
| AC-02 | Tenant receives references to platform-default objects active at onboarding time — not private copies                                      | `edge-case`    | Architecture invariant — reference-vs-copy is not directly user-observable at E2E without DB or audit inspection               |
| AC-03 | Subsequent platform-default changes do not retroactively alter the tenant's configuration                                                  | `edge-case`    | Requires cross-session platform-default mutation harness; not verifiable at E2E in this suite                                  |
| AC-04 | Seed package references are applied atomically as part of tenant record creation                                                           | `edge-case`    | Transactional invariant; requires fault-injection seam to verify atomicity                                                     |
| AC-05 | Seed Package dropdown Mandatory. Must reference a valid, active platform seed package. Validated at submission time. Deprecated rejected   | `happy-path`   | Selection covered in happy-path (valid active package); deprecated-at-submit split into AC-10 error scenario                   |
| AC-06 | Package Description read-only display shows: Product Template set, Rate Table set, Workflow Definition set, Document Policy Set references | `happy-path`   | Observable in the happy-path flow — description panel updates when package is selected                                         |
| AC-07 | Package Version read-only text; displayed in Review & Submit step and in audit record                                                      | `happy-path`   | Version visible in Review & Submit step — covered in happy-path scenario                                                       |
| AC-08 | Seed Package Ref stored on Tenant record; read-only after creation; immutable                                                              | `main-error`   | Immutability guard — combined into single scenario with AC-11 and AC-15                                                        |
| AC-09 | Applied At datetime (UTC) system-populated at binding timestamp                                                                            | `edge-case`    | UTC timestamp accuracy requires DB/audit inspection; not user-observable at E2E                                                |
| AC-10 | Selected seed package deprecated between Step 3 selection and Step 5 submission → 422 at submission, no tenant record created              | `main-error`   | Directly blocks submission; observable via inline error and absence of tenant record                                           |
| AC-11 | Seed package field immutable on the tenant record after creation; post-creation reassignment not supported in V1                           | `main-error`   | Immutability guard scenario — verified alongside AC-08 and AC-15                                                               |
| AC-12 | On creation: Product Template refs, Rate Table refs, Workflow Definition refs, Document Policy Set refs bound atomically                   | `edge-case`    | Transactional invariant subsumed by AC-04; Rate Table wiring explicitly deferred post-November per Vesna Plakalovic 2026-06-12 |
| AC-13 | Seed package name, version, applied-at timestamp recorded in TENANT_CREATION_REQUESTED audit event                                         | `edge-case`    | Audit log observation requires backend audit-query API not confirmed available in E2E env                                      |
| AC-14 | GET /api/seed-packages endpoint returns HTTP 404 to all non-System Admin roles                                                             | `main-error`   | RefiNext 404-not-403 role-gating pattern (enumeration prevention, architecture constraint #5); auto-applied negative scenario  |
| AC-15 | Post-creation reassignment attempted: no endpoint or UI control available; not supported in V1                                             | `main-error`   | Combined with AC-08 and AC-11 into a single immutability guard scenario (API PATCH + missing UI control both verified)         |

**Gherkin generated for:** AC-01, AC-05, AC-06, AC-07, AC-08, AC-10, AC-11, AC-14, AC-15
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-02, AC-03, AC-04, AC-09, AC-12, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                                           | AC                         | Priority | E2E                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------- | -------- | ------------------------------------------- |
| `@happy-path` | System Admin selects a valid seed package on Step 3, sees description + version, and completes wizard submission   | AC-01, AC-05, AC-06, AC-07 | P0       | ⚙️ needs D19 + tenant cleanup               |
| `@main-error` | Seed package deprecated between Step 3 selection and Step 5 submission returns 422; no tenant record created       | AC-10                      | P0       | ⚙️ needs deprecated-seed mid-flight fixture |
| `@main-error` | Submitting the wizard without selecting a seed package is blocked with inline validation error                     | AC-05                      | P0       | ⚙️ needs D19 + tenant cleanup               |
| `@main-error` | Seed package assignment is immutable — API PATCH to change seed_package_ref on an existing tenant is rejected      | AC-08, AC-11, AC-15        | P0       | ⚙️ needs seeded tenant + admin session      |
| `@main-error` | Non-System-Admin roles cannot list seed packages — GET /api/seed-packages returns 404 (Scenario Outline — 5 roles) | AC-14                      | P0       | ✅                                          |

Active scenario blocks: 5 (1 Outline + 4 Scenarios)
E2E automation candidates: 1 of 5 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @seed-package @us-29.14 @p0
Feature: Seed Configuration Package Assignment (US 29.14 — PRD1042-595)
  As a System Admin
  I want to select and apply a seed configuration package when creating a new tenant
  So that the tenant is bound to the correct platform-default configuration objects at onboarding

  Background:
    Given the RefiNext application is accessible
    And at least one active platform seed package is published
    And I am authenticated as a "system_admin" user with email "admin@refinext-test.com"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-05, AC-06, AC-07
  # System Admin proceeds through the tenant creation wizard, selects a valid
  # active seed package on Step 3, observes the description panel populate
  # with the contained Product Template / Rate Table / Workflow Definition /
  # Document Policy references, then advances to Review & Submit where the
  # package name AND version are displayed, and submits.
  # Note: Figma design unfetchable this session (MCP rate limit). Copy of
  # error banner and exact label wording is not asserted. Wizard step name
  # "SEED PACKAGES" verified via prior PRD1042-582 processing on same file.
  # Rate Table set display in the description may be blank pre-launch —
  # Rate Tables wiring is deferred post-November per Vesna Plakalovic
  # comment on PRD1042-40 (2026-06-12).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-05 @ac-06 @ac-07 @p0
  Scenario: System Admin selects a valid seed package and completes the tenant creation wizard (AC-01, AC-05, AC-06, AC-07)
    Given I navigate to the Tenant Management list screen
    When I click the "Create tenant" button
    Then I should see the tenant creation wizard
    When I complete Step 1 "IDENTITY" with valid tenant identity fields
    And I complete Step 2 "MODULES" by selecting at least one active module
    And I proceed to Step 3 "SEED PACKAGES"
    Then I should see the "Seed Package" dropdown as a mandatory field
    And the "Package Description" panel should be visible and read-only
    And the "Package Version" indicator should be visible and read-only
    When I select an active platform seed package from the dropdown
    Then the "Package Description" panel should list the included Product Template set
    And the "Package Description" panel should list the included Workflow Definition set
    And the "Package Description" panel should list the included Document Policy Set
    And the "Package Version" indicator should show the selected package version
    When I proceed to Step 4 "INTEGRATION" and complete it
    And I proceed to the "Review & Submit" step
    Then the review summary should show the selected seed package name
    And the review summary should show the seed package version
    When I click "Submit"
    Then a Four-Eyes governance approval request should be recorded against the new tenant
    And the seed package name and version should be captured on the pending tenant record

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Package deprecated mid-flight: Admin selects a valid active package on
  # Step 3, package is deprecated on the platform before Step 5 submission,
  # the wizard submission is rejected with HTTP 422 and no tenant record is
  # created. Admin can re-select a valid package and re-submit.
  # This scenario requires a fixture that can flip a seed package from
  # "active" to "deprecated" between wizard steps.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Seed package deprecated between Step 3 selection and Step 5 submission is rejected with 422 (AC-10)
    Given I am in the tenant creation wizard on Step 3 "SEED PACKAGES"
    And I have selected an active platform seed package "PKG_STANDARD_V1"
    And I have completed Step 4 "INTEGRATION"
    And I am on the "Review & Submit" step with all wizard fields valid
    When the seed package "PKG_STANDARD_V1" is deprecated on the platform
    And I click "Submit"
    Then the submission should be rejected with HTTP 422
    And no tenant record should be created
    And I should see an error indicating the selected seed package is no longer valid
    And I should be able to re-open Step 3 and select a different active seed package

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Seed package dropdown is mandatory. Attempting to advance past Step 3
  # (or reach submission) without a package selected must be blocked with
  # an inline validation error, and the Submit action must remain disabled.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario: Attempting to submit the wizard without selecting a seed package is blocked with inline validation error (AC-05)
    Given I am in the tenant creation wizard on Step 3 "SEED PACKAGES"
    And I have not selected any seed package from the dropdown
    When I attempt to proceed to Step 4 "INTEGRATION"
    Then I should see an inline validation error on the "Seed Package" field
    And the wizard should remain on Step 3 "SEED PACKAGES"
    And the "Submit" action on Review & Submit should be disabled when reached

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08, AC-11, AC-15
  # Post-creation immutability guard. Once a tenant has been created with
  # a seed package binding, the seed_package_ref field is immutable. Any
  # API PATCH attempt to change it must be rejected, and no UI control
  # to reassign a seed package post-creation should exist. This is a
  # combined verification of AC-08 (stored, read-only), AC-11 (immutable
  # after creation), and AC-15 (no reassignment endpoint or UI in V1).
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @ac-11 @ac-15 @p0
  Scenario: Seed package assignment is immutable after tenant creation — API PATCH attempts are rejected (AC-08, AC-11, AC-15)
    Given a tenant "TEST-BANK-IMMUT-001" has been created with seed package "PKG_STANDARD_V1"
    When I send a PATCH request to "/api/tenants/TEST-BANK-IMMUT-001" with body `{ "seed_package_ref": "PKG_MINIMAL_V1" }`
    Then the response status should be 4xx (rejected)
    And the tenant's seed_package_ref should remain "PKG_STANDARD_V1"
    When I open the tenant detail view for "TEST-BANK-IMMUT-001"
    Then no UI control to change the seed package should be available
    And the seed package name and version should be displayed as read-only

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Role-based access. The GET /api/seed-packages endpoint returns HTTP 404
  # to any non-System-Admin caller (RefiNext 404-not-403 enumeration-prevention
  # pattern, architecture constraint #5). This is an auto-applied RBAC
  # negative scenario covering all five non-admin roles.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles cannot list seed packages — endpoint returns 404 (AC-14)
    Given I am authenticated as a "<role>" user with email "<email>"
    When I send a GET request to "/api/seed-packages"
    Then the response status should be 404
    And the response body should NOT reveal that seed packages exist

    Examples:
      | role                 | email                                       |
      | front_office         | dejan.nikolic+automationfo@holycode.com     |
      | back_office          | dejan.nikolic+automationbo@holycode.com     |
      | support_user         | dejan.nikolic+automationsupport@holycode.com |
      | auditor              | dejan.nikolic+automationauditor@holycode.com |
      | leasing_company_user | dejan.nikolic+automationlco@holycode.com    |
```
