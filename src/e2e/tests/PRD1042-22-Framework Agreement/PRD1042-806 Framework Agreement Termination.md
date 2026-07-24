# PRD1042-806 — US 11.7 | Framework Agreement | Framework Agreement Termination

Generated: 2026-07-24
Story: PRD1042-806 — US 11.7 | Framework Agreement | Framework Agreement Termination
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (13 derived ACs, description present with permission matrix + termination modal field spec + edge-case table, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 10 of 13 | Blocked: 2 (D-Concurrency-Forge AC-11, D-MFA-StepUp AC-13) | Excluded: 1 (separate-feature — scope filter table only)
Figma design: Node 29:3780 (SUSPEND / REACTIVATE / TERMINATE canvas) on file aQGn5OLEjEGJO7xGzFikP5 — Stage 2 FAILED (MCP quota exhausted, REST /v1/files quota exhausted, no cached PNG fixture in `rendered-nodes/` for node 29:3780 or its parent page, WebFetch cannot pass X-Figma-Token, no shell available). Design-blind, spec-anchored per user directive; verbatim modal copy remains an OPEN design gap logged below.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                              | Blocking dependency                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| AC-11 | Requires deterministic race between two Power User (Bank Admin) sessions where a new blocking Financing is created between the readiness check and the terminate commit — no test harness to force interleaved POST | D-Concurrency-Forge — optimistic-lock race harness |
| AC-13 | Requires ability to expire the MFA freshness window on demand without re-authenticating from scratch to prove that a stale-MFA POST /terminate is rejected                                                          | D-MFA-StepUp — MFA freshness override endpoint     |

---

## AC Scope Filter

| AC    | Description                                                                                                                                                                              | Classification     | Rationale                                                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Power User (Bank Admin) opens Active or Suspended FA and clicks Terminate; termination modal opens with mandatory justification + irreversibility confirmation + Active Financings count | `happy-path`       | Core success flow — modal open + terminate submit with clean pre-flight (Active Financings = 0)                                                                            |
| AC-02 | Termination requires mandatory justification (≥30 chars) and explicit irreversibility confirmation checkbox                                                                              | `main-error`       | Client + server validation of justification length + checkbox                                                                                                              |
| AC-03 | Termination blocked with HTTP 409 when active Financings reference the agreement; conflict list of blocking Financing IDs + states returned                                              | `main-error`       | Pre-flight and server-side dependency guard                                                                                                                                |
| AC-04 | On confirmation, FA transitions to Terminated (single Power User (Bank Admin) action for November — no Four-Eyes)                                                                        | `happy-path`       | Bundled into AC-01 happy path assertion (status advances to Terminated)                                                                                                    |
| AC-05 | Terminated is a terminal state — no transition back to Active or Suspended; re-terminate returns HTTP 409                                                                                | `main-error`       | Terminal-state gate: re-terminate + Suspend/Reactivate on Terminated all rejected                                                                                          |
| AC-06 | Termination on Draft FA rejected with HTTP 409 (Draft uses US 11.01 hard-delete instead)                                                                                                 | `main-error`       | State-gate: POST /terminate rejects Draft                                                                                                                                  |
| AC-07 | POST /api/framework-agreements/{id}/terminate requires Power User (Bank Admin) role; other roles get HTTP 404                                                                            | `main-error`       | Role-based access domain rule — 404-not-403                                                                                                                                |
| AC-08 | LC user cross-LC POST /terminate returns HTTP 404 (tenant isolation)                                                                                                                     | `main-error`       | Bundled into AC-07 role Outline as an additional row (LC user is a role gate + tenant gate concurrently)                                                                   |
| AC-09 | Termination while Limit Breach Flag is set is permitted; the flag becomes historical evidence on the Terminated agreement                                                                | `happy-path`       | Governed edge case — proves the Limit Breach Flag does NOT block termination (unlike active Financings)                                                                    |
| AC-10 | GET /api/framework-agreements/{id}/termination-readiness pre-flight check returns active Financing count; termination button disabled when count > 0                                     | `happy-path`       | Pre-flight readiness endpoint + button state — bundled into AC-01 (clean path shows count = 0 + button enabled) and AC-03 (blocked path shows count > 0 + button disabled) |
| AC-11 | Race condition: new Financing created between dependency check and termination commit → optimistic-lock detects state change; termination rejected with retry                            | `Blocked`          | D-Concurrency-Forge — no way to force deterministic interleaved POST                                                                                                       |
| AC-12 | Terminated FA visible in historical reporting; Limit Management retains historical utilization record                                                                                    | `happy-path`       | Post-termination read invariants — Terminated FA remains queryable and shows retained utilization audit                                                                    |
| AC-13 | MFA-validated session required for POST /terminate; stale MFA blocks termination                                                                                                         | `Blocked`          | D-MFA-StepUp — no way to expire MFA freshness on demand in E2E                                                                                                             |
| AC-14 | fa.terminated event emitted to Validation & Gating Engine, Limit Management, Notification Center; audit event FA_TERMINATED persisted with dependency-check snapshot                     | `separate-feature` | Event-bus fan-out + audit-payload validation belongs to Epic 26 audit + notification integration tests                                                                     |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-12
**Blocked (no Gherkin):** AC-11, AC-13
**No Gherkin (edge-case or separate-feature):** AC-14 (Epic 26), AC-04/AC-10 (bundled into AC-01 / AC-03)

---

## Scenarios summary

| Tag           | Scenario                                                                                       | AC                  | Priority | E2E                              |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------- | -------- | -------------------------------- |
| `@happy-path` | Power User (Bank Admin) terminates Active FA with clean pre-flight (no blocking Financings)    | AC-01, AC-04, AC-10 | P0       | ⚙️ needs D-MFA-StepUp            |
| `@happy-path` | Power User (Bank Admin) terminates Suspended FA with clean pre-flight                          | AC-01, AC-04        | P0       | ⚙️ needs D-MFA-StepUp            |
| `@happy-path` | Termination proceeds when Limit Breach Flag is set (flag becomes historical evidence)          | AC-09               | P0       | ⚙️ needs D-MFA-StepUp            |
| `@happy-path` | Terminated FA remains queryable in historical reporting with retained utilization record       | AC-12               | P0       | ✅                               |
| `@main-error` | Termination with justification < 30 characters or unchecked irreversibility box is rejected    | AC-02               | P0       | ✅                               |
| `@main-error` | Termination on FA with active Financings returns 409 with conflict list; button disabled in UI | AC-03, AC-10        | P0       | ⚙️ needs seeded active Financing |
| `@main-error` | Termination on Terminated FA returns 409 (terminal state)                                      | AC-05               | P0       | ✅                               |
| `@main-error` | Suspend / Reactivate on Terminated FA returns 409 (no transition back)                         | AC-05               | P0       | ✅                               |
| `@main-error` | Termination on Draft FA returns 409 (Draft uses hard-delete instead)                           | AC-06               | P0       | ✅                               |
| `@main-error` | Non-Power-User (Bank Admin) role POST /terminate returns 404 (Outline — 5 roles + LC cross-LC) | AC-07, AC-08        | P0       | ⚙️ needs D20                     |

Active scenario blocks: 10 (1 Outline + 9 Scenarios)
E2E automation candidates: 4 of 10 scenarios ✅

---

## Design specification (source of truth)

**Stage 2 DESIGN-BLIND.** Node 29:3780 is the SUSPEND / REACTIVATE / TERMINATE canvas within file `aQGn5OLEjEGJO7xGzFikP5`. Prior Epic 11 batch memory ([[project-prd1042-22-framework-agreement]]) confirmed this canvas exists and contains a TERMINATE section, but no PNG fixture was exported to `src/e2e/fixtures/figma-e11/rendered-nodes/` for node 29:3780 or any of its child sections. MCP tools are quota-exhausted (Professional plan seat limit) and REST `/v1/files` returned 429 with a multi-day `Retry-After` in the last session on the same token; `WebFetch` cannot pass the `X-Figma-Token` header; no shell is available to run `curl`.

Scenarios below are anchored to the **Jira story spec** (verbatim from ticket description) rather than design copy. Where verbatim modal copy would ordinarily anchor UI assertions (e.g., "Terminate agreement", justification textarea helper text, irreversibility confirmation label), assertions are described in **behavioural** terms — modal presence, field kind + validation, submit gating — and left open for a copy-pass update once the design fixture is exported. This does not block scenario execution against the running application: assertions match the spec's field contract; only the display copy will need verbatim tightening.

**Spec anchors (verbatim from Jira description):**

| Anchor                               | Verbatim wording                                                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry point                          | "Power User (Bank Admin) opens an Active or Suspended Framework Agreement and clicks Terminate."                                                                                          |
| Modal — Justification                | "Long text — Mandatory — Min 30 characters. Recorded in audit event."                                                                                                                     |
| Modal — Irreversibility Confirmation | "Checkbox — Mandatory — Power User (Bank Admin) confirms understanding that termination cannot be undone."                                                                                |
| Modal — Active Financings Check      | "Display — Mandatory — Modal shows count of active Financings referencing this FA. If non-zero, termination button is disabled."                                                          |
| Terminal state                       | "Terminated is a terminal state. No transition back to Active or Suspended is possible. Reopening requires creating a new Framework Agreement."                                           |
| Draft rejection                      | "Draft FAs are hard-deleted (US 11.01), not terminated."                                                                                                                                  |
| No re-terminate                      | "Terminated FAs cannot be re-terminated."                                                                                                                                                 |
| Active-Financings dependency         | "No Financings referencing this FA may be in Active, Disbursing, or Approved (pre-disbursement) state. Completed and Terminated Financings do not block termination."                     |
| Server dependency check              | "Server performs active-financing dependency check before accepting termination. If active Financings exist, HTTP 409 with structured conflict list (Financing IDs, states) is returned." |
| Race protection                      | "Dependency check uses a serializable read of Financing state to avoid race conditions."                                                                                                  |
| Limit Breach Flag                    | "Termination while Limit Breach Flag is set — Permitted; flag becomes historical evidence on the Terminated agreement."                                                                   |
| Post-terminate reporting             | "Limit Management retains the historical utilization record; the agreement appears in historical reporting as Terminated."                                                                |
| RBAC                                 | "POST /api/framework-agreements/{id}/terminate requires Power User (Bank Admin) role."                                                                                                    |
| MFA                                  | "MFA-validated session required."                                                                                                                                                         |

**Endpoints:**

- `POST /api/framework-agreements/{id}/terminate` — body `{ justification, irreversibilityConfirmed }`
- `GET /api/framework-agreements/{id}/termination-readiness` — pre-flight, returns active Financing count

**Audit events emitted:**

- `FA_TERMINATED` — `{ faId, tenantId, actor, justification, terminatedAt, dependencyCheckSnapshot }`
- `FA_TERMINATION_BLOCKED` — `{ faId, actor, blockingFinancings[], timestamp }` (only for blocked attempts on Active FA, per spec)

**Consistency with prior Epic 11 stories:** interaction shape mirrors PRD1042-809 (Edit) and PRD1042-808 (Suspend) — a governed modal/wizard triggered from the FA Detail sidebar (Edit | Suspend | Terminate), mandatory ≥30-char justification, terminal-state gates return 409, unauthorized roles return 404-not-403, LC cross-LC returns 404 (tenant isolation).

---

## Feature file

```gherkin
@framework-agreement @us-11.7 @p0
Feature: Framework Agreement Termination (US 11.7 — PRD1042-806)
  As a Power User (Bank Admin)
  I want to terminate an Active or Suspended Framework Agreement
  So that the agreement is permanently closed and no further Financings can ever reference it

  Background:
    Given the RefiNext platform is up and healthy
    And a Framework Agreement "FA-Active-001" (agreement name "RV-SSKM-2026-001", ID "FA-2026-00041") exists in Active state bound to Leasing Company "New Group Trade" (Bank entity "Sparkasse", Tenant ID "TNT-00042")
    And a Framework Agreement "FA-Suspended-001" exists in Suspended state bound to Leasing Company "New Group Trade"
    And a Framework Agreement "FA-Draft-001" exists in Draft state
    And a Framework Agreement "FA-Terminated-001" exists in Terminated state
    And a Framework Agreement "FA-Beta-001" exists in Active state bound to Leasing Company "Beta Leasing GmbH" (Tenant ID "TNT-00099")

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-04, AC-10
  # Power User (Bank Admin) opens an Active FA, clicks Terminate, sees the
  # readiness pre-flight report "0 active Financings", provides a valid
  # justification (≥30 chars), checks the irreversibility box, submits.
  # The FA transitions to Terminated (single-actor for November — no Four-Eyes).
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-04 @ac-10 @p0
  Scenario: Power User (Bank Admin) terminates an Active FA with clean pre-flight (AC-01, AC-04, AC-10)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And no Financing referencing "FA-Active-001" is in Active, Disbursing, or Approved (pre-disbursement) state
    And I am viewing "FA-Active-001" detail
    When I click the "Terminate" action in the FA detail sidebar
    Then a GET request to "/api/framework-agreements/FA-Active-001/termination-readiness" should return HTTP 200 with body indicating 0 active Financings
    And a termination modal should open displaying:
      | Element                   | Property                                                             |
      | Justification textarea    | Mandatory, ≥30-character minimum, helper text referencing audit-trail recording |
      | Irreversibility checkbox  | Mandatory, describes that termination cannot be undone               |
      | Active Financings Check   | Displays "0" or equivalent "No active Financings" state              |
      | Primary submit button     | Labelled "Terminate" (or equivalent verb), enabled                   |
    When I enter Justification "Portfolio consolidation approved by Credit Committee 2026-07-24 minutes." (63 characters)
    And I check the irreversibility confirmation checkbox
    And I click the primary submit button
    Then a POST request to "/api/framework-agreements/FA-Active-001/terminate" should be sent with body {"justification": "Portfolio consolidation approved by Credit Committee 2026-07-24 minutes.", "irreversibilityConfirmed": true}
    And the response status should be 200
    And the FA lifecycle status should now show "Terminated"
    And an audit event "FA_TERMINATED" should be emitted with actor, justification, terminatedAt, and dependencyCheckSnapshot (active Financings = 0)
    And the FA detail sidebar should no longer show the "Terminate" action
    And the FA detail sidebar should no longer show the "Suspend", "Reactivate", or "Edit" actions

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01 (Suspended variant)
  # Termination is permitted from Suspended state as well as Active — both
  # states appear in the entry-point AC ("Power User opens an Active or
  # Suspended Framework Agreement and clicks Terminate").
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-04 @p0
  Scenario: Power User (Bank Admin) terminates a Suspended FA with clean pre-flight (AC-01)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And no Financing referencing "FA-Suspended-001" is in Active, Disbursing, or Approved (pre-disbursement) state
    And I am viewing "FA-Suspended-001" detail
    When I click the "Terminate" action in the FA detail sidebar
    Then a termination modal should open with the Active Financings Check showing 0
    When I enter Justification "Suspension has been in place beyond the review window; agreement is being closed permanently." (100 characters)
    And I check the irreversibility confirmation checkbox
    And I click the primary submit button
    Then the response status should be 200
    And the FA lifecycle status should now show "Terminated"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-09
  # A Limit Breach Flag on the FA does NOT block termination. The flag is
  # preserved on the Terminated record as historical evidence.
  # ---------------------------------------------------------------------------

  @happy-path @ac-09 @p0
  Scenario: Termination proceeds when Limit Breach Flag is set; flag preserved as historical evidence (AC-09)
    Given "FA-Active-001" has Limit Breach Flag = "In breach" (Net exposure exceeds Max volume)
    And no Financing referencing "FA-Active-001" is in Active, Disbursing, or Approved (pre-disbursement) state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Active-001" detail
    When I click the "Terminate" action in the FA detail sidebar
    Then the termination modal should open despite the Limit Breach Flag being set
    And the Active Financings Check should show 0
    And the primary submit button should be enabled
    When I enter Justification "Terminating despite limit breach flag per credit committee override 2026-07-24." (78 characters)
    And I check the irreversibility confirmation checkbox
    And I click the primary submit button
    Then the response status should be 200
    And the FA lifecycle status should now show "Terminated"
    And on the Terminated FA record, the Limit Breach Flag should still read "In breach" as historical evidence

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-12
  # Terminated FAs remain visible in historical reporting and preserve their
  # Limit Management utilization record. This asserts post-terminate read
  # invariants — the record is NOT deleted or archived out of sight.
  # ---------------------------------------------------------------------------

  @happy-path @ac-12 @p0 @e2e-ready
  Scenario: Terminated FA remains queryable in historical reporting with retained utilization record (AC-12)
    Given "FA-Terminated-001" is in Terminated state with a retained utilization record from Limit Management
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I open the Framework Agreements list with the Status filter including "Terminated"
    Then "FA-Terminated-001" should appear in the list with Status "Terminated"
    When I open "FA-Terminated-001" detail
    Then the FA "Utilization" tab should display the historical Net exposure and Utilization percentage recorded at termination time
    And the Utilization tab should carry a "sourced from Limit Management" label or equivalent, indicating the record is retained
    And the FA "Audit / Lifecycle history" tab should include an "FA_TERMINATED" entry with actor, justification, and terminatedAt

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-02
  # Justification must be ≥ 30 characters AND the irreversibility checkbox
  # must be checked. Two mandatory guards. Server rejects if either is missing.
  # ---------------------------------------------------------------------------

  @main-error @ac-02 @p0 @e2e-ready
  Scenario: Termination with justification < 30 characters or unchecked irreversibility box is rejected (AC-02)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Active-001" detail
    And no Financing referencing "FA-Active-001" is in Active, Disbursing, or Approved (pre-disbursement) state
    When I click the "Terminate" action in the FA detail sidebar
    And the termination modal opens
    And I enter Justification "Too short" (9 characters)
    And I check the irreversibility confirmation checkbox
    Then the primary submit button should be disabled OR clicking it should surface a client-side validation error referencing the 30-character minimum
    When I bypass the client and POST "/api/framework-agreements/FA-Active-001/terminate" with body {"justification": "Too short", "irreversibilityConfirmed": true}
    Then the HTTP response status should be 400
    And the response body should reference the justification-length rule ("min 30 characters" or equivalent)
    And "FA-Active-001" should remain in Active state
    When I POST "/api/framework-agreements/FA-Active-001/terminate" with body {"justification": "Portfolio consolidation approved by Credit Committee 2026-07-24 minutes.", "irreversibilityConfirmed": false}
    Then the HTTP response status should be 400
    And the response body should reference the mandatory irreversibility confirmation
    And "FA-Active-001" should remain in Active state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03, AC-10
  # Termination is blocked when any Financing referencing the FA is in
  # Active, Disbursing, or Approved (pre-disbursement) state. Both the
  # pre-flight readiness endpoint AND the terminate endpoint enforce this.
  # UI shows the blocking count and disables the submit button.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @ac-10 @p0
  Scenario: Termination on FA with active Financings returns 409 with conflict list; button disabled in UI (AC-03, AC-10)
    Given Financings "FIN-001" (Active) and "FIN-002" (Disbursing) exist referencing "FA-Active-001"
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Active-001" detail
    When I click the "Terminate" action in the FA detail sidebar
    Then a GET request to "/api/framework-agreements/FA-Active-001/termination-readiness" should return HTTP 200 with body containing an active-Financing count of 2
    And the termination modal should display the Active Financings Check with value 2 (or equivalent list of blocking Financings)
    And the primary submit button should be disabled
    When I bypass the client and POST "/api/framework-agreements/FA-Active-001/terminate" with body {"justification": "Attempt to terminate despite active Financings for testing purposes.", "irreversibilityConfirmed": true}
    Then the HTTP response status should be 409
    And the response body should contain a structured conflict list with entries for "FIN-001" (state "Active") and "FIN-002" (state "Disbursing")
    And an audit event "FA_TERMINATION_BLOCKED" should be emitted with the blocking Financings list
    And "FA-Active-001" should remain in Active state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Terminated is a terminal state. Attempting to terminate a Terminated FA
  # again is rejected with HTTP 409.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @e2e-ready
  Scenario: Termination on Terminated FA returns 409 (AC-05)
    Given "FA-Terminated-001" is in Terminated state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I POST "/api/framework-agreements/FA-Terminated-001/terminate" with body {"justification": "Attempt to re-terminate for regression testing purposes.", "irreversibilityConfirmed": true}
    Then the HTTP response status should be 409
    And the response body should indicate the FA is already in Terminated state (immutable / terminal)
    When I open "FA-Terminated-001" detail
    Then the FA detail sidebar should NOT show a "Terminate" action

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (no back-transition)
  # Terminated FAs cannot be transitioned back to Active or Suspended.
  # Suspend and Reactivate endpoints must both reject the Terminated state.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @e2e-ready
  Scenario Outline: Back-transition from Terminated to Active or Suspended is rejected (AC-05)
    Given "FA-Terminated-001" is in Terminated state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I POST "<endpoint>" with a valid body for that action
    Then the HTTP response status should be 409
    And the response body should indicate that no transition out of Terminated is permitted
    And "FA-Terminated-001" should remain in Terminated state

    Examples:
      | endpoint                                                          |
      | /api/framework-agreements/FA-Terminated-001/suspend               |
      | /api/framework-agreements/FA-Terminated-001/reactivate            |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Termination on Draft FA is rejected — Drafts use hard-delete (US 11.01).
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: Termination on Draft FA returns 409 (AC-06)
    Given "FA-Draft-001" is in Draft state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I POST "/api/framework-agreements/FA-Draft-001/terminate" with body {"justification": "Attempting to terminate a Draft agreement for regression testing.", "irreversibilityConfirmed": true}
    Then the HTTP response status should be 409
    And the response body should indicate the FA is in Draft state and that Draft agreements are hard-deleted via US 11.01 rather than terminated
    When I open "FA-Draft-001" detail
    Then the FA detail sidebar should NOT show a "Terminate" action

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07, AC-08
  # Role-based access (RefiNext domain rule): only Power User (Bank Admin) may
  # POST /terminate. Other roles get HTTP 404 (not 403). LC user cross-LC is
  # also 404 (tenant isolation).
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @ac-08 @p0
  Scenario Outline: Non-Power-User (Bank Admin) role POST /terminate returns 404 (AC-07, AC-08)
    Given <precondition>
    And I am logged in as <role> <scope>
    When I POST "<target_endpoint>" with body {"justification": "Unauthorized termination attempt for RBAC regression coverage.", "irreversibilityConfirmed": true}
    Then the HTTP response status should be 404
    And the response body should NOT include the string "403" or "Forbidden"
    And on the FA detail page (if the role has read access), the "Terminate" action should NOT be visible in the sidebar

    Examples:
      | role         | scope                        | target_endpoint                                                     | precondition                                                             |
      | Front Office |                              | /api/framework-agreements/FA-Active-001/terminate                   | (no additional precondition)                                             |
      | Back Office  |                              | /api/framework-agreements/FA-Active-001/terminate                   | (no additional precondition)                                             |
      | LC User      | bound to "New Group Trade"   | /api/framework-agreements/FA-Active-001/terminate                   | (no additional precondition)                                             |
      | Support      |                              | /api/framework-agreements/FA-Active-001/terminate                   | (no additional precondition)                                             |
      | Auditor      |                              | /api/framework-agreements/FA-Active-001/terminate                   | (no additional precondition)                                             |
      | LC User      | bound to "New Group Trade"   | /api/framework-agreements/FA-Beta-001/terminate                     | "FA-Beta-001" is bound to "Beta Leasing GmbH" (tenant isolation)         |
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
