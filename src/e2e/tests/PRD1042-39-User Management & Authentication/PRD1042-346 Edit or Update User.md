# PRD1042-346 — US 28.29 | USER MANAGEMENT | Edit or Update User

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin is now the only role that can edit bank tenant user attributes; scope is limited to the admin's own tenant. Bank Admin cannot be reached via role reassignment — it is assigned at creation only. System Admin no longer edits bank tenant user attributes (platform-level role).

Generated: 2026-06-12
Story: PRD1042-346 — US 28.29 | USER MANAGEMENT | Edit or Update User
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (5 ACs, description present, stakeholder-reviewed, UAT ready)
ACs with Gherkin scenarios: 3 of 5 | Blocked: 2 (AC-02 verification link path, AC-04 — D16/PRD1042-77) | Excluded: 0
Figma design: None linked (Stage 2 SKIPPED — no Figma URL provided or linked in Jira; story is governance/backend-policy focused)

---

## Blocked ACs (no scenarios generated)

| AC                             | Reason                                                                                                                                                             | Blocking dependency                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| AC-02 (verification-link flow) | Email change requires admin to receive verification email at new address and click an embedded confirmation link — no mailbox access in E2E environment            | Email infra access + D19 (throwaway user creation/deletion API for clean state between runs) |
| AC-04                          | Session invalidation defaults on privileged role/identity-sensitive changes require token TTL/clock override AND centrally governed tenant security policy fixture | D16 (`TEST_TOKEN_TTL_SECONDS` override) + PRD1042-77 (Tenant Security Policy Configuration)  |

> Note: AC-02 partial coverage IS provided — the self-edit rejection path (user attempts to change their own email and is blocked client + server side) is testable and included as a `main-error` scenario. Only the admin-driven verification-link round-trip is blocked.

---

## AC Scope Filter

| AC    | Description                                                                                                                                   | Classification           | Rationale                                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Governed Profile Management — admin updates with role/scope validation, audit logging, backend authoritative                                  | `happy-path`             | Core admin profile-update flow; covers Bank Admin editing both self-editable fields and admin-only fields within own tenant; primary user journey for the story           |
| AC-02 | Email Address Change Governance — re-verification of new email, previous email as recovery anchor, session invalidation by default            | `main-error` + `Blocked` | Self-edit rejection IS testable (covered as main-error). Full admin verification-link round-trip is Blocked (needs email infra + D19)                                     |
| AC-03 | Unauthorized Update Prevention — backend rejects modification when actor lacks permission; privilege escalation blocked; audit traceable      | `main-error`             | Direct rejection path. Concrete negatives: (a) non-admin tries to edit another user; (b) admin tries to assign role above own privilege; (c) cross-tenant edit            |
| AC-04 | Sensitive Change Session Governance — session invalidation, re-auth, MFA revalidation defaults for privileged role/identity-sensitive changes | `Blocked`                | Validating session invalidation defaults end-to-end requires D16 (TTL override) and PRD1042-77 tenant policy fixture; not stably testable today                           |
| AC-05 | Four-Eyes Approval Enforcement — governance-sensitive profile modifications require Four-Eyes; cannot be disabled by tenant policy            | `main-error`             | Self-approval rejection is directly testable (same Bank Admin cannot submit+approve role change). Pending-approval inbox UX is covered separately by US 28.7 (PRD1042-77) |

**Gherkin generated for:** AC-01, AC-02 (self-edit rejection only), AC-03, AC-05
**Blocked (no Gherkin):** AC-02 (verification-link round-trip), AC-04
**No Gherkin (edge-case or separate-feature):** none

---

## Scenarios summary

