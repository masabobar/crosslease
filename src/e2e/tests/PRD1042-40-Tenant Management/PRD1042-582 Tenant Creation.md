# PRD1042-582 — US 29.1 | TENANT MANAGEMENT | Tenant Creation & Onboarding Flow

Generated: 2026-07-03
Story: PRD1042-582 — US 29.1 | TENANT MANAGEMENT | Tenant Creation & Onboarding Flow
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (20 ACs, description present, stakeholder-reviewed by Iva Marković 2026-06-01, accepted by Vesna Plakalovic 2026-06-11, Jira status "QA in progress")
ACs with Gherkin scenarios: 9 of 20 | Blocked: 0 | Excluded: 11 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:21, file 7pygkopuqyeEhUTMVp9lrP — Screen "✅ Tenant list + Create tenant" (Stage 2 PARTIAL — canvas overview + Step 1 screenshot fetched; rate limit hit after 2 calls; text labels extracted from metadata. Verified: wizard step names IDENTITY/MODULES/SEED PACKAGES/INTEGRATION, Tenant Type values, module group names, seed package names, list screen columns. Open bugs PRD1042-1047/-1090/-1094/-1092 still apply.)

---

## AC Scope Filter

| AC    | Description                                                                                                                      | Classification     | Rationale                                                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System Admin initiates tenant creation via multi-step wizard (Identity → Modules → Seed Package → Integration → Review & Submit) | `happy-path`       | Core user journey — end-to-end wizard completion by System Admin                                                            |
| AC-02 | On submission, Tenant record created in Draft/Provisioning state and Four-Eyes governance request submitted to PRD1042-77        | `happy-path`       | Primary success outcome — verified alongside AC-01 in the happy-path Outline                                                |
| AC-03 | Tenant not operationally available until TM-02 countersignature transitions to Active                                            | `separate-feature` | Covered by TM-02 (Tenant Activation via Countersignature) story — outside creation scope                                    |
| AC-04 | Tenant bound to references (not private copies) of platform defaults at onboarding time                                          | `edge-case`        | Architecture invariant; binding-vs-copy is not directly user-observable at E2E layer without audit log inspection           |
| AC-05 | Tenant Name mandatory, max 200 chars, unique across all tenants including Archived                                               | `main-error`       | Uniqueness constraint directly blocks submission; validation is user-observable via inline error                            |
| AC-06 | Tenant Code mandatory, alphanumeric + hyphens, max 50 chars, unique, immutable after creation                                    | `main-error`       | Format validation + uniqueness blocks submission; observable via inline error                                               |
| AC-07 | At least one module must be selected before submission                                                                           | `main-error`       | Blocks progression past Step 2 Modules — key validation gate                                                                |
| AC-08 | Seed package must reference a valid, active platform seed package at submission time                                             | `main-error`       | Blocks submission at Step 3; edge case (mid-flight deprecation) is AC-17                                                    |
| AC-09 | Submit action disabled until all mandatory fields across all wizard steps are valid                                              | `happy-path`       | UI validation gate — observable in Review & Submit step; combined with AC-01                                                |
| AC-10 | Audit event TENANT_CREATION_REQUESTED written on submission with tenant ID, actor, seed package ref, module set, timestamp UTC   | `edge-case`        | Audit log observation requires backend audit-query API not confirmed available; covered by backend integration tests        |
| AC-11 | Only System Admin role may access tenant creation endpoint; all other roles receive HTTP 404                                     | `main-error`       | RefiNext domain rule — role-based access with 404 (not 403) to prevent enumeration; auto-applied negative scenario          |
| AC-12 | Backend role validation mandatory on every submission; UI role enforcement alone insufficient                                    | `edge-case`        | Architecture invariant subsumed by AC-11 API-layer negative test                                                            |
| AC-13 | Tenant creation submission must complete (record creation + governance request dispatch) within 3 seconds under normal load      | `edge-case`        | Performance NFR — not a functional pass/fail; covered by perf test suite                                                    |
| AC-14 | Partial records must not persist on server error — transaction rolled back                                                       | `edge-case`        | Backend transactional invariant; requires fault-injection seam not confirmed available in E2E env                           |
| AC-15 | Duplicate Tenant Name → submission rejected with inline validation error, no record created                                      | `main-error`       | Directly blocks submission; observable via inline error and absence of new tenant                                           |
| AC-16 | Duplicate Tenant Code → submission rejected with inline validation error, no record created                                      | `main-error`       | Directly blocks submission; observable via inline error and absence of new tenant                                           |
| AC-17 | Seed package deprecated between step 3 and step 5 submission → 422 returned, no record created                                   | `edge-case`        | Race condition; requires deprecation-mid-flight harness not confirmed available                                             |
| AC-18 | PRD1042-77 governance engine unavailable at submission → tenant record creation rolled back, 503 returned                        | `edge-case`        | Requires PRD1042-77 service-outage harness / fault injection not confirmed available                                        |
| AC-19 | Idempotency token prevents duplicate record creation on network retry                                                            | `separate-feature` | Explicitly deferred for MVP per Ivan Mladenovic comment 2026-06-05: covered implicitly by unique constraints on Name + Code |
| AC-20 | Audit Trail service unavailable → tenant record creation rolled back                                                             | `edge-case`        | Requires audit-service-outage harness / fault injection not confirmed available; PRD1042-37 dependency                      |

