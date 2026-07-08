# PRD1042-588 — US 29.7 | Tenant Management | Tenant Suspension Flow

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin cannot suspend tenants (platform-only).

Generated: 2026-07-07
Story: PRD1042-588 — US 29.7 | Tenant Management | Tenant Suspension Flow
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (14 ACs, description present, stakeholder-reviewed, Jira status "QA in progress")
ACs with Gherkin scenarios: 5 of 14 | Blocked: 6 (PRD1042-77 Four-Eyes framework, Workflow Engine seam, Integration harness, User Management event contract, D-Audit) | Excluded: 3 (AC-07, AC-09, AC-13 — edge-case or separate-feature — scope filter table only)
Figma design: Node 81:2893 (SUSPEND) + 84:5372 (ERROR), file 7pygkopuqyeEhUTMVp9lrP — Screen "Tenant Suspend, Reactivate, Archive" (Stage 2 FAILED — Figma Professional plan quota exhausted; Retry-After ≈ 4 days. Closest available design reference: REACTIVATE sibling section 84:5369 from PRD1042-589 pipeline — see Design Blind notes in scenario comment blocks)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                              | Blocking dependency                                    |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| AC-02 | Two-Actor countersign flow depends on governance framework being wired end-to-end                   | PRD1042-77 (Four-Eyes framework)                       |
| AC-04 | In-flight workflow non-cancellation cannot be observed without seeded in-flight work                | Workflow Engine seam + seeded fixtures                 |
| AC-05 | Read-only queue visibility for System Admin / Back Office / Risk requires Workflow Engine UI + seed | Workflow Engine seam + queue UI                        |
| AC-06 | Inbound-accepted / outbound-blocked routing verification requires integration harness               | Integration harness (inbound + outbound event capture) |
| AC-11 | Self-countersign block is enforced server-side by Four-Eyes framework                               | PRD1042-77 (Four-Eyes framework)                       |
| AC-12 | Downstream event propagation (User Management login block, integration routing) not observable E2E  | PRD1042-77 + User Management event contract + M-Integ  |

---

## AC Scope Filter

| AC    | Description                                                                                                                      | Classification     | Rationale                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| AC-01 | System Admin initiates suspension on Active tenant only                                                                          | `happy-path`       | Core initiation flow — testable from tenant detail view (list-view init blocked by PRD1042-1102)                    |
| AC-02 | Two-Actor Approval; governance to PRD1042-77                                                                                     | `Blocked`          | Countersign step requires Four-Eyes framework wiring (PRD1042-77) — happy-path initiation covers Actor 1 only       |
| AC-03 | On approval: tenant → Suspended, `NewBusinessAllowed=false`, `TenantOperationalReadiness=false`                                  | `happy-path`       | Terminal state verifiable via tenant detail after countersign completes (design-blind on badge copy)                |
| AC-04 | In-flight workflows not cancelled                                                                                                | `Blocked`          | Requires Workflow Engine seam + seeded in-flight workflows — no fixture support today                               |
| AC-05 | In-flight workflows read-only to System Admin + authorized Back Office / Risk via Workflow Engine queue                          | `Blocked`          | Requires Workflow Engine queue UI + seed; no design provided                                                        |
| AC-06 | Inbound integration events continue accepted; outbound triggers blocked                                                          | `Blocked`          | Requires integration harness (inbound + outbound event capture); not user-visible                                   |
| AC-07 | Audit-trail writes remain active for suspended tenants                                                                           | `separate-feature` | Belongs to Audit Trail Service feature spec — cross-cutting behavior tested with audit tooling                      |
| AC-08 | Governance Justification: Long text, Mandatory, min 30 chars. Recorded in audit event                                            | `main-error`       | Validation testable at API layer; UI copy design-blind (Figma quota exhausted). Audit persistence blocked (D-Audit) |
| AC-09 | Effective From: DateTime, Optional, defaults to immediate                                                                        | `separate-feature` | DEFERRED per Ivan Mladenovic 2026-06-29 — MVP always immediate; belongs to future scheduled-lifecycle feature       |
| AC-10 | Tenant must be Active. Non-Active transitions return 422 Invalid transition                                                      | `main-error`       | State-machine guard — testable via API against Draft, Provisioning, Suspended, Archived tenants                     |
| AC-11 | Actor independence enforced by PRD1042-77                                                                                        | `Blocked`          | Server-side enforcement via Four-Eyes framework (PRD1042-77) — cannot be exercised until framework is wired         |
| AC-12 | On countersign: tenant → Suspended; `tenant.suspended` published; User Management blocks new logins; integration routing updated | `Blocked`          | Downstream event propagation requires PRD1042-77 + User Management contract + integration harness                   |
| AC-13 | Audit event TENANT_SUSPENDED: tenant, actor, countersignatory, justification, Effective From, timestamp UTC                      | `separate-feature` | Belongs to Audit Trail Service feature — persistence verification requires D-Audit tooling                          |
| AC-14 | Security: only System Admin. HTTP 404 to all other roles                                                                         | `main-error`       | RBAC 404-not-403 pattern testable via API/route assertions across all non-admin roles                               |

