# PRD1042-764 — US 13.18 | Partner Management | Assign Additional Non-Risk-Sensitive Role

Generated: 2026-07-08
Story: PRD1042-764 — US 13.18 | Partner Management | Assign Additional Non-Risk-Sensitive Role
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (10 ACs reconstructed from AC-referenced functional/validation/behavior/security specs, description present, stakeholder-reviewed, Ready for DEV Review — NOTE: an open partner-global-flag vs per-transaction-role model question is contested; scenarios written to current AC wording)
ACs with Gherkin scenarios: 6 of 10 | Blocked: 0 | Excluded: 4 (edge-case — scope filter table only)
Figma design: Node 21:11234, file PQVvNvRcoFac0zdHGaLWCg — Screen "Partner Management detail — role-management panel" (Stage 2 GOOD — real design frame; "ASSIGN ROLE" action + role badges "Assigned role Lessee/Guarantor/Supplier" + risk-sensitive "(pending counter-confirmation)" states confirmed)

---

## AC Scope Filter

| AC    | Description                                                                                                                | Classification | Rationale                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| AC-01 | FO assigns a non-risk-sensitive role flag (Lessee / Guarantor / Supplier) to an existing Partner → operational immediately | `happy-path`   | Core success flow; assign-role via the role-management panel                                             |
| AC-02 | Role Flag (enum) mandatory; Effective Note optional                                                                        | `happy-path`   | Field capture asserted within the assign flow                                                            |
| AC-03 | Multiple simultaneous roles permitted on one record; role-per-record duplication forbidden                                 | `happy-path`   | Multi-role-on-one-record with no duplicate Partner is a distinct success behavior (CP-5)                 |
| AC-04 | Assigning a role flag already present is idempotent; no duplicate                                                          | `main-error`   | Idempotency guard on duplicate assignment                                                                |
| AC-05 | Risk-sensitive roles (LG / Bank Entity / UBO) are NOT assignable single-actor; routed to US 13.06 Four-Eyes                | `main-error`   | State/routing guard — risk roles must not go operational via this path (design shows pending state)      |
| AC-06 | Only Front Office may assign; Sys Admin / BO/Risk / LC / Power User / Auditor rejected                                     | `main-error`   | Role-based-access domain rule → 1 auto negative scenario (unauthorized roles → 403)                      |
| AC-07 | Role assignments are append-only; historical assignments preserved                                                         | `edge-case`    | Append-only history invariant — verified at the data/audit layer                                         |
| AC-08 | Non-risk role flag becomes operational immediately; Notification optional                                                  | `edge-case`    | "Operational immediately" asserted in AC-01; the optional-notification detail is not a manual UI concern |
| AC-09 | Emits RoleAssigned event                                                                                                   | `edge-case`    | Internal event emission — integration-level                                                              |
| AC-10 | Assignment persisted transactionally with append-only history                                                              | `edge-case`    | Non-functional transactional-persistence guarantee — system-level                                        |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-07, AC-08, AC-09, AC-10 (edge-case)

---

## Scenarios summary

| Tag           | Scenario                                                                                                 | AC           | Priority | E2E                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------ | -------- | -------------------------------------- |
| `@happy-path` | FO assigns a non-risk-sensitive role and it becomes operational immediately (Scenario Outline — 3 roles) | AC-01, AC-02 | P0       | ⚙️ needs seeded Partner fixture        |
| `@happy-path` | Multiple non-risk-sensitive roles coexist on one Partner record without duplication                      | AC-03        | P0       | ⚙️ needs seeded Partner fixture        |
| `@main-error` | Assigning a role flag that is already present is idempotent                                              | AC-04        | P0       | ⚙️ needs seeded Partner with role      |
| `@main-error` | Risk-sensitive roles cannot be assigned through the single-actor path (Scenario Outline — 3 roles)       | AC-05        | P0       | ⚙️ needs seeded Partner fixture        |
| `@main-error` | Only Front Office may assign a non-risk-sensitive role (Scenario Outline — 5 roles)                      | AC-06        | P0       | ⚙️ needs seeded Partner + role mapping |

Active scenario blocks: 5 (3 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 5 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.18 @p0
Feature: Assign Additional Non-Risk-Sensitive Role (US 13.18 — PRD1042-764)
  As a Front Office case worker
  I want to assign an additional non-risk-sensitive role flag (Lessee, Guarantor, Supplier) to an existing Partner
  So that multi-role identity is governed per CP-5 without record duplication

  Background:
    Given I am authenticated as a Front Office case worker in an active tenant with the Partner Management module enabled
    And an existing canonical Confirmed Partner is open on the role-management panel

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # FO uses the ASSIGN ROLE action to add a non-risk-sensitive role flag; the
  # flag is added to the same canonical Partner, shown as an "Assigned role"
  # badge, and is operational immediately.
  # Design note: Stage 2 GOOD — ASSIGN ROLE action + role badges confirmed in Figma node 21:11234.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario Outline: FO assigns a non-risk-sensitive role and it becomes operational immediately (AC-01, AC-02)
    When I assign the role flag "<role>" with an optional effective note
    Then the "<role>" role flag is added to the same canonical Partner
    And an "Assigned role <role>" badge is shown
    And the role becomes operational immediately

    Examples:
      | role      |
      | Lessee    |
      | Guarantor |
      | Supplier  |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # Roles are flags on one canonical Partner: assigning a second non-risk role
  # adds another flag to the same record — no duplicate Partner is created (CP-5).
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario: Multiple non-risk-sensitive roles coexist on one Partner record without duplication (AC-03)
    Given the Partner already has the role flag "Lessee"
    When I assign the additional role flag "Supplier"
    Then both "Lessee" and "Supplier" role flags are present on the same canonical Partner
    And no duplicate Partner record is created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04 (idempotency)
  # Re-assigning a role flag the Partner already holds is a no-op; the append-only
  # assignment set gains no duplicate entry.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Assigning a role flag that is already present is idempotent (AC-04)
    Given the Partner already has the role flag "Guarantor"
    When I assign "Guarantor" again
    Then the operation is idempotent
    And no duplicate role assignment record is created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (risk-sensitive routing / state guard)
  # Risk-sensitive roles must not go operational via this single-actor path; they
  # route to the US 13.06 Four-Eyes counter-confirmation and show as pending.
  # Design corroborates a "(pending counter-confirmation)" badge state.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Risk-sensitive roles cannot be assigned through the single-actor path (AC-05)
    When I attempt to assign the risk-sensitive role "<risk_role>" through this panel
    Then the role is not made operational by single-actor assignment
    And it is routed to the Four-Eyes counter-confirmation path (US 13.06)
    And it is shown as "pending counter-confirmation"

    Examples:
      | risk_role          |
      | Leasing Company    |
      | Bank Entity        |
      | UBO-Related Person |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (role-based access, auto-applied domain rule)
  # Assigning a non-risk-sensitive role is backend-enforced and limited to Front
  # Office; every other role is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario Outline: Only Front Office may assign a non-risk-sensitive role (AC-06)
    Given an existing canonical Partner
    And I am authenticated as a "<role>" user
    When I attempt to assign a non-risk-sensitive role flag
    Then the request is rejected with HTTP 403
    And no role flag is added

    Examples:
      | role                    |
      | System Admin            |
      | BO/Risk                 |
      | LC User                 |
      | Power User (Bank Admin) |
      | Auditor                 |
```