**Gherkin generated for:** AC-01, AC-02, AC-05, AC-06, AC-07, AC-08, AC-09, AC-11, AC-15, AC-16
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-03, AC-04, AC-10, AC-12, AC-13, AC-14, AC-17, AC-18, AC-19, AC-20

---

## Scenarios summary

| Tag           | Scenario                                                                                     | AC                  | Priority | E2E                              |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------- | -------- | -------------------------------- |
| `@happy-path` | System Admin completes the 5-step tenant creation wizard and submits for governance approval | AC-01, AC-02, AC-09 | P0       | ⚙️ needs D19 + tenant cleanup    |
| `@main-error` | Duplicate Tenant Name submission is rejected with inline validation error                    | AC-05, AC-15        | P0       | ⚙️ needs D19 + seeded tenant     |
| `@main-error` | Duplicate Tenant Code submission is rejected with inline validation error                    | AC-06, AC-16        | P0       | ⚙️ needs D19 + seeded tenant     |
| `@main-error` | Invalid Tenant Code format (special characters) blocks submission                            | AC-06               | P0       | ✅                               |
| `@main-error` | Submitting without selecting any module blocks progression from Step 2                       | AC-07               | P0       | ✅                               |
| `@main-error` | Selecting an inactive or deprecated seed package blocks submission at Step 3                 | AC-08               | P0       | ⚙️ needs deprecated seed fixture |
| `@main-error` | Submit button remains disabled while mandatory fields across the wizard are incomplete       | AC-09               | P0       | ✅                               |
| `@main-error` | Non-System-Admin roles cannot access tenant creation endpoint (Scenario Outline — 5 roles)   | AC-11               | P0       | ✅                               |
| `@main-error` | Immutability guard — Tenant Code cannot be edited after creation                             | AC-06               | P0       | ⚙️ needs seeded tenant           |

