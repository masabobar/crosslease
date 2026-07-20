# PRD1042-788 — US 26.11 | AUDIT TRAIL | Entity-Scoped Audit Tab in Operational Cockpits

Generated: 2026-07-10
Story: PRD1042-788 — US 26.11 | AUDIT TRAIL | Entity-Scoped Audit Tab in Operational Cockpits
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (7 ACs derived from Functional Requirements + Validation Rules + Security Requirements + Permission Matrix, description present, spec v1.2 approved by Philipp Maute 2026-05-29, Jira status: Ready for DEV Review; FE child PRD1042-1015 QA ready)
ACs with Gherkin scenarios: 6 of 7 | Blocked: 1 (D-Scope-Fixture — Epic 30 scope resolution) | Excluded: 0
Figma design: Node 1:11090, file 7EkiVhANXOkn65k0jG4uEJ — Screen "E26 -- Audit Trail" (Stage 2 FAILED — Figma Professional plan quota exhausted this session; MCP tool call limit reached and no Bash access for REST fallback; proceeded design-blind on AC-text authority per Epic 29 precedent)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                    | Blocking dependency                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| AC-05 | Cross-scope enumeration requires two operational-scope variants (in-scope vs out-of-scope for the same FO/BO user) with a Contract/Financing/Partner entity partitioned across them — Epic 30 (Security/Access Control) has not defined the operational-scope resolution layer for MVP; without a fixture seeding "entity X belongs to scope A" and "entity Y belongs to scope B" the 404 assertion cannot be exercised deterministically | D-Scope-Fixture — Epic 30 operational-scope resolution + test-data seam ("FO user F1 owns entities in scope S1 only") |

---

## AC Scope Filter

| AC    | Description                                                                                                                             | Classification | Rationale                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Read-only audit-history tab embedded in each entity cockpit (Contract, Financing, Partner, Document) — visible to authorized roles      | `happy-path`   | Core surface — verify tab renders per cockpit for authorized roles and lists scoped audit records                                       |
| AC-02 | FO and BO/Risk users see audit history only for entities within their normal operational scope                                          | `happy-path`   | Positive scope path — verify FO/BO can open the tab on an in-scope entity and see records                                               |
| AC-03 | Role-aware field masking applied consistent with US 26.05                                                                               | `main-error`   | Restricted-info exposure risk — verify sensitive fields are masked for FO/BO in cockpit tab (unmasking path not available from cockpit) |
| AC-04 | Tab is never visible to LC users in any cockpit                                                                                         | `main-error`   | Absolute visibility rule — LC users must NOT see the audit tab regardless of cockpit                                                    |
| AC-05 | FO/BO cannot enumerate audit records for entities they cannot see operationally; cross-scope access blocked at the API layer (AC-AT-A4) | `Blocked`      | Needs D-Scope-Fixture (Epic 30 scope resolution + fixture seeding out-of-scope entity for the FO/BO user)                               |
| AC-06 | LC tokens receive no audit data from any audit endpoint (AC-AT-A3)                                                                      | `main-error`   | API-layer denial for LC token even if endpoint is called directly — bypasses UI absence                                                 |
| AC-07 | Tab is read-only; no mutation affordance exists (Permission Matrix "Any mutation ✗" for every role)                                     | `main-error`   | Read-only invariant — verify no mutation UI (edit/delete/create/unmask buttons) and any mutation API call returns 4xx                   |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-06, AC-07
**Blocked (no Gherkin):** AC-05
**No Gherkin (edge-case or separate-feature):** none

---

## Scenarios summary

