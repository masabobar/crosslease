# PRD1042-48 — US 28.11 | User Management | Role Assignment & Management

Generated: 2026-06-12
**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).
Story: PRD1042-48 — US 28.11 | User Management | Role Assignment & Management
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (16 ACs, description present, stakeholder-reviewed, UAT ready)
ACs with Gherkin scenarios: 8 of 16 | Blocked: 1 (D19) | Excluded: 7 (edge-case or separate-feature — scope filter table only)
Figma design: Node 396-18007, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "Role Assignment & Management" (Stage 2 FAILED — node not fetchable this session, design UNVERIFIED)

> **Role model — 7 canonical roles (post 2026-07-06 realignment):**
>
> | Role                        | Wire value             | Level    | Notes                                                                                                                                                                                                                       |
> | --------------------------- | ---------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | System Admin                | `system_admin`         | Platform | Platform-only; manages platform users + tenants; NO bank user role administration (moved to Bank Admin)                                                                                                                     |
> | **Power User (Bank Admin)** | **`bank_admin`**       | Tenant   | **Highest bank-side authority within one tenant; ONLY role authorized to change tenant user roles; Four-Eyes 2nd principal for those changes; bound to one tenant at creation (immutable); NOT reachable via reassignment** |
> | Support User                | `support_user`         | Platform | Cross-tenant read-only diagnostics                                                                                                                                                                                          |
> | Auditor                     | `auditor`              | Tenant   | Tenant-scoped (per Philipp 2026-05-26), read-only, time-limited                                                                                                                                                             |
> | Front Office                | `front_office`         | Tenant   | Operational; mutually exclusive with Back Office/Risk                                                                                                                                                                       |
> | Back Office / Risk          | `back_office`          | Tenant   | Approvals + risk; mutually exclusive with Front Office                                                                                                                                                                      |
> | Leasing Company User        | `leasing_company_user` | Tenant   | LC-bound; excluded from internal bank modules                                                                                                                                                                               |
>
> **Permission matrix — role administration authority (post 2026-07-06):**
>
> | Action                                         | System Admin | Bank Admin | Support | Auditor | FO  | BO/Risk | LC  |
> | ---------------------------------------------- | :----------: | :--------: | :-----: | :-----: | :-: | :-----: | :-: |
> | Assign / change bank user roles                |      ✗       |     ✓      |    ✗    |    ✗    |  ✗  |    ✗    |  ✗  |
> | Approve role changes (Four-Eyes 2nd principal) |      ✗       |     ✓      |    ✗    |    ✗    |  ✗  |    ✗    |  ✗  |
> | View role-assignment history                   |      ✗       |     ✓      |    R    |    R    |  ✗  |    ✗    |  ✗  |
> | Manage platform users / tenants                |      ✓       |     ✗      |    ✗    |    ✗    |  ✗  |    ✗    |  ✗  |
> | Manage bank (tenant) users                     |      ✗       |     ✓      |    ✗    |    ✗    |  ✗  |    ✗    |  ✗  |
>
> Legend: ✓ = allowed | ✗ = not allowed | R = read-only. Every ✓ subject to module activation + tenant-scope checks.
>
> Known open bugs (do not block test generation):
>
> - PRD1042-826 (Open): Users promoted from Tenant roles to System roles retain tenant-level visibility restrictions — affects AC-05/06/07/08 (role-transition permission enforcement).
> - PRD1042-828 (Open): Auditor role can be assigned without a validity period and has insufficient profile access — affects AC-15 / AC-01 (Auditor validity mandatory). The AC-15 happy guarantee is currently known-failing.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                 | Blocking dependency                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| AC-11 | No/invalid-role login-block needs a throwaway user provisioned with zero/invalid role, then a login attempt. No seeded fixture user is in this state and it cannot be left persistent. | D19 — Throwaway user creation/deletion API |

---

## AC Scope Filter

