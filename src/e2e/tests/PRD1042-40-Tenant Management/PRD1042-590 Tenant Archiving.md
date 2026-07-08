# PRD1042-590 — US 29.9 | Tenant Management | Tenant Archiving / Decommissioning

Generated: 2026-07-07
Story: PRD1042-590 — US 29.9 | Tenant Management | Tenant Archiving / Decommissioning
Epic: PRD1042-40 — Epic 29: Tenant Management
DoR status: PASS (18 ACs, description present, stakeholder-reviewed, Jira status "QA in progress")
ACs with Gherkin scenarios: 6 of 18 | Blocked: 6 (PRD1042-77, PRD1042-1105, TM-11, D-Integration, D-Audit, D-EventBus) | Excluded: 6 (edge-case or separate-feature — scope filter table only)
Figma design: Node 84:5370 (ARCHIVE section) on canvas 78:7403, file 7pygkopuqyeEhUTMVp9lrP — Screen "Tenant Suspend, Reactivate, Archive" (Stage 2 FAILED — Figma plan quota exhausted; ARCHIVE section (84:5370) not extractable. REACTIVATE sibling section (84:5369) from PRD1042-589 available as closest design reference — see design gap notes.)

**Updated 2026-07-08:** Added Bank Admin role (`bank_admin`) support per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Bank Admin cannot archive tenants (platform-only).

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                | Blocking dependency                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| AC-04 | Integration binding decommission (active=false, credential invalidation, timestamp) executes at integration layer; E2E cannot deterministically observe teardown      | TM-11 — integration binding decommission implementation                    |
| AC-05 | Rejection of inbound integration events post-archive requires an inbound-event fixture at the integration layer                                                       | D-Integration — inbound integration event injection fixture                |
| AC-06 | Read-only mode of archived tenant is currently violated — edit actions remain enabled per open bug PRD1042-1105; cannot assert absence of edit controls until bug fix | PRD1042-1105 — Edit actions remain enabled for archived tenants (open bug) |
| AC-13 | Actor independence enforced by PRD1042-77; requires Four-Eyes wiring to countersign step to reject self-countersign at server                                         | PRD1042-77 — Four-Eyes approval framework                                  |
| AC-17 | Audit event verification (TENANT_ARCHIVED, INTEGRATION_BINDING_DECOMMISSIONED) requires audit-log read fixture                                                        | D-Audit — audit log inspection fixture                                     |
| AC-18 | `tenant.archived` event bus emission is a backend contract; no E2E-observable UI surface                                                                              | D-EventBus — event bus inspection fixture                                  |

---

## AC Scope Filter