| Tag           | Scenario                                                                                                                         | AC           | Priority | E2E                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------- | -------------------------------- |
| `@happy-path` | Authorized roles see read-only audit tab on entity cockpit (Scenario Outline — 4 role variants × 4 cockpit types)                | AC-01, AC-02 | P0       | ✅                               |
| `@happy-path` | FO/BO user sees audit history for in-scope entity (Scenario Outline — 2 role variants)                                           | AC-02        | P0       | ⚙️ needs D-Scope-Fixture         |
| `@main-error` | Sensitive fields are masked in cockpit audit tab per role (Scenario Outline — 3 role variants)                                   | AC-03        | P0       | ⚙️ needs US 26.05 masking config |
| `@main-error` | LC user never sees audit tab on any cockpit (Scenario Outline — 4 cockpit variants)                                              | AC-04        | P0       | ✅                               |
| `@main-error` | LC token receives no audit data from any audit endpoint (Scenario Outline — 3 endpoint variants)                                 | AC-06        | P0       | ✅                               |
| `@main-error` | Cockpit audit tab exposes no mutation affordance and rejects mutation API calls (Scenario Outline — 3 mutation-attempt variants) | AC-07        | P0       | ✅                               |

Active scenario blocks: 6 (6 Scenario Outlines)
E2E automation candidates: 4 of 6 scenarios ✅

---

## Feature file