| AC    | Description                                                                        | Classification     | Rationale                                                                                                                                                                                   |
| ----- | ---------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Role mandatory before activation; validity checked before save                     | `happy-path`       | Role-required guarantee verified inside the AC-03 valid-assignment outline (cannot save without role).                                                                                      |
| AC-02 | Only one role assigned; role exclusivity backend-enforced                          | `edge-case`        | Backend exclusivity invariant; observable behaviour is covered by the AC-04 multi-role block.                                                                                               |
| AC-03 | Role field = 7 predefined roles only; no custom roles                              | `happy-path`       | Bank Admin assigns each of the 7 valid roles (including Power User (Bank Admin)); user saved with exactly that role.                                                                        |
| AC-04 | Multiple-role assignment blocked; validation message; record unchanged             | `main-error`       | Directly blocks the assign action; assert validation message + user record unchanged.                                                                                                       |
| AC-05 | Permissions applied from role (UI + backend/API)                                   | `separate-feature` | RBAC enforcement is the subject of PRD1042-50 (US 28.12). Tested there, not here.                                                                                                           |
| AC-06 | Only allowed modules visible; LC excluded from User Management                     | `separate-feature` | RBAC per-role visibility covered by PRD1042-50 / PRD1042-51 (LC access restrictions).                                                                                                       |
| AC-07 | Role change replaces old; previous revoked immediately; history; audit             | `happy-path`       | Bank Admin performs an allowed transition (BO/Risk↔FO); new role replaces old; history preserved. Bank Admin is NOT reachable via reassignment; System Admin cannot change bank user roles. |
| AC-08 | Updated permissions enforced immediately on next access                            | `edge-case`        | Session-revalidation timing, backend-driven; known-failing for Tenant→System (bug PRD1042-826).                                                                                             |
| AC-09 | Sessions revalidated/terminated on role change                                     | `separate-feature` | Session lifecycle is the subject of PRD1042-47 (US 28.10 Session Management).                                                                                                               |
| AC-10 | FO and BO/Risk mutually exclusive; hybrid blocked; SoD                             | `main-error`       | Separation-of-duties negative — hybrid FO+BO configuration must be blocked.                                                                                                                 |
| AC-11 | No/invalid role config blocks login; no fallback access                            | `Blocked`          | Needs a throwaway zero/invalid-role user + login attempt — D19 (see Blocked ACs table).                                                                                                     |
| AC-12 | Audit log fields; mandatory reason; Four-Eyes for privileged changes               | `main-error`       | Four-Eyes negative (same Admin cannot submit+approve) + mandatory-reason-missing block. Field/format of the audit record itself is edge-case.                                               |
| AC-13 | Platform-level vs tenant-level classification; server-authoritative                | `edge-case`        | Internal server-side classification; no distinct user-facing blocking action.                                                                                                               |
| AC-14 | Tenant/LC scope validated; invalid tenant/LG combinations blocked                  | `main-error`       | Invalid scope combo blocked on save; plus tenant-isolation negative (cross-tenant 404 not 403).                                                                                             |
| AC-15 | Auditor role requires access validity period; time-limited                         | `main-error`       | Save blocked when Auditor selected without a validity period (currently failing — bug PRD1042-828).                                                                                         |
| AC-16 | API rejects role/scope violations; server-authoritative; client alone insufficient | `main-error`       | Direct API role-assignment manipulation must be rejected regardless of client controls.                                                                                                     |

**Gherkin generated for:** AC-01, AC-03, AC-07, AC-04, AC-10, AC-12, AC-14, AC-15, AC-16
**Blocked (no Gherkin):** AC-11
**No Gherkin (edge-case or separate-feature):** AC-02, AC-05, AC-06, AC-08, AC-09, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                      | AC           | Priority | E2E          |
| ------------- | --------------------------------------------------------------------------------------------- | ------------ | -------- | ------------ |
| `@happy-path` | Bank Admin assigns a valid predefined role on create (Scenario Outline — 7 roles)             | AC-01, AC-03 | P0       | ✅           |
| `@happy-path` | Bank Admin changes tenant user role via allowed transition (Scenario Outline — 2 transitions) | AC-07        | P0       | ✅           |
| `@main-error` | Multiple-role assignment is blocked                                                           | AC-04        | P0       | ✅           |
| `@main-error` | Hybrid FO + BO/Risk configuration is blocked (separation of duties)                           | AC-10        | P0       | ✅           |
| `@main-error` | Same Bank Admin cannot submit and approve a privileged role change (Four-Eyes)                | AC-12        | P0       | ✅           |
| `@main-error` | Privileged role change without a reason is blocked                                            | AC-12        | P0       | ✅           |
| `@main-error` | Invalid tenant/LC scope blocked; cross-tenant returns 404                                     | AC-14        | P0       | ⚙️ needs D20 |
| `@main-error` | Auditor role without a validity period is blocked                                             | AC-15        | P0       | ✅           |
| `@main-error` | Direct API role manipulation violating rules is rejected                                      | AC-16        | P0       | ✅           |
| `@main-error` | System Admin cannot change bank tenant user roles (moved to Bank Admin authority)             | AC-05, AC-07 | P0       | ✅           |
| `@main-error` | Bank Admin cannot be reached via role reassignment from any other role                        | AC-07        | P0       | ✅           |
| `@main-error` | Bank Admin cannot change own tenant scope (bound to one tenant at creation)                   | AC-14        | P0       | ✅           |
| `@main-error` | Non-Bank-Admin roles (FO / BO / Support / Auditor / LC) cannot assign or change user roles    | AC-05, AC-16 | P0       | ✅           |

Active scenario blocks: 13 (2 Outlines + 11 Scenarios)
E2E automation candidates: 12 of 13 scenarios ✅

---

## Feature file