**Gherkin generated for:** AC-01, AC-03, AC-08, AC-10, AC-14
**Blocked (no Gherkin):** AC-02, AC-04, AC-05, AC-06, AC-11, AC-12
**No Gherkin (edge-case or separate-feature):** AC-07, AC-09, AC-13

---

## Scenarios summary

| Tag           | Scenario                                                                                                             | AC           | Priority | E2E                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | ------------ | -------- | -------------------------------------- |
| `@happy-path` | System Admin initiates suspension on Active tenant from detail view                                                  | AC-01, AC-03 | P0       | ⚙️ needs PRD1042-1102 fix + PRD1042-77 |
| `@main-error` | Governance Justification validation (Outline — empty, whitespace-only, below-min length)                             | AC-08        | P0       | ⚙️ needs API test harness              |
| `@main-error` | Non-Active tenant returns 422 Invalid transition (Outline — Draft, Provisioning, Suspended, Archived)                | AC-10        | P0       | ⚙️ needs multi-state fixtures          |
| `@main-error` | Non-System-Admin roles receive HTTP 404 (Outline — Bank Admin, Front Office, Back Office, LC User, Support, Auditor) | AC-14        | P0       | ✅                                     |
| `@main-error` | Suspension initiator cannot countersign own request (self-countersign blocked)                                       | AC-11        | P0       | ⚙️ needs PRD1042-77 wiring             |