| AC    | Description                                                                                                                             | Classification     | Rationale                                                                                                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Only Suspended tenants can be archived; Active/Draft/Provisioning → 422                                                                 | `happy-path`       | Precondition for archive workflow: Archive action available on Suspended tenant, opens "Archive tenant" modal (design UNVERIFIED, inferred from REACTIVATE sibling 84:5369)                                                                   |
| AC-02 | Two-Actor Approval via PRD1042-77 with governance justification + irreversibility acknowledgement                                       | `Blocked`          | Countersignature step requires PRD1042-77 wiring; happy-path Outline sets up the flow but full end-to-end countersign is Blocked                                                                                                              |
| AC-03 | On countersign: tenant → Archived/Decommissioned, NewBusinessAllowed=false                                                              | `happy-path`       | Terminal assertion of happy-path Outline once countersign completes (status = Archived, NBA = false)                                                                                                                                          |
| AC-04 | Integration binding decommissioned — active=false, credentials invalidated, timestamp recorded                                          | `Blocked`          | Integration layer teardown not E2E observable at UI; requires TM-11 backend implementation                                                                                                                                                    |
| AC-05 | Inbound integration events for archived tenant rejected at integration layer (HTTP 4xx + operational alert)                             | `Blocked`          | Requires inbound-event injection fixture (D-Integration) to synthesize post-archive traffic                                                                                                                                                   |
| AC-06 | Tenant enters read-only mode; no operational actions permitted by any role                                                              | `Blocked`          | Open bug PRD1042-1105 — edit actions remain enabled for archived tenants; AC un-testable at UI level until bug is fixed                                                                                                                       |
| AC-07 | Archiving is terminal — no further lifecycle transitions                                                                                | `separate-feature` | Terminal-state guarantee verified via absence of any state-transition action from Archived elsewhere (US 29.x lifecycle stories)                                                                                                              |
| AC-08 | Historical business objects, audit records, governance logs preserved                                                                   | `separate-feature` | Data preservation is a BE data-integrity / audit test, not E2E UI                                                                                                                                                                             |
| AC-09 | Physical data deletion NOT triggered by archive; separate governed operation subject to retention + Legal Hold                          | `separate-feature` | Deletion pathway is a separate feature (retention/GDPR engine, POST-NOVEMBER deferred)                                                                                                                                                        |
| AC-10 | Governance Justification: long text, mandatory, min 50 chars                                                                            | `main-error`       | Blocks initiation when validation fails — Submit disabled or error shown. Note: Justification field UI copy UNVERIFIED (design gap)                                                                                                           |
| AC-11 | Irreversibility Acknowledgement checkbox — mandatory, "I confirm this action is irreversible", Submit disabled until checked            | `happy-path`       | Gating control for Submit — happy-path must set the checkbox; separate scenario asserts Submit is disabled until checkbox is checked                                                                                                          |
| AC-12 | Active User Account Acknowledgement checkbox — conditional (when tenant has active/suspended users), mandatory when shown, non-blocking | `edge-case`        | Conditional rendering — requires reliable tenant-with-users fixture; UI presence-only, does not block archive                                                                                                                                 |
| AC-13 | Actor independence enforced by PRD1042-77 (initiator ≠ countersignatory)                                                                | `Blocked`          | Server-side rejection requires Four-Eyes wiring (PRD1042-77)                                                                                                                                                                                  |
| AC-14 | Read access to archived data — Admin + Auditor confirmed; Support role ambiguous; Bank Admin own-tenant read ambiguous                  | `edge-case`        | Support-role read access pending product decision (Vesna Plakalovic 2026-06-10 comment 36743) — `@pending` scenario. Bank Admin own-tenant archived read parallel ambiguity per PRD1042-48 (Ivan Mladenovic 2026-07-06) — `@pending` scenario |
| AC-15 | Archive action only for System Admin; HTTP 404 to all other roles (enumeration prevention) — including Bank Admin (platform-only)       | `main-error`       | RBAC + 404-not-403 domain rule; @e2e-ready with seeded per-role users. Bank Admin (`bank_admin`) added 2026-07-08 per PRD1042-48 — tenant archiving is platform-only, Bank Admin cannot initiate                                              |
| AC-16 | Legal Hold Flag=true suspends automated retention-driven deletion regardless of schedule                                                | `separate-feature` | Retention/Legal Hold behavior is a separate feature (GDPR retention engine, POST-NOVEMBER deferred)                                                                                                                                           |
| AC-17 | Audit events TENANT_ARCHIVED + INTEGRATION_BINDING_DECOMMISSIONED emitted                                                               | `Blocked`          | Audit log inspection requires D-Audit fixture                                                                                                                                                                                                 |
| AC-18 | Emits `tenant.archived` event to Integration routing layer + User Management                                                            | `Blocked`          | Event bus emission requires D-EventBus fixture                                                                                                                                                                                                |

**Gherkin generated for:** AC-01, AC-03, AC-10, AC-11, AC-15
**Blocked (no Gherkin):** AC-02, AC-04, AC-05, AC-06, AC-13, AC-17, AC-18
**No Gherkin (edge-case or separate-feature):** AC-07, AC-08, AC-09, AC-12, AC-14, AC-16

---

## Scenarios summary

| Tag           | Scenario                                                                                                                  | AC                  | Priority | E2E                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ------------------------------------------------------------------------------- |
| `@happy-path` | System Admin archives Suspended tenant with valid justification and irreversibility acknowledgement                       | AC-01, AC-03, AC-11 | P0       | ⚙️ needs PRD1042-77 countersign fixture + PRD1042-1105 bug fix (read-only mode) |
| `@happy-path` | Submit button is disabled until Irreversibility Acknowledgement checkbox is checked                                       | AC-11               | P0       | ⚙️ needs ARCHIVE modal design verification (Figma quota)                        |
| `@main-error` | Governance justification below 50 characters is rejected                                                                  | AC-10               | P0       | ✅                                                                              |
| `@main-error` | Governance justification empty is rejected                                                                                | AC-10               | P0       | ✅                                                                              |
| `@main-error` | Archive attempted on non-Suspended tenant returns 422 Invalid transition                                                  | AC-01               | P0       | ✅                                                                              |
| `@main-error` | Non-System-Admin roles (incl. Bank Admin) receive HTTP 404 on archive endpoint (enumeration prevention)                   | AC-15               | P0       | ✅ `@e2e-ready`                                                                 |
| `@pending`    | Support-role read access to archived tenant — awaiting product decision (Vesna Plakalovic 2026-06-10)                     | AC-14               | P1       | ⚙️ pending product decision                                                     |
| `@pending`    | Bank Admin read access to own tenant's archived data — awaiting product decision (PRD1042-48, Ivan Mladenovic 2026-07-06) | AC-14               | P1       | ⚙️ pending product decision                                                     |

