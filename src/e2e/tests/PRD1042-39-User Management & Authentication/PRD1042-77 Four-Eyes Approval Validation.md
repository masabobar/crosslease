# PRD1042-77 — US 28.7 | USER MANAGEMENT | Four-Eyes Approval Validation

Generated: 2026-06-12 | Design updated: 2026-06-12 | Last updated: 2026-07-08

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Jira description of PRD1042-77 explicitly splits the former combined "Power User / System Admin" into System Admin (platform administration) and Power User (Bank Admin) (tenant-level governance approvals within its own bank tenant only). Bank Admin now acts as BOTH initiator AND countersignatory for bank user role changes within its own tenant. Non-overridable Four-Eyes is required for granting Power User (Bank Admin) / Admin / Auditor / Back Office / Risk roles (per Philipp comment 34353 + Vesna orange update). Two new scenarios added (Bank Admin ↔ Bank Admin countersign, non-overridable Four-Eyes for privileged bank roles); one scenario added asserting Bank Admin cannot self-countersign (actor independence); happy-path Outline extended with a Bank Admin initiator/approver pair; scope filter and scenarios summary refreshed.

Story: PRD1042-77 — US 28.7 | USER MANAGEMENT | Four-Eyes Approval Validation
Epic: PRD1042-39 — Epic 28: User Management & Authentication
DoR status: PASS (15 ACs, description present, stakeholder-reviewed by Philipp Maute & Vesna Plakalovic 2026-05-12, Bank Admin split confirmed by Ivan Mladenovic 2026-07-06, UAT ready)
ACs with Gherkin scenarios: 11 of 15 | Blocked: 3 (AC-04, AC-09, AC-13) | Excluded: 1 (AC-08 edge-case) | Excluded (timing): 2 (AC-12, AC-15)
Figma design: Node 574:49518, file 18XTZEeaxrGDhi4DzZ2QnJ — extraction SUCCESS (2026-06-12, after MCP re-auth with @holycode.com account)
Sections extracted: VIEW DETAILS, PENDING APPROVALS - Approval flow (node 576:50334), REJECTION FLOW (node 576:51875), SUBMITTER NOTIFICATIONS (node 576:53060), EMPTY STATE (node 576:53511)
Dialogs extracted: Step-up OTP approval (576:51394), Approval detail/review (576:51782), Step-up OTP rejection (576:52579) — Rejection detail (576:52967) PARTIAL (rate-limit hit on 4th call; structurally identical to approval detail)
Stage 3 comparison status: WARNINGS — 2 MINOR design typos found (see Design Gaps below); all ACs map to design frames; no CRITICAL/MAJOR mismatches

---

## Design Gaps (Stage 3)

| Severity | Location                                                           | Issue                                                           | Recommendation                          |
| -------- | ------------------------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------- |
| MINOR    | Approval detail dialog — SUBMITTION section label (node 576:51819) | Typo: "SUBMITTION" should be "SUBMISSION"                       | Fix label copy before FE implementation |
| MINOR    | Approval detail dialog — reason section label (node 576:51837)     | Typo: "REASON FROM SUBBMITER" should be "REASON FROM SUBMITTER" | Fix label copy before FE implementation |

---

## Figma UI Flow Summary (for test authoring reference)

**Pending Approvals task list** (PENDING APPROVALS section, node 576:50334):

- Each task shows: user name, submitter ("By Ingrid Bjornstad"), submitted timestamp ("Submitted 20h ago"), expiry countdown ("Expires in 4h")
- Own pending items show the label **"You submitted this request"** — countersign button is absent for the initiating user
- Resolved tasks show: user name, resolved-by user, "Resolved" + timestamp — no action button

**Two-step approval flow** (triggered by "Review" action button on a pending task):

**Step 1 — Approval/Rejection detail dialog** (node 576:51782, width 480px):

- Header: action title (e.g. "Role change") + lock icon + "Approval requires step-up MFA verification"
- **ACTION section**: Action type, Affected user, Tenant
- **CHANGE section**: CURRENT (red box) → arrow → PROPOSED (green box) — visual role diff
- **SUBMISSION section**: Submitted by, Role at time (role badge), Tenant at time, Submitted at
- **REASON FROM SUBMITTER section**: submitter's justification in a blue-left-border alert box
- **REQUEST CHAIN section**: collapsible re-initiation history — each entry has status badge (Expired / Pending / Approved)
- **Your justification field**: required textarea, helper text "Required · stored in audit log"
- Footer: **Cancel** (left, outline) | **Reject** (destructive outline, red `#e6000a`) + **Approve** (primary solid blue `#2d62ef`)