Active scenario blocks: 5 (3 Outlines + 2 Scenarios)
E2E automation candidates: 1 of 5 scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.7 @p0
Feature: Tenant Suspension Flow (US 29.7 — PRD1042-588)
  As a System Admin
  I want to suspend an Active tenant with a countersigned Four-Eyes approval
  So that new business is blocked while in-flight work continues under supervised read-only access

  Background:
    Given the Refinext platform is running and authenticated sessions can be established
    And an Active tenant "TN-ACT-001" (New Group Trade) exists with no pending module activations
    And I am logged in as a System Admin (platform-level Crosslease role, not bank Power User)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03
  # System Admin initiates suspension from the tenant detail view.
  # AC-02 countersign step is Blocked pending PRD1042-77 wiring — this scenario
  # covers Actor 1 submission only; countersign approval is a separate spec.
  # DESIGN BLIND: SUSPEND modal copy could not be extracted from Figma
  # (Professional plan quota exhausted; Retry-After ≈ 4 days). Closest available
  # pattern reference is the REACTIVATE sibling section 84:5369 which used:
  # title "Reactivate tenant", fields "Tenant" + "Current status", buttons
  # "Cancel" / "Submit for reactivation", post-submit "A second admin must
  # approve before it takes effect". SUSPEND expected to mirror. Verify copy
  # against Figma once budget resets.
  # KNOWN BUGS: PRD1042-1102 (list-view init broken → initiate from detail view
  # only). PRD1042-1100 (pending module activation blocks suspension → fixture
  # tenant must have no pending module activations).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @p0
  Scenario: System Admin initiates suspension on Active tenant from detail view (AC-01, AC-03)
    Given I am viewing the tenant detail page for "TN-ACT-001"
    And the tenant's lifecycle status is "Active"
    When I trigger the "Suspend tenant" action from the detail view
    And I supply a governance justification with at least 30 characters
    And I submit the suspension request
    Then the request should be created in a pending-approval state awaiting a second System Admin
    And the tenant lifecycle status should remain "Active" until the countersign completes
    And I should see confirmation that a second admin must approve before the suspension takes effect
    # Post-countersign assertions (blocked pending PRD1042-77):
    #   - tenant lifecycle → "Suspended"
    #   - NewBusinessAllowed = false
    #   - TenantOperationalReadiness = false

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Governance Justification is mandatory, long text, min 30 chars, recorded in
  # audit event. Persistence check to audit event is Blocked (D-Audit).
  # DESIGN BLIND: Justification field UI (label, placeholder, character-count
  # helper) not visible in cached REACTIVATE section either — may live on a
  # wizard step not captured. Assertions target API validation only.
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario Outline: Governance Justification validation rejects invalid input (AC-08)
    Given I am initiating a suspension request on Active tenant "TN-ACT-001"
    When I submit the request with justification "<justification_input>"
    Then the request should be rejected with a validation error
    And the response should indicate the justification field is invalid
    And the tenant lifecycle status should remain "Active"

    Examples:
      | justification_input                                                                 |
      |                                                                                     |
      |                                                                                     |
      | too short                                                                           |
      | 29-character justification!                                                         |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Only Active tenants may be suspended. All other lifecycle states must
  # return HTTP 422 "Invalid transition". Fixture setup requires one tenant
  # in each non-Active state.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario Outline: Suspending non-Active tenant returns 422 Invalid transition (AC-10)
    Given a tenant "<tenant_id>" exists with lifecycle status "<state>"
    When I attempt to initiate a suspension request on tenant "<tenant_id>"
    Then the response status should be 422
    And the response should indicate an invalid state transition
    And the tenant lifecycle status should remain "<state>"

    Examples:
      | tenant_id    | state          |
      | TN-DRAFT-001 | Draft          |
      | TN-PROV-001  | Provisioning   |
      | TN-SUSP-001  | Suspended      |
      | TN-ARCH-001  | Archived       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14
  # Only System Admin (platform-level Crosslease role per Philipp Maute
  # 2026-07-01) may access the suspension flow. All other roles — including
  # the bank-tenant Bank Admin (`bank_admin`, User Type: `bank_tenant`) per
  # PRD1042-48 (Ivan Mladenovic 2026-07-06) — receive HTTP 404. Tenant
  # suspension is a platform-only action; Bank Admin has no authority over
  # tenant lifecycle even for their own tenant (self-destructive; also
  # platform-scoped per governance model). RefiNext 404-not-403 pattern
  # prevents enumeration of tenant-scoped endpoints. Fully automatable —
  # uses seeded fixture users only.
  # ---------------------------------------------------------------------------

  @main-error @ac-14 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles receive HTTP 404 on suspension endpoint (AC-14)
    Given I am logged in as <role>
    When I attempt to access the suspension flow for tenant "TN-ACT-001"
    Then the response status should be 404
    And the response should NOT reveal that the tenant exists
    And the response should NOT contain "forbidden"

    Examples:
      | role                 |
      | Bank Admin           |
      | Front Office         |
      | Back Office          |
      | Leasing Company User |
      | Support User         |
      | Auditor              |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Four-Eyes actor-independence: the System Admin who initiated the
  # suspension cannot also countersign it. Enforcement is server-side via
  # PRD1042-77. Marked Blocked — scenario retained to document expected
  # behavior once PRD1042-77 is wired end-to-end.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Suspension initiator cannot countersign own request (AC-11)
    Given System Admin A has initiated a suspension request on Active tenant "TN-ACT-001"
    And the request is awaiting a second System Admin countersign
    When System Admin A attempts to countersign their own request
    Then the countersign attempt should be rejected on actor-independence grounds
    And the request should remain in pending-approval state
    And the tenant lifecycle status should remain "Active"
```
