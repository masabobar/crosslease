# PRD1042-804 — US 11.5 | Framework Agreement | Framework Agreement Suspension

Generated: 2026-07-24
Story: PRD1042-804 — US 11.5 | Framework Agreement | Framework Agreement Suspension
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (18 derived ACs, description present with permission matrix + field specs + edge cases + audit events + security requirements, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 12 of 18 | Blocked: 2 (D-Concurrency-Forge, D-MFA-StepUp) | Excluded: 4 (edge-case, separate-feature, or bundled — scope filter table only)
Figma design: Node 29:3780 (SUSPEND AGREEMENT) on canvas 10:15285, file aQGn5OLEjEGJO7xGzFikP5 — DESIGN-BLIND. MCP quota-exhausted on 2026-07-24; no cached PNG for node 29:3780 in `src/e2e/fixtures/figma-e11/rendered-nodes/` (verified — sibling nodes 24:948 Detail and 100:6629 Edit are cached, but 29:3780 Suspend variant was never exported). Test assertions anchor to the Jira Field Specification table + Validation Rules + System Behavior sections as source of truth. Re-export PNG from Figma when quota resets to verify verbatim modal copy (button labels, justification counter placement, dependency-check inline text, future-dated Effective From warning banner).
Updated per CR PRD1042-22 Reconciliation v10 (2026-07-27): **[CR-PENDING B4]** — dependency-check reference figure contested: v9 uses active-financings volume; Scope Recon v2 proposes current outstanding residual debt. Numeric assertions in AC-10 conflict list remain valid (structural — enumerates blocking Financing IDs + states, not a numeric figure). §6 US 11.5 confirms "dependency checks query real financings (B4), never return empty lists, and never block on the utilisation figure" — the Active-Financings-existence gate is CORRECT and RETAINED; only the utilisation FIGURE is non-gating (utilisation is out of scope for this suspension suite — see 808). **B7/v10 APPLIED** — single-admin suspension confirmed (no Four-Eyes). State model 4 stored values reinforced. **[CR-PENDING B5]** on AC-14/AC-16 5-role Outline pending Philipp Maute's decision.

---

## Design references

| File                                                                      | Content                                                                                                                                                         | Applies to                            |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `src/e2e/fixtures/figma-e11/rendered-nodes/frame-24-948__DETAIL-PAGE.png` | 4 tab variants of the FA Detail page — used ONLY to anchor the entry-point Suspend button visibility (top-right action buttons row: Edit / Suspend / Terminate) | AC-01 (entry point only)              |
| _(design-blind for the Suspend modal itself)_                             | Modal node 29:3780 NOT in fixture bank; MCP + REST quota-exhausted 2026-07-24                                                                                   | AC-02..AC-18 anchor to Jira spec text |

Recommend export of node 29:3780 (SUSPEND AGREEMENT modal) + any dependency-check-blocked variant + future-dated warning variant when Figma quota resets. Until then, verbatim UI copy (button labels, counter text, warning banner) MUST be treated as design-blind — the test scenarios below assert **behavior** and **spec-verbatim** copy (e.g. field labels "Agreement Name", "Justification", "Effective From", "Active Financings Check"), but **do not** assert modal button copy (e.g. "Confirm suspension" vs "Suspend agreement" — both plausible) or exact error banner phrasing.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                                                                                                                | Blocking dependency                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| AC-15 | Requires deterministic race condition — either two Power User (Bank Admin) sessions submitting suspend concurrently (double-suspend), or a Financing state transition to Approved landing between the dependency check and the suspension commit — no harness available to force interleaved requests | D-Concurrency-Forge — optimistic-lock race harness |
| AC-18 | Requires ability to expire the MFA freshness window on demand without re-authenticating from scratch — E2E cannot force a stale MFA session                                                                                                                                                           | D-MFA-StepUp — MFA freshness override endpoint     |

---

## AC Scope Filter

| AC    | Description                                                                                                                                                     | Classification     | Rationale                                                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| AC-01 | Power User (Bank Admin) opens Active FA and clicks Suspend to open the suspension modal                                                                         | `happy-path`       | Entry-point + modal open — core success flow                                                                     |
| AC-02 | Modal shows Agreement Name (read-only summary), Justification (mandatory ≥20 chars), Effective From (optional, defaults now), Active Financings Check (display) | `happy-path`       | Modal render + field pre-fill — bundled into AC-01 happy path                                                    |
| AC-03 | Single Power User (Bank Admin) confirms suspension; FA transitions Active → Suspended immediately; `fa.suspended` audit event emitted                           | `happy-path`       | Core state transition + audit — happy path                                                                       |
| AC-04 | Active Financings Check shows count = 0 (no blocking Financings); Suspend button enabled                                                                        | `happy-path`       | Pre-flight display with no dependencies — bundled into AC-01/AC-03                                               |
| AC-05 | Draft Financings (Draft / Stage 1 / Stage 2) do NOT block suspension; suspension proceeds                                                                       | `happy-path`       | Suspension proceeds despite in-flight Drafts — happy path variant                                                |
| AC-06 | Once Suspended, FA invisible to new Financing assembly (Validation & Gating Engine blocks new-financing-against-Suspended-FA)                                   | `happy-path`       | Downstream gating effect — happy path assertion after suspension                                                 |
| AC-07 | Justification below 20 characters is rejected (client-disable + server 400)                                                                                     | `main-error`       | Client + server validation                                                                                       |
| AC-08 | Whitespace-only justification is rejected (server 400)                                                                                                          | `main-error`       | Validation guardrail — bundled into AC-07 Outline                                                                |
| AC-09 | Effective From in the past is rejected (must be ≥ now UTC)                                                                                                      | `main-error`       | Validation guardrail                                                                                             |
| AC-10 | Suspension blocked if any Active / Disbursing / Approved Financings reference this FA — HTTP 409 with structured conflict list                                  | `main-error`       | Cross-epic dependency check — CRITICAL business rule                                                             |
| AC-11 | Suspension on Draft-state FA returns HTTP 409 (invalid lifecycle state)                                                                                         | `main-error`       | State-gate: Draft FAs cannot be suspended                                                                        |
| AC-12 | Suspension on already-Suspended FA returns HTTP 409 (invalid lifecycle state / already suspended)                                                               | `main-error`       | State-gate: bundled with concurrent-suspension AC-15 (second attempt) — kept as its own idempotency scenario     |
| AC-13 | Suspension on Terminated FA returns HTTP 409 (invalid lifecycle state / immutable terminal state)                                                               | `main-error`       | State-gate: Terminated FAs cannot be suspended                                                                   |
| AC-14 | Non-Power-User (Bank Admin) role Suspend returns HTTP 404 — LC/Front Office/Back Office/Support/Auditor all denied                                              | `main-error`       | Role-based access domain rule — 404-not-403                                                                      |
| AC-15 | Concurrent suspension by two Power User (Bank Admin) sessions — second returns 409 "Already Suspended" OR race with Approved Financing → 409                    | `Blocked`          | D-Concurrency-Forge — no way to force interleaved concurrent PATCH deterministically                             |
| AC-16 | LC user cross-LC Suspend returns HTTP 404 (tenant isolation)                                                                                                    | `main-error`       | Bundled into AC-14 role Outline as an additional row (LC user is a role gate + tenant gate concurrently)         |
| AC-17 | `FA_SUSPENSION_BLOCKED` informational audit event emitted on rejected attempts (409 responses)                                                                  | `separate-feature` | Audit event assertion belongs to Epic 26 audit event schema tests (US 26.x); functional 409 covered by AC-10..13 |
| AC-18 | MFA-validated session required for POST /suspend — stale MFA → step-up prompt                                                                                   | `Blocked`          | D-MFA-StepUp — no way to expire MFA freshness on demand in E2E                                                   |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-16
**Blocked (no Gherkin):** AC-15, AC-18
**No Gherkin (edge-case or separate-feature):** AC-17 (Epic 26 audit-event-fanout), AC-02/AC-04 (bundled into AC-01 happy path)

---

## Scenarios summary

| Tag           | Scenario                                                                                     | AC                  | Priority | E2E                               |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------- | -------- | --------------------------------- |
| `@happy-path` | Power User (Bank Admin) opens Suspend modal from Active FA with no blocking Financings       | AC-01, AC-02, AC-04 | P0       | ⚙️ needs D-MFA-StepUp             |
| `@happy-path` | Power User (Bank Admin) confirms suspension; FA transitions Active → Suspended + audit event | AC-03               | P0       | ⚙️ needs D-MFA-StepUp             |
| `@happy-path` | Suspension proceeds with in-flight Draft Financings (Drafts are not blockers)                | AC-05               | P0       | ✅                                |
| `@happy-path` | After suspension, new Financing assembly against this FA is blocked by Validation & Gating   | AC-06               | P0       | ⚙️ needs seeded Suspended fixture |
| `@main-error` | Justification below 20 characters and whitespace-only justification are rejected (Outline)   | AC-07, AC-08        | P0       | ✅                                |
| `@main-error` | Effective From in the past is rejected                                                       | AC-09               | P0       | ✅                                |
| `@main-error` | Suspend with Active/Disbursing/Approved Financings returns 409 + conflict list (Outline)     | AC-10               | P0       | ✅                                |
| `@main-error` | Suspend on Draft-state FA returns 409                                                        | AC-11               | P0       | ✅                                |
| `@main-error` | Suspend on already-Suspended FA returns 409                                                  | AC-12               | P0       | ✅                                |
| `@main-error` | Suspend on Terminated FA returns 409                                                         | AC-13               | P0       | ✅                                |
| `@main-error` | Non-Power-User (Bank Admin) role Suspend returns 404 (Outline — 5 roles + LC cross-LC)       | AC-14, AC-16        | P0       | ⚙️ needs D20                      |

Active scenario blocks: 11 (3 Outlines + 8 Scenarios)
E2E automation candidates: 7 of 11 scenarios ✅

---

## Design specification (source of truth)

Framework Agreement Suspension as specified in the Jira ticket (Field Specification, Validation Rules, System Behavior, Security Requirements, Edge Cases). Scenarios below anchor to this specification. **Where the design (Figma node 29:3780) would show verbatim UI copy for modal buttons / warning banners / inline dependency-check text, these are marked design-blind and NOT asserted verbatim** — behavior + spec-verbatim field labels are asserted instead.

**Entry point:** top-right `Suspend` button on the FA Detail page (verified visible in cached frame `24:948` for Power User (Bank Admin) on Active FAs). Clicking opens the Suspension modal (node 29:3780 — not in fixture bank).

**Suspension modal — field spec (verbatim from Jira Field Specification table):**

| Field                     | Type      | M/O/C | Validation / Business Rules                                                                                                                                                     |
| ------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Agreement Name`          | Text      | M     | Read-only summary                                                                                                                                                               |
| `Justification`           | Long text | M     | Min 20 characters. Whitespace-only rejected. Recorded in audit event. Visible to Power User (Bank Admin), Back Office / Risk, Auditor                                           |
| `Effective From`          | DateTime  | O     | Defaults to current timestamp. Future-dated suspension permitted with explicit warning. Must be ≥ now (UTC)                                                                     |
| `Active Financings Check` | Display   | M     | Modal shows count of Active / Disbursing / Approved Financings referencing this FA. If non-zero, suspension button is disabled and the blocking-Financings list is shown inline |

**State-machine invariants:**

- FA must be in `Active` state to be suspended. `Draft` / `Suspended` / `Terminated` all reject with HTTP 409.
- Successful suspension transitions FA `Active` → `Suspended` immediately (single Power User (Bank Admin) confirmation for November 2026 — Four-Eyes deferred per `[OPEN QUESTION]` in Jira).
- Suspension is reversible via Reactivation (US 11.06) while the validity window is still open AND the LC is still Active.
- Draft / Stage 1 / Stage 2 / Completed / Terminated Financings **do NOT** block suspension.
- Active / Disbursing / Approved (pre-disbursement) Financings **do** block suspension.

**Dependency-check API (pre-flight):**

- `GET /api/framework-agreements/{id}/suspension-readiness` — returns active Financing count + blocking list.
- Server-authoritative check uses serializable read of Financing state.
- Client-side check is informational only — final decision at POST time.

**Suspension API:**

- `POST /api/framework-agreements/{id}/suspend` with body `{ justification, effectiveFrom }`.
- Requires Power User (Bank Admin) role — all other roles → HTTP 404 (tenant/role isolation, not 403).
- Requires MFA-validated session — stale MFA → step-up prompt.

**Audit events:**

- `fa.suspended` (also `FA_SUSPENDED`) — emitted on successful suspension. Payload includes: `faId`, `tenantId`, `actor`, `justification`, `effectiveFrom`, `dependencyCheckSnapshot`, `timestamp`.
- `FA_SUSPENSION_BLOCKED` — informational, emitted on rejected suspension attempts (409). Payload: `faId`, `actor`, blocking Financing list, `timestamp`.

**Event fan-out (`fa.suspended`):**

- Validation & Gating Engine — receives block-new-financing-assembly signal.
- Notification Center event-bus — emits to Power User (Bank Admin) and Back Office / Risk roles (per NC-US-N1).

**Security:**

- Justification field is sensitive: NOT exposed to LC users or Support roles in any API response body (masked or omitted).

---

## Feature file

```gherkin
@framework-agreement @us-11.5 @p0
Feature: Framework Agreement Suspension (US 11.5 — PRD1042-804)
  As a Power User (Bank Admin)
  I want to suspend an Active Framework Agreement that has no active Financings
  So that no new Financings can be created against it during a pause-for-review period while preserving the agreement structure for potential reactivation

  Background:
    Given the RefiNext platform is up and healthy
    And a Framework Agreement "FA-Active-001" (agreement name "RV-SSKM-2026-001", ID "FA-2026-00041") exists in Active state bound to Leasing Company "New Group Trade" (Bank entity "Sparkasse", Tenant ID "TNT-00042")
    And "FA-Active-001" has Max volume "€ 25.000.000,00", version counter 5
    And "FA-Active-001" validity window is Valid from "13 Jun 2026", Valid until "Open ended"
    And the Leasing Company "New Group Trade" is in Active state

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-04
  # Power User (Bank Admin) opens Suspend modal from the FA detail page for an
  # Active FA with zero blocking Financings. Modal renders the four spec fields.
  # Suspend button is enabled because the dependency check shows count = 0.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-04 @p0
  Scenario: Power User (Bank Admin) opens Suspend modal from Active FA with no blocking Financings (AC-01, AC-02, AC-04)
    Given "FA-Active-001" has 0 linked Financings in Active, Disbursing, or Approved state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Active-001" detail page
    When I click the top-right "Suspend" button
    Then a Suspension modal should open
    And the modal should display the "Agreement Name" field with value "RV-SSKM-2026-001" as read-only
    And the modal should display a "Justification" long-text field (mandatory, min 20 characters)
    And the modal should display an "Effective From" datetime field prefilled to the current timestamp (optional)
    And the modal should display an "Active Financings Check" section showing "0" Active/Disbursing/Approved Financings
    And no blocking-Financings inline list should be present
    And the modal's confirm-suspension button should be visible
    And the modal's confirm-suspension button should be disabled until a valid Justification (≥ 20 characters, not whitespace-only) is entered

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # Power User (Bank Admin) confirms suspension. FA transitions Active → Suspended
  # immediately (single-actor for November 2026 — Four-Eyes deferred).
  # fa.suspended audit event emitted with actor, justification, effectiveFrom,
  # and dependencyCheckSnapshot.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario: Power User (Bank Admin) confirms suspension; FA transitions Active → Suspended with audit event (AC-03)
    Given "FA-Active-001" has 0 linked Financings in Active, Disbursing, or Approved state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have opened the Suspension modal for "FA-Active-001"
    When I enter Justification "Suspension pending Q3 creditworthiness re-review per Risk committee 2026-07-24 minutes."
    And I leave Effective From at the default (current timestamp)
    And I click the confirm-suspension button
    Then a POST request to "/api/framework-agreements/FA-Active-001/suspend" should be issued with body containing the justification and effectiveFrom
    And the HTTP response status should be 200
    And the FA lifecycle status should transition from "Active" to "Suspended"
    And on the FA detail page, the lifecycle status badge should read "Suspended"
    And a single "fa.suspended" audit event should be emitted with payload including faId "FA-2026-00041", tenantId "TNT-00042", actor (current Power User), the entered justification, the effectiveFrom timestamp, and a dependencyCheckSnapshot showing 0 blocking Financings
    And the FA version counter should have advanced from 5 to 6

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Draft / Stage 1 / Stage 2 Financings are NOT blockers. Suspension proceeds
  # even when in-flight Drafts exist. Drafts can still be edited afterwards but
  # cannot progress to Approved while the FA is Suspended (Validation & Gating).
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0 @e2e-ready
  Scenario: Suspension proceeds with in-flight Draft Financings (AC-05)
    Given "FA-Active-001" has 0 linked Financings in Active, Disbursing, or Approved state
    And "FA-Active-001" has 2 linked Financings in Draft state and 1 in Stage 2 state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have opened the Suspension modal for "FA-Active-001"
    Then the "Active Financings Check" section should show "0" Active/Disbursing/Approved Financings (Drafts and Stage 2 are excluded from the blocking count)
    And no blocking-Financings inline list should be present
    When I enter Justification "Suspension for governance review; drafts unaffected per policy."
    And I click the confirm-suspension button
    Then the HTTP response status should be 200
    And the FA lifecycle status should transition from "Active" to "Suspended"
    And the 3 Draft/Stage 2 Financings should remain in their current lifecycle states (unchanged by suspension)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # Once Suspended, the FA is invisible to new Financing assembly.
  # The Validation & Gating Engine consumes the Suspended state and blocks
  # any attempt to create or promote a Financing against this FA.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0
  Scenario: After suspension, new Financing assembly against this FA is blocked (AC-06)
    Given "FA-Active-001" was successfully suspended and is now in "Suspended" state
    And I am logged in as Front Office user bound to "New Group Trade"
    When I attempt to start a new Financing assembly and select a Framework Agreement
    Then "RV-SSKM-2026-001" should NOT appear in the list of available Framework Agreements
    When I attempt to POST "/api/financings" with body referencing "FA-2026-00041"
    Then the HTTP response status should be 409
    And the response body should indicate the Framework Agreement is in an ineligible lifecycle state ("Suspended")
    And no Financing record should be created

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07, AC-08
  # Justification MUST be at least 20 characters AND MUST NOT be whitespace-only.
  # Client should disable the confirm-suspension button. Server rejects with 400
  # if the client is bypassed. (Verbatim spec: "Min 20 characters. Whitespace-
  # only rejected.")
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @ac-08 @p0 @e2e-ready
  Scenario Outline: Justification below 20 characters or whitespace-only is rejected (AC-07, AC-08)
    Given "FA-Active-001" has 0 linked Financings in Active, Disbursing, or Approved state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have opened the Suspension modal for "FA-Active-001"
    When I enter Justification <justification_value>
    Then the confirm-suspension button should be disabled
    When I bypass the client and POST "/api/framework-agreements/FA-Active-001/suspend" with body {"justification": <justification_value>, "effectiveFrom": null}
    Then the HTTP response status should be 400
    And the response body should reference the justification-length or whitespace-only rule
    And "FA-Active-001" should remain in "Active" state

    Examples:
      | justification_value                        |
      | "Too short"                                |
      | "Suspend."                                 |
      | "                    "                     |
      | "\t\n   \n\t   "                           |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09
  # Effective From MUST be ≥ now (UTC). Past-dated Effective From is rejected.
  # Future-dated is PERMITTED (with an explicit warning per spec — warning copy
  # design-blind, not asserted verbatim here).
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0 @e2e-ready
  Scenario: Effective From in the past is rejected (AC-09)
    Given "FA-Active-001" has 0 linked Financings in Active, Disbursing, or Approved state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have opened the Suspension modal for "FA-Active-001"
    When I set Effective From to a timestamp 1 hour in the past
    And I enter Justification "Retroactive suspension attempt; should be rejected by validation."
    And I click the confirm-suspension button
    Then the HTTP response status should be 400
    And the response body should reference the "Effective From must be >= now (UTC)" rule
    And "FA-Active-001" should remain in "Active" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Suspension is BLOCKED when any Active / Disbursing / Approved Financing
  # references this FA. The server performs a serializable-read dependency
  # check; response is HTTP 409 with a structured conflict list containing
  # the blocking Financing IDs + states. FA_SUSPENSION_BLOCKED informational
  # audit event is emitted (assertion covered in Epic 26 tests, not here).
  # ---------------------------------------------------------------------------

  # [CR-PENDING B4] — v10 §7 pending decision: the dependency check queries
  # real financings (§6 confirmed), but the SOURCE OF TRUTH for the reference
  # figure is contested (active-financings volume vs current outstanding
  # residual debt). Structural assertions (blocking Financing IDs + states +
  # 409 conflict list) are UNAFFECTED and remain @e2e-ready. Do NOT introduce
  # numeric utilisation-figure assertions here — those live on 808.

  @main-error @ac-10 @p0 @e2e-ready @cr-pending-b4
  Scenario Outline: Suspend with Active/Disbursing/Approved Financings returns 409 + conflict list (AC-10)
    Given "FA-Active-001" has a Financing "<blocking_financing_id>" in <blocking_state> state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I have opened the Suspension modal for "FA-Active-001"
    Then the "Active Financings Check" section should show "1" Active/Disbursing/Approved Financing
    And a blocking-Financings inline list should be present containing "<blocking_financing_id>" with state "<blocking_state>"
    And the confirm-suspension button should be disabled
    When I bypass the client and POST "/api/framework-agreements/FA-Active-001/suspend" with body {"justification": "Attempt to suspend despite blocking Financing per manual test.", "effectiveFrom": null}
    Then the HTTP response status should be 409
    And the response body should include a conflict list containing "<blocking_financing_id>" with state "<blocking_state>"
    And "FA-Active-001" should remain in "Active" state

    Examples:
      | blocking_financing_id | blocking_state |
      | FIN-Active-001        | Active         |
      | FIN-Disbursing-001    | Disbursing     |
      | FIN-Approved-001      | Approved       |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # Suspension is only valid from Active. Draft FA suspend attempt → 409.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0 @e2e-ready
  Scenario: Suspend on Draft-state FA returns 409 (AC-11)
    Given a Framework Agreement "FA-Draft-001" exists in Draft state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I attempt to POST "/api/framework-agreements/FA-Draft-001/suspend" with body {"justification": "Attempt to suspend a Draft FA for negative test coverage.", "effectiveFrom": null}
    Then the HTTP response status should be 409
    And the response body should reference the incorrect lifecycle state ("Draft" — only Active can be suspended)
    And "FA-Draft-001" should remain in "Draft" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # Suspending an already-Suspended FA is idempotent-rejected — the server
  # returns 409 "Already Suspended" / invalid state transition. This is the
  # sequential (non-concurrent) case; the concurrent case (AC-15) requires
  # D-Concurrency-Forge and is Blocked.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0 @e2e-ready
  Scenario: Suspend on already-Suspended FA returns 409 (AC-12)
    Given a Framework Agreement "FA-Suspended-001" exists in Suspended state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I attempt to POST "/api/framework-agreements/FA-Suspended-001/suspend" with body {"justification": "Attempt to suspend an already-Suspended FA for negative test coverage.", "effectiveFrom": null}
    Then the HTTP response status should be 409
    And the response body should indicate the FA is already suspended (or reference "already suspended" / invalid state transition)
    And "FA-Suspended-001" should remain in "Suspended" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Terminated FAs are immutable — suspend attempt returns 409.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0 @e2e-ready
  Scenario: Suspend on Terminated FA returns 409 (AC-13)
    Given a Framework Agreement "FA-Terminated-001" exists in Terminated state
    And I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    When I attempt to POST "/api/framework-agreements/FA-Terminated-001/suspend" with body {"justification": "Attempt to suspend a Terminated FA for negative test coverage.", "effectiveFrom": null}
    Then the HTTP response status should be 409
    And the response body should indicate the FA is in an immutable terminal state ("Terminated")
    And "FA-Terminated-001" should remain in "Terminated" state

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-14, AC-16
  # Role-based access (RefiNext domain rule): only Power User (Bank Admin) may
  # suspend. All other roles → HTTP 404 (not 403). LC user cross-LC access is
  # also 404 (tenant isolation applied at the same time as role gate).
  # Justification field MUST NOT be exposed in the 404 response body.
  # ---------------------------------------------------------------------------

  # [CR-PENDING B5] — CR PRD1042-22 v10 §5 flags 4 contested permission-matrix
  # cells. Current 5-role 404 Outline retained pending Philipp Maute decision.

  @main-error @ac-14 @ac-16 @p0 @cr-pending-b5
  Scenario Outline: Non-Power-User (Bank Admin) role Suspend returns 404 (AC-14, AC-16)
    Given <precondition>
    And I am logged in as <role> <scope>
    When I attempt to POST "<target_endpoint>" with a valid governed-suspend body
    Then the HTTP response status should be 404
    And the response body should NOT include the string "403" or "Forbidden"
    And the response body should NOT include the justification text
    And the target Framework Agreement should remain in its current lifecycle state (unchanged)

    Examples:
      | role         | scope                        | target_endpoint                                                | precondition                                                                     |
      | Front Office |                              | /api/framework-agreements/FA-Active-001/suspend                | (no additional precondition)                                                     |
      | Back Office  |                              | /api/framework-agreements/FA-Active-001/suspend                | (no additional precondition)                                                     |
      | LC User      | bound to "New Group Trade"   | /api/framework-agreements/FA-Active-001/suspend                | (no additional precondition)                                                     |
      | Support      |                              | /api/framework-agreements/FA-Active-001/suspend                | (no additional precondition)                                                     |
      | Auditor      |                              | /api/framework-agreements/FA-Active-001/suspend                | (no additional precondition)                                                     |
      | LC User      | bound to "New Group Trade"   | /api/framework-agreements/FA-Beta-001/suspend                  | a Framework Agreement "FA-Beta-001" exists bound to "Beta Leasing GmbH" in Active state |
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
