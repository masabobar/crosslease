# PRD1042-48 — US 28.11 | USER MANAGEMENT | Role Assignment & Management

Generated: 2026-06-10
Story: PRD1042-48 — US 28.11 | USER MANAGEMENT | Role Assignment & Management
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (16 ACs, description present, stakeholder-reviewed, Ready for Staging)
ACs with Gherkin scenarios: 8 of 16 | Blocked: 0 | Excluded: 8 (separate-feature or edge-case — scope filter table only)
Figma design: Node 396:18538, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "User Detail View + Edit role & scope dialog" (Stage 2 SUCCESS — ROLE & SCOPE section, Edit role & scope dialog with Four-Eyes alert and Reason for change field fully extracted; user creation role assignment screen not present in this frame)
Design note (WARNINGS): AC-01 (role assignment on user creation) not covered by this Figma frame — tests derive from story ACs. Several ACs (AC-05, AC-06, AC-08, AC-09, AC-12, AC-16) are backend/runtime concerns not representable in UI design.

---

## AC Scope Filter

| AC    | Description                                                                                                                                                     | Classification     | Rationale                                                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Role assignment mandatory on user creation; validated server-side; tenant, LC, and auditor validity checks before saving                                        | `happy-path`       | Core creation gate — admin must select a role before user can be activated; scenario covers mandatory field, server-side validation, and pre-save scope checks                                    |
| AC-02 | System must ensure only one role is assigned; multiple-role assignment blocked; backend-enforced                                                                | `happy-path`       | Single-role constraint visible in dialog design (single-select input, no multi-select); verified within AC-07 happy-path (dialog shows one active role and one new-role selector, never combined) |
| AC-03 | Role dropdown contains only predefined system roles; custom creation blocked; invalid values rejected                                                           | `happy-path`       | Dropdown value set verified within AC-01 and AC-07 scenarios; separate scenario would duplicate the same dialog interaction without adding new assertions                                         |
| AC-04 | Admin attempt to assign multiple roles must be blocked with validation message; attempt must be audit traceable; user record unchanged                          | `main-error`       | Core blocking rule — API-level multi-role rejection; UI has no multi-select so this scenario covers direct API manipulation attempt                                                               |
| AC-05 | Role-based permissions enforced in UI and backend; unauthorized actions rejected server-side; route/field/action visibility follows assigned role               | `separate-feature` | Cross-cutting permissions concern spanning all modules — covered by each individual feature spec's role-based visibility assertions; not testable as an isolated Role Management scenario         |
| AC-06 | Only allowed modules and actions visible per role; hidden modules must not expose routes or empty states; LC Users must not see internal User Management        | `separate-feature` | Module-level visibility concern — each module's own spec asserts correct visibility per role; LC User exclusion from User Management covered by PRD1042-71/73                                     |
| AC-07 | Admin changes a user's role — new role replaces old, previous role revoked, historical traceability preserved, change audit logged; reason mandatory            | `happy-path`       | Core RBAC operation — design shows full Edit role & scope dialog with Current role, New role selector, Reason for change (mandatory), Four-Eyes alert, Submit for approval CTA                    |
| AC-08 | Updated permissions enforced immediately after role change; active sessions revalidated or terminated; backend/API reflects new role immediately                | `separate-feature` | Runtime session state enforcement — belongs in Session Management spec (PRD1042-47); no UI representation in this story                                                                           |
| AC-09 | Logged-in user's role changes — active sessions should be revalidated or terminated; session impact audit traceable; privileged changes trigger session refresh | `separate-feature` | Session lifecycle concern — belongs in PRD1042-47 Session Management                                                                                                                              |
| AC-10 | Front Office and Back Office/Risk must remain mutually exclusive; hybrid FO/BO configurations blocked; violations audit traceable                               | `main-error`       | Core segregation-of-duties rule — admin attempt to hold both FO and BO simultaneously must be blocked; BO↔FO switch via governed workflow is allowed (comment 35325: Four-Eyes + reason)          |
| AC-11 | User with no role or invalid role configuration must be blocked from logging in until valid role assigned                                                       | `edge-case`        | Login-blocking for invalid role state — belongs in login spec (PRD1042-43); edge state that occurs only after an admin error or corrupted provisioning                                            |
| AC-12 | Role assignment and change events must be fully audit logged with prior role, new role, admin actor, timestamp, tenant, reason, session impact, approval ref    | `separate-feature` | Backend audit log — no UI representation beyond the Reason field; Reason field assertion included in AC-07 happy-path                                                                             |
| AC-13 | Role saved as platform-level or tenant-level operational classification; platform-level users may exist without tenant; tenant-level must have tenant           | `happy-path`       | Classification display and enforcement — ROLE & SCOPE section in design shows "Role classification: Platform-level operational role"; assertion included in AC-07 happy-path post-save state      |
| AC-14 | Tenant-level or LC role saved without valid tenant/LC assignment must be blocked; invalid combinations rejected                                                 | `main-error`       | Scope validation gate — admin attempts to save a tenant-level role without selecting a tenant; system must block and show a validation error                                                      |
| AC-15 | Auditor role requires access validity period; expired auditor access must revoke visibility; assignment must be audit traceable                                 | `happy-path`       | Auditor-specific required field — ROLE & SCOPE section shows "Access validity period" and "Audit engagement valid until" fields; missing validity period must block save                          |
| AC-16 | Role assignment/change via API violating role, tenant, scope, or permission rules must be rejected; client-side role controls alone must not determine access   | `separate-feature` | Backend/API enforcement — out of E2E UI scope; verified by API integration tests                                                                                                                  |