```gherkin
@audit-trail @us-26.11 @p0
Feature: Entity-Scoped Audit Tab in Operational Cockpits (US 26.11 — PRD1042-788)
  As a Front Office / Back Office user
  I want a scoped, read-only audit-history tab within each entity cockpit
  So that I can review the history of objects within my operational scope
  without accessing the full investigation surface

  Background:
    Given the RefiNext platform is available
    And the following entity cockpits exist: Contract, Financing, Partner, Document
    And the audit store contains historical records for each entity type
    And role-aware field masking is configured per US 26.05
    And operational scope is resolved via the platform authorization layer (Epic 30)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # Verifies that authorized roles (System/Power User, Auditor, FO, BO/Risk,
  # Support) can open an entity cockpit and see the read-only audit-history
  # tab embedded within it. Support role tenant-scoped per Permission Matrix.
  # Read-only invariant: tab renders records but exposes no mutation controls.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0 @e2e-ready
  Scenario Outline: Authorized roles see the read-only audit tab on the entity cockpit (AC-01, AC-02)
    Given I am logged in as <role>
    And an in-tenant <entity_type> "<entity_id>" exists that is within my access scope
    When I navigate to the <entity_type> cockpit for "<entity_id>"
    Then the cockpit page should render the "Audit History" tab
    And the tab should be visible and selectable
    When I select the "Audit History" tab
    Then the tab panel should render a paginated list of audit records for "<entity_id>"
    And each record should show at minimum: timestamp, actionType, actor, entityId
    And no create, edit, delete, or unmask control should be present on the tab

    Examples:
      | role               | entity_type | entity_id   |
      | System Admin       | Contract    | CTR-100001  |
      | Auditor            | Financing   | FIN-100001  |
      | Front Office       | Partner     | PRT-100001  |
      | Back Office        | Document    | DOC-100001  |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # Scope-positive path for FO and BO/Risk: opening the cockpit for an entity
  # within the caller's operational scope yields scoped records only. This is
  # the paired positive case for the AC-05 negative (Blocked pending Epic 30
  # scope fixture).
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0
  Scenario Outline: FO and BO users see scoped audit history for entities within their operational scope (AC-02)
    Given I am logged in as <role>
    And <entity_type> "<entity_id>" is within my operational scope
    And the audit store contains at least 3 records for "<entity_id>"
    When I open the <entity_type> cockpit for "<entity_id>"
    And I select the "Audit History" tab
    Then the tab should list audit records scoped to "<entity_id>" only
    And no record from an out-of-scope entity should appear in the list
    And the total record count should equal the scoped record count for "<entity_id>"

    Examples:
      | role         | entity_type | entity_id   |
      | Front Office | Contract    | CTR-100010  |
      | Back Office  | Financing   | FIN-100010  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Role-aware field masking (per US 26.05) applies inside the cockpit tab.
  # FO and BO see masked values for sensitive fields (e.g. KYC identifiers,
  # personal data references) and have NO unmasking control available from
  # the cockpit tab. System/Power User and Auditor see unmasked values per
  # Permission Matrix.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0
  Scenario Outline: Sensitive fields are masked in the cockpit audit tab per role (AC-03)
    Given I am logged in as <role>
    And Partner "PRT-100050" is within my access scope
    And the audit record set for "PRT-100050" includes at least one sensitive-field change (KYC identifier)
    When I open the Partner cockpit for "PRT-100050"
    And I select the "Audit History" tab
    Then sensitive fields in the audit-record oldValue and newValue payloads should be <masking_state>
    And <unmask_control>

    Examples:
      | role         | masking_state | unmask_control                                                        |
      | Front Office | masked        | no "Unmask" or "Reveal" control should be present on the cockpit tab  |
      | Back Office  | masked        | no "Unmask" or "Reveal" control should be present on the cockpit tab  |
      | Auditor      | unmasked      | unmasking from cockpit is not the surface for this action (see US 26.05) |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Absolute visibility rule: the audit tab must never be rendered for an LC
  # user, regardless of which cockpit is opened. UI-layer denial covered here;
  # API-layer denial covered separately in AC-06.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario Outline: LC users never see the audit tab on any cockpit (AC-04)
    Given I am logged in as a Leasing Company user
    And <entity_type> "<entity_id>" exists and is reachable in the LC workspace
    When I navigate to the <entity_type> cockpit for "<entity_id>"
    Then the cockpit page should NOT render an "Audit History" tab
    And no element with role="tab" and name="Audit History" should be present in the DOM

    Examples:
      | entity_type | entity_id   |
      | Contract    | CTR-100020  |
      | Financing   | FIN-100020  |
      | Partner     | PRT-100020  |
      | Document    | DOC-100020  |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (AC-AT-A3)
  # API-layer denial for LC tokens: even if an LC caller bypasses the UI and
  # calls the audit endpoint directly, the server MUST return no audit data
  # for any audit endpoint. This is the security-critical companion to AC-04:
  # UI visibility never equals permission.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario Outline: LC tokens receive no audit data from any audit endpoint (AC-06)
    Given I have obtained a valid Leasing Company user session token
    When I send an authenticated GET request with that token to "<endpoint>"
    Then the response status should be <status>
    And the response body should NOT contain any audit-record objects
    And the response body should NOT contain fields named "oldValue" or "newValue"

    Examples:
      | endpoint                                             | status |
      | /audit/entity/Contract/CTR-100030                    | 404    |
      | /audit/entity/Financing/FIN-100030                   | 404    |
      | /audit/entity/Partner/PRT-100030                     | 404    |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Read-only invariant. Permission Matrix explicitly denies mutation to every
  # role including System/Power User and Auditor. Any attempt to invoke a
  # mutation from the cockpit audit-tab surface — via UI, direct API call, or
  # spoofed method — must fail with a 4xx status and MUST NOT alter audit
  # data. Enforces the "audit tables are INSERT-only" epic contract at the
  # entity-tab surface.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @e2e-ready
  Scenario Outline: Cockpit audit tab exposes no mutation affordance and rejects mutation API calls (AC-07)
    Given I am logged in as <role>
    And Contract "CTR-100040" is within my access scope
    When I open the Contract cockpit for "CTR-100040"
    And I select the "Audit History" tab
    Then no "Edit", "Delete", "Create", or "Save" control should be present on the tab
    When I send an authenticated <method> request to "<endpoint>" with a valid audit record ID
    Then the response status should be one of 403, 404, 405
    And the audit store record count for "CTR-100040" should be unchanged

    Examples:
      | role         | method | endpoint                                     |
      | System Admin | POST   | /audit/entity/Contract/CTR-100040            |
      | Auditor      | PUT    | /audit/entity/Contract/CTR-100040/records/1  |
      | Back Office  | DELETE | /audit/entity/Contract/CTR-100040/records/1  |
```