| Tag           | Scenario                                                                                | AC           | Priority | E2E          |
| ------------- | --------------------------------------------------------------------------------------- | ------------ | -------- | ------------ |
| `@happy-path` | Bank Admin updates self-editable fields on another user (Scenario Outline — 4 fields)   | AC-01        | P0       | ✅           |
| `@happy-path` | User updates own self-editable fields                                                   | AC-01        | P0       | ✅           |
| `@main-error` | Self-edit blocked for governance-sensitive fields (Scenario Outline — 3 fields)         | AC-02, AC-03 | P0       | ✅           |
| `@main-error` | Non-admin role cannot edit another user (Scenario Outline — 5 non-admin roles)          | AC-03        | P0       | ✅           |
| `@main-error` | Bank Admin cannot assign `bank_admin` role via edit (Scenario Outline — 2 target roles) | AC-03        | P0       | ✅           |
| `@main-error` | Cross-tenant edit attempt returns 404 for Bank Admin                                    | AC-03        | P0       | ⚙️ needs D20 |
| `@main-error` | Same Bank Admin cannot submit and approve a privileged role change (Four-Eyes)          | AC-05        | P0       | ✅           |

Active scenario blocks: 7 (5 Outlines + 2 Scenarios)
E2E automation candidates: 6 of 7 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.29 @p0
Feature: Edit or Update User (US 28.29 — PRD1042-346)
  As a Bank Admin (authorized administrative user)
  I want to manage existing user profiles in a governed and audit-traceable manner
  So that user information remains accurate while preserving security governance, tenant isolation, and regulatory compliance

  Background:
    Given the application is accessible at the configured base URL
    And the seeded Bank Admin "bankadmin@bank.com" exists in Bank Tenant A
    And the seeded System Admin "admin@platform.com" exists (platform-level)
    And the seeded Front Office user "fo@bank.com" exists in Bank Tenant A
    And the seeded Back Office user "bo@bank.com" exists in Bank Tenant A
    And the seeded Support User "support@bank.com" exists
    And the seeded Auditor "auditor@bank.com" exists
    And the seeded Leasing Company user "lc@lender.com" exists

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # Bank Admin successfully edits another user's self-editable, non-governance
  # fields within its own tenant. Per PRD1042-48 (Ivan Mladenovic decision
  # 2026-07-06), Bank Admin (bank_admin, user_type=bank_tenant) is the only
  # role that can edit bank tenant user attributes. phone_number, avatar,
  # first_name, last_name are editable without Four-Eyes; all changes are
  # persisted, audit-logged, and reflected in the UI on reload.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario Outline: Bank Admin updates self-editable field on another user (AC-01)
    Given I am logged in as Bank Admin "bankadmin@bank.com" in Bank Tenant A
    And I navigate to the user detail page for "fo@bank.com"
    When I open the edit dialog
    And I update field "<field>" to "<new_value>"
    And I submit the changes
    Then I should see a success confirmation
    And the user detail page should display "<field>" with value "<new_value>"
    And an audit log entry should be created for the change

    Examples:
      | field        | new_value           |
      | phone_number | +49 30 1234567      |
      | first_name   | Maria               |
      | last_name    | Schneider           |
      | avatar       | avatars/maria.png   |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01 (self-profile)
  # Authenticated user updates their own self-editable fields without admin
  # intervention. The default editable self-profile field set is name,
  # phone number, locale, avatar. Email, role, scope must remain non-editable.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @e2e-ready
  Scenario: Front Office user updates own self-editable fields (AC-01)
    Given I am logged in as Front Office "fo@bank.com"
    When I navigate to my profile page
    And I update my phone number to "+49 30 9876543"
    And I submit the changes
    Then I should see a success confirmation
    And my profile page should display phone number "+49 30 9876543"
    And an audit log entry should be created for the change

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02, AC-03
  # Self-edit is bounded: a regular user must not be able to edit
  # governance-sensitive fields on themselves (email, role, tenant scope).
  # Backend must reject the request even if the UI control is somehow exposed.
  # Note: PRD1042-777 reports the email field is currently still editable in
  # the UI — these scenarios assert correct behaviour and will fail until that
  # bug is fixed.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @ac-03 @p0 @e2e-ready
  Scenario Outline: Self-edit blocked for governance-sensitive fields (AC-02, AC-03)
    Given I am logged in as Front Office "fo@bank.com"
    When I attempt to update my own "<field>" to "<new_value>" via the API
    Then the response status should be 403
    And my profile "<field>" should remain unchanged
    And a security audit log entry should be created for the rejected attempt

    Examples:
      | field        | new_value          |
      | email        | newemail@bank.com  |
      | role         | bank_admin         |
      | tenant_scope | tenant-b           |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06), only Bank Admin can
  # edit bank tenant user profiles. System Admin is a platform-level role and
  # no longer edits bank tenant user attributes. Support User and Auditor are
  # read-only; Front Office, Back Office, and LC User have no user-management
  # capability. The backend must reject any cross-user edit attempt from these
  # roles.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario Outline: Non-admin role cannot edit another user (AC-03)
    Given I am logged in as <role> "<email>"
    When I attempt to update phone number of "bo@bank.com" to "+49 30 1111111" via the API
    Then the response status should be 403
    And the target user's phone number should remain unchanged
    And a security audit log entry should be created for the rejected attempt

    Examples:
      | role           | email                |
      | System Admin   | admin@platform.com   |
      | Front Office   | fo@bank.com          |
      | Back Office    | bo@bank.com          |
      | Support User   | support@bank.com     |
      | Auditor        | auditor@bank.com     |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (role reassignment guard)
  # Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06), Bank Admin
  # (`bank_admin`) is assigned at creation only and MUST NOT be reachable via
  # role reassignment. The role dropdown in the edit dialog must not offer
  # `bank_admin` as a target role. Any API request that attempts to assign
  # `bank_admin` via the edit endpoint — even by another Bank Admin — must be
  # rejected server-side. The same protection applies to `system_admin`
  # (platform-level, not a bank tenant role).
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario Outline: Bank Admin cannot assign privileged role via edit (AC-03)
    Given I am logged in as Bank Admin "bankadmin@bank.com" in Bank Tenant A
    And user "fo@bank.com" exists with role "front_office"
    When I attempt to update the role of "fo@bank.com" to "<target_role>" via the API
    Then the response status should be 403
    And the user "fo@bank.com" role should remain "front_office"
    And the role dropdown in the UI must not include "<target_role>" as a selectable option
    And a security audit log entry should be created for the rejected attempt

    Examples:
      | target_role  |
      | bank_admin   |
      | system_admin |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03 (tenant isolation)
  # Tenant isolation rule (architecture constraint #5): cross-tenant access
  # returns 404, not 403, to prevent enumeration. Bank Admin is scoped to its
  # own tenant only — an attempt to edit a user in a different tenant must
  # return 404 even for Bank Admin. Requires a second seeded Bank Tenant B
  # with one test user — currently D20.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Cross-tenant edit attempt returns 404 for Bank Admin (AC-03)
    Given I am logged in as Bank Admin "bankadmin@bank.com" of Bank Tenant A
    And a user "userb@tenant-b.com" exists in Bank Tenant B
    When I attempt to update phone number of "userb@tenant-b.com" via the API
    Then the response status should be 404
    And the target user's phone number should remain unchanged
    And a security audit log entry should be created for the rejected attempt

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (Four-Eyes)
  # Governance-sensitive profile modifications (role change, tenant scope
  # change) must require Four-Eyes approval. The same Bank Admin cannot
  # both submit and approve the change. Tenant policy must not be able to
  # disable this guard. The pending-approval inbox flow itself is covered by
  # US 28.7 (PRD1042-77).
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @e2e-ready
  Scenario: Same Bank Admin cannot submit and approve a privileged role change (AC-05)
    Given I am logged in as Bank Admin "bankadmin@bank.com" in Bank Tenant A
    And user "fo@bank.com" exists with role "front_office"
    When I submit a role change request for "fo@bank.com" from "front_office" to "back_office"
    Then the change should be created in status "pending_four_eyes_approval"
    And the user "fo@bank.com" role should remain "front_office"
    When I attempt to approve my own pending role change as "bankadmin@bank.com"
    Then the response status should be 403
    And the user "fo@bank.com" role should remain "front_office"
    And a security audit log entry should be created for the rejected self-approval
```