**Step 2 — Step-up OTP verification dialog** (node 576:51394 for approve / 576:52579 for reject, width 416px):

- Header: **"Step up verification required"** + subtitle "You're about to approve a sensitive change. Confirm it's really you."
- **YOU ARE APPROVING** label + user card (avatar + action summary "Role change · Anna Kowalski · Admin role")
- OTP input: **"Enter 6-digit code"** — 6 individual digit boxes
- "Didn't receive it? **Resend code**" link
- Footer approve: **Cancel** + **"Confirm approval"** (solid blue)
- Footer reject: **Cancel** + **"Confirm rejection"** (solid blue)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                                                                                                                                                                | Blocking dependency                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| AC-04 | Session-validation testing requires the approver session to be deterministically expired at countersignature time. No environment override exists to force token TTL at will.                                                                                                                                                                         | D16 — `TEST_TOKEN_TTL_SECONDS` env override                          |
| AC-09 | **Design is complete** (Figma nodes 576:51394 / 576:52579 — "Step up verification required" dialog with 6-digit OTP, "Confirm approval/rejection" CTA). FE implementation intentionally deferred per Jira comment 36265 until MFA story lands. UI scenarios for the OTP dialog are written below and tagged `@fixme` — unblock when PRD1042-75 ships. | R1 / PRD1042-75 — MFA / 2FA story not yet implemented                |
| AC-13 | Delegated approval validation requires a delegation framework that is not in Sprint 1 scope per Katarina comment 34592 (Sprint 1 = User Management actions only).                                                                                                                                                                                     | Delegation framework — backend model, API and admin UI not yet built |

---

## AC Scope Filter