**Gherkin generated for:** AC-01, AC-04, AC-07, AC-10, AC-13, AC-14, AC-15
**Blocked (no scenarios generated):** none
**No Gherkin (separate-feature or edge-case):** AC-02 (verified within AC-07), AC-03 (verified within AC-01/AC-07), AC-05, AC-06, AC-08, AC-09, AC-11, AC-12, AC-16

---

## Scenarios summary

| Tag           | Scenario                                                                                                  | AC           | Priority |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------ | -------- |
| `@happy-path` | Admin creates a new user with a mandatory role selected before activation                                 | AC-01        | P0       |
| `@main-error` | Admin attempts to save a new user without selecting a role — blocked                                      | AC-01        | P0       |
| `@happy-path` | Admin opens Edit role & scope dialog and changes a user's role with reason provided (Four-Eyes flow)      | AC-07, AC-13 | P0       |
| `@main-error` | Admin submits role change without providing a reason — validation error shown                             | AC-07        | P0       |
| `@main-error` | Admin assigns a privileged role — Four-Eyes approval alert shown and CTA changes to "Submit for approval" | AC-07        | P0       |
| `@happy-path` | Admin assigns Auditor role — access validity period becomes mandatory and is shown in ROLE & SCOPE        | AC-15        | P0       |
| `@main-error` | Admin saves Auditor role assignment without an access validity period — blocked                           | AC-15        | P0       |
| `@main-error` | Admin attempts to assign a tenant-level role without a tenant — blocked                                   | AC-14        | P0       |
| `@main-error` | Admin attempts to hold Front Office and Back Office/Risk simultaneously — blocked                         | AC-10        | P0       |
| `@main-error` | Direct API call attempts to assign multiple roles to a single user — rejected                             | AC-04        | P1       |

Active scenario blocks: 10

---

## Feature file