Active scenario blocks: 8 (2 Scenarios + 6 Scenario Outlines/Scenarios, incl. 2 @pending)
E2E automation candidates: 3 of 6 active scenarios ✅

---

## Feature file

```gherkin
@tenant-management @us-29.9 @p0
Feature: Tenant Archiving / Decommissioning (US 29.9 — PRD1042-590)
  As a System Admin
  I want to archive a Suspended tenant with mandatory justification and irreversibility acknowledgement, subject to Four-Eyes countersign
  So that the tenant is terminally decommissioned, integration bindings are torn down, and historical data is preserved read-only

  # Design status note:
  # Stage 2 FAILED — Figma plan quota exhausted; ARCHIVE section (84:5370) not extractable.
  # REACTIVATE sibling section (84:5369) from PRD1042-589 is the closest available reference:
  # verified modal pattern includes read-only Tenant/Current-status fields, Cancel + Submit
  # buttons, and post-submit copy "A second admin must approve before it takes effect".
  # ARCHIVE-specific copy (modal title, Irreversibility checkbox text, Active User
  # Acknowledgement conditional, ARCHIVED VIEW read-only screen, ERROR-section rejection
  # copy) is UNVERIFIED. Scenarios below use pattern-based assertions where design copy
  # would normally anchor selectors.

  Background:
    Given the tenant lifecycle module is available
    And Four-Eyes approval framework (PRD1042-77) is wired for tenant-archive operations
    And I am logged in as a System Admin

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-03, AC-11
  # System Admin initiates archive on a Suspended tenant with a valid justification
  # (min 50 chars per AC-10) and the mandatory Irreversibility Acknowledgement checked.
  # Post-countersign, tenant transitions to Archived/Decommissioned with
  # NewBusinessAllowed=false. Blocked by PRD1042-77 (countersign) and PRD1042-1105
  # (post-archive read-only-mode assertion). Design copy for the ARCHIVE modal is
  # UNVERIFIED — inferred from REACTIVATE sibling section (84:5369).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-03 @ac-11 @p0
  Scenario: System Admin archives Suspended tenant with valid justification and irreversibility acknowledgement (AC-01, AC-03, AC-11)
    Given a tenant "acme-corp" exists with status "Suspended"
    When I open the tenant "acme-corp" detail page
    And I click the "Archive tenant" action
    Then the "Archive tenant" modal is displayed
    And the modal shows the tenant "acme-corp" and current status "Suspended" as read-only
    When I enter a governance justification of at least 50 characters
    And I check the "I confirm this action is irreversible" checkbox
    And I click "Submit for archive"
    Then the initiation is accepted and awaits countersign
    When a second System Admin countersigns the archive request
    Then tenant "acme-corp" status becomes "Archived"
    And the NewBusinessAllowed flag for tenant "acme-corp" is false

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-11
  # Submit is gated by the Irreversibility Acknowledgement checkbox. Until the
  # checkbox is checked, Submit must be disabled — this is the primary UI safeguard
  # for a terminal operation. Design copy for the checkbox is UNVERIFIED.
  # ---------------------------------------------------------------------------

  @happy-path @ac-11 @p0
  Scenario: Submit button is disabled until Irreversibility Acknowledgement checkbox is checked (AC-11)
    Given a tenant "acme-corp" exists with status "Suspended"
    When I open the "Archive tenant" modal for "acme-corp"
    And I enter a governance justification of at least 50 characters
    And the Irreversibility Acknowledgement checkbox is unchecked
    Then the "Submit for archive" button is disabled
    When I check the "I confirm this action is irreversible" checkbox
    Then the "Submit for archive" button becomes enabled

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10 (justification validation)
  # Governance Justification is mandatory and must be at least 50 characters (the
  # longest of any tenant lifecycle story — suspension 30, reactivation 20).
  # Two scenarios: below-minimum and empty. Both are API-level testable regardless
  # of the ARCHIVE modal design gap.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0 @e2e-ready
  Scenario: Governance justification below 50 characters is rejected (AC-10)
    Given a tenant "acme-corp" exists with status "Suspended"
    When I open the "Archive tenant" modal for "acme-corp"
    And I enter a governance justification of 49 characters
    And I check the "I confirm this action is irreversible" checkbox
    And I attempt to submit the archive
    Then the initiation is rejected with a validation error
    And the error indicates the justification must be at least 50 characters

  @main-error @ac-10 @p0 @e2e-ready
  Scenario: Governance justification empty is rejected (AC-10)
    Given a tenant "acme-corp" exists with status "Suspended"
    When I open the "Archive tenant" modal for "acme-corp"
    And I leave the governance justification empty
    And I check the "I confirm this action is irreversible" checkbox
    And I attempt to submit the archive
    Then the initiation is rejected with a validation error
    And the error indicates that governance justification is required

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-01 (invalid state transition)
  # Only Suspended tenants can be archived. All other lifecycle states must be
  # rejected server-side with 422. Scenario Outline exercises the four other
  # states in a single Outline; direct Active → Archived is explicitly called out
  # in the AC.
  # ---------------------------------------------------------------------------

  @main-error @ac-01 @p0 @e2e-ready
  Scenario Outline: Archive attempted on non-Suspended tenant returns 422 (AC-01)
    Given a tenant "acme-corp" exists with status <state>
    When I attempt to initiate archive on tenant "acme-corp"
    Then the archive is rejected with HTTP 422
    And the tenant "acme-corp" remains in status <state>

    Examples:
      | state          |
      | Draft          |
      | Provisioning   |
      | Active         |
      | Archived       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15 (RBAC + 404-not-403)
  # Archive action is available only to System Admin. All other roles must
  # receive HTTP 404 (not 403) — per RefiNext domain rule for enumeration
  # prevention. Fully E2E-ready with seeded per-role users; requires no
  # additional test endpoints beyond the standard fixture set.
  # Bank Admin (`bank_admin`) added 2026-07-08 per PRD1042-48 (Ivan Mladenovic
  # 2026-07-06): tenant archiving is a platform-level operation. Bank Admin is
  # tenant-scoped (`bank_tenant`) and cannot archive any tenant — its own or
  # any other. Same 404 enumeration-prevention rule applies.
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @p0 @e2e-ready
  Scenario Outline: Non-System-Admin roles receive HTTP 404 on archive endpoint (AC-15)
    Given a tenant "acme-corp" exists with status "Suspended"
    And I am logged in as <role>
    When I attempt to initiate archive on tenant "acme-corp"
    Then the response status is 404
    And the response does not disclose whether tenant "acme-corp" exists

    Examples:
      | role                 |
      | Bank Admin           |
      | Front Office         |
      | Back Office          |
      | Leasing Company User |
      | Support User         |
      | Auditor              |

  # ---------------------------------------------------------------------------
  # PENDING — AC-14 (Support-role read access)
  # AC-14 confirms Admin + Auditor have read access to archived data. Support
  # role read access is ambiguous per Vesna Plakalovic 2026-06-10 (comment
  # 36743). Scenario is tagged @pending — no execution until product decision
  # confirms Support inclusion or exclusion.
  # ---------------------------------------------------------------------------

  @pending @ac-14 @p1
  Scenario: Support-role read access to archived tenant — awaiting product decision (AC-14)
    Given a tenant "acme-corp" exists with status "Archived"
    And I am logged in as Support User
    When I open the tenant "acme-corp" detail page
    Then the outcome is determined by product decision (allow read-only OR deny with 404)

  # ---------------------------------------------------------------------------
  # PENDING — AC-14 (Bank Admin read access to own archived tenant)
  # Parallel ambiguity to Support-role read access: AC-14 names only System Admin
  # and Auditor as guaranteed read access to archived data. Bank Admin
  # (`bank_admin`) is tenant-scoped (`bank_tenant`) — the question is whether a
  # Bank Admin retains read access to its own tenant's archived data after the
  # tenant is decommissioned. The spec does not explicitly exclude own-tenant
  # read for Bank Admin, but it also does not include Bank Admin in AC-14's
  # allow-list. Same ambiguity pattern as Support (Vesna Plakalovic 2026-06-10
  # comment 36743). Added 2026-07-08 per PRD1042-48 (Ivan Mladenovic 2026-07-06).
  # ---------------------------------------------------------------------------

  @pending @ac-14 @p1
  Scenario: Bank Admin read access to own tenant's archived data — awaiting product decision (AC-14)
    Given a tenant "bank-a" exists with status "Archived"
    And I am logged in as Bank Admin of tenant "bank-a"
    When I open the tenant "bank-a" detail page
    Then the outcome is determined by product decision (allow read-only own-tenant view OR deny with 404)
```