| AC    | Description                                                                                                                                                                        | Classification | Rationale                                                                                                                                                                                                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Independent Actor Validation — initiator and approver must be different users; server-side enforced; audit traceable                                                               | `happy-path`   | Core Four-Eyes rule and the primary success outcome — covered by happy-path Outline where two distinct users complete an approval. Outline now includes Bank Admin ↔ Bank Admin pair for tenant-level bank user role changes (per Ivan Mladenovic 2026-07-06); System Admin pair remains for platform-level administration |
| AC-02 | Role Validation — approver must possess required role, permissions and authorized scope; tenant + workflow scoped                                                                  | `main-error`   | Wrong-role approver must be rejected at API; RefiNext role-access domain rule directly observable in the response code. Role-scope split: Bank Admin countersigns tenant-level bank user role changes only; System Admin countersigns platform-level actions only — cross-scope countersignature must be rejected          |
| AC-03 | Workflow Validation — approval must be rejected when business object is in an invalid workflow state                                                                               | `main-error`   | Invalid workflow state must block countersignature; directly observable via API response and audit log                                                                                                                                                                                                                     |
| AC-04 | Session Validation — expired or invalid approver session must reject the approval                                                                                                  | `Blocked`      | Requires D16 (`TEST_TOKEN_TTL_SECONDS`) to force a deterministically expired session at countersignature time — no override available in current environment                                                                                                                                                               |
| AC-05 | Tenant Scope Validation — cross-tenant approval authority must be rejected; tenant scope validation dynamically enforced                                                           | `main-error`   | RefiNext tenant-isolation domain rule (architecture constraint #5) — cross-tenant attempts must return 404 not 403 to prevent enumeration                                                                                                                                                                                  |
| AC-06 | Self-Approval Prevention — initiating user must not also countersign, regardless of session, sub-account or impersonation                                                          | `main-error`   | Direct expression of the Four-Eyes separation rule; identity-based, not session-based; must be testable end-to-end via API                                                                                                                                                                                                 |
| AC-07 | API Enforcement — Four-Eyes validation server-authoritative; direct API manipulation must not bypass approval governance                                                           | `main-error`   | Tests that bypass paths (direct POST as same user) are rejected with the same 4xx contract as the UI; complements AC-06 with an explicit API-call scenario                                                                                                                                                                 |
| AC-08 | Approval Lineage Preservation — initiator, approver, delegation chain, lineage records remain immutable and historically reconstructible                                           | `edge-case`    | Implementation invariant on the audit/approval store; covered indirectly by AC-01/AC-12 audit assertions and at backend integration test layer; no discrete UI E2E gesture                                                                                                                                                 |
| AC-09 | MFA Enforcement — privileged approvals require recent MFA (≤5 min); stale state requires step-up; backend/API enforced                                                             | `Blocked`      | Per Jira comment 36265 — MFA step-up explicitly not implemented in current build; FE screens deferred until PRD1042-75 lands                                                                                                                                                                                               |
| AC-10 | Invalid Approval Blocking — failed validation must block lifecycle transition; no partial execution; audit traceable                                                               | `happy-path`   | Composite assertion satisfied by happy-path Outline (lifecycle transitions only when validation passes) plus the AC-01/AC-06 negatives (failed validation produces no state change)                                                                                                                                        |
| AC-11 | Auditor Visibility — Auditor can review approval lineage read-only; cannot participate in approval execution                                                                       | `main-error`   | RefiNext role-access domain rule for the Auditor role; auditor must see lineage but POST to approval endpoint must be rejected with 403                                                                                                                                                                                    |
| AC-12 | Audit Logging — every approval event logged with initiator, approver, roles, tenant, action, outcome, failure reason, timestamp, MFA state                                         | `edge-case`    | Audit log schema invariant; verified at backend integration test level — E2E asserts only the existence of the event, not the full schema                                                                                                                                                                                  |
| AC-13 | Delegated Approval Validation — delegated approvers in the initiator's authority chain treated as the initiating actor                                                             | `Blocked`      | Delegation framework not in Sprint 1 scope per Katarina comment 34592; cannot be exercised without backend delegation model and admin UI                                                                                                                                                                                   |
| AC-14 | Self-Elevation Prevention — initiator cannot approve a change affecting their own role/scope/permissions, regardless of session, delegated authority, sub-account or impersonation | `main-error`   | Distinct from AC-06: AC-06 blocks the same identity from approving any object they initiated; AC-14 specifically blocks self-elevation patterns where the change targets the same identity                                                                                                                                 |
| AC-15 | Approval Validity Window — expired approval requests become invalid and require re-initiation; expiration audit-traceable                                                          | `edge-case`    | Timing-based (configurable per workflow type); requires clock manipulation seam (D16-equivalent) to fast-forward expiry deterministically; not assertable in standard E2E run                                                                                                                                              |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-05, AC-06, AC-07, AC-08 (UI assertion), AC-09 (@fixme), AC-10, AC-11, AC-14, AC-15 (expiry countdown assertion in task list scenario)
**Blocked (no Gherkin):** AC-04, AC-13
**No Gherkin (edge-case or schema invariant):** AC-12
**Bank Admin coverage (added 2026-07-08):** happy-path Outline row for Bank Admin ↔ Bank Admin (AC-01); Bank Admin self-countersign prevention (AC-06); non-overridable Four-Eyes for granting privileged bank roles — Power User (Bank Admin) / Admin / Auditor / Back Office / Risk (AC-01 + AC-02 + AC-10)

---

## Scenarios summary

| Tag           | Scenario                                                                                                                                                                                           | AC                  | Priority | E2E                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ---------------------------------------- |
| `@happy-path` | Two distinct users complete a Four-Eyes approval and the workflow transitions (Scenario Outline — 3 admin pairings: System Admin ↔ Power User, Power User ↔ System Admin, Bank Admin ↔ Bank Admin) | AC-01, AC-10        | P0       | ⚙️ needs D19 (throwaway users)           |
| `@main-error` | Self-approval by the initiating user is rejected (UI + API) (AC-06 + AC-07)                                                                                                                        | AC-06, AC-07        | P0       | ✅                                       |
| `@main-error` | Bank Admin cannot self-countersign a bank user role change they initiated (actor independence, tenant-scoped)                                                                                      | AC-06, AC-07        | P0       | ⚙️ needs D19                             |
| `@main-error` | Approver lacking the required role is rejected with 403                                                                                                                                            | AC-02               | P0       | ✅                                       |
| `@main-error` | Non-overridable Four-Eyes — granting Power User (Bank Admin) / Admin / Auditor / Back Office / Risk requires two independent Bank Admins; single-actor commit is blocked                           | AC-01, AC-02, AC-10 | P0       | ⚙️ needs D19                             |
| `@main-error` | Cross-tenant approval is rejected and returns 404 (tenant-isolation enumeration guard)                                                                                                             | AC-05               | P0       | ⚙️ needs D20 (second Bank Tenant)        |
| `@main-error` | Approval on an invalid workflow state is rejected                                                                                                                                                  | AC-03               | P0       | ⚙️ needs D19 (workflow staging)          |
| `@main-error` | Auditor cannot perform approval — read-only lineage visibility only                                                                                                                                | AC-11               | P0       | ✅                                       |
| `@main-error` | Self-elevation — initiator cannot approve a change to their own role or scope                                                                                                                      | AC-14               | P0       | ⚙️ needs D19 (privileged user lifecycle) |
| `@ui`         | Pending approval task list shows correct metadata — user, submitter, expiry timer, own-item label                                                                                                  | AC-01, AC-15        | P1       | ✅                                       |
| `@ui`         | Approval detail dialog shows ACTION, CHANGE comparison, SUBMISSION details, REQUEST CHAIN and requires justification                                                                               | AC-01, AC-08        | P1       | ⚙️ needs D19                             |
| `@ui @fixme`  | Step-up OTP dialog appears after clicking Approve/Reject in the detail dialog (AC-09 — deferred, design ready)                                                                                     | AC-09               | P1       | 🚫 blocked by PRD1042-75 MFA             |
| `@ui`         | Rejection flow detail dialog mirrors approval dialog structure with Confirm rejection CTA                                                                                                          | AC-01               | P1       | ⚙️ needs D19                             |

Active scenario blocks: 13 (1 Outline + 12 Scenarios; 1 tagged `@fixme`; +2 Bank Admin scenarios + 1 extra Outline row added 2026-07-08)
E2E automation candidates: 4 of 13 scenarios ✅ | 7 need D19/D20 | 1 blocked by PRD1042-75 | 1 fixme

---

## Feature file

```gherkin
@user-management @us-28.7 @p0
Feature: Four-Eyes Approval Validation (US 28.7 — PRD1042-77)
  As the RefiNext platform
  I want to enforce Four-Eyes approval validation on sensitive User Management actions
  So that critical business decisions require independent verification and comply with banking governance standards (MaRisk AT 4.3, BAIT AT 4.3.1)

  Background:
    Given the RefiNext application is accessible
    And a tenant "tenant-a" with seeded users for each role exists
    And the Sprint 1 Four-Eyes approval workflow is enabled for User Management actions

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-10
  # Two DIFFERENT authorized users complete the Four-Eyes approval cycle:
  # initiator submits the action, approver countersigns, and the lifecycle
  # transition only happens after countersignature succeeds.
  #
  # Role-scope split (confirmed by Ivan Mladenovic 2026-07-06, per PRD1042-48
  # and per Jira description update on PRD1042-77):
  #   - system_admin       → platform administration actions only
  #   - power_user         → tenant-level administration (legacy Power User)
  #   - bank_admin         → BOTH initiator AND countersignatory for bank user
  #                          role changes within its OWN tenant only
  # Bank Admin acts as both initiator and countersignatory within its own
  # tenant — two DIFFERENT Bank Admin identities are still required to satisfy
  # actor independence (AC-01 / AC-06). The Outline covers the three admin
  # tier pairings with countersignature authority within User Management
  # Sprint 1 scope. Note: per Jira comment 36265 the FE Approve/Reject screens
  # are intentionally not implemented until MFA work lands — happy-path is
  # API-first, UI assertions limited to observable workflow state on the
  # user detail page.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-10 @p0
  Scenario Outline: Two distinct users complete a Four-Eyes approval and the workflow transitions (AC-01, AC-10)
    Given a target "front_office" user with email "fo@refinext-test.com" exists in tenant "tenant-a" with status "Active"
    And I am authenticated as a "<initiator_role>" user with email "<initiator_email>" in tenant "tenant-a"
    When I submit a privileged action requiring Four-Eyes approval against "fo@refinext-test.com"
    Then a Four-Eyes approval request should be created with status "PENDING"
    And the approval request initiator should be "<initiator_email>"
    And the user status for "fo@refinext-test.com" should NOT change yet
    When I authenticate as a "<approver_role>" user with email "<approver_email>" in tenant "tenant-a"
    And I open the pending Four-Eyes approval request for "fo@refinext-test.com"
    Then the approval request initiator and approver fields should show "<initiator_email>" and "<approver_email>" respectively
    When I countersign the approval request as "<approver_email>"
    Then the approval request status should change to "APPROVED"
    And the user status for "fo@refinext-test.com" should reflect the approved lifecycle transition
    And an audit event should be recorded with initiator "<initiator_email>", approver "<approver_email>", action "APPROVE", outcome "APPROVED", and tenant "tenant-a"

    Examples:
      | initiator_role | initiator_email             | approver_role | approver_email              |
      | system_admin   | admin1@refinext-test.com    | power_user    | power1@refinext-test.com    |
      | power_user     | power2@refinext-test.com    | system_admin  | admin2@refinext-test.com    |
      | bank_admin     | bankadmin1@refinext-test.com | bank_admin   | bankadmin2@refinext-test.com |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06, AC-07
  # The initiator must not also be the approver. The rule is identity-based and
  # MUST be enforced server-side, not just by hiding the UI button. Test both
  # paths in one scenario: the UI countersign control must be absent for the
  # initiator, and a direct API call to the approval endpoint by the same
  # identity must be rejected with a clear governance error code.
  # Covers AC-06 (self-approval prevention) and AC-07 (API enforcement).
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @ac-07 @p0 @e2e-ready
  Scenario: Self-approval by the initiating user is rejected in UI and via direct API (AC-06, AC-07)
    Given a target "front_office" user with email "fo@refinext-test.com" exists in tenant "tenant-a"
    And I am authenticated as a "system_admin" user with email "admin1@refinext-test.com" in tenant "tenant-a"
    When I submit a privileged action requiring Four-Eyes approval against "fo@refinext-test.com"
    Then a Four-Eyes approval request should be created with status "PENDING" and initiator "admin1@refinext-test.com"
    When I open the pending Four-Eyes approval request as "admin1@refinext-test.com"
    Then the countersign action should not be available to the initiating user
    When I POST to the approval endpoint as "admin1@refinext-test.com" with action "APPROVE"
    Then the response status should be 4xx
    And the response should indicate a separation-of-duties violation
    And the approval request status should remain "PENDING"
    And the failed self-approval attempt should be recorded in the audit log with reason "Same actor"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06, AC-07 (Bank Admin actor independence, added 2026-07-08)
  # Bank Admin acts as BOTH initiator AND countersignatory for bank user role
  # changes within its own tenant. Because a single Bank Admin identity plays
  # both roles, actor independence (initiator != approver) MUST still be
  # enforced — a Bank Admin cannot self-countersign a role change they
  # initiated, even though the role name is the same on both sides of the
  # workflow. The rule is identity-based, not role-based (same guarantee
  # already tested for System Admin above). Confirmed by Ivan Mladenovic
  # 2026-07-06 per PRD1042-48.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @ac-07 @p0
  Scenario: Bank Admin cannot self-countersign a bank user role change they initiated (AC-06, AC-07)
    Given a target "front_office" user with email "fo@refinext-test.com" exists in tenant "tenant-a"
    And I am authenticated as a "bank_admin" user with email "bankadmin1@refinext-test.com" in tenant "tenant-a"
    When I submit a bank user role change (Front Office → Back Office) requiring Four-Eyes approval against "fo@refinext-test.com"
    Then a Four-Eyes approval request should be created with status "PENDING" and initiator "bankadmin1@refinext-test.com"
    When I open the pending Four-Eyes approval request as "bankadmin1@refinext-test.com"
    Then the countersign action should not be available to the initiating Bank Admin
    When I POST to the approval endpoint as "bankadmin1@refinext-test.com" with action "APPROVE"
    Then the response status should be 4xx
    And the response should indicate a separation-of-duties violation
    And the approval request status should remain "PENDING"
    And the role of "fo@refinext-test.com" should not change
    And the failed self-countersign attempt should be recorded in the audit log with reason "Same actor"
    And the tenant context on the audit event should be "tenant-a"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # The countersignatory must possess the required role and approval authority.
  # A user without the approver role attempting to countersign via direct API
  # must be rejected with a 403 — independent of whether the UI exposes the
  # action. This is the RefiNext role-based access domain rule applied to the
  # approval flow specifically.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Approver lacking the required role cannot countersign an approval request (AC-02)
    Given a target "front_office" user with email "fo@refinext-test.com" exists in tenant "tenant-a"
    And a pending Four-Eyes approval request exists for "fo@refinext-test.com" initiated by "admin1@refinext-test.com"
    And I am authenticated as a "front_office" user with email "fo-other@refinext-test.com" in tenant "tenant-a"
    When I POST to the approval endpoint for the pending request with action "APPROVE"
    Then the response status should be 403
    And the approval request status should remain "PENDING"
    And the unauthorized countersignature attempt should be recorded in the audit log with reason "Invalid role"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01, AC-02, AC-10 (Non-overridable Four-Eyes for privileged
  # bank roles, added 2026-07-08)
  # Granting any of the following bank roles MUST require Four-Eyes approval
  # by two independent Bank Admins — the requirement is non-overridable and
  # cannot be bypassed even by a System Admin or by an emergency-access flow:
  #   - Power User (Bank Admin)
  #   - Admin
  #   - Auditor
  #   - Back Office
  #   - Risk
  # Confirmed by Philipp Maute (comment 34353) and Vesna Plakalovic (orange
  # update). Enforced at the API layer: a single Bank Admin cannot commit the
  # role grant even when acting alone; the workflow MUST create a PENDING
  # approval request and require a second, distinct Bank Admin to countersign.
  # Scenario Outline covers all five privileged bank roles in one block.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @ac-02 @ac-10 @p0
  Scenario Outline: Non-overridable Four-Eyes for granting privileged bank roles — single-actor commit is blocked, two independent Bank Admins succeed (AC-01, AC-02, AC-10)
    Given a target user with email "target@refinext-test.com" exists in tenant "tenant-a" with role "front_office"
    And I am authenticated as a "bank_admin" user with email "bankadmin1@refinext-test.com" in tenant "tenant-a"
    When I POST to grant role "<privileged_role>" to "target@refinext-test.com" with a single-actor commit hint
    Then the response should NOT commit the role change
    And a Four-Eyes approval request should be created with status "PENDING" and initiator "bankadmin1@refinext-test.com"
    And the role of "target@refinext-test.com" should remain "front_office"
    When I POST to the approval endpoint as "bankadmin1@refinext-test.com" with action "APPROVE"
    Then the response status should be 4xx
    And the response should indicate a separation-of-duties violation
    When I authenticate as a "bank_admin" user with email "bankadmin2@refinext-test.com" in tenant "tenant-a"
    And I POST to the approval endpoint for the pending request with action "APPROVE"
    Then the approval request status should change to "APPROVED"
    And the role of "target@refinext-test.com" should be "<privileged_role>"
    And an audit event should be recorded with initiator "bankadmin1@refinext-test.com", approver "bankadmin2@refinext-test.com", action "APPROVE", granted_role "<privileged_role>", and tenant "tenant-a"

    Examples:
      | privileged_role |
      | bank_admin      |
      | admin           |
      | auditor         |
      | back_office     |
      | risk            |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Tenant scope validation — an approver authenticated in tenant B must not be
  # able to countersign a request that lives in tenant A. RefiNext architecture
  # constraint #5 mandates that cross-tenant access return 404 (not 403) to
  # prevent enumeration. This scenario therefore asserts a 404 response, not 403.
  # Requires D20 — a seeded second Bank Tenant B with at least one user.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario: Cross-tenant approval attempt returns 404 (AC-05)
    Given a pending Four-Eyes approval request exists in tenant "tenant-a" for "fo@refinext-test.com" initiated by "admin1@refinext-test.com"
    And a second tenant "tenant-b" with a "system_admin" user "admin-b@refinext-test.com" exists
    And I am authenticated as "admin-b@refinext-test.com" in tenant "tenant-b"
    When I POST to the approval endpoint targeting the tenant-a approval request with action "APPROVE"
    Then the response status should be 404
    And the response should not disclose the existence of the cross-tenant approval request
    And the approval request status in "tenant-a" should remain "PENDING"
    And the cross-tenant approval attempt should be recorded in the audit log with reason "Tenant mismatch"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # The approval action must be rejected when the underlying business object is
  # in a workflow state that does not permit approval (e.g. already approved,
  # already rejected, withdrawn, expired). Per Katarina comment 35743 the
  # resolution model defines REJECTED/WITHDRAWN/EXPIRED as terminal states —
  # any further approval against the same request must fail.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario: Approval on an invalid workflow state is rejected (AC-03)
    Given a Four-Eyes approval request for "fo@refinext-test.com" exists in tenant "tenant-a"
    And the approval request is in a terminal workflow state of "WITHDRAWN"
    And I am authenticated as a "power_user" user with email "power1@refinext-test.com" in tenant "tenant-a"
    When I POST to the approval endpoint for the withdrawn request with action "APPROVE"
    Then the response status should be 4xx
    And the response should indicate an invalid workflow state for approval
    And the approval request status should remain "WITHDRAWN"
    And the rejected workflow-state attempt should be recorded in the audit log

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Auditor role — must have read-only visibility into approval lineage but
  # must NOT be able to participate in approval execution. Tests both halves:
  # GET on the approval-history endpoint returns 200 with lineage data;
  # POST to the approval endpoint with action APPROVE returns 403.
  # This is the RefiNext role-access domain rule applied to the Auditor.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready
  Scenario: Auditor can read approval lineage but cannot countersign (AC-11)
    Given a pending Four-Eyes approval request exists in tenant "tenant-a" for "fo@refinext-test.com"
    And I am authenticated as an "auditor" user with email "auditor@refinext-test.com" in tenant "tenant-a"
    When I GET the approval lineage endpoint for the pending request
    Then the response status should be 200
    And the lineage response should include the initiator, current approval state, and audit history
    When I POST to the approval endpoint for the pending request with action "APPROVE"
    Then the response status should be 403
    And the approval request status should remain "PENDING"
    And the unauthorized Auditor approval attempt should be recorded in the audit log

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Self-elevation prevention — even when initiator and approver are technically
  # different users, the initiating identity must not approve a change that
  # affects their own role, scope, or governance authority. The rule is
  # identity-based and applies regardless of session, sub-account, or
  # impersonation. Tests the case where a "system_admin" initiates a role
  # change against their own account and then attempts to approve it from a
  # second session — the second-session approval must still be rejected because
  # the underlying identity is the same.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0
  Scenario: Initiator cannot approve a workflow that changes their own role or scope (AC-14)
    Given I am authenticated as a "system_admin" user with email "admin1@refinext-test.com" in tenant "tenant-a"
    When I submit a privileged action that changes the role or scope of "admin1@refinext-test.com"
    Then a Four-Eyes approval request should be created with status "PENDING" and initiator "admin1@refinext-test.com"
    When I open a second authenticated session as "admin1@refinext-test.com"
    And I POST to the approval endpoint for the pending request with action "APPROVE"
    Then the response status should be 4xx
    And the response should indicate a self-elevation violation
    And the approval request status should remain "PENDING"
    And the role or scope of "admin1@refinext-test.com" should not change
    And the failed self-elevation attempt should be recorded in the audit log with reason "Same actor"

  # ---------------------------------------------------------------------------
  # UI — AC-01, AC-15
  # Figma: PENDING APPROVALS section (node 576:50334)
  # The pending approvals task list must display all required metadata per the
  # Figma design: affected user, submitter ("By"), submitted timestamp,
  # expiry countdown ("Expires in Xh"), and the "You submitted this request"
  # ownership label visible only to the initiating user (no countersign CTA).
  # Resolved tasks show resolved-by and resolved-at — no action button.
  # ---------------------------------------------------------------------------

  @ui @ac-01 @ac-15 @p1 @e2e-ready
  Scenario: Pending approval task list shows correct metadata for pending and resolved items (AC-01, AC-15)
    Given a pending Four-Eyes approval request exists in tenant "tenant-a" for "fo@refinext-test.com"
    And the request was submitted by "admin1@refinext-test.com" 20 hours ago
    And a second resolved approval request exists submitted by "admin1@refinext-test.com" and resolved by "power1@refinext-test.com"
    When I am authenticated as a "power_user" user with email "power1@refinext-test.com" in tenant "tenant-a"
    And I navigate to the Pending Approvals task list
    Then the pending task row for "fo@refinext-test.com" should show:
      | Field             | Expected                             |
      | User label        | "fo@refinext-test.com"               |
      | By label          | "admin1@refinext-test.com"           |
      | Submitted label   | contains "ago"                       |
      | Expiry countdown  | "Expires in" with a remaining value  |
      | Action button     | visible (approver has authority)     |
    And the resolved task row should show a "Resolved" timestamp and no action button
    When I am authenticated as "admin1@refinext-test.com" in tenant "tenant-a"
    And I navigate to the Pending Approvals task list
    Then the pending task row for "fo@refinext-test.com" should show the label "You submitted this request"
    And the countersign action button should not be visible for the initiating user

  # ---------------------------------------------------------------------------
  # UI — AC-01, AC-08
  # Figma: Approval detail dialog (node 576:51782, width 480px)
  # The review dialog shown after clicking the action button must render all
  # sections from the Figma spec: ACTION (action type, affected user, tenant),
  # CHANGE (current role → proposed role with red/green visual diff),
  # SUBMISSION (submitted by, role at time, submitted at),
  # REASON FROM SUBMITTER (quoted justification in alert block),
  # REQUEST CHAIN (collapsible re-initiation history with status badges),
  # and the required "Your justification" textarea with
  # helper text "Required · stored in audit log".
  # Buttons: Cancel | Reject (destructive outline) + Approve (primary solid).
  # ---------------------------------------------------------------------------

  @ui @ac-01 @ac-08 @p1
  Scenario: Approval detail dialog displays all required sections with correct copy and visual diff (AC-01, AC-08)
    Given a pending Four-Eyes approval request exists for a "Role change" action in tenant "tenant-a"
    And the request targets "fo@refinext-test.com" changing role from "Front office" to "Back office"
    And the request was submitted by "admin1@refinext-test.com" with justification "Operational requirement"
    And I am authenticated as a "power_user" user with email "power1@refinext-test.com" in tenant "tenant-a"
    When I navigate to the Pending Approvals task list
    And I click the action button on the pending task for "fo@refinext-test.com"
    Then the approval detail dialog should open
    And the dialog header should show title "Role change"
    And the dialog header should show the subtitle "Approval requires step-up MFA verification"
    And the ACTION section should show:
      | Field         | Expected         |
      | Action type   | "Role change"    |
      | Affected user | "fo@refinext-test.com" |
      | Tenant        | "tenant-a"       |
    And the CHANGE section should display a "CURRENT" box with "Front office" in red styling
    And the CHANGE section should display a "PROPOSED" box with "Back office" in green styling
    And the SUBMISSION section should show submitted-by "admin1@refinext-test.com" and submitted-at timestamp
    And the "REASON FROM SUBMITTER" section should show "Operational requirement" in a quoted alert block
    And the REQUEST CHAIN section should be visible with at least one history entry
    And the "Your justification" textarea should be present and empty
    And the helper text "Required · stored in audit log" should be visible beneath the textarea
    And the footer should show buttons "Cancel", "Reject" (destructive), and "Approve" (primary)
    When I click "Approve" without entering a justification
    Then the "Your justification" field should show a validation error
    And the dialog should not proceed to the OTP step

  # ---------------------------------------------------------------------------
  # UI — AC-09 (FIXME — design complete, FE deferred pending PRD1042-75)
  # Figma: Step-up OTP dialog approve (node 576:51394) / reject (576:52579)
  # After entering a justification and clicking Approve or Reject in the detail
  # dialog, the flow must present a "Step up verification required" dialog with:
  # - subtitle: "You're about to approve a sensitive change. Confirm it's really you."
  # - "YOU ARE APPROVING" label + user card (action summary)
  # - "Enter 6-digit code" OTP input (6 individual digit boxes)
  # - "Didn't receive it? Resend code" link
  # - Footer: Cancel + "Confirm approval" (approve path) / "Confirm rejection" (reject path)
  # This scenario is tagged @fixme — mark as test.fixme in the Playwright spec
  # until PRD1042-75 ships and the FE OTP dialog is implemented.
  # ---------------------------------------------------------------------------

  @ui @ac-09 @p1 @fixme
  Scenario: Step-up OTP dialog is presented after clicking Approve or Reject in the detail dialog (AC-09)
    Given a pending Four-Eyes approval request exists for "fo@refinext-test.com" in tenant "tenant-a"
    And I am authenticated as a "power_user" in tenant "tenant-a"
    And I have opened the approval detail dialog and entered a justification
    When I click "Approve" in the detail dialog footer
    Then the step-up verification dialog should open
    And the dialog title should be "Step up verification required"
    And the subtitle should be "You're about to approve a sensitive change. Confirm it's really you."
    And the "YOU ARE APPROVING" section should show the affected user and action summary
    And the OTP input should show 6 individual digit boxes
    And the link "Resend code" should be visible
    And the footer should show "Cancel" and "Confirm approval" buttons
    When I enter a valid 6-digit OTP
    And I click "Confirm approval"
    Then the approval should be submitted and the approval request status should change to "APPROVED"
    When I re-open a pending task and click "Reject" in the detail dialog footer
    Then the step-up verification dialog should open
    And the footer confirm button label should be "Confirm rejection"

  # ---------------------------------------------------------------------------
  # UI — AC-01
  # Figma: Step-up OTP rejection dialog (node 576:52579)
  # Rejection flow mirrors the approval flow structure: same detail dialog
  # (with Reject button triggering OTP step-up) and same OTP dialog layout
  # with "Confirm rejection" CTA replacing "Confirm approval".
  # Validates that the design is symmetric and rejection is a first-class flow.
  # ---------------------------------------------------------------------------

  @ui @ac-01 @p1
  Scenario: Rejection flow mirrors approval flow — detail dialog, justification, and Confirm rejection CTA (AC-01)
    Given a pending Four-Eyes approval request exists for "fo@refinext-test.com" in tenant "tenant-a"
    And I am authenticated as a "power_user" in tenant "tenant-a"
    When I open the approval detail dialog for "fo@refinext-test.com"
    And I enter a rejection justification in "Your justification"
    And I click "Reject" in the detail dialog footer
    Then the approval request status should change to "REJECTED"
    And an audit event should be recorded with action "REJECT", approver identity, and the entered justification
    And the "fo@refinext-test.com" user status should not change (rejection blocks the lifecycle transition)
```