```gherkin
@user-management @us-28.11 @p0
Feature: Role Assignment & Management (US 28.11 — PRD1042-48)
  As a Power User / System Admin
  I want to assign and manage user roles
  So that each user has clearly defined permissions and responsibilities within the platform

  Background:
    Given the application is running and accessible
    And a user "Anna Kowalski" exists with email "anna.kowalski@bank.com", role "Front Office", tenant "Tenant A", status "Active"
    And a user "Bob Fischer" exists with email "bob.fischer@bank.com", role "Support User", tenant "Tenant A", status "Invited"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Admin creates a new user and must select a role before the user can be
  # activated. Role dropdown must contain only the predefined system values.
  # Role assignment is validated server-side along with tenant, LC, and
  # auditor validity requirements before saving.
  # Design: role assignment during user creation not present in Figma frame
  # 396:18538 — scenario derives directly from story AC requirements.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario: Admin creates a new user with a mandatory role selected before activation (AC-01)
    Given I am logged in as a "Power User"
    When I navigate to the user creation form
    And I fill in the required user identity fields with valid data
    And I select the role "Front Office" from the role dropdown
    Then the role dropdown must contain only the values "Support User", "Power User / System Admin", "Auditor", "Front Office", "Back Office / Risk", "Leasing Company User"
    And no custom role creation option must be available
    When I select tenant "Tenant A" as the tenant assignment
    And I submit the user creation form
    Then the user must be created successfully with role "Front Office" and tenant "Tenant A"
    And the role must be classified as "Tenant-level operational role" in the new user's ROLE & SCOPE section
    And the role assignment must be recorded in the audit trail

  @main-error @ac-01 @p0
  Scenario: Admin attempts to save a new user without selecting a role — blocked (AC-01)
    Given I am logged in as a "Power User"
    When I navigate to the user creation form
    And I fill in the required user identity fields with valid data
    But I do not select a role
    And I attempt to submit the user creation form
    Then the form must not be submitted
    And a validation error must be displayed indicating that a role is required
    And no user record must be created in the system

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07 + AC-13
  # Admin opens the Edit role & scope dialog from the User Detail page and
  # changes a user's role. The dialog shows:
  #   - Current role (read-only, with shield badge — "Admin" in design)
  #   - New role dropdown (single-select, predefined values; design shows "Support" badge)
  #   - Reason for change (mandatory text input)
  #   - Four-Eyes alert title: "Four-Eyes approval required"
  #   - Four-Eyes description: "This role change requires a second authorized
  #     admin to approve before taking effect."
  #   - CTA: "Submit for approval" (not "Save directly")
  # After approval: previous role revoked, new role active, classification
  # updated, audit trail entry created.
  # Design evidence: dialog node 396:18538.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @ac-13 @p0
  Scenario: Admin opens Edit role & scope dialog and changes a user's role with reason provided (AC-07, AC-13)
    Given I am logged in as a "Power User"
    And I have opened the User Detail View for "Anna Kowalski"
    And I can see the "ROLE & SCOPE" section showing role "Front Office" classified as "Tenant-level operational role"
    When I click the "Edit" button on the "ROLE & SCOPE" section
    Then the "Edit role & scope" dialog must open
    And the current role must be displayed as read-only with a "Front Office" badge
    And the "New role" field must be a single-select dropdown containing only the predefined system role values
    And a "Reason for change" input field must be present
    And the dialog footer must display a "Four-Eyes approval required" alert in amber
    And the alert must state "This role change requires a second authorized admin to approve before taking effect."
    And the primary CTA button must be labelled "Submit for approval"
    When I select "Back Office / Risk" from the "New role" dropdown
    And I enter "Operational restructuring per line manager approval" into the "Reason for change" field
    And I click "Submit for approval"
    Then the role change request must be submitted for Four-Eyes approval
    And the dialog must close or display a pending-approval confirmation
    And once the second admin approves the change the role must be updated to "Back Office / Risk"
    And the ROLE & SCOPE section must show "Role classification: Tenant-level operational role"
    And the previous "Front Office" role must be revoked immediately upon approval
    And the role change must be recorded in the audit trail with actor, timestamp, previous role, new role, reason, and tenant context

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (reason mandatory)
  # Admin submits role change without a reason. Design shows error label:
  # "Reason is mandatory for role change" (amber #d97706) below the input.
  # Design evidence: dialog node 396:18538 — Reason for change error label.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Admin submits role change without providing a reason — validation error shown (AC-07)
    Given I am logged in as a "Power User"
    And I have opened the User Detail View for "Anna Kowalski"
    When I click the "Edit" button on the "ROLE & SCOPE" section
    And the "Edit role & scope" dialog opens
    And I select a valid new role from the "New role" dropdown
    But I leave the "Reason for change" field empty
    And I click "Submit for approval"
    Then the role change must not be submitted
    And the validation message "Reason is mandatory for role change" must be displayed below the "Reason for change" field
    And the dialog must remain open

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (Four-Eyes required for privileged role change)
  # When the target role is privileged (Power User / System Admin, Auditor,
  # Back Office / Risk) the Four-Eyes flow is non-overridable by tenant config.
  # The dialog must show the Four-Eyes alert and "Submit for approval" CTA
  # regardless of tenant security policy settings.
  # Design evidence: dialog node 396:18538 — Four-Eyes alert (amber).
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Admin assigns a privileged role — Four-Eyes approval alert shown and CTA changes (AC-07)
    Given I am logged in as a "Power User"
    And I have opened the User Detail View for "Bob Fischer" who currently holds "Support User"
    When I click the "Edit" button on the "ROLE & SCOPE" section
    And the "Edit role & scope" dialog opens
    When I select "Power User / System Admin" from the "New role" dropdown
    Then the "Four-Eyes approval required" alert must be displayed in the dialog footer
    And the alert description must state "This role change requires a second authorized admin to approve before taking effect."
    And the primary CTA must be labelled "Submit for approval"
    And no direct save path must be available that bypasses the Four-Eyes approval step

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-15
  # Auditor role requires a mandatory access validity period.
  # ROLE & SCOPE section design shows:
  #   - "Access validity period: 16 Jan 2026 - 30 Dec 2026"
  #   - "Audit engagement valid until: 30 Dec 2026"
  # Design evidence: ROLE & SCOPE section node 396:18538.
  # ---------------------------------------------------------------------------

  @happy-path @ac-15 @p0
  Scenario: Admin assigns Auditor role — access validity period becomes mandatory and is shown (AC-15)
    Given I am logged in as a "Power User"
    And I have opened the User Detail View for "Bob Fischer"
    When I click the "Edit" button on the "ROLE & SCOPE" section
    And the "Edit role & scope" dialog opens
    And I select "Auditor" from the "New role" dropdown
    Then an "Access validity period" date-range input must appear and be marked as mandatory
    When I set the access validity period to "16 Jan 2026 – 31 Dec 2026"
    And I enter a reason for change
    And I click "Submit for approval"
    Then the role change request must be submitted for Four-Eyes approval
    And once approved the ROLE & SCOPE section must show "Access validity period: 16 Jan 2026 – 31 Dec 2026"
    And an "Audit engagement valid until" date must be displayed matching the end of the validity window
    And the Auditor engagement status must be set to "Active"

  @main-error @ac-15 @p0
  Scenario: Admin saves Auditor role assignment without an access validity period — blocked (AC-15)
    Given I am logged in as a "Power User"
    And I have opened the User Detail View for "Bob Fischer"
    When I click the "Edit" button on the "ROLE & SCOPE" section
    And the "Edit role & scope" dialog opens
    And I select "Auditor" from the "New role" dropdown
    But I leave the access validity period fields empty
    And I click "Submit for approval"
    Then the role change must not be submitted
    And a validation error must be displayed indicating that an access validity period is required for the Auditor role
    And the dialog must remain open

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Admin attempts to save a tenant-level role without selecting a tenant.
  # Tenant-level roles: Front Office, Back Office / Risk, Leasing Company User.
  # Tenant binding is immutable once set (confirmed comment 35346, 35511) —
  # this covers the initial assignment path.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: Admin attempts to assign a tenant-level role without a tenant — blocked (AC-14)
    Given I am logged in as a "Power User"
    When I navigate to the user creation form
    And I fill in the required user identity fields with valid data
    And I select the role "Front Office" from the role dropdown
    But I do not select a tenant assignment
    And I attempt to submit the user creation form
    Then the form must not be submitted
    And a validation error must be displayed indicating that a tenant assignment is required for tenant-level roles
    And no user record must be created in the system

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (Segregation of Duties)
  # Front Office and Back Office / Risk cannot be held simultaneously.
  # A governed switch (FO → BO or BO → FO) is allowed via the role-change
  # workflow with Four-Eyes + reason (comment 35325).
  # This scenario covers the disallowed case: attempting to hold both roles
  # at the same time, tested at the API level since the UI enforces
  # single-select and prevents multi-role selection in the dialog.
  # Design gap (MINOR): no FO+BO conflict error state designed.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Admin attempts to hold Front Office and Back Office/Risk simultaneously — blocked (AC-10)
    Given I am an authenticated "Power User" with a valid API token
    And "Anna Kowalski" currently holds the role "Front Office"
    When I send a direct API request to assign "Back Office / Risk" as an additional role to "Anna Kowalski" while keeping "Front Office"
    Then the API must return a 4xx error response
    And the error must indicate that Front Office and Back Office / Risk roles are mutually exclusive
    And "Anna Kowalski" must retain only her existing "Front Office" role
    And the blocked attempt must be recorded in the audit trail

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # System must prevent assignment of multiple roles to a single user.
  # UI has no multi-select; this scenario covers direct API manipulation.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p1
  Scenario: Direct API call attempts to assign multiple roles to a single user — rejected (AC-04)
    Given I am an authenticated "Power User" with a valid API token
    When I send a direct API request to assign both "Front Office" and "Support User" roles simultaneously to "Bob Fischer"
    Then the API must return a 4xx error response
    And the error must indicate that multiple-role assignment is not permitted
    And "Bob Fischer" must retain only his existing "Support User" role
    And the blocked attempt must be audit traceable
```