```gherkin
@user-management @us-28.11 @p0
Feature: Role Assignment & Management (US 28.11 — PRD1042-48)
  As a Power User (Bank Admin)
  I want to assign and change tenant user roles under strict scope and approval rules
  So that every bank user holds exactly one valid role and privileged changes are governed within my tenant

  Background:
    Given I am authenticated as a Power User (Bank Admin) with role "bank_admin"
    And I am bound to a single bank tenant "Tenant A"
    And the User Management module is accessible

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03
  # Bank Admin assigns one of the 7 predefined roles when creating a user; the role
  # is mandatory before activation and only the predefined system roles are selectable.
  # Post 2026-07-06 realignment: role set is now 7 (added Power User (Bank Admin)).
  # Bank Admin is the only actor authorized to assign tenant user roles.
  # Design UNVERIFIED (Stage 2 FAILED) — role labels are taken from the story.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @e2e-ready
  Scenario Outline: Bank Admin assigns a valid predefined role on create (AC-01, AC-03)
    Given I am creating a new user
    When I assign the role <role>
    And I provide the required scope for that role
    And I save the user
    Then the user should be saved with role <role>
    And the role field should offer only the 7 predefined system roles

    Examples:
      | role                        |
      | Support User                |
      | System Admin                |
      | Power User (Bank Admin)     |
      | Auditor                     |
      | Front Office                |
      | Back Office/Risk            |
      | Leasing Company User        |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07
  # Bank Admin performs an ALLOWED tenant user role transition within own tenant.
  # Post 2026-07-06 realignment: Bank Admin (bank_admin) is the ONLY role authorized
  # to change tenant user roles (FO <-> BO/Risk). System Admin no longer has this
  # authority. New role replaces old immediately; historical role traceable.
  # NOTE: bug PRD1042-826 — Tenant->System promotions retain tenant visibility.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @e2e-ready
  Scenario Outline: Bank Admin changes tenant user role via an allowed transition (AC-07)
    Given a user in my tenant currently holds role <from_role>
    When I change the user's role to <to_role>
    And I provide a mandatory reason
    Then the user's role should become <to_role>
    And the previous role <from_role> should be revoked immediately
    And the previous role <from_role> should remain in the role history

    Examples:
      | from_role        | to_role          |
      | Back Office/Risk | Front Office     |
      | Front Office     | Back Office/Risk |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Attempting to assign more than one role must be blocked with a validation
  # message and the user record must remain unchanged (single-role exclusivity).
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @e2e-ready
  Scenario: Multiple-role assignment is blocked (AC-04)
    Given I am editing a user who holds role "Front Office"
    When I attempt to assign a second role "Back Office/Risk" in addition to the first
    Then the action should be blocked
    And I should see a validation message
    And the user should still hold exactly one role "Front Office"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Separation of duties: Front Office and Back Office/Risk are mutually exclusive.
  # A hybrid FO + BO configuration must be rejected. Auto-applied SoD domain rule.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @e2e-ready
  Scenario: Hybrid Front Office + Back Office configuration is blocked (AC-10)
    Given I am configuring a user with role "Front Office"
    When I attempt to additionally grant "Back Office/Risk" responsibilities to the same user
    Then the configuration should be rejected as a separation-of-duties violation
    And the user should retain a single non-hybrid role

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12 (Four-Eyes)
  # Privileged tenant user role changes (BO/Risk <-> FO) require Four-Eyes approval.
  # Both principals must hold the Bank Admin (bank_admin) role — no other role can
  # act as approver. The Bank Admin who submits the change must NOT be able to approve
  # it. A second Bank Admin within the same tenant must approve. Auto-applied Four-Eyes.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @e2e-ready
  Scenario: Same Bank Admin cannot submit and approve a privileged role change (AC-12)
    Given Bank Admin A in tenant "Tenant A" submits a privileged role change from "Back Office/Risk" to "Front Office" with a reason
    When Bank Admin A attempts to approve that same role change
    Then the approval should be rejected
    And a different Bank Admin in the same tenant must approve the change before it becomes effective

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12 (mandatory reason)
  # A reason is mandatory for privileged role changes and downgrades. Submitting a
  # privileged change without a reason must be blocked before the change is recorded.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @e2e-ready
  Scenario: Privileged role change without a reason is blocked (AC-12)
    Given I am changing a user's role from "Back Office/Risk" to "Front Office"
    When I submit the change without providing a reason
    Then the change should be blocked
    And I should see a message that a reason is required

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14 (scope validation + tenant isolation)
  # Tenant/LC scope must be valid on save; invalid combinations are blocked. Tenant
  # binding is immutable and tenant-isolated: a cross-tenant role assignment must
  # return 404, not 403. Auto-applied tenant-isolation domain rule. Needs Tenant B (D20).
  # ---------------------------------------------------------------------------

  @main-error @ac-14
  Scenario: Invalid tenant/LC scope is blocked and cross-tenant assignment returns 404 (AC-14)
    Given a user belonging to Bank Tenant A
    When I attempt to save the user with a tenant/LC scope that does not match a valid combination
    Then the save should be blocked
    When I attempt to assign a role to a user that belongs to Bank Tenant B
    Then the response status should be 404

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15
  # Auditor is a time-limited role: assigning Auditor without an access validity
  # period must be blocked on save. NOTE: bug PRD1042-828 — currently NOT enforced.
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @e2e-ready
  Scenario: Auditor role without a validity period is blocked (AC-15)
    Given I am assigning the role "Auditor" to a user
    When I save the user without providing an access validity period
    Then the save should be blocked
    And I should see a message that a validity period is required for the Auditor role

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-16
  # Role assignment is server-authoritative. A direct API call that violates the
  # role/tenant/scope rules must be rejected even if client-side controls are bypassed.
  # ---------------------------------------------------------------------------

  @main-error @ac-16 @e2e-ready
  Scenario: Direct API role manipulation violating the rules is rejected (AC-16)
    Given I have a valid Bank Admin session
    When I send a direct API request assigning a role that violates the role/scope rules
    Then the API should reject the request
    And the user's role assignment should remain unchanged

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05, AC-07 (System Admin no longer manages tenant user roles)
  # Post 2026-07-06 realignment: bank user role administration moved from System
  # Admin to Power User (Bank Admin). A System Admin attempting to change a bank
  # tenant user role must be blocked — this authority now belongs exclusively to
  # the Bank Admin of that tenant. System Admin retains only platform-level
  # (System Admin <-> Support User) transitions.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @ac-07 @e2e-ready
  Scenario: System Admin cannot change bank tenant user roles (AC-05, AC-07)
    Given I am authenticated as a System Admin with role "system_admin"
    And a bank tenant user in "Tenant A" holds role "Front Office"
    When I attempt to change that user's role from "Front Office" to "Back Office/Risk"
    Then the action should be blocked
    And I should be informed that tenant user role changes are managed by the tenant's Bank Admin
    And the user's role should remain "Front Office"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (Bank Admin unreachable via reassignment)
  # Per PRD1042-48 Unsupported Role Reassignments: "Any role -> Power User (Bank
  # Admin), and Power User (Bank Admin) -> any role" is not permitted. The bank-admin
  # role is assigned at CREATION only, never via reassignment. This preserves the
  # tier-boundary invariant between reassignable roles and the bank admin category.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @e2e-ready
  Scenario Outline: Bank Admin cannot be reached via role reassignment from any other role (AC-07)
    Given a user in my tenant currently holds role <from_role>
    When I attempt to change the user's role to "Power User (Bank Admin)"
    Then the reassignment should be blocked
    And I should see a message that Power User (Bank Admin) is assigned only at user creation
    And the user's role should remain <from_role>

    Examples:
      | from_role            |
      | Front Office         |
      | Back Office/Risk     |
      | Auditor              |
      | Support User         |
      | System Admin         |
      | Leasing Company User |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14 (Bank Admin tenant binding is immutable)
  # Bank Admin is bound to exactly one tenant at creation. The tenant scope of a
  # Bank Admin cannot be reassigned to a different tenant — cross-tenant Bank Admin
  # migration is a fresh provisioning event, not a scope change on the existing
  # record. Aligned with Philipp's 2026-05-26 tenant-binding-immutable rule.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @e2e-ready
  Scenario: Bank Admin cannot change own tenant scope (AC-14)
    Given a Bank Admin user is bound to "Tenant A" at creation
    When I attempt to change that Bank Admin's tenant scope to "Tenant B"
    Then the action should be blocked
    And I should see a message that Bank Admin tenant binding is set at creation and immutable
    And the Bank Admin should remain bound to "Tenant A"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05, AC-16 (non-Bank-Admin roles cannot administer roles)
  # Per the 2026-07-06 permission matrix, tenant user role administration is an
  # exclusive Bank Admin authority. FO, BO/Risk, Support, Auditor, and LC users
  # must all be blocked from assigning or changing user roles — enforced server-side.
  # System Admin excluded from this outline: covered in separate scenario above.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @ac-16 @e2e-ready
  Scenario Outline: Non-Bank-Admin roles cannot assign or change user roles (AC-05, AC-16)
    Given I am authenticated as a user with role <actor_role>
    And a bank tenant user in my tenant holds role "Front Office"
    When I attempt to change that user's role from "Front Office" to "Back Office/Risk" via UI or direct API
    Then the action should be rejected
    And the user's role should remain "Front Office"

    Examples:
      | actor_role           |
      | Front Office         |
      | Back Office/Risk     |
      | Support User         |
      | Auditor              |
      | Leasing Company User |
```