Active scenario blocks: 9 (1 Outline + 8 Scenarios)
E2E automation candidates: 4 of 9 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.1 @p0
Feature: Tenant Creation & Onboarding Flow (US 29.1 — PRD1042-582)
  As a System Admin
  I want to create a new tenant and submit it for governance approval
  So that a new bank or banking unit is provisioned as an isolated operating environment on the platform

  Background:
    Given the RefiNext application is accessible
    And I am authenticated as a "system_admin" user with email "admin@refinext-test.com"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-09
  # System Admin walks through all 5 wizard steps with valid inputs and submits.
  # Verifies: wizard structure (AC-01), Draft/Provisioning state + Four-Eyes
  # request creation (AC-02), and Submit gating on cross-step validity (AC-09).
  # Note: Figma design unfetchable this session — copy assertions use story
  # description as source of truth. Open bugs PRD1042-1047 (Tenant Code helper
  # text), PRD1042-1090/1094 (Module Step 2 content), PRD1042-1092 (spacing)
  # are known — do not assert exact copy on those fields until closed.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-09 @p0
  Scenario: System Admin completes the 5-step tenant creation wizard and submits for governance approval (AC-01, AC-02, AC-09)
    # Figma-verified: wizard steps are IDENTITY → MODULES → SEED PACKAGES → INTEGRATION → Review & Submit
    # Entry point: "Create tenant" button on the Tenant Management list screen
    Given I navigate to the Tenant Management list screen
    When I click the "Create tenant" button
    Then I should see the tenant creation wizard on step "IDENTITY"
    And the "Submit" action should be disabled
    When I enter "Test Bank AG" in the "Tenant name" field
    And I enter "TEST-BANK-AG-001" in the "Tenant code" field
    And I select "Banking entity" from the "Tenant type" dropdown
    # Figma-verified Tenant type options: "Banking entity", "Standard retail bank", "Commercial & Corporate"
    And I enter "Test Bank AG GmbH" in the "Legal entity name" field
    And I select "Germany" from the "Country / Jurisdiction" selector
    And I select "Euro (EUR)" from the "Default currency" selector
    And I click "Next" to proceed to step "MODULES"
    Then I should see step "MODULES"
    # Figma-verified module groups: "PLATFORM CORE" and "REFINANCING & CONTRACT OPERATIONS"
    When I select at least one module from the available groups
    And I click "Next" to proceed to step "SEED PACKAGES"
    Then I should see step "SEED PACKAGES"
    # Figma-verified seed packages: "Minimal / Sandbox", "Full platform configuration"
    When I select an active platform seed package
    And I click "Next" to proceed to step "INTEGRATION"
    Then I should see step "INTEGRATION"
    # Figma-verified: contains "Core banking reference" field
    When I click "Next" to proceed to the Review & Submit step
    Then I should see the Review & Submit step
    And the review summary should show "Test Bank AG" as the Tenant name
    And the review summary should show "TEST-BANK-AG-001" as the Tenant code
    And the "Submit" action should be enabled
    When I click "Submit"
    Then the tenant "TEST-BANK-AG-001" should be created in "Draft" or "Provisioning" state
    And a Four-Eyes governance approval request should be recorded against the tenant
    And the tenant should NOT be operationally available until countersignature
    And I should see a confirmation that governance approval is pending

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05, AC-15
  # Duplicate Tenant Name at submission must be rejected with an inline error.
  # Uniqueness is enforced across all tenants including Archived.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @ac-15 @p0
  Scenario: Duplicate Tenant Name submission is rejected with inline validation error (AC-05, AC-15)
    Given a tenant with Tenant name "Existing Bank AG" already exists
    And I navigate to the tenant creation entry point
    When I enter "Existing Bank AG" in the "Tenant name" field
    And I enter "UNIQUE-CODE-XYZ" in the "Tenant code" field
    And I select "Banking entity" from the "Tenant type" dropdown
    And I enter "Existing Bank AG GmbH" in the "Legal entity name" field
    And I select "Germany" from the "Country / Jurisdiction" selector
    And I select "Euro (EUR)" from the "Default currency" selector
    And I complete Step 2 with at least one module
    And I complete Step 3 with a valid active seed package
    And I proceed through Step 4 to Step 5
    And I click "Submit"
    Then an inline validation error should be visible on the "Tenant name" field
    And the error should indicate the Tenant name is not unique
    And no new tenant record should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06, AC-16
  # Duplicate Tenant Code at submission must be rejected with an inline error.
  # Tenant Code uniqueness is enforced across all tenants including Archived.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @ac-16 @p0
  Scenario: Duplicate Tenant Code submission is rejected with inline validation error (AC-06, AC-16)
    Given a tenant with Tenant code "EXISTING-CODE-001" already exists
    And I navigate to the tenant creation entry point
    When I enter "Unique Name AG" in the "Tenant name" field
    And I enter "EXISTING-CODE-001" in the "Tenant code" field
    And I select "Banking entity" from the "Tenant type" dropdown
    And I enter "Unique Name AG GmbH" in the "Legal entity name" field
    And I select "Germany" from the "Country / Jurisdiction" selector
    And I select "Euro (EUR)" from the "Default currency" selector
    And I complete Step 2 with at least one module
    And I complete Step 3 with a valid active seed package
    And I proceed through Step 4 to Step 5
    And I click "Submit"
    Then an inline validation error should be visible on the "Tenant code" field
    And the error should indicate the Tenant code is not unique
    And no new tenant record should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (format branch)
  # Tenant Code must be alphanumeric + hyphens only. Entering special characters
  # (spaces, underscores, punctuation) must be rejected with an inline error.
  # This is a UI-observable format validation, distinct from the uniqueness case.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: Invalid Tenant Code format is rejected with inline validation error (AC-06)
    Given I navigate to the tenant creation entry point
    When I enter "Test Bank AG" in the "Tenant name" field
    And I enter "INVALID CODE_001!" in the "Tenant code" field
    Then an inline validation error should be visible on the "Tenant code" field
    And the error should indicate that only alphanumeric characters and hyphens are allowed
    And the "Next" action on Step 1 should be disabled

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # At Step 2 Module Selection the user cannot progress until at least one module
  # is selected. The "Next" button must be disabled while no module is selected.
  # Note: Open bug PRD1042-1090 — Step 2 module data/structure mismatch with
  # design. Do NOT assert on module list contents; only assert on the empty-
  # selection blocking behaviour until the bug is closed.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready
  Scenario: Submitting without selecting any module blocks progression from Step 2 (AC-07)
    Given I navigate to the tenant creation entry point
    And I complete Step 1 "Identity" with valid data
    When I proceed to Step 2 "Module Selection"
    And I do not select any module
    Then the "Next" action on Step 2 should be disabled
    And an inline hint should indicate that at least one module is required

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # If a seed package is selected but is not "active" at submission time, the
  # backend rejects the submission with 422. This scenario relies on a seeded
  # deprecated-package fixture in the E2E environment. If the fixture is
  # unavailable, this scenario is marked ⚙️ in the summary — do not mock.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: Selecting an inactive seed package blocks submission with server error (AC-08)
    Given a seeded platform seed package with status "Deprecated" exists
    And I navigate to the tenant creation entry point
    When I complete Step 1 "Identity" with valid unique data
    And I complete Step 2 with at least one module
    And I proceed to Step 3 "Seed Package"
    And I select the deprecated seed package
    Then the seed package selector should show a warning that the package is not active
    And the "Next" action on Step 3 should be disabled or the submission should be rejected at Step 5

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # The Submit action on Step 5 must remain disabled until all mandatory fields
  # across ALL wizard steps are valid. This is a cross-step gating behaviour
  # observable in the Review & Submit step.
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0 @e2e-ready
  Scenario: Submit button is disabled while cross-step mandatory fields are incomplete (AC-09)
    Given I navigate to the tenant creation entry point
    And I complete Step 1 "Identity" with only Tenant name and Tenant code filled
    When I navigate directly to Step 5 "Review & Submit" via the wizard progress indicator
    Then the "Submit" action should be disabled
    And the wizard should highlight the incomplete step in the progress indicator

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11 (RefiNext role-access negative — 404 pattern)
  # RefiNext domain rule: cross-role access to a sensitive resource returns 404
  # (not 403) to prevent enumeration of restricted endpoints. Tenant creation is
  # restricted to system_admin — all other roles must receive 404 when calling
  # the API directly and must not see the entry point in the UI.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles cannot access tenant creation (AC-11)
    Given I am authenticated as a "<role>" user
    When I attempt to navigate to the tenant creation entry point
    Then the tenant creation entry point should not be visible in the navigation
    When I POST to "/api/tenants" with a valid tenant creation payload
    Then the response status should be 404

    Examples:
      | role                  |
      | front_office          |
      | back_office           |
      | support_user          |
      | auditor               |
      | leasing_company_user  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (immutability branch)
  # Tenant Code is immutable after creation. Any UI or API attempt to modify it
  # on an existing tenant must be rejected. This asserts on a seeded existing
  # tenant — no code change semantics observed in the creation wizard itself.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Tenant Code cannot be modified after creation (AC-06)
    Given a tenant with Tenant code "IMMUTABLE-CODE-001" already exists
    When I navigate to the tenant detail page for "IMMUTABLE-CODE-001"
    Then the "Tenant code" field should be visible as read-only
    And the "Tenant code" field should not be editable
    When I PATCH "/api/tenants/IMMUTABLE-CODE-001" with a new tenant_code value
    Then the response status should be 422 or 400
    And the tenant's Tenant code should remain "IMMUTABLE-CODE-001"
```
